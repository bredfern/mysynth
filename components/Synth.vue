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
      <v-slider v-model="noteNumber" max="18" />
    </div>
    <span v-for="note in notes" :key="note.number">
      <v-btn
        ref="note.number"
        tile
        large
        :color="note.color"
        height="200"
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
      sliderAttack: 0,
      sliderRelease: 1,
      sliderDecay: 1,
      sliderSustain: 1,
      sliderIndex: 1.8,
      noteNumber: 7,
      notes: [
        {
          name: 'a',
          number: 1,
          color: 'blue'
        },
        {
          name: 'a#',
          number: 2,
          color: 'blue'
        },
        {
          name: 'b',
          number: 3,
          color: 'blue'
        },
        {
          name: 'c',
          number: 4,
          color: 'blue'
        },
        {
          name: 'c#',
          number: 5,
          color: 'blue'
        },
        {
          name: 'd',
          number: 6,
          color: 'blue'
        },
        {
          name: 'd#',
          number: 7,
          color: 'blue'
        },
        {
          name: 'e',
          number: 8,
          color: 'blue'
        },
        {
          name: 'f',
          number: 9,
          color: 'blue'
        },
        {
          name: 'f#',
          number: 10,
          color: 'blue'
        },
        {
          name: 'g',
          number: 11,
          color: 'blue'
        },
        {
          name: 'g#',
          number: 11,
          color: 'blue'
        },
        {
          name: 'a',
          number: 12,
          color: 'blue'
        },
        {
          name: 'a#',
          number: 13,
          color: 'blue'
        },
        {
          name: 'b',
          number: 14,
          color: 'blue'
        },
        {
          name: 'c',
          number: 15,
          color: 'blue'
        },
        {
          name: 'c#',
          number: 16,
          color: 'blue'
        }
      ]
    }
  },
  created () {
    const freeverb = new Freeverb().toMaster()
    freeverb.dampening.value = 1000
    this.synth = new PolySynth(4, Synth, {
      oscillator: {
        type: 'fmsquare',
        modulationType: 'sine',
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
      const press = true
      this.keyPlay(e, press)
    })

    window.addEventListener('keyup', (e) => {
      const press = false
      this.keyPlay(e, press)
    })
  },
  methods: {
    synthStart (num) {
      const noteItem = `${num}${this.noteNumber}`
      this.synth.triggerAttackRelease(noteItem, '4n')
    },
    keyPlay (e, press) {
      const num = parseFloat(String.fromCharCode(e.keyCode) - 1)
      if ((num >= 0) && (num < this.notes.length)) {
        if (press === true) {
          this.notes[num].color = 'white'
          this.synthStart(this.notes[num].name)
        } else {
          this.notes[num].color = 'blue'
        }
      }
    }
  }
}
</script>
