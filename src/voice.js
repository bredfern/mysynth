// --- Audio Logic: A single synthesizer voice ---
export default class Voice {
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
