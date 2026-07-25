<template>
  <section class="page-content admin-grid-page user-manager">
    <div class="admin-grid-hero">
      <div>
        <span class="admin-grid-eyebrow">用户管理</span>
        <h1>用户管理</h1>
        <p>查看用户详情、录取通知书认证、客服状态，并支持账户停用、注销和密码管理。</p>
      </div>
      <button class="ghost-btn compact" @click="load">刷新</button>
    </div>

    <div class="admin-grid-stats">
      <article><i>总</i><div><small>用户总数</small><strong>{{ summary.total_users }}</strong></div></article>
      <article><i class="orange">注</i><div><small>已注册用户</small><strong>{{ summary.registered_users }}</strong></div></article>
      <article><i class="lime">活</i><div><small>正常账户</small><strong>{{ summary.active_users }}</strong></div></article>
      <article><i class="gray">审</i><div><small>待审核用户</small><strong>{{ summary.pending_users }}</strong></div></article>
    </div>

    <div class="admin-grid-card">
      <div class="admin-grid-table-wrap">
        <table class="admin-grid-table user-grid-table">
          <thead>
            <tr class="group-head">
              <th class="admin-grid-num"></th>
              <th colspan="2">用户信息</th>
              <th colspan="2">账户资产</th>
              <th colspan="2">服务状态</th>
              <th>操作</th>
            </tr>
            <tr class="head">
              <th class="admin-grid-num">#</th>
              <th>用户 <button>⋮</button></th>
              <th>手机号 <button>⋮</button></th>
              <th>积分 / 余额 <button>⋮</button></th>
              <th>通知书认证 <button>⋮</button></th>
              <th>客服情况 <button>⋮</button></th>
              <th>最近登录 <button>⋮</button></th>
              <th>操作</th>
            </tr>
            <tr class="filters">
              <th></th>
              <th><input class="filter-control" v-model.trim="keyword" placeholder="昵称 / 用户ID / 手机号"></th>
              <th>
                <select class="filter-control" v-model="registeredFilter">
                  <option value="all">全部用户</option>
                  <option value="registered">已通过审核</option>
                  <option value="pending">待审核 / 未注册</option>
                </select>
              </th>
              <th></th>
              <th>
                <select class="filter-control" v-model="certFilter">
                  <option value="all">全部认证</option>
                  <option value="pending">待审核</option>
                  <option value="approved">已认证</option>
                  <option value="rejected">已驳回</option>
                  <option value="not_submitted">未提交</option>
                </select>
              </th>
              <th></th>
              <th>
                <select class="filter-control" v-model="statusFilter">
                  <option value="all">全部状态</option>
                  <option value="active">正常</option>
                  <option value="pending">待审核</option>
                  <option value="disabled">停用</option>
                  <option value="cancelled">已注销</option>
                </select>
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(user, index) in pagedUsers" :key="user.id">
              <td class="admin-grid-num">{{ startIndex + index + 1 }}</td>
              <td>
                <div class="admin-grid-main">
                  <div class="admin-grid-avatar">{{ user.nickname.slice(0, 1) }}</div>
                  <div><b>{{ user.nickname }}</b><small>{{ user.user_no }}</small></div>
                </div>
              </td>
              <td><b>{{ user.phone }}</b><small>{{ user.is_registered ? '已注册' : '未注册' }}</small></td>
              <td><b>{{ user.points }} 积分</b><small>余额 ¥{{ money(user.balance) }} · {{ user.exam_status }}</small></td>
              <td>
                <span :class="['admin-grid-pill', certClass(user.graduation_status)]">{{ graduationText(user.graduation_status) }}</span>
                <small>录取通知书</small>
              </td>
              <td><b>{{ user.conversation_count }} 次会话</b><small>{{ user.open_conversation ? '当前有进行中会话' : '当前无进行中会话' }}</small></td>
              <td><b>{{ format(user.last_login_at) }}</b><small>创建于 {{ format(user.created_at) }}</small></td>
              <td>
                <div class="admin-grid-actions">
                  <button @click="openDetail(user)">详情</button>
                  <button class="green" @click="openWallet(user)">余额</button>
                  <button class="green" @click="openPoints(user)">积分</button>
                  <button class="orange" @click="openPassword(user)">改密码</button>
                  <button @click="setStatus(user, user.status === 'disabled' ? 'active' : 'disabled')">
                    {{ user.status === 'disabled' ? '恢复' : '停用' }}
                  </button>
                  <button class="danger" @click="setStatus(user, 'cancelled')">注销</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="!filtered.length" class="admin-grid-empty">没有符合当前筛选条件的用户</div>
      </div>
      <PaginationBar v-model:page="page" v-model:page-size="pageSize" :total="filtered.length" />
    </div>

    <div v-if="showDetailDialog" class="dialog-mask" @click.self="closeDetail">
      <section class="dialog user-detail-dialog">
        <div class="dialog-head">
          <div>
            <h2>用户详情</h2>
            <p>{{ activeDetail?.user.nickname }} / {{ activeDetail?.user.user_no }}</p>
          </div>
          <button type="button" @click="closeDetail">×</button>
        </div>
        <div v-if="detailLoading" class="detail-loading">正在加载用户详情...</div>
        <div v-else-if="activeDetail" class="dialog-body detail-body">
          <section class="detail-section">
            <div class="detail-section-head">
              <b>基本资料</b>
              <span :class="['admin-grid-pill', statusPillClass(activeDetail.user.status)]">{{ statusText(activeDetail.user.status) }}</span>
            </div>
            <div class="detail-grid">
              <label><span>用户昵称</span><b>{{ activeDetail.user.nickname }}</b></label>
              <label><span>手机号</span><b>{{ activeDetail.user.phone }}</b></label>
              <label><span>用户 ID</span><b>{{ activeDetail.user.user_no }}</b></label>
              <label><span>积分</span><b>{{ activeDetail.user.points }} 积分</b></label>
              <label><span>当前身份</span><b>{{ activeDetail.user.exam_status }}</b></label>
              <label><span>最近登录</span><b>{{ format(activeDetail.user.last_login_at) }}</b></label>
            </div>
          </section>

          <section class="detail-section certificate-section">
            <div class="detail-section-head">
              <div>
                <b>录取通知书认证</b>
                <small>人工核验用户提交的录取信息和通知书图片</small>
              </div>
              <span :class="['admin-grid-pill', certClass(certificate?.status)]">{{ graduationText(certificate?.status) }}</span>
            </div>

            <div v-if="!certificate" class="certificate-empty">该用户尚未提交录取通知书认证。</div>
            <template v-else>
              <div class="certificate-layout">
                <a class="certificate-image" :href="resolveApiAssetUrl(certificate.certificate_image)" target="_blank" rel="noopener">
                  <img :src="resolveApiAssetUrl(certificate.certificate_image)" alt="用户上传的录取通知书">
                  <span>点击查看原图</span>
                </a>
                <div class="certificate-info">
                  <label><span>真实姓名</span><b>{{ certificate.real_name }}</b></label>
                  <label><span>录取院校</span><b>{{ certificate.school_name }}</b></label>
                  <label><span>录取专业</span><b>{{ certificate.major_name || '未填写' }}</b></label>
                  <label><span>通知书日期</span><b>{{ certificate.graduation_date || '未填写' }}</b></label>
                  <label><span>通知书编号 / 考生号</span><b>{{ certificate.certificate_no || '未填写' }}</b></label>
                  <label><span>提交时间</span><b>{{ format(certificate.updated_at) }}</b></label>
                </div>
              </div>
              <div v-if="certificate.reject_reason" class="detail-reject">上次驳回原因：{{ certificate.reject_reason }}</div>
              <div v-if="certificate.status === 'pending'" class="review-panel">
                <textarea v-model.trim="reviewReason" maxlength="255" placeholder="驳回时请填写原因；通过认证可直接点击“审核通过”"></textarea>
                <div>
                  <button class="reject-review" @click="reviewCertificate(false)">驳回认证</button>
                  <button class="approve-review" @click="reviewCertificate(true)">审核通过</button>
                </div>
              </div>
            </template>
          </section>
        </div>
      </section>
    </div>

    <div v-if="showPasswordDialog" class="dialog-mask" @click.self="closePassword">
      <form class="dialog small-dialog" @submit.prevent="submitPassword">
        <div class="dialog-head">
          <div>
            <h2>修改用户密码</h2>
            <p>{{ activeUser?.nickname }} / {{ activeUser?.phone }}</p>
          </div>
          <button type="button" @click="closePassword">×</button>
        </div>
        <div class="dialog-body">
          <label class="dialog-field">
            <span>新密码</span>
            <input v-model.trim="newPassword" type="password" placeholder="至少 6 位" />
          </label>
          <small class="soft-tip">修改后会让该用户重新登录。</small>
        </div>
        <div class="dialog-actions">
          <button type="button" @click="closePassword">取消</button>
          <button class="primary-btn" type="submit">确认修改</button>
        </div>
      </form>
    </div>

    <div v-if="showWalletDialog" class="dialog-mask" @click.self="closeWallet">
      <form class="dialog small-dialog" @submit.prevent="submitWallet">
        <div class="dialog-head">
          <div>
            <h2>调整用户余额</h2>
            <p>{{ activeUser?.nickname }} / 当前余额 ¥{{ money(activeUser?.balance) }}</p>
          </div>
          <button type="button" @click="closeWallet">×</button>
        </div>
        <div class="dialog-body">
          <label class="dialog-field">
            <span>调整方式</span>
            <select v-model="walletForm.direction">
              <option value="income">充值 / 增加余额</option>
              <option value="expense">扣减余额</option>
            </select>
          </label>
          <label class="dialog-field">
            <span>金额</span>
            <input v-model.trim="walletForm.amount" type="number" min="0.01" step="0.01" placeholder="例如 99.00" />
          </label>
          <label class="dialog-field">
            <span>备注</span>
            <input v-model.trim="walletForm.remark" type="text" placeholder="如：线下收款充值 / 售后扣减" />
          </label>
          <small class="soft-tip">余额流水会写入后端，后续接微信支付时可复用同一套订单和钱包记录。</small>
        </div>
        <div class="dialog-actions">
          <button type="button" @click="closeWallet">取消</button>
          <button class="primary-btn" type="submit">确认调整</button>
        </div>
      </form>
    </div>

    <div v-if="showPointsDialog" class="dialog-mask" @click.self="closePoints">
      <form class="dialog small-dialog" @submit.prevent="submitPoints">
        <div class="dialog-head">
          <div>
            <h2>调整用户积分</h2>
            <p>{{ activeUser?.nickname }} / 当前积分 {{ activeUser?.points || 0 }}</p>
          </div>
          <button type="button" @click="closePoints">×</button>
        </div>
        <div class="dialog-body">
          <label class="dialog-field">
            <span>调整方式</span>
            <select v-model="pointsForm.direction">
              <option value="income">增加积分</option>
              <option value="expense">扣减积分</option>
            </select>
          </label>
          <label class="dialog-field">
            <span>积分数量</span>
            <input v-model.trim="pointsForm.amount" type="number" min="1" step="1" placeholder="例如 100" />
          </label>
          <label class="dialog-field">
            <span>备注</span>
            <input v-model.trim="pointsForm.remark" type="text" placeholder="如：后台补发 / 活动扣减" />
          </label>
          <small class="soft-tip">扣减积分时会校验当前积分，不能扣成负数。</small>
        </div>
        <div class="dialog-actions">
          <button type="button" @click="closePoints">取消</button>
          <button class="primary-btn" type="submit">确认调整</button>
        </div>
      </form>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { api, resolveApiAssetUrl } from '../services/api'
import PaginationBar from './PaginationBar.vue'

const emit = defineEmits(['toast'])

const summary = ref({ total_users: 0, registered_users: 0, admin_users: 0, active_users: 0, pending_users: 0 })
const rows = ref([])
const keyword = ref('')
const registeredFilter = ref('all')
const certFilter = ref('all')
const statusFilter = ref('all')
const page = ref(1)
const pageSize = ref(10)
const showPasswordDialog = ref(false)
const activeUser = ref(null)
const newPassword = ref('')
const showWalletDialog = ref(false)
const walletForm = ref({ direction: 'income', amount: '', remark: '' })
const showPointsDialog = ref(false)
const pointsForm = ref({ direction: 'income', amount: '', remark: '' })
const showDetailDialog = ref(false)
const activeDetail = ref(null)
const detailLoading = ref(false)
const reviewReason = ref('')
const certificate = computed(() => activeDetail.value?.graduation_certification || null)

const registeredOnly = computed(() => registeredFilter.value === 'registered')
const filtered = computed(() => {
  const key = keyword.value.toLowerCase()
  return rows.value.filter(item => {
    const text = `${item.nickname}${item.user_no}${item.phone}`.toLowerCase()
    const registeredOk = registeredFilter.value === 'all'
      || (registeredFilter.value === 'registered' ? item.is_registered : !item.is_registered || item.status === 'pending')
    const certOk = certFilter.value === 'all' || (item.graduation_status || 'not_submitted') === certFilter.value
    const statusOk = statusFilter.value === 'all' || item.status === statusFilter.value
    return (!key || text.includes(key)) && registeredOk && certOk && statusOk
  })
})
const startIndex = computed(() => (page.value - 1) * pageSize.value)
const pagedUsers = computed(() => filtered.value.slice(startIndex.value, startIndex.value + pageSize.value))
watch(filtered, () => { page.value = 1 })

const format = value => (value ? new Date(value).toLocaleString('zh-CN') : '暂未登录')
const money = value => Number(value || 0).toFixed(2)
const statusText = status => ({ active: '正常', pending: '待审核', disabled: '停用', cancelled: '已注销', rejected: '已驳回' }[status] || status)
const statusPillClass = status => (status === 'active' ? 'green' : status === 'disabled' || status === 'cancelled' || status === 'rejected' ? 'red' : 'orange')
const graduationText = status => ({
  not_submitted: '未提交认证',
  pending: '通知书待审核',
  approved: '通知书已认证',
  rejected: '通知书已驳回',
}[status || 'not_submitted'])
const certClass = status => ({ pending: 'orange', approved: 'green', rejected: 'red', not_submitted: 'gray' }[status || 'not_submitted'])

const load = async () => {
  try {
    const result = await api.getUsers(registeredOnly.value)
    summary.value = result.summary
    rows.value = result.users
  } catch (error) {
    emit('toast', error.message || '用户数据加载失败')
  }
}

const updateRow = next => {
  const index = rows.value.findIndex(item => item.id === next.id)
  if (index >= 0) rows.value.splice(index, 1, next)
}

const openDetail = async user => {
  showDetailDialog.value = true
  detailLoading.value = true
  activeDetail.value = { user, graduation_certification: null }
  reviewReason.value = ''
  try {
    activeDetail.value = await api.getUserDetail(user.id)
  } catch (error) {
    emit('toast', error.message || '用户详情加载失败')
    closeDetail()
  } finally {
    detailLoading.value = false
  }
}

const closeDetail = () => {
  showDetailDialog.value = false
  activeDetail.value = null
  reviewReason.value = ''
}

const reviewCertificate = async approved => {
  if (!activeDetail.value) return
  if (!approved && !reviewReason.value) {
    emit('toast', '驳回认证时请填写原因')
    return
  }
  const action = approved ? '通过' : '驳回'
  if (!confirm(`确认${action}该用户的录取通知书认证吗？`)) return
  try {
    activeDetail.value = await api.reviewGraduation(activeDetail.value.user.id, approved, reviewReason.value)
    updateRow(activeDetail.value.user)
    reviewReason.value = ''
    emit('toast', `录取通知书认证已${action}`)
  } catch (error) {
    emit('toast', error.message || '录取通知书审核失败')
  }
}

const setStatus = async (user, status) => {
  const actionText = { active: '恢复', disabled: '停用', cancelled: '注销' }[status] || '更新'
  if (!confirm(`确认${actionText}用户 ${user.nickname} 吗？`)) return
  try {
    const saved = await api.updateUserStatus(user.id, status)
    updateRow(saved)
    await load()
    emit('toast', `已${actionText}该用户`)
  } catch (error) {
    emit('toast', error.message || '状态修改失败')
  }
}

const openPassword = user => {
  activeUser.value = user
  newPassword.value = ''
  showPasswordDialog.value = true
}

const closePassword = () => {
  showPasswordDialog.value = false
  activeUser.value = null
  newPassword.value = ''
}

const openWallet = user => {
  activeUser.value = user
  walletForm.value = { direction: 'income', amount: '', remark: '' }
  showWalletDialog.value = true
}

const closeWallet = () => {
  showWalletDialog.value = false
  activeUser.value = null
  walletForm.value = { direction: 'income', amount: '', remark: '' }
}

const submitWallet = async () => {
  if (!activeUser.value) return
  const amount = Number(walletForm.value.amount)
  if (!amount || amount <= 0) {
    emit('toast', '请输入正确的余额金额')
    return
  }
  try {
    const saved = await api.adjustUserWallet(activeUser.value.id, {
      direction: walletForm.value.direction,
      amount,
      remark: walletForm.value.remark,
    })
    updateRow(saved)
    closeWallet()
    emit('toast', '用户余额已更新')
  } catch (error) {
    emit('toast', error.message || '余额调整失败')
  }
}

const openPoints = user => {
  activeUser.value = user
  pointsForm.value = { direction: 'income', amount: '', remark: '' }
  showPointsDialog.value = true
}

const closePoints = () => {
  showPointsDialog.value = false
  activeUser.value = null
  pointsForm.value = { direction: 'income', amount: '', remark: '' }
}

const submitPoints = async () => {
  if (!activeUser.value) return
  const amount = Number(pointsForm.value.amount)
  if (!Number.isInteger(amount) || amount <= 0) {
    emit('toast', '请输入正确的积分数量')
    return
  }
  try {
    const saved = await api.adjustUserPoints(activeUser.value.id, {
      direction: pointsForm.value.direction,
      amount,
      remark: pointsForm.value.remark,
    })
    updateRow(saved)
    closePoints()
    emit('toast', '用户积分已更新')
  } catch (error) {
    emit('toast', error.message || '积分调整失败')
  }
}

const submitPassword = async () => {
  if (!activeUser.value) return
  if (newPassword.value.length < 6) {
    emit('toast', '新密码至少 6 位')
    return
  }
  try {
    const saved = await api.resetUserPassword(activeUser.value.id, newPassword.value)
    updateRow(saved)
    closePassword()
    emit('toast', '用户密码已修改')
  } catch (error) {
    emit('toast', error.message || '密码修改失败')
  }
}

watch(registeredFilter, load)
onMounted(load)
</script>

<style scoped>
.user-grid-table {
  min-width: 1280px;
}

.small-dialog {
  width: 420px;
}

.dialog-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dialog-field span {
  font-size: 13px;
  color: #5f716d;
}

.dialog-field input,
.dialog-field select {
  height: 42px;
  border: 1px solid #dbe4e1;
  border-radius: 10px;
  padding: 0 12px;
  background: #fff;
}

.soft-tip {
  display: block;
  margin-top: 10px;
  color: #8b9996;
}

.user-detail-dialog {
  width: min(860px,92vw);
  max-height: 90vh;
}

.detail-body {
  max-height: calc(90vh - 82px);
  overflow-y: auto;
}

.detail-loading {
  padding: 70px;
  text-align: center;
  color: #82928e;
}

.detail-section {
  border: 1px solid #e3eae7;
  border-radius: 13px;
  padding: 18px;
  margin-bottom: 15px;
}

.detail-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
}

.detail-section-head b {
  font-size: 14px;
}

.detail-section-head small {
  display: block;
  color: #8a9995;
  font-size: 11px;
  margin-top: 4px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.detail-grid label,
.certificate-info label {
  background: #f7f9f8;
  border-radius: 9px;
  padding: 11px;
}

.detail-grid span,
.detail-grid b,
.certificate-info span,
.certificate-info b {
  display: block;
}

.detail-grid span,
.certificate-info span {
  font-size: 11px;
  color: #879590;
  margin-bottom: 6px;
}

.detail-grid b,
.certificate-info b {
  font-size: 13px;
  word-break: break-all;
}

.certificate-empty {
  padding: 34px;
  text-align: center;
  background: #f7f9f8;
  border-radius: 10px;
  color: #879590;
  font-size: 12px;
}

.certificate-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 15px;
}

.certificate-image {
  height: 240px;
  border-radius: 11px;
  overflow: hidden;
  position: relative;
  background: #eef2f0;
  display: block;
}

.certificate-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.certificate-image span {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 8px;
  text-align: center;
  background: rgba(16,45,40,.75);
  color: #fff;
  font-size: 11px;
}

.certificate-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.detail-reject {
  margin-top: 12px;
  padding: 11px;
  background: #fff1f0;
  color: #c9544e;
  border-radius: 9px;
  font-size: 12px;
}

.review-panel {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #e5ebe9;
}

.review-panel textarea {
  width: 100%;
  height: 72px;
  resize: vertical;
  border: 1px solid #dce5e2;
  border-radius: 9px;
  padding: 10px;
  box-sizing: border-box;
  font-size: 12px;
}

.review-panel > div {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 9px;
}

.review-panel button {
  border: 0;
  border-radius: 8px;
  padding: 9px 16px;
  font-size: 12px;
  cursor: pointer;
}

.reject-review {
  background: #fff0f0;
  color: #cd5555;
}

.approve-review {
  background: #0b917f;
  color: #fff;
}

@media (max-width: 800px) {
  .detail-grid {
    grid-template-columns: 1fr 1fr;
  }

  .certificate-layout {
    grid-template-columns: 1fr;
  }

  .certificate-image {
    height: 280px;
  }
}
</style>
