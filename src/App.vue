<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { globalScale, useTempo, noteColor, useSoundFont } from 'use-chromatone'
import { useClamp } from '@vueuse/math';
import { TransitionPresets, useTimestamp, useTransition } from '@vueuse/core'
import { colord } from 'colord';

import ChromaKeys from './ChromaKeys.vue'
import { ScaleType } from 'tonal';
import { useGesture } from '@vueuse/gesture';

useSoundFont()

const tempo = useTempo()

var meanTempo = 110;
var stdDevTempo = 20;

function randomNormalDistribution(mean, stdDev) {
  let u = 1 - Math.random()
  let v = 1 - Math.random()
  var normalDistribution = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return mean + stdDev * normalDistribution;
}

const output = useTransition(() => tempo.bpm, {
  duration: 1000,
  transition: TransitionPresets.easeInOutCubic,
})

const spin = ref(false)
const startedAt = ref(Date.now())
const limitMeasures = useClamp(256, 16, 1024)

const scales = ScaleType.all()
const seed = ref(Math.random())
const randomScale = computed(() => scales[Math.floor(seed.value * scales.length)])

function randomize() {
  if (spin.value) return
  tempo.stopped = true
  spin.value = true

  tempo.bpm = Math.round(randomNormalDistribution(meanTempo, stdDevTempo));

  seed.value = Math.random()

  globalScale.chroma = seed.value < 0.1 ? randomScale.value?.chroma : seed.value > .3 ? scales.find(s => s.name == 'minor').chroma : scales.find(s => s.name == 'major').chroma
  globalScale.tonic = Math.round(Math.random() * 12)

  setTimeout(() => {
    spin.value = false;
    tempo.playing = true
    startedAt.value = Date.now()
  }, 1000)

}

const position = computed(() => tempo?.position?.split(':').map(Number))

const progress = computed(() => position.value?.[0] / limitMeasures.value)

const tempoColor = computed(() => colord(noteColor(tempo.pitch, 2, .6)).lighten(.3).desaturate(0.2).toHex())

const tonicColor = computed(() => colord(noteColor(globalScale.tonic, 2, .6)).lighten(.3).desaturate(0.2).toHex())

const colorMix = computed(() => colord(tempoColor.value).mix(tonicColor.value).toHex())

const getMinutesSeconds = (decimalMinutes) => [Math.floor(decimalMinutes), Math.round((decimalMinutes - Math.floor(decimalMinutes)) * 60)];

const getMillisecondsFromMinutes = (decimalMinutes) => Math.round(decimalMinutes * 60 * 1000);

const duration = computed(() => getMinutesSeconds(limitMeasures.value * 4 / tempo?.bpm))

const dist = computed(() => getMillisecondsFromMinutes(limitMeasures.value * 4 / tempo?.bpm))

const finishAt = computed(() => startedAt.value + dist.value)

const now = useTimestamp()

const fromStart = computed(() => [Math.floor((now.value - startedAt.value) / (1000 * 60)), Math.round(((now.value - startedAt.value) % (1000 * 60)) / 1000)])

const tillFinish = computed(() => [Math.floor((finishAt.value - now.value) / (1000 * 60)), Math.round(((finishAt.value - now.value) % (1000 * 60)) / 1000)])

watch(now, n => {
  if (n > finishAt.value) {
    randomize()
  }
})

const started = ref(false)

const timebar = ref()
const tempobar = ref()

useGesture({
  onDrag(ev) {
    limitMeasures.value += ev.delta[0]
  }
}, {
  domTarget: timebar
})

useGesture({
  onDrag(ev) {
    tempo.volume -= ev.delta[1] / 10
  }
}, {
  domTarget: tempobar
})


</script>

<template lang="pug">
//- #overlay.p-4.z-100.absolute.top-4.bottom-4.left-4.right-4.bg-light-300.bg-op-50.backdrop-blur.rounded-lg.shadow(v-if="!started")
  .flex.w-full.items-center
    .flex.flex-col
      .text-lg.font-bold.op-40.hover-op-100.transition Chromatone
      .text-4rem.font-thin RANDOM JAM
    .flex-1
  button.p-4.bg-green(@click="started = true")
#screen.bg-light-900.dark-bg-dark-800
  .flex.flex-col.gap-4.p-4.justify-stretch.relative.items-stretch.min-h-100vh.transition.duration-1000(
  :style="{ backgroundImage: `linear-gradient(${colord(colorMix).alpha(.1).toHex()}, ${colord(colorMix).alpha(.9).toHex()})` }")
    .flex.w-full.items-center
      .flex.flex-col
        a.no-underline.text-sm.font-bold.op-40.hover-op-100.transition(href="https://chromatone.center/" target="_blank") Chromatone
        .text-4xl.font-thin RANDOM JAM
      .flex-1
      button.transition.duration-1000.bg-dark-400.p-4.rounded-full.shadow-xl.flex.gap-2(@click="randomize()" :style="{ backgroundColor: colorMix }" title="Randomize" aria-label="Randomize")
        .p-0(:class="{ 'animate-spin': spin }")
          .i-system-uicons-reset.-scale-y-100.text-4xl


    .flex.flex-wrap.items-stretch.justify-between.gap-4

      .tabular-nums.rounded-xl.p-2.shadow.flex.flex-col.gap-2(
        @click="tempo.mute = !tempo.mute"
        ref="tempobar"
        style="flex: 1 0 300px"
        :style="{ backgroundColor: tempoColor }"
        ) 
        .text-6xl.py-2.font-thin {{ output.toFixed() }} BPM
          span.transition(:style="{ opacity: tempo.blink ? tempo.volume : '0' }") •
        .flex.flex-wrap.gap-4.text-center.relative.items-stretch.justify-stretch.flex-1.rounded-lg.bg-light-900.p-2(v-if="position")
          .flex.flex-col.gap-2.w-full
            .flex.flex-col.gap-2.w-full.h-full
              .flex.gap-2.w-full(style="flex: 1 0 .25em")
                .bit(
                  v-for="i in 4" :style="{ backgroundColor: i - 1 == position[1] ? tempoColor : '#3332' }")

              .flex.gap-2.w-full(style="flex: 1 0 .5em")
                .bit(v-for="i in 4" :style="{ backgroundColor: i - 1 == position[0] % 4 ? tempoColor : '#3332' }")

              .flex.gap-2.w-full(style="flex: 1 0 .75em")
                .bit(v-for="i in 4" :style="{ backgroundColor: i - 1 == (Math.floor(position[0] / 4)) % 4 ? tempoColor : '#3332' }")

              .flex.gap-2.w-full(style="flex: 1 0 1em")
                .bit(v-for="i in 4" :style="{ backgroundColor: i - 1 == (Math.floor(position[0] / 4 / 4)) % 4 ? tempoColor : '#3332' }")

              .flex.gap-2.w-full(style="flex: 1 0 1.25em")
                .bit(v-for="i in 4" :style="{ backgroundColor: i - 1 == (Math.floor(position[0] / 4 / 4 / 4)) % 4 ? tempoColor : '#3332' }")


      .rounded-2xl.shadow.flex.flex-col(
        style="flex: 1 0 300px"
        :style="{ backgroundColor: tonicColor }"
        ) 
        .flex.items-baseline.gap-1
          .text-6xl.font-thin.m-4 {{ globalScale.note.name }}  {{ globalScale?.set?.name }}
        .flex-1
        chroma-keys.m-2(
          :title="false"
          :chroma="globalScale.chroma"
          :pitch="globalScale.tonic")


    .overflow-clip.rounded-2xl.flex.flex-col.items-center.border-8.relative.bg-light-900.bg-op-40.py-6.text-4xl.font-thin.flex-1.cursor-grab.active-cursor-grabbing(
      ref="timebar"
      :style="{ borderColor: colorMix }"
      )
      .absolute.left-2.z-10.top-2  {{ fromStart.filter(Boolean).join('m ') || 0 }}s
      .absolute.mx-auto.z-10.top-2.text-center.text-lg.font-normal.flex.flex-col 
        .p-0 {{ limitMeasures }} bars
        .p-0 {{ duration.filter(Boolean).join('m ') || 0 }}s

      .absolute.right-2.z-10.top-2 -{{ tillFinish.filter(Boolean).join('m ') || 0 }}s
      svg.w-full.bottom-0.absolute.z-100(viewBox="0 0 80 20" xmlns="http://www.w3.org/2000/svg")
        g(stroke="#3336" stroke-width=".25")
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
