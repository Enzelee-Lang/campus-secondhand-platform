<template>
  <router-view />
  <div class="fixed top-4 right-4 z-[999] space-y-2 w-80 pointer-events-none">
    <div v-for="t in toasts" :key="t.id"
      class="pointer-events-auto px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-start gap-2 animate-[fadeIn_.25s_ease]"
      :class="{
        'bg-slate-900 text-white': t.type === 'info',
        'bg-emerald-600 text-white': t.type === 'success',
        'bg-rose-600 text-white': t.type === 'error'
      }">
      <span class="mt-0.5">{{ t.type === 'success' ? '✅' : t.type === 'error' ? '⚠️' : 'ℹ️' }}</span>
      <span>{{ t.message }}</span>
    </div>
  </div>
</template>

<script setup>
import { toasts } from './utils/toast'
</script>

<style>
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
