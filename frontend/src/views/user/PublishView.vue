<template>
  <div class="max-w-3xl">
    <h2 class="text-xl font-bold text-slate-800 mb-1">📦 发布闲置</h2>
    <p class="text-sm text-slate-400 mb-6">如实填写商品信息，能更快促成交易。发布即上架，可在「我的 → 我发布的」中下架或删除。</p>

    <form @submit.prevent="submit" class="card p-6 space-y-5">
      <div>
        <label class="text-sm font-medium text-slate-700">标题 <span class="text-rose-500">*</span></label>
        <input v-model="form.title" class="input mt-1.5" maxlength="80" placeholder="例：高等数学（第七版）上册，九成新" />
      </div>

      <div class="grid sm:grid-cols-2 gap-5">
        <div>
          <label class="text-sm font-medium text-slate-700">分类 <span class="text-rose-500">*</span></label>
          <select v-model="form.categoryId" class="input mt-1.5">
            <option :value="null" disabled>请选择分类</option>
            <option v-for="c in categories" :key="c.categoryId" :value="c.categoryId">{{ categoryEmoji(c.categoryId) }} {{ c.name }}</option>
          </select>
        </div>
        <div>
          <label class="text-sm font-medium text-slate-700">成色 <span class="text-rose-500">*</span></label>
          <select v-model="form.conditionLevel" class="input mt-1.5">
            <option :value="null" disabled>请选择成色</option>
            <option v-for="(v, k) in CONDITION" :key="k" :value="Number(k)">{{ v.label }}</option>
          </select>
        </div>
      </div>

      <div class="grid sm:grid-cols-2 gap-5">
        <div>
          <label class="text-sm font-medium text-slate-700">出售价格（元）<span class="text-rose-500">*</span></label>
          <input v-model.number="form.price" type="number" min="0" step="0.01" class="input mt-1.5" placeholder="0.00" />
        </div>
        <div>
          <label class="text-sm font-medium text-slate-700">原价 / 参考价（元）</label>
          <input v-model.number="form.originalPrice" type="number" min="0" step="0.01" class="input mt-1.5" placeholder="选填，可体现性价比" />
        </div>
      </div>

      <div>
        <label class="text-sm font-medium text-slate-700">描述 <span class="text-rose-500">*</span></label>
        <textarea v-model="form.description" rows="4" class="input mt-1.5" maxlength="1000" placeholder="介绍商品来源、使用情况、磨损细节、交易方式（校内自提/快递）等…"></textarea>
        <div class="text-right text-xs text-slate-300 mt-1">{{ form.description.length }}/1000</div>
      </div>

      <!-- 图片上传区 -->
      <div>
        <label class="text-sm font-medium text-slate-700">图片封面</label>

        <!-- ① 图片链接输入 -->
        <input v-model="form.images" class="input mt-1.5" placeholder="可选：多个链接用英文逗号分隔；不填也可" />
        <div class="text-xs text-slate-300 mt-1">粘贴 http(s) 图片地址，或用下方按钮从电脑上传</div>

        <!-- ② 此电脑上传按钮 + 隐藏 file input -->
        <div class="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" class="btn-outline flex items-center gap-2 !py-2" @click="$refs.fileInput.click()">
            <Upload class="w-4 h-4" /> 📁 此电脑
          </button>
          <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple
            class="hidden" @change="onFilesSelected" />
          <span class="text-xs text-slate-400">支持 JPG / PNG / WEBP / GIF，单张 ≤ 2MB，最多 6 张</span>
          <span v-if="uploading" class="text-xs text-emerald-600 flex items-center gap-1">
            <Loader2 class="w-3 h-3 animate-spin" /> 处理中…
          </span>
        </div>

        <!-- ③ 预览缩略图网格 -->
        <div v-if="previewList.length" class="mt-4 grid grid-cols-3 sm:grid-cols-6 gap-2">
          <div v-for="(img, idx) in previewList" :key="idx" class="preview-cell">
            <img :src="img" alt="预览" />
            <button type="button" class="preview-del" @click="removeImage(idx)" title="移除">×</button>
          </div>
        </div>
        <div v-else class="mt-3 text-xs text-slate-300">暂未添加图片</div>
      </div>

      <div v-if="error" class="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded px-3 py-2">{{ error }}</div>

      <div class="flex items-center justify-between pt-2">
        <div class="text-xs text-slate-400">发布后默认为「在售」状态，可随时下架</div>
        <button type="submit" class="btn-primary px-8" :disabled="loading">
          <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />发布上架
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../store/auth'
import { itemApi, categoryApi } from '../../api'
import { CONDITION, categoryEmoji, parseImagesList } from '../../utils/format'
import { toast } from '../../utils/toast'
import { Loader2, Upload } from 'lucide-vue-next'

const MAX_IMAGES = 6
const MAX_SIZE_MB = 2
const ACCEPT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

const router = useRouter()
const auth = useAuthStore()

const categories = ref([])
const loading = ref(false)
const uploading = ref(false)
const error = ref('')
const fileInput = ref(null)

const form = reactive({ title: '', categoryId: null, conditionLevel: null, price: null, originalPrice: null, description: '', images: '' })

// 根据 form.images 拆成数组（智能处理 Base64 data URL，不能直接 split(',')）
const previewList = computed(() => parseImagesList(form.images))

/** 用户选了本地文件 */
async function onFilesSelected(e) {
  const files = Array.from(e.target.files || [])
  e.target.value = '' // 允许重复选同一文件

  if (!files.length) return

  // 数量校验
  const remaining = MAX_IMAGES - previewList.value.length
  if (remaining <= 0) {
    toast(`最多上传 ${MAX_IMAGES} 张图片`, 'error')
    return
  }
  const picked = files.slice(0, remaining)
  if (files.length > remaining) {
    toast(`已自动截取前 ${remaining} 张（最多 ${MAX_IMAGES} 张）`, 'info')
  }

  uploading.value = true
  const results = []
  for (const f of picked) {
    // 格式校验
    if (!ACCEPT_TYPES.includes(f.type)) {
      toast(`「${f.name}」格式不支持，已跳过`, 'error')
      continue
    }
    // 大小校验
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      toast(`「${f.name}」超过 ${MAX_SIZE_MB}MB，已跳过`, 'error')
      continue
    }
    // 转 Base64
    try {
      const dataUrl = await fileToDataUrl(f)
      results.push(dataUrl)
    } catch {
      toast(`「${f.name}」读取失败，已跳过`, 'error')
    }
  }

  if (results.length) {
    const existing = parseImagesList(form.images)
    form.images = [...existing, ...results].join(',')
    toast(`已添加 ${results.length} 张图片`, 'success')
  }
  uploading.value = false
}

/** 从预览列表中删除一张 */
function removeImage(idx) {
  const list = previewList.value.slice()
  list.splice(idx, 1)
  form.images = list.join(',')
}

/** File → Base64 data URL */
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

onMounted(async () => {
  categories.value = await categoryApi.list().catch(() => [])
})

async function submit() {
  error.value = ''
  if (!form.title.trim()) return error.value = '请填写商品标题'
  if (!form.categoryId) return error.value = '请选择分类'
  if (!form.conditionLevel) return error.value = '请选择成色'
  if (form.price == null || form.price <= 0) return error.value = '请填写正确的价格'
  if (!form.description.trim()) return error.value = '请填写商品描述'

  loading.value = true
  try {
    const payload = {
      userId: auth.profileId,
      categoryId: form.categoryId,
      title: form.title.trim(),
      description: form.description.trim(),
      price: form.price,
      originalPrice: form.originalPrice || null,
      conditionLevel: form.conditionLevel,
      images: form.images.trim() || null
    }
    const created = await itemApi.create(payload)
    toast('发布成功！商品已上架 🎉', 'success')
    router.push(`/item/${created.itemId}`)
  } catch (e) {
    error.value = e.message || '发布失败'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.preview-cell {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  background: #f1f5f9;
}
.preview-cell img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.preview-del {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(0,0,0,0.55);
  color: white;
  font-size: 14px;
  line-height: 18px;
  text-align: center;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: background 0.12s;
}
.preview-del:hover { background: #ef4444; }
</style>
