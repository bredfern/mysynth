<template>
  <div id="app">
    <div>
      Attack
      <v-slider @mouseup="synthAttack()" v-model="sliderAttack" />{{slider}}
    </div>
    <div>
      Decay
      <v-slider @moouseup="synthDecay()" v-model="sliderDecay" />{{slider}}
    </div>
    <div>
      Release
      <v-slider @mouseup="synthRelease()" v-model="sliderRelease" />{{slider}}
    </div>
    <div>
      Sustain
      <v-slider @mouseup="synthSustain()" v-model="sliderSustain" />{{slider}}
    </div>
    <div>
      <v-btn rounded color="primary" dark @click="synthStart(1)">1</v-btn>
      <v-btn rounded color="primary" dark @click="synthStart(2)">2</v-btn>
      <v-btn rounded color="primary" dark @click="synthStart(3)">3</v-btn>
      <v-btn rounded color="primary" dark @click="synthStart(4)">4</v-btn>
      <v-btn rounded color="primary" dark @click="synthStart(5)">5</v-btn>
      <v-btn rounded color="primary" dark @click="synthStart(6)">6</v-btn>
      <v-btn rounded color="primary" dark @click="synthStart(7)">7</v-btn>
    </div>
  </div>
</template>

<script>
import { PluckSynth } from 'tone'
import { Freeverb } from 'tone'

export default {
  data () {
    return {
      clicked: 1,
      sliderAttack: 1,
      sliderRelease: 1,
      sliderDecay: 1,
      sliderSustain: 1
    }
  },
  created () {
    const freeverb = new Freeverb().toMaster()
    freeverb.dampening.value = 1000
    this.synth = new PluckSynth({
      oscillator: {
        type: 'fmsquare',
        modulationType: 'sine',
        modulationIndex: 1,
        harmonicity: 0.1
      },
      envelope: {
        attack: this.sliderAttack,
        decay: this.sliderDecay,
        sustain: this.sliderSustain,
        release: this.sliderRelease
      }
    }).connect(freeverb)
  },
  methods: {
    synthStart (num) {
      const noteNumber = num + 1
      const noteItem = `C${noteNumber}`
      this.synth.triggerAttackRelease(noteItem, '8n')
    },
    synthAttack () {
      this.synth.envelope.attack = this.sliderAttack * 0.01
    },
    synthDecay () {
      this.synth.envelope.decay = this.sliderDecay * 0.01
    },
    synthRelease () {
      this.synth.envelope.release = this.sliderRelease * 0.01
    },
    synthSustain () {
      this.synth.envelope.sustain = this.sliderSustain * 0.01
    },
    test(where, e) {
      console.log(`keyuptest at ${where} with code ${e.keyCode}`);
    }
  }
}
</script>
