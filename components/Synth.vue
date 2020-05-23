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
          {{ sliderAttack }}
        </v-card>
      </v-col>
      <v-col cols="2">
        <v-card
          class="ma-3 pa-5"
          outlined
          tile
        >
          <v-slider v-model="sliderDecay" vertical />
          {{ sliderDecay }}
        </v-card>
      </v-col>
      <v-col cols="2">
        <v-card
          class="ma-3 pa-6"
          outlined
          tile
        >
          <v-slider v-model="sliderRelease" vertical />
          {{ sliderRelease }}
        </v-card>
      </v-col>
      <v-col cols="2">
        <v-card
          class="ma-3 pa-6"
          outlined
          tile
        >
          <v-slider v-model="sliderSustain" vertical />
          {{ sliderSustain }}
        </v-card>
      </v-col>
      <v-col cols="2">
        <v-card
          class="ma-3 pa-6"
          outlined
          tile
        >
          <v-slider v-model="sliderIndex" vertical max="10" />
          {{ sliderIndex }}
        </v-card>
      </v-col>
      <v-col cols="2">
        <v-card
          class="ma-3 pa-6"
          outlined
          tile
        >
          <v-slider v-model="noteNumber" vertical max="10" />
          {{ noteNumber }}
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

export default {
  data () {
    return {
      sliderAttack: 0,
      sliderRelease: 1,
      sliderDecay: 1,
      sliderSustain: 1,
      sliderIndex: 6,
      noteNumber: 6,
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

    if (navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess({
        sysex: true
      }).then(this.onMIDISuccess, this.onMIDIFailure)
    } else {
      alert('No MIDI support in your browser.')
    }
  },
  methods: {
    onMIDISuccess (midiAccess) {
      const inputs = midiAccess.inputs.values()
      for (let input = inputs.next(); input && !input.done; input = inputs.next()) {
        input.value.onmidimessage = this.onMIDIMessage
      }
    },
    onMIDIFailure (e) {
      console.log(`No access to MIDI devices or your browser has no WebMIDI support. ${e.toString()}`)
    },
    onMIDIMessage (message) {
      this.synthStart(message.data[1] * 0.8)
    },
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
