<template>
  <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" @click.self="close">
    <div class="card w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
      <!-- 头部 -->
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-bold text-slate-800">💰 修改价格</h3>
        <button class="text-slate-400 hover:text-slate-600 text-xl leading-none" @click="close">×</button>
      </div>

      <!-- 商品信息 -->
      <div class="bg-slate-50 rounded-lg p-3 mb-4 flex items-center gap-3">
        <img v-if="itemImage" :src="itemImage" class="w-14 h-14 rounded-lg object-cover" :alt="item?.title" />
        <div class="min-w-0 flex-1">
          <div class="font-semibold text-slate-700 text-sm line-clamp-1">{{ item?.title }}</div>
          <div class="text-xs text-slate-400 mt-0.5">当前售价：<span class="text-rose-600 font-bold">{{ money(item?.price) }}</span></div>
        </div>
      </div>

      <!-- 改价表单 -->
      <form @submit.prevent="submit" class="space-y-4">
        <div>
          <label class="text-xs text-slate-500">新价格 <span class="text-rose-500">*</span></label>
          <div class="relative mt-1">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">¥</span>
            <input
              v-model="form.newPrice"
              type="number"
              min="0.01"
              step="0.01"
              class="input pl-7"
              placeholder="请输入新价格"
              :class="{ 'border-rose-400': priceError }"
              @input="validatePrice"
            />
          </div>
          <p v-if="priceError" class="text-xs text-rose-500 mt-1">{{ priceError }}</p>
          <p v-else class="text-xs text-slate-400 mt-1">须为大于 0 的数字，最多两位小数，且不能与原价相同</p>
        </div>

        <div>
          <label class="text-xs text-slate-500">改价原因（选填）</label>
          <input v-model="form.remark" maxlength="200" class="input mt-1" placeholder="例如：换季促销、议价调整等" />
        </div>

        <div class="flex gap-2 pt-2">
          <button type="button" class="btn-outline flex-1" @click="close">取消</button>
          <button type="submit" class="btn-primary flex-1" :disabled="!canSubmit || submitting">
            <Loader2 v-if="submitting" class="w-4 h-4 animate-spin inline" />
            {{ submitting ? '提交中…' : '确认改价' }}
          </button>
        </div>
      </form>

      <!-- 价格修改历史 -->
      <div class="mt-6 pt-4 border-t border-slate-100">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-semibold text-slate-600">📜 改价历史</span>
          <button class="text-xs text-blue-600 hover:underline" @click="loadHistory" :disabled="loadingHistory">
            <Loader2 v-if="loadingHistory" class="w-3 h-3 animate-spin inline" />刷新
          </button>
        </div>
        <div v-if="loadingHistory && !history.length" class="text-center text-xs text-slate-400 py-4">加载中…</div>
        <div v-else-if="!history.length" class="text-center text-xs text-slate-400 py-4">暂无改价记录</div>
        <div v-else class="space-y-2 max-h-56 overflow-y-auto">
          <div v-for="h in history" :key="h.id" class="bg-slate-50 rounded-lg px-3 py-2 text-xs">
            <div class="flex items-center justify-between">
              <span class="text-slate-600">
                <span class="line-through text-slate-400">{{ money(h.oldPrice) }}</span>
                <span class="mx-1.5 text-slate-400">→</span>
                <span class="text-rose-600 font-bold">{{ money(h.newPrice) }}</span>
              </span>
              <span class="text-slate-400">{{ fmtTime(h.createTime) }}</span>
            </div>
            <div v-if="h.remark" class="text-slate-500 mt-1">备注：{{ h.remark }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { itemApi } from '../api'
import { useAuthStore } from '../store/auth'
import { toast } from '../utils/toast'
import { money, fmtTime, parseFirstImage } from '../utils/format'
import { Loader2 } from 'lucide-vue-next'

const props = defineProps({
  visible: { type: Boolean, default: false },
  item: { type: Object, default: null }
})
const emit = defineEmits(['update:visible', 'success'])

const auth = useAuthStore()

const form = reactive({ newPrice: '', remark: '' })
const priceError = ref('')
const submitting = ref(false)
const history = ref([])
const loadingHistory = ref(false)

const itemImage = computed(() => parseFirstImage(props.item?.images))

const canSubmit = computed(() => {
  const v = Number(form.newPrice)
  return !priceError.value && v > 0 && !submitting.value
})

function validatePrice() {
  const raw = form.newPrice
  priceError.value = ''
  if (raw === '' || raw === null) {
    priceError.value = '请输入新价格'
    return
  }
  const v = Number(raw)
  if (!Number.isFinite(v)) {
    priceError.value = '请输入有效数字'
    return
  }
  if (v <= 0) {
    priceError.value = '价格必须大于 0'
    return
  }
  // 最多两位小数
  const parts = String(raw).split('.')
  if (parts.length === 2 && parts[1].length > 2) {
    priceError.value = '价格最多保留两位小数'
    return
  }
  // 不能与原价相同
  if (props.item?.price != null && v === Number(props.item.price)) {
    priceError.value = '新价格与原价相同，无需修改'
    return
  }
}

async function loadHistory() {
  if (!props.item?.itemId) return
  loadingHistory.value = true
  try {
    history.value = await itemApi.priceHistory(props.item.itemId) || []
  } catch {
    history.value = []
  } finally {
    loadingHistory.value = false
  }
}

async function submit() {
  validatePrice()
  if (!canSubmit.value) return
  submitting.value = true
  try {
    await itemApi.changePrice(props.item.itemId, {
      newPrice: Number(form.newPrice).toFixed(2),
      changedBy: auth.profileId,
      isAdmin: auth.isAdmin,
      remark: form.remark || null
    })
    toast('价格修改成功', 'success')
    emit('success', props.item)
    close()
  } catch (e) {
    // 错误已由 axios 拦截器统一 toast，此处仅兜底
    toast(e?.message || '改价失败，请稍后重试', 'error')
  } finally {
    submitting.value = false
  }
}

function close() {
  emit('update:visible', false)
}

// 弹窗打开时初始化表单并加载历史
watch(() => props.visible, (v) => {
  if (v) {
    form.newPrice = ''
    form.remark = ''
    priceError.value = ''
    history.value = []
    loadHistory()
  }
})
</script>
