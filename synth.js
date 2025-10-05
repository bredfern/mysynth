// --- Component: A single sequencer step ---
class SequencerStep extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const template = document.getElementById('sequencer-step-template');
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        this._slider = this.shadowRoot.querySelector('.pitch-slider');
        this._button = this.shadowRoot.querySelector('.step-button');
    }
    connectedCallback() {
        this._button.addEventListener('click', this._onClick.bind(this));
        this._slider.addEventListener('input', this._onSliderInput.bind(this));
    }
    static get observedAttributes() {
        return ['active', 'current', 'has-data', 'note', 'disabled'];
    }
    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case 'note': this._slider.value = newValue; break;
            case 'disabled': this._slider.disabled = this.hasAttribute('disabled'); break;
        }
    }
    _onClick(e) {
        this.dispatchEvent(new CustomEvent('stepclick', {
            bubbles: true, composed: true,
            detail: { shiftKey: e.shiftKey, index: parseInt(this.dataset.index, 10) }
        }));
    }
    _onSliderInput(e) {
        this.dispatchEvent(new CustomEvent('sliderinput', {
            bubbles: true, composed: true,
            detail: { note: parseInt(e.target.value, 10), index: parseInt(this.dataset.index, 10) }
        }));
    }
}
customElements.define('sequencer-step', SequencerStep);

// --- Component: The main step sequencer grid ---
class StepSequencer extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
            <style>
                :host { display: block; }
                .grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(45px, 1fr));
                    gap: 8px;
                    align-items: end;
                }
                @media (max-width: 600px) { .grid { gap: 5px; } }
            </style>
            <div class="grid"></div>
        `;
        this._grid = this.shadowRoot.querySelector('.grid');
    }
    connectedCallback() {
        for (let i = 0; i < 16; i++) {
            const step = document.createElement('sequencer-step');
            step.dataset.index = i;
            this._grid.appendChild(step);
        }
    }
    updateStep(index, data) {
        const step = this._grid.children[index];
        if (!step) return;
        Object.keys(data).forEach(key => {
            const value = data[key];
            if (value === true) step.setAttribute(key, '');
            else if (value === false) step.removeAttribute(key);
            else step.setAttribute(key, value);
        });
    }
}
customElements.define('step-sequencer', StepSequencer);


// --- Audio Logic: A single synthesizer voice ---
class Voice {
    constructor(note, app) {
        this.note = note;
        this.app = app;
        const ac = app.audioContext;
        this.osc = ac.createOscillator();
        this.filter = ac.createBiquadFilter();
        this.vca = ac.createGain();
        this.pitchLFO = ac.createOscillator();
        this.pitchLFOGain = ac.createGain();
        this.cutoffLFO = ac.createOscillator();
        this.cutoffLFOGain = ac.createGain();

        this.pitchLFO.connect(this.pitchLFOGain);
        this.pitchLFOGain.connect(this.osc.detune);
        this.cutoffLFO.connect(this.cutoffLFOGain);
        this.cutoffLFOGain.connect(this.filter.frequency);
        this.osc.connect(this.filter);
        this.filter.connect(this.vca);
        this.vca.connect(app.mainGain);

        this.vca.gain.value = 0;
        this.filter.type = 'lowpass';
        this.osc.start(); this.pitchLFO.start(); this.cutoffLFO.start();
    }

    triggerAttack(params, time, velocity = 127) {
        const ac = this.app.audioContext;
        this.osc.type = params.waveform;
        this.filter.frequency.setTargetAtTime(params.cutoff, time, 0.01);
        this.filter.Q.setTargetAtTime(params.resonance, time, 0.01);
        this.pitchLFO.frequency.setTargetAtTime(params.pitchLfoRate, time, 0.01);
        this.pitchLFOGain.gain.setTargetAtTime(params.pitchLfoDepth, time, 0.01);
        this.cutoffLFO.frequency.setTargetAtTime(params.cutoffLfoRate, time, 0.01);
        this.cutoffLFOGain.gain.setTargetAtTime(params.cutoffLfoDepth, time, 0.01);

        const targetFreq = this.app.getFrequencyForNote(this.note);
        if (params.portamento > 0.005 && this.app.lastNoteFreq > 0) {
            this.osc.frequency.setValueAtTime(this.app.lastNoteFreq, time);
            this.osc.frequency.setTargetAtTime(targetFreq, time, params.portamento / 4);
        } else {
            this.osc.frequency.setValueAtTime(targetFreq, time);
        }
        this.app.lastNoteFreq = targetFreq;

        const normalizedVelocity = velocity / 127.0;
        const { attack, decay, sustain } = params.adsr;
        this.vca.gain.cancelScheduledValues(time);
        this.vca.gain.setValueAtTime(0, time);
        this.vca.gain.linearRampToValueAtTime(normalizedVelocity, time + attack);
        this.vca.gain.linearRampToValueAtTime(sustain * normalizedVelocity, time + attack + decay);
    }

    triggerRelease(time) {
        const { release } = this.app.getGlobalSynthParams().adsr;
        const ac = this.app.audioContext;
        this.vca.gain.cancelScheduledValues(time);
        this.vca.gain.setValueAtTime(this.vca.gain.value, time);
        this.vca.gain.linearRampToValueAtTime(0, time + release);
        setTimeout(() => this.disconnect(), (time + release - ac.currentTime) * 1000 + 50);
        this.app.lastNoteFreq = 0;
    }

    disconnect() {
        try {
            this.osc.stop(); this.pitchLFO.stop(); this.cutoffLFO.stop();
            this.osc.disconnect(); this.filter.disconnect(); this.vca.disconnect();
            this.pitchLFO.disconnect(); this.cutoffLFO.disconnect();
        } catch (e) { /* Already disconnected */ }
    }
}


// --- Component: The main synthesizer application ---
class SynthApp extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const template = document.getElementById('synth-app-template');
        this.shadowRoot.appendChild(template.content.cloneNode(true));

        this.audioContext = null;
        this.mainGain = null;
        this.isPlaying = false;
        this.currentStep = 0;
        this.tempo = 120;
        this.nextStepTime = 0.0;
        this.timerID = null;
        this.baseMidiNote = 60;
        this.baseFrequency = 261.626;
        this.scaleRatios = Array.from({ length: 128 }, (_, i) => Math.pow(2, (i - this.baseMidiNote) / 12));
        this.effects = {};
        this.sequencerData = Array(16).fill(null);
        this.sequencerStepParams = Array(16).fill(null);
        this.activeMidiVoices = new Map();
        this.lastNoteFreq = 0;
    }

    connectedCallback() {
        this.sequencer = this.shadowRoot.querySelector('step-sequencer');
        this.renderSequencerState();
        this.addEventListeners();
        this.initMidi();
    }

    addEventListeners() {
        this.shadowRoot.getElementById('startStopBtn').addEventListener('click', () => this.isPlaying ? this.stopSequencer() : this.startSequencer());
        this.shadowRoot.getElementById('tempo').addEventListener('input', e => {
            this.tempo = parseFloat(e.target.value);
            this.shadowRoot.getElementById('tempoValue').textContent = this.tempo;
        });
        this.shadowRoot.getElementById('saveSong').addEventListener('click', () => this.saveSong());
        this.shadowRoot.getElementById('loadSong').addEventListener('click', () => this.shadowRoot.getElementById('loadSongInput').click());
        this.shadowRoot.getElementById('loadSongInput').addEventListener('change', e => this.handleFileLoad(e, this.loadSong.bind(this)));
        this.shadowRoot.getElementById('loadScl').addEventListener('click', () => this.shadowRoot.getElementById('tuningFile').click());
        this.shadowRoot.getElementById('tuningFile').addEventListener('change', e => this.handleFileLoad(e, this.parseScl.bind(this), e.target.files[0].name));
        this.shadowRoot.getElementById('exportWav').addEventListener('click', () => this.exportWav());

        this.shadowRoot.getElementById('master-volume').addEventListener('input', e => {
            if (this.mainGain) this.mainGain.gain.value = parseFloat(e.target.value);
        });

        this.sequencer.addEventListener('stepclick', e => {
            const index = e.detail.index;
            const stepComponent = this.sequencer.shadowRoot.querySelector(`sequencer-step[data-index='${index}']`);
            if (e.detail.shiftKey) {
                this.sequencerStepParams[index] = this.sequencerStepParams[index] ? null : this.getGlobalSynthParams();
            } else {
                this.sequencerData[index] = this.sequencerData[index] === null ? parseInt(stepComponent.getAttribute('note') || 60, 10) : null;
            }
            this.renderSequencerState();
        });

        this.sequencer.addEventListener('sliderinput', e => {
            if (this.sequencerData[e.detail.index] !== null) this.sequencerData[e.detail.index] = e.detail.note;
        });

        this.shadowRoot.querySelectorAll('.control-group input, .control-group select').forEach(el => {
            el.addEventListener('input', e => {
                if (!this.audioContext || !this.effects.reverbGain) return;
                switch (e.target.id) {
                    case 'reverb-mix': this.effects.reverbGain.gain.value = parseFloat(e.target.value); break;
                    case 'delay-time': this.effects.delay.delayTime.value = parseFloat(e.target.value); break;
                    case 'delay-feedback': this.effects.feedback.gain.value = parseFloat(e.target.value); break;
                }
                if (e.target.classList.contains('eq-gain')) {
                    const index = Array.from(this.shadowRoot.querySelectorAll('.eq-gain')).indexOf(e.target);
                    if (this.effects.eqBands[index]) this.effects.eqBands[index].gain.value = parseFloat(e.target.value);
                }
            });
        });
    }

    initAudio() {
        if (this.audioContext) return;
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.mainGain = this.audioContext.createGain();
        this.mainGain.gain.value = parseFloat(this.shadowRoot.getElementById('master-volume').value);
        this.effects = this.createEffectsChain(this.audioContext, this.mainGain);
        this.mainGain.connect(this.audioContext.destination);
        this.shadowRoot.querySelectorAll('input[type=range], select').forEach(el => el.dispatchEvent(new Event('input')));
    }

    createEffectsChain(context, sourceNode) {
        const effects = {};
        let lastNode = sourceNode;
        effects.eqBands = [];
        ['lowshelf', 'peaking', 'highshelf'].forEach((type, i) => {
            const eq = context.createBiquadFilter();
            eq.type = type; eq.frequency.value = [250, 1000, 4000][i];
            eq.gain.value = parseFloat(this.shadowRoot.querySelector(`.eq-gain[data-freq="${eq.frequency.value}"]`)?.value ?? 0);
            lastNode.connect(eq); lastNode = eq; effects.eqBands.push(eq);
        });
        const dryGain = context.createGain();
        lastNode.connect(dryGain);
        dryGain.connect(context.destination);

        const wetGain = context.createGain();
        lastNode.connect(wetGain);

        effects.delay = context.createDelay();
        effects.delay.delayTime.value = parseFloat(this.shadowRoot.getElementById('delay-time').value);
        effects.feedback = context.createGain();
        effects.feedback.gain.value = parseFloat(this.shadowRoot.getElementById('delay-feedback').value);

        wetGain.connect(effects.delay);
        effects.delay.connect(effects.feedback);
        effects.feedback.connect(effects.delay);
        effects.delay.connect(context.destination);
        effects.convolver = context.createConvolver();
        effects.reverbGain = context.createGain();
        effects.reverbGain.gain.value = parseFloat(this.shadowRoot.getElementById('reverb-mix').value);

        this.createReverbImpulseResponse(context).then(buffer => { effects.convolver.buffer = buffer; });

        wetGain.connect(effects.convolver);
        effects.convolver.connect(effects.reverbGain);
        effects.reverbGain.connect(context.destination);
        return effects;
    }

    async createReverbImpulseResponse(context) {
        const rate = context.sampleRate, length = rate * 2;
        const impulse = context.createBuffer(2, length, rate);
        for (let i = 0; i < length; i++) {
            impulse.getChannelData(0)[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.5);
            impulse.getChannelData(1)[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.5);
        }
        return impulse;
    }

    getFrequencyForNote(note) {
        if (note < 0 || note > 127) return 0;
        return this.baseFrequency * this.scaleRatios[note];
    }

    initMidi() {
        const midiControls = this.shadowRoot.getElementById('midi-controls');
        if (navigator.requestMIDIAccess) {
            navigator.requestMIDIAccess().then(this.onMIDISuccess.bind(this), () => {
                console.log('Could not access MIDI devices.');
                midiControls.setAttribute('disabled', '');
            });
        } else {
            console.log('Web MIDI API is not supported.');
            midiControls.setAttribute('disabled', '');
        }
    }

    onMIDISuccess(midiAccess) {
        this.shadowRoot.getElementById('midi-controls').removeAttribute('disabled');
        this.populateMIDIInputs(midiAccess);
        midiAccess.onstatechange = () => this.populateMIDIInputs(midiAccess);
    }

    populateMIDIInputs(midiAccess) {
        const inputs = midiAccess.inputs.values();
        const select = this.shadowRoot.getElementById('midi-inputs');
        select.innerHTML = '';
        let deviceCount = 0;
        for (let input = inputs.next(); input && !input.done; input = inputs.next()) {
            deviceCount++;
            const option = document.createElement('option');
            option.value = input.value.id;
            option.textContent = input.value.name;
            select.appendChild(option);
            input.value.onmidimessage = this.handleMIDIMessage.bind(this);
        }
        if (deviceCount === 0) {
            select.innerHTML = '<option>No devices found</option>';
        }
    }

    handleMIDIMessage(event) {
        if (!this.audioContext) this.initAudio();
        const command = event.data[0] >> 4;
        const note = event.data[1];
        const velocity = event.data.length > 2 ? event.data[2] : 0;

        if (command === 9 && velocity > 0) {
            this.playMidiNote(note, velocity);
        } else if (command === 8 || (command === 9 && velocity === 0)) {
            this.stopMidiNote(note);
        } else if (command === 14) { // Pitch Bend
            const bendValue = (velocity << 7) | note;
            const normalizedBend = (bendValue - 8192) / 8192;
            const detuneValue = normalizedBend * 200; // +/- 2 semitones (200 cents)
            for (const voice of this.activeMidiVoices.values()) {
                voice.osc.detune.setTargetAtTime(detuneValue, this.audioContext.currentTime, 0.01);
            }
        }
    }

    playMidiNote(note, velocity) {
        if (this.activeMidiVoices.has(note)) this.stopMidiNote(note);
        const voice = new Voice(note, this);
        voice.triggerAttack(this.getGlobalSynthParams(), this.audioContext.currentTime, velocity);
        this.activeMidiVoices.set(note, voice);
    }

    stopMidiNote(note) {
        if (this.activeMidiVoices.has(note)) {
            const voice = this.activeMidiVoices.get(note);
            voice.triggerRelease(this.audioContext.currentTime);
            this.activeMidiVoices.delete(note);
        }
    }

    startSequencer() {
        if (this.isPlaying) return;
        if (!this.audioContext) this.initAudio();
        this.isPlaying = true;
        this.currentStep = 0;
        this.lastNoteFreq = 0;
        this.nextStepTime = this.audioContext.currentTime;
        this.scheduler();
        this.shadowRoot.getElementById('startStopBtn').textContent = 'Stop';
    }

    stopSequencer() {
        this.isPlaying = false;
        window.clearTimeout(this.timerID);
        this.shadowRoot.getElementById('startStopBtn').textContent = 'Start';
        this.updateSequencerUI(-1);
    }

    scheduler() {
        while (this.nextStepTime < this.audioContext.currentTime + 0.1) {
            this.scheduleStep(this.currentStep, this.nextStepTime);
            this.nextStepTime += (60.0 / this.tempo) / 4;
            this.currentStep = (this.currentStep + 1) % 16;
        }
        this.timerID = window.setTimeout(this.scheduler.bind(this), 25.0);
    }

    scheduleStep(stepIndex, time) {
        const note = this.sequencerData[stepIndex];
        if (note !== null) {
            const params = this.sequencerStepParams[stepIndex] || this.getGlobalSynthParams();
            const voice = new Voice(note, this);
            voice.triggerAttack(params, time);
            const noteDuration = (60.0 / this.tempo) / 4 * 0.95;
            voice.triggerRelease(time + noteDuration);
        }
        setTimeout(() => this.updateSequencerUI(stepIndex), (time - this.audioContext.currentTime) * 1000);
    }

    updateSequencerUI(currentPlayingStep) {
        for (let i = 0; i < 16; i++) {
            this.sequencer.updateStep(i, { current: i === currentPlayingStep });
        }
    }

    renderSequencerState() {
        for (let i = 0; i < 16; i++) {
            const stepIsActive = this.sequencerData[i] !== null;
            this.sequencer.updateStep(i, {
                active: stepIsActive,
                'has-data': this.sequencerStepParams[i] !== null,
                note: stepIsActive ? this.sequencerData[i] : 60,
                disabled: !stepIsActive
            });
        }
    }

    getGlobalSynthParams() {
        const s = (id) => this.shadowRoot.getElementById(id);
        return {
            waveform: s('osc-waveform').value,
            portamento: parseFloat(s('portamento-time').value),
            cutoff: parseFloat(s('filter-cutoff').value), resonance: parseFloat(s('filter-resonance').value),
            pitchLfoRate: parseFloat(s('pitch-lfo-rate').value), pitchLfoDepth: parseFloat(s('pitch-lfo-depth').value),
            cutoffLfoRate: parseFloat(s('cutoff-lfo-rate').value), cutoffLfoDepth: parseFloat(s('cutoff-lfo-depth').value),
            adsr: {
                attack: parseFloat(s('env-attack').value), decay: parseFloat(s('env-decay').value),
                sustain: parseFloat(s('env-sustain').value), release: parseFloat(s('env-release').value),
            }
        };
    }

    applyGlobalSynthParams(params) {
        const s = (id, val) => this.shadowRoot.getElementById(id).value = val;
        s('osc-waveform', params.waveform);
        s('portamento-time', params.portamento || 0);
        s('filter-cutoff', params.cutoff); s('filter-resonance', params.resonance);
        s('pitch-lfo-rate', params.pitchLfoRate); s('pitch-lfo-depth', params.pitchLfoDepth);
        s('cutoff-lfo-rate', params.cutoffLfoRate); s('cutoff-lfo-depth', params.cutoffLfoDepth);
        s('env-attack', params.adsr.attack); s('env-decay', params.adsr.decay);
        s('env-sustain', params.adsr.sustain); s('env-release', params.adsr.release);
    }

    async exportWav() {
        const exportBtn = this.shadowRoot.getElementById('exportWav');
        exportBtn.textContent = 'Rendering...'; exportBtn.disabled = true;
        const sampleRate = 44100;
        const totalDuration = (16 * (60.0 / this.tempo / 4));
        const offlineCtx = new OfflineAudioContext(2, sampleRate * totalDuration, sampleRate);
        const mainGain = offlineCtx.createGain();
        mainGain.gain.value = parseFloat(this.shadowRoot.getElementById('master-volume').value);
        this.createEffectsChain(offlineCtx, mainGain);
        let lastExportFreq = 0;
        for (let i = 0; i < 16; i++) {
            const note = this.sequencerData[i];
            if (note !== null) {
                const time = i * (60.0 / this.tempo / 4);
                const duration = (60.0 / this.tempo / 4) * 0.95;
                const params = this.sequencerStepParams[i] || this.getGlobalSynthParams();
                const targetFreq = this.getFrequencyForNote(note);
                this.playNoteInContext(note, time, duration, params, offlineCtx, mainGain, lastExportFreq, targetFreq);
                lastExportFreq = targetFreq;
            }
        }
        const renderedBuffer = await offlineCtx.startRendering();
        const wavBlob = this.bufferToWav(renderedBuffer);
        const url = URL.createObjectURL(wavBlob);
        const a = document.createElement('a');
        a.style.display = 'none'; a.href = url; a.download = 'synth-sequence.wav';
        document.body.appendChild(a); a.click();
        window.URL.revokeObjectURL(url); a.remove();
        exportBtn.textContent = 'Export WAV'; exportBtn.disabled = false;
    }

    playNoteInContext(note, time, duration, params, context, destination, lastFreq, targetFreq) {
        const osc = context.createOscillator();
        const filter = context.createBiquadFilter();
        const vca = context.createGain();
        const pitchLFO = context.createOscillator();
        const pitchLFOGain = context.createGain();
        const cutoffLFO = context.createOscillator();
        const cutoffLFOGain = context.createGain();

        pitchLFO.connect(pitchLFOGain); pitchLFOGain.connect(osc.detune);
        cutoffLFO.connect(cutoffLFOGain); cutoffLFOGain.connect(filter.frequency);
        osc.connect(filter); filter.connect(vca); vca.connect(destination);

        if (params.portamento > 0.005 && lastFreq > 0) {
            osc.frequency.setValueAtTime(lastFreq, time);
            osc.frequency.setTargetAtTime(targetFreq, time, params.portamento / 4);
        } else {
            osc.frequency.setValueAtTime(targetFreq, time);
        }

        osc.type = params.waveform;
        filter.type = 'lowpass';
        filter.frequency.value = params.cutoff;
        filter.Q.value = params.resonance;
        pitchLFO.frequency.value = params.pitchLfoRate;
        pitchLFOGain.gain.value = params.pitchLfoDepth;
        cutoffLFO.frequency.value = params.cutoffLfoRate;
        cutoffLFOGain.gain.value = params.cutoffLfoDepth;

        const { attack, decay, sustain, release } = params.adsr;
        vca.gain.setValueAtTime(0, time);
        vca.gain.linearRampToValueAtTime(1.0, time + attack);
        vca.gain.linearRampToValueAtTime(sustain, time + attack + decay);
        vca.gain.setValueAtTime(sustain, time + duration);
        vca.gain.linearRampToValueAtTime(0, time + duration + release);

        osc.start(time); pitchLFO.start(time); cutoffLFO.start(time);
        osc.stop(time + duration + release);
        pitchLFO.stop(time + duration + release);
        cutoffLFO.stop(time + duration + release);
    }

    bufferToWav(buffer) {
        const numOfChan = buffer.numberOfChannels, len = buffer.length * numOfChan * 2 + 44;
        const bufferOut = new ArrayBuffer(len), view = new DataView(bufferOut);
        const channels = []; let offset = 0, pos = 0;
        const setUint16 = (data) => { view.setUint16(pos, data, true); pos += 2; }
        const setUint32 = (data) => { view.setUint32(pos, data, true); pos += 4; }
        setUint32(0x46464952); setUint32(len - 8); setUint32(0x45564157);
        setUint32(0x20746d66); setUint32(16); setUint16(1); setUint16(numOfChan);
        setUint32(buffer.sampleRate); setUint32(buffer.sampleRate * 2 * numOfChan);
        setUint16(numOfChan * 2); setUint16(16); setUint32(0x61746164); setUint32(len - pos - 4);
        for (let i = 0; i < buffer.numberOfChannels; i++) channels.push(buffer.getChannelData(i));
        while (pos < len) {
            for (let i = 0; i < numOfChan; i++) {
                let sample = Math.max(-1, Math.min(1, channels[i][offset]));
                sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
                view.setInt16(pos, sample, true); pos += 2;
            }
            offset++;
        }
        return new Blob([view], { type: 'audio/wav' });
    }

    saveSong() {
        const songData = {
            tempo: this.tempo,
            masterVolume: parseFloat(this.shadowRoot.getElementById('master-volume').value),
            sequencerData: this.sequencerData,
            sequencerStepParams: this.sequencerStepParams,
            synthParams: this.getGlobalSynthParams(),
            effects: {
                reverb: parseFloat(this.shadowRoot.getElementById('reverb-mix').value),
                delayTime: parseFloat(this.shadowRoot.getElementById('delay-time').value),
                delayFeedback: parseFloat(this.shadowRoot.getElementById('delay-feedback').value),
                eq: Array.from(this.shadowRoot.querySelectorAll('.eq-gain')).map(s => parseFloat(s.value))
            }
        };
        const blob = new Blob([JSON.stringify(songData, null, 2)], { type: 'application/json' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = 'wc-synth-song.json'; a.click(); URL.revokeObjectURL(a.href);
    }

    loadSong(songData) {
        const volumeSlider = this.shadowRoot.getElementById('master-volume');
        volumeSlider.value = songData.masterVolume || 0.7;
        if (this.mainGain) this.mainGain.gain.value = volumeSlider.value;
        this.tempo = songData.tempo; this.shadowRoot.getElementById('tempo').value = this.tempo;
        this.shadowRoot.getElementById('tempoValue').textContent = this.tempo;
        this.sequencerData = songData.sequencerData;
        this.sequencerStepParams = songData.sequencerStepParams || Array(16).fill(null);
        this.applyGlobalSynthParams(songData.synthParams);
        this.shadowRoot.getElementById('reverb-mix').value = songData.effects.reverb;
        this.shadowRoot.getElementById('delay-time').value = songData.effects.delayTime;
        this.shadowRoot.getElementById('delay-feedback').value = songData.effects.delayFeedback;
        this.shadowRoot.querySelectorAll('.eq-gain').forEach((s, i) => s.value = songData.effects.eq[i]);
        this.shadowRoot.querySelectorAll('input[type="range"], select').forEach(el => el.dispatchEvent(new Event('input')));
        this.renderSequencerState(); alert('Song loaded successfully!');
    }

    parseScl(sclData, fileName) {
        const lines = sclData.split('\n').map(l => l.trim()).filter(l => !l.startsWith('!') && l);
        const noteCount = parseInt(lines[1], 10); const newRatios = [1];
        for (let i = 2; i < lines.length; i++) {
            let ratio;
            if (lines[i].includes('.')) { ratio = Math.pow(2, parseFloat(lines[i]) / 1200); }
            else if (lines[i].includes('/')) { const [num, den] = lines[i].split('/'); ratio = parseFloat(num) / parseFloat(den); }
            else { ratio = parseInt(lines[i], 10); if (ratio > 0) ratio = Math.pow(2, ratio / 1200); }
            newRatios.push(ratio);
        }
        const period = newRatios.find(r => r >= 2) || 2;
        this.scaleRatios = Array(128).fill(0).map((_, i) => {
            const midiNote = i - this.baseMidiNote; const octave = Math.floor(midiNote / noteCount);
            const noteInScale = midiNote % noteCount;
            return Math.pow(period, octave) * newRatios[noteInScale < 0 ? noteInScale + noteCount : noteInScale];
        });
        this.shadowRoot.getElementById('tuningName').textContent = fileName;
    }

    handleFileLoad(event, callback, fileName = '') {
        const file = event.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = fileName.endsWith('.json') || fileName === '' ? JSON.parse(e.target.result) : e.target.result;
                callback(data, fileName);
            } catch (err) { alert('Error loading file.'); console.error(err); }
        };
        reader.readAsText(file);
        event.target.value = '';
    }
}
customElements.define('synth-app', SynthApp);