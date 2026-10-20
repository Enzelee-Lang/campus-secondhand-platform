<template>
  <div class="app-shell">
    <!-- 顶部导航栏 -->
    <header class="app-header">
      <div class="header-inner">
        <!-- Logo -->
        <router-link :to="auth.role === 'admin' ? '/admin/dashboard' : '/user/home'" class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-base shadow-sm">易</div>
          <div class="leading-tight">
            <div class="font-bold text-[17px]" style="color: rgb(45, 106, 79);">旧易货</div>
            <div class="text-[10px] text-gray-400">让旧物找到新主人</div>
          </div>
        </router-link>

        <!-- 管理员顶部导航 -->
        <nav v-if="auth.role === 'admin'" class="hidden md:flex items-center gap-1">
          <router-link v-for="m in navLinks" :key="m.path" :to="m.path"
            class="px-4 py-2 rounded-md font-medium transition text-[15px]"
            style="color: rgb(45, 106, 79);"
            :class="route.path === m.path ? 'bg-emerald-50' : 'hover:bg-gray-50'">
            {{ m.label }}
          </router-link>
        </nav>

        <!-- 右侧操作 -->
        <div class="flex items-center gap-3">
          <template v-if="auth.role === 'user'">
            <router-link to="/user/publish" class="btn-green hidden sm:inline-flex">+ 发布闲置</router-link>
          </template>
          <div class="flex items-center gap-2 pl-3 border-l border-gray-200">
            <div class="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-sm">{{ auth.avatar }}</div>
            <div class="hidden sm:block">
              <div class="text-sm font-medium text-gray-900 leading-none">{{ auth.displayName }}</div>
              <div class="text-[11px] text-gray-400 mt-0.5">{{ roleLabel }}</div>
            </div>
            <button @click="logout" class="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition" title="退出登录">
              <LogOut class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>

    <div class="app-body">
      <!-- 用户侧边栏 -->
      <aside v-if="auth.role === 'user'" class="sidebar">
        <div class="sidebar-inner">
          <!-- 第一层 · 首页 -->
          <div class="sidebar-group">
            <div class="sidebar-group-title">第一层 · 首页</div>
            <router-link to="/user/home" class="sidebar-link" :class="{ active: route.path === '/user/home' }">
              <span class="sidebar-link-icon home-icon">🏠</span>
              <span>首页 Home</span>
            </router-link>
          </div>

          <!-- 第二层 · 分类页 -->
          <div class="sidebar-group">
            <div class="sidebar-group-title">第二层 · 分类页</div>
            <router-link v-for="c in categories" :key="c.categoryId"
              :to="{ path: '/user/market', query: { categoryId: c.categoryId } }"
              class="sidebar-link"
              :class="{ active: isCatActive(c.categoryId) }">
              <span class="sidebar-link-icon">{{ categoryEmoji(c.categoryId) }}</span>
              <span class="truncate">{{ c.name }}</span>
            </router-link>
            <router-link to="/user/wanted" class="sidebar-link" :class="{ active: route.path === '/user/wanted' }">
              <span class="sidebar-link-icon">📢</span>
              <span>求购广场</span>
            </router-link>
            <router-link to="/user/guide" class="sidebar-link" :class="{ active: route.path === '/user/guide' }">
              <span class="sidebar-link-icon">🛡️</span>
              <span>避坑指南</span>
            </router-link>
          </div>

          <!-- 第三层 · 我的 -->
          <div class="sidebar-group">
            <div class="sidebar-group-title">第三层 · 我的</div>
            <router-link to="/user/publish" class="sidebar-link" :class="{ active: route.path === '/user/publish' }">
              <span class="sidebar-link-icon">📤</span>
              <span>发布闲置</span>
            </router-link>
            <router-link to="/user/orders" class="sidebar-link" :class="{ active: route.path === '/user/orders' }">
              <span class="sidebar-link-icon">📋</span>
              <span>我的订单</span>
            </router-link>
            <router-link to="/user/messages" class="sidebar-link" :class="{ active: route.path === '/user/messages' }">
              <span class="sidebar-link-icon">💬</span>
              <span>站内信</span>
            </router-link>
            <router-link to="/user/mine" class="sidebar-link" :class="{ active: route.path === '/user/mine' }">
              <span class="sidebar-link-icon">👤</span>
              <span>个人中心</span>
            </router-link>
          </div>
        </div>
      </aside>

      <!-- 主内容区 -->
      <main class="app-main">
        <router-view v-slot="{ Component }">
          <component :is="Component" :key="route.fullPath" />
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'
import { categoryApi } from '../api'
import { categoryEmoji } from '../utils/format'
import { LogOut } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const categories = ref([])

const USER_NAV = [
  { path: '/user/home',     label: '首页' },
  { path: '/user/market',   label: '商品广场' },
  { path: '/user/messages', label: '站内信' },
  { path: '/user/orders',   label: '我的订单' },
  { path: '/user/mine',     label: '我的' }
]
const ADMIN_NAV = [
  { path: '/admin/dashboard', label: '运营总览' },
  { path: '/admin/items',     label: '商品管理' },
  { path: '/admin/orders',    label: '订单管理' },
  { path: '/admin/users',     label: '用户管理' },
  { path: '/admin/reports',   label: '举报处理' }
]

const navLinks = computed(() => auth.role === 'admin' ? ADMIN_NAV : USER_NAV)
const roleLabel = computed(() => ({ user: '普通用户', admin: '管理员' }[auth.role] || ''))

function isCatActive(id) {
  return route.path === '/user/market' && Number(route.query.categoryId) === Number(id)
}

function logout() { auth.logout(); router.push('/login') }

onMounted(() => {
  if (auth.role === 'user') {
    categoryApi.list().then(list => { categories.value = list }).catch(() => {})
  }
})
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  background: #f8f9fa;
  display: flex;
  flex-direction: column;
}

/* 顶部导航 */
.app-header {
  background: #fff;
  border-bottom: 1px solid #e9ecef;
  position: sticky;
  top: 0;
  z-index: 40;
  height: 60px;
  flex-shrink: 0;
}
.header-inner {
  max-width: 100%;
  margin: 0 auto;
  padding: 0 24px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* 主体布局 */
.app-body {
  flex: 1;
  display: flex;
  min-height: 0;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

/* 侧边栏 */
.sidebar {
  width: 210px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid #eef0f2;
  overflow-y: auto;
  position: sticky;
  top: 60px;
  height: calc(100vh - 60px);
}
.sidebar-inner {
  padding: 14px 10px;
}

.sidebar-group {
  margin-bottom: 16px;
}
.sidebar-group-title {
  font-size: 11px;
  color: #9ca3af;
  font-weight: 500;
  padding: 0 10px 6px;
  letter-spacing: 0.5px;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 13px;
  color: #374151;
  transition: all 0.15s ease;
  text-decoration: none;
  margin-bottom: 1px;
}
.sidebar-link:hover {
  background: #f3f4f6;
  color: #111827;
}
.sidebar-link.active {
  background: linear-gradient(135deg, #1e4a37 0%, #2d6a4f 100%);
  color: #fff;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(45, 106, 79, 0.2);
}
.sidebar-link.active .sidebar-link-icon {
  background: rgba(255,255,255,0.2);
}

.sidebar-link-icon {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  flex-shrink: 0;
}
.sidebar-link.active .home-icon {
  background: linear-gradient(135deg, #34d399, #10b981);
}

/* 主内容区 */
.app-main {
  flex: 1;
  min-width: 0;
  padding: 24px;
  overflow-x: hidden;
}

/* 响应式：小屏隐藏侧边栏 */
@media (max-width: 480px) {
  .sidebar { display: none; }
  .app-main { padding: 16px; }
}
</style>
