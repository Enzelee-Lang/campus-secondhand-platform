// ============ 业务字典与格式化工具（校园二手交易系统） ============

/** 商品成色 1-5 */
export const CONDITION = {
  1: { label: '全新',       cls: 'bg-emerald-100 text-emerald-700' },
  2: { label: '几乎全新',   cls: 'bg-sky-100 text-sky-700' },
  3: { label: '轻微使用',   cls: 'bg-amber-100 text-amber-700' },
  4: { label: '明显使用痕迹', cls: 'bg-orange-100 text-orange-700' },
  5: { label: '已磨损',     cls: 'bg-slate-200 text-slate-600' }
}

/** 商品状态 1=在售 2=已下架 3=已售出 */
export const ITEM_STATUS = {
  1: { label: '在售',   cls: 'bg-emerald-100 text-emerald-700' },
  2: { label: '已下架', cls: 'bg-slate-200 text-slate-600' },
  3: { label: '已售出', cls: 'bg-slate-300 text-slate-600' }
}

/** 订单状态 0-待确认 1-待支付 2-待发货 3-已发货 4-已完成 5-已取消 */
export const ORDER_STATUS = {
  0: { label: '待确认', cls: 'bg-amber-100 text-amber-700', step: 0 },
  1: { label: '待支付', cls: 'bg-orange-100 text-orange-700', step: 1 },
  2: { label: '待发货', cls: 'bg-sky-100 text-sky-700', step: 2 },
  3: { label: '已发货', cls: 'bg-indigo-100 text-indigo-700', step: 3 },
  4: { label: '已完成', cls: 'bg-emerald-100 text-emerald-700', step: 4 },
  5: { label: '已取消', cls: 'bg-slate-200 text-slate-500', step: -1 }
}
/** 订单进度步骤（用于进度条展示） */
export const ORDER_STEPS = ['下单', '待支付', '待发货', '已发货', '已完成']

/** 用户状态 1=正常 0=禁用 */
export const USER_STATUS = {
  1: { label: '正常', cls: 'bg-emerald-100 text-emerald-700' },
  0: { label: '已禁用', cls: 'bg-rose-100 text-rose-600' }
}

/** 举报状态 0=待处理 1=已处理 2=已驳回 */
export const REPORT_STATUS = {
  0: { label: '待处理', cls: 'bg-amber-100 text-amber-700' },
  1: { label: '已处理', cls: 'bg-emerald-100 text-emerald-700' },
  2: { label: '已驳回', cls: 'bg-slate-200 text-slate-600' }
}

/** 消息是否已读 0=未读 1=已读 */
export const READ_STATE = {
  0: { label: '未读', cls: 'bg-blue-100 text-blue-700' },
  1: { label: '已读', cls: 'bg-slate-100 text-slate-500' }
}

/** 分类 → 占位封面 emoji 与底色（商品没有真实图片时使用） */
const CATEGORY_STYLE = {
  1: { emoji: '📚', bg: 'bg-blue-50',   ring: 'text-blue-500' },
  2: { emoji: '📱', bg: 'bg-violet-50', ring: 'text-violet-500' },
  3: { emoji: '🧺', bg: 'bg-amber-50',  ring: 'text-amber-500' },
  4: { emoji: '🏸', bg: 'bg-emerald-50',ring: 'text-emerald-500' },
  5: { emoji: '👕', bg: 'bg-pink-50',   ring: 'text-pink-500' },
  6: { emoji: '📦', bg: 'bg-slate-100', ring: 'text-slate-500' }
}
export function categoryStyle(id) {
  return CATEGORY_STYLE[Number(id)] || CATEGORY_STYLE[6]
}
export function categoryEmoji(id) {
  return categoryStyle(id).emoji
}

/** 金额格式化：¥xx.xx */
export const money = v => '¥' + Number(v ?? 0).toFixed(2)

/** 时间格式化：2026-09-02T20:28:21 -> 2026-09-02 20:28 */
export const fmtTime = s => (s ? String(s).replace('T', ' ').slice(0, 16) : '-')

/**
 * 从商品 images 字段中提取第一张图片（安全处理 Base64 data URL）
 * Base64 data URL 格式为 data:image/jpeg;base64,AAAA... —— 内部含逗号，
 * 不能直接用 split(',')[0]，否则只拿到 "data:image/jpeg;base64" 前缀（无效 URL）
 */
export function parseFirstImage(imagesStr) {
  if (!imagesStr) return ''
  const s = String(imagesStr).trim()
  if (!s) return ''
  // Base64 data URL → 整张就是一个合法 URL，直接返回
  if (s.startsWith('data:')) return s
  // 普通 URL 逗号分隔多张 → 第一张不含逗号，安全 split
  return s.split(',')[0].trim()
}

/**
 * 把 images 字段解析成图片数组（智能处理 Base64 data URL）
 * 能正确提取多张混合存储的图片（例如 "data:...,https://...,/img/...")
 */
export function parseImagesList(imagesStr) {
  if (!imagesStr) return []
  const s = String(imagesStr).trim()
  if (!s) return []
  // 没有逗号 → 单张，直接返回
  if (!s.includes(',')) return [s]
  // 包含 data: → 混合格式，用 while 循环精确切分
  if (s.includes('data:')) {
    const results = []
    let i = 0
    while (i < s.length) {
      if (s.startsWith('data:', i)) {
        const nextData = s.indexOf('data:', i + 5)
        const end = nextData === -1 ? s.length : nextData
        const piece = s.slice(i, end).trim()
        if (piece) results.push(piece)
        i = end
      } else {
        const nextComma = s.indexOf(',', i)
        const nextData = s.indexOf('data:', i)
        let end = s.length
        if (nextComma !== -1 && (nextData === -1 || nextComma < nextData)) end = nextComma
        else if (nextData !== -1) end = nextData
        const piece = s.slice(i, end).trim()
        if (piece) results.push(piece)
        i = end
      }
      // 跳过分隔用的逗号
      while (i < s.length && s[i] === ',') i++
    }
    return results
  }
  // 纯普通 URL 逗号分隔 → 直接 split
  return s.split(',').map(x => x.trim()).filter(Boolean)
}

/** 问候语 */
export function greeting() {
  const h = new Date().getHours()
  if (h < 6) return '夜深了'
  if (h < 12) return '上午好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
}
