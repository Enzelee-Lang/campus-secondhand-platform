<template>
  <div class="min-h-screen flex items-center justify-center bg-[#f8f9fa] p-4">
    <div class="w-full max-w-md anim-scale-in">
      <div class="text-center mb-8">
        <div class="inline-flex w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 items-center justify-center text-2xl mb-3 shadow-lg shadow-emerald-500/30">🛍️</div>
        <h1 class="text-xl font-bold text-gray-900">旧易货 · 校园二手交易平台</h1>
        <p class="text-sm text-gray-500 mt-1">让闲置流动起来 · 选择身份登录</p>
      </div>

      <div class="card p-7">
        <!-- 角色切换 -->
        <div class="grid grid-cols-2 gap-2 mb-5">
          <button v-for="r in roles" :key="r.key" @click="selectRole(r.key)"
            class="py-2.5 rounded-lg text-sm font-medium border transition-all duration-200"
            :class="form.type === r.key ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/30' : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-400'">
            <span class="block text-xl mb-0.5">{{ r.icon }}</span>{{ r.label }}
          </button>
        </div>

        <!-- 登录表单 -->
        <form v-if="mode === 'login'" @submit.prevent="submit" class="space-y-4">
          <div>
            <label class="text-xs text-gray-500">用户名</label>
            <input v-model="form.username" class="input mt-1" placeholder="请输入用户名" autocomplete="username" />
          </div>
          <div>
            <label class="text-xs text-gray-500">密码</label>
            <input v-model="form.password" type="password" class="input mt-1" placeholder="请输入密码" autocomplete="current-password" />
          </div>
          <div v-if="error" class="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 anim-up">{{ error }}</div>
          <button type="submit" class="btn-green w-full py-2.5" :disabled="loading">
            <Loader2 v-if="loading" class="w-4 h-4 animate-spin inline mr-1" />登 录
          </button>
          <div v-if="!auth.isAdmin" class="text-center text-xs">
            <span class="text-gray-400">还没有账号？</span>
            <button type="button" class="text-emerald-600 hover:underline font-medium" @click="mode = 'register'">去注册</button>
          </div>
        </form>

        <!-- 注册表单（仅普通用户） -->
        <form v-else @submit.prevent="register" class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs text-gray-500">用户名</label>
              <input v-model="reg.username" class="input mt-1" placeholder="登录用户名" />
            </div>
            <div>
              <label class="text-xs text-gray-500">学号</label>
              <input v-model="reg.studentId" class="input mt-1" placeholder="校园学号" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs text-gray-500">密码</label>
              <input v-model="reg.password" type="password" class="input mt-1" placeholder="设置密码" />
            </div>
            <div>
              <label class="text-xs text-gray-500">确认密码</label>
              <input v-model="reg.confirm" type="password" class="input mt-1" placeholder="再次输入" />
            </div>
          </div>
          <div>
            <label class="text-xs text-gray-500">邮箱</label>
            <input v-model="reg.email" class="input mt-1" placeholder="name@campus.edu.cn" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs text-gray-500">手机号</label>
              <input v-model="reg.phone" class="input mt-1" placeholder="选填" />
            </div>
            <div>
              <label class="text-xs text-gray-500">学校</label>
              <input v-model="reg.schoolName" class="input mt-1" placeholder="选填" />
            </div>
          </div>
          <div v-if="error" class="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 anim-up">{{ error }}</div>
          <button type="submit" class="btn-green w-full py-2.5" :disabled="loading">
            <Loader2 v-if="loading" class="w-4 h-4 animate-spin inline mr-1" />注册并登录
          </button>
          <div class="text-center text-xs">
            <button type="button" class="text-gray-400 hover:text-emerald-600" @click="mode = 'login'">← 返回登录</button>
          </div>
        </form>

        <!-- 测试账号 -->
        <div class="mt-6 pt-5 border-t border-gray-100">
          <div class="text-xs text-gray-400 mb-2">演示账号（点一下快速填入，密码 123456）</div>
          <div class="flex flex-wrap gap-2">
            <button v-for="u in demoAccounts" :key="u.username" @click="quickFill(u)"
              class="text-[11px] px-3 py-1.5 rounded-full border border-dashed border-gray-300 text-gray-500 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition">
              {{ u.icon }} {{ u.username }} <span v-if="u.role === 'admin'">(管理员)</span>
            </button>
          </div>
        </div>
      </div>

      <div class="text-center mt-6 text-xs text-gray-400">© 2026 旧易货 · 校园二手交易平台</div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'
import { authApi } from '../api'
import { toast } from '../utils/toast'
import { Loader2 } from 'lucide-vue-next'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const roles = [
  { key: 'user',  label: '普通用户（买家/卖家）', icon: '🧑‍🎓' },
  { key: 'admin', label: '管理员',               icon: '🛡️' }
]

const form = reactive({ type: 'user', username: '张三', password: '123456' })
const reg = reactive({ username: '', password: '', confirm: '', email: '', phone: '', studentId: '', schoolName: '' })
const mode = ref('login')
const loading = ref(false)
const error = ref('')

const demoAccounts = [
  { icon: '🧑‍🎓', username: '张三', password: '123456', role: 'user' },
  { icon: '🧑‍🎓', username: '李四', password: '123456', role: 'user' },
  { icon: '🧑‍🎓', username: '王五', password: '123456', role: 'user' },
  { icon: '🛡️', username: 'admin', password: '123456', role: 'admin' }
]

function selectRole(type) {
  form.type = type
  const u = demoAccounts.find(x => x.role === type)
  if (u) { form.username = u.username; form.password = u.password }
}
function quickFill(u) {
  form.type = u.role
  form.username = u.username
  form.password = u.password
  mode.value = 'login'
}

async function submit() {
  error.value = ''
  if (!form.username || !form.password) { error.value = '请输入用户名和密码'; return }
  loading.value = true
  try {
    const data = await authApi.login({ username: form.username, password: form.password, type: form.type })
    // data: { type:'user'|'admin', user?: {...}, admin?: {...} }
    const profile = data.type === 'admin' ? data.admin : data.user
    auth.login({ type: data.type, profile })
    toast('登录成功', 'success')
    const target = route.query.redirect || auth.homeFor(data.type === 'admin' ? 'admin' : 'user')
    router.replace(target)
  } catch (e) {
    error.value = e.message || '登录失败'
  } finally {
    loading.value = false
  }
}

async function register() {
  error.value = ''
  if (!reg.username || !reg.password || !reg.studentId || !reg.email) { error.value = '请填写用户名、密码、学号与邮箱'; return }
  if (reg.password !== reg.confirm) { error.value = '两次输入的密码不一致'; return }
  loading.value = true
  try {
    await authApi.register({ username: reg.username, password: reg.password, email: reg.email, phone: reg.phone, studentId: reg.studentId, schoolName: reg.schoolName })
    form.type = 'user'
    form.username = reg.username
    form.password = reg.password
    mode.value = 'login'
    toast('注册成功，请登录', 'success')
  } catch (e) {
    error.value = e.message || '注册失败'
  } finally {
    loading.value = false
  }
}
</script>
