<template>
  <div class="space-y-5">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h2 class="text-xl font-bold text-slate-800">🚩 举报处理</h2>
        <p class="text-xs text-slate-400 mt-0.5">共 {{ filtered.length }} 条记录</p>
      </div>
      <div class="flex bg-white border border-slate-200 rounded-xl p-1">
        <button v-for="t in reportTabs" :key="t.key" @click="statusFilter = t.key"
          class="px-4 py-1.5 rounded-lg text-sm transition"
          :class="statusFilter === t.key ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-700'">{{ t.label }}</button>
      </div>
    </div>

    <div class="space-y-4">
      <div v-for="r in filtered" :key="r.reportId" class="card p-5">
        <div class="flex flex-wrap items-center gap-2">
          <span class="tag bg-slate-100 text-slate-500">举报单 #{{ r.reportId }}</span>
          <span class="text-sm text-slate-700">举报人：<span class="font-medium">{{ userName(r.reporterId) }}</span></span>
          <span class="text-slate-300">→</span>
          <span class="text-sm text-slate-700">被举报用户：<span class="font-medium text-rose-600">{{ userName(r.reportedUserId) }}</span></span>
          <span class="tag" :class="REPORT_STATUS[r.status]?.cls || ''">{{ REPORT_STATUS[r.status]?.label }}</span>
          <span class="text-xs text-slate-300 ml-auto">{{ fmtTime(r.createTime) }}</span>
        </div>

        <router-link :to="`/item/${r.itemId}`" class="mt-3 flex items-center gap-3 bg-slate-50 rounded-xl p-3 hover:bg-blue-50/60 transition group">
          <span class="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0" :class="categoryStyle(itemOf(r.itemId)?.categoryId).bg">{{ categoryEmoji(itemOf(r.itemId)?.categoryId) }}</span>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-slate-700 truncate group-hover:text-blue-600">{{ itemTitle(r.itemId) }}</div>
            <div class="text-xs text-slate-400">商品 ID {{ r.itemId }} · 卖家 {{ userName(itemOf(r.itemId)?.userId) }}</div>
          </div>
          <span class="text-sm font-bold text-rose-600 shrink-0">{{ itemOf(r.itemId) ? money(itemOf(r.itemId).price) : '' }}</span>
        </router-link>

        <div class="mt-3 grid sm:grid-cols-2 gap-3 text-sm">
          <div class="bg-rose-50/60 rounded-xl p-3">
            <div class="text-xs text-rose-400 mb-1">举报原因</div>
            <div class="text-slate-700">{{ r.reason }}</div>
          </div>
          <div class="bg-slate-50 rounded-xl p-3">
            <div class="text-xs text-slate-400 mb-1">补充说明</div>
            <div class="text-slate-600">{{ r.evidence || '（无）' }}</div>
          </div>
        </div>

        <div v-if="r.status === 0" class="flex justify-end gap-2 mt-4">
          <button class="btn-outline !py-1.5 !text-slate-500" @click="handle(r, 2)">驳回举报</button>
          <button class="btn-primary !bg-rose-600 hover:!bg-rose-700 !py-1.5" @click="handle(r, 1)">
            确认违规 · 下架商品
          </button>
        </div>
      </div>
      <div v-if="!filtered.length" class="card p-14 text-center">
        <div class="text-5xl mb-3">🎉</div>
        <p class="text-slate-500 text-sm">该状态下没有举报记录</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { reportApi, adminApi, userApi, itemApi } from '../../api'
import { REPORT_STATUS, money, fmtTime, categoryEmoji, categoryStyle } from '../../utils/format'
import { toast } from '../../utils/toast'

const reports = ref([])
const users = ref([])
const items = ref([])
const statusFilter = ref(null)

const reportTabs = [
  { key: null, label: '全部' },
  { key: 0, label: '待处理' },
  { key: 1, label: '已处理' },
  { key: 2, label: '已驳回' }
]

const filtered = computed(() => {
  if (statusFilter.value == null) return reports.value
  return reports.value.filter(r => r.status === statusFilter.value)
})

function userName(id) { return users.value.find(u => u.userId === id)?.username || '用户' + id }
function itemOf(id) { return items.value.find(i => i.itemId === id) }
function itemTitle(id) { return itemOf(id)?.title || `商品 #${id}` }

async function load() {
  const [rs, us, is] = await Promise.all([
    reportApi.list().catch(() => []),
    userApi.list().catch(() => []),
    itemApi.list().catch(() => [])
  ])
  reports.value = rs
  users.value = us
  items.value = is
}

async function handle(r, status) {
  if (status === 1) {
    const it = itemOf(r.itemId)
    if (!confirm(`确认该举报成立？将下架商品「${it?.title || r.itemId}」并关闭举报单。`)) return
    if (it && it.status === 1) {
      await adminApi.offShelf(r.itemId).catch(() => {})
    }
  }
  await reportApi.handle(r.reportId, status).catch(() => {})
  toast(status === 1 ? '已下架商品并处理举报' : '已驳回举报', 'success')
  load()
}

onMounted(load)
</script>
