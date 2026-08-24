<template>
  <section class="page-content admin-grid-page">
    <div class="admin-grid-hero">
      <div>
        <span class="admin-grid-eyebrow">订单合同与履约</span>
        <h1>订单履约中心</h1>
        <p>统一处理人工定制方案、旅行合同审核、接送安排、出行核销与订单完成状态。</p>
      </div>
      <div class="order-hero-actions">
        <button
          v-for="item in statusTabs"
          :key="item.key"
          :class="{ active: statusView === item.key }"
          @click="statusView = item.key"
        >
          {{ item.label }} <span>{{ item.count }}</span>
        </button>
        <button class="ghost-btn compact" @click="openTemplateModal">合同模板</button>
        <button class="ghost-btn compact" @click="loadOrders">刷新</button>
      </div>
    </div>

    <div class="admin-grid-stats">
      <article v-for="item in dashboardStats" :key="item.label"><i :class="item.tone">{{ item.icon }}</i><div><small>{{ item.label }}</small><strong>{{ item.count }}</strong></div></article>
    </div>

    <div class="admin-grid-card">
      <div class="admin-grid-table-wrap">
        <table class="admin-grid-table order-grid-table">
          <thead>
            <tr class="head">
              <th class="admin-grid-num">#</th>
              <th>订单标题</th>
              <th>订单类型</th>
              <th>申请人</th>
              <th>联系电话</th>
              <th>出行日期</th>
              <th>预算 / 金额</th>
              <th>合同签名</th>
              <th>履约状态</th>
              <th>操作</th>
            </tr>
            <tr class="filters">
              <th></th>
              <th><input class="filter-control" v-model.trim="keyword" placeholder="订单号 / 标题 / 用户"></th>
              <th><input class="filter-control" v-model.trim="typeFilter" placeholder="订单类型"></th>
              <th><input class="filter-control" v-model.trim="userFilter" placeholder="申请人"></th>
              <th><input class="filter-control" v-model.trim="phoneFilter" placeholder="手机号"></th>
              <th></th>
              <th></th>
              <th></th>
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(order, index) in pagedOrders" :key="order.id">
              <td class="admin-grid-num">{{ startIndex + index + 1 }}</td>
              <td>
                <div class="admin-grid-main">
                  <div class="admin-grid-avatar">{{ order.title.slice(0, 1) }}</div>
                  <div>
                    <b>{{ order.title }}</b>
                    <small>{{ order.orderNo }} · {{ order.time }}</small>
                  </div>
                </div>
              </td>
              <td>
                <span :class="['admin-grid-pill', order.source === 'custom' ? 'green' : 'orange']">{{ order.type }}</span>
                <small>{{ order.source === 'custom' ? '用户端人工提交' : '平台订单' }}</small>
              </td>
              <td><b>{{ order.user }}</b><small>申请人</small></td>
              <td><b>{{ order.phone || '-' }}</b><small>联系方式</small></td>
              <td><b>{{ order.date || '-' }}</b><small>计划出行</small></td>
              <td><b>{{ order.amount || '-' }}</b><small>{{ order.source === 'custom' ? '用户预算' : '订单金额' }}</small></td>
              <td>
                <span :class="['admin-grid-pill', contractClass(order.contractStatus)]">{{ contractText(order.contractStatus) }}</span>
                <small>{{ order.contractSignedAt || '未提交签名' }}</small>
              </td>
              <td>
                <span :class="['admin-grid-pill', fulfillmentClass(order.fulfillmentStatus)]">{{ fulfillmentText(order.fulfillmentStatus) }}</span>
                <small>{{ order.pickupTime || order.pickupAddress || '待处理' }}</small>
              </td>
              <td>
                <div class="admin-grid-actions">
                  <button @click="openDetail(order)">详情</button>
                  <button v-if="order.source === 'travel' && order.contractStatus !== TRAVEL_CONTRACT_STATUS.UNSIGNED" class="orange" @click="openContract(order)">合同</button>
                  <button v-if="order.source === 'travel' && order.contractStatus === TRAVEL_CONTRACT_STATUS.APPROVED" class="orange" @click="openFulfillment(order)">履约</button>
                  <button v-if="order.source === 'custom'" class="orange" @click="openPlan(order)">查看方案</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="!filtered.length" class="admin-grid-empty">当前筛选条件下暂无订单</div>
      </div>
      <PaginationBar v-model:page="page" v-model:page-size="pageSize" :total="filtered.length" />
    </div>

    <div v-if="planVisible" class="modal-mask" @click.self="closePlan">
      <div class="plan-modal">
        <div class="modal-head">
          <div>
            <span class="admin-grid-eyebrow">人工定制审核</span>
            <h2>{{ currentOrder?.title }}</h2>
            <p>{{ currentOrder?.orderNo }} · {{ currentOrder?.user }} · {{ currentOrder?.phone || '-' }}</p>
          </div>
          <button @click="closePlan">×</button>
        </div>

        <div class="request-box">
          <b>用户需求</b>
          <p>目的地：{{ currentOrder?.raw?.destination || '-' }}</p>
          <p>时间：{{ currentOrder?.raw?.travel_time || '-' }}　天数：{{ currentOrder?.raw?.days || '-' }}　人数：{{ currentOrder?.raw?.people_count || '-' }}</p>
          <p>标签：{{ (currentOrder?.raw?.special_tags || []).join('、') || '-' }}</p>
          <p v-if="currentOrder?.raw?.note">备注：{{ currentOrder.raw.note }}</p>
        </div>

        <label>方案标题</label>
        <input v-model.trim="planForm.plan_title" placeholder="例如：川西 5 日雪山轻徒步方案" />
        <label>方案说明</label>
        <textarea v-model.trim="planForm.plan_summary" placeholder="写给用户看的整体设计说明"></textarea>
        <label>预估积分 / 报价</label>
        <input v-model.trim="planForm.plan_price" placeholder="例如：3680 积分 / 2 人" />
        <label>每日行程（一行一天）</label>
        <textarea v-model.trim="planForm.plan_itinerary_text" placeholder="Day1 成都集合&#10;Day2 四姑娘山双桥沟"></textarea>
        <label>费用包含（一行一项）</label>
        <textarea v-model.trim="planForm.plan_includes_text" placeholder="住宿&#10;往返交通&#10;景区门票"></textarea>
        <label>预约 / 成团须知</label>
        <textarea v-model.trim="planForm.plan_tips" placeholder="例如：需提前 7 天确认资源，出发前可免费修改一次"></textarea>

        <div v-if="planError" class="plan-error">{{ planError }}</div>
        <div class="modal-actions">
          <button class="danger" :disabled="reviewingCustom" @click="rejectCustom">驳回需求</button>
          <button class="primary" :disabled="reviewingCustom" @click="approveCustom">
            {{ reviewingCustom ? '同步中...' : '审核通过并同步给用户' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="contractVisible" class="modal-mask" @click.self="closeContract">
      <div class="plan-modal contract-modal">
        <div class="modal-head">
          <div>
            <span class="admin-grid-eyebrow">合同签名审核</span>
            <h2>{{ currentOrder?.title }}</h2>
            <p>{{ currentOrder?.orderNo }} · {{ currentOrder?.contractSignerName || currentOrder?.user }} · {{ currentOrder?.contractSignerPhone || currentOrder?.phone || '-' }}</p>
          </div>
          <button @click="closeContract">×</button>
        </div>

        <div class="request-box">
          <b>合同信息</b>
          <p>订单类型：{{ currentOrder?.type || '-' }}</p>
          <p>出行日期：{{ currentOrder?.date || '-' }}　服务方：{{ currentOrder?.raw?.agency || '-' }}</p>
          <p>证件号码：{{ currentOrder?.contractIdNo || '-' }}</p>
          <p>签署时间：{{ currentOrder?.contractSignedAt || '-' }}　审核时间：{{ currentOrder?.contractReviewedAt || '-' }}</p>
          <p v-if="currentOrder?.contractRejectReason">驳回原因：{{ currentOrder.contractRejectReason }}</p>
        </div>

        <div class="contract-text-preview">
          <b>{{ currentOrder?.contractTemplateTitle || contractTemplate.title || '旅行服务合同' }}</b>
          <pre>{{ renderedContractContent }}</pre>
        </div>

        <div class="signature-preview">
          <b>用户手写签名</b>
          <img v-if="currentOrder?.contractSignatureData" :src="currentOrder.contractSignatureData" alt="合同签名">
          <p v-else>用户尚未提交签名</p>
        </div>

        <label>驳回原因</label>
        <textarea v-model.trim="contractRejectReason" placeholder="驳回时填写，例如：签名不清晰，请重新签署"></textarea>

        <div class="modal-actions" v-if="currentOrder?.contractStatus === TRAVEL_CONTRACT_STATUS.PENDING">
          <button class="danger" :disabled="contractReviewBusy" @click="reviewContract(false)">驳回合同</button>
          <button class="primary" :disabled="contractReviewBusy" @click="reviewContract(true)">{{ contractReviewBusy ? '处理中...' : '通过合同' }}</button>
        </div>
        <div v-else class="contract-locked">当前合同状态：{{ contractText(currentOrder?.contractStatus) }}</div>
      </div>
    </div>

    <div v-if="fulfillmentVisible" class="modal-mask" @click.self="closeFulfillment">
      <div class="plan-modal contract-modal fulfillment-modal">
        <button class="modal-fixed-close" @click="closeFulfillment">×</button>
        <div class="modal-head">
          <div>
            <span class="admin-grid-eyebrow">旅行履约</span>
            <h2>{{ currentOrder?.title }}</h2>
            <p>{{ currentOrder?.orderNo }} · {{ fulfillmentText(currentOrder?.fulfillmentStatus) }}</p>
          </div>
        </div>

        <div class="fulfillment-steps">
          <article
            v-for="step in fulfillmentSteps"
            :key="step.key"
            :class="{ done: step.done, active: step.active }"
          >
            <i>{{ step.index }}</i>
            <div>
              <b>{{ step.title }}</b>
              <span>{{ step.desc }}</span>
            </div>
          </article>
        </div>

        <div :class="['fulfillment-tip', fulfillmentTip.tone]">
          <b>{{ fulfillmentTip.title }}</b>
          <p>{{ fulfillmentTip.desc }}</p>
        </div>

        <div class="request-box">
          <b>用户接送信息</b>
          <p>地址：{{ currentOrder?.pickupAddress || '-' }}</p>
          <p>详细：{{ currentOrder?.pickupDetail || '-' }}</p>
          <p>人数：{{ currentOrder?.travelerCount || 1 }}　行李：{{ currentOrder?.luggageCount || 0 }}</p>
          <p>紧急联系人：{{ currentOrder?.emergencyContact || '-' }} {{ currentOrder?.emergencyPhone || '' }}</p>
          <p v-if="currentOrder?.pickupNote">备注：{{ currentOrder.pickupNote }}</p>
        </div>

        <label>接送时间</label>
        <input v-model.trim="fulfillmentForm.pickup_time" placeholder="例如：2026-07-16 08:30" />
        <label>接送地点</label>
        <input v-model.trim="fulfillmentForm.pickup_location" placeholder="例如：学校东门集合点" />
        <label>司机 / 接待人</label>
        <input v-model.trim="fulfillmentForm.driver_name" placeholder="姓名" />
        <label>联系电话</label>
        <input v-model.trim="fulfillmentForm.driver_phone" placeholder="电话" />
        <label>车牌号</label>
        <input v-model.trim="fulfillmentForm.vehicle_no" placeholder="可选" />
        <label>接送说明</label>
        <textarea v-model.trim="fulfillmentForm.pickup_notice" placeholder="集合说明、注意事项"></textarea>

        <div
          v-if="currentOrder?.fulfillmentStatus === TRAVEL_FULFILLMENT_STATUS.INFO_PENDING"
          class="pending-box"
        >
          用户还没有提交接送信息。当前不能安排接送，可以先关闭弹窗，等待用户端在“我的旅行”里填写接送地址、紧急联系人和行李信息。
        </div>

        <div v-if="currentOrder?.qrToken" class="checkin-box">
          <b>用户核销码</b>
          <p>{{ currentOrder.qrToken }}</p>
        </div>

        <div v-if="isTravelCheckinPending(currentOrder?.fulfillmentStatus)" class="checkin-panel">
          <b>扫码核销</b>
          <p>扫描用户端出行核销二维码，或粘贴二维码内容/手动输入核销码。</p>
          <div v-if="scanActive" id="checkinScanner" class="scanner-box"></div>
          <textarea v-model.trim="checkinTokenInput" placeholder="扫码结果或核销码，例如 xuetuxing-checkin://xxxx"></textarea>
          <div class="modal-actions compact-actions">
            <button @click="toggleScanner">{{ scanActive ? '关闭扫码' : '打开摄像头扫码' }}</button>
            <button class="primary" :disabled="fulfillmentBusy" @click="checkIn">确认核销</button>
          </div>
        </div>

        <div class="modal-actions">
          <button @click="closeFulfillment">关闭</button>
          <button v-if="canSavePickupSchedule" class="primary" :disabled="fulfillmentBusy" @click="schedulePickup">{{ currentOrder?.fulfillmentStatus === TRAVEL_FULFILLMENT_STATUS.PICKUP_CONFIRMED ? '更新接送安排' : '保存并通知用户确认' }}</button>
          <button v-if="isTravelCheckinPending(currentOrder?.fulfillmentStatus)" class="primary" :disabled="fulfillmentBusy" @click="issueQr">生成或补发核销码</button>
          <button v-if="currentOrder?.fulfillmentStatus === TRAVEL_FULFILLMENT_STATUS.CHECKED_IN" class="primary" :disabled="fulfillmentBusy" @click="startTrip">开始行程</button>
          <button v-if="[TRAVEL_FULFILLMENT_STATUS.CHECKED_IN, TRAVEL_FULFILLMENT_STATUS.IN_TRIP].includes(currentOrder?.fulfillmentStatus)" class="primary" :disabled="fulfillmentBusy" @click="completeTrip">完成订单</button>
          <button v-if="canAdminCancel" class="danger" :disabled="fulfillmentBusy" @click="cancelOrder">取消并退款</button>
          <button v-if="currentOrder?.fulfillmentStatus !== TRAVEL_FULFILLMENT_STATUS.COMPLETED" class="danger" :disabled="fulfillmentBusy" @click="markException">标记异常</button>
        </div>
      </div>
    </div>

    <div v-if="templateVisible" class="modal-mask" @click.self="closeTemplateModal">
      <div class="plan-modal contract-modal">
        <div class="modal-head">
          <div>
            <span class="admin-grid-eyebrow">平台合同管理</span>
            <h2>旅行合同模板</h2>
            <p>用户端签署和管理端审核会同步展示这份合同内容。</p>
          </div>
          <button @click="closeTemplateModal">×</button>
        </div>

        <label>合同标题</label>
        <input v-model.trim="templateForm.title" placeholder="例如：旅行服务合同" />
        <label>可选出行范围</label>
        <input v-model.number="templateForm.travel_date_days" type="number" min="0" max="365" placeholder="例如：30" />
        <label>合同内容</label>
        <textarea class="contract-template-textarea" v-model="templateForm.content" placeholder="支持占位符：{order_no} {title} {agency} {travel_date} {signer_name} {signer_phone} {id_no} {amount_text}"></textarea>

        <div v-if="templateError" class="plan-error">{{ templateError }}</div>
        <div class="modal-actions">
          <button @click="closeTemplateModal">取消</button>
          <button class="primary" :disabled="savingTemplate" @click="saveTemplate">
            {{ savingTemplate ? '保存中...' : '保存模板' }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { api } from '../services/api'
import {
  REVIEW_STATUS,
  TRAVEL_CONTRACT_STATUS,
  TRAVEL_FULFILLMENT_STATUS,
  isTravelCheckinPending,
  isTravelFulfillmentOpen,
  travelContractStatusName,
  travelContractTone,
  travelFulfillmentStatusName,
  travelFulfillmentTone,
} from '../utils/orderStatus'
import PaginationBar from './PaginationBar.vue'

const emit = defineEmits(['toast'])

const statusView = ref('all')
const keyword = ref('')
const typeFilter = ref('')
const userFilter = ref('')
const phoneFilter = ref('')
const page = ref(1)
const pageSize = ref(10)
const orders = ref([])
const planVisible = ref(false)
const contractVisible = ref(false)
const templateVisible = ref(false)
const fulfillmentVisible = ref(false)
const currentOrder = ref(null)
const contractRejectReason = ref('')
const reviewingCustom = ref(false)
const savingTemplate = ref(false)
const planError = ref('')
const templateError = ref('')
const fulfillmentBusy = ref(false)
const contractReviewBusy = ref(false)
const scanActive = ref(false)
const checkinTokenInput = ref('')
let scannerStream = null
const fulfillmentForm = reactive({
  pickup_time: '',
  pickup_location: '',
  driver_name: '',
  driver_phone: '',
  vehicle_no: '',
  pickup_notice: '',
})
const planForm = reactive({
  plan_title: '',
  plan_summary: '',
  plan_price: '',
  plan_itinerary_text: '',
  plan_includes_text: '',
  plan_tips: '',
})
const contractTemplate = reactive({
  title: '旅行服务合同',
  content: '',
  travel_date_days: 30,
  travel_date_options: [],
})
const templateForm = reactive({
  title: '',
  content: '',
  travel_date_days: 30,
})

const isTravel = order => order.source === 'travel'
const isContractPending = order => isTravel(order) && order.contractStatus === TRAVEL_CONTRACT_STATUS.PENDING
const isFulfillmentOpen = order => isTravel(order) && isTravelFulfillmentOpen(order.fulfillmentStatus)
const isCheckinPending = order => isTravel(order) && isTravelCheckinPending(order.fulfillmentStatus)
const isCompleted = order => isTravel(order) && order.fulfillmentStatus === TRAVEL_FULFILLMENT_STATUS.COMPLETED
const isException = order => isTravel(order) && order.fulfillmentStatus === TRAVEL_FULFILLMENT_STATUS.EXCEPTION
const matchesStatusView = order => ({
  all: true,
  contract_pending: isContractPending(order),
  fulfillment_open: isFulfillmentOpen(order),
  checkin_pending: isCheckinPending(order),
  completed: isCompleted(order),
  exception: isException(order),
}[statusView.value] ?? true)
const statusTabs = computed(() => [
  { key: 'all', label: '全部', count: orders.value.length },
  { key: 'contract_pending', label: '合同待审', count: orders.value.filter(isContractPending).length },
  { key: 'fulfillment_open', label: '待履约', count: orders.value.filter(isFulfillmentOpen).length },
  { key: 'checkin_pending', label: '待核销', count: orders.value.filter(isCheckinPending).length },
  { key: 'completed', label: '已完成', count: orders.value.filter(isCompleted).length },
  { key: 'exception', label: '异常', count: orders.value.filter(isException).length },
])
const dashboardStats = computed(() => [
  { icon: '合', label: '合同待审', count: orders.value.filter(isContractPending).length, tone: 'orange' },
  { icon: '接', label: '待安排接送', count: orders.value.filter(order => isTravel(order) && order.fulfillmentStatus === TRAVEL_FULFILLMENT_STATUS.INFO_SUBMITTED).length, tone: 'lime' },
  { icon: '核', label: '待核销', count: orders.value.filter(isCheckinPending).length, tone: 'gray' },
  { icon: '总', label: '订单总数', count: orders.value.length, tone: '' },
])
const fulfillmentStepIndex = computed(() => {
  const status = currentOrder.value?.fulfillmentStatus
  if (status === TRAVEL_FULFILLMENT_STATUS.COMPLETED) return 6
  if (status === TRAVEL_FULFILLMENT_STATUS.IN_TRIP) return 5
  if (status === TRAVEL_FULFILLMENT_STATUS.CHECKED_IN) return 4
  if ([TRAVEL_FULFILLMENT_STATUS.USER_CONFIRMED, TRAVEL_FULFILLMENT_STATUS.QR_ISSUED].includes(status)) return 3
  if (status === TRAVEL_FULFILLMENT_STATUS.PICKUP_CONFIRMED) return 2
  if (status === TRAVEL_FULFILLMENT_STATUS.INFO_SUBMITTED) return 1
  return 0
})
const fulfillmentSteps = computed(() => {
  const active = fulfillmentStepIndex.value
  return [
    { key: 'info', index: '1', title: '用户填写接送信息', desc: '地址、联系人、人数、行李', active: active === 0 || active === 1, done: active > 1 },
    { key: 'pickup', index: '2', title: '平台安排接送', desc: '时间、地点、司机和说明', active: active === 1 || active === 2, done: active > 2 },
    { key: 'confirm', index: '3', title: '用户确认安排', desc: '确认后可发核销码', active: active === 2, done: active > 2 },
    { key: 'checkin', index: '4', title: '出行核销', desc: '发码、扫码或手动核销', active: active === 3, done: active > 3 },
    { key: 'complete', index: '5', title: '行程完成', desc: '开始行程并完成订单', active: active >= 4 && active < 6, done: active >= 6 },
  ]
})
const fulfillmentTip = computed(() => {
  const status = currentOrder.value?.fulfillmentStatus
  if (status === TRAVEL_FULFILLMENT_STATUS.INFO_PENDING) {
    return { tone: 'warn', title: '等待用户填写接送信息', desc: '合同已通过，但用户还没有提交接送地址和紧急联系人，平台暂时不能安排接送。' }
  }
  if (status === TRAVEL_FULFILLMENT_STATUS.INFO_SUBMITTED) {
    return { tone: 'active', title: '现在可以安排接送', desc: '填写接送时间、地点、司机或接待人信息后保存，用户端会进入确认接送安排。' }
  }
  if (status === TRAVEL_FULFILLMENT_STATUS.PICKUP_CONFIRMED) {
    return { tone: 'active', title: '等待用户确认接送', desc: '如接送信息有变化，可以在这里更新安排；用户确认后再生成核销码。' }
  }
  if (status === TRAVEL_FULFILLMENT_STATUS.USER_CONFIRMED) {
    return { tone: 'active', title: '用户已确认，待生成核销码', desc: '点击“生成或补发核销码”，用户到达后可扫码或输入核销码完成核销。' }
  }
  if (status === TRAVEL_FULFILLMENT_STATUS.QR_ISSUED) {
    return { tone: 'active', title: '待出行核销', desc: '扫码用户端二维码，或粘贴核销码后点击确认核销。' }
  }
  if (status === TRAVEL_FULFILLMENT_STATUS.CHECKED_IN) {
    return { tone: 'success', title: '已核销', desc: '可以开始行程，或在行程结束后直接完成订单。' }
  }
  if (status === TRAVEL_FULFILLMENT_STATUS.IN_TRIP) {
    return { tone: 'success', title: '行程中', desc: '行程结束后点击“完成订单”，订单会进入已完成。' }
  }
  if (status === TRAVEL_FULFILLMENT_STATUS.COMPLETED) {
    return { tone: 'success', title: '订单已完成', desc: '该订单履约流程已经闭环。' }
  }
  if (status === TRAVEL_FULFILLMENT_STATUS.EXCEPTION) {
    return { tone: 'danger', title: '订单异常', desc: currentOrder.value?.exceptionReason || '请根据异常原因线下处理后再决定是否取消或恢复。' }
  }
  return { tone: 'warn', title: '暂不可履约', desc: '请先确认合同已签署并通过审核。' }
})
const filtered = computed(() => {
  const key = keyword.value.toLowerCase()
  const type = typeFilter.value.toLowerCase()
  const user = userFilter.value.toLowerCase()
  const phone = phoneFilter.value.toLowerCase()
  return orders.value.filter(order => {
    const text = `${order.orderNo}${order.title}${order.user}${order.phone}`.toLowerCase()
    return matchesStatusView(order)
      && (!key || text.includes(key))
      && (!type || String(order.type || '').toLowerCase().includes(type))
      && (!user || String(order.user || '').toLowerCase().includes(user))
      && (!phone || String(order.phone || '').toLowerCase().includes(phone))
  })
})
const startIndex = computed(() => (page.value - 1) * pageSize.value)
const pagedOrders = computed(() => filtered.value.slice(startIndex.value, startIndex.value + pageSize.value))
const canSavePickupSchedule = computed(() => [
  TRAVEL_FULFILLMENT_STATUS.INFO_SUBMITTED,
  TRAVEL_FULFILLMENT_STATUS.PICKUP_CONFIRMED,
].includes(currentOrder.value?.fulfillmentStatus))
const canAdminCancel = computed(() => currentOrder.value && ![
  TRAVEL_FULFILLMENT_STATUS.CHECKED_IN,
  TRAVEL_FULFILLMENT_STATUS.IN_TRIP,
  TRAVEL_FULFILLMENT_STATUS.COMPLETED,
  TRAVEL_FULFILLMENT_STATUS.CANCELLED,
].includes(currentOrder.value.fulfillmentStatus))

watch(filtered, () => { page.value = 1 })

const contractText = status => travelContractStatusName(status)
const contractClass = status => travelContractTone(status)
const fulfillmentText = status => travelFulfillmentStatusName(status)
const fulfillmentClass = status => travelFulfillmentTone(status)
const statusMap = { [REVIEW_STATUS.PENDING]: 0, [REVIEW_STATUS.APPROVED]: 1, [REVIEW_STATUS.REJECTED]: 2 }
const textToList = text => String(text || '').split(/\n|,|，/).map(item => item.trim()).filter(Boolean)
const listToText = list => (Array.isArray(list) ? list.join('\n') : '')
const normalizeDateDays = value => Math.max(0, Math.min(365, Number.parseInt(value, 10) || 0))
const renderTemplate = order => {
  const content = order?.contractTemplateContent || contractTemplate.content || ''
  const map = {
    order_no: order?.orderNo || '',
    title: order?.title || '',
    agency: order?.raw?.agency || '学徒行平台合作服务方',
    travel_date: order?.date || '待确认',
    signer_name: order?.contractSignerName || order?.user || '待填写',
    signer_phone: order?.contractSignerPhone || order?.phone || '待填写',
    id_no: order?.contractIdNo || '待填写',
    amount_text: order?.amount || '',
  }
  return Object.keys(map).reduce((text, key) => text.replaceAll(`{${key}}`, map[key]), content)
}
const renderedContractContent = computed(() => renderTemplate(currentOrder.value) || '暂无合同内容，请先维护合同模板。')

const mapOrder = order => ({
  id: `travel-${order.id}`,
  rawId: order.id,
  source: 'travel',
  orderNo: order.order_no,
  title: order.title,
  type: order.order_type,
  time: order.created_at ? new Date(order.created_at).toLocaleString('zh-CN') : '-',
  user: order.user_name,
  phone: order.phone,
  date: order.travel_date,
  amount: order.amount_text,
  status: order.status,
  contractStatus: order.contract_status || TRAVEL_CONTRACT_STATUS.UNSIGNED,
  contractSignerName: order.contract_signer_name || '',
  contractSignerPhone: order.contract_signer_phone || '',
  contractIdNo: order.contract_id_no || '',
  contractSignatureData: order.contract_signature_image || order.contract_signature_url || order.contract_signature_data || '',
  contractSignatureUrl: order.contract_signature_url || '',
  contractTemplateVersion: order.contract_template_version || 0,
  contractTemplateSnapshotId: order.contract_template_snapshot_id || 0,
  contractTemplateTitle: order.contract_template_title || '',
  contractTemplateContent: order.contract_template_content || '',
  contractTemplateTravelDateDays: order.contract_template_travel_date_days || 0,
  contractSignedAt: order.contract_signed_at ? new Date(order.contract_signed_at).toLocaleString('zh-CN') : '',
  contractReviewedAt: order.contract_reviewed_at ? new Date(order.contract_reviewed_at).toLocaleString('zh-CN') : '',
  contractRejectReason: order.contract_reject_reason || '',
  fulfillmentStatus: order.fulfillment_status || TRAVEL_FULFILLMENT_STATUS.CONTRACT_PENDING,
  pickupAddress: order.pickup_address || '',
  pickupDetail: order.pickup_detail || '',
  travelerCount: order.traveler_count || 1,
  emergencyContact: order.emergency_contact || '',
  emergencyPhone: order.emergency_phone || '',
  luggageCount: order.luggage_count || 0,
  pickupNote: order.pickup_note || '',
  pickupTime: order.pickup_time || '',
  pickupLocation: order.pickup_location || '',
  driverName: order.driver_name || '',
  driverPhone: order.driver_phone || '',
  vehicleNo: order.vehicle_no || '',
  pickupNotice: order.pickup_notice || '',
  qrToken: order.qr_token || '',
  checkedInAt: order.checked_in_at ? new Date(order.checked_in_at).toLocaleString('zh-CN') : '',
  completedAt: order.completed_at ? new Date(order.completed_at).toLocaleString('zh-CN') : '',
  exceptionReason: order.exception_reason || '',
  raw: order,
})

const mapCustom = item => ({
  id: `custom-${item.id}`,
  rawId: item.id,
  source: 'custom',
  orderNo: item.request_no,
  title: `${item.destination || '人工深度'}定制方案`,
  type: '人工深度定制',
  time: item.created_at ? new Date(item.created_at).toLocaleString('zh-CN') : '-',
  user: item.user_name || item.user_no,
  phone: item.phone,
  date: item.travel_time,
  amount: item.budget,
  status: statusMap[item.status] ?? 0,
  raw: item,
})

const fillPlanForm = order => {
  planForm.plan_title = order?.raw?.plan_title || `${order?.raw?.destination || ''}专属定制方案`
  planForm.plan_summary = order?.raw?.plan_summary || ''
  planForm.plan_price = order?.raw?.plan_price || order?.raw?.budget || ''
  planForm.plan_itinerary_text = listToText(order?.raw?.plan_itinerary)
  planForm.plan_includes_text = listToText(order?.raw?.plan_includes)
  planForm.plan_tips = order?.raw?.plan_tips || ''
}

const loadOrders = async () => {
  try {
    const [travelOrders, customOrders] = await Promise.all([
      api.getOrders().catch(() => []),
      api.getCustomTravelRequests().catch(() => []),
    ])
    orders.value = [
      ...travelOrders.map(mapOrder),
      ...customOrders.map(mapCustom),
    ].sort((a, b) => new Date(b.raw?.created_at || 0) - new Date(a.raw?.created_at || 0))
  } catch (error) {
    emit('toast', error.message || '订单读取失败')
  }
}

const loadTemplate = async () => {
  try {
    const template = await api.getContractTemplate()
    contractTemplate.title = template.title || '旅行服务合同'
    contractTemplate.content = template.content || ''
    contractTemplate.travel_date_days = normalizeDateDays(template.travel_date_days ?? 30)
    contractTemplate.travel_date_options = Array.isArray(template.travel_date_options) ? template.travel_date_options : []
  } catch (error) {
    emit('toast', error.message || '合同模板读取失败')
  }
}

const openPlan = order => {
  currentOrder.value = order
  fillPlanForm(order)
  planError.value = ''
  planVisible.value = true
}

const openDetail = order => {
  if (order.source === 'custom') openPlan(order)
  else emit('toast', '普通订单详情已展开')
}

const closePlan = () => {
  planVisible.value = false
  currentOrder.value = null
  planError.value = ''
}

const openContract = order => {
  currentOrder.value = order
  contractRejectReason.value = order.contractRejectReason || ''
  loadTemplate()
  contractVisible.value = true
}

const closeContract = () => {
  contractVisible.value = false
  currentOrder.value = null
  contractRejectReason.value = ''
}

const fillFulfillmentForm = order => {
  fulfillmentForm.pickup_time = order?.pickupTime || ''
  fulfillmentForm.pickup_location = order?.pickupLocation || ''
  fulfillmentForm.driver_name = order?.driverName || ''
  fulfillmentForm.driver_phone = order?.driverPhone || ''
  fulfillmentForm.vehicle_no = order?.vehicleNo || ''
  fulfillmentForm.pickup_notice = order?.pickupNotice || ''
}

const openFulfillment = order => {
  currentOrder.value = order
  checkinTokenInput.value = order.qrToken || ''
  fillFulfillmentForm(order)
  fulfillmentVisible.value = true
}

const closeFulfillment = () => {
  stopScanner()
  fulfillmentVisible.value = false
  currentOrder.value = null
  checkinTokenInput.value = ''
}

const mergeTravelOrder = saved => {
  const mapped = mapOrder(saved)
  const index = orders.value.findIndex(item => item.id === mapped.id)
  if (index >= 0) orders.value.splice(index, 1, mapped)
  if (currentOrder.value?.id === mapped.id) {
    currentOrder.value = mapped
    checkinTokenInput.value = mapped.qrToken || ''
    fillFulfillmentForm(mapped)
  }
  return mapped
}

const schedulePickup = async () => {
  if (!currentOrder.value || fulfillmentBusy.value) return
  if (!currentOrder.value.pickupAddress) {
    emit('toast', '用户还没有提交接送信息')
    return
  }
  if (!fulfillmentForm.pickup_time.trim() || !fulfillmentForm.pickup_location.trim()) {
    emit('toast', '请填写接送时间和接送地点')
    return
  }
  fulfillmentBusy.value = true
  try {
    const saved = await api.scheduleOrderPickup(currentOrder.value.rawId, { ...fulfillmentForm })
    mergeTravelOrder(saved)
    emit('toast', '接送安排已保存')
  } catch (error) {
    emit('toast', error.message || '接送安排保存失败')
  } finally {
    fulfillmentBusy.value = false
  }
}

const issueQr = async () => {
  if (!currentOrder.value || fulfillmentBusy.value) return
  fulfillmentBusy.value = true
  try {
    const saved = await api.issueOrderQr(currentOrder.value.rawId)
    mergeTravelOrder(saved)
    emit('toast', '核销码已生成')
  } catch (error) {
    emit('toast', error.message || '核销码生成失败')
  } finally {
    fulfillmentBusy.value = false
  }
}

const extractCheckinToken = value => {
  const raw = String(value || '').trim()
  if (!raw) return ''
  const schemeMatch = raw.match(/xuetuxing-checkin:\/\/([^?&#\s]+)/i)
  if (schemeMatch) return decodeURIComponent(schemeMatch[1])
  try {
    const url = new URL(raw)
    return url.searchParams.get('token') || url.searchParams.get('checkin') || raw
  } catch {
    return raw
  }
}

const stopScanner = () => {
  scanActive.value = false
  if (scannerStream) {
    scannerStream.getTracks().forEach(track => track.stop())
    scannerStream = null
  }
}

const toggleScanner = async () => {
  if (scanActive.value) {
    stopScanner()
    return
  }
  if (!navigator?.mediaDevices?.getUserMedia || !('BarcodeDetector' in window)) {
    emit('toast', '当前浏览器不支持摄像头扫码，请粘贴二维码内容或手动输入核销码')
    return
  }
  scanActive.value = true
  await nextTick()
  const container = document.getElementById('checkinScanner')
  if (!container) return
  container.innerHTML = ''
  const video = document.createElement('video')
  video.setAttribute('playsinline', 'true')
  video.autoplay = true
  container.appendChild(video)
  try {
    scannerStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    video.srcObject = scannerStream
    const detector = new BarcodeDetector({ formats: ['qr_code'] })
    const scan = async () => {
      if (!scanActive.value || !scannerStream) return
      try {
        const codes = await detector.detect(video)
        if (codes.length) {
          checkinTokenInput.value = codes[0].rawValue || ''
          stopScanner()
          emit('toast', '已识别二维码，请点击确认核销')
          return
        }
      } catch {}
      requestAnimationFrame(scan)
    }
    scan()
  } catch (error) {
    stopScanner()
    emit('toast', '无法打开摄像头，请检查浏览器权限')
  }
}

const checkIn = async () => {
  if (!currentOrder.value || fulfillmentBusy.value) return
  const token = extractCheckinToken(checkinTokenInput.value || currentOrder.value.qrToken)
  if (!token) {
    emit('toast', '请先扫码或输入核销码')
    return
  }
  fulfillmentBusy.value = true
  try {
    const saved = await api.checkInOrder(currentOrder.value.rawId, token)
    mergeTravelOrder(saved)
    stopScanner()
    emit('toast', '核销成功')
  } catch (error) {
    emit('toast', error.message || '核销失败')
  } finally {
    fulfillmentBusy.value = false
  }
}

const startTrip = async () => {
  if (!currentOrder.value || fulfillmentBusy.value) return
  fulfillmentBusy.value = true
  try {
    const saved = await api.startOrderTrip(currentOrder.value.rawId)
    mergeTravelOrder(saved)
    emit('toast', '行程已开始')
  } catch (error) {
    emit('toast', error.message || '开始行程失败')
  } finally {
    fulfillmentBusy.value = false
  }
}

const completeTrip = async () => {
  if (!currentOrder.value || fulfillmentBusy.value) return
  fulfillmentBusy.value = true
  try {
    const saved = await api.completeOrder(currentOrder.value.rawId)
    mergeTravelOrder(saved)
    emit('toast', '订单已完成')
  } catch (error) {
    emit('toast', error.message || '完成订单失败')
  } finally {
    fulfillmentBusy.value = false
  }
}

const cancelOrder = async () => {
  if (!currentOrder.value || fulfillmentBusy.value) return
  const reason = window.prompt('请输入取消原因', '平台协商取消') || ''
  if (reason.trim().length < 2) return
  fulfillmentBusy.value = true
  try {
    const saved = await api.cancelTravelOrder(currentOrder.value.rawId, reason.trim())
    mergeTravelOrder(saved)
    emit('toast', saved.points_refunded ? '订单已取消，积分与库存已恢复' : '订单已取消')
  } catch (error) {
    emit('toast', error.message || '取消订单失败')
  } finally {
    fulfillmentBusy.value = false
  }
}

const markException = async () => {
  if (!currentOrder.value || fulfillmentBusy.value) return
  const reason = window.prompt('请输入异常原因', currentOrder.value.exceptionReason || '用户未到 / 接送变更') || ''
  if (!reason.trim()) return
  fulfillmentBusy.value = true
  try {
    const saved = await api.markOrderException(currentOrder.value.rawId, reason.trim())
    mergeTravelOrder(saved)
    emit('toast', '已标记异常')
  } catch (error) {
    emit('toast', error.message || '标记异常失败')
  } finally {
    fulfillmentBusy.value = false
  }
}

const openTemplateModal = async () => {
  await loadTemplate()
  templateForm.title = contractTemplate.title
  templateForm.content = contractTemplate.content
  templateForm.travel_date_days = normalizeDateDays(contractTemplate.travel_date_days)
  templateError.value = ''
  templateVisible.value = true
}

const closeTemplateModal = () => {
  templateVisible.value = false
  templateError.value = ''
}

const saveTemplate = async () => {
  if (!templateForm.title.trim()) {
    templateError.value = '请填写合同标题'
    return
  }
  if (!templateForm.content.trim()) {
    templateError.value = '请填写合同内容'
    return
  }
  savingTemplate.value = true
  templateError.value = ''
  try {
    const saved = await api.saveContractTemplate({
      title: templateForm.title,
      content: templateForm.content,
      travel_date_days: normalizeDateDays(templateForm.travel_date_days),
    })
    contractTemplate.title = saved.title
    contractTemplate.content = saved.content
    contractTemplate.travel_date_days = normalizeDateDays(saved.travel_date_days)
    contractTemplate.travel_date_options = saved.travel_date_options || []
    emit('toast', '合同模板已保存')
    closeTemplateModal()
  } catch (error) {
    templateError.value = error.message || '合同模板保存失败'
    emit('toast', templateError.value)
  } finally {
    savingTemplate.value = false
  }
}

const reviewContract = async approved => {
  if (!currentOrder.value || contractReviewBusy.value) return
  if (!approved && !contractRejectReason.value.trim()) {
    emit('toast', '驳回合同时请填写原因')
    return
  }
  const orderId = currentOrder.value.id
  const rawId = currentOrder.value.rawId
  contractReviewBusy.value = true
  try {
    const saved = await api.reviewOrderContract(rawId, {
      approved,
      reject_reason: approved ? '' : contractRejectReason.value,
    })
    const mapped = mapOrder(saved)
    const index = orders.value.findIndex(item => item.id === orderId)
    if (index >= 0) orders.value.splice(index, 1, mapped)
    emit('toast', approved ? '合同已审核通过' : '合同已驳回')
    closeContract()
  } catch (error) {
    emit('toast', error.message || '合同审核失败')
  } finally {
    contractReviewBusy.value = false
  }
}

const approveCustom = async () => {
  if (!currentOrder.value || reviewingCustom.value) return
  if (!planForm.plan_title.trim()) {
    planError.value = '请填写方案标题'
    emit('toast', '请填写方案标题')
    return
  }
  if (!planForm.plan_summary.trim()) {
    planError.value = '请填写方案说明'
    emit('toast', '请填写方案说明')
    return
  }
  planError.value = ''
  reviewingCustom.value = true
  try {
    const saved = await api.reviewCustomTravelRequest(currentOrder.value.rawId, {
      approved: true,
      plan_title: planForm.plan_title,
      plan_summary: planForm.plan_summary,
      plan_price: planForm.plan_price,
      plan_itinerary: textToList(planForm.plan_itinerary_text),
      plan_includes: textToList(planForm.plan_includes_text),
      plan_tips: planForm.plan_tips,
    })
    const mapped = mapCustom(saved)
    const index = orders.value.findIndex(item => item.id === currentOrder.value.id)
    if (index >= 0) orders.value.splice(index, 1, mapped)
    emit('toast', '方案已审核通过，并同步到用户端')
    closePlan()
  } catch (error) {
    emit('toast', error.message || '审核失败')
  } finally {
    reviewingCustom.value = false
  }
}

const rejectCustom = async () => {
  const reason = window.prompt('请输入驳回原因', currentOrder.value.raw?.reject_reason || '暂时无法匹配合适方案，请调整需求后重新提交') || ''
  if (!reason.trim()) return
  reviewingCustom.value = true
  try {
    const saved = await api.reviewCustomTravelRequest(currentOrder.value.rawId, {
      approved: false,
      reject_reason: reason,
    })
    const mapped = mapCustom(saved)
    const index = orders.value.findIndex(item => item.id === currentOrder.value.id)
    if (index >= 0) orders.value.splice(index, 1, mapped)
    emit('toast', '需求已驳回，并同步到用户端')
    closePlan()
  } catch (error) {
    emit('toast', error.message || '驳回失败')
  } finally {
    reviewingCustom.value = false
  }
}

onMounted(() => {
  loadOrders()
  loadTemplate()
})
</script>

<style scoped>
.order-hero-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.order-hero-actions button {
  border: 1px solid #dce6e2;
  border-radius: 14px;
  background: rgba(255,255,255,.84);
  color: #173f38;
  padding: 10px 14px;
  font-weight: 900;
  cursor: pointer;
}

.order-hero-actions button.active {
  border-color: #173f38;
  background: #173f38;
  color: #fff;
}

.order-hero-actions span {
  margin-left: 4px;
  opacity: .8;
}

.order-grid-table {
  min-width: 1280px;
}

.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(15, 35, 32, .42);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28px;
}

.plan-modal {
  width: min(760px, 94vw);
  max-height: 90vh;
  overflow: auto;
  background: #fff;
  border-radius: 28px;
  padding: 28px;
  box-shadow: 0 26px 80px rgba(23, 63, 56, .22);
}

.modal-head {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 18px;
}

.modal-head h2 {
  margin: 6px 0;
}

.modal-head p {
  margin: 0;
  color: #7b8a86;
}

.modal-head button {
  width: 42px;
  height: 42px;
  border: 0;
  border-radius: 14px;
  background: #f3f6f4;
  font-size: 24px;
  cursor: pointer;
}

.fulfillment-modal {
  position: relative;
  padding-top: 28px;
}

.fulfillment-modal .modal-head {
  padding-right: 64px;
}

.modal-fixed-close {
  position: sticky;
  top: 0;
  float: right;
  z-index: 20;
  width: 42px;
  height: 42px;
  margin: 0 0 -42px auto;
  border: 0;
  border-radius: 14px;
  background: #f3f6f4;
  color: #173f38;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 10px 26px rgba(23, 63, 56, .1);
}

.request-box {
  padding: 18px;
  border-radius: 20px;
  background: #f6faf8;
  margin-bottom: 18px;
}

.fulfillment-steps {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}

.fulfillment-steps article {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  min-width: 0;
  padding: 12px;
  border: 1px solid #e3ebe8;
  border-radius: 18px;
  background: #fbfdfc;
  color: #7a8a86;
}

.fulfillment-steps article i {
  flex: 0 0 26px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #edf4f1;
  color: #60736e;
  font-style: normal;
  font-size: 12px;
  font-weight: 900;
}

.fulfillment-steps article b,
.fulfillment-steps article span {
  display: block;
}

.fulfillment-steps article b {
  color: #213f39;
  font-size: 13px;
  line-height: 1.35;
}

.fulfillment-steps article span {
  margin-top: 4px;
  font-size: 11px;
  line-height: 1.4;
}

.fulfillment-steps article.done {
  border-color: #bde7d9;
  background: #f2fbf7;
}

.fulfillment-steps article.done i {
  background: #16a085;
  color: #fff;
}

.fulfillment-steps article.active {
  border-color: #ffb779;
  background: #fff8f1;
  box-shadow: 0 12px 30px rgba(232, 111, 39, .12);
}

.fulfillment-steps article.active i {
  background: #ff7a35;
  color: #fff;
}

.fulfillment-tip,
.pending-box {
  padding: 14px 16px;
  border-radius: 18px;
  margin-bottom: 16px;
  border: 1px solid #dfe9e5;
}

.fulfillment-tip b,
.fulfillment-tip p {
  display: block;
  margin: 0;
}

.fulfillment-tip b {
  color: #173f38;
  font-size: 15px;
}

.fulfillment-tip p {
  margin-top: 6px;
  color: #5f716c;
  line-height: 1.6;
}

.fulfillment-tip.active {
  border-color: #ffd3ad;
  background: #fff8f1;
}

.fulfillment-tip.warn,
.pending-box {
  border-color: #f0d9a8;
  background: #fffbef;
  color: #80612b;
}

.fulfillment-tip.success {
  border-color: #bde7d9;
  background: #effaf6;
}

.fulfillment-tip.danger {
  border-color: #f2c0b7;
  background: #fff4f2;
}

.pending-box {
  margin-top: 16px;
  font-weight: 800;
  line-height: 1.6;
}

.request-box p {
  margin: 8px 0 0;
  color: #526560;
}

.signature-preview {
  padding: 18px;
  border: 1px solid #e1ebe7;
  border-radius: 20px;
  background: #fbfdfc;
}

.contract-text-preview {
  padding: 18px;
  border: 1px solid #e1ebe7;
  border-radius: 20px;
  background: #fff;
  margin-bottom: 18px;
}

.contract-text-preview b {
  display: block;
  color: #173f38;
  margin-bottom: 12px;
}

.contract-text-preview pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  color: #526560;
  font: inherit;
  line-height: 1.7;
}

.signature-preview b {
  display: block;
  color: #173f38;
  margin-bottom: 12px;
}

.signature-preview img {
  width: 100%;
  min-height: 170px;
  max-height: 260px;
  object-fit: contain;
  border-radius: 14px;
  background: #fff;
  border: 1px dashed #d7e2de;
}

.signature-preview p,
.contract-locked {
  margin: 0;
  color: #7b8a86;
}

.checkin-box {
  padding: 18px;
  border: 1px solid #e1ebe7;
  border-radius: 20px;
  background: #173f38;
  color: #fff;
  margin-bottom: 18px;
}

.checkin-box b {
  display: block;
  margin-bottom: 8px;
}

.checkin-box p {
  margin: 0;
  word-break: break-all;
  font-weight: 900;
  letter-spacing: .03em;
}

.contract-locked {
  margin-top: 18px;
  padding: 14px 16px;
  border-radius: 16px;
  background: #f3f7f5;
  font-weight: 800;
}

.plan-modal label {
  display: block;
  margin: 14px 0 8px;
  color: #173f38;
  font-weight: 900;
}

.plan-modal input,
.plan-modal textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #dfe9e5;
  border-radius: 16px;
  padding: 13px 15px;
  outline: none;
  color: #173f38;
  background: #fbfdfc;
}

.plan-modal textarea {
  min-height: 96px;
  resize: vertical;
}

.plan-modal .contract-template-textarea {
  min-height: 240px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 22px;
}

.plan-error {
  margin-top: 16px;
  padding: 12px 14px;
  border-radius: 14px;
  background: #fff0e9;
  color: #b34827;
  font-size: 13px;
  font-weight: 900;
}

.modal-actions button {
  border: 0;
  border-radius: 16px;
  padding: 13px 18px;
  font-weight: 900;
  cursor: pointer;
}

.modal-actions .danger {
  color: #b34827;
  background: #fff0e9;
}

.modal-actions .primary {
  color: #fff;
  background: #173f38;
}

.checkin-panel {
  margin-top: 18px;
  padding: 16px;
  border-radius: 18px;
  background: #f6faf8;
  border: 1px solid #dfe9e5;
}

.checkin-panel b,
.checkin-panel p {
  display: block;
  margin: 0 0 10px;
}

.checkin-panel b {
  color: #173f38;
}

.checkin-panel p {
  color: #62736e;
  font-size: 13px;
}

.scanner-box {
  width: 100%;
  max-width: 360px;
  aspect-ratio: 1;
  margin: 12px 0;
  overflow: hidden;
  border-radius: 18px;
  background: #102f2b;
}

.scanner-box video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.compact-actions {
  justify-content: flex-start;
  margin-top: 12px;
  flex-wrap: wrap;
}

@media (max-width: 900px) {
  .fulfillment-steps {
    grid-template-columns: 1fr;
  }
}
</style>




