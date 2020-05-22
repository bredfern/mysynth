<template>
  <v-container fluid>
    <v-row dense>
      <v-col cols="2">
        <v-card
          class="ma-3 pa-5"
          outlined
          center
          tile
        >
          <v-slider v-model="sliderAttack" vertical />
          A <br>{{ sliderAttack }}
        </v-card>
      </v-col>
      <v-col cols="2">
        <v-card
          class="ma-3 pa-5"
          outlined
          tile
        >
          <v-slider v-model="sliderDecay" vertical />
          D <br>{{ sliderDecay }}
        </v-card>
      </v-col>
      <v-col cols="2">
        <v-card
          class="ma-3 pa-6"
          outlined
          tile
        >
          <v-slider v-model="sliderRelease" vertical />
          R <br>{{ sliderRelease }}
        </v-card>
      </v-col>
      <v-col cols="2">
        <v-card
          class="ma-3 pa-6"
          outlined
          tile
        >
          <v-slider v-model="sliderSustain" vertical />
          S<br> {{ sliderSustain }}
        </v-card>
      </v-col>
      <v-col cols="2">
        <v-card
          class="ma-3 pa-6"
          outlined
          tile
        >
          <v-slider v-model="sliderIndex" vertical max="10" />
          F<br> {{ sliderIndex }}
        </v-card>
      </v-col>
      <v-col cols="2">
        <v-card
          class="ma-3 pa-6"
          outlined
          tile
        >
          <v-slider v-model="noteNumber" vertical max="20" />
          T<br> {{ noteNumber }}
        </v-card>
      </v-col>
    </v-row>
    <v-row
      class="mb-3"
      dense
    >
      <v-col
        v-for="note in notes"
        :key="note.number"
        cols="1"
        class="pa-2"
      >
        <v-btn
          ref="note.number"
          :color="note.color"
          height="100"
          dark
          x-small
          @click="synthStart(note.name)"
        >
          {{ note.number }}
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { Synth, PolySynth } from 'tone'
import WebMidi from 'webmidi'

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
          name: 'c',
          number: 1,
          color: 'blue'
        },
        {
          name: 'c#',
          number: 2,
          color: 'red'
        },
        {
          name: 'd',
          number: 3,
          color: 'blue'
        },
        {
          name: 'd#',
          number: 4,
          color: 'red'
        },
        {
          name: 'e',
          number: 5,
          color: 'blue'
        },
        {
          name: 'f',
          number: 6,
          color: 'blue'
        },
        {
          name: 'f#',
          number: 7,
          color: 'red'
        },
        {
          name: 'g',
          number: 8,
          color: 'blue'
        },
        {
          name: 'g#',
          number: 9,
          color: 'red'
        },
        {
          name: 'a',
          number: 10,
          color: 'blue'
        },
        {
          name: 'a#',
          number: 11,
          color: 'red'
        },
        {
          name: 'b',
          number: 12,
          color: 'blue'
        }
      ]
    }
  },
  created () {
    this.synth = new PolySynth(8, Synth, {
      oscillator: {
        type: 'fmsquare',
        modulationType: 'sawtooth',
        modulationIndex: this.sliderIndex,
        harmonicity: Math.floor((Math.random() * 10) + 1) * 0.1
      },
      envelope: {
        attack: this.sliderAttack,
        decay: this.sliderDecay,
        sustain: this.sliderSustain,
        release: this.sliderRelease
      }
    }).toMaster()
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
        } else if (this.notes[num].name.includes('#')) {
          this.notes[num].color = 'red'
        } else {
          this.notes[num].color = 'blue'
        }
      }
    }
  }
}
</script>
