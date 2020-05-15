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
      <v-btn rounded large color="primary" dark @click="synthStart(1)">
        1
      </v-btn>
      <v-btn rounded large color="primary" dark @click="synthStart(2)">
        2
      </v-btn>
      <v-btn rounded large color="primary" dark @click="synthStart(3)">
        3
      </v-btn>
      <v-btn rounded large color="primary" dark @click="synthStart(4)">
        4
      </v-btn>
      <v-btn rounded large color="primary" dark @click="synthStart(5)">
        5
      </v-btn>
      <v-btn rounded large color="primary" dark @click="synthStart(6)">
        6
      </v-btn>
      <v-btn rounded large color="primary" dark @click="synthStart(7)">
        7
      </v-btn>
    </div>
  </div>
</template>

<script>
import { Synth, Freeverb } from 'tone'

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
    this.synth = new Synth({
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
  mounted () {
    window.addEventListener('keypress', (e) => {
      const num = parseFloat(String.fromCharCode(e.keyCode))
      if ((num > 0) && (num < 10)) {
        this.synthStart(num)
      }
    })
  },
  methods: {
    synthStart (num) {
      const noteNumber = num + 1
      const noteItem = `C${noteNumber}`
      this.synth.triggerAttackRelease(noteItem, '4n')
    }
  }
}
</script>
