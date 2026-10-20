import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const ROLE_HOME = {
  user: '/user/home',
  admin: '/admin/dashboard'
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('campus_token') || '')
  const user = ref(JSON.parse(localStorage.getItem('campus_user') || 'null'))

  /** 角色：user 普通用户 / admin 管理员 */
  const role = computed(() => user.value?.role || '')
  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => role.value === 'admin')

  /** 当前登录者主体 ID（普通用户是 userId，管理员是 adminId，供“我的”页面用） */
  const profileId = computed(() => {
    if (!user.value) return null
    return user.value.type === 'admin' ? user.value.adminId : user.value.userId
  })

  /** 昵称/用户名 */
  const displayName = computed(() => user.value?.username || '访客')

  /** 头像 emoji（数据表无头像时按角色兜底） */
  const avatar = computed(() => user.value?.avatar || (role.value === 'admin' ? '🛡️' : '🧑🎓'))

  /**
   * 登录成功后写入会话
   * @param payload { type:'user'|'admin', profile: 用户/管理员实体 }
   */
  function login(payload) {
    const { type, profile } = payload
    token.value = 'local-' + type + '-' + Date.now()
    user.value = { ...profile, type, role: type === 'admin' ? 'admin' : 'user' }
    localStorage.setItem('campus_token', token.value)
    localStorage.setItem('campus_user', JSON.stringify(user.value))
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('campus_token')
    localStorage.removeItem('campus_user')
  }

  function homeFor(r) { return ROLE_HOME[r] || '/login' }

  return { token, user, role, isLoggedIn, isAdmin, profileId, displayName, avatar, login, logout, homeFor }
})
