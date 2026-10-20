<template>
  <div class="space-y-5">
    <!-- 页面标题 + 面包屑 -->
    <div class="anim-up">
      <div class="breadcrumb mb-3">
        <a href="/">首页</a>
        <span class="sep">/</span>
        <span class="current">{{ currentCategoryName || '全部商品' }}</span>
      </div>
      <h1 class="text-2xl font-bold text-gray-900">{{ currentCategoryName || '全部商品' }}</h1>
      <p class="text-sm text-gray-500 mt-1">搜索你需要的闲置宝贝</p>
    </div>

    <!-- 搜索 + 筛选 -->
    <div class="flex flex-col sm:flex-row sm:items-center gap-3 justify-between anim-up delay-50">
      <div class="flex items-center gap-2 w-full sm:w-auto">
        <input v-model="keyword" class="input !w-72" placeholder="搜索商品标题…" @keyup.enter="reset()" />
        <button class="btn-green" @click="reset()"><Search class="w-4 h-4" />搜索</button>
      </div>
      <select v-model="conditionLevel" @change="reset()" class="input !w-36">
        <option value="">全部成色</option>
        <option v-for="(v, k) in CONDITION" :key="k" :value="Number(k)">{{ v.label }}</option>
      </select>
    </div>

    <!-- 商品网格 -->
    <div v-if="items.length" class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 pt-4">
      <ItemCard v-for="it in items" :key="it.itemId" :item="it" @open="goItem" />
    </div>
    <div v-else-if="!loading" class="card p-12 text-center">
      <div class="text-5xl mb-3">🔍</div>
      <p class="text-gray-500">没有找到符合条件的宝贝</p>
      <p class="text-xs text-gray-400 mt-1">换个关键词或分类试试</p>
    </div>

    <!-- 加载更多 -->
    <div class="text-center pt-2 pb-4">
      <button v-if="loading" disabled class="btn-ghost"><Loader2 class="w-4 h-4 animate-spin" />加载中…</button>
      <button v-else-if="hasNext" @click="loadMore" class="btn-outline px-8">加载更多 ↓</button>
      <span v-else-if="items.length" class="text-xs text-gray-400">— 已经到底啦 —</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { itemApi, categoryApi } from '../../api'
import { CONDITION } from '../../utils/format'
import ItemCard from '../../components/ItemCard.vue'
import { Search, Loader2 } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const categories = ref([])
const keyword = ref('')
const categoryId = ref(null)
const conditionLevel = ref('')

const items = ref([])
const loading = ref(false)
const hasNext = ref(false)
const nextCursor = ref(null)

const PAGE_SIZE = 8

const currentCategoryName = computed(() => {
  if (categoryId.value == null) return ''
  return categories.value.find(c => c.categoryId === categoryId.value)?.name || ''
})

function goItem(item) { router.push(`/item/${item.itemId}`) }

function pickCategory(id) { categoryId.value = id; reset() }

/** 拉一页数据：DB 端游标分页 + 客户端过滤在售商品，数量不足自动补拉下一页 */
async function fetchPage(cursor) {
  loading.value = true
  const params = { pageSize: PAGE_SIZE, cursor: cursor || undefined }
  if (categoryId.value) params.categoryId = categoryId.value
  if (keyword.value.trim()) params.keyword = keyword.value.trim()
  if (conditionLevel.value) params.conditionLevel = conditionLevel.value // DB 端忽略，客户端过滤

  const res = await itemApi.page(params).catch(() => null)
  if (!res) { loading.value = false; return null }
  const list = (res.entityList || []).filter(i => i.status === 1 && (!conditionLevel.value || i.conditionLevel === Number(conditionLevel.value)))
  return { list, hasNextPage: res.hasNextPage, nextCursor: res.nextCursor }
}

async function reset() {
  items.value = []
  hasNext.value = true
  nextCursor.value = null
  loading.value = true
  // 逐页拉取直到凑满一屏或已到底
  let guard = 0
  while (items.value.length < PAGE_SIZE && hasNext.value && guard++ < 20) {
    const page = await fetchPage(nextCursor.value)
    if (!page) break
    items.value.push(...page.list)
    nextCursor.value = page.nextCursor
    hasNext.value = page.hasNextPage
  }
  loading.value = false
}

async function loadMore() {
  loading.value = true
  let guard = 0
  // 持续拉取直到拿到至少一页数据或到底（自动跳过下架/被过滤的空页）
  while (hasNext.value && guard++ < 20) {
    const page = await fetchPage(nextCursor.value)
    if (!page) break
    if (page.list.length) items.value.push(...page.list)
    nextCursor.value = page.nextCursor
    hasNext.value = page.hasNextPage
    if (page.list.length) break
  }
  loading.value = false
}

onMounted(async () => {
  const q = route.query
  if (q.categoryId) categoryId.value = Number(q.categoryId)
  if (q.keyword) keyword.value = String(q.keyword)
  await categoryApi.list().then(l => { categories.value = l }).catch(() => {})
  await reset()
})
</script>
