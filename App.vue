<script setup>
import ChromaKeys from './components/ChromaKeys.vue'
import BeatBars from './components/BeatBars.vue'
import ControlRotary from './components/ControlRotary.vue'

import { version } from './package.json'

import { ref, computed, watch } from 'vue'
import { useClamp } from '@vueuse/math'
import { useDark, useTimestamp } from '@vueuse/core'
import { globalScale, useTempo, noteColor } from 'use-chromatone'
import { ScaleType } from 'tonal'
import { colord } from 'colord'
import { TransitionPresets, useTransition } from '@vueuse/core'
import { useSoundFont } from 'use-chromatone'

const sessionMinutes = ref(5)
const proMode = ref(false)
const ready = ref(false)

const seed = ref(Math.random())

const dark = useDark({ initialValue: 'dark' })

const minBpm = useClamp(70, 30, 120)
const maxBpm = useClamp(140, minBpm, 220)
const clampedSessionLength = useClamp(sessionMinutes, 1, 60)

const tempo = useTempo()
const startedAt = ref(0)
const isSpinning = ref(false)
const { synthEnabled, volume } = useSoundFont()

// const totalBeats = computed(() => sessionMinutes.value * tempo.bpm)

// const timeline = computed(() => {

//   const line = [seed.value * .3]
//   let total = 0
//   while (total < 1) {
//     let rn = .03 + Math.random() * .3
//     total += rn
//     line.push(total)
//   }
//   return line.map(l => l * 100)
// })

const now = useTimestamp()

const sessionEndTime = computed(() => startedAt.value + clampedSessionLength.value * 60 * 1000)

const progress = computed(() =>
  startedAt.value ? Math.min((now.value - startedAt.value) / (sessionEndTime.value - startedAt.value), 1) : 0)

const scales = ScaleType.all()

const randomScale = computed(() => {
  if (proMode.value) return scales[Math.floor(seed.value * scales.length)]
  return scales.find(s => s.name === (seed.value > .8 ? 'major' : 'minor'))
})

const tempoColor = computed(() =>
  colord(noteColor(tempo.pitch, 2, 0.6))
    .lighten(dark.value ? 0.2 : 0.3)
    .desaturate(0.2)
    .toHex())

const tonicColor = computed(() =>
  colord(noteColor(globalScale.tonic, 2, 0.6))
    .lighten(dark.value ? 0.2 : 0.3)
    .desaturate(0.2)
    .toHex())

const colorMix = computed(() =>
  colord(tempoColor.value)
    .mix(tonicColor.value)
    .toHex())

const smoothBPM = useTransition(() => tempo.bpm, {
  duration: 1000,
  transition: TransitionPresets.easeInOutCubic
})


const formatTime = (ms) => {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.round((ms % 60000) / 1000)
  return `${minutes}m ${seconds}s`
}

const elapsedTime = computed(() =>
  startedAt.value ? formatTime(now.value - startedAt.value) : '0s')

const remainingTime = computed(() =>
  startedAt.value ? formatTime(Math.max(0, sessionEndTime.value - now.value)) : '0s')

const position = computed(() => tempo?.position?.split(':').map(Number))

function startSession() {
  if (isSpinning.value) return

  isSpinning.value = true
  synthEnabled.value = true
  tempo.mute = false
  tempo.stopped = true


  tempo.bpm = stratifiedRandom(minBpm.value, maxBpm.value, 5)

  seed.value = Math.random()
  globalScale.tonic = stratifiedRandom(0, 12, 3)

  globalScale.chroma = randomScale.value?.chroma

  ready.value = true

  setTimeout(() => {
    isSpinning.value = false
  }, 1000)
}


// watch(now, () => {
//   if (startedAt.value && now.value >= sessionEndTime.value) {
//     tempo.playing = false
//   }
// })

function stratifiedRandom(min, max, strata = 3) {
  const segment = Math.floor(Math.random() * strata);
  const segmentSize = (max - min + 1) / strata;
  const segmentMin = Math.floor(min + segment * segmentSize);
  const segmentMax = Math.floor(segmentMin + segmentSize - 1);
  return Math.floor(Math.random() * (segmentMax - segmentMin + 1)) + segmentMin;
}

tempo.bpm = stratifiedRandom(minBpm.value, maxBpm.value);


</script>

<template lang="pug">
#screen.bg-light-900.dark-bg-dark-800.transition

  .flex.flex-col.p-4.absolute.z-1000.top-2.bottom-2.right-2.left-2.bg-op-40.op-0.rounded-xl.shadow-xl.transition.duration-1000.backdrop-blur-0.bg-light-900.dark-bg-dark-800.dark-bg-op-90.dark-text-light(v-if="!ready && !tempo.playing" :class="{ 'backdrop-blur-xl op-100': !tempo.playing && !isSpinning }")
    .absolute.top-2.left-2.z-1000
      button.dark-text-white.p-2.text-xl(@click="dark = !dark", aria-label="Toggle dark mode" )
        .i-carbon-moon(v-show="dark")
        .i-ion-ios-sunny(v-show="!dark")


    .flex.flex-col.gap-4.items-center.mx-auto.flex-1
      .flex.items-center.mt-4.w-full.justify-center
        a.flex.items-center.gap-1.no-underline.text-sm.font-bold.op-80.hover-op-100.transition(href="https://chromatone.center/" target="_blank") 
          img.w-8(src="/logo.svg")
          .p-0.-mt-1px.text-lg Chromatone
        .op-30.mx-2
          .i-la-times
        a.flex.items-center.gap-1.no-underline.text-sm.font-bold.op-80.hover-op-100.transition(href="https://102records.ru/" target="_blank") 
          img.w-24.dark-invert(src="/102_logo.svg")
      .flex-1
      .text-8vw.font-bold.text-center RANDOM JAM
      .w-full.text-center
        .text-lg Tempo and scale randomizer for music practice and improvisation
      .flex-1

      .flex.flex-wrap.items-center.gap-4
        ControlRotary.scale-110(v-model="minBpm" :min="30" :max="120" param="MIN" :fixed="0" unit="BPM")
        ControlRotary.scale-110(v-model="maxBpm" :min="minBpm" :max="220" param="MAX" :fixed="0" unit="BPM")
        ControlRotary.scale-110(v-model="clampedSessionLength" :min="1" :max="30" param="Duration" :fixed="0" unit="min")
        label.border-dark.dark-border-light.cursor-pointer.flex.flex.gap-6.items-center.border-1.p-2.rounded-xl(for="proMode")
          .text-lg.font-bold Pro&nbsp;Mode 
          input#proMode.scale-130.mr-2(type="checkbox" switch v-model="proMode")

      .flex-1

      button.mx-auto.flex.items-center.transition.duration-1000.bg-dark-400.p-4.rounded-2xl.shadow-xl.flex.gap-2.text-black(@click="startSession()" :style="{ backgroundColor: colorMix }" title="Randomize" aria-label="Randomize")
        .p-0(:class="{ 'animate-spin': isSpinning }")
          .i-system-uicons-reset.-scale-y-100.text-4xl
        .text-2xl.font-bold Generate a session

      .flex-1

      a.w-full.justify-center.flex.items-center.gap-1.no-underline.op-50.hover-op-90.transition.text-sm(href="https://github.com/chromatone/random-jam/" target="_blank") 
        .p-0 MIT 2025
        .i-la-github
        .p-0 v.{{ version }}

  .flex.flex-col.gap-4.p-4.justify-stretch.relative.items-stretch.min-h-100vh.transition.duration-1000(
    :style="{ backgroundImage: `linear-gradient(${colord(tempoColor).alpha(.8).toHex()}, ${colord(tonicColor).alpha(.8).toHex()},  ${colord(colorMix).alpha(.8).toHex()})` }")

    .flex.flex-wrap.items-stretch.justify-between.gap-4

      .tabular-nums.rounded-xl.p-2.shadow.flex.flex-col.gap-2(
        style="flex: 1 0 300px"
        :style="{ backgroundColor: tempoColor }"
        )  
        .flex.items-center.font-bold.gap-1 
          .text-8vw.op-80 {{ smoothBPM.toFixed() }}&nbsp;BPM
          .p-1.transition.rounded-full.bg-dark-200(:style="{ opacity: tempo.blink ? 1 : '0' }")
          .flex-1
          ControlRotary.absolute(v-model="tempo.volume" param="VOL" :max="1" :step="0.001")
        BeatBars(:position :color="tempoColor")

      .rounded-2xl.shadow.flex.flex-col(
        style="flex: 1 0 300px"
        :style="{ backgroundColor: tonicColor }"
        ) 
        .flex.items-center.gap-1
          .text-8vw.font-bold.m-4.op-80.leading-7vw {{ globalScale.note.name }}&nbsp;{{ globalScale?.set?.name }}
          .flex-1
          ControlRotary(v-model="volume" param="VOL" :max="1" :step="0.001")
        .flex-1
        chroma-keys.m-2(
          :title="false"
          :chroma="globalScale.chroma"
          :pitch="globalScale.tonic")


    .flex.justify-center.min-h-2em.text-8vw.tabular-nums.overflow-clip.rounded-2xl.flex.items-stretch.border-8.relative.bg-light-900.bg-op-40.font-bold.flex-1(
      :style="{ borderColor: colorMix }"
      )
      .absolute.left-2.z-10.top-4.op-80  {{ elapsedTime }}

      button.absolute.items-center.justify-center.left-0.right-0.bottom-0.z-10.top-0.text-center.font-bold.flex.z-20.cursor-pointer.flex.flex-col.gap-2(
        aria-label="Start the jam"
        title="Start the jam"
        @click="tempo.playing = true; startedAt = Date.now(); ready = false" 
        v-if="ready && !tempo.playing"
        :style="{ backgroundColor: colord(colorMix).lighten(dark ? .1 : .3).toHex() }"
        ) 
        h1.text-8vw.animate-pulse START
        h2.text-xl {{ sessionMinutes }} minute jam

      .absolute.items-center.justify-center.left-0.right-0.bottom-0.z-10.top-0.text-center.font-bold.flex.z-20.cursor-pointer.flex.flex-col.gap-2(
        @click="tempo.playing = false; startedAt = 0" 
        v-if="tempo.playing && remainingTime == '0m 0s'"
        :style="{ backgroundColor: colord(colorMix).lighten(dark ? -.1 : .2).toHex() }"
        ) 
        h1.text-8vw.animate-pulse FINISH
        h2.text-xl {{ sessionMinutes }} minute jam

      .z-1000.bottom-0.absolute(v-show="tempo.playing || ready")
        button.transition.text-xl.p-2.bg-light-300.bg-op-30.hover-bg-op-80.rounded-full(@click="ready = false; tempo.playing = false" aria-label="Abandon session" title="Abandon session")
          .i-la-times

      //- .border-r-2.op-40.text-sm.flex.items-end.border-dark.z-10.h-20.mt-auto(inert v-for="(part, p) in sessionMinutes" :key="part" :style="{ flex: '1 0' }") 

      .absolute.right-2.z-10.top-4.op-80 {{ `-${remainingTime}` }}

      .bg-dark-400.transition.duration-300.top-0.bottom-0.left-0.absolute.flex.items-center(:style="{ backgroundColor: colord(colorMix).darken(.1).toHex(), width: `${progress * 100}%` }")
</template>

<style lang="postcss">
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
