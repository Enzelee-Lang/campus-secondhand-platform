<template>
  <div class="max-w-5xl">
    <div class="flex items-center justify-between mb-5">
      <h2 class="text-xl font-bold text-slate-800">🛒 我的订单</h2>
      <div class="flex bg-white border border-slate-200 rounded-xl p-1">
        <button v-for="t in tabs" :key="t.key" @click="tab = t.key"
          class="px-4 py-1.5 rounded-lg text-sm font-medium transition"
          :class="tab === t.key ? 'bg-emerald-600 text-white shadow' : 'text-slate-500 hover:text-slate-700'">
          {{ t.label }}
        </button>
      </div>
    </div>

    <div v-if="filtered.length" class="space-y-4">
      <div v-for="o in filtered" :key="o.orderId" class="card p-5">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-3">
            <span class="text-xs text-slate-400">订单号</span>
            <span class="text-sm font-mono font-semibold text-slate-700">{{ o.orderNo }}</span>
          </div>
          <span class="tag" :class="ORDER_STATUS[o.status]?.cls">{{ ORDER_STATUS[o.status]?.label }}</span>
        </div>

        <OrderProgress :status="o.status" class="mb-4" />

        <div class="grid sm:grid-cols-2 gap-4 mb-4">
          <div class="flex items-center gap-3">
            <div class="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
              <img v-if="imgOf(o.itemId)" :src="imgOf(o.itemId)" class="w-full h-full object-cover" />
              <span v-else class="text-2xl">{{ emojiOf(o.itemId) }}</span>
            </div>
            <div class="min-w-0">
              <div class="font-medium text-slate-800 truncate">{{ titleOf(o.itemId) }}</div>
              <div class="text-[#e76f51] font-bold mt-1">{{ money(o.amount) }}</div>
              <div class="text-xs text-slate-400 mt-0.5">
                {{ roleLabel(o) }}：{{ nameOf(roleId(o)) }}
              </div>
            </div>
          </div>
          <div class="text-xs text-slate-500 space-y-1">
            <div>下单时间：{{ fmtTime(o.createTime) }}</div>
            <div v-if="o.shippingNo">物流单号：<span class="font-mono text-slate-700">{{ o.shippingNo }}</span></div>
            <div class="flex gap-2 mt-2">
              <router-link :to="`/item/${o.itemId}`" class="text-emerald-600 hover:underline">查看商品</router-link>
              <router-link :to="`/chat?item=${o.itemId}&peer=${roleId(o)}`" class="text-emerald-600 hover:underline">联系对方</router-link>
            </div>
          </div>
        </div>

        <!-- 操作按钮（仅在存在可操作按钮时渲染） -->
        <div v-if="o.status < 4 || (o.status === 5 && isBuyer(o))" class="flex items-center gap-2 pt-3 border-t border-slate-100">
          <template v-if="isBuyer(o)">
            <button v-if="o.status === 1" class="btn-primary !py-1.5 text-xs" :disabled="actingId === o.orderId" @click="openPay(o)">💳 立即支付</button>
            <button v-if="o.status === 3" class="btn-primary !py-1.5 text-xs" :disabled="actingId === o.orderId" @click="act(o, 'complete')">✅ 确认收货</button>
            <button v-if="o.status === 5" class="btn-primary !py-1.5 text-xs" @click="$router.push(`/item/${o.itemId}`)">🛒 重新下单</button>
          </template>
          <template v-else>
            <button v-if="o.status === 0" class="btn-primary !py-1.5 text-xs" :disabled="actingId === o.orderId" @click="act(o, 'confirm')">✓ 确认订单</button>
            <button v-if="o.status === 2" class="btn-primary !py-1.5 text-xs" :disabled="actingId === o.orderId" @click="openShipDialog(o)">📦 去发货</button>
          </template>
          <button v-if="o.status >= 0 && o.status < 4" class="btn-ghost !py-1.5 text-xs !text-rose-500" :disabled="actingId === o.orderId" @click="openCancel(o)">取消订单</button>
        </div>
      </div>
    </div>

    <div v-else class="card p-14 text-center">
      <div class="text-5xl mb-3">📦</div>
      <p class="text-slate-500 text-sm">暂无订单</p>
      <router-link to="/user/market" class="text-xs text-emerald-600 hover:underline mt-2 inline-block">去商品广场逛逛 →</router-link>
    </div>

    <!-- 发货弹窗 -->
    <div v-if="shipTarget" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 modal-backdrop" @click.self="shipTarget = null">
      <div class="card modal-panel w-full max-w-md p-6 shadow-xl">
        <h3 class="font-bold text-slate-800 mb-4">📦 填写物流单号</h3>
        <input v-model="shipNo" class="input" placeholder="请输入快递单号" />
        <div class="flex justify-end gap-2 mt-4">
          <button class="btn-ghost" @click="shipTarget = null">取消</button>
          <button class="btn-primary" :disabled="!shipNo.trim()" @click="doShip">确认发货</button>
        </div>
      </div>
    </div>

    <!-- 支付 / 取消 确认弹窗 -->
    <OrderActionDialog v-model:visible="payOpen" mode="pay" :order="payTarget" :busy="actingId != null" @confirm="doPay" />
    <OrderActionDialog v-model:visible="cancelOpen" mode="cancel" :order="cancelTarget" :busy="actingId != null" @confirm="doCancel" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../../store/auth'
import { orderApi, itemApi, userApi } from '../../api'
import { ORDER_STATUS, categoryStyle, categoryEmoji, money, fmtTime, parseFirstImage } from '../../utils/format'
import { toast } from '../../utils/toast'
import OrderProgress from '../../components/OrderProgress.vue'
import OrderActionDialog from '../../components/OrderActionDialog.vue'

const auth = useAuthStore()
const me = computed(() => auth.profileId)

const tabs = [
  { key: 'all', label: '全部' },
  { key: 'active', label: '进行中' },
  { key: 'done', label: '已完成' }
]
const tab = ref('all')
const orders = ref([])
const items = ref([])
const userMap = ref({})
const shipTarget = ref(null)
const shipNo = ref('')
const actingId = ref(null)
const payOpen = ref(false)
const cancelOpen = ref(false)
const payTarget = ref(null)
const cancelTarget = ref(null)

const filtered = computed(() => {
  let l = orders.value
  if (tab.value === 'active') l = l.filter(o => o.status >= 0 && o.status <= 3)
  if (tab.value === 'done') l = l.filter(o => o.status === 4 || o.status === 5)
  return l.slice().sort((a, b) => String(b.createTime || '').localeCompare(String(a.createTime || '')))
})

function titleOf(id) { return items.value.find(i => i.itemId === id)?.title || '商品#' + id }
function imgOf(id) {
  const it = items.value.find(i => i.itemId === id)
  const img = parseFirstImage(it?.images)
  return img || ''
}
function emojiOf(id) { return categoryEmoji(items.value.find(i => i.itemId === id)?.categoryId) }
function nameOf(id) { return userMap.value[Number(id)] || ('用户' + id) }
function isBuyer(o) { return Number(o.buyerId) === Number(me.value) }
function roleLabel(o) { return isBuyer(o) ? '卖家' : '买家' }
function roleId(o) { return isBuyer(o) ? o.sellerId : o.buyerId }

const ACTION_NOTIFY = {
  confirm: '已确认订单，等待买家支付',
  pay: '支付成功，等待卖家发货',
  ship: '已发货，等待买家确认收货',
  complete: '交易完成',
  cancel: '订单已取消'
}

function openPay(o) { payTarget.value = o; payOpen.value = true }
function openCancel(o) { cancelTarget.value = o; cancelOpen.value = true }
async function doPay() { if (payTarget.value) await act(payTarget.value, 'pay'); payOpen.value = false }
async function doCancel() { if (cancelTarget.value) await act(cancelTarget.value, 'cancel'); cancelOpen.value = false }

async function act(o, action) {
  if (actingId.value) return
  actingId.value = o.orderId
  try {
    await orderApi.status(o.orderId, action, me.value)
    toast(ACTION_NOTIFY[action] || '操作成功', 'success')
    await load()
  } catch (e) {
    toast(e?.response?.data?.message || '操作失败', 'error')
  } finally {
    actingId.value = null
  }
}
function openShipDialog(o) { shipTarget.value = o; shipNo.value = '' }
async function doShip() {
  if (!shipNo.value.trim()) return
  await orderApi.shipping(shipTarget.value.orderId, shipNo.value.trim()).catch(() => {})
  await act(shipTarget.value, 'ship')
  shipTarget.value = null
}

async function load() {
  // mine 接口一次返回买卖双方订单（替代原来的 buyer+seller 两次请求）
  const [mine, it, ul] = await Promise.all([
    orderApi.mine(me.value).catch(() => []),
    itemApi.list().catch(() => []),
    userApi.list().catch(() => [])
  ])
  orders.value = mine
  items.value = it
  const um = {}
  ul.forEach(u => { um[Number(u.userId)] = u.username })
  userMap.value = um
}

onMounted(load)
</script>
