<template>
  <router-link v-if="to" :to="to" class="stat-card-link">
    <div class="card anim-up p-5 flex items-center gap-4 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all">
      <div class="w-11 h-11 rounded-lg flex items-center justify-center shrink-0" :class="bgClass">
        <component :is="icon" class="w-5 h-5 text-white" />
      </div>
      <div class="min-w-0 flex-1">
        <div class="text-2xl font-bold text-gray-900 leading-none">{{ value }}</div>
        <div class="text-xs text-gray-400 mt-1.5">{{ title }}</div>
      </div>
      <div v-if="hint" class="text-[11px] text-gray-400">{{ hint }}</div>
    </div>
  </router-link>
  <div v-else class="card anim-up p-5 flex items-center gap-4">
    <div class="w-11 h-11 rounded-lg flex items-center justify-center shrink-0" :class="bgClass">
      <component :is="icon" class="w-5 h-5 text-white" />
    </div>
    <div class="min-w-0 flex-1">
      <div class="text-2xl font-bold text-gray-900 leading-none">{{ value }}</div>
      <div class="text-xs text-gray-400 mt-1.5">{{ title }}</div>
    </div>
    <div v-if="hint" class="text-[11px] text-gray-400">{{ hint }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: { type: String, default: '' },
  value: { type: [String, Number], default: 0 },
  icon: { type: [Object, Function], required: true },
  color: { type: String, default: 'emerald' },
  hint: { type: String, default: '' },
  to: { type: [String, Object], default: null }
})

const palette = {
  emerald: 'bg-emerald-500',
  teal:    'bg-teal-500',
  red:     'bg-red-500',
  blue:    'bg-blue-500',
  amber:   'bg-amber-500',
  violet:  'bg-violet-500',
  gray:    'bg-gray-500'
}
const bgClass = computed(() => palette[props.color] || palette.emerald)
</script>

<style scoped>
.stat-card-link {
  display: block;
  text-decoration: none;
}
</style>
