<template>
  <div class="min-h-screen bg-slate-100 flex flex-col">
    <!-- 顶栏 -->
    <header class="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div class="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
        <button @click="back" class="btn-ghost !p-1.5"><ArrowLeft class="w-5 h-5" /></button>
        <div class="flex-1 min-w-0">
          <div class="font-semibold text-slate-800 truncate">{{ peerName }}</div>
          <div class="text-xs text-slate-400">{{ item ? '商品沟通中' : '加载中…' }}</div>
        </div>
        <router-link v-if="item" :to="`/item/${item.itemId}`" class="text-xs text-emerald-600 hover:underline">查看商品</router-link>
      </div>
    </header>

    <!-- 商品信息栏（闲鱼风格） -->
    <div v-if="item" class="bg-white border-b border-slate-100">
      <div class="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
        <div class="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center shrink-0" :class="catStyle.bg">
          <img v-if="hasImage" :src="firstImage" class="w-full h-full object-cover" :alt="item.title" />
          <span v-else class="text-2xl">{{ catStyle.emoji }}</span>
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-sm text-slate-700 truncate">{{ item.title }}</div>
          <div class="flex items-center gap-2 mt-1">
            <span class="text-lg font-extrabold text-rose-600">{{ money(item.price) }}</span>
            <span v-if="item.originalPrice" class="text-xs text-slate-300 line-through">{{ money(item.originalPrice) }}</span>
            <span v-if="item.originalPrice" class="text-xs text-emerald-600">{{ discount }}折</span>
          </div>
        </div>
        <button v-if="!order && canBuy" class="shrink-0 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-semibold shadow-sm transition"
          :disabled="creating" @click="orderDialog = true">
          <span v-if="creating">下单中…</span><span v-else>立即购买</span>
        </button>
        <span v-else-if="order" class="shrink-0 tag" :class="ORDER_STATUS[order.status]?.cls">{{ ORDER_STATUS[order.status]?.label }}</span>
      </div>
    </div>

    <!-- 订单状态卡片 -->
    <div v-if="order" class="bg-white border-b border-slate-100">
      <div class="max-w-3xl mx-auto px-4 py-4">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm font-semibold text-slate-700">📦 订单 #{{ order.orderNo.slice(-8) }}</span>
          <span class="text-xs text-slate-400">下单时间 {{ fmtTime(order.createTime) }}</span>
        </div>
        <OrderProgress :status="order.status" />
        <!-- 下一步引导 -->
        <div v-if="nextHint" class="mt-3 flex items-start gap-2 text-xs rounded-xl px-3 py-2.5"
          :class="order.status === 5 ? 'bg-slate-50 text-slate-400' : 'bg-emerald-50 text-emerald-700'">
          <span class="shrink-0">{{ order.status === 5 ? 'ℹ️' : '👉' }}</span>
          <span>{{ nextHint }}</span>
        </div>
        <!-- 操作按钮（仅在存在可操作按钮时渲染） -->
        <div v-if="order.status < 4 || (order.status === 5 && isBuyer)" class="flex items-center gap-2 mt-3">
          <!-- 买家操作 -->
          <template v-if="isBuyer">
            <button v-if="order.status === 1" class="btn-primary !py-1.5 text-xs" :disabled="acting" @click="payOpen = true">💳 立即支付</button>
            <button v-if="order.status === 3" class="btn-primary !py-1.5 text-xs" :disabled="acting" @click="act('complete')">✅ 确认收货</button>
            <button v-if="order.status === 5" class="btn-primary !py-1.5 text-xs" @click="rebuy">🛒 重新下单</button>
          </template>
          <!-- 卖家操作 -->
          <template v-if="isSeller">
            <button v-if="order.status === 0" class="btn-primary !py-1.5 text-xs" :disabled="acting" @click="act('confirm')">✓ 确认订单</button>
            <button v-if="order.status === 2" class="btn-primary !py-1.5 text-xs" :disabled="acting" @click="openShip = true">📦 去发货</button>
          </template>
          <button v-if="order.status >= 0 && order.status < 4" class="btn-ghost !py-1.5 text-xs !text-rose-500" :disabled="acting" @click="cancelOpen = true">取消订单</button>
        </div>
      </div>
    </div>

    <!-- 发货弹窗 -->
    <div v-if="openShip" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 modal-backdrop" @click.self="openShip = false">
      <div class="card modal-panel w-full max-w-md p-6 shadow-xl">
        <h3 class="font-bold text-slate-800 mb-4">📦 填写物流单号</h3>
        <input v-model="shipNo" class="input" placeholder="请输入快递单号" />
        <div class="flex justify-end gap-2 mt-4">
          <button class="btn-ghost" @click="openShip = false">取消</button>
          <button class="btn-primary" :disabled="!shipNo.trim()" @click="doShip">确认发货</button>
        </div>
      </div>
    </div>

    <!-- 下单/支付/取消 确认弹窗 -->
    <OrderActionDialog v-model:visible="orderDialog" mode="create" :item="item" :busy="creating" @confirm="placeOrder" />
    <OrderActionDialog v-model:visible="payOpen" mode="pay" :order="order" :busy="acting" @confirm="act('pay')" />
    <OrderActionDialog v-model:visible="cancelOpen" mode="cancel" :order="order" :busy="acting" @confirm="act('cancel')" />

    <!-- 消息区 -->
    <div ref="msgBox" class="flex-1 overflow-y-auto">
      <div class="max-w-3xl mx-auto px-4 py-5 space-y-4">
        <!-- 加载态 -->
        <div v-if="loading" class="text-center text-xs text-slate-400 py-10">
          <div class="inline-block animate-spin w-5 h-5 border-2 border-slate-300 border-t-emerald-500 rounded-full align-middle mr-2"></div>
          正在加载聊天记录…
        </div>

        <!-- 空态 -->
        <div v-else-if="!messages.length" class="text-center py-16">
          <div class="text-5xl mb-3">💬</div>
          <p class="text-sm text-slate-400">还没有消息，先和卖家打个招呼吧</p>
        </div>

        <!-- 消息气泡 -->
        <template v-else>
          <div v-for="m in messages" :key="m.msgId" class="flex gap-2" :class="isMine(m) ? 'justify-end' : 'justify-start'">
            <!-- 对方头像 -->
            <div v-if="!isMine(m)" class="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-lg shrink-0">
              {{ peerEmoji }}
            </div>
            <div class="max-w-[70%]">
              <div class="px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm"
                :class="isMine(m)
                  ? 'bg-emerald-500 text-white rounded-br-md'
                  : 'bg-white text-slate-700 rounded-bl-md border border-slate-100'">
                {{ m.content }}
              </div>
              <div class="text-[10px] text-slate-300 mt-1 px-1" :class="isMine(m) ? 'text-right' : 'text-left'">
                {{ fmtTime(m.createTime) }}
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- 底部输入栏 -->
    <div class="bg-white border-t border-slate-200 sticky bottom-0 z-40">
      <div class="max-w-3xl mx-auto px-4 py-3 flex items-end gap-2">
        <textarea
          v-model="draft"
          rows="1"
          class="input flex-1 !py-2.5 resize-none max-h-28"
          placeholder="想跟TA说点什么…"
          @keydown.enter.exact.prevent="send"
          @input="autoResize"
          ref="taRef"
        ></textarea>
        <button class="btn-primary !px-5 !py-2.5 shrink-0" :disabled="sending || !draft.trim()" @click="send">
          <span v-if="sending" class="inline-block animate-spin w-4 h-4 border-2 border-white/40 border-t-white rounded-full align-middle mr-1"></span>
          发送
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../store/auth'
import { messageApi, itemApi, userApi, orderApi } from '../../api'
import { categoryStyle, money, fmtTime, ORDER_STATUS, parseFirstImage } from '../../utils/format'
import { toast } from '../../utils/toast'
import { ArrowLeft } from 'lucide-vue-next'
import OrderProgress from '../../components/OrderProgress.vue'
import OrderActionDialog from '../../components/OrderActionDialog.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const itemId = Number(route.query.item)
const peerId = Number(route.query.peer) // 对方用户ID
const me = computed(() => auth.profileId)

const item = ref(null)
const peer = ref(null)
const messages = ref([])
const loading = ref(true)
const sending = ref(false)
const draft = ref('')
const msgBox = ref(null)
const taRef = ref(null)
// 订单相关
const order = ref(null)
const creating = ref(false)
const acting = ref(false)
const openShip = ref(false)
const shipNo = ref('')
const orderDialog = ref(false)
const payOpen = ref(false)
const cancelOpen = ref(false)

// 下一步引导文案（按当前角色 + 订单状态）
const nextHint = computed(() => {
  if (!order.value) return ''
  const o = order.value
  const map = {
    0: isSeller.value ? '买家已下单，请尽快确认订单' : '订单已提交，等待卖家确认，可在下方与卖家沟通细节',
    1: isBuyer.value ? '卖家已确认，请点击「立即支付」完成付款' : '已确认订单，等待买家支付',
    2: isSeller.value ? '买家已付款，请尽快发货并填写物流单号' : '支付成功，等待卖家发货',
    3: isBuyer.value ? '卖家已发货，收到商品后请点击「确认收货」' : '已发货，等待买家确认收货',
    4: '交易已完成，别忘了给对方一个好评',
    5: '订单已取消，可点击「重新下单」再次购买'
  }
  return map[o.status] || ''
})

const isBuyer = computed(() => order.value && Number(order.value.buyerId) === Number(me.value))
const isSeller = computed(() => order.value && Number(order.value.sellerId) === Number(me.value))
const canBuy = computed(() => item.value && Number(item.value.userId) !== Number(me.value) && item.value.status === 1)

const peerName = computed(() => peer.value?.username || ('用户' + peerId))
const peerEmoji = computed(() => (peer.value?.username || '🙂').slice(0, 1))
const catStyle = computed(() => categoryStyle(item.value?.categoryId))
const firstImage = computed(() => parseFirstImage(item.value?.images))
const hasImage = computed(() => firstImage.value.length > 0)
const discount = computed(() => {
  if (!item.value?.originalPrice) return ''
  return ((Number(item.value.price) / Number(item.value.originalPrice)) * 10).toFixed(1)
})

function back() {
  if (window.history.length > 1) window.history.back()
  else router.push('/user/messages')
}
function isMine(m) { return Number(m.senderId) === Number(me.value) }

function scrollBottom() {
  nextTick(() => {
    if (msgBox.value) msgBox.value.scrollTop = msgBox.value.scrollHeight
  })
}
function autoResize() {
  const el = taRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 112) + 'px'
}

async function load() {
  loading.value = true
  try {
    const [it, u] = await Promise.all([
      itemApi.detail(itemId).catch(() => null),
      userApi.detail(peerId).catch(() => null)
    ])
    item.value = it
    peer.value = u

    // 合并收发件箱，过滤出「该商品 + 我与对方」之间的消息
    const [inbox, outbox] = await Promise.all([
      messageApi.inbox(me.value).catch(() => []),
      messageApi.outbox(me.value).catch(() => [])
    ])
    const all = [...inbox, ...outbox].filter(m =>
      Number(m.itemId) === itemId &&
      ((Number(m.senderId) === Number(me.value) && Number(m.receiverId) === peerId) ||
       (Number(m.senderId) === peerId && Number(m.receiverId) === Number(me.value)))
    )
    messages.value = all.sort((a, b) => String(a.createTime || '').localeCompare(String(b.createTime || '')))
    // 标记对方发来的未读消息为已读
    messages.value.forEach(m => {
      if (!isMine(m) && m.isRead === 0) {
        messageApi.markRead(m.msgId).catch(() => {})
        m.isRead = 1
      }
    })

    // 加载该商品的进行中订单
    await loadOrder()
  } finally {
    loading.value = false
    scrollBottom()
  }
}

async function send() {
  const content = draft.value.trim()
  if (!content || sending.value) return
  sending.value = true
  try {
    const sent = await messageApi.send({
      senderId: me.value,
      receiverId: peerId,
      itemId,
      content,
      msgType: 1
    })
    messages.value.push(sent)
    draft.value = ''
    autoResize()
    scrollBottom()
  } catch (e) {
    toast('发送失败，请重试', 'error')
  } finally {
    sending.value = false
  }
}

// 快捷「立即购买」：发送购买意向消息
function quickBuy() {
  draft.value = '你好，这件商品还在吗？我想购买，请问怎么交易？'
  autoResize()
  taRef.value?.focus()
  toast('已为你填入购买意向，点击发送即可', 'info')
}

// ===== 订单逻辑 =====
async function loadOrder() {
  // 一次拉取买卖双方订单，取该商品最近一笔
  const all = await orderApi.mine(me.value).catch(() => [])
  const prevStatus = order.value?.status
  const list = all.filter(o => Number(o.itemId) === itemId)
  // 取最近的非取消订单；若最近一笔是已取消且无其他单，也展示（含重新下单入口）
  const active = list.filter(o => o.status !== 5)
  const next = (active[0] || list[0]) || null
  order.value = next
  // 状态变化时提示（如对方已确认/已发货）
  if (next && prevStatus != null && next.status !== prevStatus) {
    toast(ORDER_STATUS[next.status]?.label ? `订单状态更新：${ORDER_STATUS[next.status].label}` : '订单状态已更新', 'success')
  }
}

async function refreshOrderSilently() {
  if (!order.value) return
  const o = await orderApi.detail(order.value.orderId).catch(() => null)
  if (!o) return
  const prev = order.value.status
  order.value = o
  if (o.status !== prev) {
    toast(ORDER_STATUS[o.status]?.label ? `订单状态更新：${ORDER_STATUS[o.status].label}` : '订单状态已更新', 'success')
  }
}

async function placeOrder() {
  if (creating.value) return
  creating.value = true
  try {
    const o = await orderApi.create({ itemId, buyerId: me.value, sellerId: peerId })
    order.value = o
    orderDialog.value = false
    toast('下单成功，等待卖家确认', 'success')
    // 自动发一条系统消息
    await messageApi.send({
      senderId: me.value, receiverId: peerId, itemId,
      content: `我已下单购买「${item.value.title}」，订单号 ${o.orderNo}，请确认。`,
      msgType: 1
    }).catch(() => {})
  } catch (e) {
    toast(e?.response?.data?.message || '下单失败', 'error')
  } finally { creating.value = false }
}

// 已取消订单 → 重新下单
function rebuy() {
  order.value = null
  orderDialog.value = true
}

const ACTION_NOTIFY = {
  confirm: '卖家已确认订单，请尽快支付',
  pay: '买家已支付，请尽快发货',
  ship: '卖家已发货，请注意查收',
  complete: '交易已完成，感谢您的使用',
  cancel: '订单已取消'
}
async function act(action) {
  if (!order.value || acting.value) return
  acting.value = true
  try {
    const o = await orderApi.status(order.value.orderId, action, me.value)
    order.value = o
    payOpen.value = false
    cancelOpen.value = false
    toast(ACTION_NOTIFY[action] || '操作成功', 'success')
    // 状态变更通知对方
    await messageApi.send({
      senderId: me.value, receiverId: peerId, itemId,
      content: `【订单通知】${ACTION_NOTIFY[action]}（订单 ${o.orderNo}）`,
      msgType: 1
    }).catch(() => {})
  } catch (e) {
    toast(e?.response?.data?.message || '操作失败', 'error')
  } finally { acting.value = false }
}

async function doShip() {
  if (!shipNo.value.trim()) return
  await orderApi.shipping(order.value.orderId, shipNo.value.trim()).catch(() => {})
  await act('ship')
  openShip.value = false
  shipNo.value = ''
}

onMounted(load)

// 定时刷新（5秒轮询）：接收新消息 + 同步订单状态（对方确认/支付/发货后本端即时可见）
let timer = null
onMounted(() => {
  timer = setInterval(async () => {
    if (!item.value) return
    const [inbox, outbox] = await Promise.all([
      messageApi.inbox(me.value).catch(() => []),
      messageApi.outbox(me.value).catch(() => [])
    ])
    const all = [...inbox, ...outbox].filter(m =>
      Number(m.itemId) === itemId &&
      ((Number(m.senderId) === Number(me.value) && Number(m.receiverId) === peerId) ||
       (Number(m.senderId) === peerId && Number(m.receiverId) === Number(me.value)))
    ).sort((a, b) => String(a.createTime || '').localeCompare(String(b.createTime || '')))
    const oldIds = new Set(messages.value.map(m => m.msgId))
    let changed = false
    all.forEach(m => { if (!oldIds.has(m.msgId)) { messages.value.push(m); changed = true } })
    if (changed) scrollBottom()
    // 订单状态同步
    refreshOrderSilently()
  }, 5000)
})
onUnmounted(() => { if (timer) clearInterval(timer) })
</script>

<style scoped>
textarea { min-height: 40px; line-height: 1.5; }
</style>
