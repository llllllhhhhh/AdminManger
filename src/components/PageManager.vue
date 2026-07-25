<template>
  <div class="page-content">
    <div class="content-title">
      <div>
        <h1>页面与内容管理</h1>
        <p>维护页面名称、访问路径、发布状态与组件数量；可为小程序核心页面补齐装修配置。</p>
      </div>
      <div class="page-actions">
        <button class="outline-btn compact" @click="fillMissing">补齐系统页面</button>
        <button class="primary-btn compact" @click="add">＋ 新建自定义页面</button>
      </div>
    </div>

    <div class="page-cards">
      <article v-for="page in config.pages" :key="page.id">
        <div class="page-visual">
          <div class="page-mini-head"><i></i><i></i><i></i></div>
          <div v-for="block in page.blocks.slice(0, 4)" :key="block.id" :class="['page-mini-block', block.type]"></div>
        </div>
        <div class="page-card-body">
          <div class="title-row-admin">
            <div>
              <h3>{{ page.name }}</h3>
              <span :class="['status', page.status]">{{ page.status === 'published' ? '已发布' : '草稿' }}</span>
            </div>
            <button @click="more === page.id ? more = null : more = page.id">···</button>
          </div>
          <p>{{ page.path }}</p>
          <div class="page-meta">
            <span>{{ page.blocks.length }} 个组件</span>
            <span>{{ page.blocks.filter(block => block.visible).length }} 个显示</span>
          </div>
          <button class="edit-page" @click="$emit('decorate', page.id)">装修此页面 →</button>
        </div>
        <div v-if="more === page.id" class="more-menu">
          <button @click="toggleStatus(page)">{{ page.status === 'published' ? '转为草稿' : '立即发布' }}</button>
          <button @click="duplicate(page)">复制页面</button>
          <button class="danger" @click="remove(page)">删除页面</button>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { defaultPages } from '../data/defaultConfig'

const props = defineProps({ config: Object })
const emit = defineEmits(['decorate', 'toast'])
const more = ref(null)

const add = () => {
  const id = `custom_${Date.now()}`
  props.config.pages.push({
    id,
    name: '新自定义页面',
    path: `/pages/custom/${id}`,
    status: 'draft',
    blocks: [],
  })
  emit('toast', '自定义页面已创建')
}

const fillMissing = () => {
  const exists = new Set(props.config.pages.map(page => page.id))
  const missing = defaultPages.filter(page => !exists.has(page.id)).map(page => JSON.parse(JSON.stringify(page)))
  if (!missing.length) return emit('toast', '系统页面已经齐全')
  props.config.pages.push(...missing)
  emit('toast', `已补齐 ${missing.length} 个系统页面`)
}

const toggleStatus = page => {
  page.status = page.status === 'published' ? 'draft' : 'published'
  more.value = null
  emit('toast', page.status === 'published' ? '页面已设为发布' : '页面已转为草稿')
}

const duplicate = page => {
  const copy = JSON.parse(JSON.stringify(page))
  copy.id = `${page.id}_copy_${Date.now()}`
  copy.name += ' 副本'
  copy.path += '-copy'
  copy.status = 'draft'
  props.config.pages.push(copy)
  more.value = null
  emit('toast', '页面已复制')
}

const remove = page => {
  if (props.config.pages.length <= 1) return emit('toast', '至少保留一个页面')
  if (!confirm(`确认删除 ${page.name} 吗？`)) return
  props.config.pages.splice(props.config.pages.indexOf(page), 1)
  more.value = null
  emit('toast', '页面已删除')
}
</script>

<style scoped>
.page-actions {
  display: flex;
  gap: 10px;
}
</style>
