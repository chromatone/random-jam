<script setup>
import { reactive, ref } from 'vue'
import { useGesture } from '@vueuse/gesture'
</script>

<template lang="pug">
.flex.flex-col.items-stretch.transition-all.duration-500.ease-out.select-none.rounded-xl.shadow-xl.border-8.p-4.w-full.h-full.bg-light-300 
  .text-4xl Jam Randomizer
  .text-2xl.op-60  Work in progress...

</template>

<style lang="postcss">
#app {
  @apply w-full h-full p-1;
}

a {
  @apply underline;
}

body {
  @apply flex items-stretch justify-stretch h-100svh;
  background-color: black;
  width: 100%;
  min-width: 320px;
  min-height: 100vh;
  line-height: 1.3;
  font-family: "Commissioner", -apple-system, BlinkMacSystemFont, "Segoe UI",
    Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans",
    "Helvetica Neue", sans-serif;
  font-size: 1em;
  font-weight: 400;
  color: var(--c-text);
  direction: ltr;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overscroll-behavior: none;
  overflow: hidden;
}
</style>
