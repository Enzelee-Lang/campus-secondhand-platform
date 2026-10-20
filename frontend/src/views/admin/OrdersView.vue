<template>
  <div>
    <div class="flex items-center justify-between mb-5">
      <h2 class="text-xl font-bold text-slate-800">📋 订单管理</h2>
      <div class="flex items-center gap-3">
        <select v-model="filterStatus" class="input !w-40 !py-2">
          <option :value="null">全部状态</option>
          <option v-for="(v, k) in ORDER_STATUS" :key="k" :value="Number(k)">{{ v.label }}</option>
        </select>
      </div>
    </div>

    <!-- 数据分布图表 -->
    <div class="grid lg:grid-cols-2 gap-6 mb-6">
      <div class="card p-6">
        <h3 class="font-bold text-slate-800 mb-4">📊 订单状态分布</h3>
        <DataChart :option="statusChartOption" height="320px" />
      </div>
      <div class="card p-6">
        <h3 class="font-bold text-slate-800 mb-4">📈 近 14 天交易趋势</h3>
        <DataChart :option="trendChartOption" height="320px" />
      </div>
    </div>

    <div v-if="list.length" class="card overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-slate-50 text-slate-500 text-xs">
          <tr>
            <th class="text-left px-4 py-3">订单号</th>
            <th class="text-left px-4 py-3">商品</th>
            <th class="text-left px-4 py-3">买家</th>
            <th class="text-left px-4 py-3">卖家</th>
            <th class="text-right px-4 py-3">金额</th>
            <th class="text-center px-4 py-3">状态</th>
            <th class="text-left px-4 py-3">下单时间</th>
            <th class="text-center px-4 py-3">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="o in list" :key="o.orderId" class="border-t border-slate-100 hover:bg-slate-50">
            <td class="px-4 py-3 font-mono text-xs text-slate-700">{{ o.orderNo }}</td>
            <td class="px-4 py-3">
              <router-link :to="`/item/${o.itemId}`" class="text-blue-600 hover:underline">{{ titleOf(o.itemId) }}</router-link>
            </td>
            <td class="px-4 py-3">{{ nameOf(o.buyerId) }}</td>
            <td class="px-4 py-3">{{ nameOf(o.sellerId) }}</td>
            <td class="px-4 py-3 text-right font-bold text-rose-600">{{ money(o.amount) }}</td>
            <td class="px-4 py-3 text-center">
              <span class="tag" :class="ORDER_STATUS[o.status]?.cls">{{ ORDER_STATUS[o.status]?.label }}</span>
            </td>
            <td class="px-4 py-3 text-xs text-slate-400">{{ fmtTime(o.createTime) }}</td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-center gap-1">
                <button v-if="o.status < 4" class="text-xs text-rose-500 hover:underline" @click="act(o, 'cancel')">取消</button>
                <span v-else class="text-xs text-slate-300">—</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="card p-14 text-center">
      <div class="text-5xl mb-3">📭</div>
      <p class="text-slate-500 text-sm">暂无订单</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { orderApi, itemApi, userApi } from '../../api'
import { ORDER_STATUS, money, fmtTime } from '../../utils/format'
import { toast } from '../../utils/toast'
import DataChart from '../../components/DataChart.vue'

const list = ref([])
const allOrders = ref([])
const items = ref([])
const userMap = ref({})
const filterStatus = ref(null)

function titleOf(id) { return items.value.find(i => i.itemId === id)?.title || '#' + id }
function nameOf(id) { return userMap.value[Number(id)] || ('用户' + id) }

// 订单状态分布环形图
const statusChartOption = computed(() => {
  const counts = [0, 0, 0, 0, 0, 0]
  allOrders.value.forEach(o => { counts[o.status]++ })
  const total = counts.reduce((a, b) => a + b, 0)
  const colorMap = ['#f59e0b', '#f97316', '#0ea5e9', '#6366f1', '#10b981', '#94a3b8']
  const data = Object.entries(ORDER_STATUS).map(([i, s]) => ({
    name: s.label,
    value: counts[Number(i)],
    itemStyle: { color: colorMap[Number(i)] }
  }))
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, type: 'scroll', textStyle: { fontSize: 12 } },
    title: {
      text: total + '',
      subtext: '订单总数',
      left: 'center',
      top: '38%',
      textStyle: { fontSize: 28, fontWeight: 'bold', color: '#1e293b' },
      subtextStyle: { fontSize: 12, color: '#94a3b8' }
    },
    series: [{
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['50%', '42%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      data
    }]
  }
})

// 近14天交易趋势折线图
const trendChartOption = computed(() => {
  const days = []
  const now = new Date()
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  const orderCount = new Array(14).fill(0)
  const amount = new Array(14).fill(0)
  allOrders.value.forEach(o => {
    const day = String(o.createTime || '').slice(0, 10)
    const idx = days.indexOf(day)
    if (idx >= 0) {
      orderCount[idx]++
      amount[idx] += Number(o.amount || 0)
    }
  })
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      formatter: params => {
        let s = params[0].axisValue + '<br/>'
        params.forEach(p => { s += `${p.marker}${p.seriesName}: ${p.seriesName === '交易额' ? '¥' + p.value : p.value}<br/>` })
        return s
      }
    },
    legend: { data: ['订单数', '交易额'], top: 0 },
    grid: { left: 50, right: 50, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: days.map(d => d.slice(5)), axisLabel: { fontSize: 10 } },
    yAxis: [
      { type: 'value', name: '订单数', splitLine: { lineStyle: { type: 'dashed' } } },
      { type: 'value', name: '交易额', splitLine: { show: false } }
    ],
    series: [
      {
        name: '订单数', type: 'line', smooth: true, data: orderCount,
        itemStyle: { color: '#10b981' },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(16,185,129,0.25)' }, { offset: 1, color: 'rgba(16,185,129,0)' }] } }
      },
      {
        name: '交易额', type: 'line', smooth: true, yAxisIndex: 1, data: amount.map(v => Math.round(v * 100) / 100),
        itemStyle: { color: '#f97316' }
      }
    ]
  }
})

async function act(o, action) {
  try {
    await orderApi.status(o.orderId, action)
    toast('操作成功', 'success')
    load()
  } catch (e) {
    toast(e?.response?.data?.message || '操作失败', 'error')
  }
}

async function load() {
  const [data, it, ul] = await Promise.all([
    orderApi.all().catch(() => []),
    itemApi.list().catch(() => []),
    userApi.list().catch(() => [])
  ])
  allOrders.value = data
  list.value = filterStatus.value != null ? data.filter(o => o.status === filterStatus.value) : data
  items.value = it
  const um = {}
  ul.forEach(u => { um[Number(u.userId)] = u.username })
  userMap.value = um
}

watch(filterStatus, () => {
  list.value = filterStatus.value != null ? allOrders.value.filter(o => o.status === filterStatus.value) : allOrders.value
})
onMounted(load)
</script>
