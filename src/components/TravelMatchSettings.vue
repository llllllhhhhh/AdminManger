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
.travel-match-page{
  padding:30px 32px 42px;
  background:linear-gradient(180deg,#f8fbfa 0,#f3f7f5 100%);
}
.travel-match-page :deep(.admin-grid-hero){
  margin-bottom:22px;
  padding:26px 28px;
  border-radius:22px;
}
.travel-match-page :deep(.admin-grid-stats){
  gap:18px;
  margin-bottom:24px;
}
.travel-match-page :deep(.admin-grid-stats article){
  min-height:86px;
  padding:18px 20px;
  border-radius:18px;
}
.match-layout{
  display:grid;
  grid-template-columns:minmax(0,1fr) minmax(0,1fr);
  gap:24px;
  margin-bottom:24px;
}
.match-layout>.admin-grid-card,.weight-card{
  border:1px solid #dfe8e5;
  border-radius:20px;
  background:linear-gradient(180deg,#fff 0,#fbfdfc 100%);
  box-shadow:0 14px 34px rgba(15,40,36,.07);
  overflow:hidden;
  padding:24px;
}
.match-card-head{
  position:sticky;
  top:0;
  z-index:2;
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:16px;
  margin:-24px -24px 22px;
  padding:22px 24px 18px;
  border-bottom:1px solid #edf2f0;
  background:rgba(255,255,255,.94);
  backdrop-filter:blur(10px);
}
.match-card-head b,.match-card-head span{display:block}
.match-card-head b{font-size:18px;color:#101828;letter-spacing:0}
.match-card-head span{margin-top:6px;color:#667085;font-size:13px;line-height:1.55}
.match-card-head button{
  flex:0 0 auto;
  min-width:108px;
  height:36px;
  border-radius:12px;
  font-weight:900;
}
.term-list{
  display:grid;
  gap:16px;
}
.term-row{
  display:grid;
  grid-template-columns:minmax(180px,1fr) 110px 92px 96px;
  gap:14px 16px;
  align-items:end;
  padding:18px;
  border:1px solid #e4ece9;
  border-radius:16px;
  background:#fff;
  box-shadow:0 7px 18px rgba(20,55,49,.045);
  transition:border-color .16s ease,box-shadow .16s ease,transform .16s ease;
}
.term-row:hover{
  border-color:#c7e4dc;
  box-shadow:0 10px 24px rgba(20,55,49,.08);
  transform:translateY(-1px);
}
.term-row label span,.weight-grid label span{
  display:block;
  margin-bottom:8px;
  color:#475467;
  font-size:12px;
  font-weight:900;
}
.term-row input,.term-row textarea,.weight-grid input{
  width:100%;
  box-sizing:border-box;
  border:1px solid #d8e4f2;
  border-radius:12px;
  background:#f8fafc;
  padding:11px 12px;
  color:#101828;
  outline:none;
  transition:border-color .16s ease,box-shadow .16s ease,background .16s ease;
}
.term-row input:focus,.term-row textarea:focus,.weight-grid input:focus{
  border-color:#12a594;
  background:#fff;
  box-shadow:0 0 0 3px rgba(18,165,148,.12);
}
.term-row textarea{
  min-height:52px;
  max-height:96px;
  resize:vertical;
  line-height:1.55;
}
.term-row label:nth-child(2){
  grid-column:1/-1;
  grid-row:2;
}
.check-line{
  display:flex;
  align-items:center;
  justify-content:center;
  gap:6px;
  height:42px;
  padding:0 12px;
  border:1px solid #dbeae6;
  border-radius:999px;
  background:#f3faf7;
  color:#176b5f;
  font-size:13px;
  font-weight:900;
}
.check-line input{
  width:auto;
  accent-color:#12a594;
}
.danger-btn{
  height:42px;
  border:1px solid #fecdca;
  border-radius:999px;
  background:#fff7f6;
  color:#b42318;
  font-weight:900;
  cursor:pointer;
  transition:.16s ease;
}
.danger-btn:hover{
  background:#fef3f2;
  box-shadow:0 8px 18px rgba(180,35,24,.08);
}
.weight-card{margin-bottom:28px}
.weight-grid{
  display:grid;
  grid-template-columns:repeat(4,minmax(0,1fr));
  gap:16px;
}
.weight-grid label{
  padding:16px;
  border:1px solid #e5ece9;
  border-radius:14px;
  background:#fff;
  box-shadow:0 7px 18px rgba(20,55,49,.04);
}
.weight-grid input{
  height:40px;
  font-size:16px;
  font-weight:800;
}
@media(max-width:1320px){
  .match-layout{grid-template-columns:1fr}
  .term-row{grid-template-columns:minmax(180px,1fr) 110px 92px 96px}
}
@media(max-width:980px){
  .weight-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
  .term-row{grid-template-columns:1fr 110px 96px}
  .term-row label:nth-child(2){grid-column:1/-1;grid-row:2}
  .term-row label:nth-child(3),.term-row .check-line,.term-row .danger-btn{grid-row:auto}
}
@media(max-width:720px){
  .weight-grid,.term-row{grid-template-columns:1fr}
  .term-row label:nth-child(2),.term-row label:nth-child(3),.term-row .check-line,.term-row .danger-btn{grid-column:auto;grid-row:auto}
  .match-card-head{display:block}
  .match-card-head button{margin-top:12px}
}
</style>
