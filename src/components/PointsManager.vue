<template>
  <div class="page-content points-page">
    <div class="content-title">
      <div>
        <h1>积分与邀请规则</h1>
        <p>配置签到、课程购买、好友邀请、有效期及旅游兑换限制</p>
      </div>
      <span class="live-badge"><i></i>规则运行中</span>
    </div>

    <div class="settings-grid">
      <section class="dash-card form-card point-rule-card">
        <div class="section-heading">
          <span>01</span>
          <div>
            <h3>积分获取规则</h3>
            <p>分别控制用户签到、课程购买和邀请好友的积分发放</p>
          </div>
        </div>

        <div class="reward-list">
          <article v-for="item in rewardRules" :key="item.scoreKey" class="reward-row">
            <div class="reward-info">
              <i>{{ item.icon }}</i>
              <div>
                <b>{{ item.name }}</b>
                <p>{{ item.desc }}</p>
              </div>
            </div>
            <div class="reward-input">
              <input type="number" min="0" v-model.number="config.points[item.scoreKey]">
              <em>积分/次</em>
            </div>
            <label class="toggle">
              <input type="checkbox" v-model="config.points[item.enabledKey]">
              <i></i>
            </label>
          </article>
        </div>

        <div class="number-setting compact-setting">
          <div>
            <b>积分有效期</b>
            <span>签到、购买、邀请获得的积分统一按此有效期计算</span>
          </div>
          <div><input type="number" min="1" v-model.number="config.points.validDays"><em>天</em></div>
        </div>

        <div class="section-heading divide-heading">
          <span>02</span>
          <div>
            <h3>旅游兑换规则</h3>
            <p>控制兑换门槛、年度次数和月度库存</p>
          </div>
        </div>

        <div class="exchange-grid">
          <div class="number-setting" v-for="r in exchangeRules" :key="r.key">
            <div><b>{{ r.name }}</b><span>{{ r.desc }}</span></div>
            <div><input type="number" min="0" v-model.number="config.points[r.key]"><em>{{ r.unit }}</em></div>
          </div>
        </div>

        <div class="enable-row">
          <div>
            <b>启用积分系统</b>
            <span>关闭后暂停签到、购买、邀请积分发放与兑换活动</span>
          </div>
          <label class="toggle"><input type="checkbox" v-model="config.points.enabled"><i></i></label>
        </div>

        <button class="primary-btn" @click="$emit('save')">保存并立即生效</button>
      </section>

      <section>
        <div class="dash-card rule-preview">
          <div class="preview-top"><span>当前用户预览</span><i>规则模拟器</i></div>
          <div class="points-ring"><strong>{{ demo }}</strong><small>可用积分</small></div>
          <div class="progress-track"><i :style="{ width: Math.min(demo / config.points.exchangeScore * 100, 100) + '%' }"></i></div>
          <p v-if="demo < config.points.exchangeScore">还差 <b>{{ config.points.exchangeScore - demo }}</b> 积分兑换旅游权益</p>
          <p v-else class="success-text">已达到兑换条件，可以立即兑换</p>
          <input type="range" min="0" :max="config.points.exchangeScore + 50" v-model.number="demo">
          <button :disabled="demo < config.points.exchangeScore">{{ demo < config.points.exchangeScore ? '积分不足，继续获取' : '立即兑换旅游权益' }}</button>
        </div>

        <div class="dash-card formula">
          <h3>当前规则摘要</h3>
          <p>每日签到：<strong>{{ ruleText(config.points.checkinEnabled, config.points.checkinScore) }}</strong></p>
          <p>课程购买：<strong>{{ ruleText(config.points.purchaseEnabled, config.points.purchaseScore) }}</strong></p>
          <p>有效邀请：<strong>{{ ruleText(config.points.inviteEnabled, config.points.inviteScore) }}</strong></p>
          <p>积满 <strong>{{ config.points.exchangeScore }}</strong> 分可兑换旅游权益，每年最多 <strong>{{ config.points.yearlyLimit }}</strong> 次。</p>
          <p>每月开放 <strong>{{ config.points.monthlyStock }}</strong> 个名额，积分有效期为 <strong>{{ config.points.validDays }}</strong> 天。</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({ config: Object })
defineEmits(['save'])

const demo = ref(68)
const rewardRules = [
  { scoreKey: 'checkinScore', enabledKey: 'checkinEnabled', name: '每日签到积分', desc: '用户每天点击学习签到后发放一次', icon: '签' },
  { scoreKey: 'purchaseScore', enabledKey: 'purchaseEnabled', name: '课程购买积分', desc: '用户学习产品订单支付成功后发放一次', icon: '课' },
  { scoreKey: 'inviteScore', enabledKey: 'inviteEnabled', name: '好友邀请积分', desc: '好友注册并审核通过后给邀请人发放', icon: '邀' },
]
const exchangeRules = [
  { key: 'exchangeScore', name: '兑换所需积分', desc: '达到积分后开放兑换按钮', unit: '分' },
  { key: 'yearlyLimit', name: '单人年度兑换上限', desc: '按自然年统计兑换次数', unit: '次' },
  { key: 'monthlyStock', name: '月度兑换名额', desc: '所有用户共享当月库存', unit: '份' },
]

const ruleText = (enabled, score) => enabled ? `每次 ${score || 0} 积分` : '已关闭'
</script>

<style scoped>
.points-page .settings-grid{align-items:start}.point-rule-card{padding:24px}.reward-list{display:grid;gap:12px;margin:18px 0}.reward-row{display:grid;grid-template-columns:minmax(0,1fr) 150px 54px;align-items:center;gap:14px;border:1px solid #d7e6e2;border-radius:16px;background:linear-gradient(180deg,#fbfdfc,#f6faf8);padding:14px 16px;box-shadow:0 10px 24px rgba(20,55,49,.055)}.reward-info{display:flex;align-items:center;gap:12px;min-width:0}.reward-info i{flex:0 0 38px;height:38px;border-radius:12px;background:#dff5ef;color:#0b7669;display:grid;place-items:center;font-style:normal;font-weight:900}.reward-info b,.reward-info p{display:block}.reward-info b{font-size:15px;color:#173f38;white-space:nowrap}.reward-info p{margin:5px 0 0;color:#72847f;font-size:12px;line-height:1.5;white-space:normal}.reward-input{display:flex;align-items:center;gap:8px;border:1px solid #d8e5e1;border-radius:12px;background:#fff;padding:8px 10px}.reward-input input{width:58px;border:0;outline:0;background:transparent;text-align:center;font-size:22px;font-weight:800;color:#173f38}.reward-input em{white-space:nowrap;color:#7d918b;font-style:normal;font-size:12px}.compact-setting{margin-top:12px}.divide-heading{margin-top:24px}.exchange-grid{display:grid;gap:12px}.formula p strong{color:#ff7a35}@media (max-width: 980px){.reward-row{grid-template-columns:1fr;align-items:start}.reward-input{width:150px}.point-rule-card{padding:18px}}
</style>
