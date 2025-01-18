<script setup>
const props = defineProps({
  position: { type: Array, default: () => ([]) },
  color: { type: String, default: '#333' },
  steps: { type: Number, default: 4 }
})
</script>

<template lang='pug'>
.flex.flex-wrap.gap-4.text-center.relative.items-stretch.justify-stretch.flex-1.rounded-lg.bg-light-900.p-2(v-if="position")
    .flex.flex-col.gap-2.w-full
      .flex.flex-col.gap-2.w-full.h-full
        .flex.gap-2.w-full(style="flex: 1 0 .25em")
          .bit(
            v-for="i in steps" :style="{ backgroundColor: i - 1 == position[1] ? color : '#3332' }")

        .flex.gap-2.w-full(style="flex: 1 0 .5em")
          .bit(v-for="i in steps" :style="{ backgroundColor: i - 1 == position[0] % steps ? color : '#3332' }")

        .flex.gap-2.w-full(style="flex: 1 0 .75em")
          .bit(v-for="i in steps" :style="{ backgroundColor: i - 1 == (Math.floor(position[0] / steps)) % steps ? color : '#3332' }")

        .flex.gap-2.w-full(style="flex: 1 0 1em")
          .bit(v-for="i in steps" :style="{ backgroundColor: i - 1 == (Math.floor(position[0] / steps / steps)) % steps ? color : '#3332' }")

        .flex.gap-2.w-full(style="flex: 1 0 1.25em")
          .bit(v-for="i in steps" :style="{ backgroundColor: i - 1 == (Math.floor(position[0] / steps / steps / steps)) % steps ? color : '#3332' }")
</template>

<style lang="postcss" scoped>
.bit {
  @apply flex-1 transition ease-in-out rounded border-0 border-dark-100 border-op-20 dark-border-light-900 dark-border-op-30
}
</style>