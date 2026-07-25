<template>
  <section class="page-content admin-grid-page">
    <div class="admin-grid-hero">
      <div>
        <span class="admin-grid-eyebrow">智能定制</span>
        <h1>匹配词库与权重</h1>
        <p>平台统一维护目的地、旅行主题关键词和匹配分值；用户端智能定制会按这里的配置计算推荐路线。</p>
      </div>
      <button class="primary-btn compact" :disabled="saving" @click="save">{{ saving ? '保存中...' : '保存配置' }}</button>
    </div>

    <div class="admin-grid-stats">
      <article><i>地</i><div><small>目的地标签</small><strong>{{ settings.destinations.length }}</strong></div></article>
      <article><i class="lime">题</i><div><small>主题标签</small><strong>{{ settings.themes.length }}</strong></div></article>
      <article><i class="orange">分</i><div><small>最低展示分</small><strong>{{ settings.weights.min_score }}</strong></div></article>
      <article><i>库</i><div><small>库存加分</small><strong>{{ settings.weights.stock_available }}</strong></div></article>
    </div>

    <div class="match-layout">
      <div class="admin-grid-card">
        <div class="match-card-head">
          <div><b>目的地词库</b><span>例如“西南秘境”对应川西、四川、雪山等关键词。</span></div>
          <button class="ghost-btn compact" @click="addTerm('destinations')">新增目的地</button>
        </div>
        <div class="term-list">
          <article v-for="(item, index) in settings.destinations" :key="`d-${index}`" class="term-row">
            <label><span>标签名</span><input v-model.trim="item.label"></label>
            <label><span>关键词（逗号分隔）</span><textarea v-model="item.keywordText"></textarea></label>
            <label><span>权重</span><input type="number" v-model.number="item.weight"></label>
            <label class="check-line"><input type="checkbox" v-model="item.enabled"> 启用</label>
            <button class="danger-btn" @click="removeTerm('destinations', index)">删除</button>
          </article>
        </div>
      </div>

      <div class="admin-grid-card">
        <div class="match-card-head">
          <div><b>主题词库</b><span>例如“户外徒步”对应徒步、雪山、露营等关键词。</span></div>
          <button class="ghost-btn compact" @click="addTerm('themes')">新增主题</button>
        </div>
        <div class="term-list">
          <article v-for="(item, index) in settings.themes" :key="`t-${index}`" class="term-row">
            <label><span>标签名</span><input v-model.trim="item.label"></label>
            <label><span>关键词（逗号分隔）</span><textarea v-model="item.keywordText"></textarea></label>
            <label><span>权重</span><input type="number" v-model.number="item.weight"></label>
            <label class="check-line"><input type="checkbox" v-model="item.enabled"> 启用</label>
            <button class="danger-btn" @click="removeTerm('themes', index)">删除</button>
          </article>
        </div>
      </div>
    </div>

    <div class="admin-grid-card weight-card">
      <div class="match-card-head">
        <div><b>全局权重</b><span>控制智能匹配排序强弱，数值越高影响越明显，负数表示扣分。</span></div>
      </div>
      <div class="weight-grid">
        <label v-for="item in weightFields" :key="item.key">
          <span>{{ item.label }}</span>
          <input type="number" v-model.number="settings.weights[item.key]">
        </label>
      </div>
    </div>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { api } from '../services/api'

const emit = defineEmits(['toast'])
const saving = ref(false)
const settings = reactive({
  destinations: [],
  themes: [],
  weights: {},
})

const weightFields = [
  { key: 'destination_miss_penalty', label: '目的地未命中扣分' },
  { key: 'theme_miss_penalty', label: '主题未命中扣分' },
  { key: 'day_match', label: '天数匹配加分' },
  { key: 'day_near', label: '天数接近加分' },
  { key: 'day_miss_penalty', label: '天数不符扣分' },
  { key: 'budget_good', label: '预算接近加分' },
  { key: 'budget_ok', label: '预算内加分' },
  { key: 'budget_low', label: '明显低于预算加分' },
  { key: 'budget_over_near', label: '略超预算加分' },
  { key: 'budget_over_penalty', label: '超预算扣分' },
  { key: 'stock_available', label: '有库存加分' },
  { key: 'stock_empty_penalty', label: '无库存扣分' },
  { key: 'display_weight_cap', label: '路线展示权重上限' },
  { key: 'min_score', label: '最低展示分' },
]

const termToEditor = item => ({
  label: item.label || '',
  keywordText: Array.isArray(item.keywords) ? item.keywords.join('，') : '',
  weight: Number(item.weight || 0),
  enabled: item.enabled !== false,
})

const editorToTerm = item => ({
  label: String(item.label || '').trim(),
  keywords: String(item.keywordText || '')
    .replaceAll('\n', '，')
    .split(/[，,]/)
    .map(keyword => keyword.trim())
    .filter(Boolean),
  weight: Number(item.weight || 0),
  enabled: item.enabled !== false,
})

const applySettings = value => {
  settings.destinations = (value.destinations || []).map(termToEditor)
  settings.themes = (value.themes || []).map(termToEditor)
  settings.weights = { ...(value.weights || {}) }
}

const addTerm = key => {
  settings[key].push({ label: '', keywordText: '', weight: key === 'destinations' ? 38 : 28, enabled: true })
}

const removeTerm = (key, index) => {
  settings[key].splice(index, 1)
}

const payload = () => ({
  destinations: settings.destinations.map(editorToTerm).filter(item => item.label),
  themes: settings.themes.map(editorToTerm).filter(item => item.label),
  weights: { ...settings.weights },
})

const load = async () => {
  try {
    applySettings(await api.getTravelMatchSettings())
  } catch (error) {
    emit('toast', error.message || '匹配配置读取失败')
  }
}

const save = async () => {
  saving.value = true
  try {
    applySettings(await api.saveTravelMatchSettings(payload()))
    emit('toast', '智能匹配配置已保存')
  } catch (error) {
    emit('toast', error.message || '保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.match-layout{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:18px}
.match-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:16px}
.match-card-head b,.match-card-head span{display:block}
.match-card-head b{font-size:18px;color:#101828}
.match-card-head span{margin-top:6px;color:#667085;font-size:13px;line-height:1.55}
.term-list{display:grid;gap:12px}
.term-row{display:grid;grid-template-columns:1fr 1.6fr 90px auto auto;gap:10px;align-items:end;padding:12px;border:1px solid #e3ebf4;border-radius:14px;background:#fbfdff}
.term-row label span,.weight-grid label span{display:block;margin-bottom:6px;color:#475467;font-size:12px;font-weight:900}
.term-row input,.term-row textarea,.weight-grid input{width:100%;box-sizing:border-box;border:1px solid #d8e4f2;border-radius:10px;background:#fff;padding:9px 10px;color:#101828;outline:none}
.term-row textarea{height:40px;resize:vertical}
.check-line{display:flex;align-items:center;gap:6px;height:38px;color:#475467;font-size:13px;font-weight:800}
.check-line input{width:auto}
.danger-btn{height:38px;border:1px solid #fecdca;border-radius:999px;background:#fef3f2;color:#b42318;font-weight:900;cursor:pointer}
.weight-card{margin-bottom:24px}
.weight-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
@media(max-width:1200px){.match-layout{grid-template-columns:1fr}.weight-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.term-row{grid-template-columns:1fr 1fr 90px}}
@media(max-width:720px){.weight-grid,.term-row{grid-template-columns:1fr}.match-card-head{display:block}.match-card-head button{margin-top:12px}}
</style>
