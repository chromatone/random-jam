import { computed, ref, watch } from 'vue'
import { useClamp } from '@vueuse/math'
import { useTimestamp } from '@vueuse/core'
import { globalScale, useTempo, } from 'use-chromatone'
import { ScaleType } from 'tonal'

let initialized = false

export function useJam() {
  if (!initialized) {
    watch(now, n => n > finishAt.value && (tempo.playing = false))
  }
  return {
    tempo,
    minTempo,
    maxTempo,
    spin,
    startedAt,
    limitMeasures,
    scales,
    seed,
    randomScale,
    randomize,
    now,
    position,
    progress,
    duration, dist, finishAt, fromStart, tillFinish
  }
}

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
    spin.value = false
    tempo.mute = false
    tempo.playing = true
    startedAt.value = Date.now()

  }, delay)

}

const now = useTimestamp()

const position = computed(() => tempo?.position?.split(':').map(Number))

const progress = computed(() => position.value?.[0] / limitMeasures.value)

const duration = computed(() => getMinutesSeconds(limitMeasures.value * 4 / tempo?.bpm))

const dist = computed(() => getMillisecondsFromMinutes(limitMeasures.value * 4 / tempo?.bpm))

const finishAt = computed(() => startedAt.value + dist.value)

const fromStart = computed(() => [Math.floor((now.value - startedAt.value) / (1000 * 60)), Math.round(((now.value - startedAt.value) % (1000 * 60)) / 1000)])

const tillFinish = computed(() => [Math.floor((finishAt.value - now.value) / (1000 * 60)), Math.round(((finishAt.value - now.value) % (1000 * 60)) / 1000)])

function getMinutesSeconds(decimalMinutes) { return [Math.floor(decimalMinutes), Math.round((decimalMinutes - Math.floor(decimalMinutes)) * 60)]; }

function getMillisecondsFromMinutes(decimalMinutes) { return Math.round(decimalMinutes * 60 * 1000) }