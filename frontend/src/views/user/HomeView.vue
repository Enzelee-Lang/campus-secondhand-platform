<template>
  <div>
    <!-- Hero 区 -->
    <section class="anim-up rounded-xl overflow-hidden mb-6" style="background: linear-gradient(135deg, #1e4a37 0%, #2d6a4f 50%, #5fbd8e 100%);">
      <div class="text-center py-10 px-6">
        <h1 class="text-[20px] font-bold text-white tracking-tight">让旧物找到新主人</h1>
        <p class="text-emerald-50 mt-2 text-sm">面向高校学生的 C2C 二手交易平台，安全、便捷、省钱</p>
        <!-- Hero 搜索框 -->
        <div class="hero-search">
          <input v-model="keyword" type="text" placeholder="搜索商品、课程编号、ISBN..." @keyup.enter="goMarket" />
          <button @click="goMarket">→</button>
        </div>
        <div class="hot-tags">
          <a v-for="t in hotTags" :key="t" @click.prevent="goMarket(t)">{{ t }}</a>
        </div>
      </div>
    </section>

    <!-- 我的数据 -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard title="我发布的商品" :value="myCount" :icon="PackageOpen" color="emerald" hint="全部状态" to="/user/mine?section=items" />
      <StatCard title="我的收藏" :value="favCount" :icon="Heart" color="red" hint="喜欢的宝贝" to="/user/mine?section=favs" />
      <StatCard title="未读消息" :value="unread" :icon="MailOpen" color="amber" hint="买家/卖家留言" to="/user/messages" />
      <StatCard title="平台分类" :value="categoryCount" :icon="LayoutGrid" color="teal" hint="六大分类" to="/user/market" />
    </div>

    <!-- 分类浏览 -->
    <section class="mb-10 anim-up delay-100">
      <div class="flex items-center justify-between mb-5">
        <h2 class="text-2xl font-bold" style="color: rgb(27, 27, 30);">📂 分类浏览</h2>
        <router-link to="/user/market" class="text-sm text-emerald-600 hover:underline">全部商品 →</router-link>
      </div>
      <div v-if="categories.length" class="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
        <button v-for="c in categories" :key="c.categoryId" @click="goCategory(c)" class="cat-link">
          <span class="cat-icon">{{ emoji(c.categoryId) }}</span>
          <span class="cat-name">{{ c.name }}</span>
        </button>
      </div>
    </section>

    <!-- 热门交易 -->
    <section class="anim-up delay-200">
      <div class="flex items-center justify-between mb-5">
        <h2 class="text-2xl font-bold" style="color: rgb(27, 27, 30);">🔥 热门交易</h2>
        <router-link to="/user/market" class="text-sm text-emerald-600 hover:underline">查看全部 →</router-link>
      </div>
      <div v-if="latest.length" class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
        <ItemCard v-for="(it, i) in latest" :key="it.itemId" :item="it" @open="goItem"
          :style="{ animationDelay: (i * 60) + 'ms' }" />
      </div>
      <div v-else class="card p-12 text-center text-sm text-gray-400">
        还没有商品上架，<router-link to="/user/publish" class="text-emerald-600">去发布第一件闲置</router-link> 吧
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../store/auth'
import { itemApi, categoryApi, favoriteApi, messageApi } from '../../api'
import { categoryEmoji } from '../../utils/format'
import { toast } from '../../utils/toast'
import StatCard from '../../components/StatCard.vue'
import ItemCard from '../../components/ItemCard.vue'
import { PackageOpen, Heart, MailOpen, LayoutGrid } from 'lucide-vue-next'

const auth = useAuthStore()
const router = useRouter()

const myCount = ref(0)
const favCount = ref(0)
const unread = ref(0)
const categoryCount = ref(0)
const categories = ref([])
const latest = ref([])
const keyword = ref('')
const emoji = categoryEmoji
const hotTags = ['高等数学', 'iPhone', '考研资料', '吉他', '篮球']

function goCategory(c) { router.push({ path: '/user/market', query: { categoryId: c.categoryId } }) }
function goItem(item) { router.push(`/item/${item.itemId}`) }
async function goMarket(tag) {
  if (tag) keyword.value = tag
  const q = (keyword.value || '').trim()
  if (!q) return router.push({ path: '/user/market' })
  try {
    const list = await itemApi.list({ keyword: q })
    // 只看在售
    const available = (list || []).filter(i => i.status === 1)
    if (available.length === 1) {
      // 精确或唯一匹配 → 直接跳详情
      router.push(`/item/${available[0].itemId}`)
    } else if (available.length > 1) {
      // 多条 → 跳搜索结果列表
      router.push({ path: '/user/market', query: { keyword: q } })
    } else {
      toast('没找到匹配的宝贝，换个关键词试试', 'error')
    }
  } catch {
    router.push({ path: '/user/market', query: { keyword: q } })
  }
}

onMounted(async () => {
  const me = auth.profileId
  const tasks = [
    categoryApi.list().then(list => { categories.value = list; categoryCount.value = list.length }).catch(() => {}),
    itemApi.page({ pageSize: 8 }).then(page => {
      latest.value = (page.entityList || []).filter(i => i.status === 1)
    }).catch(() => {})
  ]
  if (me != null) {
    tasks.push(
      itemApi.byUser(me).then(l => { myCount.value = l.length }).catch(() => {}),
      favoriteApi.byUser(me).then(l => { favCount.value = l.length }).catch(() => {}),
      messageApi.unread(me).then(n => { unread.value = n }).catch(() => {})
    )
  }
  await Promise.all(tasks)
})
</script>
