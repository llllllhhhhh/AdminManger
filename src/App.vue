<template>
  <div v-if="!loggedIn" class="login-shell">
    <div class="login-card">
      <div class="login-brand">
        <div class="brand-logo">行</div>
        <div>
          <h1>学徒行管理后台</h1>
          <p>登录后查看装修、用户、公告与客服数据</p>
        </div>
      </div>
      <form class="login-form" @submit.prevent="submitLogin">
        <label>账号 / 手机号<input v-model.trim="loginForm.account" placeholder="默认 13800000000"></label>
        <label>密码<input v-model.trim="loginForm.password" type="password" placeholder="默认 admin123456"></label>
        <button class="primary-btn" type="submit" :disabled="loading">{{ loading ? '登录中...' : '登录' }}</button>
      </form>
      <p class="login-tip">也支持旧的 X-Admin-Key 调试方式，但推荐使用账号登录。</p>
    </div>
    <transition name="toast"><div v-if="toastText" class="toast-message"><i>!</i>{{ toastText }}</div></transition>
  </div>

  <div v-else class="app-shell" :style="themeVars">
    <aside class="sidebar" :class="{ collapsed }">
      <div class="side-brand">
        <div class="brand-logo">{{ config.brand.logoText }}</div>
        <div>
          <b>{{ config.brand.name }}</b>
          <span>内容运营中心</span>
        </div>
        <button @click="collapsed = !collapsed">⇄</button>
      </div>
      <nav>
        <template v-for="group in navGroups" :key="group.label">
          <label>{{ group.label }}</label>
          <button v-for="n in group.items" :key="n.id" :class="{ active: view === n.id }" @click="view = n.id">
            <i>{{ n.icon }}</i>
            <span>{{ n.name }}</span>
            <em v-if="n.badge">{{ n.badge }}</em>
          </button>
        </template>
      </nav>
      <div class="side-foot">
        <div class="help-icon">?</div>
        <div>
          <b>已登录</b>
          <span>{{ adminUser?.nickname || '管理员' }}</span>
        </div>
      </div>
    </aside>

    <section class="main-shell">
      <header class="top-header">
        <div class="breadcrumb">
          <span>学徒行管理后台</span>
          <i>/</i>
          <b>{{ currentName }}</b>
        </div>
        <div class="header-actions">
          <button class="icon-action" @click="openImport">导入<small>配置</small></button>
          <button class="icon-action" @click="exportConfig">导出<small>配置</small></button>
          <button class="icon-round" @click="view='announcements'"><em>新</em>🔔</button>
          <div class="admin-user">
            <div>{{ (adminUser?.nickname || '管').slice(0,1) }}</div>
            <span>
              <b>{{ adminUser?.nickname || '管理员' }}</b>
              <small>{{ adminUser?.phone || '' }}</small>
            </span>
            <button class="icon-action" @click="logout">退出</button>
          </div>
        </div>
      </header>

      <div v-if="view === 'decorator'" class="publish-bar">
        <div>
          <span :class="['save-dot', { dirty }]"></span>
          {{ dirty ? '当前有未保存的装修修改' : '所有修改已保存' }}
        </div>
        <div>
          <button @click="resetConfig">恢复默认</button>
          <button class="ghost-btn" @click="save">保存草稿</button>
          <button class="primary-btn compact" @click="publish">发布</button>
        </div>
      </div>

      <Dashboard v-if="view === 'dashboard'" :config="config" @navigate="view = $event" />
      <Decorator v-else-if="view === 'decorator'" :config="config" :active-page="activePage" @toast="toast" @dirty="dirty = true" @page-change="activePage = $event" />
      <PageManager v-else-if="view === 'pages'" :config="config" @toast="toast" @decorate="decoratePage" />
      <BrandSettings v-else-if="view === 'brand'" :config="config" @save="save" />
      <RouteManager v-else-if="view === 'routes'" :config="config" @toast="toast" />
      <TravelMatchSettings v-else-if="view === 'travelMatch'" @toast="toast" />
      <AnnouncementManager v-else-if="view === 'announcements'" @toast="toast" />
      <ArticleManager v-else-if="view === 'articles'" @toast="toast" />
      <ContractTemplateManager v-else-if="view === 'contracts'" @toast="toast" />
      <SchoolSiteManager v-else-if="view === 'schools'" @toast="toast" />
      <ImageAssetManager v-else-if="view === 'assets'" @toast="toast" />
      <PointsManager v-else-if="view === 'points'" :config="config" @save="save" />
      <OrderManager v-else-if="view === 'orders'" @toast="toast" />
      <PreferenceInsights v-else-if="view === 'preferences'" @toast="toast" />
      <RegistrationReview v-else-if="view === 'registrations'" @toast="toast" />
      <StudyCommerceManager v-else-if="view === 'studyCommerce'" @toast="toast" />
      <UserManager v-else-if="view === 'users'" @toast="toast" />
      <SupportCenter v-else-if="view === 'support'" @toast="toast" />
      <div v-else class="page-content"><div class="empty-state large"><i>○</i><h2>{{ currentName }}</h2><p>该模块已预留，可继续扩展。</p></div></div>
    </section>

    <transition name="toast"><div v-if="toastText" class="toast-message"><i>✓</i>{{ toastText }}</div></transition>

    <div v-if="showImport" class="dialog-mask" @click.self="showImport = false">
      <form class="dialog import-dialog" @submit.prevent="importConfig">
        <div class="dialog-head"><div><h2>导入装修配置</h2><p>粘贴后台导出的 JSON</p></div><button type="button" @click="showImport = false">×</button></div>
        <div class="dialog-body"><textarea v-model="importText" placeholder="在这里粘贴 JSON"></textarea></div>
        <div class="dialog-actions"><button type="button" @click="showImport = false">取消</button><button class="primary-btn" type="submit">导入</button></div>
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
import TravelMatchSettings from './components/TravelMatchSettings.vue'
import AnnouncementManager from './components/AnnouncementManager.vue'
import ArticleManager from './components/ArticleManager.vue'
import ContractTemplateManager from './components/ContractTemplateManager.vue'
import SchoolSiteManager from './components/SchoolSiteManager.vue'
import ImageAssetManager from './components/ImageAssetManager.vue'
import OrderManager from './components/OrderManager.vue'
import PreferenceInsights from './components/PreferenceInsights.vue'
import RegistrationReview from './components/RegistrationReview.vue'
import StudyCommerceManager from './components/StudyCommerceManager.vue'
import SupportCenter from './components/SupportCenter.vue'
import UserManager from './components/UserManager.vue'
import { cloneDefault, mergeDefaultConfig } from './data/defaultConfig'
import { api, clearAdminSession, getAdminUser, setAdminSession } from './services/api'

const readSavedConfig = () => {
  const saved = localStorage.getItem('xuetuxing-admin-config')
  if (!saved) return cloneDefault()
  try {
    return mergeDefaultConfig(JSON.parse(saved))
  } catch (error) {
    console.warn('装修配置缓存损坏，已自动恢复默认配置', error)
    localStorage.removeItem('xuetuxing-admin-config')
    return cloneDefault()
  }
}

const config = ref(readSavedConfig())
const view = ref('dashboard')
const collapsed = ref(false)
const dirty = ref(false)
const toastText = ref('')
const showImport = ref(false)
const importText = ref('')
const activePage = ref('home')
const loggedIn = ref(!!getAdminUser())
const adminUser = ref(getAdminUser())
const loading = ref(false)
const loginForm = ref({ account: '13800000000', password: 'admin123456' })
let toastTimer

const navGroups = [
  { label: '工作台', items: [{ id: 'dashboard', name: '数据总览', icon: '◈' }, { id: 'decorator', name: '页面装修', icon: '▣' }, { id: 'pages', name: '页面管理', icon: '▤' }] },
  { label: '内容中心', items: [{ id: 'brand', name: '品牌样式', icon: '✦' }, { id: 'routes', name: '旅行路线', icon: '🧭' }, { id: 'travelMatch', name: '智能匹配', icon: '配' }, { id: 'contracts', name: '合同管理', icon: '合' }, { id: 'schools', name: '入驻学校', icon: '校' }, { id: 'announcements', name: '平台公告', icon: '🔔' }, { id: 'articles', name: '文章系统', icon: '文' }] },
  { label: '用户与运营', items: [{ id: 'users', name: '用户管理', icon: '👤' }, { id: 'support', name: '在线客服', icon: '🎧' }, { id: 'points', name: '积分规则', icon: '🪙' }, { id: 'orders', name: '订单审核', icon: '✓' }, { id: 'preferences', name: '用户偏好', icon: '◎' }] },
]
navGroups[2].items.unshift({ id: 'registrations', name: '注册审核', icon: '📝' })
navGroups[1].items.push({ id: 'studyCommerce', name: '学习产品', icon: '📖' })
navGroups[1].items.push({ id: 'assets', name: '图片资源', icon: '图' })
const allItems = navGroups.flatMap(group => group.items)
const currentName = computed(() => allItems.find(item => item.id === view.value)?.name || '管理后台')
const themeVars = computed(() => ({ '--primary': config.value.brand.primary, '--secondary': config.value.brand.secondary, '--dark': config.value.brand.dark }))

const toast = text => {
  toastText.value = text
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastText.value = '' }, 2200)
}

const pointPayload = () => ({
  invite_score: config.value.points.inviteScore,
  exchange_score: config.value.points.exchangeScore,
  valid_days: config.value.points.validDays,
  yearly_limit: config.value.points.yearlyLimit,
  monthly_stock: config.value.points.monthlyStock,
  enabled: config.value.points.enabled,
})

const submitLogin = async () => {
  loading.value = true
  try {
    const result = await api.adminLogin(loginForm.value)
    setAdminSession(result)
    adminUser.value = result.user
    loggedIn.value = true
    await loadInitial()
    toast('登录成功')
  } catch (error) {
    toast(error.message || '登录失败')
  } finally {
    loading.value = false
  }
}

const logout = () => {
  clearAdminSession()
  loggedIn.value = false
  adminUser.value = null
}

const save = async () => {
  localStorage.setItem('xuetuxing-admin-config', JSON.stringify(config.value))
  await api.saveDraft(config.value)
  await api.savePointRule(pointPayload())
  dirty.value = false
  toast('草稿已保存')
}

const publish = async () => {
  await api.publish(config.value)
  await api.savePointRule(pointPayload())
  dirty.value = false
  toast('已发布到用户端')
}

const resetConfig = () => {
  if (!confirm('确认恢复默认配置吗？')) return
  config.value = cloneDefault()
  dirty.value = true
}

const exportConfig = () => {
  const blob = new Blob([JSON.stringify(config.value, null, 2)], { type: 'application/json' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `xuetuxing-config-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(link.href)
}

const openImport = () => { importText.value = ''; showImport.value = true }
const importConfig = () => {
  try {
    const next = JSON.parse(importText.value)
    if (!next.brand || !Array.isArray(next.pages)) throw new Error('invalid')
    config.value = mergeDefaultConfig(next)
    dirty.value = true
    showImport.value = false
    toast('配置导入成功')
  } catch {
    toast('配置格式错误')
  }
}

const decoratePage = id => {
  activePage.value = id
  view.value = 'decorator'
}

const loadInitial = async () => {
  try {
    const draft = await api.getDraft()
    if (draft.content?.brand) config.value = mergeDefaultConfig(draft.content)
    const routes = await api.getRoutes()
    if (routes.length) config.value.routes = routes.map(route => ({
      ...route,
      price: Number(route.price),
      stock: Number(route.stock || 0),
      display_weight: Number(route.display_weight || 0),
    }))
    localStorage.setItem('xuetuxing-admin-config', JSON.stringify(config.value))
  } catch (error) {
    toast(error.message || '后端连接失败，当前使用本地缓存')
  }
}

onMounted(async () => {
  if (loggedIn.value) {
    try {
      adminUser.value = await api.adminMe()
      await loadInitial()
    } catch {
      clearAdminSession()
      loggedIn.value = false
      adminUser.value = null
    }
  }
})
</script>
