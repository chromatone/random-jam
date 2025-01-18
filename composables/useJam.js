import { ref, computed } from 'vue'
import { useStorage } from '@vueuse/core'
import { ScaleType } from 'tonal'
import { globalScale, useTempo } from 'use-chromatone'

const minBpm = useStorage('jam-min-bpm', 80)
const maxBpm = useStorage('jam-max-bpm', 140)
const defaultMeasures = useStorage('jam-measures', 256)
const state = ref('stopped') // 'stopped' | 'preparing' | 'playing'
const startedAt = ref(null)
const currentBpm = ref(100)
const measures = ref(defaultMeasures.value)

const initialized = ref(false)

const tempo = useTempo()

const scales = ScaleType.all()
const currentScale = ref(null)


const sessionDuration = computed(() => {
  if (!currentBpm.value || !measures.value) return 0
  return (measures.value * 4 / currentBpm.value) * 60 * 1000 // in milliseconds
})

const progress = computed(() => {
  if (!startedAt.value || state.value !== 'playing') return 0
  const elapsed = Date.now() - startedAt.value
  return Math.min(elapsed / sessionDuration.value, 1)
})

const timeRemaining = computed(() => {
  if (!startedAt.value || state.value !== 'playing') return 0
  const remaining = sessionDuration.value - (Date.now() - startedAt.value)
  return Math.max(0, remaining)
})

// Actions
const randomize = () => {
  // Stop any existing playback
  tempo.stopped = true
  tempo.playing = false

  // Generate new random values
  currentBpm.value = Math.floor(minBpm.value + Math.random() * (maxBpm.value - minBpm.value))
  tempo.bpm = currentBpm.value

  // Select random scale with higher probability for major/minor
  const rand = Math.random()
  currentScale.value = rand < 0.3
    ? scales.find(s => s.name === 'major')
    : rand < 0.6
      ? scales.find(s => s.name === 'minor')
      : scales[Math.floor(Math.random() * scales.length)]

  // Apply scale
  globalScale.chroma = currentScale.value.chroma
  globalScale.tonic = Math.floor(Math.random() * 12)

  // Update state
  state.value = 'preparing'
}

const start = () => {
  startedAt.value = Date.now()
  state.value = 'playing'
  tempo.playing = true
}

const stop = () => {
  tempo.stopped = true
  tempo.playing = false
  state.value = 'stopped'
  startedAt.value = null
}

export const useJam = () => {
  if (!initialized) {
    watch(() => progress.value, (val) => {
      if (val >= 1) {
        stop()
      }
    })
    initialized.value = true
  }


  return {
    // State
    state,
    currentBpm,
    currentScale,
    measures,
    progress,
    timeRemaining,
    startedAt,

    // Settings
    minBpm,
    maxBpm,
    defaultMeasures,

    // Actions
    randomize,
    start,
    stop,
  }
}