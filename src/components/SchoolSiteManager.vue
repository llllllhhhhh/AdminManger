<template>
  <section class="page-content admin-grid-page">
    <div class="admin-grid-hero">
      <div>
        <span class="admin-grid-eyebrow">入驻学校</span>
        <h1>入驻学校审核</h1>
        <p>学校提交入驻后进入待审核；审核通过并上架后，会展示到用户端“站点 / 入驻学校”页面，并允许对应学校登录商户端。</p>
      </div>
      <button class="primary-btn compact" @click="openCreate">新增学校</button>
    </div>

    <div class="admin-grid-stats">
      <article><i>校</i><div><small>全部学校</small><strong>{{ list.length }}</strong></div></article>
      <article><i class="orange">审</i><div><small>待审核</small><strong>{{ countBy('pending') }}</strong></div></article>
      <article><i class="lime">过</i><div><small>已通过</small><strong>{{ countBy('approved') }}</strong></div></article>
      <article><i class="gray">驳</i><div><small>已驳回</small><strong>{{ countBy('rejected') }}</strong></div></article>
    </div>

    <div class="admin-grid-card">
      <div class="admin-grid-toolbar">
        <div class="admin-grid-groupbar"><i>☷</i><span>Drag here to set row groups</span><em>可按城市、审核状态、上架状态或商户账号分组</em></div>
        <span class="admin-grid-count">共 {{ filteredList.length }} 所学校</span>
      </div>

      <div class="admin-grid-filters">
        <label><span>学校搜索</span><input v-model.trim="keyword" placeholder="学校名称 / 城市 / 商户账号"></label>
        <label><span>审核状态</span><select v-model="filter"><option value="all">全部状态</option><option value="pending">待审核</option><option value="approved">已通过</option><option value="rejected">已驳回</option></select></label>
        <label><span>展示状态</span><select v-model="displayFilter"><option value="all">全部</option><option value="on">已上架</option><option value="off">未展示</option></select></label>
      </div>

      <div class="admin-grid-table-wrap">
        <table class="admin-grid-table">
          <thead>
            <tr class="group-head">
              <th class="admin-grid-num"></th>
              <th colspan="2">学校信息</th>
              <th colspan="2">商户信息</th>
              <th>状态</th>
              <th>展示权重</th>
              <th>操作</th>
            </tr>
            <tr class="head">
              <th class="admin-grid-num">#</th>
              <th>学校信息 <button>⋮</button></th>
              <th>城市区域 <button>⋮</button></th>
              <th>商户账号 <button>⋮</button></th>
              <th>密码状态 <button>⋮</button></th>
              <th>审核 / 展示 <button>⋮</button></th>
              <th>展示权重 <button>⋮</button></th>
              <th>操作</th>
            </tr>
            <tr class="filters">
              <th></th>
              <th><input class="filter-control" v-model.trim="nameFilter" placeholder="学校名"></th>
              <th><input class="filter-control" v-model.trim="cityFilter" placeholder="城市 / 区域"></th>
              <th><input class="filter-control" v-model.trim="merchantFilter" placeholder="账号"></th>
              <th></th>
              <th><select class="filter-control" v-model="filter"><option value="all">全部</option><option value="pending">待审核</option><option value="approved">通过</option><option value="rejected">驳回</option></select></th>
              <th><input class="filter-control" v-model.trim="weightFilter" placeholder="≥ 权重"></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in pagedList" :key="item.id">
              <td class="admin-grid-num">{{ startIndex + index + 1 }}</td>
              <td>
                <div class="admin-grid-main">
                  <span class="admin-grid-drag">⋮⋮</span>
                  <img v-if="item.logo" class="admin-grid-avatar" :src="item.logo" alt="">
                  <div v-else class="admin-grid-avatar">{{ firstChar(item) }}</div>
                  <div><b>{{ item.name }}</b><small>{{ item.short_name || '未设置简称' }}</small></div>
                </div>
              </td>
              <td><b>{{ item.city || '未设置城市' }}</b><small>{{ item.district || '未设置区域' }}</small></td>
              <td><b>{{ item.merchant_account || '未设置' }}</b><small>学校商户端登录账号</small></td>
              <td><span :class="['admin-grid-pill', item.has_merchant_password ? 'green' : 'gray']">{{ item.has_merchant_password ? '已设置' : '未设置' }}</span></td>
              <td>
                <span :class="['admin-grid-pill', reviewClass(item.review_status)]">{{ reviewText(item.review_status) }}</span>
                <small>{{ schoolIsVisible(item) ? '已上架展示' : '未展示' }}</small>
              </td>
              <td><b>{{ schoolWeight(item) }}</b><small>越大越靠前</small></td>
              <td>
                <div class="admin-grid-actions">
                  <button @click="openEdit(item)">编辑</button>
                  <button class="orange" @click="openPassword(item)">商户账号</button>
                  <button v-if="item.review_status !== 'approved'" class="primary" @click="review(item, true)">通过</button>
                  <button v-if="item.review_status !== 'rejected'" class="danger" @click="openReject(item)">驳回</button>
                  <button @click="toggleStatus(item)" :disabled="item.review_status !== 'approved'">{{ schoolIsVisible(item) ? '下架' : '上架' }}</button>
                  <button class="danger" @click="removeItem(item)">删除</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="!filteredList.length" class="admin-grid-empty">当前筛选暂无学校</div>
      </div>
      <PaginationBar v-model:page="page" v-model:page-size="pageSize" :total="filteredList.length" />
    </div>

    <div v-if="showDialog" class="dialog-mask" @click.self="closeDialog">
      <form class="dialog school-dialog" @submit.prevent="submit">
        <div class="dialog-head">
          <div><h2>{{ form.id ? '编辑学校' : '新增学校' }}</h2><p>新增学校默认进入待审核，审核通过后才能展示到用户端并登录商户端。</p></div>
          <button type="button" @click="closeDialog">×</button>
        </div>
        <div class="dialog-body">
          <div class="two-fields">
            <div class="field"><label>学校名称</label><input v-model.trim="form.name" required></div>
            <div class="field"><label>简称</label><input v-model.trim="form.short_name"></div>
          </div>
          <div class="two-fields">
            <div class="field"><label>城市</label><input v-model.trim="form.city"></div>
            <div class="field"><label>区域</label><input v-model.trim="form.district"></div>
          </div>
          <div class="two-fields">
            <div class="field"><label>校徽图片 URL</label><input v-model.trim="form.logo"></div>
            <div class="field"><label>展示权重</label><input v-model.number="form.display_weight" type="number" min="0" placeholder="数字越大越靠前"></div>
          </div>
          <div class="two-fields" v-if="!form.id">
            <div class="field"><label>商户登录账号</label><input v-model.trim="form.merchant_account"></div>
            <div class="field"><label>初始密码</label><input v-model.trim="form.merchant_password" type="password" placeholder="至少 6 位"></div>
          </div>
          <div class="field"><label>备注</label><input v-model.trim="form.description"></div>
        </div>
        <div class="dialog-actions"><button type="button" @click="closeDialog">取消</button><button class="primary-btn" type="submit">{{ form.id ? '保存更新' : '创建学校' }}</button></div>
      </form>
    </div>

    <div v-if="rejectDialog.visible" class="dialog-mask" @click.self="rejectDialog.visible = false">
      <form class="dialog mini-dialog" @submit.prevent="review(rejectDialog.item, false)">
        <div class="dialog-head"><div><h2>驳回入驻申请</h2><p>{{ rejectDialog.item?.name }}</p></div><button type="button" @click="rejectDialog.visible = false">×</button></div>
        <div class="dialog-body"><div class="field"><label>驳回原因</label><textarea v-model.trim="rejectDialog.reason" placeholder="请填写原因，学校商户端可看到"></textarea></div></div>
        <div class="dialog-actions"><button type="button" @click="rejectDialog.visible = false">取消</button><button class="primary-btn danger" type="submit">确认驳回</button></div>
      </form>
    </div>

    <div v-if="passwordDialog.visible" class="dialog-mask" @click.self="passwordDialog.visible = false">
      <form class="dialog mini-dialog" @submit.prevent="submitPassword">
        <div class="dialog-head"><div><h2>设置商户登录账号</h2><p>{{ passwordDialog.item?.name }}</p></div><button type="button" @click="passwordDialog.visible = false">×</button></div>
        <div class="dialog-body">
          <div class="field"><label>商户账号</label><input v-model.trim="passwordDialog.account" required></div>
          <div class="field"><label>新密码</label><input v-model.trim="passwordDialog.password" type="password" minlength="6" required></div>
        </div>
        <div class="dialog-actions"><button type="button" @click="passwordDialog.visible = false">取消</button><button class="primary-btn" type="submit">保存账号密码</button></div>
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
const filter = ref('all')
const displayFilter = ref('all')
const keyword = ref('')
const nameFilter = ref('')
const cityFilter = ref('')
const merchantFilter = ref('')
const weightFilter = ref('')
const showDialog = ref(false)
const form = ref(createEmpty())
const page = ref(1)
const pageSize = ref(10)
const rejectDialog = ref({ visible: false, item: null, reason: '' })
const passwordDialog = ref({ visible: false, item: null, account: '', password: '' })
const schoolWeight = item => Number(item?.display_weight ?? item?.displayWeight ?? 0)
const schoolIsVisible = item => item?.review_status === 'approved' && ![false, 0, 'false', '0'].includes(item?.status)
const atLeast = (value, filterValue) => filterValue === '' || Number(value || 0) >= Number(filterValue || 0)

const filteredList = computed(() => {
  const key = keyword.value.toLowerCase()
  const nameKey = nameFilter.value.toLowerCase()
  const cityKey = cityFilter.value.toLowerCase()
  const merchantKey = merchantFilter.value.toLowerCase()
  return list.value.filter(item => {
    const cityText = `${item.city || ''} ${item.district || ''}`.toLowerCase()
    const text = `${item.name || ''} ${item.short_name || ''} ${cityText} ${item.merchant_account || ''}`.toLowerCase()
    return (!key || text.includes(key))
      && (!nameKey || String(item.name || '').toLowerCase().includes(nameKey))
      && (!cityKey || cityText.includes(cityKey))
      && (!merchantKey || String(item.merchant_account || '').toLowerCase().includes(merchantKey))
      && (filter.value === 'all' || item.review_status === filter.value)
      && (displayFilter.value === 'all' || (displayFilter.value === 'on' ? schoolIsVisible(item) : !schoolIsVisible(item)))
      && atLeast(schoolWeight(item), weightFilter.value)
  }).sort((a, b) => schoolWeight(b) - schoolWeight(a) || Number(a.sort_order || 0) - Number(b.sort_order || 0) || Number(b.id || 0) - Number(a.id || 0))
})
const startIndex = computed(() => (page.value - 1) * pageSize.value)
const pagedList = computed(() => filteredList.value.slice(startIndex.value, startIndex.value + pageSize.value))
watch(filteredList, () => { page.value = 1 })

const countBy = status => list.value.filter(item => item.review_status === status).length
const firstChar = item => (item.short_name || item.name || '校').slice(0, 1)
const reviewText = status => ({ pending: '待审核', approved: '已通过', rejected: '已驳回' }[status] || '待审核')
const reviewClass = status => ({ pending: 'orange', approved: 'green', rejected: 'red' }[status] || 'orange')

function createEmpty() {
  return {
    id: null,
    name: '',
    short_name: '',
    city: '',
    district: '',
    logo: '',
    status: false,
    current: false,
    review_status: 'pending',
    reject_reason: '',
    merchant_account: '',
    merchant_password: '',
    display_weight: 0,
    sort_order: 0,
    description: '',
  }
}

const load = async () => {
  try {
    list.value = await api.getSchools()
  } catch (error) {
    list.value = []
    emit('toast', error.message || '入驻学校加载失败')
  }
}

const openCreate = () => {
  form.value = createEmpty()
  showDialog.value = true
}

const openEdit = item => {
  form.value = { ...item, merchant_password: '' }
  form.value.display_weight = schoolWeight(item)
  showDialog.value = true
}

const closeDialog = () => {
  showDialog.value = false
}

const buildPayload = () => ({
  name: form.value.name,
  short_name: form.value.short_name || '',
  city: form.value.city || '',
  district: form.value.district || '',
  logo: form.value.logo || '',
  status: !!form.value.status,
  current: false,
  review_status: form.value.review_status || 'pending',
  reject_reason: form.value.reject_reason || '',
  merchant_account: form.value.merchant_account || '',
  display_weight: Number(form.value.display_weight || 0),
  sort_order: Number(form.value.sort_order || 0),
  description: form.value.description || '',
})

const submit = async () => {
  const payload = buildPayload()
  if (form.value.id) {
    await api.updateSchool({ id: form.value.id, ...payload })
    emit('toast', '学校信息已更新')
  } else {
    await api.createSchool({ ...payload, merchant_password: form.value.merchant_password || '' })
    emit('toast', '学校已创建，等待审核')
  }
  showDialog.value = false
  await load()
}

const openReject = item => {
  rejectDialog.value = { visible: true, item, reason: item.reject_reason || '' }
}

const review = async (item, approved) => {
  await api.reviewSchool(item.id, approved, approved ? '' : rejectDialog.value.reason)
  rejectDialog.value.visible = false
  emit('toast', approved ? '学校入驻已通过' : '学校入驻已驳回')
  await load()
}

const openPassword = item => {
  passwordDialog.value = { visible: true, item, account: item.merchant_account || '', password: '' }
}

const submitPassword = async () => {
  await api.setSchoolMerchantPassword(passwordDialog.value.item.id, {
    merchant_account: passwordDialog.value.account,
    merchant_password: passwordDialog.value.password,
  })
  passwordDialog.value.visible = false
  emit('toast', '商户账号密码已更新')
  await load()
}

const toggleStatus = async item => {
  await api.setSchoolStatus(item.id, !schoolIsVisible(item))
  emit('toast', schoolIsVisible(item) ? '学校已下架' : '学校已上架')
  await load()
}

const removeItem = async item => {
  if (!confirm(`确认删除「${item.name}」吗？`)) return
  await api.deleteSchool(item.id)
  emit('toast', '学校已删除')
  await load()
}

onMounted(load)
</script>

<style scoped>
.school-dialog {
  max-width: 760px;
}

.mini-dialog {
  max-width: 520px;
}

.field textarea {
  min-height: 120px;
  resize: vertical;
}

.primary-btn.danger {
  background: #d15a3a;
}
</style>
