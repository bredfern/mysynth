<template>
  <v-app>
    <v-layout column justify-center align-center>
      <v-flex xs12 sm8 md6>
        <v-card>
          <v-card-title class="headline">
            <img
              src="~assets/logo.svg"
              class="logo"
            >
          </v-card-title>
          <v-card-actions>
            <v-spacer />
            <synth />
          </v-card-actions>
        </v-card>
      </v-flex>
    </v-layout>
  </v-app>
</template>

<script>
import Synth from '~/components/Synth.vue'

export default {
  components: {
    Synth
  }
}
</script>
