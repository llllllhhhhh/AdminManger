<template>
  <section class="page-content admin-grid-page contract-template-page">
    <div class="admin-grid-hero">
      <div>
        <span class="admin-grid-eyebrow">合同管理</span>
        <h1>旅行服务合同</h1>
        <p>统一维护用户端签署时展示的合同标题、正文和可选出行范围；保存后用户端「我的旅行」会读取最新内容。</p>
      </div>
      <div class="contract-actions">
        <button class="ghost-btn compact" :disabled="loading" @click="loadTemplate">刷新</button>
        <button class="primary-btn compact" :disabled="saving" @click="saveTemplate">{{ saving ? '保存中...' : '保存合同' }}</button>
      </div>
    </div>

    <div class="admin-grid-stats">
      <article><i>合</i><div><small>合同标题</small><strong>{{ form.title || '-' }}</strong></div></article>
      <article><i class="lime">期</i><div><small>可选范围</small><strong>{{ form.travel_date_days }} 天</strong></div></article>
      <article><i class="orange">符</i><div><small>可用占位符</small><strong>{{ placeholders.length }}</strong></div></article>
      <article><i class="gray">端</i><div><small>同步范围</small><strong>用户端</strong></div></article>
    </div>

    <div class="contract-layout">
      <div class="admin-grid-card contract-editor">
        <div class="editor-head">
          <div>
            <b>合同内容编辑</b>
            <small>正文支持占位符，用户打开合同时会替换为订单和签署人信息。</small>
          </div>
        </div>

        <label class="field">
          <span>合同标题</span>
          <input v-model.trim="form.title" placeholder="例如：旅行服务合同">
        </label>

        <label class="field">
          <span>可选出行范围</span>
          <div class="days-control">
            <input v-model.number="form.travel_date_days" type="number" min="0" max="365">
            <small>用户可选择从今天起到 {{ form.travel_date_days || 0 }} 天后的任意日期</small>
          </div>
        </label>

        <div class="placeholder-bar">
          <button v-for="item in placeholders" :key="item.key" type="button" @click="insertPlaceholder(item.key)">
            <b>{{ item.key }}</b>
            <small>{{ item.label }}</small>
          </button>
        </div>

        <label class="field">
          <span>合同正文</span>
          <textarea
            ref="contentInput"
            class="content-textarea"
            v-model="form.content"
            placeholder="请输入合同正文，可使用下方占位符自动填充订单信息"
          ></textarea>
        </label>

        <div v-if="error" class="plan-error">{{ error }}</div>
      </div>

      <div class="admin-grid-card contract-preview-card">
        <div class="editor-head">
          <div>
            <b>用户端预览</b>
            <small>按示例订单渲染，实际展示会使用用户自己的订单数据。</small>
          </div>
        </div>

        <div class="contract-preview">
          <h2>{{ form.title || '旅行服务合同' }}</h2>
          <pre>{{ renderedContent }}</pre>
        </div>

        <div class="date-preview">
          <b>出行日期选项</b>
          <span v-for="item in previewDateOptions" :key="item">{{ item }}</span>
          <p v-if="dateOptions.length > previewDateOptions.length">共 {{ dateOptions.length }} 天，预览仅显示前 {{ previewDateOptions.length }} 个。</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { api } from '../services/api'

const emit = defineEmits(['toast'])

const loading = ref(false)
const saving = ref(false)
const error = ref('')
const contentInput = ref(null)
const form = reactive({
  title: '',
  content: '',
  travel_date_days: 30,
})

const placeholders = [
  { key: 'order_no', label: '订单号' },
  { key: 'title', label: '旅行产品' },
  { key: 'agency', label: '服务方' },
  { key: 'travel_date', label: '出行日期' },
  { key: 'signer_name', label: '签署人' },
  { key: 'signer_phone', label: '联系电话' },
  { key: 'id_no', label: '证件号' },
  { key: 'amount_text', label: '订单金额' },
]

const sample = {
  order_no: 'TR202607020001',
  title: '青岛海风毕业季',
  agency: '学徒行平台合作服务方',
  travel_date: '2026-07-16',
  signer_name: '张同学',
  signer_phone: '15500000000',
  id_no: '440100********1234',
  amount_text: '1880 积分',
}

const normalizeDays = value => Math.max(0, Math.min(365, Number.parseInt(value, 10) || 0))
const formatDate = date => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
const dateOptions = computed(() => {
  const today = new Date()
  return Array.from({ length: normalizeDays(form.travel_date_days) + 1 }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() + index)
    return formatDate(date)
  })
})
const previewDateOptions = computed(() => dateOptions.value.slice(0, 8))
const renderedContent = computed(() => {
  const content = form.content || '请在左侧编辑合同正文。'
  return Object.keys(sample).reduce((text, key) => text.replaceAll(`{${key}}`, sample[key]), content)
})

const loadTemplate = async () => {
  loading.value = true
  error.value = ''
  try {
    const template = await api.getContractTemplate()
    form.title = template.title || '旅行服务合同'
    form.content = template.content || ''
    form.travel_date_days = normalizeDays(template.travel_date_days ?? 30)
  } catch (err) {
    error.value = err.message || '合同读取失败'
    emit('toast', error.value)
  } finally {
    loading.value = false
  }
}

const saveTemplate = async () => {
  if (!form.title.trim()) {
    error.value = '请填写合同标题'
    return
  }
  if (!form.content.trim()) {
    error.value = '请填写合同正文'
    return
  }
  saving.value = true
  error.value = ''
  try {
    const saved = await api.saveContractTemplate({
      title: form.title,
      content: form.content,
      travel_date_days: normalizeDays(form.travel_date_days),
    })
    form.title = saved.title
    form.content = saved.content
    form.travel_date_days = normalizeDays(saved.travel_date_days)
    emit('toast', '合同内容已保存')
  } catch (err) {
    error.value = err.message || '合同保存失败'
    emit('toast', error.value)
  } finally {
    saving.value = false
  }
}

const insertPlaceholder = key => {
  const token = `{${key}}`
  const el = contentInput.value
  if (!el) {
    form.content += token
    return
  }
  const start = el.selectionStart ?? form.content.length
  const end = el.selectionEnd ?? start
  form.content = `${form.content.slice(0, start)}${token}${form.content.slice(end)}`
  requestAnimationFrame(() => {
    el.focus()
    el.selectionStart = start + token.length
    el.selectionEnd = start + token.length
  })
}

onMounted(loadTemplate)
</script>

<style scoped>
.contract-template-page {
  max-width: 1480px;
}

.contract-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.contract-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(420px, .92fr);
  gap: 18px;
}

.contract-editor,
.contract-preview-card {
  padding: 22px;
}

.editor-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.editor-head b,
.editor-head small {
  display: block;
}

.editor-head b {
  color: #173f38;
  font-size: 16px;
}

.editor-head small {
  margin-top: 5px;
  color: #7b8a86;
  line-height: 1.5;
}

.field {
  display: block;
  margin-bottom: 16px;
}

.field span {
  display: block;
  margin-bottom: 8px;
  color: #173f38;
  font-size: 13px;
  font-weight: 900;
}

.field input,
.field textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #dfe9e5;
  border-radius: 16px;
  padding: 13px 15px;
  color: #173f38;
  background: #fbfdfc;
  outline: none;
}

.field input:focus,
.field textarea:focus {
  border-color: #12a594;
  box-shadow: 0 0 0 3px rgba(18, 165, 148, .12);
}

.days-control {
  display: grid;
  gap: 8px;
}

.days-control small {
  color: #7b8a86;
  line-height: 1.5;
}

.content-textarea {
  min-height: 430px;
  resize: vertical;
  line-height: 1.7;
}

.placeholder-bar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.placeholder-bar button {
  border: 1px solid #dfe9e5;
  border-radius: 14px;
  background: #fff;
  padding: 11px 12px;
  text-align: left;
}

.placeholder-bar button:hover {
  border-color: #12a594;
  background: #f3fbf8;
}

.placeholder-bar b,
.placeholder-bar small {
  display: block;
}

.placeholder-bar b {
  color: #173f38;
  font-size: 12px;
}

.placeholder-bar small {
  margin-top: 4px;
  color: #7b8a86;
  font-size: 11px;
}

.contract-preview {
  border: 1px solid #e1ebe7;
  border-radius: 20px;
  background: #fff;
  padding: 22px;
}

.contract-preview h2 {
  margin: 0 0 16px;
  color: #173f38;
}

.contract-preview pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  color: #526560;
  font: inherit;
  line-height: 1.8;
}

.date-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
  padding: 18px;
  border-radius: 18px;
  background: #f6faf8;
}

.date-preview b {
  width: 100%;
  color: #173f38;
}

.date-preview span {
  padding: 8px 12px;
  border-radius: 999px;
  background: #173f38;
  color: #fff;
  font-size: 12px;
  font-weight: 900;
}

.date-preview p {
  margin: 0;
  color: #7b8a86;
}
</style>
