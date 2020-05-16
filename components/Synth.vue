<template>
  <div id="app">
    <div>
      Attack {{ sliderAttack }}
      <v-slider v-model="sliderAttack" />
    </div>
    <div>
      Decay {{ sliderDecay }}
      <v-slider v-model="sliderDecay" />
    </div>
    <div>
      Release {{ sliderRelease }}
      <v-slider v-model="sliderRelease" />
    </div>
    <div>
      Sustain {{ sliderSustain }}
      <v-slider v-model="sliderSustain" />
    </div>
    <div>
      FM Index {{ sliderIndex }}
      <v-slider v-model="sliderIndex" />
    </div>
    <div>
      Transpose {{ noteNumber }}
      <v-slider v-model="noteNumber" max="9" />
    </div>
    <span v-for="note in notes" :key="note.number">
      <v-btn
        tile
        large
        height="200"
        :color="dynamicColor"
        dark
        @click="synthStart(note.name)"
      >
        {{ note.number }}
      </v-btn>
    </span>
  </div>
</template>

<script>
import { Synth, PolySynth, Freeverb } from 'tone'

export default {
  data () {
    return {
      dynamicColor: 'primary',
      sliderAttack: 1,
      sliderRelease: 1,
      sliderDecay: 1,
      sliderSustain: 1,
      sliderIndex: 1,
      noteNumber: 3,
      notes: [
        {
          name: 'a',
          number: 1
        },
        {
          name: 'b',
          number: 2
        },
        {
          name: 'c',
          number: 3
        },
        {
          name: 'd',
          number: 4
        },
        {
          name: 'e',
          number: 5
        },
        {
          name: 'f',
          number: 6
        },
        {
          name: 'g',
          number: 7
        }
      ]
    }
  },
  created () {
    const freeverb = new Freeverb().toMaster()
    freeverb.dampening.value = 1000
    this.synth = new PolySynth(6, Synth, {
      oscillator: {
        type: 'fmtriangle',
        modulationType: 'square',
        modulationIndex: this.sliderIndex,
        harmonicity: Math.floor((Math.random() * 10) + 1) * 0.1
      },
      envelope: {
        attack: this.sliderAttack,
        decay: this.sliderDecay,
        sustain: this.sliderSustain,
        release: this.sliderRelease
      }
    }).connect(freeverb)
  },
  mounted () {
    window.addEventListener('keypress', (e) => {
      const num = parseFloat(String.fromCharCode(e.keyCode) - 1)
      if ((num >= 0) && (num < this.notes.length)) {
        this.synthStart(this.notes[num].name)
      }
    })
  },
  methods: {
    synthStart (num) {
      const noteItem = `${num}${this.noteNumber}`
      this.synth.triggerAttackRelease(noteItem, '4n')
    }
  }
}
</script>
<style scoped>
  .key {
    height: 200px;
  }
</style>
