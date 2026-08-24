<template>
  <section class="page-content admin-grid-page">
    <div class="admin-grid-hero">
      <div>
        <span class="admin-grid-eyebrow">平台公告</span>
        <h1>平台公告</h1>
        <p>管理用户端铃铛消息和公告列表，支持置顶、发布窗口、上下线控制，发布后用户端实时读取。</p>
      </div>
      <button class="primary-btn compact" @click="openCreate">新增公告</button>
    </div>

    <div class="admin-grid-stats">
      <article><i>告</i><div><small>全部公告</small><strong>{{ list.length }}</strong></div></article>
      <article><i class="lime">发</i><div><small>已发布</small><strong>{{ publishedCount }}</strong></div></article>
      <article><i class="gray">草</i><div><small>草稿 / 下线</small><strong>{{ offlineCount }}</strong></div></article>
      <article><i class="orange">顶</i><div><small>置顶公告</small><strong>{{ pinnedCount }}</strong></div></article>
    </div>

    <div class="admin-grid-card">
      <div class="admin-grid-toolbar">
        <div class="admin-grid-groupbar"><i>☷</i><span>Drag here to set row groups</span><em>可按标签、发布状态、是否置顶分组</em></div>
        <span class="admin-grid-count">共 {{ filtered.length }} 条公告</span>
      </div>
      <div class="admin-grid-filters">
        <label><span>公告搜索</span><input v-model.trim="keyword" placeholder="标题 / 摘要 / 标签"></label>
        <label><span>状态</span><select v-model="statusFilter"><option value="all">全部状态</option><option value="published">已发布</option><option value="draft">草稿 / 下线</option></select></label>
        <label><span>置顶</span><select v-model="pinnedFilter"><option value="all">全部</option><option value="yes">置顶</option><option value="no">普通</option></select></label>
      </div>

      <div class="admin-grid-table-wrap">
        <table class="admin-grid-table">
          <thead>
            <tr class="group-head"><th class="admin-grid-num"></th><th colspan="2">公告信息</th><th colspan="2">发布时间</th><th>状态</th><th>操作</th></tr>
            <tr class="head">
              <th class="admin-grid-num">#</th>
              <th>公告信息 <button>⋮</button></th>
              <th>标签 / 置顶 <button>⋮</button></th>
              <th>发布时间 <button>⋮</button></th>
              <th>展示周期 <button>⋮</button></th>
              <th>状态 <button>⋮</button></th>
              <th>操作</th>
            </tr>
            <tr class="filters">
              <th></th>
              <th><input class="filter-control" v-model.trim="titleFilter" placeholder="标题"></th>
              <th><input class="filter-control" v-model.trim="tagFilter" placeholder="标签"></th>
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
              <td>
                <span class="admin-grid-pill green">{{ item.tag || '平台公告' }}</span>
                <small>{{ item.pinned ? '置顶展示' : '普通排序' }}</small>
              </td>
              <td><b>{{ formatTime(item.published_at) }}</b><small>创建于 {{ formatTime(item.created_at) }}</small></td>
              <td><b>{{ formatWindow(item) }}</b><small>{{ item.end_at ? '到期后自动隐藏' : '未设置截止时间' }}</small></td>
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
        <div v-if="!filtered.length" class="admin-grid-empty">暂无符合条件的公告</div>
      </div>
      <PaginationBar v-model:page="page" v-model:page-size="pageSize" :total="filtered.length" />
    </div>

    <div v-if="showDialog" class="dialog-mask" @click.self="closeDialog">
      <form class="dialog" @submit.prevent="submit">
        <div class="dialog-head">
          <div><h2>{{ form.id ? '编辑平台公告' : '新增平台公告' }}</h2><p>发布后会同步显示在小程序首页铃铛入口与公告列表。</p></div>
          <button type="button" @click="closeDialog">×</button>
        </div>
        <div class="dialog-body">
          <div class="field"><label>公告标题</label><input v-model.trim="form.title" required></div>
          <div class="field"><label>摘要文案</label><input v-model.trim="form.summary"></div>
          <div class="two-fields">
            <div class="field"><label>标签</label><input v-model.trim="form.tag"></div>
            <div class="field"><label>状态</label><select v-model="statusText"><option value="draft">先存草稿</option><option value="published">立即发布</option></select></div>
          </div>
          <div class="two-fields">
            <div class="field"><label>开始时间</label><input v-model="form.start_at" type="datetime-local"></div>
            <div class="field"><label>结束时间</label><input v-model="form.end_at" type="datetime-local"></div>
          </div>
          <label class="enable-row"><div><b>置顶公告</b><span>置顶后会优先出现在用户端列表顶部</span></div><input v-model="form.pinned" type="checkbox"></label>
          <div class="field"><label>正文内容</label><textarea v-model.trim="form.content" required></textarea></div>
        </div>
        <div class="dialog-actions"><button type="button" @click="closeDialog">取消</button><button class="primary-btn" type="submit">{{ form.id ? '保存更新' : '创建公告' }}</button></div>
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
const pinnedFilter = ref('all')
const titleFilter = ref('')
const tagFilter = ref('')
const page = ref(1)
const pageSize = ref(10)

function createEmpty() {
  return { id: null, title: '', summary: '', content: '', tag: '平台公告', pinned: false, start_at: '', end_at: '' }
}

const publishedCount = computed(() => list.value.filter(item => item.status).length)
const offlineCount = computed(() => list.value.length - publishedCount.value)
const pinnedCount = computed(() => list.value.filter(item => item.pinned).length)
const filtered = computed(() => {
  const key = keyword.value.toLowerCase()
  const titleKey = titleFilter.value.toLowerCase()
  const tagKey = tagFilter.value.toLowerCase()
  return list.value.filter(item => {
    const text = `${item.title || ''} ${item.summary || ''} ${item.tag || ''}`.toLowerCase()
    return (!key || text.includes(key))
      && (!titleKey || String(item.title || '').toLowerCase().includes(titleKey))
      && (!tagKey || String(item.tag || '').toLowerCase().includes(tagKey))
      && (statusFilter.value === 'all' || (statusFilter.value === 'published' ? item.status : !item.status))
      && (pinnedFilter.value === 'all' || (pinnedFilter.value === 'yes' ? item.pinned : !item.pinned))
  })
})
const startIndex = computed(() => (page.value - 1) * pageSize.value)
const pagedList = computed(() => filtered.value.slice(startIndex.value, startIndex.value + pageSize.value))
watch(filtered, () => { page.value = 1 })

const normalizeDateTimeInput = value => (value ? String(value).replace('T', ' ').slice(0, 16) : '')
const normalizeApiDateTime = value => (value ? `${value}:00` : null)
const formatTime = value => (value ? String(value).replace('T', ' ').slice(0, 16) : '未发布')
const formatWindow = item => {
  const start = formatTime(item.start_at)
  const end = item.end_at ? formatTime(item.end_at) : '长期'
  return `${start} - ${end}`.replace('未发布 - ', '立即生效 - ')
}

const load = async () => {
  try {
    list.value = await api.getAnnouncements()
  } catch (error) {
    list.value = []
    emit('toast', error.message || '公告列表加载失败')
  }
}

const openCreate = () => {
  form.value = createEmpty()
  statusText.value = 'draft'
  showDialog.value = true
}

const openEdit = item => {
  form.value = {
    id: item.id,
    title: item.title,
    summary: item.summary || '',
    content: item.content || '',
    tag: item.tag || '平台公告',
    pinned: !!item.pinned,
    start_at: normalizeDateTimeInput(item.start_at),
    end_at: normalizeDateTimeInput(item.end_at),
  }
  statusText.value = item.status ? 'published' : 'draft'
  showDialog.value = true
}

const closeDialog = () => {
  showDialog.value = false
}

const buildPayload = () => ({
  title: form.value.title,
  summary: form.value.summary,
  content: form.value.content,
  tag: form.value.tag || '平台公告',
  pinned: !!form.value.pinned,
  status: statusText.value === 'published',
  published_at: statusText.value === 'published' ? new Date().toISOString() : null,
  start_at: normalizeApiDateTime(form.value.start_at),
  end_at: normalizeApiDateTime(form.value.end_at),
})

const submit = async () => {
  if (form.value.start_at && form.value.end_at && new Date(form.value.end_at) < new Date(form.value.start_at)) {
    emit('toast', '结束时间不能早于开始时间')
    return
  }
  const payload = buildPayload()
  try {
    if (form.value.id) {
      await api.updateAnnouncement({ id: form.value.id, ...payload })
      emit('toast', '公告已更新')
    } else {
      await api.createAnnouncement(payload)
      emit('toast', '公告已创建')
    }
    showDialog.value = false
    await load()
  } catch (error) {
    emit('toast', error.message || '公告保存失败')
  }
}

const toggleStatus = async item => {
  await api.setAnnouncementStatus(item.id, !item.status)
  emit('toast', item.status ? '公告已下线' : '公告已发布')
  await load()
}

const removeItem = async item => {
  if (!confirm(`确认删除公告「${item.title}」吗？`)) return
  await api.deleteAnnouncement(item.id)
  emit('toast', '公告已删除')
  await load()
}

onMounted(load)
</script>

<style scoped>
.enable-row input {
  width: 18px;
  height: 18px;
}
</style>
