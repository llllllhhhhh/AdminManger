<template>
  <section class="page-content slider-settings-page">
    <div class="page-hero compact">
      <div>
        <span>登录安全</span>
        <h1>滑块验证配置</h1>
        <p>统一控制用户端、平台端、商户端登录前的滑块验证内容、背景图和校验参数。</p>
      </div>
      <button class="primary-btn" @click="save" :disabled="saving">{{ saving ? '保存中...' : '保存配置' }}</button>
    </div>

    <div class="settings-grid">
      <form class="settings-panel" @submit.prevent="save">
        <div class="panel-title">
          <div>
            <b>基础设置</b>
            <span>登录点击后弹出滑块，验证通过后才提交登录。</span>
          </div>
          <label class="switch">
            <input v-model="form.enabled" type="checkbox">
            <span>{{ form.enabled ? '已启用' : '已停用' }}</span>
          </label>
        </div>

        <div class="field-grid">
          <label>标题<input v-model.trim="form.title" maxlength="80"></label>
          <label>说明<input v-model.trim="form.description" maxlength="160"></label>
          <label>容错像素<input v-model.number="form.tolerance" type="number" min="2" max="20"></label>
          <label>挑战有效期（秒）<input v-model.number="form.expires_seconds" type="number" min="30" max="300"></label>
        </div>

        <div class="shape-section">
          <div class="section-head">
            <div>
              <b>滑块形状</b>
              <span>登录端会按这里的形状展示缺口和拖动块。</span>
            </div>
          </div>
          <div class="shape-options">
            <button
              v-for="item in shapeOptions"
              :key="item.value"
              type="button"
              :class="{ active: form.shape === item.value }"
              @click="form.shape = item.value"
            >
              <i :class="['shape-icon', item.value]"></i>
              {{ item.label }}
            </button>
          </div>
        </div>

        <div class="image-section">
          <div class="section-head">
            <div>
              <b>背景图库</b>
              <span>可添加多张图片，系统每次登录随机抽取一张已启用图片。</span>
            </div>
            <button type="button" class="ghost-btn" @click="addImage">添加图片</button>
          </div>

          <div class="image-table">
            <div class="image-row image-row-head">
              <span>预览</span>
              <span>名称</span>
              <span>图片 URL</span>
              <span>启用</span>
              <span>操作</span>
            </div>
            <div v-for="(item, index) in form.images" :key="index" class="image-row">
              <div class="thumb"><img v-if="item.url" :src="item.url" alt=""></div>
              <input v-model.trim="item.name" maxlength="60" placeholder="例如：雪山背景">
              <input v-model.trim="item.url" maxlength="500" placeholder="https://...">
              <label class="mini-switch"><input v-model="item.enabled" type="checkbox"><span></span></label>
              <button type="button" class="danger-link" @click="removeImage(index)" :disabled="form.images.length <= 1">删除</button>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" @click="load">重新加载</button>
          <button class="primary-btn" type="submit" :disabled="saving">保存配置</button>
        </div>
      </form>

      <aside class="preview-panel">
        <div class="preview-head">
          <b>前端预览</b>
          <span>{{ shapeLabel }}</span>
        </div>
        <div class="preview-scene">
          <img :src="previewImage" alt="">
          <i :class="['preview-hole', form.shape]"></i>
        </div>
        <b>{{ form.title }}</b>
        <p>{{ form.description }}</p>
        <small>至少保留一张可用背景图；如果全部关闭，保存时会自动启用第一张。</small>
      </aside>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { api } from '../services/api'

const emit = defineEmits(['toast'])
const saving = ref(false)
const shapeOptions = [
  { label: '圆角方块', value: 'rounded' },
  { label: '圆形', value: 'circle' },
  { label: '直角方块', value: 'square' },
  { label: '拼图块', value: 'puzzle' },
]
const defaultImage = 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=900&auto=format&fit=crop'
const form = reactive({
  enabled: true,
  title: '拖动滑块完成验证',
  description: '请按住滑块，将缺口拼合后再登录。',
  image: defaultImage,
  images: [{ name: '默认山景', url: defaultImage, enabled: true }],
  shape: 'rounded',
  tolerance: 6,
  expires_seconds: 120,
})

const previewImage = computed(() => {
  const enabled = form.images.find(item => item.enabled && item.url)
  return enabled?.url || form.images.find(item => item.url)?.url || form.image || defaultImage
})
const shapeLabel = computed(() => shapeOptions.find(item => item.value === form.shape)?.label || '圆角方块')

const normalizeLocalForm = () => {
  if (!Array.isArray(form.images) || !form.images.length) {
    form.images = [{ name: '默认背景', url: form.image || defaultImage, enabled: true }]
  }
  form.images = form.images
    .filter(item => item && (item.url || item.name))
    .map((item, index) => ({
      name: (item.name || `背景图 ${index + 1}`).slice(0, 60),
      url: (item.url || '').slice(0, 500),
      enabled: item.enabled !== false,
    }))
  if (!form.images.length) form.images = [{ name: '默认背景', url: form.image || defaultImage, enabled: true }]
  if (!form.images.some(item => item.enabled)) form.images[0].enabled = true
  form.image = previewImage.value
  if (!shapeOptions.some(item => item.value === form.shape)) form.shape = 'rounded'
}

const addImage = () => {
  form.images.push({ name: `背景图 ${form.images.length + 1}`, url: '', enabled: true })
}

const removeImage = index => {
  if (form.images.length <= 1) return
  form.images.splice(index, 1)
  normalizeLocalForm()
}

const load = async () => {
  try {
    const result = await api.getSliderCaptchaSettings()
    Object.assign(form, result)
    normalizeLocalForm()
  } catch (error) {
    emit('toast', error.message || '滑块配置加载失败')
  }
}

const save = async () => {
  saving.value = true
  try {
    normalizeLocalForm()
    const result = await api.saveSliderCaptchaSettings({
      enabled: form.enabled,
      title: form.title,
      description: form.description,
      image: form.image,
      images: form.images,
      shape: form.shape,
      tolerance: form.tolerance,
      expires_seconds: form.expires_seconds,
    })
    Object.assign(form, result)
    normalizeLocalForm()
    emit('toast', '滑块配置已保存')
  } catch (error) {
    emit('toast', error.message || '保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.slider-settings-page{padding:28px;background:#f6f8fb}
.settings-grid{display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:22px;align-items:start}
.settings-panel,.preview-panel{border:1px solid #dbe4ee;border-radius:18px;background:#fff;box-shadow:0 18px 42px rgba(15,23,42,.09)}
.settings-panel{padding:22px;display:grid;gap:22px}
.panel-title,.section-head,.preview-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}
.panel-title b,.section-head b,.preview-head b{display:block;color:#172033;font-size:16px}
.panel-title span,.section-head span,.preview-head span{display:block;margin-top:4px;color:#728096;font-size:12px;line-height:1.5}
.switch{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:800;color:#0f766e}
.switch input{width:18px;height:18px}
.field-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.field-grid label{display:grid;gap:8px;color:#475569;font-size:13px;font-weight:800}
.field-grid input{border:1px solid #d7e0ea;border-radius:12px;padding:11px 12px;font:inherit;color:#172033;background:#f8fafc}
.shape-section,.image-section{display:grid;gap:12px}
.shape-options{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
.shape-options button{height:72px;border:1px solid #dce5ef;border-radius:14px;background:#f8fafc;color:#334155;font-weight:800;display:grid;place-items:center;gap:6px;cursor:pointer}
.shape-options button.active{border-color:#2563eb;background:#eff6ff;color:#1d4ed8;box-shadow:0 8px 20px rgba(37,99,235,.12)}
.shape-icon{width:24px;height:24px;background:#172033;display:block}
.shape-icon.rounded{border-radius:7px}.shape-icon.circle{border-radius:50%}.shape-icon.square{border-radius:1px}
.shape-icon.puzzle{border-radius:6px;clip-path:polygon(0 0,62% 0,62% 24%,100% 24%,100% 76%,62% 76%,62% 100%,0 100%)}
.ghost-btn{border:1px solid #d7e0ea;border-radius:12px;padding:9px 13px;background:#fff;color:#2563eb;font-weight:900}
.image-table{border:1px solid #e2e8f0;border-radius:14px;overflow:hidden}
.image-row{display:grid;grid-template-columns:74px 150px minmax(220px,1fr) 72px 72px;gap:10px;align-items:center;padding:10px 12px;border-top:1px solid #edf2f7;background:#fff}
.image-row:first-child{border-top:0}
.image-row-head{background:#f8fafc;color:#64748b;font-size:12px;font-weight:900}
.image-row input{min-width:0;border:1px solid #d7e0ea;border-radius:10px;padding:9px 10px;color:#172033;background:#fff}
.thumb{width:58px;height:40px;border-radius:8px;background:#eef3f7;overflow:hidden;border:1px solid #e2e8f0}
.thumb img{width:100%;height:100%;object-fit:cover;display:block}
.mini-switch{display:flex;align-items:center;justify-content:center}
.mini-switch input{width:18px;height:18px}
.danger-link{border:0;background:transparent;color:#ef4444;font-weight:900;cursor:pointer}
.danger-link:disabled{color:#cbd5e1;cursor:not-allowed}
.form-actions{display:flex;justify-content:flex-end;gap:10px}
.form-actions button{border:1px solid #d7e0ea;border-radius:12px;padding:10px 16px;background:#fff;font-weight:800;color:#334155}
.preview-panel{padding:18px;display:grid;gap:12px;position:sticky;top:22px}
.preview-scene{position:relative;height:170px;border-radius:14px;overflow:hidden;background:#eef3f7}
.preview-scene img{width:100%;height:100%;object-fit:cover}
.preview-hole{position:absolute;left:56%;top:40%;width:44px;height:44px;background:rgba(0,0,0,.32);box-shadow:inset 0 0 0 2px rgba(255,255,255,.6)}
.preview-hole.rounded{border-radius:9px}.preview-hole.circle{border-radius:50%}.preview-hole.square{border-radius:1px}
.preview-hole.puzzle{border-radius:8px;clip-path:polygon(0 0,62% 0,62% 24%,100% 24%,100% 76%,62% 76%,62% 100%,0 100%)}
.preview-panel>b{font-size:16px;color:#172033}.preview-panel p{margin:0;color:#64748b;line-height:1.6}.preview-panel small{color:#94a3b8;line-height:1.5}
@media (max-width: 1100px){.settings-grid{grid-template-columns:1fr}.preview-panel{position:static}.image-row{grid-template-columns:62px 120px minmax(160px,1fr) 60px 60px}}
@media (max-width: 760px){.slider-settings-page{padding:16px}.field-grid,.shape-options{grid-template-columns:1fr}.image-row,.image-row-head{grid-template-columns:1fr}.image-row-head{display:none}.thumb{width:100%;height:120px}}
</style>
