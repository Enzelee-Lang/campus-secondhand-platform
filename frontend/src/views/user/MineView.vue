<template>
  <div class="space-y-6">
    <!-- 个人资料卡 -->
    <div class="card p-6 flex flex-col sm:flex-row gap-6">
      <div class="flex items-center gap-4 sm:w-72">
        <div class="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-3xl shrink-0">{{ auth.avatar }}</div>
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-lg font-bold text-slate-800">{{ auth.displayName }}</span>
            <span class="tag" :class="USER_STATUS[1].cls">正常</span>
          </div>
          <div class="text-xs text-slate-400 mt-1">{{ auth.user?.schoolName || '未填学校' }} · 学号 {{ auth.user?.studentId || '-' }}</div>
          <div class="text-xs text-slate-400 mt-0.5">{{ auth.user?.email || '未填邮箱' }} · {{ auth.user?.phone || '未填手机' }}</div>
        </div>
      </div>
      <div class="flex-1 flex flex-wrap items-center gap-3 justify-end">
        <button class="btn-outline !py-2" @click="editing = !editing">
          <Pencil class="w-4 h-4" />{{ editing ? '取消编辑' : '编辑资料' }}
        </button>
        <router-link to="/user/messages" class="btn-ghost !py-2"><Mail class="w-4 h-4" />站内信{{ unread > 0 ? `（${unread} 未读）` : '' }}</router-link>
      </div>
    </div>

    <!-- 编辑资料 -->
    <form v-if="editing" @submit.prevent="saveProfile" class="card p-6 grid sm:grid-cols-2 gap-4">
      <div>
        <label class="text-xs text-slate-500">邮箱</label>
        <input v-model="profile.email" class="input mt-1" placeholder="name@campus.edu.cn" />
      </div>
      <div>
        <label class="text-xs text-slate-500">手机号</label>
        <input v-model="profile.phone" class="input mt-1" placeholder="手机号" />
      </div>
      <div>
        <label class="text-xs text-slate-500">学校</label>
        <input v-model="profile.schoolName" class="input mt-1" placeholder="学校名称" />
      </div>
      <div>
        <label class="text-xs text-slate-500">头像（选个 emoji）</label>
        <div class="flex gap-1.5 mt-1.5">
          <button v-for="e in EMOJIS" :key="e" type="button" @click="profile.avatar = e"
            class="w-9 h-9 rounded-lg text-lg flex items-center justify-center border transition"
            :class="profile.avatar === e ? 'bg-blue-100 border-blue-400' : 'border-slate-200 hover:border-blue-300'">{{ e }}</button>
        </div>
      </div>
      <div class="sm:col-span-2 flex justify-end">
        <button type="submit" class="btn-primary" :disabled="saving"><Loader2 v-if="saving" class="w-4 h-4 animate-spin" />保存修改</button>
      </div>
    </form>

    <!-- 统计行 -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard title="我发布的（全部）" :value="myItems.length" :icon="PackageOpen" color="from-blue-500 to-indigo-500" hint="含已下架" />
      <StatCard title="正在出售" :value="myItems.filter(i => i.status === 1).length" :icon="Store" color="from-emerald-500 to-teal-500" />
      <StatCard title="我的收藏" :value="favItems.length" :icon="Heart" color="from-rose-500 to-pink-500" />
      <StatCard title="累计浏览" :value="totalViews" :icon="Eye" color="from-amber-500 to-orange-500" />
    </div>

    <!-- 我的发布 -->
    <div id="my-items" class="card p-6 scroll-target">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-bold text-slate-800">📤 我发布的</h3>
        <router-link to="/user/publish" class="text-xs text-blue-600 hover:underline">+ 再发布一件</router-link>
      </div>
      <div v-if="myItems.length" class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
        <ItemCard v-for="it in myItems" :key="it.itemId" :item="it" show-status @open="goItem">
          <template #actions>
            <button class="flex-1 text-xs py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100" @click="openPrice(it)">改价</button>
            <button v-if="it.status === 1" class="flex-1 text-xs py-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100" @click="off(it)">下架</button>
            <button v-else class="flex-1 text-xs py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100" @click="on(it)">重新上架</button>
            <button class="flex-1 text-xs py-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100" @click="del(it)">删除</button>
          </template>
        </ItemCard>
      </div>
      <div v-else class="text-center py-10 text-sm text-slate-400">还没有发布过商品</div>
    </div>

    <!-- 我的收藏 -->
    <div id="my-favs" class="card p-6 scroll-target">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-bold text-slate-800">❤️ 我的收藏</h3>
        <span class="text-xs text-slate-400">{{ favItems.length }} 件宝贝</span>
      </div>
      <div v-if="favItems.length" class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
        <ItemCard v-for="it in favItems" :key="it.itemId" :item="it" @open="goItem">
          <template #actions>
            <button class="flex-1 text-xs py-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100" @click="unfav(it)">取消收藏</button>
          </template>
        </ItemCard>
      </div>
      <div v-else class="text-center py-10">
        <div class="text-4xl mb-2">🤍</div>
        <p class="text-sm text-slate-400">去商品广场逛逛，把喜欢的宝贝收藏起来吧</p>
        <router-link to="/user/market" class="btn-primary mt-4 inline-flex">去逛逛</router-link>
      </div>
    </div>

    <!-- 改价弹窗 -->
    <PriceChangeDialog v-model:visible="priceDialogOpen" :item="priceItem" @success="onPriceChanged" />
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../store/auth'
import { itemApi, userApi, favoriteApi, messageApi } from '../../api'
import { USER_STATUS } from '../../utils/format'
import { toast } from '../../utils/toast'
import StatCard from '../../components/StatCard.vue'
import ItemCard from '../../components/ItemCard.vue'
import PriceChangeDialog from '../../components/PriceChangeDialog.vue'
import { Pencil, Mail, PackageOpen, Store, Heart, Eye, Loader2 } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const me = computed(() => auth.profileId)

function scrollToSection() {
  const h = route.query.section || route.hash?.replace('#', '')
  if (!h) return
  const map = { items: 'my-items', favs: 'my-favs' }
  const id = map[h] || h
  nextTick(() => {
    const el = document.getElementById(id)
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 80
      window.scrollTo({ top, behavior: 'smooth' })
    }
  })
}

const myItems = ref([])
const favItems = ref([])
const unread = ref(0)
const editing = ref(false)
const saving = ref(false)
const priceDialogOpen = ref(false)
const priceItem = ref(null)

const profile = reactive({ email: '', phone: '', schoolName: '', avatar: '' })
const EMOJIS = ['🧑‍🎓', '😎', '🐱', '🐶', '🌸', '🔥', '⚽', '🎮']

const totalViews = computed(() => myItems.value.reduce((s, i) => s + (i.viewCount || 0), 0))

function goItem(it) { router.push(`/item/${it.itemId}`) }

async function load() {
  myItems.value = await itemApi.byUser(me.value).catch(() => [])
  unread.value = await messageApi.unread(me.value).catch(() => 0)

  const favs = await favoriteApi.byUser(me.value).catch(() => [])
  if (favs.length) {
    const all = await itemApi.list().catch(() => [])
    favItems.value = favs
      .map(f => all.find(i => i.itemId === f.itemId))
      .filter(Boolean)
  } else {
    favItems.value = []
  }
}

async function off(it) {
  if (!confirm(`确定下架「${it.title}」吗？下架后其他同学将无法看到。`)) return
  await itemApi.update(it.itemId, { status: 2 }).catch(() => {})
  toast('已下架', 'success'); load()
}
async function on(it) {
  await itemApi.update(it.itemId, { status: 1 }).catch(() => {})
  toast('已重新上架', 'success'); load()
}
async function del(it) {
  if (!confirm(`确定删除「${it.title}」吗？删除后不可恢复！`)) return
  await itemApi.remove(it.itemId).catch(() => {})
  toast('已删除', 'success'); load()
}
function openPrice(it) {
  priceItem.value = it
  priceDialogOpen.value = true
}
function onPriceChanged() {
  load() // 改价成功后刷新列表
}
async function unfav(it) {
  await favoriteApi.remove(me.value, it.itemId).catch(() => {})
  toast('已取消收藏', 'info'); load()
}

async function saveProfile() {
  saving.value = true
  try {
    await userApi.update(me.value, {
      email: profile.email || null,
      phone: profile.phone || null,
      schoolName: profile.schoolName || null,
      avatar: profile.avatar || null
    })
    auth.user.email = profile.email
    auth.user.phone = profile.phone
    auth.user.schoolName = profile.schoolName
    auth.user.avatar = profile.avatar
    localStorage.setItem('campus_user', JSON.stringify(auth.user))
    toast('资料已更新', 'success')
    editing.value = false
  } catch (e) { /* noop */ } finally { saving.value = false }
}

function toggleEdit() {
  editing.value = !editing.value
  if (editing.value) {
    profile.email = auth.user?.email || ''
    profile.phone = auth.user?.phone || ''
    profile.schoolName = auth.user?.schoolName || ''
    profile.avatar = auth.user?.avatar || ''
  }
}

onMounted(() => { load(); toggleEdit(); editing.value = false; scrollToSection() })
watch(() => route.query.section, () => scrollToSection())
</script>
