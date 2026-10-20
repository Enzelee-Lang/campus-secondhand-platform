import { reactive } from 'vue'

export const toasts = reactive([])
let seq = 0

/** 全局轻提示：toast('发布成功', 'success') / toast('服务器开小差了', 'error') */
export function toast(message, type = 'info', duration = 2600) {
  const id = ++seq
  toasts.push({ id, message, type })
  setTimeout(() => {
    const i = toasts.findIndex(t => t.id === id)
    if (i > -1) toasts.splice(i, 1)
  }, duration)
}
