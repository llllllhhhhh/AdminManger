<template>
  <div class="page-content admin-grid-page preference-page">
    <div class="admin-grid-hero">
      <div>
        <span class="admin-grid-eyebrow">偏好洞察</span>
        <h1>用户偏好洞察</h1>
        <p>根据浏览、学习点击、收藏和上岸目标，识别用户对旅行路线、学习方向和付费服务的真实兴趣。</p>
      </div>
      <button class="ghost-btn compact" @click="load">刷新数据</button>
    </div>

    <div class="admin-grid-stats">
      <article><i class="orange">人</i><div><small>已识别用户</small><strong>{{ data.summary.users }}</strong></div></article>
      <article><i class="lime">旅</i><div><small>旅行兴趣热度</small><strong>{{ data.summary.route_score }}</strong></div></article>
      <article><i>学</i><div><small>学习兴趣热度</small><strong>{{ data.summary.study_score }}</strong></div></article>
      <article><i class="gray">行</i><div><small>累计行为次数</small><strong>{{ data.summary.events }}</strong></div></article>
    </div>

    <section class="preference-rank-card">
      <div class="rank-head">
        <div>
          <h3>热门兴趣排行</h3>
          <p>按偏好分从高到低排序，帮助运营安排路线、学习内容和营销触达。</p>
        </div>
        <span class="score-rule">浏览 +1 · 学习点击 +2 · 收藏 +3 · 上岸目标 +5</span>
      </div>
      <div v-if="data.rankings.length" class="interest-ranking">
        <div v-for="(item,index) in data.rankings.slice(0,6)" :key="item.type + item.name" class="interest-rank">
          <strong :class="{ top: index < 3 }">{{ index + 1 }}</strong>
          <div class="rank-main">
            <div>
              <b>{{ item.name }}</b>
              <em :class="item.type">{{ item.type === 'route' ? '旅行路线' : '学习方向' }}</em>
            </div>
            <div class="rank-bar"><i :style="{ width: rankWidth(item.score) + '%' }" :class="item.type"></i></div>
          </div>
          <div class="rank-score"><b>{{ item.score }}</b><small>{{ item.users }} 人感兴趣</small></div>
        </div>
      </div>
      <div v-else class="admin-grid-empty">暂无偏好数据，用户产生浏览或收藏后会自动出现</div>
    </section>

    <section class="admin-grid-card">
      <div class="admin-grid-table-wrap">
        <table class="admin-grid-table preference-grid-table">
          <thead>
            <tr class="group-head">
              <th class="admin-grid-num"></th>
              <th colspan="2">用户画像</th>
              <th colspan="2">兴趣分布</th>
              <th>综合热度</th>
              <th>行为记录</th>
            </tr>
            <tr class="head">
              <th class="admin-grid-num">#</th>
              <th>用户 <button>⋮</button></th>
              <th>最高兴趣内容 <button>⋮</button></th>
              <th>旅行兴趣 <button>⋮</button></th>
              <th>学习兴趣 <button>⋮</button></th>
              <th>综合热度 <button>⋮</button></th>
              <th>行为 / 最近活跃 <button>⋮</button></th>
            </tr>
            <tr class="filters">
              <th></th>
              <th><input class="filter-control" v-model.trim="keyword" placeholder="用户 ID / 昵称 / 兴趣内容"></th>
              <th>
                <select class="filter-control" v-model="type">
                  <option v-for="item in types" :key="item.value" :value="item.value">{{ item.label }}</option>
                </select>
              </th>
              <th></th>
              <th></th>
              <th>
                <select class="filter-control" v-model="strength">
                  <option value="all">全部强度</option>
                  <option value="high">高兴趣（8 分及以上）</option>
                  <option value="medium">中兴趣（3-7 分）</option>
                  <option value="low">待观察（0-2 分）</option>
                </select>
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(user, index) in pagedUsers" :key="user.user_id">
              <td class="admin-grid-num">{{ startIndex + index + 1 }}</td>
              <td>
                <div class="admin-grid-main">
                  <div class="admin-grid-avatar">{{ String(user.user_name || '用').slice(0, 1) }}</div>
                  <div><b>{{ user.user_name }}</b><small>{{ user.user_id }}</small></div>
                </div>
              </td>
              <td>
                <b>{{ user.top_interest }}</b>
                <small><span :class="['admin-grid-pill', user.top_type === 'route' ? 'green' : user.top_type === 'study' ? 'orange' : 'gray']">{{ topTypeText(user.top_type) }}</span></small>
              </td>
              <td class="metric">
                <b>{{ Math.max(user.route_score, 0) }} 分</b>
                <span><i :style="{ width: metricWidth(user.route_score, user.interest_score) + '%' }"></i></span>
              </td>
              <td class="metric study">
                <b>{{ Math.max(user.study_score, 0) }} 分</b>
                <span><i :style="{ width: metricWidth(user.study_score, user.interest_score) + '%' }"></i></span>
              </td>
              <td><b class="heat-number">{{ user.interest_score }}</b><small>{{ strengthLabel(user.interest_score) }}</small></td>
              <td><b>{{ user.actions }} 次行为</b><small>{{ formatDate(user.updated_at) }}</small></td>
            </tr>
          </tbody>
        </table>
        <div v-if="!filtered.length" class="admin-grid-empty">没有符合当前筛选条件的用户</div>
      </div>
      <PaginationBar v-model:page="page" v-model:page-size="pageSize" :total="filtered.length" />
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { api } from '../services/api'
import PaginationBar from './PaginationBar.vue'

const emit = defineEmits(['toast'])

const keyword = ref('')
const type = ref('all')
const strength = ref('all')
const page = ref(1)
const pageSize = ref(10)
const types = [
  { label: '全部偏好', value: 'all' },
  { label: '偏旅行', value: 'route' },
  { label: '偏学习', value: 'study' },
]

const fallback = { summary: { users: 0, events: 0, route_score: 0, study_score: 0 }, rankings: [], users: [] }
const data = ref(fallback)

const filtered = computed(() => data.value.users.filter(user => {
  const text = `${user.user_id}${user.user_name}${user.top_interest}`.toLowerCase()
  const key = keyword.value.toLowerCase()
  const typeOk = type.value === 'all' || (type.value === 'route' ? user.route_score >= user.study_score : user.study_score > user.route_score)
  const score = user.interest_score
  const strengthOk = strength.value === 'all' || (strength.value === 'high' ? score >= 8 : strength.value === 'medium' ? score >= 3 && score < 8 : score < 3)
  return (!key || text.includes(key)) && typeOk && strengthOk
}))
const startIndex = computed(() => (page.value - 1) * pageSize.value)
const pagedUsers = computed(() => filtered.value.slice(startIndex.value, startIndex.value + pageSize.value))
watch(filtered, () => { page.value = 1 })

const maxRank = computed(() => Math.max(...data.value.rankings.map(item => item.score), 1))
const rankWidth = score => Math.max(score / maxRank.value * 100, 8)
const metricWidth = (score, total) => Math.max(Math.max(score, 0) / Math.max(total, 1) * 100, score > 0 ? 8 : 0)
const strengthLabel = score => (score >= 8 ? '高兴趣' : score >= 3 ? '中兴趣' : '待观察')
const topTypeText = value => (value === 'route' ? '旅行路线' : value === 'study' ? '学习方向' : '待识别')
const formatDate = value => (value ? new Date(value).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-')

const load = async () => {
  try {
    data.value = await api.getPreferences()
    emit('toast', '用户偏好数据已更新')
  } catch {
    emit('toast', '偏好接口暂未连接')
  }
}

onMounted(load)
</script>

<style scoped>
.preference-page {
  background: #f3f6f5;
  min-height: calc(100vh - 76px);
}

.preference-rank-card {
  background: #fff;
  border: 1px solid #e4ebe8;
  border-radius: 22px;
  padding: 20px;
  box-shadow: 0 18px 46px rgba(20, 54, 48, .06);
}

.rank-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #edf1ef;
  padding-bottom: 15px;
}

.rank-head h3 {
  font-size: 17px;
  margin: 0 0 6px;
  color: #173f38;
}

.rank-head p {
  font-size: 12px;
  color: #899995;
  margin: 0;
}

.score-rule {
  font-size: 12px;
  color: #9b7450;
  background: #fff7eb;
  padding: 8px 12px;
  border-radius: 999px;
}

.interest-ranking {
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 35px;
  padding-top: 10px;
}

.interest-rank {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 12px 0;
  border-bottom: 1px solid #edf1ef;
}

.interest-rank > strong {
  width: 28px;
  height: 28px;
  border-radius: 10px;
  background: #f0f3f2;
  display: grid;
  place-items: center;
  font-size: 12px;
  color: #7c8c88;
}

.interest-rank > strong.top {
  background: #fff0e6;
  color: #ee7130;
}

.rank-main {
  flex: 1;
  min-width: 0;
}

.rank-main > div:first-child {
  display: flex;
  align-items: center;
  gap: 7px;
}

.rank-main b {
  font-size: 13px;
  color: #173f38;
}

.rank-main em {
  font-style: normal;
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 999px;
}

.rank-main em.route {
  background: #e5f6f1;
  color: #088b79;
}

.rank-main em.study {
  background: #fff0e4;
  color: #d56c2d;
}

.rank-bar {
  height: 6px;
  background: #edf2f0;
  border-radius: 10px;
  margin-top: 8px;
  overflow: hidden;
}

.rank-bar i {
  display: block;
  height: 100%;
  background: #14a390;
  border-radius: 10px;
}

.rank-bar i.study {
  background: #ff813e;
}

.rank-score {
  text-align: right;
}

.rank-score b,
.rank-score small {
  display: block;
}

.rank-score b {
  font-size: 18px;
  color: #173f38;
}

.rank-score small {
  font-size: 11px;
  color: #96a29f;
  margin-top: 2px;
}

.preference-grid-table {
  min-width: 1160px;
}

.metric > span {
  display: block;
  width: 86px;
  height: 6px;
  background: #eef2f1;
  border-radius: 8px;
  margin-top: 7px;
  overflow: hidden;
}

.metric > span i {
  display: block;
  height: 100%;
  background: #12a594;
  border-radius: 8px;
}

.metric.study > span i {
  background: #ff7a35;
}

.heat-number {
  font-size: 18px !important;
  color: #173f38;
}

@media (max-width: 900px) {
  .interest-ranking {
    grid-template-columns: 1fr;
  }

  .rank-head {
    align-items: flex-start;
    flex-direction: column;
    gap: 12px;
  }
}
</style>
