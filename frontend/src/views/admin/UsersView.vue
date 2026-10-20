<template>
  <div class="space-y-5">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h2 class="text-xl font-bold text-slate-800">👥 用户管理</h2>
        <p class="text-xs text-slate-400 mt-0.5">共 {{ users.length }} 位注册用户 · {{ users.filter(u => u.status === 1).length }} 位正常</p>
      </div>
      <div class="flex items-center gap-2">
        <input v-model="keyword" class="input !w-56" placeholder="搜索用户名 / 邮箱 / 学校…" />
        <input v-model="studentQuery" class="input !w-40" placeholder="按学号精确查找…" @keyup.enter="searchByStudentId" />
        <button class="btn-outline !py-1.5" @click="searchByStudentId">🔍 查找</button>
        <button v-if="studentHit" class="text-xs text-slate-400 hover:text-blue-600" @click="clearStudentHit">清除精确过滤</button>
      </div>
    </div>

    <div class="card overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-xs text-slate-400 bg-slate-50 border-b border-slate-100">
            <th class="px-4 py-3 font-medium">用户</th>
            <th class="px-4 py-3 font-medium">学号 / 学校</th>
            <th class="px-4 py-3 font-medium">联系方式</th>
            <th class="px-4 py-3 font-medium">状态</th>
            <th class="px-4 py-3 font-medium">注册时间</th>
            <th class="px-4 py-3 font-medium text-right">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in filtered" :key="u.userId" class="border-b border-slate-50 hover:bg-slate-50/60 transition">
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <span class="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-base shrink-0">{{ u.avatar || '🧑‍🎓' }}</span>
                <div>
                  <div class="font-medium text-slate-700">{{ u.username }}</div>
                  <div class="text-[11px] text-slate-300">ID: {{ u.userId }}</div>
                </div>
              </div>
            </td>
            <td class="px-4 py-3">
              <div class="text-slate-600">{{ u.studentId || '-' }}</div>
              <div class="text-xs text-slate-400">{{ u.schoolName || '-' }}</div>
            </td>
            <td class="px-4 py-3">
              <div class="text-slate-500">{{ u.email || '-' }}</div>
              <div class="text-xs text-slate-400">{{ u.phone || '-' }}</div>
            </td>
            <td class="px-4 py-3"><span class="tag" :class="USER_STATUS[u.status]?.cls || ''">{{ USER_STATUS[u.status]?.label || '未知' }}</span></td>
            <td class="px-4 py-3 text-slate-400 text-xs">{{ fmtTime(u.createTime) }}</td>
            <td class="px-4 py-3 text-right">
              <button v-if="u.status === 1" class="text-xs px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100" @click="toggle(u, 0)">禁用账号</button>
              <button v-else class="text-xs px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100" @click="toggle(u, 1)">恢复启用</button>
            </td>
          </tr>
          <tr v-if="!filtered.length">
            <td colspan="6" class="px-4 py-12 text-center text-sm text-slate-400">没有符合条件的用户</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { adminApi, userApi } from '../../api'
import { USER_STATUS, fmtTime } from '../../utils/format'
import { toast } from '../../utils/toast'

const users = ref([])
const keyword = ref('')
const studentQuery = ref('')
const studentHit = ref(null)

const filtered = computed(() => {
  // 学号精确查找结果优先：命中后表格只显示该用户
  if (studentHit.value) return [studentHit.value]
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return users.value
  return users.value.filter(u => (u.username || '').toLowerCase().includes(kw) || (u.email || '').toLowerCase().includes(kw) || (u.schoolName || '').toLowerCase().includes(kw))
})

async function load() { users.value = await adminApi.users().catch(() => []) }

// 按学号精确查找（接入 GET /api/users/student/{studentId}；未命中时拦截器会 toast 后端的错误消息）
async function searchByStudentId() {
  const sid = studentQuery.value.trim()
  if (!sid) { toast('请输入学号', 'error'); return }
  try {
    const user = await userApi.byStudentId(sid)
    studentHit.value = user
    toast(`已找到学号 ${sid} 的用户：${user.username}`, 'success')
  } catch (e) {
    studentHit.value = null
  }
}

function clearStudentHit() {
  studentHit.value = null
  studentQuery.value = ''
}

async function toggle(u, status) {
  if (!confirm(`确认${status === 0 ? '禁用' : '恢复启用'}用户「${u.username}」？`)) return
  await adminApi.toggleUser(u.userId, status).catch(() => {})
  toast(status === 0 ? '已禁用该账号' : '已恢复该账号', 'success')
  load()
  // 学号精确过滤视图下，同步刷新命中用户的最新状态
  if (studentHit.value && Number(studentHit.value.userId) === Number(u.userId)) {
    userApi.detail(u.userId).then(fresh => { studentHit.value = fresh }).catch(() => { studentHit.value = null })
  }
}

onMounted(load)
</script>
