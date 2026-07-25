<template>
  <section class="page-content admin-grid-page">
    <div class="admin-grid-hero">
      <div>
        <span class="admin-grid-eyebrow">文章系统</span>
        <h1>文章系统</h1>
        <p>维护用户协议、隐私政策、平台说明、积分规则等长文本内容，发布后用户端可通过固定 slug 实时访问。</p>
      </div>
      <button class="primary-btn compact" @click="openCreate">新增文章</button>
    </div>

    <div class="admin-grid-stats">
      <article><i>文</i><div><small>全部文章</small><strong>{{ list.length }}</strong></div></article>
      <article><i class="lime">发</i><div><small>已发布</small><strong>{{ publishedCount }}</strong></div></article>
      <article><i class="gray">草</i><div><small>草稿 / 下线</small><strong>{{ offlineCount }}</strong></div></article>
      <article><i class="orange">模</i><div><small>内置模板</small><strong>{{ templates.length }}</strong></div></article>
    </div>

    <div class="template-row">
      <button v-for="tpl in templates" :key="tpl.slug" type="button" @click="useTemplate(tpl)">
        <b>{{ tpl.title }}</b>
        <small>{{ tpl.slug }}</small>
      </button>
    </div>

    <div class="admin-grid-card">
      <div class="admin-grid-toolbar">
        <div class="admin-grid-groupbar"><i>☷</i><span>Drag here to set row groups</span><em>可按分类、发布状态、是否置顶分组</em></div>
        <span class="admin-grid-count">共 {{ filtered.length }} 篇文章</span>
      </div>
      <div class="admin-grid-filters">
        <label><span>文章搜索</span><input v-model.trim="keyword" placeholder="标题 / slug / 摘要"></label>
        <label><span>状态</span><select v-model="statusFilter"><option value="all">全部状态</option><option value="published">已发布</option><option value="draft">草稿 / 下线</option></select></label>
        <label><span>分类</span><select v-model="categoryFilter"><option value="all">全部分类</option><option v-for="item in categories" :key="item" :value="item">{{ item }}</option></select></label>
      </div>

      <div class="admin-grid-table-wrap">
        <table class="admin-grid-table">
          <thead>
            <tr class="group-head"><th class="admin-grid-num"></th><th colspan="2">文章信息</th><th>排序</th><th>发布</th><th>状态</th><th>操作</th></tr>
            <tr class="head">
              <th class="admin-grid-num">#</th>
              <th>文章信息 <button>⋮</button></th>
              <th>固定链接 / 分类 <button>⋮</button></th>
              <th>排序 <button>⋮</button></th>
              <th>发布时间 <button>⋮</button></th>
              <th>状态 <button>⋮</button></th>
              <th>操作</th>
            </tr>
            <tr class="filters">
              <th></th>
              <th><input class="filter-control" v-model.trim="titleFilter" placeholder="标题"></th>
              <th><input class="filter-control" v-model.trim="slugFilter" placeholder="slug / 分类"></th>
              <th></th>
              <th></th>
              <th><select class="filter-control" v-model="statusFilter"><option value="all">全部</option><option value="published">发布</option><option value="draft">下线</option></select></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in pagedList" :key="item.id">
              <td class="admin-grid-num">{{ startIndex + index + 1 }}</td>
              <td><b>{{ item.title }}</b><small>{{ item.summary || '暂无摘要' }}</small></td>
              <td><span class="admin-grid-pill green">{{ item.slug }}</span><small>{{ item.category || '未分类' }} · {{ item.pinned ? '置顶展示' : '普通排序' }}</small></td>
              <td><b>{{ item.sort_order }}</b><small>越小越靠前</small></td>
              <td><b>{{ formatTime(item.published_at) }}</b><small>更新于 {{ formatTime(item.updated_at) }}</small></td>
              <td><span :class="['admin-grid-pill', item.status ? 'green' : 'gray']">{{ item.status ? '已发布' : '草稿 / 下线' }}</span><small>{{ item.status ? '用户端可见' : '用户端隐藏' }}</small></td>
              <td>
                <div class="admin-grid-actions">
                  <button @click="openEdit(item)">编辑</button>
                  <button class="orange" @click="toggleStatus(item)">{{ item.status ? '下线' : '发布' }}</button>
                  <button class="danger" @click="removeItem(item)">删除</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="!filtered.length" class="admin-grid-empty">暂无符合条件的文章</div>
      </div>
      <PaginationBar v-model:page="page" v-model:page-size="pageSize" :total="filtered.length" />
    </div>

    <div v-if="showDialog" class="dialog-mask" @click.self="closeDialog">
      <form class="dialog article-dialog" @submit.prevent="submit">
        <div class="dialog-head">
          <div><h2>{{ form.id ? '编辑文章' : '新增文章' }}</h2><p>slug 只允许英文、数字、横杠和下划线；用户协议建议使用 user-agreement。</p></div>
          <button type="button" @click="closeDialog">×</button>
        </div>
        <div class="dialog-body">
          <div class="two-fields">
            <div class="field"><label>文章标题</label><input v-model.trim="form.title" required></div>
            <div class="field"><label>固定链接 slug</label><input v-model.trim="form.slug" required></div>
          </div>
          <div class="field"><label>摘要</label><input v-model.trim="form.summary" maxlength="255"></div>
          <div class="two-fields">
            <div class="field"><label>分类</label><input v-model.trim="form.category"></div>
            <div class="field"><label>封面图（可选）</label><input v-model.trim="form.cover"></div>
          </div>
          <div class="two-fields">
            <div class="field"><label>排序值</label><input v-model.number="form.sort_order" type="number" min="0"></div>
            <div class="field"><label>状态</label><select v-model="statusText"><option value="draft">先存草稿</option><option value="published">立即发布</option></select></div>
          </div>
          <label class="enable-row"><div><b>置顶文章</b><span>置顶后会优先展示在用户端文章中心顶部</span></div><input v-model="form.pinned" type="checkbox"></label>
          <div class="field"><label>正文内容</label><textarea v-model.trim="form.content" class="article-content" required></textarea></div>
        </div>
        <div class="dialog-actions"><button type="button" @click="closeDialog">取消</button><button class="primary-btn" type="submit">{{ form.id ? '保存更新' : '创建文章' }}</button></div>
      </form>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { api } from '../services/api'
import PaginationBar from './PaginationBar.vue'

const emit = defineEmits(['toast'])
const list = ref([])
const showDialog = ref(false)
const statusText = ref('draft')
const form = ref(createEmpty())
const keyword = ref('')
const statusFilter = ref('all')
const categoryFilter = ref('all')
const titleFilter = ref('')
const slugFilter = ref('')
const page = ref(1)
const pageSize = ref(10)

const templates = [
  {
    title: '用户协议',
    slug: 'user-agreement',
    category: '协议规则',
    summary: '说明账号注册、服务购买、积分权益、旅行预约等基础使用规则。',
    content: '欢迎使用学徒行。\n\n1. 你在注册、登录、购买学习服务、参与积分活动或预约旅行服务时，应提供真实、有效的信息。\n2. 平台展示的学习服务、资料包、积分权益和旅行路线以实际发布页面为准。\n3. 用户不得利用邀请、积分、客服、订单等功能进行刷量、作弊或侵犯他人权益。\n4. 如服务内容发生调整，平台将通过公告、文章或客服消息进行说明。\n5. 继续使用学徒行，即表示你已阅读并同意本协议。',
  },
  {
    title: '隐私政策',
    slug: 'privacy-policy',
    category: '协议规则',
    summary: '说明平台如何收集、使用和保护手机号、客服记录、认证资料等信息。',
    content: '学徒行重视你的隐私与信息安全。\n\n1. 我们会根据功能需要收集手机号、昵称、学习偏好、订单信息、客服聊天记录和录取通知书认证资料。\n2. 上述信息主要用于账号识别、注册审核、积分发放、客服沟通、订单预约和权益认证。\n3. 录取通知书等敏感图片仅用于认证审核，不会用于无关用途。\n4. 你可以通过客服或平台提供的功能申请修改密码、注销账号或咨询个人信息处理情况。\n5. 我们会采取合理安全措施保护数据，但请你也妥善保管账号密码。',
  },
  {
    title: '关于学徒行',
    slug: 'about-xuetuxing',
    category: '平台介绍',
    summary: '青年备考成长与定制旅行服务平台介绍。',
    content: '学徒行是一款面向大学生与青年备考人群的小程序。\n\n我们希望把备考陪伴、学习资料、督学服务、积分邀友和定制旅行连接起来：认真学习时有人同行，上岸之后也能好好出发。',
  },
]

function createEmpty() {
  return { id: null, title: '', slug: '', summary: '', content: '', category: '协议规则', cover: '', pinned: false, sort_order: 0 }
}

const publishedCount = computed(() => list.value.filter(item => item.status).length)
const offlineCount = computed(() => list.value.length - publishedCount.value)
const categories = computed(() => [...new Set(list.value.map(item => item.category).filter(Boolean))])
const filtered = computed(() => {
  const key = keyword.value.toLowerCase()
  const titleKey = titleFilter.value.toLowerCase()
  const slugKey = slugFilter.value.toLowerCase()
  return list.value.filter(item => {
    const slugText = `${item.slug || ''} ${item.category || ''}`.toLowerCase()
    const text = `${item.title || ''} ${item.summary || ''} ${slugText}`.toLowerCase()
    return (!key || text.includes(key))
      && (!titleKey || String(item.title || '').toLowerCase().includes(titleKey))
      && (!slugKey || slugText.includes(slugKey))
      && (statusFilter.value === 'all' || (statusFilter.value === 'published' ? item.status : !item.status))
      && (categoryFilter.value === 'all' || item.category === categoryFilter.value)
  })
})
const startIndex = computed(() => (page.value - 1) * pageSize.value)
const pagedList = computed(() => filtered.value.slice(startIndex.value, startIndex.value + pageSize.value))
watch(filtered, () => { page.value = 1 })

const formatTime = value => (value ? String(value).replace('T', ' ').slice(0, 16) : '未发布')

const load = async () => {
  list.value = await api.getArticles()
}

const openCreate = () => {
  form.value = createEmpty()
  statusText.value = 'draft'
  showDialog.value = true
}

const useTemplate = tpl => {
  form.value = { ...createEmpty(), ...tpl, sort_order: tpl.slug === 'user-agreement' ? 1 : tpl.slug === 'privacy-policy' ? 2 : 10 }
  statusText.value = 'published'
  showDialog.value = true
}

const openEdit = item => {
  form.value = {
    id: item.id,
    title: item.title,
    slug: item.slug,
    summary: item.summary || '',
    content: item.content || '',
    category: item.category || '协议规则',
    cover: item.cover || '',
    pinned: !!item.pinned,
    sort_order: Number(item.sort_order || 0),
  }
  statusText.value = item.status ? 'published' : 'draft'
  showDialog.value = true
}

const closeDialog = () => {
  showDialog.value = false
}

const buildPayload = () => ({
  title: form.value.title,
  slug: form.value.slug,
  summary: form.value.summary,
  content: form.value.content,
  category: form.value.category || '协议规则',
  cover: form.value.cover || '',
  pinned: !!form.value.pinned,
  sort_order: Number(form.value.sort_order || 0),
  status: statusText.value === 'published',
  published_at: statusText.value === 'published' ? new Date().toISOString() : null,
})

const submit = async () => {
  if (!/^[A-Za-z0-9_-]+$/.test(form.value.slug)) {
    emit('toast', 'slug 只能包含英文、数字、横杠和下划线')
    return
  }
  const payload = buildPayload()
  if (form.value.id) {
    await api.updateArticle({ id: form.value.id, ...payload })
    emit('toast', '文章已更新')
  } else {
    await api.createArticle(payload)
    emit('toast', '文章已创建')
  }
  showDialog.value = false
  await load()
}

const toggleStatus = async item => {
  await api.setArticleStatus(item.id, !item.status)
  emit('toast', item.status ? '文章已下线' : '文章已发布')
  await load()
}

const removeItem = async item => {
  if (!confirm(`确认删除文章「${item.title}」吗？`)) return
  await api.deleteArticle(item.id)
  emit('toast', '文章已删除')
  await load()
}

onMounted(load)
</script>

<style scoped>
.template-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.template-row button {
  border: 1px solid #dfe8e5;
  border-radius: 18px;
  background: linear-gradient(180deg, #fff, #f6faf8);
  padding: 16px;
  text-align: left;
  cursor: pointer;
  box-shadow: 0 12px 30px rgba(20, 54, 48, .05);
}

.template-row button:hover {
  border-color: var(--secondary);
  transform: translateY(-1px);
}

.template-row b,
.template-row small {
  display: block;
}

.template-row small {
  margin-top: 6px;
  color: #7d8f8a;
}

.article-dialog {
  width: min(860px, calc(100vw - 48px));
}

.article-content {
  min-height: 260px;
  line-height: 1.7;
}

.enable-row input {
  width: 18px;
  height: 18px;
}
</style>
