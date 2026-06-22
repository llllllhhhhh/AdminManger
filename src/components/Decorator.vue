<template>
  <div class="decorator">
    <section class="component-panel panel">
      <div class="panel-heading"><div><b>组件库</b><small>拖动组件到手机画布</small></div><span class="drag-ready">可拖拽</span></div>
      <div class="component-list"><button v-for="c in componentCatalog" :key="c.type" draggable="true" @dragstart="catalogDragStart($event,c)" @dragend="draggingType=''" @click="add(c)"><i>{{c.icon}}</i><span><b>{{c.name}}</b><small>{{c.desc}}</small></span><em>⠿</em></button></div>
      <div class="panel-tip"><b>拖拽装修提示</b><p>将组件拖入手机任意位置；手机内模块和左侧图层都可以按住拖动重新排序。</p></div>
    </section>

    <main class="canvas-panel">
      <div class="canvas-toolbar">
        <div class="page-picker"><small>正在装修</small><select v-model="pageId"><option v-for="p in config.pages" :key="p.id" :value="p.id">{{p.name}}</option></select><span>{{currentPage.path}}</span></div>
        <div class="device-switch"><button class="active">手机预览</button><button @click="$emit('toast','平板预览即将上线')">平板</button></div>
      </div>
      <div class="canvas-area">
        <div class="block-rail"><div class="rail-caption">页面图层 · 拖到模块上交换</div><div v-for="(b,i) in currentPage.blocks" :key="b.id" class="rail-item" :class="{active:b.id===selectedId,muted:!b.visible,'drop-before':railDropIndex===i}" draggable="true" @dragstart="blockDragStart($event,b)" @dragover.prevent="railDropIndex=i" @drop.stop.prevent="railDrop($event,b.id)" @dragend="endDrag" @click="selectedId=b.id"><span>⠿</span><b>{{b.name}}</b><small>{{railDropIndex===i&&draggingType==='block'?'交换':i+1}}</small></div><div class="rail-drop-end" :class="{active:railDropIndex===currentPage.blocks.length}" @dragover.prevent="railDropIndex=currentPage.blocks.length" @drop.prevent="railDrop($event,null)">拖到此处置于底部</div></div>
        <PhonePreview :config="config" :page="currentPage" @select="selectedId=$event" @drop-block="handleDrop"/>
      </div>
    </main>

    <section class="property-panel panel">
      <template v-if="selected">
        <div class="panel-heading"><div><b>组件设置</b><small>{{selected.name}}</small></div><label class="toggle"><input type="checkbox" v-model="selected.visible"><i></i></label></div>
        <div class="property-scroll">
          <div class="field"><label>组件名称</label><input v-model="selected.name"/></div>
          <div class="field" v-if="has('title')"><label>主标题</label><input v-model="selected.title"/></div>
          <div class="field" v-if="has('subtitle')"><label>副标题 / 说明</label><textarea v-model="selected.subtitle"></textarea></div>
          <div class="field" v-if="has('badge')"><label>角标文字</label><input v-model="selected.badge"/></div>
          <div class="field" v-if="has('button')"><label>按钮文案</label><input v-model="selected.button"/></div>
          <div class="field" v-if="has('image')"><label>图片地址</label><input v-model="selected.image"/><div class="image-preview" :style="{backgroundImage:`url('${selected.image}')`}"><button @click="selected.image=''">移除图片</button></div></div>
          <div class="field" v-if="has('progress')"><label>进度值 <b>{{selected.progress}}%</b></label><input type="range" min="0" max="100" v-model.number="selected.progress"/></div>
          <div class="field" v-if="has('background')"><label>背景色</label><div class="color-field"><input type="color" v-model="selected.background"><input v-model="selected.background"/></div></div>
          <div class="field" v-if="selected.items"><label>入口项目</label><div class="array-item" v-for="(_,i) in selected.items" :key="i"><input v-model="selected.items[i]"><button @click="selected.items.splice(i,1)">×</button></div><button class="dash-btn" @click="selected.items.push('新入口')">＋ 添加入口</button></div>
          <div class="field" v-if="has('columns')"><label>每行列数</label><div class="segmented"><button v-for="n in [2,3,4]" :class="{active:selected.columns===n}" @click="selected.columns=n">{{n}} 列</button></div></div>
        </div>
        <div class="property-actions"><button @click="move(-1)" :disabled="index===0">↑ 上移</button><button @click="move(1)" :disabled="index===currentPage.blocks.length-1">↓ 下移</button><button class="danger" @click="remove">删除</button></div>
      </template>
      <div v-else class="no-selection"><i>⌁</i><b>选择一个组件</b><p>在手机预览或左侧图层中点击组件，即可编辑内容与样式。</p></div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import PhonePreview from './PhonePreview.vue'
import { componentCatalog } from '../data/defaultConfig'
const props=defineProps({config:Object,activePage:String})
const emit=defineEmits(['toast','dirty','page-change'])
const pageId=ref(props.activePage || props.config.pages[0].id)
const selectedId=ref(props.config.pages[0].blocks[0]?.id)
const draggingType=ref('')
const railDropIndex=ref(-1)
const currentPage=computed(()=>props.config.pages.find(p=>p.id===pageId.value) || props.config.pages[0])
const selected=computed(()=>currentPage.value.blocks.find(b=>b.id===selectedId.value))
const index=computed(()=>currentPage.value.blocks.findIndex(b=>b.id===selectedId.value))
watch(pageId,()=>{selectedId.value=currentPage.value.blocks[0]?.id;emit('page-change',pageId.value)})
watch(()=>props.config,{deep:true,handler:()=>emit('dirty')})
const has=k=>selected.value && Object.prototype.hasOwnProperty.call(selected.value,k)
const add=(c,position=currentPage.value.blocks.length)=>{const defaults={id:`${c.type}_${Date.now()}_${Math.floor(Math.random()*1000)}`,type:c.type,name:c.name,visible:true,title:c.name,subtitle:c.desc};if(c.type==='banner')Object.assign(defaults,{badge:'精选推荐',image:'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200',background:'#153e38'});if(c.type==='activity')Object.assign(defaults,{button:'立即查看',progress:50,background:'#fff5e9'});if(c.type==='grid')Object.assign(defaults,{items:['入口一','入口二','入口三'],columns:3});if(c.type==='study')Object.assign(defaults,{progress:60});if(c.type==='smart')Object.assign(defaults,{button:'开始定制',background:'#dff5ef'});if(c.type==='video')Object.assign(defaults,{image:'https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=900'});currentPage.value.blocks.splice(position,0,defaults);selectedId.value=defaults.id;emit('toast',`${c.name}已放入画布`)}
const setDragData=(event,data)=>{event.dataTransfer.effectAllowed=data.kind==='catalog'?'copy':'move';event.dataTransfer.setData('text/plain',JSON.stringify(data))}
const readDragData=event=>{try{return JSON.parse(event.dataTransfer.getData('text/plain'))}catch{return null}}
const catalogDragStart=(event,c)=>{draggingType.value=c.type;setDragData(event,{kind:'catalog',type:c.type})}
const blockDragStart=(event,b)=>{draggingType.value='block';selectedId.value=b.id;setDragData(event,{kind:'block',id:b.id})}
const reorder=(sourceId,targetId)=>{const blocks=currentPage.value.blocks;const from=blocks.findIndex(b=>b.id===sourceId);if(from<0)return;if(!targetId){const [item]=blocks.splice(from,1);blocks.push(item);selectedId.value=item.id;return}const to=blocks.findIndex(b=>b.id===targetId);if(to<0||to===from)return;[blocks[from],blocks[to]]=[blocks[to],blocks[from]];selectedId.value=sourceId;emit('toast','两个组件已交换位置')}
const handleDrop=data=>{if(!data)return;const targetIndex=data.targetId?currentPage.value.blocks.findIndex(b=>b.id===data.targetId):currentPage.value.blocks.length;if(data.kind==='catalog'){const c=componentCatalog.find(x=>x.type===data.type);if(c)add(c,targetIndex)}else if(data.kind==='block')reorder(data.id,data.targetId);endDrag()}
const railDrop=(event,targetId)=>{handleDrop({...readDragData(event),targetId})}
const endDrag=()=>{draggingType.value='';railDropIndex.value=-1}
const move=d=>{const i=index.value,j=i+d;if(i<0||j<0||j>=currentPage.value.blocks.length)return;const [b]=currentPage.value.blocks.splice(i,1);currentPage.value.blocks.splice(j,0,b)}
const remove=()=>{if(!selected.value)return;currentPage.value.blocks.splice(index.value,1);selectedId.value=currentPage.value.blocks[Math.max(0,index.value-1)]?.id;emit('toast','组件已删除')}
</script>
