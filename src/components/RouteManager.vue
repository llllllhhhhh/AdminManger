<template>
  <section class="page-content admin-grid-page">
    <div class="admin-grid-hero">
      <div>
        <span class="admin-grid-eyebrow">旅行路线</span>
        <h1>旅行路线管理</h1>
        <p>统一管理用户端旅行页展示的路线，支持按分类、旅行社、库存与上下架状态筛选，路线下架后用户端不再展示。</p>
      </div>
      <button class="primary-btn compact" @click="open()">新增路线</button>
    </div>

    <div class="admin-grid-stats">
      <article><i>线</i><div><small>全部路线</small><strong>{{ routes.length }}</strong></div></article>
      <article><i class="lime">上</i><div><small>已上架</small><strong>{{ routes.filter(routeIsOnShelf).length }}</strong></div></article>
      <article><i class="orange">库</i><div><small>总库存</small><strong>{{ totalStock }}</strong></div></article>
      <article><i>社</i><div><small>合作旅行社</small><strong>{{ agencyCount }}</strong></div></article>
    </div>

    <div class="admin-grid-card">
      <div class="admin-grid-toolbar">
        <div class="admin-grid-groupbar"><i>☷</i><span>Drag here to set row groups</span><em>可按分类、旅行社、上架状态分组查看</em></div>
        <span class="admin-grid-count">共 {{ filtered.length }} 条路线</span>
      </div>

      <div class="admin-grid-filters">
        <label><span>路线搜索</span><input v-model.trim="keyword" placeholder="路线名称 / 旅行社"></label>
        <label><span>分类</span><select v-model="categoryFilter"><option value="all">全部分类</option><option v-for="item in categories" :key="item" :value="item">{{ item }}</option></select></label>
        <label><span>状态</span><select v-model="statusFilter"><option value="all">全部状态</option><option value="on">上架中</option><option value="off">已下架</option></select></label>
        <label><span>审核</span><select v-model="reviewFilter"><option value="all">全部审核</option><option value="pending">待审核</option><option value="approved">已通过</option><option value="rejected">已驳回</option></select></label>
      </div>

      <div class="admin-grid-table-wrap">
        <table class="admin-grid-table">
          <thead>
            <tr class="group-head">
              <th class="admin-grid-num"></th>
              <th colspan="2">路线信息</th>
              <th>展示排序</th>
              <th colspan="2">库存积分</th>
              <th>旅行社</th>
              <th>审核 / 状态</th>
              <th>操作</th>
            </tr>
            <tr class="head">
              <th class="admin-grid-num">#</th>
              <th>路线信息 <button>⋮</button></th>
              <th>分类 / 天数 <button>⋮</button></th>
              <th>展示权重 <button>⋮</button></th>
              <th>积分 <button>⋮</button></th>
              <th>库存 <button>⋮</button></th>
              <th>旅行社 <button>⋮</button></th>
              <th>审核 / 状态 <button>⋮</button></th>
              <th>操作</th>
            </tr>
            <tr class="filters">
              <th></th>
              <th><input class="filter-control" v-model.trim="nameFilter" placeholder="Filter..."></th>
              <th><select class="filter-control" v-model="categoryFilter"><option value="all">全部</option><option v-for="item in categories" :key="item" :value="item">{{ item }}</option></select></th>
              <th><input class="filter-control" v-model.trim="weightFilter" placeholder="≥ 权重"></th>
              <th><input class="filter-control" v-model.trim="pointFilter" placeholder="≥ 积分"></th>
              <th><input class="filter-control" v-model.trim="stockFilter" placeholder="≥ 库存"></th>
              <th><input class="filter-control" v-model.trim="agencyFilter" placeholder="旅行社"></th>
              <th><select class="filter-control" v-model="reviewFilter"><option value="all">全部</option><option value="pending">待审核</option><option value="approved">已通过</option><option value="rejected">已驳回</option></select></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, index) in pagedRoutes" :key="r.id">
              <td class="admin-grid-num">{{ startIndex + index + 1 }}</td>
              <td>
                <div class="admin-grid-main">
                  <span class="admin-grid-drag">⋮⋮</span>
                  <img class="admin-grid-thumb" :src="r.image || fallbackImage" alt="">
                  <div><b>{{ r.name }}</b><small>ID: ROUTE-{{ String(r.id).padStart(4, '0') }}</small></div>
                </div>
              </td>
              <td><span class="admin-grid-pill green">{{ r.category || '未分类' }}</span><small>{{ r.days || '未设置天数' }}</small></td>
              <td><b>{{ routeWeight(r) }}</b><small>越大越靠前</small></td>
              <td><strong class="admin-grid-money">{{ r.price }} 积分</strong></td>
              <td><b>{{ r.stock }}</b><small>{{ Number(r.stock) === 0 ? '库存不足' : '可预约' }}</small></td>
              <td><b>{{ r.agency || '未绑定旅行社' }}</b><small>路线供应方</small></td>
              <td>
                <span :class="['admin-grid-pill', reviewClass(r)]">{{ reviewText(r) }}</span>
                <small>{{ routeIsOnShelf(r) ? '上架中' : '已下架' }}</small>
                <small v-if="r.reject_reason">原因：{{ r.reject_reason }}</small>
              </td>
              <td>
                <div class="admin-grid-actions">
                  <button @click="open(r)">编辑</button>
                  <button v-if="r.review_status === 'pending' || r.review_status === 'rejected'" class="primary" @click="reviewRoute(r, true)">通过</button>
                  <button v-if="r.review_status === 'pending'" class="orange" @click="reviewRoute(r, false)">驳回</button>
                  <button class="orange" @click="$emit('toast', '团期库存设置已打开')">团期</button>
                  <button @click="toggleStatus(r)">{{ routeIsOnShelf(r) ? '下架' : '上架' }}</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="!filtered.length" class="admin-grid-empty">暂无符合条件的路线</div>
      </div>
      <PaginationBar v-model:page="page" v-model:page-size="pageSize" :total="filtered.length" />
    </div>

    <div v-if="show" class="dialog-mask" @click.self="show = false">
      <form class="dialog" @submit.prevent="save">
        <div class="dialog-head">
          <div><h2>{{ editing.id ? '编辑' : '新增' }}旅行路线</h2><p>完善路线展示、积分、库存与旅行社信息</p></div>
          <button type="button" @click="show = false">×</button>
        </div>
        <div class="dialog-body">
          <div class="field"><label>路线名称</label><input v-model.trim="editing.name" required></div>
          <div class="two-fields">
            <div class="field"><label>路线分类</label><select v-model="editing.category"><option>户外</option><option>研学</option><option>团建</option><option>人文</option></select></div>
            <div class="field"><label>旅行天数</label><input v-model.trim="editing.days" placeholder="5天4晚"></div>
          </div>
          <div class="two-fields">
            <div class="field"><label>所需积分</label><input type="number" v-model.number="editing.price"></div>
            <div class="field"><label>当前库存</label><input type="number" v-model.number="editing.stock"></div>
          </div>
          <div class="field"><label>展示权重</label><input type="number" v-model.number="editing.display_weight" placeholder="数字越大越靠前"></div>
          <div class="field"><label>合作旅行社</label><input v-model.trim="editing.agency"></div>
          <div class="field"><label>封面图片 URL</label><input v-model.trim="editing.image"></div>
          <img v-if="editing.image" class="form-cover" :src="editing.image">
        </div>
        <div class="dialog-actions"><button type="button" @click="show = false">取消</button><button class="primary-btn" type="submit">保存路线</button></div>
      </form>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { api } from '../services/api'
import PaginationBar from './PaginationBar.vue'

const props = defineProps({ config: Object })
const emit = defineEmits(['toast'])

const keyword = ref('')
const categoryFilter = ref('all')
const statusFilter = ref('all')
const reviewFilter = ref('all')
const nameFilter = ref('')
const weightFilter = ref('')
const pointFilter = ref('')
const stockFilter = ref('')
const agencyFilter = ref('')
const show = ref(false)
const editing = ref({})
const page = ref(1)
const pageSize = ref(10)
const fallbackImage = 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800'

const routes = computed(() => props.config.routes || [])
const categories = computed(() => [...new Set(routes.value.map(item => item.category).filter(Boolean))])
const agencyCount = computed(() => new Set(routes.value.map(item => item.agency).filter(Boolean)).size)
const totalStock = computed(() => routes.value.reduce((n, x) => n + Number(x.stock || 0), 0))
const atLeast = (value, filter) => filter === '' || Number(value || 0) >= Number(filter || 0)
const routeWeight = route => Number(route?.display_weight ?? route?.displayWeight ?? 0)
const routeIsOnShelf = route => ![false, 0, 'false', '0'].includes(route?.status)
const reviewText = route => ({ pending: '待审核', approved: '已通过', rejected: '已驳回' }[route?.review_status] || '已通过')
const reviewClass = route => ({ pending: 'orange', approved: 'green', rejected: 'red' }[route?.review_status] || 'green')
const normalizeRoute = route => ({
  ...route,
  price: Number(route?.price || 0),
  stock: Number(route?.stock || 0),
  display_weight: routeWeight(route),
  review_status: route?.review_status || 'approved',
  reject_reason: route?.reject_reason || '',
})

const filtered = computed(() => {
  const key = keyword.value.toLowerCase()
  const nameKey = nameFilter.value.toLowerCase()
  const agencyKey = agencyFilter.value.toLowerCase()
  return routes.value.filter(r => {
    const text = `${r.name || ''} ${r.agency || ''}`.toLowerCase()
    return (!key || text.includes(key))
      && (!nameKey || String(r.name || '').toLowerCase().includes(nameKey))
      && (!agencyKey || String(r.agency || '').toLowerCase().includes(agencyKey))
      && (categoryFilter.value === 'all' || r.category === categoryFilter.value)
      && (statusFilter.value === 'all' || (statusFilter.value === 'on' ? routeIsOnShelf(r) : !routeIsOnShelf(r)))
      && (reviewFilter.value === 'all' || (r.review_status || 'approved') === reviewFilter.value)
      && atLeast(routeWeight(r), weightFilter.value)
      && atLeast(r.price, pointFilter.value)
      && atLeast(r.stock, stockFilter.value)
  }).sort((a, b) => routeWeight(b) - routeWeight(a) || Number(b.id || 0) - Number(a.id || 0))
})
const startIndex = computed(() => (page.value - 1) * pageSize.value)
const pagedRoutes = computed(() => filtered.value.slice(startIndex.value, startIndex.value + pageSize.value))
watch(filtered, () => { page.value = 1 })

const open = r => {
  editing.value = r
    ? JSON.parse(JSON.stringify(r))
    : { id: 0, name: '', category: '户外', days: '3天2夜', price: 1999, stock: 30, agency: '', description: '', display_weight: 0, status: true, image: '' }
  editing.value.display_weight = routeWeight(editing.value)
  show.value = true
}

const save = async () => {
  const payload = normalizeRoute(editing.value)
  try {
    const saved = payload.id ? await api.updateRoute(payload) : await api.createRoute(payload)
    const index = props.config.routes.findIndex(r => r.id === saved.id)
    if (index >= 0) props.config.routes.splice(index, 1, normalizeRoute(saved))
    else props.config.routes.unshift(normalizeRoute(saved))
    emit('toast', '路线已保存到 MySQL')
  } catch {
    if (payload.id) {
      const index = props.config.routes.findIndex(r => r.id === payload.id)
      if (index >= 0) props.config.routes.splice(index, 1, payload)
    } else {
      payload.id = Date.now()
      props.config.routes.unshift(payload)
    }
    emit('toast', '后端未连接，路线暂存于本地')
  }
  show.value = false
}

const toggleStatus = async r => {
  if (!routeIsOnShelf(r) && (r.review_status || 'approved') !== 'approved') {
    emit('toast', '路线需要审核通过后才能上架')
    return
  }
  r.status = !routeIsOnShelf(r)
  try {
    await api.setRouteStatus(r.id, r.status)
    emit('toast', r.status ? '路线已上架' : '路线已下架')
  } catch (error) {
    r.status = !r.status
    emit('toast', error.message || '状态更新失败')
  }
}

const reviewRoute = async (route, approved) => {
  const rejectReason = approved ? '' : window.prompt('请输入驳回原因', route.reject_reason || '资料不完整，请修改后重新提交') || ''
  if (!approved && !rejectReason.trim()) return
  try {
    const saved = await api.reviewRoute(route.id, approved, rejectReason.trim())
    const index = props.config.routes.findIndex(item => item.id === saved.id)
    if (index >= 0) props.config.routes.splice(index, 1, normalizeRoute(saved))
    emit('toast', approved ? '路线审核通过，已同步上架' : '路线已驳回')
  } catch (error) {
    emit('toast', error.message || '审核操作失败')
  }
}
</script>

<style scoped>
.form-cover {
  width: 100%;
  height: 130px;
  border-radius: 12px;
  object-fit: cover;
}
</style>
