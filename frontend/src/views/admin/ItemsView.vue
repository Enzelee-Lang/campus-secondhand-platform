<template>
  <div class="space-y-5">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h2 class="text-xl font-bold text-slate-800">📦 商品管理</h2>
        <p class="text-xs text-slate-400 mt-0.5">共 {{ filtered.length }} / {{ items.length }} 件商品</p>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <select v-model="statusFilter" class="input !w-32">
          <option value="">全部状态</option>
          <option v-for="(v, k) in ITEM_STATUS" :key="k" :value="Number(k)">{{ v.label }}</option>
        </select>
        <input v-model="keyword" class="input !w-56" placeholder="搜索标题 / 卖家…" />
        <button class="btn-outline !py-1.5" :disabled="exporting" @click="exportCsv">
          {{ exporting ? '导出中…' : '⬇ 导出 CSV' }}
        </button>
        <button class="btn-outline !py-1.5" @click="openCategoryDialog">📁 分类管理</button>
      </div>
    </div>

    <div class="card overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-xs text-slate-400 bg-slate-50 border-b border-slate-100">
            <th class="px-4 py-3 font-medium">商品</th>
            <th class="px-4 py-3 font-medium">分类</th>
            <th class="px-4 py-3 font-medium">卖家</th>
            <th class="px-4 py-3 font-medium">价格</th>
            <th class="px-4 py-3 font-medium">成色</th>
            <th class="px-4 py-3 font-medium">状态</th>
            <th class="px-4 py-3 font-medium">浏览量</th>
            <th class="px-4 py-3 font-medium">发布时间</th>
            <th class="px-4 py-3 font-medium text-right">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="it in filtered" :key="it.itemId" class="border-b border-slate-50 hover:bg-slate-50/60 transition">
            <td class="px-4 py-3">
              <router-link :to="`/item/${it.itemId}`" class="flex items-center gap-3 group">
                <span class="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0" :class="categoryStyle(it.categoryId).bg">{{ categoryEmoji(it.categoryId) }}</span>
                <span class="min-w-0">
                  <span class="block text-slate-700 font-medium truncate max-w-[220px] group-hover:text-blue-600">{{ it.title }}</span>
                  <span class="text-[11px] text-slate-300">#{{ it.itemId }}</span>
                </span>
              </router-link>
            </td>
            <td class="px-4 py-3 text-slate-500">{{ categoryName(it.categoryId) }}</td>
            <td class="px-4 py-3 text-slate-600">{{ userName(it.userId) }}</td>
            <td class="px-4 py-3">
              <span class="font-bold text-rose-600">{{ money(it.price) }}</span>
            </td>
            <td class="px-4 py-3"><span class="tag" :class="CONDITION[it.conditionLevel]?.cls || ''">{{ CONDITION[it.conditionLevel]?.label || '-' }}</span></td>
            <td class="px-4 py-3"><span class="tag" :class="ITEM_STATUS[it.status]?.cls || ''">{{ ITEM_STATUS[it.status]?.label || '-' }}</span></td>
            <td class="px-4 py-3 text-slate-500">{{ it.viewCount ?? 0 }}</td>
            <td class="px-4 py-3 text-slate-400 text-xs">{{ fmtTime(it.createTime) }}</td>
            <td class="px-4 py-3">
              <div class="flex gap-1.5 justify-end">
                <button class="text-xs px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100" @click="openPrice(it)">改价</button>
                <button v-if="it.status === 1" class="text-xs px-2.5 py-1 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100" @click="off(it)">下架</button>
                <button v-else class="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100" @click="on(it)">上架</button>
                <button class="text-xs px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100" @click="del(it)">删除</button>
              </div>
            </td>
          </tr>
          <tr v-if="!filtered.length">
            <td colspan="9" class="px-4 py-12 text-center text-sm text-slate-400">没有符合条件的商品</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分类管理弹窗 -->
    <div v-if="categoryOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" @click.self="categoryOpen = false">
      <div class="card w-full max-w-md p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-slate-800">📁 分类管理</h3>
          <button class="text-slate-400 hover:text-slate-600 text-xl leading-none" @click="categoryOpen = false">×</button>
        </div>
        <div class="space-y-2 max-h-72 overflow-y-auto">
          <div v-for="c in categories" :key="c.categoryId" class="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
            <span class="text-sm text-slate-700">{{ c.name }}</span>
            <button class="text-xs text-rose-500 hover:text-rose-700" @click="removeCategory(c)">删除</button>
          </div>
          <div v-if="!categories.length" class="text-center text-sm text-slate-400 py-4">暂无分类</div>
        </div>
        <div class="mt-4 pt-4 border-t border-slate-100 flex gap-2">
          <input v-model="newCategoryName" class="input flex-1" placeholder="新分类名称…" @keyup.enter="addCategory" />
          <button class="btn-primary" @click="addCategory">新增</button>
        </div>
        <p class="text-xs text-slate-400 mt-3">提示：删除分类不会影响已发布的商品，但商品将显示为「未分类」</p>
      </div>
    </div>

    <!-- 改价弹窗 -->
    <PriceChangeDialog v-model:visible="priceDialogOpen" :item="priceItem" @success="load" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { adminApi, itemApi, userApi, categoryApi } from '../../api'
import { CONDITION, ITEM_STATUS, money, fmtTime, categoryEmoji, categoryStyle } from '../../utils/format'
import { toast } from '../../utils/toast'
import PriceChangeDialog from '../../components/PriceChangeDialog.vue'

const items = ref([])
const userMap = ref({})
const catMap = ref({})
const categories = ref([])
const keyword = ref('')
const statusFilter = ref('')
const exporting = ref(false)
const categoryOpen = ref(false)
const newCategoryName = ref('')
const priceDialogOpen = ref(false)
const priceItem = ref(null)

const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return items.value.filter(it => {
    if (statusFilter.value !== '' && it.status !== statusFilter.value) return false
    if (!kw) return true
    return it.title.toLowerCase().includes(kw) || userName(it.userId).toLowerCase().includes(kw)
  })
})

function userName(id) { return userMap.value[Number(id)] || '用户' + id }
function categoryName(id) { return catMap.value[Number(id)] || '未分类' }

async function load() {
  const [list, users, cats] = await Promise.all([
    adminApi.items().catch(() => []),
    userApi.list().catch(() => []),
    categoryApi.list().catch(() => [])
  ])
  items.value = list
  const um = {}
  users.forEach(u => { um[Number(u.userId)] = u.username })
  userMap.value = um
  categories.value = cats
  const cm = {}
  cats.forEach(c => { cm[Number(c.categoryId)] = c.name })
  catMap.value = cm
}

async function off(it) {
  if (!confirm(`确认下架「${it.title}」？`)) return
  await adminApi.offShelf(it.itemId).catch(() => {})
  toast('已下架', 'success'); load()
}
async function on(it) {
  await itemApi.update(it.itemId, { status: 1 }).catch(() => {})
  toast('已重新上架', 'success'); load()
}
async function del(it) {
  if (!confirm(`确认删除「${it.title}」？不可恢复！`)) return
  await itemApi.remove(it.itemId).catch(() => {})
  toast('已删除', 'success'); load()
}
function openPrice(it) {
  priceItem.value = it
  priceDialogOpen.value = true
}

// 商品导出 CSV：调用后端 /api/items/export，返回 Blob 后触发浏览器下载
async function exportCsv() {
  exporting.value = true
  try {
    const blob = await itemApi.export()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `items_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast('CSV 已导出', 'success')
  } catch (e) {
    /* 错误提示由拦截器给出 */
  } finally {
    exporting.value = false
  }
}

function openCategoryDialog() {
  newCategoryName.value = ''
  categoryOpen.value = true
}

async function addCategory() {
  const name = newCategoryName.value.trim()
  if (!name) { toast('请输入分类名称', 'error'); return }
  try {
    await categoryApi.create({ name })
    newCategoryName.value = ''
    await loadCategories()
    toast('分类已新增', 'success')
  } catch (e) {
    /* noop */
  }
}

async function removeCategory(c) {
  if (!confirm(`确认删除分类「${c.name}」？`)) return
  try {
    await categoryApi.remove(c.categoryId)
    await loadCategories()
    toast('分类已删除', 'success')
  } catch (e) {
    /* noop */
  }
}

// 仅刷新分类列表（用于弹窗内操作后局部刷新）
async function loadCategories() {
  const cats = await categoryApi.list().catch(() => [])
  categories.value = cats
  const cm = {}
  cats.forEach(c => { cm[Number(c.categoryId)] = c.name })
  catMap.value = cm
}

onMounted(load)
</script>
