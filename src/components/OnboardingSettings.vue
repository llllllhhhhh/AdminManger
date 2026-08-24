<template>
  <section class="page-content onboarding-page">
    <div class="onboarding-head">
      <div>
        <span>用户增长 / 学习画像</span>
        <h1>开屏引导配置</h1>
        <p>配置新用户首次进入时的学习画像问答。发布后按引导版本仅展示一次，答案会同步到用户学习画像。</p>
      </div>
      <div class="head-actions">
        <button class="outline-btn" @click="$emit('save')">保存草稿</button>
        <button class="primary-btn compact" @click="$emit('publish')">发布到用户端</button>
      </div>
    </div>

    <div class="status-grid">
      <article>
        <div class="status-icon green">启</div>
        <div><small>展示状态</small><b>{{ onboarding.enabled ? '已启用' : '已停用' }}</b></div>
        <label class="switch"><input v-model="onboarding.enabled" type="checkbox"><i></i></label>
      </article>
      <article>
        <div class="status-icon orange">版</div>
        <div><small>当前引导版本</small><b>V{{ onboarding.version }}</b></div>
        <button class="version-button" @click="bumpVersion">升级版本</button>
      </article>
      <article>
        <div class="status-icon blue">步</div>
        <div><small>配置步骤</small><b>{{ onboarding.steps.length }} 步</b></div>
        <span class="status-note">完成后写入本地缓存</span>
      </article>
    </div>

    <div class="editor-layout">
      <div class="editor-main">
        <section class="settings-section">
          <div class="section-head">
            <div><b>基础内容</b><span>展示在引导首页和底部主操作区</span></div>
          </div>
          <div class="field-grid two">
            <label><span>顶部标识</span><input v-model.trim="onboarding.eyebrow" maxlength="40"></label>
            <label><span>完成按钮</span><input v-model.trim="onboarding.completionText" maxlength="30"></label>
            <label class="wide"><span>主标题</span><input v-model.trim="onboarding.title" maxlength="80"></label>
            <label class="wide"><span>说明文案</span><textarea v-model.trim="onboarding.description" maxlength="240"></textarea></label>
            <label class="wide"><span>头图地址</span><input v-model.trim="onboarding.heroImage" placeholder="https://..."></label>
          </div>
          <label class="check-setting">
            <input v-model="onboarding.allowSkip" type="checkbox">
            <span><b>允许跳过引导</b><small>跳过也会记录当前版本已完成，但不会生成学习画像。</small></span>
          </label>
        </section>

        <section class="settings-section steps-section">
          <div class="section-head">
            <div><b>问答步骤</b><span>业务字段固定，标题、说明和候选项可自由编辑</span></div>
          </div>

          <article
            v-for="(step, stepIndex) in onboarding.steps"
            :key="step.key"
            :class="['step-editor', { active: previewStep === stepIndex }]"
            @click="previewStep = stepIndex"
          >
            <div class="step-number">{{ stepIndex + 1 }}</div>
            <div class="step-body">
              <div class="step-toolbar">
                <div><b>{{ stepName(step.key) }}</b><code>{{ step.key }}</code></div>
                <div class="step-flags">
                  <label><input v-model="step.required" type="checkbox"> 必填</label>
                  <span>{{ step.type === 'multiple' ? '多选' : '单选' }}</span>
                </div>
              </div>
              <div class="field-grid two compact-grid">
                <label><span>问题标题</span><input v-model.trim="step.title" maxlength="80"></label>
                <label><span>补充说明</span><input v-model.trim="step.description" maxlength="120"></label>
                <label v-if="step.type === 'multiple'"><span>最多选择</span><input v-model.number="step.max" type="number" min="1" max="10"></label>
              </div>
              <div class="option-editor">
                <div class="option-head"><span>候选项</span><button @click.stop="addOption(step)">+ 添加选项</button></div>
                <div class="option-list">
                  <label v-for="(_, optionIndex) in step.options" :key="optionIndex">
                    <em>{{ optionIndex + 1 }}</em>
                    <input v-model.trim="step.options[optionIndex]" maxlength="80">
                    <button title="删除选项" @click.stop="removeOption(step, optionIndex)">×</button>
                  </label>
                </div>
              </div>
            </div>
          </article>
        </section>
      </div>

      <aside class="preview-column">
        <div class="preview-title"><b>移动端预览</b><span>点击左侧步骤切换预览</span></div>
        <div class="phone-preview">
          <div class="phone-status"><span>9:41</span><span>5G&nbsp;&nbsp;100%</span></div>
          <div class="mini-progress"><i :style="{ width: progress + '%' }"></i></div>
          <div class="mini-hero">
            <img :src="onboarding.heroImage" alt="学习引导头图">
            <span>{{ onboarding.eyebrow }}</span>
            <b>{{ onboarding.title }}</b>
          </div>
          <div class="mini-content">
            <span class="mini-step">第 {{ previewStep + 1 }} / {{ onboarding.steps.length }} 步</span>
            <h2>{{ currentStep.title }}</h2>
            <p>{{ currentStep.description }}</p>
            <div class="mini-options">
              <button
                v-for="option in currentStep.options"
                :key="option"
                :class="{ selected: previewSelected(option) }"
                @click="togglePreview(option)"
              >
                <span>{{ option }}</span><i>{{ previewSelected(option) ? '✓' : '' }}</i>
              </button>
            </div>
          </div>
          <div class="mini-footer">
            <button :disabled="!previewHasAnswer">{{ previewStep === onboarding.steps.length - 1 ? onboarding.completionText : '下一步' }}</button>
          </div>
        </div>
        <div class="version-tip">
          <b>版本触达规则</b>
          <p>普通文案修改不会让已完成用户重复看到。需要重新触达时，先点击“升级版本”再发布。</p>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'

const props = defineProps({ config: { type: Object, required: true } })
const emit = defineEmits(['save', 'publish', 'dirty', 'toast'])
const previewStep = ref(0)
const previewAnswers = reactive({})

const onboarding = computed(() => props.config.onboarding)
const currentStep = computed(() => onboarding.value.steps[previewStep.value] || { options: [] })
const progress = computed(() => Math.round(((previewStep.value + 1) / onboarding.value.steps.length) * 100))
const currentPreviewAnswer = computed(() => previewAnswers[currentStep.value.key])
const previewHasAnswer = computed(() => Array.isArray(currentPreviewAnswer.value)
  ? currentPreviewAnswer.value.length > 0
  : Boolean(currentPreviewAnswer.value))

const stepName = key => ({
  stage: '当前学习阶段',
  target: '目标考试时间',
  schoolMajorStatus: '院校专业状态',
  interests: '关注学科',
}[key] || '自定义问题')

const addOption = step => {
  step.options.push(`新选项 ${step.options.length + 1}`)
}

const removeOption = (step, index) => {
  if (step.options.length <= 2) {
    emit('toast', '每个步骤至少保留两个候选项')
    return
  }
  step.options.splice(index, 1)
}

const bumpVersion = () => {
  if (!window.confirm('升级版本并发布后，已完成旧版本的用户会再次看到引导。确认升级吗？')) return
  onboarding.value.version = Math.max(1, Number(onboarding.value.version || 1)) + 1
  emit('toast', `引导版本已升级为 V${onboarding.value.version}，发布后生效`)
}

const previewSelected = option => {
  const value = currentPreviewAnswer.value
  return Array.isArray(value) ? value.includes(option) : value === option
}

const togglePreview = option => {
  const step = currentStep.value
  if (step.type !== 'multiple') {
    previewAnswers[step.key] = option
    return
  }
  const values = Array.isArray(previewAnswers[step.key]) ? [...previewAnswers[step.key]] : []
  const index = values.indexOf(option)
  if (index >= 0) values.splice(index, 1)
  else if (values.length < Number(step.max || 1)) values.push(option)
  previewAnswers[step.key] = values
}

watch(() => props.config.onboarding, () => emit('dirty'), { deep: true })
</script>

<style scoped>
.onboarding-page{color:#172b27}.onboarding-head{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;margin-bottom:20px}.onboarding-head span{color:#0a8b78;font-size:12px;font-weight:800}.onboarding-head h1{margin:7px 0 8px;font-size:28px;color:#132723}.onboarding-head p{max-width:760px;margin:0;color:#6b7b77;font-size:13px;line-height:1.7}.head-actions{display:flex;gap:10px}.head-actions button{height:40px}.status-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-bottom:18px}.status-grid article{display:flex;align-items:center;gap:12px;min-height:78px;padding:14px 16px;border:1px solid #dfe8e5;border-radius:8px;background:#fff;box-shadow:0 6px 18px rgba(20,55,49,.06)}.status-icon{width:42px;height:42px;border-radius:8px;display:grid;place-items:center;font-size:13px;font-weight:900}.status-icon.green{background:#e1f4ef;color:#087f70}.status-icon.orange{background:#fff0e5;color:#d76525}.status-icon.blue{background:#e8effc;color:#3e67ad}.status-grid small,.status-grid b{display:block}.status-grid small{color:#7a8985;font-size:11px}.status-grid b{margin-top:4px;font-size:18px}.status-grid article>div:nth-child(2){flex:1}.status-note{color:#7b8986!important;font-size:11px!important;font-weight:500!important}.switch{position:relative}.switch input{position:absolute;opacity:0}.switch i{display:block;width:42px;height:24px;border-radius:20px;background:#cbd5d2;position:relative;transition:.2s}.switch i:after{content:'';position:absolute;width:18px;height:18px;left:3px;top:3px;border-radius:50%;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.18);transition:.2s}.switch input:checked+i{background:#0b927f}.switch input:checked+i:after{transform:translateX(18px)}.version-button{border:1px solid #f2c6aa;border-radius:7px;background:#fff7f1;color:#c45d25;padding:7px 10px;font-size:11px;font-weight:700}.editor-layout{display:grid;grid-template-columns:minmax(0,1fr) 350px;gap:18px;align-items:start}.editor-main{display:grid;gap:16px}.settings-section{border:1px solid #dfe8e5;border-radius:8px;background:#fff;padding:20px;box-shadow:0 7px 20px rgba(20,55,49,.055)}.section-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:17px}.section-head b,.section-head span{display:block}.section-head b{font-size:17px}.section-head span{margin-top:4px;color:#7d8c88;font-size:12px}.field-grid{display:grid;gap:13px}.field-grid.two{grid-template-columns:repeat(2,minmax(0,1fr))}.field-grid label span{display:block;margin-bottom:6px;color:#52635f;font-size:11px;font-weight:700}.field-grid input,.field-grid textarea{width:100%;border:1px solid #d8e3df;border-radius:7px;background:#fbfdfc;padding:10px 11px;color:#172b27;outline:none}.field-grid input:focus,.field-grid textarea:focus{border-color:#159987;box-shadow:0 0 0 3px rgba(21,153,135,.09)}.field-grid textarea{height:76px;resize:vertical}.field-grid .wide{grid-column:1/-1}.check-setting{display:flex;align-items:flex-start;gap:10px;margin-top:15px;padding-top:15px;border-top:1px solid #edf1ef}.check-setting>input{margin-top:3px}.check-setting b,.check-setting small{display:block}.check-setting b{font-size:13px}.check-setting small{margin-top:4px;color:#84918e;font-size:11px}.steps-section{padding-bottom:8px}.step-editor{display:flex;gap:14px;padding:16px 0;border-top:1px solid #e9efed;cursor:pointer}.step-editor:first-of-type{border-top:0}.step-editor.active{margin:0 -12px;padding:16px 12px;background:#f6fbf9}.step-number{flex:0 0 31px;height:31px;border-radius:7px;background:#e2f3ef;color:#087f70;display:grid;place-items:center;font-size:12px;font-weight:900}.step-editor.active .step-number{background:#0b927f;color:#fff}.step-body{flex:1;min-width:0}.step-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:13px}.step-toolbar>div:first-child{display:flex;align-items:center;gap:8px}.step-toolbar b{font-size:14px}.step-toolbar code{padding:3px 6px;border-radius:5px;background:#edf3f1;color:#667a75;font-size:10px}.step-flags{display:flex;align-items:center;gap:10px;color:#687974;font-size:11px}.step-flags span{padding:4px 7px;border-radius:5px;background:#fff0e7;color:#c66029}.compact-grid{grid-template-columns:1fr 1fr 100px!important}.option-editor{margin-top:13px}.option-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;color:#52635f;font-size:11px;font-weight:700}.option-head button{border:0;background:transparent;color:#078472;font-size:11px;font-weight:800}.option-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.option-list label{display:flex;align-items:center;gap:7px;padding:5px 7px;border:1px solid #e1e9e6;border-radius:7px;background:#fbfdfc}.option-list em{width:20px;height:20px;border-radius:5px;background:#edf3f1;display:grid;place-items:center;color:#71817d;font-size:9px;font-style:normal}.option-list input{flex:1;min-width:0;border:0;background:transparent;padding:5px;color:#233632;outline:none}.option-list button{width:22px;height:22px;border:0;background:transparent;color:#9aa6a3;font-size:17px}.option-list button:hover{color:#c7473d}.preview-column{position:sticky;top:94px}.preview-title{display:flex;justify-content:space-between;align-items:flex-end;margin:0 5px 10px}.preview-title b{font-size:14px}.preview-title span{color:#7e8e8a;font-size:10px}.phone-preview{width:330px;height:660px;margin:auto;border:8px solid #24322f;border-radius:28px;background:#f6f8f7;overflow:hidden;box-shadow:0 18px 42px rgba(17,43,38,.2);display:flex;flex-direction:column}.phone-status{height:28px;padding:7px 16px 0;display:flex;justify-content:space-between;background:#fff;color:#24332f;font-size:9px;font-weight:800}.mini-progress{height:4px;background:#dfe9e6}.mini-progress i{display:block;height:100%;background:#0b927f;transition:.2s}.mini-hero{height:150px;position:relative;overflow:hidden;background:#183f38;color:#fff}.mini-hero img{width:100%;height:100%;object-fit:cover}.mini-hero:after{content:'';position:absolute;inset:0;background:rgba(12,42,36,.5)}.mini-hero span,.mini-hero b{position:absolute;z-index:1;left:18px;right:18px}.mini-hero span{top:68px;color:#bce5dd;font-size:9px;font-weight:800}.mini-hero b{top:88px;font-size:18px;line-height:1.35}.mini-content{flex:1;min-height:0;padding:18px;overflow:auto}.mini-step{color:#0b8b79;font-size:10px;font-weight:800}.mini-content h2{margin:7px 0 5px;font-size:19px;line-height:1.35}.mini-content p{margin:0;color:#71817d;font-size:10px;line-height:1.5}.mini-options{display:grid;gap:8px;margin-top:16px}.mini-options button{min-height:40px;border:1px solid #e0e7e5;border-radius:7px;background:#fff;color:#263733;padding:9px 11px;display:flex;align-items:center;justify-content:space-between;text-align:left;font-size:11px}.mini-options button.selected{border-color:#0c927f;background:#edf8f5;color:#087d6e;font-weight:800}.mini-options i{font-style:normal}.mini-footer{padding:10px 16px 16px;background:#fff;border-top:1px solid #e8eeec}.mini-footer button{width:100%;height:42px;border:0;border-radius:7px;background:#f0783a;color:#fff;font-size:12px;font-weight:800}.mini-footer button:disabled{background:#ccd5d2}.version-tip{margin-top:14px;padding:14px;border-left:3px solid #ef7a3d;background:#fff;border-radius:0 7px 7px 0;box-shadow:0 5px 16px rgba(20,55,49,.05)}.version-tip b{font-size:12px}.version-tip p{margin:5px 0 0;color:#75837f;font-size:10px;line-height:1.6}@media(max-width:1300px){.editor-layout{grid-template-columns:minmax(0,1fr) 320px}.phone-preview{width:300px}.compact-grid{grid-template-columns:1fr 1fr!important}}@media(max-width:1050px){.editor-layout{grid-template-columns:1fr}.preview-column{position:static}.phone-preview{width:330px}.status-grid{grid-template-columns:1fr}.preview-title{max-width:330px;margin:0 auto 10px}}
</style>
