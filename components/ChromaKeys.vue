<script setup>
import { globalScale, playChroma, stopChroma, rotateArray, noteColor, notes, flats, useMidi, chromaColorMix } from 'use-chromatone'
import { colord } from 'colord'
import { reactive, computed, nextTick } from 'vue'
import { ChordType, ScaleType } from 'tonal'

const props = defineProps({
  chroma: { type: String, default: '100000000000' },
  letters: { type: Boolean, default: true },
  pitch: { type: Number, default: 0 },
  scale: { type: String },
  roman: { type: String, default: '' },
  title: { type: Boolean, default: true },
  playAll: { type: Boolean, default: false }
});

const emit = defineEmits(['update:pitch'])

const keys = reactive({
  white: [3, 5, 7, 8, 10, 0, 2],
  black: [4, 6, null, 9, 11, 1],
  chroma: computed(() => rotateArray(props.chroma.split(''), -props.pitch)),
  scale: computed(() => rotateArray(globalScale.chroma.split(''), -props.pitch)),
  color: computed(() => chromaColorMix(rotateArray(props.chroma.split(''), -props.pitch).join(''), props.pitch, 0.3, 12)),
  title: computed(() => {
    if (!ChordType.get(props.chroma)?.empty) return ChordType.get(props.chroma).aliases[0]
    if (!ScaleType.get(props.chroma)?.empty) return ScaleType.get(props.chroma).aliases[0]
    else return ''
  })
});

const { midi, activeChroma } = useMidi()

function isInChroma(note) {
  return note != null && keys.chroma[note] == '1'
}

function isInScale(note) {
  return props.scale && note != null && keys.chroma[note] == '1'
}

function keyColor(key, off) {
  if (key == null) return 'transparent'
  if (key == props.pitch) return colord(noteColor(key, 4)).toHex()
  return isInChroma(key) && !off ? colord(noteColor(key, 3.5)).toHex() : notes[key].length != 2 ? '#eee' : '#999'
}

</script>

<template lang="pug">
.flex.flex-col.rounded-lg.cursor-pointer.transition-all.duration-300.ease.relative.select-none.touch-none(
  @pointerdown="playAll && nextTick(playChroma(chroma, pitch))"
  @pointerup="playAll && nextTick(stopChroma(chroma, pitch))"
  @pointerleave="playAll && nextTick(stopChroma(chroma, pitch))"
  @pointerout="playAll && nextTick(stopChroma(chroma, pitch))"

  )
  svg.w-full#chroma-keys(
    version="1.1",
    baseProfile="full",
    :viewBox="`-10 -20 720 250`",
    xmlns="http://www.w3.org/2000/svg",
    font-family="Commissioner, sans-serif"
    font-weight="200"
    font-size="40"
    text-anchor="middle",
    dominant-baseline="middle"
    :class="{ letters }"
    )
    defs
      filter#shadowButton(x="-50%" height="200%" width="300%")
        feDropShadow(dx="0" dy="3" stdDeviation="4" flood-color="#2225")
    rect(width="710" height="150" x="-5" y="-20" rx="20" :fill="keys.color.lch" style="filter:url(#shadowButton);")
    g.white
      g.key(
        v-for="(key, k) in keys.white" :key="key"
        :transform="`translate(${k * 100 + 5} 30)`"
        @mousedown="$emit('update:pitch', key)"
        )
        rect.transition-all.duration-300.ease-out(
          width="90"
          height="190"
          rx="45"
          :fill="keyColor(key, true)"
          style="filter:url(#shadowButton);"
          )
        circle.transition-all.duration-300.ease-out(

          cy="145"
          cx="45"
          r="45"
          :fill="keyColor(key)"
          )
        text.pointer-events-none(
          v-show="isInChroma(key) && letters"
          y="152"
          x="45"
          :fill="colord(noteColor(key)).isDark() ? 'white' : 'black'"
          ) 
          tspan(    
            :font-weight="key == pitch ? 800 : 200"
            ) {{ notes[key] }} 
        circle(
          :style="{ opacity: activeChroma[key] == 1 ? 1 : 0 }"
          cy="145"
          cx="45"
          r="18"
          fill="#3339"
          )
    g.black 
      g.key(
        v-for="(key, k) in keys.black" :key="key"
        :transform="`translate(${k * 100 + 55} -10)`"
        @mousedown="$emit('update:pitch', key)"
        )
        rect.transition-all.duration-300.ease-out(
          v-if="key"
          width="90"
          height="150"
          rx="45"
          style="filter:url(#shadowButton);"
          :fill="keyColor(key, true)"
          :data-check="key"
          )
        circle.transition-all.duration-300.ease-out(
          v-if="key"
          cy="105"
          cx="45"
          r="45"
          :fill="keyColor(key)"
          stroke-width="8"
          :stroke="isInScale(key) ? noteColor(key, 3) : 'transparent'"
        )
        text.pointer-events-none(
          v-show="isInChroma(key) && letters"
          :fill="colord(noteColor(key)).isDark() ? 'white' : 'black'"
          :font-weight="key == pitch ? 800 : 200"
          ) 
          tspan(y="111" x="45") {{ notes[key] }}
          tspan(y="40" x="45" ) {{ flats[key] }}
        circle(
          :style="{ opacity: activeChroma[key] == 1 ? 1 : 0 }"
          cy="75"
          cx="45"
          r="18"
          fill="#3339"
          )
  slot
    .flex.justify-center.my-2.px-2(
      :style="{ color: colord(noteColor(pitch, 2, 1, 1)).isDark() ? 'white' : 'black' }"
      v-if="title")
      .absolute.right-4 {{ roman }}
      .font-bold.text-lg.flex-1.text-center {{ notes[pitch] }}{{ keys.title }}
 

</template>

<style lang="postcss" scoped>
.key text {
  transition: all 300ms ease;
}

.letters .key .text {
  opacity: 1;
}

.key:hover text {
  opacity: 1;
}
</style>
