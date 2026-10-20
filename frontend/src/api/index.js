// ============ 校园二手物品交易系统 —— 真实后端接口封装 ============
// 对接 D:\campus-backend（Spring Boot @ 8080，vite 已配置 /api 代理）
import axios from 'axios'
import { toast } from '../utils/toast'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '',
  timeout: 10000
})

// 后端统一返回 Result{code,message,data}：code=200 成功，否则视为业务失败
http.interceptors.response.use(
  res => {
    const body = res.data
    if (body && typeof body === 'object' && 'code' in body) {
      if (body.code === 200) return body.data
      const err = new Error(body.message || '请求失败')
      toast(err.message, 'error')
      return Promise.reject(err)
    }
    return body
  },
  err => {
    const msg = err.response?.data?.message || err.message || '网络异常，请确认后端服务已启动'
    toast(msg, 'error')
    return Promise.reject(err)
  }
)

// ---------- 认证 /api/auth ----------
export const authApi = {
  login: data => http.post('/api/auth/login', data), // {username,password,type:user|admin}
  register: data => http.post('/api/auth/register', data)
}

// ---------- 用户 /api/users ----------
export const userApi = {
  list: () => http.get('/api/users'),
  detail: id => http.get(`/api/users/${id}`),
  byStudentId: sid => http.get(`/api/users/student/${sid}`),
  update: (id, patch) => http.put(`/api/users/${id}`, patch)
}

// ---------- 商品 /api/items ----------
export const itemApi = {
  list: (params = {}) => http.get('/api/items', { params }), // {categoryId,keyword}
  page: (params = {}) => http.get('/api/items/page', { params }), // {cursor,pageSize,categoryId,keyword}
  detail: id => http.get(`/api/items/${id}`),
  byUser: userId => http.get(`/api/items/user/${userId}`),
  create: data => http.post('/api/items', data),
  update: (id, patch) => http.put(`/api/items/${id}`, patch),
  remove: id => http.delete(`/api/items/${id}`),
  // 改价：{ newPrice, changedBy, isAdmin, remark }，仅所有者或管理员可操作
  changePrice: (id, data) => http.put(`/api/items/${id}/price`, data),
  // 价格修改历史
  priceHistory: id => http.get(`/api/items/${id}/price-history`),
  // 商品导出 CSV（响应为文件流，单独处理 Blob，不走统一 Result 拦截）
  export: (params = {}) => http.get('/api/items/export', { params, responseType: 'blob' })
}

// ---------- 分类 /api/categories ----------
export const categoryApi = {
  list: () => http.get('/api/categories'),
  create: data => http.post('/api/categories', data),
  remove: id => http.delete(`/api/categories/${id}`)
}

// ---------- 评价 /api/reviews ----------
export const reviewApi = {
  byTarget: userId => http.get(`/api/reviews/target/${userId}`),
  byItem: itemId => http.get(`/api/reviews/item/${itemId}`),
  create: data => http.post('/api/reviews', data), // {reviewerId,targetUserId,itemId,rating,content}
  reply: (id, reply) => http.put(`/api/reviews/${id}/reply`, null, { params: { reply } })
}

// ---------- 收藏 /api/favorites ----------
export const favoriteApi = {
  byUser: userId => http.get(`/api/favorites/user/${userId}`),
  add: data => http.post('/api/favorites', data), // {userId,itemId}
  remove: (userId, itemId) => http.delete(`/api/favorites/${userId}/${itemId}`)
}

// ---------- 站内消息 /api/messages ----------
export const messageApi = {
  send: data => http.post('/api/messages', data), // {senderId,receiverId,itemId,content,msgType}
  inbox: userId => http.get(`/api/messages/inbox/${userId}`),
  outbox: userId => http.get(`/api/messages/outbox/${userId}`),
  unread: userId => http.get(`/api/messages/unread/${userId}`),
  markRead: id => http.put(`/api/messages/${id}/read`)
}

// ---------- 举报 /api/reports ----------
export const reportApi = {
  create: data => http.post('/api/reports', data), // {reporterId,itemId,reportedUserId,reason,evidence}
  list: (params = {}) => http.get('/api/reports', { params }), // {status}
  handle: (id, status) => http.put(`/api/reports/${id}/handle`, null, { params: { status } })
}

// ---------- 订单 /api/orders ----------
export const orderApi = {
  create: data => http.post('/api/orders', data), // {itemId, buyerId, sellerId}（幂等：重复下单返回已有订单）
  detail: id => http.get(`/api/orders/${id}`),
  mine: userId => http.get('/api/orders/mine', { params: { userId } }), // 买家+卖家订单一次拉取
  buyer: userId => http.get(`/api/orders/buyer/${userId}`),
  seller: userId => http.get(`/api/orders/seller/${userId}`),
  all: (status) => http.get('/api/orders', { params: status != null ? { status } : {} }),
  stats: () => http.get('/api/orders/stats'),
  // confirm/pay/ship/complete/cancel；userId 用于后端角色权限校验
  status: (id, action, userId) => http.put(`/api/orders/${id}/status`, null, { params: { action, userId } }),
  shipping: (id, no) => http.put(`/api/orders/${id}/shipping`, null, { params: { shippingNo: no } })
}

// ---------- 求购 /api/wanteds ----------
export const wantedApi = {
  list: (all) => http.get('/api/wanteds', { params: all ? { all: true } : {} }),
  mine: publisherId => http.get(`/api/wanteds/mine/${publisherId}`),
  create: data => http.post('/api/wanteds', data),
  close: id => http.put(`/api/wanteds/${id}/close`),
  remove: id => http.delete(`/api/wanteds/${id}`)
}

// ---------- 管理端 /api/admin ----------
export const adminApi = {
  stats: () => http.get('/api/admin/stats'),
  users: () => http.get('/api/admin/users'),
  toggleUser: (id, status) => http.put(`/api/admin/users/${id}/status`, null, { params: { status } }),
  items: () => http.get('/api/admin/items'),
  offShelf: id => http.put(`/api/admin/items/${id}/off`)
}
