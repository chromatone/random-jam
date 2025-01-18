<script setup>
import ChromaKeys from './components/ChromaKeys.vue'
import SplashScreen from './components/SplashScreen.vue'
import BeatBars from './components/BeatBars.vue'
import ControlRotary from './components/ControlRotary.vue'

import { ref, computed, watch } from 'vue'
import { useClamp } from '@vueuse/math'
import { useTimestamp } from '@vueuse/core'
import { globalScale, useTempo, noteColor } from 'use-chromatone'
import { ScaleType } from 'tonal'
import { colord } from 'colord'
import { TransitionPresets, useTransition } from '@vueuse/core'
import { useSoundFont } from 'use-chromatone'

// Session parameters
const minBpm = ref(70)
const maxBpm = ref(140)
const sessionLength = ref(5) // minutes

// Clamp values for parameters
const clampedMinBpm = useClamp(minBpm, 30, 100)
const clampedMaxBpm = useClamp(maxBpm, clampedMinBpm, 200)
const clampedSessionLength = useClamp(sessionLength, 1, 60)

// Session state
const tempo = useTempo()
const startedAt = ref(0)
const isSpinning = ref(false)
const { synthEnabled, volume } = useSoundFont()

// Time tracking
const now = useTimestamp()
const sessionEndTime = computed(() => startedAt.value + clampedSessionLength.value * 60 * 1000)
const progress = computed(() =>
  startedAt.value ? Math.min((now.value - startedAt.value) / (sessionEndTime.value - startedAt.value), 1) : 0
)

// Scale generation
const scales = ScaleType.all()
const seed = ref(Math.random())
const randomScale = computed(() => {
  if (seed.value < 0.1) {
    return scales[Math.floor(seed.value * scales.length)]
  }
  return scales.find(s => s.name === (seed.value > 0.3 ? 'major' : 'minor'))
})

// UI colors
const tempoColor = computed(() =>
  colord(noteColor(tempo.pitch, 2, 0.6))
    .lighten(0.3)
    .desaturate(0.2)
    .toHex()
)

const tonicColor = computed(() =>
  colord(noteColor(globalScale.tonic, 2, 0.6))
    .lighten(0.3)
    .desaturate(0.2)
    .toHex()
)

const colorMix = computed(() =>
  colord(tempoColor.value)
    .mix(tonicColor.value)
    .toHex()
)

// Smooth BPM transition
const smoothBPM = useTransition(() => tempo.bpm, {
  duration: 1000,
  transition: TransitionPresets.easeInOutCubic,
})

// Time formatting helper
const formatTime = (ms) => {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.round((ms % 60000) / 1000)
  return `${minutes}m ${seconds}s`
}

// Session time displays
const elapsedTime = computed(() =>
  startedAt.value ? formatTime(now.value - startedAt.value) : '0s'
)

const remainingTime = computed(() =>
  startedAt.value ? formatTime(Math.max(0, sessionEndTime.value - now.value)) : '0s'
)

const position = computed(() => tempo?.position?.split(':').map(Number))

// Start new session
function startSession() {
  if (isSpinning.value) return

  isSpinning.value = true
  synthEnabled.value = true
  tempo.mute = false
  tempo.stopped = true

  // Generate random parameters
  tempo.bpm = Math.round(Math.random() * (clampedMaxBpm.value - clampedMinBpm.value) + clampedMinBpm.value)
  seed.value = Math.random()
  globalScale.chroma = randomScale.value?.chroma
  globalScale.tonic = Math.round(Math.random() * 12)

  // Start session after delay
  setTimeout(() => {
    isSpinning.value = false
    tempo.playing = true
    startedAt.value = Date.now()
  }, 1000)
}

// Stop session when time is up
watch(now, () => {
  if (startedAt.value && now.value >= sessionEndTime.value) {
    tempo.playing = false
  }
})

</script>

<template lang="pug">
#screen.bg-light-900.dark-bg-dark-800 
  .flex.flex.p-4.absolute.z-1000.top-2.bottom-2.right-2.left-2.bg-light-200.bg-op-98.op-0.rounded-xl.shadow-xl.transition.duration-1000.backdrop-blur-0(v-show="!tempo.playing" :class="{ 'backdrop-blur-xl op-100': !tempo.playing && !isSpinning }")
    SplashScreen
      ControlRotary.scale-125(v-model="clampedSessionLength" :min="1" :max="60" param="Duration" :fixed="0" unit="min")
      button.flex.items-center.transition.duration-1000.bg-dark-400.p-4.rounded-2xl.shadow-xl.flex.gap-2(@click="startSession()" :style="{ backgroundColor: colorMix }" title="Randomize" aria-label="Randomize")
        .p-0(:class="{ 'animate-spin': isSpinning }")
          .i-system-uicons-reset.-scale-y-100.text-4xl
        .text-2xl.font-bold Start new jam

  .flex.flex-col.gap-4.p-4.justify-stretch.relative.items-stretch.min-h-100vh.transition.duration-1000(
    :style="{ backgroundImage: `linear-gradient(${colord(colorMix).alpha(.1).toHex()}, ${colord(colorMix).alpha(.9).toHex()})` }")
    .absolute.top-1.right-1.z-100
      button.transition.text-xl.p-2.bg-light-300.bg-op-30.hover-bg-op-80.rounded-full(@click="tempo.playing = false")
        .i-la-times

    .flex.flex-wrap.items-stretch.justify-between.gap-4

      .tabular-nums.rounded-xl.p-2.shadow.flex.flex-col.gap-2(
        style="flex: 1 0 300px"
        :style="{ backgroundColor: tempoColor }"
        )  
        .flex.items-center.font-bold.gap-1 
          .text-6xl.op-80 {{ smoothBPM.toFixed() }}&nbsp;BPM
          .p-1.transition.rounded-full.bg-dark-200(:style="{ opacity: tempo.blink ? 1 : '0' }")
          .flex-1
          ControlRotary(v-model="tempo.volume" param="VOL" :max="1" :step="0.001")
        BeatBars(:position :color="tempoColor")

      .rounded-2xl.shadow.flex.flex-col(
        style="flex: 1 0 300px"
        :style="{ backgroundColor: tonicColor }"
        ) 
        .flex.items-center.gap-1
          .text-6xl.font-bold.m-4.op-80 {{ globalScale.note.name }}  {{ globalScale?.set?.name }}
          .flex-1
          ControlRotary(v-model="volume" param="VOL" :max="1" :step="0.001")
        .flex-1
        chroma-keys.m-2(
          :title="false"
          :chroma="globalScale.chroma"
          :pitch="globalScale.tonic")


    .overflow-clip.rounded-2xl.flex.flex-col.items-center.border-8.relative.bg-light-900.bg-op-40.py-6.text-4xl.font-bold.flex-1(
      :style="{ borderColor: colorMix }"
      )
      .absolute.left-2.z-10.top-2  {{ elapsedTime }}
      .absolute.mx-auto.z-10.top-2.text-center.text-lg.font-normal.flex.flex-col 


      .absolute.right-2.z-10.top-2 -{{ remainingTime }}

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
