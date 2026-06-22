<template>
  <section class="page-content">
    <div class="content-title">
      <div>
        <h1>平台公告</h1>
        <p>管理用户端铃铛消息，支持置顶、发布窗口和上下线控制。</p>
      </div>
      <button class="primary-btn compact" @click="openCreate">新增公告</button>
    </div>

    <div class="table-toolbar">
      <div class="filter-chip">全部公告</div>
      <div class="filter-chip">已发布 {{ publishedCount }}</div>
      <div class="filter-chip">草稿/下线 {{ offlineCount }}</div>
      <span>用户端铃铛与公告页读取这里的已发布内容</span>
    </div>

    <div class="data-table notice-table">
      <div class="tr th notice-tr">
        <div>公告信息</div>
        <div>标签 / 置顶</div>
        <div>发布时间</div>
        <div>展示周期</div>
        <div>状态</div>
        <div>操作</div>
      </div>

      <div v-for="item in list" :key="item.id" class="tr notice-tr">
        <div>
          <b>{{ item.title }}</b>
          <small>{{ item.summary || '暂无摘要' }}</small>
        </div>
        <div>
          <span class="soft-tag">{{ item.tag || '平台公告' }}</span>
          <small>{{ item.pinned ? '置顶展示' : '普通排序' }}</small>
        </div>
        <div>
          <b>{{ formatTime(item.published_at) }}</b>
          <small>创建于 {{ formatTime(item.created_at) }}</small>
        </div>
        <div>
          <b>{{ formatWindow(item) }}</b>
          <small>{{ item.end_at ? '到期后自动隐藏' : '未设置截止时间' }}</small>
        </div>
        <div>
          <span :class="['soft-tag', item.status ? '' : 'warn-tag']">{{ item.status ? '已发布' : '草稿/下线' }}</span>
          <small>{{ item.status ? '用户端可见' : '用户端隐藏' }}</small>
        </div>
        <div class="row-buttons">
          <button @click="openEdit(item)">编辑</button>
          <button @click="toggleStatus(item)">{{ item.status ? '下线' : '发布' }}</button>
          <button class="danger-lite" @click="removeItem(item)">删除</button>
        </div>
      </div>
    </div>

    <div v-if="showDialog" class="dialog-mask" @click.self="closeDialog">
      <form class="dialog" @submit.prevent="submit">
        <div class="dialog-head">
          <div>
            <h2>{{ form.id ? '编辑平台公告' : '新增平台公告' }}</h2>
            <p>发布后会同步显示在小程序首页铃铛入口与公告列表。</p>
          </div>
          <button type="button" @click="closeDialog">×</button>
        </div>

        <div class="dialog-body">
          <div class="field">
            <label>公告标题</label>
            <input v-model.trim="form.title" placeholder="例如：暑期积分活动升级通知" required>
          </div>

          <div class="field">
            <label>摘要文案</label>
            <input v-model.trim="form.summary" placeholder="用于列表卡片的简短说明">
          </div>

          <div class="two-fields">
            <div class="field">
              <label>标签</label>
              <input v-model.trim="form.tag" placeholder="平台公告 / 出行提醒 / 活动更新">
            </div>
            <div class="field">
              <label>状态</label>
              <select v-model="statusText">
                <option value="draft">先存草稿</option>
                <option value="published">立即发布</option>
              </select>
            </div>
          </div>

          <div class="two-fields">
            <div class="field">
              <label>开始时间</label>
              <input v-model="form.start_at" type="datetime-local">
            </div>
            <div class="field">
              <label>结束时间</label>
              <input v-model="form.end_at" type="datetime-local">
            </div>
          </div>

          <label class="enable-row">
            <div>
              <b>置顶公告</b>
              <span>置顶后会优先出现在用户端列表顶部</span>
            </div>
            <input v-model="form.pinned" type="checkbox">
          </label>

          <div class="field">
            <label>正文内容</label>
            <textarea v-model.trim="form.content" placeholder="支持多段文字，详情页会按原样展示" required></textarea>
          </div>
        </div>

        <div class="dialog-actions">
          <button type="button" @click="closeDialog">取消</button>
          <button class="primary-btn" type="submit">{{ form.id ? '保存更新' : '创建公告' }}</button>
        </div>
      </form>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { api } from '../services/api'

const emit = defineEmits(['toast'])

const list = ref([])
const showDialog = ref(false)
const statusText = ref('draft')
const form = ref(createEmpty())

function createEmpty() {
  return {
    id: null,
    title: '',
    summary: '',
    content: '',
    tag: '平台公告',
    pinned: false,
    start_at: '',
    end_at: '',
  }
}

const publishedCount = computed(() => list.value.filter(item => item.status).length)
const offlineCount = computed(() => list.value.length - publishedCount.value)

const normalizeDateTimeInput = value => (value ? String(value).replace('T', ' ').slice(0, 16) : '')
const normalizeApiDateTime = value => (value ? `${value}:00` : null)

const formatTime = value => (value ? String(value).replace('T', ' ').slice(0, 16) : '未发布')
const formatWindow = item => {
  const start = formatTime(item.start_at)
  const end = item.end_at ? formatTime(item.end_at) : '长期'
  return `${start} - ${end}`.replace('未发布', '立即生效')
}

const load = async () => {
  list.value = await api.getAnnouncements()
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
  const payload = buildPayload()
  if (form.value.id) {
    await api.updateAnnouncement({ id: form.value.id, ...payload })
    emit('toast', '公告已更新')
  } else {
    await api.createAnnouncement(payload)
    emit('toast', '公告已创建')
  }
  showDialog.value = false
  await load()
}

const toggleStatus = async item => {
  await api.setAnnouncementStatus(item.id, !item.status)
  emit('toast', item.status ? '公告已下线' : '公告已发布')
  await load()
}

const removeItem = async item => {
  if (!confirm(`确认删除公告“${item.title}”吗？`)) return
  await api.deleteAnnouncement(item.id)
  emit('toast', '公告已删除')
  await load()
}

onMounted(load)
</script>

<style scoped>
.notice-table .notice-tr {
  grid-template-columns: 1.7fr 0.9fr 0.9fr 1fr 0.8fr 1fr;
}

.warn-tag {
  background: #fff0f0;
  color: #d85b5b;
}

.danger-lite {
  color: #d85b5b !important;
}

.enable-row input {
  width: 18px;
  height: 18px;
}
</style>
