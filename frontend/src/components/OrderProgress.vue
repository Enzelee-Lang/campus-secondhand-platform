<template>
  <div class="flex items-center">
    <div v-for="(step, i) in steps" :key="i" class="flex items-center flex-1 last:flex-none">
      <div class="flex flex-col items-center">
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition"
          :class="i <= curStep ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'">
          <Check v-if="i < curStep || (i === curStep && curStep === steps.length - 1)" class="w-4 h-4" />
          <span v-else>{{ i + 1 }}</span>
        </div>
        <div class="text-[11px] mt-1.5 whitespace-nowrap" :class="i <= curStep ? 'text-emerald-600 font-semibold' : 'text-slate-400'">{{ step }}</div>
      </div>
      <div v-if="i < steps.length - 1" class="flex-1 h-0.5 mx-1 -mt-5"
        :class="i < curStep ? 'bg-emerald-500' : 'bg-slate-200'"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ORDER_STEPS } from '../utils/format'
import { Check } from 'lucide-vue-next'

const props = defineProps({ status: { type: Number, required: true } })
const steps = ORDER_STEPS
// 状态 0->0步, 1->1步, 2->2步, 3->3步, 4->4步, 5(取消)->-1
const curStep = computed(() => props.status === 5 ? -1 : props.status)
</script>
