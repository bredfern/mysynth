<template>
  <v-layout column justify-center align-center>
    <v-flex xs12 sm8 md6>
      <v-card>
        <v-card-title class="headline">
          My Synth
        </v-card-title>
        <v-card-text>
          <p>
            Your web audio synth.
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <synth />
        </v-card-actions>
      </v-card>
    </v-flex>
  </v-layout>
</template>

<script>
import Synth from '~/components/Synth.vue'

export default {
  components: {
    Synth
  }
}
</script>
