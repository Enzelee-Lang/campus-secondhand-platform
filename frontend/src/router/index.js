import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '../store/auth'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'login', component: () => import('../views/LoginView.vue'), meta: { public: true } },

  // 商品详情（登录后任意角色可看，独立页）
  { path: '/item/:id', name: 'item-detail', component: () => import('../views/user/ItemDetailView.vue') },

  // 私聊聊天页（闲鱼风格，顶部展示商品信息），需登录
  { path: '/chat', name: 'chat', component: () => import('../views/user/ChatView.vue') },

  // 普通用户端（买家/卖家一体）
  {
    path: '/user',
    component: () => import('../layouts/MainLayout.vue'),
    meta: { role: 'user' },
    children: [
      { path: '', redirect: '/user/home' },
      { path: 'home',     name: 'user-home',     component: () => import('../views/user/HomeView.vue') },
      { path: 'market',   name: 'user-market',   component: () => import('../views/user/MarketView.vue') },
      { path: 'publish',  name: 'user-publish',  component: () => import('../views/user/PublishView.vue') },
      { path: 'mine',     name: 'user-mine',     component: () => import('../views/user/MineView.vue') },
      { path: 'messages', name: 'user-messages', component: () => import('../views/user/MessagesView.vue') },
      { path: 'orders',   name: 'user-orders',   component: () => import('../views/user/OrdersView.vue') },
      { path: 'wanted',   name: 'user-wanted',   component: () => import('../views/user/WantedView.vue') },
      { path: 'guide',    name: 'user-guide',    component: () => import('../views/user/GuideView.vue') }
    ]
  },

  // 管理端
  {
    path: '/admin',
    component: () => import('../layouts/MainLayout.vue'),
    meta: { role: 'admin' },
    children: [
      { path: '', redirect: '/admin/dashboard' },
      { path: 'dashboard', name: 'admin-dashboard', component: () => import('../views/admin/DashboardView.vue') },
      { path: 'items',     name: 'admin-items',     component: () => import('../views/admin/ItemsView.vue') },
      { path: 'users',     name: 'admin-users',     component: () => import('../views/admin/UsersView.vue') },
      { path: 'reports',   name: 'admin-reports',   component: () => import('../views/admin/ReportsView.vue') },
      { path: 'orders',    name: 'admin-orders',    component: () => import('../views/admin/OrdersView.vue') }
    ]
  },

  { path: '/:pathMatch(.*)*', redirect: '/login' }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const auth = useAuthStore()
  if (to.meta.public) return next()
  if (!auth.isLoggedIn) return next({ path: '/login', query: { redirect: to.fullPath } })
  if (to.meta.role && to.meta.role !== auth.role) {
    return next(auth.homeFor(auth.role))
  }
  next()
})

export default router
