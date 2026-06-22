<template>
  <div class="page-content preference-page">
    <div class="content-title">
      <div><h1>用户偏好洞察</h1><p>根据浏览、学习点击、收藏和上岸心愿，识别用户真正感兴趣的内容</p></div>
      <button class="outline-btn refresh-btn" @click="load">↻ 刷新数据</button>
    </div>

    <div class="preference-stats">
      <article><i class="orange">人</i><div><small>已识别用户</small><b>{{data.summary.users}}</b><span>产生有效行为的用户</span></div></article>
      <article><i class="green">旅</i><div><small>旅行兴趣热度</small><b>{{data.summary.route_score}}</b><span>浏览 / 收藏 / 上岸心愿</span></div></article>
      <article><i class="blue">学</i><div><small>学习兴趣热度</small><b>{{data.summary.study_score}}</b><span>刷题 / 资料 / 学习方向</span></div></article>
      <article><i class="purple">迹</i><div><small>累计行为次数</small><b>{{data.summary.events}}</b><span>偏好数据持续实时累积</span></div></article>
    </div>

    <section class="preference-rank-card">
      <div class="rank-head"><div><h3>热门兴趣排行</h3><p>按偏好分从高到低，帮助运营安排路线与学习内容</p></div><span class="score-rule">浏览 +1　学习点击 +2　收藏 +3　上岸心愿 +5</span></div>
      <div v-if="data.rankings.length" class="interest-ranking">
        <div v-for="(item,index) in data.rankings.slice(0,6)" :key="item.type+item.name" class="interest-rank">
          <strong :class="{top:index<3}">{{index+1}}</strong>
          <div class="rank-main"><div><b>{{item.name}}</b><em :class="item.type">{{item.type==='route'?'旅行路线':'学习方向'}}</em></div><div class="rank-bar"><i :style="{width:rankWidth(item.score)+'%'}" :class="item.type"></i></div></div>
          <div class="rank-score"><b>{{item.score}}</b><small>{{item.users}} 人感兴趣</small></div>
        </div>
      </div>
      <div v-else class="preference-empty">暂无偏好数据，用户产生浏览或收藏后会自动出现</div>
    </section>

    <section class="preference-table-card">
      <div class="preference-toolbar">
        <div class="search-box">⌕ <input v-model="keyword" placeholder="搜索用户 ID、昵称或兴趣内容"></div>
        <div class="preference-tabs"><button v-for="t in types" :key="t.value" :class="{active:type===t.value}" @click="type=t.value">{{t.label}}</button></div>
        <select v-model="strength"><option value="all">全部兴趣强度</option><option value="high">高兴趣（8 分及以上）</option><option value="medium">中兴趣（3-7 分）</option><option value="low">待观察（0-2 分）</option></select>
        <span>共 {{filtered.length}} 位用户</span>
      </div>
      <div class="preference-table">
        <div class="preference-tr th"><span>用户</span><span>最高兴趣内容</span><span>旅行兴趣</span><span>学习兴趣</span><span>综合热度</span><span>行为 / 最近活跃</span></div>
        <div class="preference-tr" v-for="u in filtered" :key="u.user_id">
          <div class="preference-user"><i>{{u.user_name.slice(0,1)}}</i><div><b>{{u.user_name}}</b><small>{{u.user_id}}</small></div></div>
          <div><b>{{u.top_interest}}</b><small><em :class="u.top_type">{{u.top_type==='route'?'旅行路线':u.top_type==='study'?'学习方向':'待识别'}}</em></small></div>
          <div class="metric"><b>{{Math.max(u.route_score,0)}} 分</b><span><i :style="{width:metricWidth(u.route_score,u.interest_score)+'%'}"></i></span></div>
          <div class="metric study"><b>{{Math.max(u.study_score,0)}} 分</b><span><i :style="{width:metricWidth(u.study_score,u.interest_score)+'%'}"></i></span></div>
          <div><b class="heat-number">{{u.interest_score}}</b><small>{{strengthLabel(u.interest_score)}}</small></div>
          <div><b>{{u.actions}} 次行为</b><small>{{formatDate(u.updated_at)}}</small></div>
        </div>
        <div v-if="!filtered.length" class="preference-empty">没有符合当前筛选条件的用户</div>
      </div>
    </section>
  </div>
</template>

<script setup>
import{computed,onMounted,ref}from'vue';import{api}from'../services/api';
const emit=defineEmits(['toast']);const keyword=ref(''),type=ref('all'),strength=ref('all');
const types=[{label:'全部偏好',value:'all'},{label:'偏旅行',value:'route'},{label:'偏学习',value:'study'}];
const fallback={summary:{users:0,events:0,route_score:0,study_score:0},rankings:[],users:[]};const data=ref(fallback);
const filtered=computed(()=>data.value.users.filter(u=>{const text=`${u.user_id}${u.user_name}${u.top_interest}`;const typeOk=type.value==='all'||(type.value==='route'?u.route_score>=u.study_score:u.study_score>u.route_score);const score=u.interest_score;const strengthOk=strength.value==='all'||(strength.value==='high'?score>=8:strength.value==='medium'?score>=3&&score<8:score<3);return text.includes(keyword.value)&&typeOk&&strengthOk}));
const maxRank=computed(()=>Math.max(...data.value.rankings.map(x=>x.score),1));const rankWidth=score=>Math.max(score/maxRank.value*100,8);const metricWidth=(score,total)=>Math.max(Math.max(score,0)/Math.max(total,1)*100,score>0?8:0);const strengthLabel=score=>score>=8?'高兴趣':score>=3?'中兴趣':'待观察';const formatDate=value=>value?new Date(value).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}):'-';
const load=async()=>{try{data.value=await api.getPreferences();emit('toast','用户偏好数据已更新')}catch{emit('toast','偏好接口暂未连接')}};onMounted(load)
</script>

<style scoped>
.preference-page{background:#f3f6f5;min-height:calc(100vh - 76px)}.refresh-btn{padding:10px 17px}.preference-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:17px}.preference-stats article{background:#fff;border:1px solid #e4ebe8;border-radius:14px;padding:18px;display:flex;align-items:center;gap:13px}.preference-stats article>i{font-style:normal;width:43px;height:43px;border-radius:12px;display:grid;place-items:center;font-weight:800}.preference-stats i.orange{background:#fff0e6;color:#ef7230}.preference-stats i.green{background:#e4f6f1;color:#09927f}.preference-stats i.blue{background:#e9f2ff;color:#397bc2}.preference-stats i.purple{background:#f2ebff;color:#7954b7}.preference-stats small,.preference-stats b,.preference-stats span{display:block}.preference-stats small{font-size:10px;color:#778985}.preference-stats b{font-size:24px;margin:3px 0}.preference-stats span{font-size:9px;color:#99a5a2}.preference-rank-card,.preference-table-card{background:#fff;border:1px solid #e4ebe8;border-radius:14px;padding:20px;margin-bottom:17px}.rank-head{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #edf1ef;padding-bottom:15px}.rank-head h3{font-size:15px;margin:0 0 5px}.rank-head p{font-size:10px;color:#899995;margin:0}.score-rule{font-size:9px;color:#9b7450;background:#fff7eb;padding:7px 10px;border-radius:7px}.interest-ranking{display:grid;grid-template-columns:1fr 1fr;column-gap:35px;padding-top:10px}.interest-rank{display:flex;align-items:center;gap:11px;padding:11px 0;border-bottom:1px solid #edf1ef}.interest-rank>strong{width:25px;height:25px;border-radius:8px;background:#f0f3f2;display:grid;place-items:center;font-size:10px;color:#7c8c88}.interest-rank>strong.top{background:#fff0e6;color:#ee7130}.rank-main{flex:1;min-width:0}.rank-main>div:first-child{display:flex;align-items:center;gap:7px}.rank-main b{font-size:11px}.rank-main em,.preference-tr em{font-style:normal;font-size:8px;padding:3px 6px;border-radius:12px}.rank-main em.route,.preference-tr em.route{background:#e5f6f1;color:#088b79}.rank-main em.study,.preference-tr em.study{background:#fff0e4;color:#d56c2d}.rank-bar{height:5px;background:#edf2f0;border-radius:10px;margin-top:7px;overflow:hidden}.rank-bar i{display:block;height:100%;background:#14a390;border-radius:10px}.rank-bar i.study{background:#ff813e}.rank-score{text-align:right}.rank-score b,.rank-score small{display:block}.rank-score b{font-size:15px}.rank-score small{font-size:8px;color:#96a29f;margin-top:2px}.preference-toolbar{display:flex;gap:10px;align-items:center;margin-bottom:15px}.preference-toolbar .search-box{width:290px}.preference-toolbar select{height:36px;border:1px solid #dfe7e4;border-radius:8px;padding:0 10px;color:#61736f;font-size:10px;background:#fff}.preference-toolbar>span{margin-left:auto;font-size:10px;color:#899995}.preference-tabs{display:flex;background:#eef2f1;border-radius:8px;padding:3px}.preference-tabs button{border:0;background:transparent;padding:7px 10px;font-size:9px;color:#748581}.preference-tabs button.active{background:#fff;color:#078c7a;border-radius:6px;box-shadow:0 2px 7px rgba(20,60,53,.08)}.preference-table{border:1px solid #e6ecea;border-radius:10px;overflow:hidden}.preference-tr{display:grid;grid-template-columns:1.25fr 1.35fr .85fr .85fr .7fr 1fr;align-items:center;min-height:67px;padding:0 15px;border-bottom:1px solid #edf1ef;font-size:10px;gap:12px}.preference-tr:last-child{border:0}.preference-tr.th{min-height:39px;background:#f7f9f8;color:#7c8d89;font-size:9px}.preference-tr b,.preference-tr small{display:block}.preference-tr small{font-size:8px;color:#8e9c99;margin-top:4px}.preference-user{display:flex;align-items:center;gap:9px}.preference-user>i{font-style:normal;width:34px;height:34px;border-radius:11px;background:linear-gradient(135deg,#ffe9d8,#e2f5f0);display:grid;place-items:center;color:#27665c;font-weight:800}.metric>span{display:block;width:75px;height:5px;background:#eef2f1;border-radius:8px;margin-top:6px;overflow:hidden}.metric>span i{display:block;height:100%;background:#12a594;border-radius:8px}.metric.study>span i{background:#ff7a35}.heat-number{font-size:17px!important;color:#173b35}.preference-empty{text-align:center;color:#91a09c;font-size:10px;padding:34px}
</style>
