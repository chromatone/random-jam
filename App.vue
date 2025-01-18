<script setup>
import ChromaKeys from './components/ChromaKeys.vue'
import SplashScreen from './components/SplashScreen.vue'

import { computed, onMounted, ref, watch } from 'vue'
import { useClamp } from '@vueuse/math'
import { useTimestamp } from '@vueuse/core'
import { globalScale, useTempo, noteColor, } from 'use-chromatone'

import { ScaleType } from 'tonal'

const tempo = useTempo()

const minTempo = useClamp(70, 30, 100)
const maxTempo = useClamp(140, minTempo, 200)

const spin = ref(false)
const startedAt = ref(Date.now())
const limitMeasures = useClamp(256, 16, 1024)

const scales = ScaleType.all()
const seed = ref(Math.random())
const randomScale = computed(() => scales[Math.floor(seed.value * scales.length)])

function randomize(delay = 1000) {
  if (spin.value) return
  tempo.stopped = true
  spin.value = true

  tempo.bpm = Math.round(Math.random() * (maxTempo.value - minTempo.value) + minTempo.value)

  seed.value = Math.random()

  globalScale.chroma = seed.value < 0.1 ? randomScale.value?.chroma : seed.value > .3 ? scales.find(s => s.name == 'minor').chroma : scales.find(s => s.name == 'major').chroma
  globalScale.tonic = Math.round(Math.random() * 12)

  setTimeout(() => {
    spin.value = false;
    tempo.playing = true
    startedAt.value = Date.now()
  }, delay)

}

const now = useTimestamp()

const position = computed(() => tempo?.position?.split(':').map(Number))

const progress = computed(() => position.value?.[0] / limitMeasures.value)

const getMinutesSeconds = (decimalMinutes) => [Math.floor(decimalMinutes), Math.round((decimalMinutes - Math.floor(decimalMinutes)) * 60)];

const getMillisecondsFromMinutes = (decimalMinutes) => Math.round(decimalMinutes * 60 * 1000);

const duration = computed(() => getMinutesSeconds(limitMeasures.value * 4 / tempo?.bpm))

const dist = computed(() => getMillisecondsFromMinutes(limitMeasures.value * 4 / tempo?.bpm))

const finishAt = computed(() => startedAt.value + dist.value)

const fromStart = computed(() => [Math.floor((now.value - startedAt.value) / (1000 * 60)), Math.round(((now.value - startedAt.value) % (1000 * 60)) / 1000)])

const tillFinish = computed(() => [Math.floor((finishAt.value - now.value) / (1000 * 60)), Math.round(((finishAt.value - now.value) % (1000 * 60)) / 1000)])

watch(now, n => n > finishAt.value && (tempo.playing = false))

import { colord } from 'colord'

const tempoColor = computed(() => colord(noteColor(tempo.pitch, 2, .6)).lighten(.3).desaturate(0.2).toHex())

const tonicColor = computed(() => colord(noteColor(globalScale.tonic, 2, .6)).lighten(.3).desaturate(0.2).toHex())

const colorMix = computed(() => colord(tempoColor.value).mix(tonicColor.value).toHex())


import { TransitionPresets, useTransition } from '@vueuse/core'

const smoothBPM = useTransition(() => tempo.bpm, {
  duration: 1000,
  transition: TransitionPresets.easeInOutCubic,
})

import { useSoundFont } from 'use-chromatone'

const { synthEnabled, volume } = useSoundFont()

import { useGesture } from '@vueuse/gesture'
import BeatBars from './components/BeatBars.vue'
import ControlRotary from './components/ControlRotary.vue'

const timebar = ref()
useGesture({
  onDrag: (ev) => limitMeasures.value = Math.round(limitMeasures.value + ev.delta[0])
}, { domTarget: timebar })

</script>

<template lang="pug">
#screen.bg-light-900.dark-bg-dark-800
  .flex.flex.p-4.absolute.z-1000.top-2.bottom-2.right-2.left-2.bg-light-200.bg-op-80.backdrop-blur(v-show="!tempo.playing")
    SplashScreen

      button.flex.items-center.transition.duration-1000.bg-dark-400.p-4.rounded-full.shadow-xl.flex.gap-2(@click="randomize()" :style="{ backgroundColor: colorMix }" title="Randomize" aria-label="Randomize")
        .p-0(:class="{ 'animate-spin': spin }")
          .i-system-uicons-reset.-scale-y-100.text-4xl
        .text-2xl Start

  .flex.flex-col.gap-4.p-4.justify-stretch.relative.items-stretch.min-h-100vh.transition.duration-1000(

    :style="{ backgroundImage: `linear-gradient(${colord(colorMix).alpha(.1).toHex()}, ${colord(colorMix).alpha(.9).toHex()})` }")
    .absolute.top-1.right-1
      button.transition.text-xl.p-2.bg-light-300.bg-op-30.hover-bg-op-80.rounded-full(@click="tempo.playing = false")
        .i-la-times

    .flex.flex-wrap.items-stretch.justify-between.gap-4

      .tabular-nums.rounded-xl.p-2.shadow.flex.flex-col.gap-2(
        style="flex: 1 0 300px"
        :style="{ backgroundColor: tempoColor }"
        ) 
        .flex.items-center.py-2.font-bold.gap-1 
          .text-6xl.op-80 {{ smoothBPM.toFixed() }}&nbsp;BPM
          .p-1.transition.rounded-full.bg-dark-200(:style="{ opacity: tempo.blink ? tempo.volume : '0' }")
          .flex-1
          ControlRotary(v-model="tempo.volume" param="VOL" :max="1" :step="0.001")

          button.text-2xl.p-2.op-30.hover-op-50.active-op-100.transition(@click="tempo.mute = !tempo.mute")
            .i-hugeicons-volume-high(v-if="!tempo.mute")
            .i-hugeicons-volume-off(v-else)
        BeatBars(:position :color="tempoColor")

      .rounded-2xl.shadow.flex.flex-col(
        style="flex: 1 0 300px"
        :style="{ backgroundColor: tonicColor }"
        ) 
        .flex.items-center.gap-1
          .text-6xl.font-bold.m-4.op-80 {{ globalScale.note.name }}  {{ globalScale?.set?.name }}
          .flex-1
          ControlRotary(v-model="volume" param="VOL" :max="1" :step="0.001")
          button.text-2xl.p-2.px-4.op-30.hover-op-50.active-op-100.transition(@click="synthEnabled = !synthEnabled")
            .i-hugeicons-volume-high(v-if="synthEnabled")
            .i-hugeicons-volume-off(v-else)
        .flex-1
        chroma-keys.m-2(
          :title="false"
          :chroma="globalScale.chroma"
          :pitch="globalScale.tonic")


    .overflow-clip.rounded-2xl.flex.flex-col.items-center.border-8.relative.bg-light-900.bg-op-40.py-6.text-4xl.font-bold.flex-1.cursor-grab.active-cursor-grabbing(
      ref="timebar"
      :style="{ borderColor: colorMix }"
      )
      .absolute.left-2.z-10.top-2  {{ fromStart.filter(Boolean).join('m ') || 0 }}s
      .absolute.mx-auto.z-10.top-2.text-center.text-lg.font-normal.flex.flex-col 
        .p-0 {{ limitMeasures }} bars
        .p-0 {{ duration.filter(Boolean).join('m ') || 0 }}s

      .absolute.right-2.z-10.top-2 -{{ tillFinish.filter(Boolean).join('m ') || 0 }}s
      svg.w-full.bottom-0.absolute.z-100(viewBox="0 0 80 20" xmlns="http://www.w3.org/2000/svg")
        g(stroke="#3336" stroke-width=".1")
          g(v-for="bar in limitMeasures" :key="bar")
            line(:transform="`translate(${bar * 80 / limitMeasures} 0)`" :y1="bar % 128 == 0 ? 6 : bar % 64 == 0 ? 8 : bar % 32 == 0 ? 10 : bar % 16 == 0 ? 12 : bar % 8 == 0 ? 14 : bar % 4 == 0 ? 16 : 18" y2="20")

      .bg-dark-400.transition.duration-300.top-0.bottom-0.left-0.absolute.flex.items-center(:style="{ backgroundColor: colord(colorMix).darken(.1).toHex(), width: `${progress * 100}%` }")
</template>

<style lang="postcss">
.bit {
  @apply flex-1 transition ease-in-out rounded border-0 border-dark-100 border-op-20 dark-border-light-900 dark-border-op-30
}

#app {
  @apply w-full h-full overflow-scroll overscroll-none select-none;
}

a {
  @apply underline;
}

body {
  @apply flex items-stretch justify-stretch h-100svh overscroll-none;
  background-color: #9988aa;
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
