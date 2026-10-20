<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">🛡️ 避坑指南</h1>
      <p class="text-sm text-gray-500 mt-1">校园二手交易安全须知，避免踩坑受骗</p>
    </div>

    <!-- 安全提示横幅 -->
    <div class="rounded-xl p-5 text-white" style="background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);">
      <div class="flex items-start gap-3">
        <span class="text-2xl">⚠️</span>
        <div>
          <h3 class="font-bold text-lg">交易安全提醒</h3>
          <p class="text-sm text-amber-50 mt-1">二手交易请务必当面验货，切勿提前转账。如遇可疑情况，及时举报。</p>
        </div>
      </div>
    </div>

    <!-- 指南分类 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div v-for="(section, idx) in sections" :key="idx" class="card p-5">
        <div class="flex items-center gap-2 mb-4">
          <span class="text-xl">{{ section.icon }}</span>
          <h2 class="text-lg font-bold text-gray-900">{{ section.title }}</h2>
        </div>
        <ul class="space-y-3">
          <li v-for="(tip, i) in section.tips" :key="i" class="flex gap-2.5">
            <span class="shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 text-xs flex items-center justify-center font-bold mt-0.5">{{ i + 1 }}</span>
            <div class="text-sm text-gray-600 leading-relaxed">{{ tip }}</div>
          </li>
        </ul>
      </div>
    </div>

    <!-- 常见骗局 -->
    <div class="card p-6">
      <h2 class="text-lg font-bold text-gray-900 mb-4">🚨 常见骗局识别</h2>
      <div class="space-y-4">
        <div v-for="(scam, idx) in scams" :key="idx" class="flex gap-3 p-3 rounded-lg bg-rose-50 border border-rose-100">
          <span class="text-xl shrink-0">{{ scam.icon }}</span>
          <div>
            <h4 class="font-semibold text-rose-700 text-sm">{{ scam.title }}</h4>
            <p class="text-sm text-gray-600 mt-1">{{ scam.desc }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 举报方式 -->
    <div class="card p-6 text-center">
      <div class="text-4xl mb-3">📞</div>
      <h3 class="font-bold text-gray-900">遇到问题怎么办？</h3>
      <p class="text-sm text-gray-500 mt-2">在商品详情页点击「举报」按钮，或联系平台客服处理</p>
      <router-link to="/user/home" class="btn-green mt-4 inline-flex">返回首页</router-link>
    </div>
  </div>
</template>

<script setup>
const sections = [
  {
    icon: '🔍',
    title: '交易前注意',
    tips: [
      '仔细查看商品图片和描述，要求卖家提供多角度实拍图',
      '确认商品成色、是否有损坏、配件是否齐全',
      '查看卖家信用和历史交易评价',
      '对比同类商品价格，价格过低需警惕',
      '优先选择同校交易，方便当面验货'
    ]
  },
  {
    icon: '💬',
    title: '沟通技巧',
    tips: [
      '在平台内沟通，保留聊天记录作为凭证',
      '问清商品来源、使用时长、维修历史',
      '电子产品要求提供序列号和购买凭证',
      '确认交易时间和地点，优先选择公共场所',
      '不要轻易透露个人隐私信息'
    ]
  },
  {
    icon: '💰',
    title: '付款安全',
    tips: [
      '优先选择当面交易，验货无误后付款',
      '切勿提前转账、付定金或「先款后货」',
      '不要点击陌生链接，不扫陌生二维码',
      '使用平台担保交易更安全',
      '保留付款凭证和聊天记录'
    ]
  },
  {
    icon: '✅',
    title: '验货要点',
    tips: [
      '当面检查商品外观和功能是否正常',
      '电子产品当场测试开机、充电、接口',
      '衣物鞋帽当场试穿，确认尺码和成色',
      '书籍教材检查页码是否完整、有无缺页',
      '确认无误后再完成交易，离手概不负责'
    ]
  }
]

const scams = [
  { icon: '🐟', title: '钓鱼链接', desc: '卖家发送「支付链接」「定金链接」等陌生网址，诱导你在非平台页面输入支付密码。' },
  { icon: '📦', title: '空包裹诈骗', desc: '要求先付款后发货，收到的却是空包裹或与描述严重不符的物品。' },
  { icon: '🎭', title: '冒充客服', desc: '有人冒充平台客服以「订单异常」「账户冻结」为由，要求转账解冻。' },
  { icon: '💵', title: '低价诱导', desc: '商品价格远低于市场价，吸引你先付定金，随后拉黑失联。' }
]
</script>
