<template>
  <div class="phone-shell" :style="themeVars">
    <div class="phone-notch"><span></span></div>
    <div class="phone-screen">
      <div class="mini-status"><span>9:41</span><span>▮▮▮ ◉</span></div>
      <div class="mini-header"><div class="mini-logo">{{ config.brand.logoText }}</div><b>{{ config.brand.name }}</b><div class="mini-actions">● ···</div></div>
      <div class="mini-scroll" :class="{'canvas-dragging':dragging}" :style="{background:config.brand.background}" @dragover.prevent="dragging=true;dropTarget='end'" @dragleave.self="dropTarget=''" @drop.prevent="dropAt($event,null)">
        <template v-for="block in visibleBlocks" :key="block.id">
          <div class="pv-block-wrap" :class="{'drop-target':dropTarget===block.id,'is-dragging':dragId===block.id}" draggable="true" @dragstart.stop="startBlockDrag($event,block)" @dragend="endDrag" @dragover.stop.prevent="dragging=true;dropTarget=block.id" @drop.stop.prevent="dropAt($event,block.id)" @click="$emit('select',block.id)">
            <div class="pv-drag-handle">⠿</div>
            <div v-if="dropTarget===block.id" class="pv-drop-label">{{dragId?'松开后交换位置':'松开插入到这里'}}</div>
            <div v-if="block.type==='banner'" class="pv-banner" :style="bgImage(block)"><div class="pv-overlay"><span class="pv-badge">{{ block.badge }}</span><h3>{{ block.title }}</h3><p>{{ block.subtitle }}</p></div></div>
            <div v-else-if="block.type==='activity'" class="pv-activity pv-section" :class="{dark:isDark(block.background)}" :style="{background:block.background}"><div class="pv-row"><div><b>{{ block.title }}</b><p>{{ block.subtitle }}</p></div><button>{{ block.button || '查看权益' }}</button></div><div class="pv-progress"><i :style="{width:(block.progress||0)+'%'}"></i></div></div>
            <div v-else-if="block.type==='grid'" class="pv-section"><h4>{{ block.title }}</h4><div class="pv-grid" :style="{gridTemplateColumns:`repeat(${block.columns||3},1fr)`}"><div v-for="(item,i) in block.items" :key="item"><span>{{ icons[i%icons.length] }}</span><small>{{ item }}</small></div></div></div>
            <div v-else-if="block.type==='study'" class="pv-section"><h4>{{ block.title }} 🔥</h4><p>{{ block.subtitle }}</p><div class="pv-progress"><i :style="{width:(block.progress||0)+'%'}"></i></div><div class="pv-task"><span>✓ 英语真题训练</span><em>已完成</em></div><div class="pv-task"><span>○ 专业课复习</span><em>去完成 ›</em></div></div>
            <div v-else-if="block.type==='smart'" class="pv-smart pv-section" :style="{background:block.background}"><span>✦</span><div><small>AI 智能匹配</small><h4>{{block.title}}</h4><p>{{block.subtitle}}</p></div><b>→</b></div>
            <div v-else-if="block.type==='routes'" class="pv-section"><div class="pv-row"><h4>{{block.title}}</h4><small>{{block.subtitle}}</small></div><div class="pv-routes"><div v-for="route in config.routes.filter(r=>r.status).slice(0,2)" :key="route.id"><img :src="route.image"/><b>{{route.name}}</b><small>{{route.days}} · {{route.price}} 积分</small></div><small v-if="!config.routes.some(r=>r.status)">暂无上架路线</small></div></div>
            <div v-else-if="block.type==='video'" class="pv-section"><h4>{{block.title}}</h4><div class="pv-video" :style="bgImage(block)"><i>▶</i><b>{{block.subtitle}}</b></div></div>
            <div v-else class="pv-notice pv-section"><b>{{block.title}}</b><p>{{block.subtitle}}</p></div>
          </div>
        </template>
        <div v-if="!visibleBlocks.length" class="pv-empty">拖动左侧组件到这里<br/>开始装修页面</div>
        <div class="pv-drop-end" :class="{active:dropTarget==='end'}">＋ 放置到页面底部</div>
      </div>
      <div class="mini-tabs"><span class="on">⌂<small>首页</small></span><span>✎<small>题库</small></span><span>▤<small>资料</small></span><span>⌁<small>旅行</small></span><span>●<small>我的</small></span></div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
const props=defineProps({config:Object,page:Object})
const emit=defineEmits(['select','drop-block'])
const icons=['✎','▤','⌁','◆','●','♛'];const dragging=ref(false),dropTarget=ref(''),dragId=ref('')
const visibleBlocks=computed(()=>props.page?.blocks?.filter(b=>b.visible) || [])
const themeVars=computed(()=>({'--primary':props.config.brand.primary,'--secondary':props.config.brand.secondary,'--dark':props.config.brand.dark}))
const bgImage=b=>({backgroundImage:`linear-gradient(90deg,rgba(9,35,31,.76),rgba(9,35,31,.06)),url('${b.image||''}')`,backgroundColor:b.background||'#123d37'})
const isDark=color=>['#153e38','#172c2a','#132f2b'].includes(color)
const startBlockDrag=(event,block)=>{dragging.value=true;dragId.value=block.id;emit('select',block.id);event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',JSON.stringify({kind:'block',id:block.id}))}
const dropAt=(event,targetId)=>{let data;try{data=JSON.parse(event.dataTransfer.getData('text/plain'))}catch{return endDrag()}emit('drop-block',{...data,targetId});endDrag()}
const endDrag=()=>{dragging.value=false;dropTarget.value='';dragId.value=''}
</script>
