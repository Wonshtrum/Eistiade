<template>
  <div id="app">
    <h1>Bienvenue sur {{ title }}</h1>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component({
  data: () => ({
    title: 'Eistiade'
  })
})

export default class App extends Vue {}
</script>

<style>

</style>
