<template>
  <v-app dark>
    <v-navigation-drawer
      v-model="drawer"
      :mini-variant="miniVariant"
      :clipped="clipped"
      fixed
      app
    >
      <v-list>
        <v-list-item
          v-for="(item, i) in items"
          :key="i"
          :to="item.to"
          router
          exact
        >
          <v-list-item-content>
            <v-list-item-title v-text="item.title" />
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-content>
      <v-container>
        <nuxt />
      </v-container>
    </v-content>
    <v-footer :fixed="fixed" app>
      <p>
        &copy; {{ new Date().getFullYear() }}
        <a href="https://bredfern.github.io">Brian Redfern</a> |
        <a href="/mysynth/">Synth</a> |
        <a href="/mysynth/help">Help</a>
      </p>
    </v-footer>
  </v-app>
</template>

<script>
export default {
  data () {
    return {
      clipped: false,
      drawer: false,
      fixed: false,
      items: [
        {
          icon: 'mdi-apps',
          title: 'My Synth',
          to: '/'
        },
        {
          icon: 'mdi-chart-bubble',
          title: 'Inspire',
          to: '/inspire'
        }
      ],
      miniVariant: false,
      right: true,
      rightDrawer: false,
      title: 'My Synth'
    }
  }
}
</script>
<style>
.logo {
   background: #2196f3;
   width: 10rem;
   height: 3rem;
   margin-left: auto;
   margin-right: auto;
}

.right {
  float: right;
 }

a {
  text-decoration: none;
}
</style>
