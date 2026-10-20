<template>
  <div class="product-card anim-up"
    @click="$emit('open', item)">
    <!-- 封面 -->
    <div class="product-img relative">
      <img v-if="hasImage" :src="firstImage" :alt="item.title" />
      <div v-else class="w-full h-full flex items-center justify-center text-5xl" :style="{ background: style.bg }">{{ style.emoji }}</div>
      <!-- 成色角标 -->
      <span v-if="item.conditionLevel" class="product-badge" :class="'tag-' + CONDITION[item.conditionLevel]?.cls?.split('-')?.pop?.()">
        {{ CONDITION[item.conditionLevel]?.label || '' }}
      </span>
      <!-- 状态角标（仅卖家视角显示） -->
      <span v-if="showStatus && ITEM_STATUS[item.status]"
        class="absolute top-1.5 left-1.5 text-[10px] px-1.5 py-0.5 rounded font-medium"
        :class="ITEM_STATUS[item.status].cls">
        {{ ITEM_STATUS[item.status].label }}
      </span>
    </div>
    <!-- 信息 -->
    <div class="product-info">
      <div class="product-title">{{ item.title }}</div>
      <div class="product-price-row">
        <span class="product-price">{{ money(item.price) }}</span>
        <span v-if="item.originalPrice" class="product-original">{{ money(item.originalPrice) }}</span>
      </div>
      <div class="product-extra">
        <span>👁 {{ item.viewCount ?? 0 }}</span>
        <span>{{ fmtTime(item.createTime) }}</span>
      </div>
      <!-- 操作按钮槽（仅卖家的 MineView 用） -->
      <div v-if="$slots.actions" class="mt-2 flex gap-1.5" @click.stop>
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { CONDITION, ITEM_STATUS, categoryStyle, money, fmtTime, parseFirstImage } from '../utils/format'

const props = defineProps({
  item: { type: Object, required: true },
  showStatus: { type: Boolean, default: false }
})
defineEmits(['open'])

const style = computed(() => categoryStyle(props.item?.categoryId))
const firstImage = computed(() => parseFirstImage(props.item?.images))
const hasImage = computed(() => firstImage.value.length > 0)
</script>
