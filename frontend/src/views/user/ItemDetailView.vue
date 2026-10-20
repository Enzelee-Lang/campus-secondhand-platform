<template>
  <div class="min-h-screen bg-slate-100">
    <!-- 顶栏 -->
    <header class="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <button @click="back" class="btn-ghost !py-1.5"><ArrowLeft class="w-4 h-4" />返回</button>
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-sm shadow">🛍️</span>
            <span class="font-bold text-slate-800">旧易货 · 商品详情</span>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <router-link :to="auth.homeFor(auth.role)" class="text-sm text-slate-500 hover:text-emerald-600">工作台</router-link>
          <span class="text-xs text-slate-300">|</span>
          <span class="text-sm text-slate-600">{{ auth.avatar }} {{ auth.displayName }}</span>
        </div>
      </div>
    </header>

    <main v-if="item" class="max-w-6xl mx-auto px-6 py-6">
      <div class="grid lg:grid-cols-5 gap-6 items-start">
        <!-- 左：图片 + 描述 + 评价 -->
        <div class="lg:col-span-3 space-y-6">
          <!-- 封面 -->
          <div class="card overflow-hidden">
            <div class="aspect-[4/3] flex items-center justify-center" :class="catStyle.bg">
              <img v-if="hasImage" :src="firstImage" class="w-full h-full object-cover" :alt="item.title" />
              <span v-else class="text-[9rem] select-none">{{ catStyle.emoji }}</span>
            </div>
          </div>

          <!-- 商品描述 -->
          <div class="card p-6">
            <h3 class="font-bold text-slate-800 mb-3">📝 商品描述</h3>
            <p class="text-slate-600 text-sm leading-7 whitespace-pre-wrap">{{ item.description || '卖家很懒，没有填写描述~' }}</p>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 text-xs">
              <div class="bg-slate-50 rounded-lg p-3">
                <div class="text-slate-400 mb-1">商品编号</div>
                <div class="font-medium text-slate-700">#{{ item.itemId }}</div>
              </div>
              <div class="bg-slate-50 rounded-lg p-3">
                <div class="text-slate-400 mb-1">成色</div>
                <div class="font-medium text-slate-700">{{ CONDITION[item.conditionLevel]?.label || '-' }}</div>
              </div>
              <div class="bg-slate-50 rounded-lg p-3">
                <div class="text-slate-400 mb-1">浏览</div>
                <div class="font-medium text-slate-700">{{ item.viewCount ?? 0 }} 次</div>
              </div>
              <div class="bg-slate-50 rounded-lg p-3">
                <div class="text-slate-400 mb-1">发布时间</div>
                <div class="font-medium text-slate-700">{{ fmtTime(item.createTime) }}</div>
              </div>
            </div>
          </div>

          <!-- 商品评价 -->
          <div class="card p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-slate-800">💬 买家评价（{{ itemReviews.length }}）</h3>
              <span v-if="avgRating > 0" class="text-sm text-amber-500 font-semibold">★ {{ avgRating.toFixed(1) }} 分</span>
            </div>
            <div v-if="itemReviews.length" class="space-y-4">
              <div v-for="r in itemReviews" :key="r.reviewId" class="border-b border-slate-100 pb-4 last:border-0">
                <div class="flex items-center gap-2">
                  <span class="text-lg">{{ reviewerName(r.reviewerId) }}</span>
                  <span class="flex text-amber-400 text-sm">
                    <span v-for="s in 5" :key="s" :class="s <= (r.rating || 0) ? '' : 'opacity-20'">★</span>
                  </span>
                  <span class="text-xs text-slate-300">{{ fmtTime(r.createTime) }}</span>
                </div>
                <p class="text-sm text-slate-600 mt-2">{{ r.content }}</p>
                <p v-if="r.reply" class="text-xs mt-2 pl-3 border-l-2 border-emerald-200 text-emerald-700">卖家回复：{{ r.reply }}</p>
                <!-- 卖家回复入口：仅商品所有者可见且该评价尚未回复时显示 -->
                <template v-if="isOwner && !r.reply">
                  <div v-if="replyingId !== r.reviewId" class="mt-2">
                    <button class="text-xs text-emerald-500 hover:text-emerald-700" @click="startReply(r)">回复</button>
                  </div>
                  <div v-else class="mt-2 flex gap-2">
                    <input v-model="replyText" class="input flex-1 !py-1.5" placeholder="回复买家的评价…" @keyup.enter="submitReply(r)" />
                    <button class="btn-primary !py-1.5" @click="submitReply(r)">发送</button>
                    <button class="btn-ghost !py-1.5" @click="cancelReply">取消</button>
                  </div>
                </template>
              </div>
            </div>
            <div v-else class="text-sm text-slate-400 py-4 text-center">还没有人评价，交易后记得给个好评哦</div>

            <!-- 发表评价 -->
            <form v-if="canInteract" @submit.prevent="submitReview" class="mt-5 bg-slate-50 rounded-xl p-4 space-y-3">
              <div class="flex items-center gap-3">
                <span class="text-sm text-slate-500">给卖家的评分：</span>
                <div class="flex gap-1">
                  <button v-for="s in 5" :key="s" type="button" @click="reviewForm.rating = s"
                    class="text-2xl transition hover:scale-110" :class="s <= reviewForm.rating ? 'text-amber-400' : 'text-slate-300'">★</button>
                </div>
              </div>
              <textarea v-model="reviewForm.content" rows="2" class="input" placeholder="说说这次交易的体验（商品是否与描述一致、沟通是否顺畅…）"></textarea>
              <div class="flex justify-end">
                <button type="submit" class="btn-primary !py-1.5">提交评价</button>
              </div>
            </form>
          </div>

          <!-- 卖家收到的评价 -->
          <div class="card p-6">
            <h3 class="font-bold text-slate-800 mb-4">🤝 卖家的信用评价（{{ sellerReviews.length }}）</h3>
            <div v-if="sellerReviews.length" class="space-y-3">
              <div v-for="r in sellerReviews" :key="r.reviewId" class="text-sm">
                <span class="font-medium text-slate-600">{{ reviewerName(r.reviewerId) }}</span>
                <span class="text-amber-400 mx-1">★ {{ r.rating }}</span>
                <span class="text-slate-500">：{{ r.content }}</span>
              </div>
            </div>
            <div v-else class="text-sm text-slate-400 py-2 text-center">暂无评价</div>
          </div>
        </div>

        <!-- 右：购买面板 + 卖家 -->
        <div class="lg:col-span-2 space-y-5 lg:sticky lg:top-24">
          <div class="card p-6 shadow-lg shadow-slate-200/50">
            <div class="flex items-center gap-2 mb-2">
              <span class="tag" :class="ITEM_STATUS[item.status]?.cls || ''">{{ ITEM_STATUS[item.status]?.label || '未知状态' }}</span>
              <span v-if="item.conditionLevel" class="tag" :class="CONDITION[item.conditionLevel]?.cls || ''">{{ CONDITION[item.conditionLevel]?.label }}</span>
              <span class="tag bg-slate-100 text-slate-500">{{ categoryName }}</span>
            </div>
            <h1 class="text-xl font-bold text-slate-800 leading-snug">{{ item.title }}</h1>
            <div class="flex items-end gap-2 mt-3">
              <span class="text-3xl font-extrabold text-[#e76f51] tracking-tight">{{ money(item.price) }}</span>
              <span v-if="item.originalPrice" class="text-sm text-slate-300 line-through mb-1">{{ money(item.originalPrice) }}</span>
              <span v-if="item.originalPrice" class="text-xs text-emerald-600 mb-1.5 bg-emerald-50 px-1.5 py-0.5 rounded">{{ discount }}折</span>
            </div>

            <template v-if="canInteract">
              <div class="space-y-2.5 mt-5">
                <button class="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold shadow-md shadow-emerald-500/30 hover:shadow-lg hover:-translate-y-0.5 transition duration-200 flex items-center justify-center gap-2"
                  :disabled="buying" @click="openOrderDialog">
                  <ShoppingCart class="w-4 h-4" />
                  <span v-if="buying">处理中…</span><span v-else>立即购买</span>
                </button>
                <button class="btn-primary w-full" @click="goChat"><MessageCircle class="w-4 h-4" />联系卖家</button>
                <button class="btn-outline w-full" :class="isFav ? 'text-rose-600 border-rose-300 bg-rose-50' : ''" @click="toggleFav">
                  <Heart class="w-4 h-4" :fill="isFav ? 'currentColor' : 'none'" />{{ isFav ? '已收藏' : '收藏宝贝' }}
                </button>
              </div>
              <button class="w-full text-center text-xs text-slate-300 hover:text-rose-500 mt-3 transition" @click="reportOpen = true">
                🚩 举报该商品
              </button>
            </template>
            <div v-else-if="isOwner" class="mt-5 bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
              <p class="text-sm text-emerald-700">这是你发布的商品</p>
              <router-link to="/user/mine" class="text-xs text-emerald-500 hover:underline mt-1 inline-block">去「我的」管理它 →</router-link>
            </div>
            <div v-else class="mt-5 bg-slate-50 rounded-xl p-4 text-center text-sm text-slate-400">
              管理员浏览模式 · 管理操作请在后台进行
            </div>
          </div>

          <!-- 卖家卡片 -->
          <div class="card p-6">
            <div class="text-xs text-slate-400 mb-3">卖家信息</div>
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-2xl shrink-0">{{ sellerEmoji }}</div>
              <div class="min-w-0">
                <div class="font-semibold text-slate-800 truncate">{{ seller?.username || '未知用户' }}</div>
                <div class="text-xs text-slate-400 mt-0.5">{{ seller?.schoolName || '未填学校' }} · {{ seller?.studentId || '未填学号' }}</div>
                <div v-if="seller?.phone" class="text-xs text-emerald-600 mt-0.5 flex items-center gap-1">
                  📱 {{ seller.phone }}
                </div>
              </div>
              <div class="ml-auto text-right">
                <div class="text-amber-500 font-bold text-lg leading-none">{{ sellerRating ? sellerRating.toFixed(1) : '—' }}</div>
                <div class="text-[10px] text-slate-400 mt-1">信用评分</div>
              </div>
            </div>
            <div v-if="sellerOther.length" class="mt-4 pt-4 border-t border-slate-100">
              <div class="text-xs text-slate-400 mb-2">TA 的其他在售</div>
              <div class="space-y-2">
                <router-link v-for="o in sellerOther" :key="o.itemId" :to="`/item/${o.itemId}`"
                  class="flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 p-2 rounded-lg hover:bg-slate-50">
                  <span>{{ categoryEmoji(o.categoryId) }}</span>
                  <span class="flex-1 truncate">{{ o.title }}</span>
                  <span class="text-[#e76f51] font-semibold text-xs">{{ money(o.price) }}</span>
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <main v-else class="max-w-6xl mx-auto px-6 py-24 text-center">
      <div class="text-6xl mb-4">😢</div>
      <p class="text-slate-500">商品不存在或已被删除</p>
      <button class="btn-primary mt-6" @click="back">返回上一页</button>
    </main>

    <!-- 下单确认弹窗 -->
    <OrderActionDialog v-model:visible="orderDialog" mode="create" :item="item" :busy="buying" @confirm="buyNow" />

    <!-- 举报弹窗 -->
    <div v-if="reportOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 modal-backdrop" @click.self="reportOpen = false">
      <div class="card modal-panel w-full max-w-md p-6 shadow-xl">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-slate-800">🚩 举报该商品</h3>
          <button class="text-slate-400 hover:text-slate-600 transition-transform hover:rotate-90 duration-300" @click="reportOpen = false"><X class="w-5 h-5" /></button>
        </div>
        <div class="space-y-3">
          <select v-model="reportForm.reason" class="input">
            <option value="">请选择举报原因</option>
            <option v-for="r in REPORT_REASONS" :key="r" :value="r">{{ r }}</option>
          </select>
          <textarea v-model="reportForm.evidence" rows="3" class="input" placeholder="补充说明（可选），如与描述不符的具体细节"></textarea>
        </div>
        <div class="flex justify-end gap-2 mt-4">
          <button class="btn-ghost" @click="reportOpen = false">取消</button>
          <button class="btn-primary !bg-rose-600 hover:!bg-rose-700" :disabled="sending || !reportForm.reason" @click="submitReport">提交举报</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../store/auth'
import { itemApi, userApi, categoryApi, reviewApi, favoriteApi, messageApi, reportApi, orderApi } from '../../api'
import { CONDITION, ITEM_STATUS, categoryStyle, categoryEmoji, money, fmtTime, parseFirstImage } from '../../utils/format'
import { toast } from '../../utils/toast'
import { ArrowLeft, MessageCircle, Heart, X, ShoppingCart } from 'lucide-vue-next'
import OrderActionDialog from '../../components/OrderActionDialog.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const itemId = Number(route.params.id)
const item = ref(null)
const seller = ref(null)
const categories = ref([])
const userMap = ref({})
const itemReviews = ref([])
const sellerReviews = ref([])
const favorites = ref([])
const sellerOther = ref([])

const isFav = computed(() => !!favorites.value.find(f => f.itemId === itemId))
const isOwner = computed(() => auth.profileId != null && item.value && Number(auth.profileId) === Number(item.value.userId))
const canInteract = computed(() => auth.role === 'user' && !isOwner.value && item.value?.status === 1)
const catStyle = computed(() => categoryStyle(item.value?.categoryId))
const categoryName = computed(() => categories.value.find(c => c.categoryId === item.value?.categoryId)?.name || '未分类')
const sellerEmoji = computed(() => (seller.value?.username || '').slice(0, 1) || '🙂')
const firstImage = computed(() => parseFirstImage(item.value?.images))
const hasImage = computed(() => firstImage.value.length > 0)
const avgRating = computed(() => itemReviews.value.length ? itemReviews.value.reduce((s, r) => s + (r.rating || 0), 0) / itemReviews.value.length : 0)
const sellerRating = computed(() => sellerReviews.value.length ? sellerReviews.value.reduce((s, r) => s + (r.rating || 0), 0) / sellerReviews.value.length : 0)
const discount = computed(() => {
  if (!item.value?.originalPrice) return ''
  return ((Number(item.value.price) / Number(item.value.originalPrice)) * 10).toFixed(1)
})

const reportOpen = ref(false)
const sending = ref(false)
const buying = ref(false)
const reviewForm = ref({ rating: 5, content: '' })
const reportForm = ref({ reason: '', evidence: '' })
const replyingId = ref(null)
const replyText = ref('')
const REPORT_REASONS = ['商品与描述不符', '虚假信息 / 诱导交易', '违规违禁物品', '其他问题']

function back() {
  if (window.history.length > 1) window.history.back()
  else router.push('/user/home')
}
function goItem(i) { router.push(`/item/${i.itemId}`) }
function reviewerName(id) { return userMap.value[Number(id)] || '用户' + id }

async function load() {
  // 基础数据并行拉取
  await Promise.all([
    categoryApi.list().then(l => { categories.value = l }).catch(() => {}),
    userApi.list().then(list => {
      const m = {}
      list.forEach(u => { m[Number(u.userId)] = u.username })
      userMap.value = m
    }).catch(() => {})
  ])

  const detail = await itemApi.detail(itemId).catch(() => null)
  if (!detail) { item.value = null; return }
  item.value = detail
  const sellerId = detail.userId

  const jobs = [
    reviewApi.byItem(itemId).then(l => { itemReviews.value = l }).catch(() => {}),
    userApi.detail(sellerId).then(u => { seller.value = u }).catch(() => {})
  ]
  if (auth.role === 'user' && auth.profileId != null) {
    jobs.push(favoriteApi.byUser(auth.profileId).then(l => { favorites.value = l }).catch(() => {}))
  }
  if (sellerId) {
    jobs.push(reviewApi.byTarget(sellerId).then(l => { sellerReviews.value = l }).catch(() => {}))
    jobs.push(itemApi.byUser(sellerId).then(l => {
      sellerOther.value = l.filter(i => i.status === 1 && i.itemId !== itemId).slice(0, 4)
    }).catch(() => {}))
  }
  await Promise.all(jobs)
}

async function toggleFav() {
  const me = auth.profileId
  if (isFav.value) {
    await favoriteApi.remove(me, itemId).catch(() => {})
    favorites.value = favorites.value.filter(f => !(f.userId === me && f.itemId === itemId))
    toast('已取消收藏', 'info')
  } else {
    await favoriteApi.add({ userId: me, itemId }).catch(() => {})
    favorites.value.push({ userId: me, itemId })
    toast('收藏成功', 'success')
  }
}

function goChat() {
  router.push({ path: '/chat', query: { item: itemId, peer: item.value.userId } })
}

// 立即购买：弹出确认层 → 创建真实订单 → 引导进入聊天等待卖家确认
const orderDialog = ref(false)
function openOrderDialog() { orderDialog.value = true }

async function buyNow() {
  if (buying.value) return
  buying.value = true
  try {
    const o = await orderApi.create({ itemId, buyerId: auth.profileId, sellerId: item.value.userId })
    orderDialog.value = false
    toast('下单成功，等待卖家确认', 'success')
    // 站内信通知卖家
    await messageApi.send({
      senderId: auth.profileId, receiverId: item.value.userId, itemId,
      content: `我已下单购买「${item.value.title}」，订单号 ${o.orderNo}，请确认。`,
      msgType: 1
    }).catch(() => {})
    router.push({ path: '/chat', query: { item: itemId, peer: item.value.userId } })
  } catch (e) {
    toast(e?.response?.data?.message || '下单失败，请重试', 'error')
  } finally {
    buying.value = false
  }
}

async function submitReport() {
  sending.value = true
  try {
    await reportApi.create({ reporterId: auth.profileId, itemId, reportedUserId: item.value.userId, reason: reportForm.value.reason, evidence: reportForm.value.evidence })
    toast('举报已提交，管理员将尽快处理', 'success')
    reportOpen.value = false
    reportForm.value = { reason: '', evidence: '' }
  } catch (e) { /* noop */ } finally { sending.value = false }
}

async function submitReview() {
  if (!reviewForm.value.content.trim()) { toast('请填写评价内容', 'error'); return }
  try {
    await reviewApi.create({ reviewerId: auth.profileId, targetUserId: item.value.userId, itemId, rating: reviewForm.value.rating, content: reviewForm.value.content.trim() })
    toast('评价成功', 'success')
    reviewForm.value = { rating: 5, content: '' }
    itemReviews.value = await reviewApi.byItem(itemId).catch(() => itemReviews.value)
    sellerReviews.value = await reviewApi.byTarget(item.value.userId).catch(() => sellerReviews.value)
  } catch (e) { /* noop */ }
}

// 卖家回复买家评价
function startReply(r) {
  replyingId.value = r.reviewId
  replyText.value = ''
}
function cancelReply() {
  replyingId.value = null
  replyText.value = ''
}
async function submitReply(r) {
  const text = replyText.value.trim()
  if (!text) { toast('请填写回复内容', 'error'); return }
  try {
    await reviewApi.reply(r.reviewId, text)
    toast('回复成功', 'success')
    itemReviews.value = await reviewApi.byItem(itemId).catch(() => itemReviews.value)
    cancelReply()
  } catch (e) {
    /* noop */
  }
}

onMounted(load)
</script>
