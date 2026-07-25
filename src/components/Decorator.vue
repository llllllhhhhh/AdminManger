<template>
  <div class="decorator">
    <section class="component-panel panel">
      <div class="panel-heading">
        <div><b>组件库</b><small>拖动组件到手机画布</small></div>
        <span class="drag-ready">可拖拽</span>
      </div>
      <div class="component-list">
        <button
          v-for="item in componentCatalog"
          :key="item.type"
          draggable="true"
          @dragstart="catalogDragStart($event, item)"
          @dragend="endDrag"
          @click="add(item)"
        >
          <i>{{ item.icon }}</i>
          <span><b>{{ item.name }}</b><small>{{ item.desc }}</small></span>
          <em>拖</em>
        </button>
      </div>
      <div class="panel-tip">
        <b>拖拽装修提示</b>
        <p>组件可拖入手机任意位置；手机内模块和左侧图层都可以拖动交换位置。</p>
      </div>
    </section>

    <main class="canvas-panel">
      <div class="canvas-toolbar">
        <div class="page-picker">
          <small>正在装修</small>
          <select v-model="pageId">
            <option v-for="page in safePages" :key="page.id" :value="page.id">{{ page.name }}</option>
          </select>
          <span>{{ currentPage.path }}</span>
        </div>
        <div class="device-switch">
          <button class="active">手机预览</button>
          <button @click="$emit('toast', '平板预览即将上线')">平板</button>
        </div>
      </div>

      <div class="canvas-area">
        <div class="block-rail">
          <div class="rail-caption">页面图层 · 拖到模块上交换</div>
          <div
            v-for="(block, index) in currentPage.blocks"
            :key="block.id"
            class="rail-item"
            :class="{ active: block.id === selectedId, muted: !block.visible, 'drop-before': railDropIndex === index }"
            draggable="true"
            @dragstart="blockDragStart($event, block)"
            @dragover.prevent="railDropIndex = index"
            @drop.stop.prevent="railDrop($event, block.id)"
            @dragend="endDrag"
            @click="selectedId = block.id"
          >
            <span>↕</span>
            <b>{{ block.name }}</b>
            <small>{{ railDropIndex === index && draggingType === 'block' ? '交换' : index + 1 }}</small>
          </div>
          <div
            class="rail-drop-end"
            :class="{ active: railDropIndex === currentPage.blocks.length }"
            @dragover.prevent="railDropIndex = currentPage.blocks.length"
            @drop.prevent="railDrop($event, null)"
          >
            拖到此处置于底部
          </div>
        </div>

        <PhonePreview
          :config="config"
          :page="currentPage"
          :schools="previewSchools"
          :articles="previewArticles"
          :announcements="previewAnnouncements"
          @select="selectedId = $event"
          @drop-block="handleDrop"
        />
      </div>
    </main>

    <section class="property-panel panel">
      <template v-if="selected">
        <div class="panel-heading">
          <div><b>组件设置</b><small>{{ selected.name }}</small></div>
          <label class="toggle"><input type="checkbox" v-model="selected.visible"><i></i></label>
        </div>

        <div class="property-scroll">
          <div class="field"><label>组件名称</label><input v-model="selected.name" /></div>
          <div class="field" v-if="has('title')"><label>主标题</label><input v-model="selected.title" /></div>
          <div class="field" v-if="has('subtitle')"><label>副标题 / 说明</label><textarea v-model="selected.subtitle"></textarea></div>
          <div class="field" v-if="has('badge')"><label>角标文字</label><input v-model="selected.badge" /></div>
          <div class="field button-setting" v-if="has('button')">
            <label>按钮设置</label>
            <input v-model="selected.button" placeholder="按钮文案" />
            <ColorPicker v-model="selected.buttonColor" />
            <p class="field-help">按钮颜色只作用于当前模块里的按钮。</p>
          </div>
          <div class="field" v-if="has('link')"><label>点击跳转路径</label><input v-model="selected.link" placeholder="/pages/xxx/index" /></div>
          <div class="field" v-if="selected.type === 'banner'">
            <label>轮播图片</label>
            <div class="carousel-editor">
              <div class="carousel-edit-row" v-for="(url, index) in carouselImages" :key="index">
                <input v-model="carouselImages[index]" placeholder="图片地址 / OBS 图片 URL" />
                <button @click="removeCarouselImage(index)">×</button>
              </div>
            </div>
            <button class="dash-btn" @click="addCarouselImage">＋ 添加轮播图</button>
            <div v-if="carouselImages[0]" class="image-preview" :style="{ backgroundImage: `url('${carouselImages[0]}')` }">
              <button @click="removeCarouselImage(0)">移除首图</button>
            </div>
          </div>
          <div class="field" v-if="selected.type === 'banner'">
            <label>图片区域划分</label>
            <div
              class="hotzone-preview draw-mode"
              :style="{ backgroundImage: `linear-gradient(135deg,rgba(23,63,56,.18),rgba(42,166,146,.18)),url('${carouselImages[0] || selected.image || ''}')` }"
              @mousedown.prevent="startDrawHotZone"
              @mousemove.prevent="moveDrawHotZone"
              @mouseup.prevent="finishDrawHotZone"
              @mouseleave="cancelDrawHotZone"
            >
              <span
                v-for="(zone, index) in hotZones"
                :key="index"
                :style="{ left: zone.x + '%', top: zone.y + '%', width: zone.w + '%', height: zone.h + '%' }"
              >{{ zone.name || `区域${index + 1}` }}</span>
              <span
                v-if="drawingZone"
                class="drawing-zone"
                :style="{ left: drawingZone.x + '%', top: drawingZone.y + '%', width: drawingZone.w + '%', height: drawingZone.h + '%' }"
              >框选中</span>
            </div>
            <div class="hotzone-editor">
              <div class="hotzone-row" v-for="(zone, index) in hotZones" :key="index">
                <input v-model="zone.name" placeholder="区域名称" />
                <input v-model="zone.link" placeholder="跳转路径 /pages/xxx/index" />
                <button @click="removeHotZone(index)">×</button>
                <div class="hotzone-grid">
                  <span>X<input type="number" min="0" max="100" v-model.number="zone.x"></span>
                  <span>Y<input type="number" min="0" max="100" v-model.number="zone.y"></span>
                  <span>宽<input type="number" min="1" max="100" v-model.number="zone.w"></span>
                  <span>高<input type="number" min="1" max="100" v-model.number="zone.h"></span>
                </div>
              </div>
            </div>
            <div class="zone-presets">
              <button @click="applyHotZonePreset('full')">整图</button>
              <button @click="applyHotZonePreset('two')">左右两区</button>
              <button @click="applyHotZonePreset('three')">左中右三区</button>
              <button @click="addHotZone">＋ 自定义区域</button>
            </div>
            <p class="field-help">在上方图片上按住鼠标拖拽即可手动框选区域；松开后自动生成热区，再填写跳转路径。</p>
          </div>
          <div class="field" v-else-if="has('image') && selected.type !== 'smart'">
            <label>{{ selected.type === 'video' ? '视频封面图地址' : '图片地址' }}</label>
            <input v-model="selected.image" />
            <div class="image-preview" :style="{ backgroundImage: `url('${selected.image}')` }">
              <button @click="selected.image = ''">移除图片</button>
            </div>
          </div>
          <div class="field" v-if="selected.type === 'smart'">
            <label>背景图片</label>
            <input v-model.trim="selected.image" placeholder="可填 OBS 图片 URL；留空则使用背景色" />
            <div v-if="selected.image" class="image-preview" :style="{ backgroundImage: `url('${selected.image}')` }">
              <button @click="selected.image = ''">移除图片</button>
            </div>
            <p class="field-help">配置图片后会自动叠加蒙层；不填图片时使用下面的背景色。</p>
          </div>
          <div class="field smart-setting" v-if="selected.type === 'smart'">
            <label>智能定制标识</label>
            <input v-model="selected.icon" placeholder="左侧图标，留空则不显示" />
            <input v-model="selected.label" placeholder="上方标签，例如 AI 智能匹配" />
            <div class="two-mini-fields">
              <span>图标色<ColorPicker v-model="selected.iconColor" /></span>
              <span>标签色<ColorPicker v-model="selected.labelColor" /></span>
            </div>
            <div class="two-mini-fields">
              <span>标题色<ColorPicker v-model="selected.titleColor" /></span>
              <span>说明色<ColorPicker v-model="selected.textColor" /></span>
            </div>
            <p class="field-help">如果背景图较深，可把标题色改成白色，左侧图标不需要时直接清空。</p>
          </div>
          <div class="field" v-if="selected.type === 'video'">
            <label>视频播放地址</label>
            <input v-model.trim="selected.video_url" placeholder="粘贴 OBS 视频 URL，例如 https://.../travel/video.mp4" />
            <p class="field-help">建议使用 OBS/CDN 可公网访问的 mp4 地址；封面图可继续使用图片资源或 OBS 图片地址。</p>
          </div>
          <div class="field" v-if="has('progress')">
            <label>进度值 <b>{{ selected.progress }}%</b></label>
            <input type="range" min="0" max="100" v-model.number="selected.progress" />
          </div>
          <div class="field" v-if="has('height') && selected.type === 'spacer'">
            <label>间距高度 <b>{{ selected.height }}rpx</b></label>
            <input type="range" min="16" max="120" v-model.number="selected.height" />
          </div>
          <div class="field" v-if="has('background') && !['banner', 'video'].includes(selected.type)">
            <label>背景色</label>
            <ColorPicker v-model="selected.background" />
          </div>
          <div class="field" v-if="selected.type === 'grid'">
            <label>宫格入口细化</label>
            <div class="grid-editor">
              <div class="grid-edit-row" v-for="(item, index) in gridEntries" :key="index">
                <input v-model="item.icon" placeholder="图标" />
                <input v-model="item.text" placeholder="入口名称" />
                <input v-model="item.link" placeholder="/pages/xxx/index" />
                <button @click="removeGridItem(index)">×</button>
              </div>
            </div>
            <button class="dash-btn" @click="addGridItem">＋ 添加宫格入口</button>
            <p class="field-help">每个入口都可以单独设置图标、名称和跳转页面。</p>
          </div>
          <div class="field" v-if="['routes', 'schools', 'articles'].includes(selected.type)">
            <label>展示数量 <b>{{ selected.limit || 5 }} 个</b></label>
            <input type="range" min="1" max="12" v-model.number="selected.limit" />
          </div>
          <div class="field" v-if="selected.type === 'articles'">
            <label>选择展示文章</label>
            <div class="array-item" v-for="(_, index) in articleSelections" :key="index">
              <select v-model.number="articleSelections[index]">
                <option :value="0">请选择已发布文章</option>
                <option v-for="article in previewArticles" :key="article.id" :value="article.id">{{ article.title }}</option>
              </select>
              <button @click="removeArticleSelection(index)">×</button>
            </div>
            <button class="dash-btn" @click="addArticleSelection">＋ 添加文章</button>
            <p class="field-help">不选择时默认展示全部已发布文章；选择后每一项会跳转到对应文章详情。</p>
          </div>
          <div class="field" v-if="selected.type === 'notice'">
            <label>选择平台公告</label>
            <select v-model.number="selected.announcementId" @change="syncNoticeAnnouncement">
              <option :value="0">不绑定公告，使用自定义文本</option>
              <option v-for="item in previewAnnouncements" :key="item.id" :value="Number(item.id)">{{ item.title }}</option>
            </select>
            <p class="field-help">选择后，用户端点击公告文本会跳转到对应公告详情。</p>
          </div>
          <div class="field" v-if="selected.type === 'routes'">
            <label>路线展示样式</label>
            <div class="segmented">
              <button v-for="mode in routeModes" :key="mode.value" :class="{ active: selected.layout === mode.value }" @click="selected.layout = mode.value">{{ mode.label }}</button>
            </div>
          </div>
          <div class="field" v-if="selected.type === 'video'">
            <label>视频高度 <b>{{ selected.video_height || 330 }}rpx</b></label>
            <input type="range" min="220" max="520" v-model.number="selected.video_height" />
          </div>
          <div class="field" v-if="selected.type === 'banner'">
            <label>轮播高度 <b>{{ selected.height || 330 }}rpx</b></label>
            <input type="range" min="220" max="520" v-model.number="selected.height" />
          </div>
          <div class="field advanced-style">
            <label>模块细化样式</label>
            <div class="two-mini-fields">
              <span>圆角<input type="number" min="0" max="60" v-model.number="selected.radius" placeholder="28"></span>
              <span>内边距<input type="number" min="0" max="60" v-model.number="selected.padding" placeholder="28"></span>
            </div>
            <div class="two-mini-fields">
              <span>标题色<ColorPicker v-model="selected.titleColor" /></span>
              <span>文字色<ColorPicker v-model="selected.textColor" /></span>
            </div>
            <div class="two-mini-fields">
              <span>阴影<select v-model="selected.shadow"><option value="">默认</option><option value="none">无阴影</option><option value="soft">柔和</option><option value="strong">明显</option></select></span>
            </div>
            <div class="two-mini-fields" v-if="!['banner', 'video'].includes(selected.type)">
              <span>模块背景<ColorPicker v-model="selected.background" /></span>
            </div>
          </div>
          <div class="field" v-if="selected.items && selected.type !== 'grid'">
            <label>入口项目</label>
            <div class="array-item" v-for="(_, index) in selected.items" :key="index">
              <input v-model="selected.items[index]">
              <button @click="selected.items.splice(index, 1)">×</button>
            </div>
            <button class="dash-btn" @click="selected.items.push('新入口')">＋ 添加入口</button>
          </div>
          <div class="field" v-if="has('columns')">
            <label>每行列数</label>
            <div class="segmented">
              <button v-for="n in [2, 3, 4]" :key="n" :class="{ active: selected.columns === n }" @click="selected.columns = n">{{ n }} 列</button>
            </div>
          </div>
        </div>

        <div class="property-actions">
          <button @click="move(-1)" :disabled="index === 0">上移</button>
          <button @click="move(1)" :disabled="index === currentPage.blocks.length - 1">下移</button>
          <button class="danger" @click="remove">删除</button>
        </div>
      </template>

      <div v-else class="no-selection">
        <i>⌁</i>
        <b>选择一个组件</b>
        <p>在手机预览或左侧图层中点击组件，即可编辑内容与样式。</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import PhonePreview from './PhonePreview.vue'
import ColorPicker from './ColorPicker.vue'
import { cloneDefault, componentCatalog } from '../data/defaultConfig'
import { api } from '../services/api'

const props = defineProps({ config: Object, activePage: String })
const emit = defineEmits(['toast', 'dirty', 'page-change'])

const fallbackPages = cloneDefault().pages
const safePages = computed(() => {
  const pages = Array.isArray(props.config?.pages) && props.config.pages.length ? props.config.pages : fallbackPages
  return pages.map((page, index) => ({
    ...fallbackPages[index],
    ...page,
    blocks: Array.isArray(page?.blocks) && page.blocks.length ? page.blocks : (fallbackPages[index]?.blocks || fallbackPages[0].blocks),
  }))
})
const pageId = ref(props.activePage || safePages.value[0]?.id)
const selectedId = ref(safePages.value[0]?.blocks?.[0]?.id)
const draggingType = ref('')
const railDropIndex = ref(-1)
const drawStart = ref(null)
const drawingZone = ref(null)
const previewSchools = ref([])
const previewArticles = ref([])
const previewAnnouncements = ref([])
const routeModes = [
  { label: '横向滑动', value: 'scroll' },
  { label: '双列卡片', value: 'grid' },
]
const styleDefaults = {
  radius: 28,
  padding: 28,
  titleColor: '#173f38',
  textColor: '#71807c',
  buttonColor: '#ff7a35',
  shadow: 'soft',
}
const schoolWeight = item => Number(item?.display_weight ?? item?.displayWeight ?? 0)
const schoolIsVisible = item => item?.review_status === 'approved' && ![false, 0, 'false', '0'].includes(item?.status)
const articleIsPublished = item => ![false, 0, 'false', '0'].includes(item?.status)
const articleSort = (a, b) => Number(!!b.pinned) - Number(!!a.pinned)
  || Number(a.sort_order || 0) - Number(b.sort_order || 0)
  || Number(b.id || 0) - Number(a.id || 0)
const enabledStatus = value => ![false, 0, 'false', '0'].includes(value)
const inPublishWindow = item => {
  const now = Date.now()
  const start = item?.start_at ? Date.parse(item.start_at) : 0
  const end = item?.end_at ? Date.parse(item.end_at) : 0
  return (!start || start <= now) && (!end || end >= now)
}
const announcementIsPublished = item => enabledStatus(item?.status) && inPublishWindow(item)
const announcementSort = (a, b) => Number(!!b.pinned) - Number(!!a.pinned)
  || Number(Date.parse(b.published_at || b.updated_at || b.created_at || 0)) - Number(Date.parse(a.published_at || a.updated_at || a.created_at || 0))
  || Number(b.id || 0) - Number(a.id || 0)

const currentPage = computed(() => safePages.value.find(page => page.id === pageId.value) || safePages.value[0])
const selected = computed(() => currentPage.value?.blocks?.find(block => block.id === selectedId.value))
const index = computed(() => currentPage.value?.blocks?.findIndex(block => block.id === selectedId.value) ?? -1)
const gridEntries = computed(() => {
  if (!selected.value || selected.value.type !== 'grid') return []
  if (!Array.isArray(selected.value.gridItems)) {
    selected.value.gridItems = (selected.value.items || []).map((item, index) => ({
      icon: ['📚', '📄', '🧭', '🎁', '💎', '🏆'][index % 6],
      text: typeof item === 'string' ? item : item?.text || item?.name || '新入口',
      link: typeof item === 'object' ? item.link || '' : '',
    }))
  }
  return selected.value.gridItems
})
const carouselImages = computed(() => {
  if (!selected.value || selected.value.type !== 'banner') return []
  if (!Array.isArray(selected.value.images)) selected.value.images = selected.value.image ? [selected.value.image] : []
  if (!selected.value.image && selected.value.images[0]) selected.value.image = selected.value.images[0]
  return selected.value.images
})
const hotZones = computed(() => {
  if (!selected.value || selected.value.type !== 'banner') return []
  if (!Array.isArray(selected.value.hotZones)) selected.value.hotZones = defaultHotZones(selected.value.link)
  return selected.value.hotZones
})
const articleSelections = computed(() => {
  if (!selected.value || selected.value.type !== 'articles') return []
  if (!Array.isArray(selected.value.articleIds)) selected.value.articleIds = []
  return selected.value.articleIds
})
const findAnnouncement = id => previewAnnouncements.value.find(item => Number(item.id) === Number(id))
const syncNoticeAnnouncement = () => {
  if (!selected.value || selected.value.type !== 'notice') return
  const id = Number(selected.value.announcementId || selected.value.announcement_id || 0)
  if (!id) {
    selected.value.link = ''
    return
  }
  const item = findAnnouncement(id)
  if (!item) {
    selected.value.link = `/pages/notice/detail?id=${id}`
    return
  }
  selected.value.announcementId = Number(item.id)
  selected.value.title = item.title || selected.value.title
  selected.value.subtitle = String(item.summary || item.content || selected.value.subtitle || '').slice(0, 120)
  selected.value.link = `/pages/notice/detail?id=${item.id}`
}

watch(pageId, () => {
  selectedId.value = currentPage.value?.blocks?.[0]?.id
  emit('page-change', pageId.value)
})
watch(() => props.activePage, value => {
  if (value && value !== pageId.value) pageId.value = value
})
watch(() => props.config, () => emit('dirty'), { deep: true })

const has = key => selected.value && Object.prototype.hasOwnProperty.call(selected.value, key)
const catalogItem = type => componentCatalog.find(item => item.type === type)
const ensureBlockDefaults = block => {
  if (!block) return
  Object.entries(styleDefaults).forEach(([key, value]) => {
    if (block[key] === undefined || block[key] === null || block[key] === '') block[key] = value
  })
  if (block.type === 'banner') {
    if (!Array.isArray(block.images)) block.images = block.image ? [block.image] : []
    if (block.images[0] && block.image !== block.images[0]) block.image = block.images[0]
    if (!block.height) block.height = 330
    if (!Array.isArray(block.hotZones)) block.hotZones = defaultHotZones(block.link)
  }
  if (block.type === 'smart') {
    if (!Object.prototype.hasOwnProperty.call(block, 'icon')) block.icon = '✦'
    if (!Object.prototype.hasOwnProperty.call(block, 'label')) block.label = 'AI 智能匹配'
    if (!block.iconColor) block.iconColor = block.textColor || '#12a594'
    if (!block.labelColor) block.labelColor = block.textColor || '#12a594'
  }
  if (['routes', 'schools', 'articles'].includes(block.type) && !block.limit) block.limit = block.type === 'routes' ? 6 : 5
  if (block.type === 'routes' && !block.layout) block.layout = 'scroll'
  if (block.type === 'articles' && !Array.isArray(block.articleIds)) block.articleIds = []
  if (block.type === 'notice') {
    if (!Object.prototype.hasOwnProperty.call(block, 'announcementId')) block.announcementId = Number(block.announcement_id || 0)
    if (!Object.prototype.hasOwnProperty.call(block, 'link')) block.link = ''
  }
  if (block.type === 'video' && !block.video_height) block.video_height = 330
}
const addCarouselImage = () => {
  carouselImages.value.push('')
}
const removeCarouselImage = index => {
  carouselImages.value.splice(index, 1)
  if (selected.value) selected.value.image = carouselImages.value[0] || ''
}
const defaultHotZones = link => [{ name: '整图跳转', x: 0, y: 0, w: 100, h: 100, link: link || '' }]
const addHotZone = () => {
  hotZones.value.push({ name: `区域${hotZones.value.length + 1}`, x: 0, y: 0, w: 50, h: 50, link: selected.value?.link || '' })
}
const removeHotZone = index => hotZones.value.splice(index, 1)
const pointerPercent = event => {
  const rect = event.currentTarget.getBoundingClientRect()
  const x = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100))
  const y = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100))
  return { x, y }
}
const startDrawHotZone = event => {
  drawStart.value = pointerPercent(event)
  drawingZone.value = { x: drawStart.value.x, y: drawStart.value.y, w: 0, h: 0 }
}
const moveDrawHotZone = event => {
  if (!drawStart.value) return
  const point = pointerPercent(event)
  drawingZone.value = {
    x: Math.min(drawStart.value.x, point.x),
    y: Math.min(drawStart.value.y, point.y),
    w: Math.abs(point.x - drawStart.value.x),
    h: Math.abs(point.y - drawStart.value.y),
  }
}
const finishDrawHotZone = event => {
  if (!drawStart.value || !drawingZone.value) return
  moveDrawHotZone(event)
  const zone = drawingZone.value
  if (zone.w >= 3 && zone.h >= 3) {
    hotZones.value.push({
      name: `区域${hotZones.value.length + 1}`,
      x: Number(zone.x.toFixed(1)),
      y: Number(zone.y.toFixed(1)),
      w: Number(zone.w.toFixed(1)),
      h: Number(zone.h.toFixed(1)),
      link: selected.value?.link || '',
    })
  }
  drawStart.value = null
  drawingZone.value = null
}
const cancelDrawHotZone = () => {
  drawStart.value = null
  drawingZone.value = null
}
const applyHotZonePreset = type => {
  if (!selected.value) return
  const link = selected.value.link || ''
  if (type === 'two') {
    selected.value.hotZones = [
      { name: '左侧区域', x: 0, y: 0, w: 50, h: 100, link },
      { name: '右侧区域', x: 50, y: 0, w: 50, h: 100, link },
    ]
  } else if (type === 'three') {
    selected.value.hotZones = [
      { name: '左侧区域', x: 0, y: 0, w: 33, h: 100, link },
      { name: '中间区域', x: 33, y: 0, w: 34, h: 100, link },
      { name: '右侧区域', x: 67, y: 0, w: 33, h: 100, link },
    ]
  } else {
    selected.value.hotZones = defaultHotZones(link)
  }
}
watch(selected, block => ensureBlockDefaults(block), { immediate: true })
const syncGridItems = () => {
  if (!selected.value || selected.value.type !== 'grid') return
  selected.value.items = gridEntries.value.map(item => item.text || '新入口')
}
const addGridItem = () => {
  gridEntries.value.push({ icon: '✨', text: '新入口', link: '' })
  syncGridItems()
}
const removeGridItem = index => {
  gridEntries.value.splice(index, 1)
  syncGridItems()
}
const addArticleSelection = () => {
  const used = new Set(articleSelections.value.map(Number).filter(Boolean))
  const next = previewArticles.value.find(article => !used.has(Number(article.id)))
  articleSelections.value.push(next ? Number(next.id) : 0)
}
const removeArticleSelection = index => {
  articleSelections.value.splice(index, 1)
}

const defaultBlock = item => {
  const block = {
    id: `${item.type}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    type: item.type,
    name: item.name,
    visible: true,
    title: item.name,
    subtitle: item.desc,
    radius: 28,
    padding: 28,
    titleColor: '#173f38',
    textColor: '#71807c',
    buttonColor: '#ff7a35',
    shadow: 'soft',
  }
  if (item.type === 'banner') Object.assign(block, {
    badge: '精选推荐',
    image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200',
    images: [
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200',
      'https://images.unsplash.com/photo-1528127269322-539801943592?w=1200',
    ],
    height: 330,
    link: '',
    hotZones: [{ name: '整图跳转', x: 0, y: 0, w: 100, h: 100, link: '' }],
  })
  if (item.type === 'activity') Object.assign(block, { button: '立即查看', progress: 50, background: '#fff5e9', link: '/pages/points/activity' })
  if (item.type === 'grid') Object.assign(block, { items: ['入口一', '入口二', '入口三'], gridItems: [{ icon: '📚', text: '入口一', link: '' }, { icon: '📄', text: '入口二', link: '' }, { icon: '🧭', text: '入口三', link: '' }], columns: 3 })
  if (item.type === 'study') Object.assign(block, { progress: 60, link: '/pages/study/index' })
  if (item.type === 'smart') Object.assign(block, { button: '开始定制', icon: '✦', iconColor: '#12a594', label: 'AI 智能匹配', labelColor: '#12a594', image: '', background: '#dff5ef', link: '/pages/custom/params' })
  if (item.type === 'routes') Object.assign(block, { title: '为你推荐', subtitle: '展示已上架路线', limit: 6, layout: 'scroll' })
  if (item.type === 'schools') Object.assign(block, { title: '入驻学校', subtitle: '展示已审核学校站点', limit: 5 })
  if (item.type === 'articles') Object.assign(block, { title: '推荐阅读', subtitle: '展示已发布文章', limit: 5, articleIds: [] })
  if (item.type === 'video') Object.assign(block, { image: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=900', video_url: '', video_height: 330 })
  if (item.type === 'notice') Object.assign(block, { background: '#ffffff', announcementId: 0, link: '' })
  if (item.type === 'spacer') Object.assign(block, { title: '留白间距', height: 40 })
  return block
}

const add = (item, position = currentPage.value.blocks.length) => {
  const block = defaultBlock(item)
  currentPage.value.blocks.splice(position, 0, block)
  selectedId.value = block.id
  emit('toast', `${item.name} 已放入画布`)
}

const setDragData = (event, data) => {
  event.dataTransfer.effectAllowed = data.kind === 'catalog' ? 'copy' : 'move'
  event.dataTransfer.setData('text/plain', JSON.stringify(data))
}
const readDragData = event => {
  try { return JSON.parse(event.dataTransfer.getData('text/plain')) } catch { return null }
}
const catalogDragStart = (event, item) => {
  draggingType.value = item.type
  setDragData(event, { kind: 'catalog', type: item.type })
}
const blockDragStart = (event, block) => {
  draggingType.value = 'block'
  selectedId.value = block.id
  setDragData(event, { kind: 'block', id: block.id })
}
const reorder = (sourceId, targetId) => {
  const blocks = currentPage.value.blocks
  const from = blocks.findIndex(block => block.id === sourceId)
  if (from < 0) return
  if (!targetId) {
    const [item] = blocks.splice(from, 1)
    blocks.push(item)
    selectedId.value = item.id
    return
  }
  const to = blocks.findIndex(block => block.id === targetId)
  if (to < 0 || to === from) return
  ;[blocks[from], blocks[to]] = [blocks[to], blocks[from]]
  selectedId.value = sourceId
  emit('toast', '两个组件已交换位置')
}
const handleDrop = data => {
  if (!data) return
  const targetIndex = data.targetId ? currentPage.value.blocks.findIndex(block => block.id === data.targetId) : currentPage.value.blocks.length
  if (data.kind === 'catalog') {
    const item = catalogItem(data.type)
    if (item) add(item, targetIndex < 0 ? currentPage.value.blocks.length : targetIndex)
  } else if (data.kind === 'block') {
    reorder(data.id, data.targetId)
  }
  endDrag()
}
const railDrop = (event, targetId) => handleDrop({ ...readDragData(event), targetId })
const endDrag = () => {
  draggingType.value = ''
  railDropIndex.value = -1
}
const move = direction => {
  const from = index.value
  const to = from + direction
  if (from < 0 || to < 0 || to >= currentPage.value.blocks.length) return
  const [block] = currentPage.value.blocks.splice(from, 1)
  currentPage.value.blocks.splice(to, 0, block)
}
const remove = () => {
  if (!selected.value) return
  const oldIndex = index.value
  currentPage.value.blocks.splice(oldIndex, 1)
  selectedId.value = currentPage.value.blocks[Math.max(0, oldIndex - 1)]?.id
  emit('toast', '组件已删除')
}

const loadPreviewSchools = async () => {
  try {
    const schools = await api.getSchools()
    previewSchools.value = schools
      .filter(schoolIsVisible)
      .sort((a, b) => schoolWeight(b) - schoolWeight(a) || Number(a.sort_order || 0) - Number(b.sort_order || 0) || Number(b.id || 0) - Number(a.id || 0))
  } catch {
    previewSchools.value = []
  }
}

const loadPreviewArticles = async () => {
  try {
    const articles = await api.getArticles()
    previewArticles.value = articles
      .filter(articleIsPublished)
      .sort(articleSort)
  } catch {
    previewArticles.value = []
  }
}

const loadPreviewAnnouncements = async () => {
  try {
    const announcements = await api.getAnnouncements()
    previewAnnouncements.value = announcements
      .filter(announcementIsPublished)
      .sort(announcementSort)
    syncNoticeAnnouncement()
  } catch {
    previewAnnouncements.value = []
  }
}

onMounted(() => {
  loadPreviewSchools()
  loadPreviewArticles()
  loadPreviewAnnouncements()
})
</script>
