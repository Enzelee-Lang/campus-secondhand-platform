<template>
  <div class="max-w-5xl">
    <div class="flex items-center justify-between mb-5">
      <h2 class="text-xl font-bold text-slate-800">✉️ 消息</h2>
      <span v-if="unread > 0" class="text-xs text-rose-500">共 {{ unread }} 条未读</span>
    </div>

    <!-- 会话列表 -->
    <div v-if="sessions.length" class="card !p-0 overflow-hidden">
      <div v-for="(s, idx) in sessions" :key="s.key"
        class="session-item"
        :class="{ 'border-t border-slate-100': idx > 0 }"
        @click="enterChat(s)">

        <!-- 对方头像 -->
        <div class="session-avatar" :class="{ 'bg-rose-500': s.unread > 0 }">
          {{ (s.peerName || '?').slice(0, 1) }}
          <span v-if="s.unread > 0" class="session-badge">{{ s.unread > 99 ? '99+' : s.unread }}</span>
        </div>

        <!-- 会话主区 -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2 min-w-0">
              <span class="font-semibold text-slate-800 truncate">{{ s.peerName }}</span>
              <router-link v-if="s.itemTitle" :to="`/item/${s.itemId}`" @click.stop
                class="tag bg-indigo-50 text-indigo-600 hover:bg-indigo-100 shrink-0">
                📦 {{ s.itemTitle }}
              </router-link>
            </div>
            <span class="text-xs text-slate-400 shrink-0">{{ s.timeLabel }}</span>
          </div>
          <p class="text-sm text-slate-500 mt-1 truncate">
            <span v-if="s.isSystem" class="text-emerald-600">📢 </span>
            {{ s.isMine ? '我: ' : '' }}{{ s.preview }}
          </p>
        </div>

        <!-- 商品缩略图 -->
        <div v-if="s.itemImage" class="session-thumb shrink-0">
          <img :src="s.itemImage" :alt="s.itemTitle" />
        </div>
        <div v-else-if="s.itemTitle" class="session-thumb shrink-0 bg-slate-100 flex items-center justify-center text-slate-300 text-lg">📦</div>
      </div>
    </div>

    <!-- 空态 -->
    <div v-else class="card p-14 text-center">
      <div class="text-6xl mb-4">💬</div>
      <p class="text-slate-500 font-medium">还没有消息</p>
      <p class="text-xs text-slate-400 mt-1">在商品详情页点「联系卖家」即可发起聊天</p>
      <router-link to="/user/market" class="btn-primary mt-5 inline-flex">去逛逛</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../store/auth'
import { messageApi, userApi, itemApi } from '../../api'
import { fmtTime, parseFirstImage } from '../../utils/format'

const router = useRouter()
const auth = useAuthStore()
const me = computed(() => auth.profileId)

const unread = ref(0)
const sessions = ref([])

async function load() {
  try {
    // 拉取我收到的 + 我发出的所有消息
    const [inbox, outbox, users, allItems] = await Promise.all([
      messageApi.inbox(me.value).catch(() => []),
      messageApi.outbox(me.value).catch(() => []),
      userApi.list().catch(() => []),
      itemApi.list().catch(() => [])
    ])

    // 名字 / 商品映射
    const userMap = {}
    users.forEach(u => { userMap[Number(u.userId)] = u.username })
    const itemMap = {}
    allItems.forEach(it => { itemMap[Number(it.itemId)] = it })

    // 合并所有消息，按 (peerId, itemId) 分组
    const all = [...inbox, ...outbox]
    // 标记 isMine（我发出的）
    all.forEach(m => { m._isMine = Number(m.senderId) === Number(me.value) })

    // 构建会话
    const groupMap = new Map()
    all.forEach(m => {
      const peerId = m._isMine ? m.receiverId : m.senderId
      const key = `${peerId}_${m.itemId || 0}`
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          key,
          peerId: Number(peerId),
          itemId: m.itemId ? Number(m.itemId) : null,
          messages: [],
          latest: null,
          unread: 0
        })
      }
      const g = groupMap.get(key)
      g.messages.push(m)
      if (!m._isMine && m.isRead === 0) g.unread += 1
    })

    // 取每组最新一条消息
    groupMap.forEach(g => {
      g.messages.sort((a, b) => String(b.createTime || '').localeCompare(String(a.createTime || '')))
      g.latest = g.messages[0]
    })

    // 转为列表，按最新消息时间倒序
    const list = Array.from(groupMap.values())
    list.sort((a, b) => String(b.latest.createTime || '').localeCompare(String(a.latest.createTime || '')))

    sessions.value = list.map(g => {
      const it = g.itemId ? itemMap[g.itemId] : null
      const imgRaw = it?.images || ''
      const img = parseFirstImage(imgRaw)
      const isSystem = g.latest.msgType === 2
      const content = g.latest.content || ''
      return {
        key: g.key,
        peerId: g.peerId,
        peerName: userMap[g.peerId] || `用户${g.peerId}`,
        itemId: g.itemId,
        itemTitle: it?.title || '',
        itemImage: img,
        unread: g.unread,
        preview: content.length > 40 ? content.slice(0, 40) + '…' : content,
        isMine: g.latest._isMine,
        isSystem,
        timeLabel: fmtTime(g.latest.createTime)
      }
    })

    // 总未读数
    unread.value = sessions.value.reduce((s, x) => s + x.unread, 0)
  } catch (e) { /* noop */ }
}

function enterChat(s) {
  if (s.unread > 0) {
    // 标记该会话下对方发来的消息全部已读
    sessions.value.forEach(g => {
      if (g.key === s.key) {
        g.messages.forEach(m => {
          if (!m._isMine && m.isRead === 0) {
            messageApi.markRead(m.msgId).catch(() => {})
          }
        })
      }
    })
  }
  router.push({ path: '/chat', query: { item: s.itemId, peer: s.peerId } })
}

onMounted(load)
</script>

<style scoped>
.session-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  cursor: pointer;
  transition: background 0.12s;
}
.session-item:hover { background: #f8fafc; }

.session-avatar {
  position: relative;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: white;
  flex-shrink: 0;
  flex-direction: row;
}
.session-avatar.bg-rose-500 { background: #f43f5e; }

.session-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: #ef4444;
  color: white;
  font-size: 10px;
  font-weight: 600;
  line-height: 18px;
  text-align: center;
  box-shadow: 0 0 0 2px white;
}

.session-thumb {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  overflow: hidden;
  background: #f1f5f9;
}
.session-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 窄屏优化 */
@media (max-width: 640px) {
  .session-thumb { display: none; }
  .session-item { padding: 12px 14px; gap: 10px; }
}
</style>
