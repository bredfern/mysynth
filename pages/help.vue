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
          <v-card-text>
            <p>Click the buttons or on a keyboard type the numbers 1-9 to make sounds.</p>
            <p>If your browser can use webmidi you can connect a midi controller to play.</p>
            <p><a href="/mysynth/">Back</a></p>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
          </v-card-actions>
        </v-card>
      </v-flex>
    </v-layout>
  </v-app>
</template>
