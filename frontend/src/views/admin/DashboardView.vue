<template>
  <div class="space-y-6">
    <!-- 统计卡 -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard title="注册用户" :value="stats.userCount ?? 0" :icon="Users" color="from-blue-500 to-indigo-500" hint="校园同学" />
      <StatCard title="在售商品" :value="stats.itemCount ?? 0" :icon="Package" color="from-emerald-500 to-teal-500" hint="全部商品数" />
      <StatCard title="待处理举报" :value="stats.pendingReportCount ?? 0" :icon="Flag" color="from-amber-500 to-orange-500" hint="需要人工处理" />
      <StatCard title="管理员数量" :value="stats.adminCount ?? 0" :icon="Shield" color="from-violet-500 to-purple-500" />
    </div>

    <div class="grid lg:grid-cols-2 gap-6 items-start mb-6">
      <!-- 商品分类分布饼图 -->
      <div class="card p-6">
        <h3 class="font-bold text-slate-800 mb-4">🍰 商品分类分布</h3>
        <DataChart :option="categoryChartOption" height="300px" />
      </div>
      <!-- 价格区间分布柱状图 -->
      <div class="card p-6">
        <h3 class="font-bold text-slate-800 mb-4">📊 价格区间分布</h3>
        <DataChart :option="priceChartOption" height="300px" />
      </div>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 items-start">
      <!-- 待处理举报 -->
      <div class="card p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-slate-800">🚩 待处理举报</h3>
          <router-link to="/admin/reports" class="text-xs text-blue-600 hover:underline">全部举报 →</router-link>
        </div>
        <div v-if="pendingReports.length" class="space-y-3">
          <div v-for="r in pendingReports" :key="r.reportId" class="border border-slate-100 rounded-xl p-3.5 hover:border-amber-200 transition">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="text-sm text-slate-700">
                  <span class="font-semibold">{{ userName(r.reportedUserId) }}</span> 被举报
                  <router-link :to="`/item/${r.itemId}`" class="text-blue-600 hover:underline">#{{ r.itemId }}</router-link>
                </div>
                <div class="text-xs text-slate-500 mt-1 line-clamp-1">{{ itemTitle(r.itemId) }}</div>
                <div class="text-xs text-amber-600 bg-amber-50 rounded px-2 py-1 mt-2 inline-block">{{ r.reason }}</div>
              </div>
              <div class="flex gap-2 shrink-0">
                <button class="text-xs px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100" @click="quickHandle(r, 1)">下架处理</button>
                <button class="text-xs px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200" @click="quickHandle(r, 2)">驳回</button>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-10 text-sm text-slate-400">
          <div class="text-4xl mb-2">✅</div>暂无待处理举报
        </div>
      </div>

      <!-- 最新商品 -->
      <div class="card p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-slate-800">🛒 最新商品</h3>
          <router-link to="/admin/items" class="text-xs text-blue-600 hover:underline">商品管理 →</router-link>
        </div>
        <div class="space-y-2">
          <router-link v-for="it in recentItems" :key="it.itemId" :to="`/item/${it.itemId}`"
            class="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition">
            <span class="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0" :class="categoryStyle(it.categoryId).bg">{{ categoryEmoji(it.categoryId) }}</span>
            <span class="flex-1 min-w-0">
              <span class="block text-sm text-slate-700 truncate">{{ it.title }}</span>
              <span class="text-xs text-slate-400">卖家：{{ userName(it.userId) }} · {{ fmtTime(it.createTime) }}</span>
            </span>
            <span class="text-sm font-bold text-rose-600">{{ money(it.price) }}</span>
          </router-link>
        </div>
        <div v-if="!recentItems.length" class="text-center py-8 text-sm text-slate-400">暂无商品</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { adminApi, reportApi, categoryApi } from '../../api'
import { money, fmtTime, categoryEmoji, categoryStyle } from '../../utils/format'
import { toast } from '../../utils/toast'
import StatCard from '../../components/StatCard.vue'
import DataChart from '../../components/DataChart.vue'
import { Users, Package, Flag, Shield } from 'lucide-vue-next'

const stats = ref({})
const pendingReports = ref([])
const recentItems = ref([])
const allItems = ref([])
const categories = ref([])
const userMap = ref({})
const itemMap = ref({})

function userName(id) { return userMap.value[Number(id)] || '用户' + id }
function itemTitle(id) { return itemMap.value[Number(id)] || '' }

// 商品分类分布饼图
const categoryChartOption = computed(() => {
  const countMap = {}
  allItems.value.forEach(it => {
    countMap[it.categoryId] = (countMap[it.categoryId] || 0) + 1
  })
  const palette = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16']
  const data = categories.value.map((c, i) => ({
    name: c.name,
    value: countMap[c.categoryId] || 0,
    itemStyle: { color: palette[i % palette.length] }
  })).filter(d => d.value > 0)
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, type: 'scroll', textStyle: { fontSize: 11 } },
    series: [{
      type: 'pie',
      radius: '65%',
      center: ['50%', '42%'],
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { formatter: '{b}\n{d}%', fontSize: 11 },
      data
    }]
  }
})

// 价格区间分布柱状图
const priceChartOption = computed(() => {
  const ranges = [
    { name: '0-10元', min: 0, max: 10 },
    { name: '10-50元', min: 10, max: 50 },
    { name: '50-100元', min: 50, max: 100 },
    { name: '100-300元', min: 100, max: 300 },
    { name: '300-500元', min: 300, max: 500 },
    { name: '500元以上', min: 500, max: Infinity }
  ]
  const counts = ranges.map(() => 0)
  allItems.value.forEach(it => {
    const p = Number(it.price) || 0
    const idx = ranges.findIndex(r => p >= r.min && p < r.max)
    if (idx >= 0) counts[idx]++
  })
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 50, right: 20, top: 20, bottom: 40 },
    xAxis: { type: 'category', data: ranges.map(r => r.name), axisLabel: { fontSize: 10, rotate: 20 } },
    yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed' } } },
    series: [{
      type: 'bar',
      data: counts,
      barWidth: '50%',
      itemStyle: {
        borderRadius: [6, 6, 0, 0],
        color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#34d399' }, { offset: 1, color: '#10b981' }] }
      },
      label: { show: true, position: 'top', fontSize: 11 }
    }]
  }
})

async function load() {
  stats.value = await adminApi.stats().catch(() => ({}))
  const [users, items, reports, cats] = await Promise.all([
    adminApi.users().catch(() => []),
    adminApi.items().catch(() => []),
    reportApi.list().catch(() => []),
    categoryApi.list().catch(() => [])
  ])
  const um = {}
  users.forEach(u => { um[Number(u.userId)] = u.username })
  userMap.value = um
  const im = {}
  items.forEach(i => { im[Number(i.itemId)] = i.title })
  itemMap.value = im
  allItems.value = items
  categories.value = cats
  recentItems.value = items.slice(0, 6)
  pendingReports.value = reports.filter(r => r.status === 0)
}

async function quickHandle(r, status) {
  if (status === 1) {
    if (!confirm(`将下架商品「${itemTitle(r.itemId)}」并标记举报为已处理，确定吗？`)) return
    await adminApi.offShelf(r.itemId).catch(() => {})
  }
  await reportApi.handle(r.reportId, status).catch(() => {})
  toast(status === 1 ? '已下架商品并处理举报' : '已驳回该举报', 'success')
  load()
}

onMounted(load)
</script>
