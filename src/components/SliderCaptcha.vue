<template>
  <div v-if="captcha.enabled" class="slider-captcha">
    <div class="captcha-head">
      <div>
        <b>{{ captcha.title }}</b>
        <span>{{ captcha.description }}</span>
      </div>
      <button type="button" @click="loadChallenge">刷新</button>
    </div>
    <div class="captcha-scene">
      <img :src="captcha.image" alt="">
      <i :class="['captcha-hole', captcha.shape]" :style="holeStyle"></i>
      <i :class="['captcha-piece', captcha.shape, { ok: verified }]" :style="pieceStyle"></i>
    </div>
    <div
      class="captcha-track"
      @mousedown="startDrag"
      @mousemove.prevent="moveDrag"
      @mouseup="endDrag"
      @mouseleave="endDrag"
      @touchstart="startDrag"
      @touchmove.prevent="moveDrag"
      @touchend="endDrag"
    >
      <i class="captcha-progress" :class="{ ok: verified }" :style="{ width: `${dragX + 48}px` }"></i>
      <i class="captcha-knob" :class="{ ok: verified }" :style="{ transform: `translateX(${dragX}px)` }">{{ verified ? '✓' : '›' }}</i>
      <span>{{ verified ? '验证通过' : '向右拖动滑块' }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { api } from '../services/api'

const props = defineProps({
  scope: { type: String, default: 'admin' },
})
const emit = defineEmits(['verified', 'reset', 'toast'])

const captcha = reactive({
  enabled: true,
  challenge_id: '',
  title: '拖动滑块完成验证',
  description: '请按住滑块，将缺口拼合后再登录。',
  image: '',
  shape: 'rounded',
  target_x: 160,
  piece_y: 60,
  piece_size: 42,
})
const dragX = ref(0)
const verified = ref(false)
const dragging = ref(false)
const startClientX = ref(0)
const startDragX = ref(0)
const maxDrag = 272

const holeStyle = computed(() => ({
  left: `${captcha.target_x}px`,
  top: `${captcha.piece_y}px`,
  width: `${captcha.piece_size}px`,
  height: `${captcha.piece_size}px`,
}))
const pieceStyle = computed(() => ({
  transform: `translateX(${dragX.value}px)`,
  top: `${captcha.piece_y}px`,
  width: `${captcha.piece_size}px`,
  height: `${captcha.piece_size}px`,
  backgroundImage: `url(${captcha.image})`,
  backgroundPosition: `-${captcha.target_x}px -${captcha.piece_y}px`,
}))

const clientX = event => event.touches?.[0]?.clientX ?? event.changedTouches?.[0]?.clientX ?? event.clientX ?? 0

const resetState = () => {
  dragX.value = 0
  verified.value = false
  dragging.value = false
  emit('reset')
}

const loadChallenge = async () => {
  resetState()
  captcha.challenge_id = ''
  captcha.image = ''
  try {
    const result = await api.getSliderCaptcha()
    Object.assign(captcha, result)
    if (!result.enabled) emit('verified', '__slider_disabled__')
  } catch (error) {
    emit('toast', error.message || '滑块验证加载失败')
  }
}

const startDrag = event => {
  if (verified.value || !captcha.challenge_id) return
  dragging.value = true
  startClientX.value = clientX(event)
  startDragX.value = dragX.value
}

const moveDrag = event => {
  if (!dragging.value || verified.value) return
  dragX.value = Math.max(0, Math.min(maxDrag, Math.round(startDragX.value + clientX(event) - startClientX.value)))
}

const endDrag = async () => {
  if (!dragging.value || verified.value) return
  dragging.value = false
  try {
    const result = await api.verifySliderCaptcha({
      challenge_id: captcha.challenge_id,
      x: dragX.value,
      scope: props.scope,
    })
    verified.value = true
    emit('verified', result.ticket || '')
    emit('toast', '滑块验证通过')
  } catch (error) {
    emit('toast', error.message || '滑块验证失败')
    await loadChallenge()
  }
}

onMounted(loadChallenge)
defineExpose({ loadChallenge, resetState })
</script>

<style scoped>
.slider-captcha{padding:14px;border:1px solid #dfe7ee;border-radius:14px;background:#fff}
.captcha-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:12px}
.captcha-head b,.captcha-head span{display:block}.captcha-head b{font-size:14px;color:#172033}.captcha-head span{margin-top:3px;color:#788397;font-size:12px}
.captcha-head button{border:0;background:#edf5ff;color:#2563eb;border-radius:999px;padding:6px 10px;font-weight:700}
.captcha-scene{position:relative;width:320px;height:150px;max-width:100%;overflow:hidden;border-radius:10px;background:#eef3f7}
.captcha-scene img{width:320px;height:150px;object-fit:cover;display:block}
.captcha-hole{position:absolute;border-radius:8px;background:rgba(0,0,0,.32);box-shadow:inset 0 0 0 2px rgba(255,255,255,.58)}
.captcha-piece{position:absolute;left:0;border-radius:8px;background-size:320px 150px;box-shadow:0 8px 18px rgba(15,23,42,.22);border:1px solid rgba(255,255,255,.8)}
.captcha-hole.circle,.captcha-piece.circle{border-radius:50%}
.captcha-hole.square,.captcha-piece.square{border-radius:1px}
.captcha-hole.puzzle,.captcha-piece.puzzle{border-radius:8px;clip-path:polygon(0 0,62% 0,62% 24%,100% 24%,100% 76%,62% 76%,62% 100%,0 100%)}
.captcha-piece.ok{box-shadow:0 0 0 3px rgba(16,185,129,.28)}
.captcha-track{position:relative;width:320px;max-width:100%;height:48px;margin-top:12px;border-radius:999px;background:#eef3f7;overflow:hidden;display:flex;align-items:center;justify-content:center;color:#64748b;font-size:13px;font-weight:700;user-select:none}
.captcha-progress{position:absolute;left:0;top:0;height:100%;background:#dbeafe}
.captcha-progress.ok{background:#bbf7d0}
.captcha-knob{position:absolute;left:0;top:0;width:48px;height:48px;border-radius:50%;background:#172033;color:#fff;display:grid;place-items:center;font-style:normal;font-size:28px;font-weight:900;z-index:2;box-shadow:0 6px 16px rgba(15,23,42,.18)}
.captcha-knob.ok{background:#059669}
.captcha-track span{position:relative;z-index:1}
</style>
