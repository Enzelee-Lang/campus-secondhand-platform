<template>
  <!-- 订单操作确认弹窗：create=下单确认 / pay=支付确认 / cancel=取消确认 -->
  <Teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" @click.self="close">
      <div class="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden animate-[popIn_.22s_ease-out]">

        <!-- ===== 下单确认 ===== -->
        <template v-if="mode === 'create'">
          <div class="px-6 pt-5 pb-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-b border-emerald-100">
            <h3 class="font-bold text-slate-800 text-base">确认购买</h3>
            <p class="text-xs text-slate-400 mt-1">请核对商品信息，下单后等待卖家确认</p>
          </div>
          <div class="px-6 py-4 flex items-center gap-3" v-if="item">
            <div class="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
              <img v-if="firstImage" :src="firstImage" class="w-full h-full object-cover" :alt="item.title" />
              <span v-else class="text-3xl">{{ catStyle.emoji }}</span>
            </div>
            <div class="min-w-0 flex-1">
              <div class="text-sm font-medium text-slate-800 truncate">{{ item.title }}</div>
              <div class="text-xs text-slate-400 mt-0.5">成色 {{ conditionLabel }}</div>
              <div class="text-lg font-extrabold text-[#e76f51] mt-1">{{ money(item.price) }}</div>
            </div>
          </div>
          <div class="px-6 pb-2 space-y-2.5">
            <div class="text-xs font-semibold text-slate-500">交易方式</div>
            <div class="grid grid-cols-2 gap-2">
              <button v-for="t in tradeTypes" :key="t.key" type="button"
                class="rounded-xl border-2 p-3 text-left transition"
                :class="tradeType === t.key ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'"
                @click="tradeType = t.key">
                <div class="text-lg leading-none">{{ t.icon }}</div>
                <div class="text-sm font-medium mt-1.5" :class="tradeType === t.key ? 'text-emerald-700' : 'text-slate-700'">{{ t.label }}</div>
                <div class="text-[10px] text-slate-400 mt-0.5">{{ t.desc }}</div>
              </button>
            </div>
            <div class="bg-slate-50 rounded-xl p-3 text-xs text-slate-500 flex items-start gap-2">
              <span class="shrink-0">🛡️</span>
              <span>平台提醒：请当面验货后再付款，切勿提前转账给陌生人</span>
            </div>
          </div>
        </template>

        <!-- ===== 支付确认 ===== -->
        <template v-else-if="mode === 'pay'">
          <div class="px-6 pt-6 pb-4 text-center bg-gradient-to-br from-emerald-50 to-teal-50 border-b border-emerald-100">
            <p class="text-xs text-slate-400">订单 {{ orderNoShort }}</p>
            <div class="text-4xl font-extrabold text-slate-800 mt-2 tracking-tight">{{ money(order?.amount) }}</div>
          </div>
          <div class="px-6 py-4 space-y-2.5">
            <div class="text-xs font-semibold text-slate-500">选择支付方式</div>
            <button v-for="p in payChannels" :key="p.key" type="button"
              class="w-full flex items-center gap-3 rounded-xl border-2 px-4 py-3 transition"
              :class="payChannel === p.key ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'"
              @click="payChannel = p.key">
              <span class="text-xl leading-none">{{ p.icon }}</span>
              <span class="text-sm font-medium flex-1 text-left" :class="payChannel === p.key ? 'text-emerald-700' : 'text-slate-700'">{{ p.label }}</span>
              <span class="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                :class="payChannel === p.key ? 'border-emerald-500' : 'border-slate-300'">
                <span v-if="payChannel === p.key" class="w-2 h-2 rounded-full bg-emerald-500"></span>
              </span>
            </button>
            <div class="bg-emerald-50 rounded-xl p-3 text-xs text-emerald-700 flex items-start gap-2">
              <span class="shrink-0">💡</span>
              <span>模拟支付环境，点击确认支付即完成付款，款项由平台担保直至确认收货</span>
            </div>
          </div>
        </template>

        <!-- ===== 取消确认 ===== -->
        <template v-else>
          <div class="px-6 pt-6 pb-2 text-center">
            <div class="w-12 h-12 mx-auto rounded-full bg-rose-50 flex items-center justify-center text-2xl">⚠️</div>
            <h3 class="font-bold text-slate-800 mt-3">确认取消订单？</h3>
            <p class="text-xs text-slate-400 mt-1.5 leading-relaxed">订单 {{ orderNoShort }} 取消后不可恢复<br/>如非必要请与对方先沟通</p>
          </div>
        </template>

        <!-- 底部按钮 -->
        <div class="px-6 py-4 flex gap-2.5">
          <button class="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition" @click="close">再想想</button>
          <button class="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold shadow-md transition disabled:opacity-60 disabled:cursor-not-allowed"
            :class="mode === 'cancel' ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/25' : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-500/25'"
            :disabled="busy" @click="confirm">
            <span v-if="busy" class="inline-block animate-spin w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full align-middle mr-1"></span>
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { CONDITION, categoryStyle, money, parseFirstImage } from '../utils/format'

const props = defineProps({
  visible: Boolean,
  mode: String,            // 'create' | 'pay' | 'cancel'
  item: Object,            // 下单确认时必传
  order: Object,           // 支付/取消时传
  busy: Boolean
})
const emit = defineEmits(['close', 'confirm', 'update:visible'])

const tradeType = ref('meet')
const payChannel = ref('campus')
const tradeTypes = [
  { key: 'meet', icon: '🤝', label: '校内面交', desc: '当面验货 · 零运费' },
  { key: 'express', icon: '📦', label: '快递寄送', desc: '站点自提 · 顺风到付' }
]
const payChannels = [
  { key: 'campus', icon: '🎒', label: '校园卡支付' },
  { key: 'wechat', icon: '💚', label: '微信支付' },
  { key: 'alipay', icon: '💙', label: '支付宝' }
]

const catStyle = computed(() => categoryStyle(props.item?.categoryId))
const firstImage = computed(() => parseFirstImage(props.item?.images))
const conditionLabel = computed(() => CONDITION[props.item?.conditionLevel]?.label || '-')
const orderNoShort = computed(() => props.order?.orderNo ? '#' + props.order.orderNo.slice(-8) : '')
const confirmText = computed(() => ({ create: '确认下单', pay: '确认支付', cancel: '确认取消' }[props.mode] || '确定'))

watch(() => props.visible, v => {
  if (v && props.mode === 'pay') payChannel.value = 'campus'
  if (v && props.mode === 'create') tradeType.value = 'meet'
})

function close() { emit('update:visible', false); emit('close') }
function confirm() {
  if (props.busy) return
  emit('confirm', { tradeType: tradeType.value, payChannel: payChannel.value })
}
</script>
