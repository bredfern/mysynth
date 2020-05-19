<template>
  <div id="app">
    <v-container>
      <v-row no-gutters>
        <v-col>
          <v-card
            class="ma-3 pa-6"
            outlined
            center
            tile
          >
            <v-slider v-model="sliderAttack" vertical />
            A <br>{{ sliderAttack }}
          </v-card>
        </v-col>
        <v-col>
          <v-card
            class="ma-3 pa-6"
            outlined
            tile
          >
            <v-slider v-model="sliderDecay" vertical />
            D <br>{{ sliderDecay }}
          </v-card>
        </v-col>
        <v-col>
          <v-card
            class="ma-3 pa-6"
            outlined
            tile
          >
            <v-slider v-model="sliderRelease" vertical />
            R <br>{{ sliderRelease }}
          </v-card>
        </v-col>
        <v-col>
          <v-card
            class="ma-3 pa-6"
            outlined
            tile
          >
            <v-slider v-model="sliderSustain" vertical />
            S<br> {{ sliderSustain }}
          </v-card>
        </v-col>
        <v-col>
          <v-card
            class="ma-3 pa-6"
            outlined
            tile
          >
            <v-slider v-model="sliderIndex" vertical />
            F<br> {{ sliderIndex }}
          </v-card>
        </v-col>
        <v-col>
          <v-card
            class="ma-3 pa-6"
            outlined
            tile
          >
            <v-slider v-model="noteNumber" vertical />
            T<br> {{ noteNumber }}
          </v-card>
        </v-col>
        <v-col>
          <v-card
            class="ma-3 pa-6"
            outlined
            tile
          >
            <v-slider v-model="volumeNumber" vertical />
            V<br> {{ volumeNumber }}
          </v-card>
        </v-col>
      </v-row>
      <v-row>
        <v-col>
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
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import { Synth, PolySynth, Freeverb, Volume } from 'tone'

export default {
  data () {
    return {
      sliderAttack: 0,
      sliderRelease: 1,
      sliderDecay: 1,
      sliderSustain: 1,
      sliderIndex: 1.8,
      noteNumber: 7,
      volumeNumber: 10,
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
          name: 'd#',
          number: 7,
          color: 'red'
        },
        {
          name: 'e',
          number: 8,
          color: 'blue'
        }
      ]
    }
  },
  created () {
    const vol = new Volume(this.volumeNumber)
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
    }).chain(freeverb, vol).toMaster()
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
        } else if ((this.notes[num].name.includes('#')) && (press === false)) {
          this.notes[num].color = 'red'
        } else {
          this.notes[num].color = 'blue'
        }
      }
    }
  }
}
</script>
