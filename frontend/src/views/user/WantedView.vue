<template>
  <div class="space-y-5">
    <!-- 页面标题 -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">📢 求购广场</h1>
      <p class="text-sm text-gray-500 mt-1">发布你的需求，让卖家主动联系你</p>
    </div>

    <!-- 操作栏 -->
    <div class="flex items-center justify-between">
      <input v-model="keyword" class="input !w-64" placeholder="搜索求购信息…" @keyup.enter="filterList" />
      <button class="btn-green" @click="showPublish = true">+ 发布求购</button>
    </div>

    <!-- 求购列表 -->
    <div v-if="filteredList.length" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div v-for="w in filteredList" :key="w.wantedId" class="card p-5 hover:shadow-md transition">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <h3 class="font-bold text-gray-900 truncate">{{ w.title }}</h3>
            <p class="text-sm text-gray-500 mt-1.5 line-clamp-2">{{ w.description }}</p>
          </div>
          <span class="shrink-0 text-lg font-bold text-rose-500">¥{{ w.budget }}</span>
        </div>
        <div class="flex items-center gap-3 mt-4 pt-3 border-t border-gray-100 text-xs text-gray-400">
          <span>📍 {{ w.location || '校内' }}</span>
          <span>🕐 {{ fmtTime(w.createTime) }}</span>
          <span class="ml-auto">发布人：{{ w.publisher }}<span v-if="w.publisherPhone" class="text-emerald-600 ml-1">📱 {{ w.publisherPhone }}</span></span>
        </div>
        <div v-if="w.publisherId === auth.profileId" class="mt-3 pt-2 border-t border-gray-50 flex gap-2">
          <button class="text-xs px-2.5 py-1 rounded-md bg-amber-50 text-amber-600 hover:bg-amber-100" @click="closeItem(w)">关闭</button>
          <button class="text-xs px-2.5 py-1 rounded-md bg-rose-50 text-rose-600 hover:bg-rose-100" @click="deleteItem(w)">删除</button>
        </div>
      </div>
    </div>
    <div v-else class="card p-12 text-center">
      <div class="text-5xl mb-3">📭</div>
      <p class="text-gray-500">{{ loading ? '加载中…' : '暂无求购信息' }}</p>
      <button v-if="!loading" class="btn-green mt-4" @click="showPublish = true">发布第一条求购</button>
    </div>

    <!-- 发布求购弹窗 -->
    <div v-if="showPublish" class="modal-backdrop" @click.self="showPublish = false">
      <div class="modal-panel shadow-xl w-full max-w-md p-6">
        <h3 class="text-lg font-bold text-gray-900 mb-4">发布求购信息</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">求购标题</label>
            <input v-model="form.title" class="input w-full" placeholder="如：收一本高数教材" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">详细描述</label>
            <textarea v-model="form.description" class="input w-full" rows="3" placeholder="描述你需要的物品、成色要求等"></textarea>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">预算（元）</label>
              <input v-model.number="form.budget" type="number" class="input w-full" placeholder="50" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">交易地点</label>
              <input v-model="form.location" class="input w-full" placeholder="如：东区食堂" />
            </div>
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-5">
          <button class="btn-ghost" @click="showPublish = false">取消</button>
          <button class="btn-primary" :disabled="submitting" @click="publish">
            <span v-if="submitting">发布中…</span>
            <span v-else>发布</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../../store/auth'
import { wantedApi } from '../../api'
import { fmtTime } from '../../utils/format'
import { toast } from '../../utils/toast'

const auth = useAuthStore()
const keyword = ref('')
const showPublish = ref(false)
const submitting = ref(false)
const loading = ref(false)
const list = ref([])

const form = ref({ title: '', description: '', budget: '', location: '' })

const filteredList = computed(() => {
  if (!keyword.value.trim()) return list.value
  const kw = keyword.value.trim().toLowerCase()
  return list.value.filter(w =>
    w.title?.toLowerCase().includes(kw) || w.description?.toLowerCase().includes(kw)
  )
})

async function load() {
  loading.value = true
  try {
    list.value = await wantedApi.list()
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

async function publish() {
  if (!form.value.title.trim()) { toast('请输入求购标题', 'error'); return }
  if (!form.value.budget || form.value.budget <= 0) { toast('请输入有效预算', 'error'); return }
  submitting.value = true
  try {
    await wantedApi.create({
      publisherId: auth.profileId,
      title: form.value.title.trim(),
      description: form.value.description.trim() || '',
      budget: Number(form.value.budget),
      location: form.value.location.trim() || ''
    })
    toast('发布成功', 'success')
    showPublish.value = false
    form.value = { title: '', description: '', budget: '', location: '' }
    await load()
  } catch { /* interceptor 已 toast */ } finally {
    submitting.value = false
  }
}

async function closeItem(w) {
  if (!confirm(`关闭求购「${w.title}」？`)) return
  await wantedApi.close(w.wantedId).catch(() => {})
  toast('已关闭', 'info')
  await load()
}

async function deleteItem(w) {
  if (!confirm(`删除求购「${w.title}」？此操作不可恢复！`)) return
  await wantedApi.remove(w.wantedId).catch(() => {})
  toast('已删除', 'info')
  await load()
}

function filterList() { /* computed 自动响应 */ }

onMounted(load)
</script>
