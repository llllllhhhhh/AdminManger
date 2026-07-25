<template>
  <div class="pagination-bar">
    <div class="pagination-info">
      共 <b>{{ total }}</b> 条，每页
      <select :value="pageSize" @change="changePageSize">
        <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }}</option>
      </select>
      条
    </div>
    <div class="pagination-actions">
      <button :disabled="safePage <= 1" @click="emitPage(1)">首页</button>
      <button :disabled="safePage <= 1" @click="emitPage(safePage - 1)">上一页</button>
      <span>第 <b>{{ safePage }}</b> / {{ totalPages }} 页</span>
      <button :disabled="safePage >= totalPages" @click="emitPage(safePage + 1)">下一页</button>
      <button :disabled="safePage >= totalPages" @click="emitPage(totalPages)">末页</button>
      <label class="jump-control">
        跳转到
        <input v-model.number="jumpPage" type="number" min="1" :max="totalPages" @keyup.enter="jumpToPage">
        页
        <button type="button" @click="jumpToPage">确定</button>
      </label>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  total: { type: Number, default: 0 },
  page: { type: Number, default: 1 },
  pageSize: { type: Number, default: 10 },
  pageSizeOptions: { type: Array, default: () => [10, 20, 50, 100] },
})

const emit = defineEmits(['update:page', 'update:pageSize'])
const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))
const safePage = computed(() => Math.min(Math.max(1, props.page), totalPages.value))
const jumpPage = ref(safePage.value)

watch(safePage, value => {
  jumpPage.value = value
})

const emitPage = page => {
  emit('update:page', Math.min(Math.max(1, page), totalPages.value))
}

const changePageSize = event => {
  emit('update:pageSize', Number(event.target.value))
  emit('update:page', 1)
}

const jumpToPage = () => {
  const page = Number(jumpPage.value || 1)
  emitPage(page)
}
</script>

<style scoped>
.pagination-bar {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  padding: 14px 16px;
  border-top: 1px solid #edf1ef;
  background: #fbfdfc;
  color: #526761;
  font-size: 13px;
}

.pagination-info,
.pagination-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.pagination-info b,
.pagination-actions b {
  color: #173f38;
}

.pagination-info select {
  height: 30px;
  border: 1px solid #dce5e2;
  border-radius: 9px;
  background: #fff;
  color: #173f38;
  padding: 0 8px;
  outline: none;
}

.pagination-actions button {
  border: 1px solid #dce5e2;
  border-radius: 10px;
  background: #fff;
  color: #173f38;
  padding: 7px 10px;
  font-weight: 800;
  cursor: pointer;
}

.pagination-actions button:disabled {
  opacity: .45;
  cursor: not-allowed;
}

.jump-control {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: 6px;
  color: #657873;
}

.jump-control input {
  width: 66px;
  height: 30px;
  border: 1px solid #dce5e2;
  border-radius: 9px;
  background: #fff;
  color: #173f38;
  padding: 0 8px;
  outline: none;
}

.jump-control button {
  padding: 6px 10px;
}

@media (max-width: 720px) {
  .pagination-bar {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
