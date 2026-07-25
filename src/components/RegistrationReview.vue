<template>
  <section class="page-content admin-grid-page">
    <div class="admin-grid-hero">
      <div>
        <span class="admin-grid-eyebrow">注册审核</span>
        <h1>注册审核</h1>
        <p>用户提交注册后先进入待审核列表，管理员审核通过后才可以登录用户端。</p>
      </div>
      <button class="ghost-btn compact" @click="load">刷新</button>
    </div>

    <div class="admin-grid-stats">
      <article><i class="orange">审</i><div><small>待审核申请</small><strong>{{ rows.length }}</strong></div></article>
      <article><i class="lime">通</i><div><small>通过后状态</small><strong>正常</strong></div></article>
      <article><i class="gray">驳</i><div><small>驳回后状态</small><strong>已驳回</strong></div></article>
      <article><i>页</i><div><small>当前页</small><strong>{{ page }}</strong></div></article>
    </div>

    <div class="admin-grid-card">
      <div class="admin-grid-table-wrap">
        <table class="admin-grid-table">
          <thead>
            <tr class="group-head">
              <th class="admin-grid-num"></th>
              <th colspan="2">申请用户</th>
              <th>备考状态</th>
              <th>申请时间</th>
              <th>操作</th>
            </tr>
            <tr class="head">
              <th class="admin-grid-num">#</th>
              <th>用户信息 <button>⋮</button></th>
              <th>手机号 <button>⋮</button></th>
              <th>备考状态 <button>⋮</button></th>
              <th>申请时间 <button>⋮</button></th>
              <th>操作</th>
            </tr>
            <tr class="filters">
              <th></th>
              <th><input class="filter-control" v-model.trim="keyword" placeholder="昵称 / 用户ID"></th>
              <th><input class="filter-control" v-model.trim="phoneFilter" placeholder="手机号"></th>
              <th><input class="filter-control" v-model.trim="examFilter" placeholder="备考状态"></th>
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(user, index) in pagedRows" :key="user.id">
              <td class="admin-grid-num">{{ startIndex + index + 1 }}</td>
              <td>
                <div class="admin-grid-main">
                  <div class="admin-grid-avatar">{{ user.nickname.slice(0, 1) }}</div>
                  <div><b>{{ user.nickname }}</b><small>{{ user.user_no }}</small></div>
                </div>
              </td>
              <td><b>{{ user.phone }}</b><small>{{ user.status }}</small></td>
              <td><span class="admin-grid-pill orange">{{ user.exam_status }}</span><small>待审核中</small></td>
              <td><b>{{ format(user.created_at) }}</b></td>
              <td>
                <div class="admin-grid-actions">
                  <button class="danger" @click="review(user, false)">驳回</button>
                  <button class="primary" @click="review(user, true)">通过</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="!filtered.length" class="admin-grid-empty">当前没有待审核的注册申请</div>
      </div>
      <PaginationBar v-model:page="page" v-model:page-size="pageSize" :total="filtered.length" />
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { api } from '../services/api'
import PaginationBar from './PaginationBar.vue'

const emit = defineEmits(['toast'])
const rows = ref([])
const keyword = ref('')
const phoneFilter = ref('')
const examFilter = ref('')
const page = ref(1)
const pageSize = ref(10)

const filtered = computed(() => {
  const key = keyword.value.toLowerCase()
  const phone = phoneFilter.value.toLowerCase()
  const exam = examFilter.value.toLowerCase()
  return rows.value.filter(user =>
    (!key || `${user.nickname}${user.user_no}`.toLowerCase().includes(key))
    && (!phone || String(user.phone || '').toLowerCase().includes(phone))
    && (!exam || String(user.exam_status || '').toLowerCase().includes(exam)),
  )
})
const startIndex = computed(() => (page.value - 1) * pageSize.value)
const pagedRows = computed(() => filtered.value.slice(startIndex.value, startIndex.value + pageSize.value))
watch(filtered, () => { page.value = 1 })

const format = value => (value ? new Date(value).toLocaleString('zh-CN') : '-')

const load = async () => {
  try {
    rows.value = await api.getRegistrations()
  } catch (error) {
    emit('toast', error.message || '注册审核列表加载失败')
  }
}

const review = async (user, approved) => {
  try {
    await api.reviewRegistration(user.id, approved)
    rows.value = rows.value.filter(item => item.id !== user.id)
    emit('toast', approved ? '已通过该注册申请' : '已驳回该注册申请')
  } catch (error) {
    emit('toast', error.message || '审核操作失败')
  }
}

onMounted(load)
</script>
