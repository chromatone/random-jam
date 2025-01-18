<script setup>
import { version } from '../package.json'
</script>

<template lang='pug'>
.flex.flex-col.gap-4.items-center.m-auto
  .flex.items-center
    a.flex.items-center.gap-1.no-underline.text-sm.font-bold.op-40.hover-op-100.transition(href="https://chromatone.center/" target="_blank") 
      img.w-4(src="/logo.svg")
      .p-0.-mt-1px Chromatone
    .op-30.mx-2
      .i-la-times
    a.flex.items-center.gap-1.no-underline.text-sm.font-bold.op-40.hover-op-100.transition(href="https://102records.ru/" target="_blank") 
      img.w-20(src="/102_logo.svg")

  .text-4xl.font-bold RANDOM JAM
  .flex-1.max-w-35ch.text-center
    .text-lg Tempo and scale randomizer for music practice and improvisation
  slot
  a.flex.items-center.gap-1.no-underline.op-50.hover-op-90.transition.text-sm(href="https://github.com/chromatone/random-jam/" target="_blank") 
    .p-0 MIT 2025
    .i-la-github
    .p-0 v.{{ version }}
</template>