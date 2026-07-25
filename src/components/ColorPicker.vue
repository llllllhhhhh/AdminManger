<template>
  <div ref="pickerRef" class="x-color-picker">
    <button ref="triggerRef" type="button" class="x-color-trigger" @click="toggle">
      <i :style="{ background: previewColor }"></i>
      <span>{{ displayValue }}</span>
    </button>
    <Teleport to="body">
      <div v-if="open" ref="popRef" class="x-color-pop" :style="popStyle">
        <div class="x-color-swatches">
          <button
            v-for="item in swatches"
            :key="item"
            type="button"
            :style="{ background: item }"
            :class="{ light: item === '#ffffff' }"
            @click="setFromHex(item)"
          ></button>
        </div>

        <div class="x-color-main">
          <div
            class="x-color-board"
            :style="{ backgroundColor: hueColor }"
            @mousedown.prevent="startBoardPick"
          >
            <span :style="{ left: saturation + '%', top: (100 - value) + '%' }"></span>
          </div>
          <div class="x-hue-wrap">
            <input class="x-hue" type="range" min="0" max="360" v-model.number="hue" @input="syncFromHsv" />
            <i :style="{ background: previewColor }"></i>
          </div>
        </div>

        <div class="x-color-hex">
          <span>Hex:</span>
          <input v-model="hexInput" @change="setFromHex(hexInput)" />
          <i :style="{ background: previewColor }"></i>
        </div>

        <div class="x-rgba-row" v-for="row in rgbaRows" :key="row.key">
          <span>{{ row.label }}:</span>
          <input class="mini" type="number" :min="row.min" :max="row.max" :step="row.step" v-model.number="rgba[row.key]" @input="syncFromRgba" />
          <input type="range" :min="row.min" :max="row.max" :step="row.step" v-model.number="rgba[row.key]" @input="syncFromRgba" />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '#ff7a35' },
})
const emit = defineEmits(['update:modelValue'])

const open = ref(false)
const pickerRef = ref(null)
const triggerRef = ref(null)
const popRef = ref(null)
const popStyle = ref({})
const hue = ref(12)
const saturation = ref(78)
const value = ref(96)
const hexInput = ref('#ff7a35')
const rgba = reactive({ r: 255, g: 122, b: 53, a: 1 })
const swatches = ['#ffffff', '#fff84a', '#3434f2', '#f2a031', '#72ef48', '#f04425', '#000000', '#6b6f70']
const rgbaRows = [
  { key: 'r', label: 'R', min: 0, max: 255, step: 1 },
  { key: 'g', label: 'G', min: 0, max: 255, step: 1 },
  { key: 'b', label: 'B', min: 0, max: 255, step: 1 },
  { key: 'a', label: 'A', min: 0, max: 1, step: 0.01 },
]

const displayValue = computed(() => props.modelValue || '#ff7a35')
const previewColor = computed(() => props.modelValue || hexInput.value || '#ff7a35')
const hueColor = computed(() => `hsl(${hue.value}, 100%, 50%)`)
const close = () => {
  open.value = false
  window.removeEventListener('resize', updatePosition)
  window.removeEventListener('scroll', updatePosition, true)
  document.removeEventListener('mousedown', handleOutside)
}
const updatePosition = () => {
  const trigger = triggerRef.value
  if (!trigger) return
  const rect = trigger.getBoundingClientRect()
  const width = 326
  const gap = 8
  const left = Math.min(Math.max(12, rect.right - width), window.innerWidth - width - 12)
  const shouldOpenUp = rect.bottom + 410 > window.innerHeight && rect.top > 410
  popStyle.value = {
    left: `${left}px`,
    top: shouldOpenUp ? 'auto' : `${rect.bottom + gap}px`,
    bottom: shouldOpenUp ? `${window.innerHeight - rect.top + gap}px` : 'auto',
  }
}
const handleOutside = event => {
  if (pickerRef.value?.contains(event.target) || popRef.value?.contains(event.target)) return
  close()
}
const toggle = async () => {
  if (open.value) {
    close()
    return
  }
  open.value = true
  await nextTick()
  updatePosition()
  window.addEventListener('resize', updatePosition)
  window.addEventListener('scroll', updatePosition, true)
  document.addEventListener('mousedown', handleOutside)
}

const clamp = (num, min, max) => Math.max(min, Math.min(max, Number(num) || 0))
const toHex = n => clamp(n, 0, 255).toString(16).padStart(2, '0')
const rgbToHex = ({ r, g, b }) => `#${toHex(r)}${toHex(g)}${toHex(b)}`
const outputColor = () => {
  const alpha = clamp(rgba.a, 0, 1)
  if (alpha < 1) return `rgba(${clamp(rgba.r, 0, 255)}, ${clamp(rgba.g, 0, 255)}, ${clamp(rgba.b, 0, 255)}, ${Number(alpha.toFixed(2))})`
  return rgbToHex(rgba)
}
const parseColor = color => {
  const raw = String(color || '').trim()
  const hex = raw.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (hex) {
    let h = hex[1]
    if (h.length === 3) h = h.split('').map(c => c + c).join('')
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: 1 }
  }
  const rgb = raw.match(/rgba?\(([^)]+)\)/i)
  if (rgb) {
    const parts = rgb[1].split(',').map(item => Number(item.trim()))
    return { r: parts[0] || 0, g: parts[1] || 0, b: parts[2] || 0, a: parts[3] ?? 1 }
  }
  return { r: 255, g: 122, b: 53, a: 1 }
}
const rgbToHsv = ({ r, g, b }) => {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  if (d) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return { h, s: max ? d / max : 0, v: max }
}
const hsvToRgb = (h, s, v) => {
  s /= 100; v /= 100
  const c = v * s
  const x = c * (1 - Math.abs((h / 60) % 2 - 1))
  const m = v - c
  let r = 0, g = 0, b = 0
  if (h < 60) [r, g, b] = [c, x, 0]
  else if (h < 120) [r, g, b] = [x, c, 0]
  else if (h < 180) [r, g, b] = [0, c, x]
  else if (h < 240) [r, g, b] = [0, x, c]
  else if (h < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) }
}
const readColor = color => {
  const parsed = parseColor(color)
  Object.assign(rgba, parsed)
  const hsv = rgbToHsv(parsed)
  hue.value = Math.round(hsv.h)
  saturation.value = Math.round(hsv.s * 100)
  value.value = Math.round(hsv.v * 100)
  hexInput.value = rgbToHex(parsed)
}
const emitColor = () => {
  hexInput.value = rgbToHex(rgba)
  emit('update:modelValue', outputColor())
}
const setFromHex = color => {
  readColor(color)
  emitColor()
}
const syncFromHsv = () => {
  Object.assign(rgba, hsvToRgb(hue.value, saturation.value, value.value))
  emitColor()
}
const syncFromRgba = () => {
  rgba.r = clamp(rgba.r, 0, 255)
  rgba.g = clamp(rgba.g, 0, 255)
  rgba.b = clamp(rgba.b, 0, 255)
  rgba.a = clamp(rgba.a, 0, 1)
  const hsv = rgbToHsv(rgba)
  hue.value = Math.round(hsv.h)
  saturation.value = Math.round(hsv.s * 100)
  value.value = Math.round(hsv.v * 100)
  emitColor()
}
const pickBoard = (event, target = event.currentTarget) => {
  const rect = target.getBoundingClientRect()
  saturation.value = clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100)
  value.value = clamp(100 - ((event.clientY - rect.top) / rect.height) * 100, 0, 100)
  syncFromHsv()
}
const startBoardPick = event => {
  const target = event.currentTarget
  pickBoard(event, target)
  const move = e => pickBoard(e, target)
  const up = () => {
    window.removeEventListener('mousemove', move)
    window.removeEventListener('mouseup', up)
  }
  window.addEventListener('mousemove', move)
  window.addEventListener('mouseup', up)
}

watch(() => props.modelValue, value => {
  readColor(value || '#ff7a35')
}, { immediate: true })

onBeforeUnmount(close)
</script>
