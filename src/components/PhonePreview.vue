<template>
  <div class="phone-shell" :style="themeVars">
    <div class="phone-notch"><span></span></div>
    <div class="phone-screen">
      <div class="mini-status"><span>9:41</span><span>▰◔▰ ●</span></div>
      <div class="mini-header">
        <div class="mini-logo">{{ config.brand.logoText }}</div>
        <b>{{ config.brand.name }}</b>
        <div class="mini-actions">● ···</div>
      </div>

      <div
        class="mini-scroll"
        :class="{ 'canvas-dragging': dragging }"
        :style="{ background: config.brand.background }"
        @dragover.prevent="dragging = true; dropTarget = 'end'"
        @dragleave.self="dropTarget = ''"
        @drop.prevent="dropAt($event, null)"
      >
        <template v-for="block in visibleBlocks" :key="block.id">
          <div
            class="pv-block-wrap"
            :class="{ 'drop-target': dropTarget === block.id, 'is-dragging': dragId === block.id }"
            draggable="true"
            @dragstart.stop="startBlockDrag($event, block)"
            @dragend="endDrag"
            @dragover.stop.prevent="dragging = true; dropTarget = block.id"
            @drop.stop.prevent="dropAt($event, block.id)"
            @click="$emit('select', block.id)"
          >
            <div class="pv-drag-handle">↕</div>
            <div v-if="dropTarget === block.id" class="pv-drop-label">{{ dragId ? '松开后交换位置' : '松开插入到这里' }}</div>

            <div v-if="block.type === 'banner'" class="pv-banner" :style="bannerStyle(block)">
              <span
                v-for="(zone, index) in bannerHotZones(block)"
                :key="index"
                class="pv-hotzone"
                :style="{ left: zone.x + '%', top: zone.y + '%', width: zone.w + '%', height: zone.h + '%' }"
              ></span>
              <div class="pv-overlay">
                <span class="pv-badge">{{ block.badge }}</span>
                <h3 :style="{ color: block.titleColor || '' }">{{ block.title }}</h3>
                <p :style="{ color: block.textColor || '' }">{{ block.subtitle }}</p>
              </div>
            </div>

            <div v-else-if="block.type === 'activity'" class="pv-activity pv-section" :class="{ dark: isDark(block.background) }" :style="sectionStyle(block)">
              <div class="pv-row">
                <div><b :style="{ color: block.titleColor || '' }">{{ block.title }}</b><p :style="{ color: block.textColor || '' }">{{ block.subtitle }}</p></div>
                <button :style="buttonStyle(block)">{{ block.button || '查看权益' }}</button>
              </div>
              <div class="pv-progress"><i :style="{ width: (block.progress || 0) + '%' }"></i></div>
            </div>

            <div v-else-if="block.type === 'grid'" class="pv-section" :style="sectionStyle(block)">
              <h4 :style="{ color: block.titleColor || '' }">{{ block.title }}</h4>
              <div class="pv-grid" :style="{ gridTemplateColumns: `repeat(${block.columns || 3}, 1fr)` }">
                <div v-for="(item, index) in gridItems(block)" :key="index">
                  <span>{{ item.icon || icons[index % icons.length] }}</span>
                  <small>{{ item.text }}</small>
                </div>
              </div>
            </div>

            <div v-else-if="block.type === 'study'" class="pv-section" :style="sectionStyle(block)">
              <h4 :style="{ color: block.titleColor || '' }">{{ block.title }} 🔥</h4>
              <p :style="{ color: block.textColor || '' }">{{ block.subtitle }}</p>
              <div class="pv-progress"><i :style="{ width: (block.progress || 0) + '%' }"></i></div>
              <div class="pv-task"><span>✓ 今日学习任务</span><em>已完成</em></div>
              <div class="pv-task"><span>● 阶段规划服务</span><em>去查看 →</em></div>
            </div>

            <div v-else-if="block.type === 'smart'" class="pv-smart pv-section" :style="smartStyle(block)">
              <div>
                <small :style="{ color: block.labelColor || block.textColor || '' }">{{ block.label || 'AI 智能匹配' }}</small>
                <h4 :style="{ color: block.titleColor || '' }">{{ block.title }}</h4>
                <p :style="{ color: block.textColor || '' }">{{ block.subtitle }}</p>
              </div>
            </div>

            <div v-else-if="block.type === 'routes'" class="pv-section" :style="sectionStyle(block)">
              <div class="pv-row"><h4 :style="{ color: block.titleColor || '' }">{{ block.title }}</h4><small :style="{ color: block.textColor || '' }">{{ block.subtitle }}</small></div>
              <div class="pv-routes">
                <div v-for="route in activeRoutes.slice(0, Number(block.limit || 2))" :key="route.id || route.name">
                  <img :src="route.image" />
                  <b>{{ route.name }}</b>
                  <small>{{ route.days }} · {{ route.price }} 积分</small>
                </div>
                <small v-if="!activeRoutes.length">暂无上架路线</small>
              </div>
            </div>

            <div v-else-if="block.type === 'schools'" class="pv-section" :style="sectionStyle(block)">
              <div class="pv-row"><h4 :style="{ color: block.titleColor || '' }">{{ block.title }}</h4><small :style="{ color: block.textColor || '' }">{{ block.subtitle }}</small></div>
              <div class="pv-list-card" v-for="item in activeSchools.slice(0, Number(block.limit || 5))" :key="item.id || item.name">
                <i>{{ firstChar(item) }}</i>
                <div><b>{{ item.name }}</b><small>已入驻 · 可展示站点服务</small></div>
                <em>→</em>
              </div>
              <small v-if="!activeSchools.length">暂无已入驻学校</small>
            </div>

            <div v-else-if="block.type === 'articles'" class="pv-section" :style="sectionStyle(block)">
              <div class="pv-row"><h4 :style="{ color: block.titleColor || '' }">{{ block.title }}</h4><small :style="{ color: block.textColor || '' }">{{ block.subtitle }}</small></div>
              <div class="pv-list-card" v-for="item in previewArticles(block)" :key="item.id || item.slug">
                <i>文</i>
                <div><b>{{ item.title }}</b><small>{{ item.category || '平台文章' }} · 已发布</small></div>
                <em>→</em>
              </div>
              <small v-if="!previewArticles(block).length">暂无已发布文章</small>
            </div>

            <div v-else-if="block.type === 'video'" class="pv-section" :style="sectionStyle(block)">
              <div class="pv-row"><h4 :style="{ color: block.titleColor || '' }">{{ block.title }}</h4><small>{{ videoSource(block) ? 'OBS 视频' : '待配置地址' }}</small></div>
              <div class="pv-video" :style="videoStyle(block)">
                <i>▶</i>
                <b>{{ block.subtitle }}</b>
                <em>{{ videoSource(block) ? '已配置播放地址' : '请在右侧填写视频播放地址' }}</em>
              </div>
            </div>

            <div v-else-if="block.type === 'spacer'" class="pv-spacer" :style="{ height: (block.height || 40) + 'px' }"></div>

            <div v-else class="pv-notice pv-section" :style="sectionStyle(block)">
              <b :style="{ color: block.titleColor || '' }">{{ noticeTitle(block) }}</b>
              <p :style="{ color: block.textColor || '' }">{{ noticeSubtitle(block) }}</p>
            </div>
          </div>
        </template>

        <div v-if="!visibleBlocks.length" class="pv-empty">拖动左侧组件到这里<br />开始装修页面</div>
        <div class="pv-drop-end" :class="{ active: dropTarget === 'end' }">＋ 放置到页面底部</div>
      </div>

      <div class="mini-tabs">
        <span class="on">⌂<small>首页</small></span>
        <span>✓<small>题库</small></span>
        <span>▣<small>资料</small></span>
        <span>⌁<small>旅行</small></span>
        <span>●<small>我的</small></span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  config: Object,
  page: Object,
  schools: { type: Array, default: () => [] },
  articles: { type: Array, default: () => [] },
  announcements: { type: Array, default: () => [] },
})
const emit = defineEmits(['select', 'drop-block'])

const icons = ['✓', '▣', '⌁', '●', '◈', '☆']
const dragging = ref(false)
const dropTarget = ref('')
const dragId = ref('')
const visibleBlocks = computed(() => props.page?.blocks?.filter(block => block.visible) || [])
const routeWeight = route => Number(route?.display_weight ?? route?.displayWeight ?? 0)
const routeIsOnShelf = route => ![false, 0, 'false', '0'].includes(route?.status)
const activeRoutes = computed(() => (props.config.routes || [])
  .filter(routeIsOnShelf)
  .sort((a, b) => routeWeight(b) - routeWeight(a) || Number(b.id || 0) - Number(a.id || 0)))
const schoolWeight = item => Number(item?.display_weight ?? item?.displayWeight ?? 0)
const schoolIsVisible = item => item?.review_status === 'approved' && ![false, 0, 'false', '0'].includes(item?.status)
const activeSchools = computed(() => (props.schools || [])
  .filter(schoolIsVisible)
  .sort((a, b) => schoolWeight(b) - schoolWeight(a) || Number(a.sort_order || 0) - Number(b.sort_order || 0) || Number(b.id || 0) - Number(a.id || 0)))
const firstChar = item => String(item?.short_name || item?.name || '校').slice(0, 1)
const articleIsPublished = item => ![false, 0, 'false', '0'].includes(item?.status)
const articleSort = (a, b) => Number(!!b.pinned) - Number(!!a.pinned)
  || Number(a.sort_order || 0) - Number(b.sort_order || 0)
  || Number(b.id || 0) - Number(a.id || 0)
const activeArticles = computed(() => (props.articles || []).filter(articleIsPublished).sort(articleSort))
const previewArticles = block => {
  const ids = Array.isArray(block?.articleIds) ? block.articleIds.map(Number).filter(Boolean) : []
  const source = ids.length
    ? ids.map(id => activeArticles.value.find(article => Number(article.id) === id)).filter(Boolean)
    : activeArticles.value
  return source.slice(0, Number(block?.limit || 5))
}
const announcementIsPublished = item => ![false, 0, 'false', '0'].includes(item?.status)
const activeAnnouncements = computed(() => (props.announcements || []).filter(announcementIsPublished))
const noticeAnnouncement = block => {
  const id = Number(block?.announcementId || block?.announcement_id || 0)
  return id ? activeAnnouncements.value.find(item => Number(item.id) === id) : null
}
const noticeTitle = block => noticeAnnouncement(block)?.title || block?.title
const noticeSubtitle = block => noticeAnnouncement(block)?.summary || block?.subtitle
const themeVars = computed(() => ({
  '--primary': props.config.brand.primary,
  '--secondary': props.config.brand.secondary,
  '--dark': props.config.brand.dark,
}))
const bgImage = block => ({
  backgroundImage: `linear-gradient(90deg,rgba(9,35,31,.76),rgba(9,35,31,.06)),url('${previewImage(block)}')`,
  backgroundColor: block.background || '#123d37',
})
const shadowMap = {
  none: 'none',
  soft: '0 4px 12px rgba(25,56,51,.05)',
  strong: '0 8px 22px rgba(25,56,51,.13)',
}
const previewImage = block => Array.isArray(block?.images) && block.images[0] ? block.images[0] : block?.image || ''
const sectionStyle = (block, fallback = '#fff') => ({
  background: block?.background || fallback,
  borderRadius: '12px',
  padding: `${Math.max(4, Math.round(Number(block?.padding || 28) / 2.5))}px`,
  boxShadow: shadowMap[block?.shadow] || undefined,
})
const buttonStyle = block => ({
  background: `${block?.buttonColor || '#ff7a35'} !important`,
})
const bannerStyle = block => ({
  ...bgImage(block),
  borderRadius: '14px',
  height: `${Math.max(90, Math.round(Number(block?.height || 330) / 2.3))}px`,
})
const videoStyle = block => ({
  ...bgImage(block),
  height: `${Math.max(80, Math.round(Number(block?.video_height || 330) / 3))}px`,
  borderRadius: '9px',
})
const smartStyle = block => ({
  ...sectionStyle(block, '#eef8f5'),
  border: '1px solid #d7e9e4',
  boxShadow: '0 6px 18px rgba(23,63,56,.07)',
})
const bannerHotZones = block => Array.isArray(block?.hotZones) ? block.hotZones : []
const gridItems = block => {
  const list = Array.isArray(block?.gridItems) ? block.gridItems : block?.items || []
  return list.map((item, index) => typeof item === 'string'
    ? { icon: icons[index % icons.length], text: item, link: '' }
    : { icon: item.icon || icons[index % icons.length], text: item.text || item.name || '入口', link: item.link || '' })
}
const videoSource = block => String(block?.video_url || block?.videoUrl || block?.url || '').trim()
const isDark = color => ['#153e38', '#172c2a', '#132f2b'].includes(color)
const startBlockDrag = (event, block) => {
  dragging.value = true
  dragId.value = block.id
  emit('select', block.id)
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', JSON.stringify({ kind: 'block', id: block.id }))
}
const dropAt = (event, targetId) => {
  let data
  try { data = JSON.parse(event.dataTransfer.getData('text/plain')) } catch { return endDrag() }
  emit('drop-block', { ...data, targetId })
  endDrag()
}
const endDrag = () => {
  dragging.value = false
  dropTarget.value = ''
  dragId.value = ''
}
</script>
