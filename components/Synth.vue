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
          <v-slider v-model="sliderIndex" vertical max="200" />
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
    <v-row>
      <v-col
        v-for="note in notes"
        :key="note.number"
        cols="2"
        sm="2"
        lg="1"
      >
        <v-btn
          :color="note.color"
          height="100"
          :name="note.number"
          small
          @click="synthStart(note.name)"
        >
          {{ note.number }}
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { FMSynth } from 'tone'

export default {
  data () {
    return {
      sliderAttack: 0,
      sliderRelease: 10,
      sliderDecay: 10,
      sliderSustain: 10,
      sliderIndex: 6,
      noteNumber: 3,
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
    this.synth = new FMSynth({
      harmonicity: this.noteNumber,
      modulationIndex: this.sliderIndex,
      detune: 0,
      oscillator: {
        type: 'sine'
      },
      envelope: {
        attack: this.sliderAttack,
        decay: this.sliderDecay,
        sustain: this.sliderSustain,
        release: this.sliderRelease
      },
      modulation: {
        type: 'square'
      },
      modulationEnvelope: {
        attack: 0.5 * this.sliderAttack,
        decay: 0.5 * this.sliderDecay,
        sustain: 0.5 * this.sliderSustain,
        release: 0.5 * this.sliderRelease
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
      alert(e)
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
