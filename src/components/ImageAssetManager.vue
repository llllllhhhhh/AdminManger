<template>
  <section class="page-content admin-grid-page">
    <div class="admin-grid-hero">
      <div>
        <span class="admin-grid-eyebrow">图片资源</span>
        <h1>图片资源</h1>
        <p>统一查看客服图片、学生证等已上传图片；支持预览、打开原图、下载，并可配置用户上传图片的最大 MB 限制。</p>
      </div>
      <button class="primary-btn compact" :disabled="loading" @click="load">{{ loading ? '刷新中...' : '刷新列表' }}</button>
    </div>

    <div class="admin-grid-stats">
      <article><i>图</i><div><small>全部图片</small><strong>{{ list.length }}</strong></div></article>
      <article><i class="lime">云</i><div><small>OBS 存储</small><strong>{{ obsCount }}</strong></div></article>
      <article><i class="gray">本</i><div><small>本地存储</small><strong>{{ localCount }}</strong></div></article>
      <article><i class="orange">限</i><div><small>上传限制</small><strong>{{ uploadSetting.max_image_mb }}MB</strong></div></article>
    </div>

    <div class="admin-grid-setting-card">
      <div>
        <b>图片上传大小限制</b>
        <span>控制客服图片、学生证等图片上传最大体积，保存后用户端和管理端上传都会按此限制校验。</span>
      </div>
      <label><input v-model.number="uploadSetting.max_image_mb" type="number" min="1" max="50"><em>MB</em></label>
      <button class="primary-btn compact" :disabled="savingSetting" @click="saveUploadSetting">{{ savingSetting ? '保存中...' : '保存限制' }}</button>
    </div>

    <div class="admin-grid-card">
      <div class="admin-grid-toolbar">
        <div class="admin-grid-groupbar"><i>☷</i><span>Drag here to set row groups</span><em>可按来源、存储位置、上传时间分组</em></div>
        <span class="admin-grid-count">共 {{ filtered.length }} 张图片</span>
      </div>
      <div class="admin-grid-filters">
        <label><span>图片搜索</span><input v-model.trim="keyword" placeholder="文件名 / 路径 / object key"></label>
        <label><span>来源</span><select v-model="filters.source" @change="load"><option value="">全部来源</option><option value="support">客服图片</option><option value="student_card">学生证</option><option value="admission_notice">历史认证图片</option></select></label>
        <label><span>存储</span><select v-model="filters.storage" @change="load"><option value="">全部存储</option><option value="obs">华为云 OBS</option><option value="local">服务器本地</option></select></label>
      </div>

      <div v-if="loading" class="admin-grid-empty">正在读取图片资源...</div>
      <div v-else class="admin-grid-table-wrap">
        <table class="admin-grid-table">
          <thead>
            <tr class="group-head"><th class="admin-grid-num"></th><th colspan="2">图片资源</th><th colspan="2">存储信息</th><th>时间</th><th>操作</th></tr>
            <tr class="head">
              <th class="admin-grid-num">#</th>
              <th>图片预览 <button>⋮</button></th>
              <th>文件信息 <button>⋮</button></th>
              <th>来源 <button>⋮</button></th>
              <th>存储 / 大小 <button>⋮</button></th>
              <th>上传时间 <button>⋮</button></th>
              <th>操作</th>
            </tr>
            <tr class="filters">
              <th></th>
              <th></th>
              <th><input class="filter-control" v-model.trim="nameFilter" placeholder="文件名"></th>
              <th><select class="filter-control" v-model="sourceFilter"><option value="all">全部</option><option value="support">客服图片</option><option value="student_card">学生证</option><option value="admission_notice">历史认证图片</option><option value="graduation">历史认证图片</option><option value="common">通用图片</option></select></th>
              <th><select class="filter-control" v-model="storageFilter"><option value="all">全部</option><option value="obs">OBS</option><option value="local">本地</option></select></th>
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in pagedList" :key="item.id">
              <td class="admin-grid-num">{{ startIndex + index + 1 }}</td>
              <td>
                <button class="asset-preview" type="button" @click="open(item)">
                  <img :src="assetThumbUrl(item)" :alt="item.original_name || item.filename" loading="lazy">
                </button>
              </td>
              <td><b>{{ item.original_name || item.filename || `图片 #${item.id}` }}</b><small>{{ item.object_key || item.path || '暂无路径' }}</small></td>
              <td><span class="admin-grid-pill green">{{ sourceText(item.source) }}</span><small>ID: ASSET-{{ String(item.id).padStart(4, '0') }}</small></td>
              <td><span :class="['admin-grid-pill', item.storage === 'obs' ? 'green' : 'gray']">{{ item.storage === 'obs' ? '华为云 OBS' : '本地上传' }}</span><small>{{ formatSize(item.size) }}</small></td>
              <td><b>{{ formatTime(item.created_at) }}</b><small>{{ item.mime_type || 'image/*' }}</small></td>
              <td>
                <div class="admin-grid-actions">
                  <button @click="open(item)">查看</button>
                  <a :href="assetUrl(item)" :download="item.original_name || item.filename" target="_blank" rel="noreferrer">下载</a>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="!filtered.length" class="admin-grid-empty">暂无上传图片</div>
      </div>
      <PaginationBar v-model:page="page" v-model:page-size="pageSize" :total="filtered.length" />
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { api, resolveApiAssetThumbUrl, resolveApiAssetUrl } from '../services/api'
import PaginationBar from './PaginationBar.vue'

const emit = defineEmits(['toast'])
const list = ref([])
const loading = ref(false)
const savingSetting = ref(false)
const filters = ref({ source: '', storage: '' })
const uploadSetting = ref({ max_image_mb: 8, max_image_bytes: 8 * 1024 * 1024 })
const keyword = ref('')
const nameFilter = ref('')
const sourceFilter = ref('all')
const storageFilter = ref('all')
const page = ref(1)
const pageSize = ref(10)

const obsCount = computed(() => list.value.filter(item => item.storage === 'obs').length)
const localCount = computed(() => list.value.filter(item => item.storage === 'local').length)
const filtered = computed(() => {
  const key = keyword.value.toLowerCase()
  const nameKey = nameFilter.value.toLowerCase()
  return list.value.filter(item => {
    const fileName = `${item.original_name || ''} ${item.filename || ''}`.toLowerCase()
    const text = `${fileName} ${item.object_key || ''} ${item.path || ''}`.toLowerCase()
    return (!key || text.includes(key))
      && (!nameKey || fileName.includes(nameKey))
      && (sourceFilter.value === 'all' || item.source === sourceFilter.value)
      && (storageFilter.value === 'all' || item.storage === storageFilter.value)
  })
})
const startIndex = computed(() => (page.value - 1) * pageSize.value)
const pagedList = computed(() => filtered.value.slice(startIndex.value, startIndex.value + pageSize.value))
watch(filtered, () => { page.value = 1 })

const sourceText = source => ({
  support: '客服图片',
  student_card: '学生证',
  admission_notice: '历史认证图片',
  graduation: '历史认证图片',
  common: '通用图片',
}[source] || source || '图片')

const assetUrl = item => resolveApiAssetUrl(`/api/v1/public/assets/${item.id}/file`)
const assetThumbUrl = item => resolveApiAssetThumbUrl(`/api/v1/public/assets/${item.id}/file`)
const formatTime = value => (value ? String(value).replace('T', ' ').slice(0, 16) : '-')
const formatSize = size => {
  const num = Number(size || 0)
  if (num >= 1024 * 1024) return `${(num / 1024 / 1024).toFixed(2)} MB`
  if (num >= 1024) return `${(num / 1024).toFixed(1)} KB`
  return `${num} B`
}

const open = item => {
  const url = assetUrl(item)
  if (!url) return emit('toast', '图片地址为空')
  window.open(url, '_blank', 'noopener,noreferrer')
}

const load = async () => {
  loading.value = true
  try {
    const [assets, setting] = await Promise.all([
      api.getImageAssets(filters.value),
      api.getUploadSettings().catch(() => uploadSetting.value),
    ])
    list.value = assets
    uploadSetting.value = setting
  } catch (error) {
    emit('toast', error.message || '图片资源读取失败')
  } finally {
    loading.value = false
  }
}

const saveUploadSetting = async () => {
  savingSetting.value = true
  try {
    uploadSetting.value = await api.saveUploadSettings({ max_image_mb: Number(uploadSetting.value.max_image_mb || 8) })
    emit('toast', `图片上传限制已更新为 ${uploadSetting.value.max_image_mb}MB`)
  } catch (error) {
    emit('toast', error.message || '上传限制保存失败')
  } finally {
    savingSetting.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.asset-preview {
  width: 70px;
  height: 54px;
  padding: 0;
  overflow: hidden;
  border: 1px solid #e1ebe7;
  border-radius: 12px;
  background: #edf5f2;
  cursor: pointer;
}

.asset-preview img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}
</style>
