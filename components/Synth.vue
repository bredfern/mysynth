<template>
  <div id="app">
    <v-btn @click="synthStart">
      start
    </v-btn>
    <v-btn @click="synthStop">
      stop
    </v-btn>
  </div>
</template>

<script>
import { Synth } from 'tone'

export default {
  data () {
    return {
      clicked: 0
    }
  },
  created () {
    this.synth = new Synth({
      oscillator: {
        type: 'fmsquare',
        modulationType: 'sawtooth',
        modulationIndex: 3,
        harmonicity: 3.4
      },
      envelope: {
        attack: 0.001,
        decay: 0.1,
        sustain: 0.1,
        release: 0.1
      }
    }).toMaster()
  },
  methods: {
    synthStart () {
      this.synth.triggerAttackRelease('B4', '8n')
    },
    synthStop () {
      this.synth.triggerAttackRelease('C4', '4n')
    }
  }
}
</script>

<style>
button {
  height: 180px;
  width: 180px;
  background: #011;
  color: #fff;
}
</style>
