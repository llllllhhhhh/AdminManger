<template>
  <div class="app-shell" :style="themeVars">
    <aside class="sidebar" :class="{ collapsed }">
      <div class="side-brand">
        <div class="brand-logo">{{ config.brand.logoText }}</div>
        <div>
          <b>{{ config.brand.name }}</b>
          <span>内容运营中心</span>
        </div>
        <button @click="collapsed = !collapsed">↔</button>
      </div>

      <nav>
        <template v-for="group in navGroups" :key="group.label">
          <label>{{ group.label }}</label>
          <button
            v-for="n in group.items"
            :key="n.id"
            :class="{ active: view === n.id }"
            @click="openView(n.id)"
          >
            <i>{{ n.icon }}</i>
            <span>{{ n.name }}</span>
            <em v-if="n.badge">{{ n.badge }}</em>
          </button>
        </template>
      </nav>

      <div class="side-foot">
        <div class="help-icon">?</div>
        <div>
          <b>需要帮助？</b>
          <span>查看后台使用手册</span>
        </div>
      </div>
    </aside>

    <section class="main-shell">
      <header class="top-header">
        <div class="breadcrumb">
          <span>学徒行运营后台</span>
          <i>/</i>
          <b>{{ currentName }}</b>
        </div>

        <div class="header-actions">
          <button class="icon-action" @click="openImport">↥ <small>导入配置</small></button>
          <button class="icon-action" @click="exportConfig">↧ <small>导出配置</small></button>
          <button class="icon-round" @click="toast('平台公告与客服消息请到对应模块查看')">✦ <em>3</em></button>
          <div class="admin-user">
            <div>运营</div>
            <span>
              <b>学徒行管理员</b>
              <small>超级管理员</small>
            </span>
            <i>⌄</i>
          </div>
        </div>
      </header>

      <div v-if="view === 'decorator'" class="publish-bar">
        <div>
          <span :class="['save-dot', { dirty }]"></span>
          {{ dirty ? '存在未保存的装修修改' : '所有修改已保存' }}
          <small>上次发布：以实际接口返回为准</small>
        </div>
        <div>
          <button @click="resetConfig">恢复默认</button>
          <button class="ghost-btn" @click="save">保存草稿</button>
          <button class="primary-btn compact" @click="publish">发布</button>
        </div>
      </div>

      <Dashboard v-if="view === 'dashboard'" :config="config" @navigate="openView" />
      <Decorator
        v-else-if="view === 'decorator'"
        :config="config"
        :active-page="activePage"
        @toast="toast"
        @dirty="dirty = true"
        @page-change="activePage = $event"
      />
      <PageManager v-else-if="view === 'pages'" :config="config" @toast="toast" @decorate="decoratePage" />
      <BrandSettings v-else-if="view === 'brand'" :config="config" @save="save" />
      <RouteManager v-else-if="view === 'routes'" :config="config" @toast="toast" />
      <AnnouncementManager v-else-if="view === 'announcements'" @toast="toast" />
      <PointsManager v-else-if="view === 'points'" :config="config" @save="save" />
      <OrderManager v-else-if="view === 'orders'" @toast="toast" />
      <PreferenceInsights v-else-if="view === 'preferences'" @toast="toast" />
      <SupportCenter v-else-if="view === 'support'" @toast="toast" />

      <div v-else class="page-content">
        <div class="empty-state large">
          <i>◎</i>
          <h2>{{ currentName }}</h2>
          <p>该业务模块已预留，可在接入真实后端 API 后继续扩展。</p>
          <button class="primary-btn compact" @click="view = 'dashboard'">返回数据看板</button>
        </div>
      </div>
    </section>

    <transition name="toast">
      <div v-if="toastText" class="toast-message"><i>✓</i>{{ toastText }}</div>
    </transition>

    <div v-if="showImport" class="dialog-mask" @click.self="showImport = false">
      <form class="dialog import-dialog" @submit.prevent="importConfig">
        <div class="dialog-head">
          <div>
            <h2>导入装修配置</h2>
            <p>粘贴由本后台导出的 JSON 配置</p>
          </div>
          <button type="button" @click="showImport = false">×</button>
        </div>

        <div class="dialog-body">
          <textarea v-model="importText" placeholder="在这里粘贴 JSON"></textarea>
          <p class="warning-note">导入会覆盖当前未保存的配置，建议先导出备份。</p>
        </div>

        <div class="dialog-actions">
          <button type="button" @click="showImport = false">取消</button>
          <button class="primary-btn" type="submit">校验并导入</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import Dashboard from './components/Dashboard.vue'
import Decorator from './components/Decorator.vue'
import PageManager from './components/PageManager.vue'
import BrandSettings from './components/BrandSettings.vue'
import PointsManager from './components/PointsManager.vue'
import RouteManager from './components/RouteManager.vue'
import AnnouncementManager from './components/AnnouncementManager.vue'
import OrderManager from './components/OrderManager.vue'
import PreferenceInsights from './components/PreferenceInsights.vue'
import SupportCenter from './components/SupportCenter.vue'
import { cloneDefault } from './data/defaultConfig'
import { api } from './services/api'

const saved = localStorage.getItem('xuetuxing-admin-config')
const config = ref(saved ? JSON.parse(saved) : cloneDefault())
const view = ref('dashboard')
const collapsed = ref(false)
const dirty = ref(false)
const toastText = ref('')
const showImport = ref(false)
const importText = ref('')
const activePage = ref('home')
let toastTimer

const navGroups = [
  {
    label: '工作台',
    items: [
      { id: 'dashboard', name: '数据总览', icon: '◫' },
      { id: 'decorator', name: '页面装修', icon: '◧' },
      { id: 'pages', name: '页面管理', icon: '▣' },
    ],
  },
  {
    label: '内容中心',
    items: [
      { id: 'brand', name: '品牌与样式', icon: '✦' },
      { id: 'routes', name: '旅行路线', icon: '⌘' },
      { id: 'announcements', name: '平台公告', icon: '🔔' },
      { id: 'materials', name: '素材中心', icon: '▤' },
    ],
  },
  {
    label: '业务运营',
    items: [
      { id: 'support', name: '在线客服', icon: '◉', badge: 1 },
      { id: 'points', name: '积分与邀请', icon: '◎' },
      { id: 'orders', name: '订单审核', icon: '✓', badge: 18 },
      { id: 'preferences', name: '用户偏好', icon: '◌' },
    ],
  },
  {
    label: '系统',
    items: [{ id: 'settings', name: '系统设置', icon: '⚙' }],
  },
]

const allItems = navGroups.flatMap(group => group.items)
const currentName = computed(() => allItems.find(item => item.id === view.value)?.name || '后台管理')
const themeVars = computed(() => ({
  '--primary': config.value.brand.primary,
  '--secondary': config.value.brand.secondary,
  '--dark': config.value.brand.dark,
}))

const openView = id => {
  view.value = id
}

const decoratePage = id => {
  activePage.value = id
  view.value = 'decorator'
}

const toast = text => {
  toastText.value = text
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastText.value = ''
  }, 2200)
}

const pointPayload = () => ({
  invite_score: config.value.points.inviteScore,
  exchange_score: config.value.points.exchangeScore,
  valid_days: config.value.points.validDays,
  yearly_limit: config.value.points.yearlyLimit,
  monthly_stock: config.value.points.monthlyStock,
  enabled: config.value.points.enabled,
})

const save = async () => {
  localStorage.setItem('xuetuxing-admin-config', JSON.stringify(config.value))
  try {
    await api.saveDraft(config.value)
    await api.savePointRule(pointPayload())
    dirty.value = false
    toast('草稿已保存到 FastAPI / MySQL')
  } catch {
    dirty.value = false
    toast('后端未连接，草稿已保存在当前浏览器')
  }
}

const publish = async () => {
  config.value.pages.forEach(page => {
    page.status = 'published'
  })
  localStorage.setItem(
    'xuetuxing-published-config',
    JSON.stringify({ ...config.value, publishedAt: new Date().toISOString() }),
  )
  try {
    await api.publish(config.value)
    await api.savePointRule(pointPayload())
    await save()
    toast('已发布，用户端刷新后生效')
  } catch {
    toast('发布接口未连接，已保留本地快照')
  }
}

const resetConfig = () => {
  if (confirm('确认恢复默认配置吗？当前未保存内容会丢失。')) {
    config.value = cloneDefault()
    dirty.value = true
    toast('已恢复默认配置')
  }
}

const exportConfig = () => {
  const blob = new Blob([JSON.stringify(config.value, null, 2)], { type: 'application/json' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `xuetuxing-config-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(link.href)
  toast('配置文件已导出')
}

const openImport = () => {
  importText.value = ''
  showImport.value = true
}

const importConfig = () => {
  try {
    const next = JSON.parse(importText.value)
    if (!next.brand || !Array.isArray(next.pages)) throw new Error('invalid')
    config.value = next
    dirty.value = true
    showImport.value = false
    toast('配置导入成功')
  } catch {
    toast('配置格式错误，请检查 JSON')
  }
}

onMounted(async () => {
  try {
    const draft = await api.getDraft()
    if (draft.content?.brand) config.value = draft.content
    const routes = await api.getRoutes()
    if (routes.length) config.value.routes = routes.map(route => ({ ...route, price: Number(route.price) }))
    localStorage.setItem('xuetuxing-admin-config', JSON.stringify(config.value))
    toast('已连接 FastAPI 后端')
  } catch {
    toast('当前使用本地数据，启动后端后将自动连接')
  }
})
</script>
