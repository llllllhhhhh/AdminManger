<template>
  <section class="page-content commerce-admin">
    <div class="commerce-hero">
      <div>
        <span class="eyebrow">学习产品</span>
        <h1>学习产品与付费服务</h1>
        <p>按商户学校区分产品与订单，完成商户提报、平台审核、用户购买、订单同步的闭环管理。</p>
      </div>
      <div class="hero-actions">
        <div class="mode-tabs">
          <button :class="{ active: tab === 'products' }" @click="tab = 'products'">
            产品审核 <b>{{ visibleProducts.length }}</b>
          </button>
          <button :class="{ active: tab === 'orders' }" @click="tab = 'orders'">
            学习订单 <b>{{ visibleOrders.length }}</b>
          </button>
        </div>
        <button class="soft-btn" @click="resetGrid">重置筛选</button>
        <button class="primary-btn compact" @click="load">刷新数据</button>
      </div>
    </div>

    <div class="commerce-overview">
      <article>
        <i>商</i>
        <div><small>商户产品</small><strong>{{ merchantProductCount }}</strong></div>
      </article>
      <article>
        <i class="orange">审</i>
        <div><small>待审核</small><strong>{{ products.filter(x => x.review_status === REVIEW_STATUS.PENDING).length }}</strong></div>
      </article>
      <article>
        <i class="cyan">单</i>
        <div><small>累计订单</small><strong>{{ orders.length }}</strong></div>
      </article>
      <article>
        <i class="gold">￥</i>
        <div><small>成交金额</small><strong>￥{{ revenue }}</strong></div>
      </article>
    </div>

    <div class="grid-card">
      <div class="grid-toolbar">
        <div class="row-group-bar">
          <span class="group-icon">☰</span>
          <span>Drag here to set row groups</span>
          <em>可按商户学校、审核状态、支付状态进行筛选和排序</em>
        </div>
        <div class="mode-tabs">
          <button :class="{ active: tab === 'products' }" @click="tab = 'products'">
            产品审核 <b>{{ visibleProducts.length }}</b>
          </button>
          <button :class="{ active: tab === 'orders' }" @click="tab = 'orders'">
            学习订单 <b>{{ visibleOrders.length }}</b>
          </button>
        </div>
      </div>

      <div class="grid-filter-bar">
        <label>
          <span>商户学校</span>
          <select v-model="schoolFilter">
            <option value="all">全部商户 / 平台</option>
            <option value="0">平台自营</option>
            <option v-for="school in merchantSchools" :key="school.id" :value="String(school.id)">
              {{ school.name }}{{ school.merchant_account ? `（${school.merchant_account}）` : '' }}
            </option>
          </select>
        </label>
        <label v-if="tab === 'products'">
          <span>审核状态</span>
          <select v-model="reviewFilter">
            <option value="all">全部状态</option>
            <option value="pending">待审核</option>
            <option value="approved">已通过</option>
            <option value="rejected">已驳回</option>
          </select>
        </label>
        <label v-else>
          <span>支付状态</span>
          <select v-model="payFilter">
            <option value="all">全部状态</option>
            <option value="pending">待支付</option>
            <option value="paid">已支付</option>
            <option value="canceled">已取消</option>
            <option value="refunded">已退款</option>
          </select>
        </label>
        <label class="search-field">
          <span>全局搜索</span>
          <input v-model.trim="keyword" placeholder="产品名 / 订单号 / 商户名">
        </label>
      </div>

      <div v-if="tab === 'products'" class="table-panel">
        <div class="table-viewport">
        <table class="ag-table product-table">
          <thead>
            <tr class="group-head">
              <th class="row-num"></th>
              <th class="check-col"></th>
              <th colspan="5">产品信息</th>
              <th colspan="2">商户信息</th>
              <th colspan="2">审核销售</th>
              <th>操作</th>
            </tr>
            <tr class="column-head">
              <th class="row-num">#</th>
              <th class="check-col"><input type="checkbox" :checked="allVisibleProductsChecked" @change="toggleAllProducts"></th>
              <th class="wide-col">产品名称 <button @click="openMenu('name')">⋮</button></th>
              <th>类型 <button @click="openMenu('product_type')">⋮</button></th>
              <th>价格 <button @click="openMenu('price')">⋮</button></th>
              <th>销量 <button @click="openMenu('sales')">⋮</button></th>
              <th>订单号 <button @click="openMenu('order_no')">⋮</button></th>
              <th class="wide-col">所属商户 <button @click="openMenu('school')">⋮</button></th>
              <th>商户账号 <button @click="openMenu('merchant')">⋮</button></th>
              <th>审核 <button @click="openMenu('review_status')">⋮</button></th>
              <th>上架 <button @click="openMenu('status')">⋮</button></th>
              <th>操作</th>
            </tr>
            <tr class="filter-row">
              <th></th>
              <th></th>
              <th><input v-model.trim="productNameFilter" placeholder="筛选产品"><i>⌕</i></th>
              <th><select v-model="typeFilter"><option value="all">全部</option><option value="community">付费社群</option><option value="package">长期套餐</option><option value="material">资料包</option></select></th>
              <th><input v-model.trim="priceFilter" placeholder="≥ 金额"><i>⌕</i></th>
              <th><input v-model.trim="salesFilter" placeholder="≥ 销量"><i>⌕</i></th>
              <th><input v-model.trim="orderNoFilter" placeholder="筛选订单号"><i>⌕</i></th>
              <th><input v-model.trim="merchantKeyword" placeholder="商户名"><i>⌕</i></th>
              <th><input v-model.trim="merchantAccountKeyword" placeholder="账号"><i>⌕</i></th>
              <th><select v-model="reviewFilter"><option value="all">全部</option><option value="pending">待审核</option><option value="approved">已通过</option><option value="rejected">已驳回</option></select></th>
              <th><select v-model="saleFilter"><option value="all">全部</option><option value="on">已上架</option><option value="off">未上架</option></select></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in pagedProducts" :key="item.id">
              <td class="row-num">{{ productStartIndex + index + 1 }}</td>
              <td class="check-col"><input type="checkbox" :checked="selectedProducts.has(item.id)" @change="toggleProductCheck(item.id)"></td>
              <td class="main-cell">
                <div class="drag-dot">⋮⋮</div>
                <div class="cover-mini" :style="{ backgroundImage: coverStyle(item.cover) }"></div>
                <div>
                  <b>{{ item.name }}</b>
                  <small>{{ item.subtitle || item.description || '暂无产品说明' }}</small>
                  <em v-if="item.reject_reason">驳回原因：{{ item.reject_reason }}</em>
                </div>
              </td>
              <td><span>{{ typeName(item.product_type) }}</span><small>{{ cycleName(item.billing_cycle) }}</small></td>
              <td><strong class="money">￥{{ item.price }}</strong><small v-if="Number(item.original_price)">划线 ￥{{ item.original_price }}</small></td>
              <td><span>{{ item.sales || 0 }}</span><small>{{ item.contents?.length || 0 }} 项内容</small></td>
              <td class="order-no-cell"><span>{{ productOrderNoSummary(item) }}</span><small>{{ productOrderNos(item).length }} 个订单</small></td>
              <td><b>{{ schoolName(item.school_id) }}</b><small>ID：{{ item.school_id || '平台' }}</small></td>
              <td><small>{{ merchantAccount(item.school_id) }}</small></td>
              <td><span :class="['status-pill', item.review_status]">{{ reviewName(item.review_status) }}</span></td>
              <td><span :class="['sale-pill', item.status ? 'on' : 'off']">{{ item.status ? '已上架' : '未上架' }}</span></td>
              <td>
                <div class="table-actions">
                  <button @click="openEdit(item)">编辑</button>
                  <button v-if="item.review_status !== 'approved'" class="approve" @click="review(item, true)">通过</button>
                  <button v-if="item.review_status !== 'rejected'" class="danger-lite" @click="openReject(item)">驳回</button>
                  <button :disabled="item.review_status !== 'approved'" @click="toggle(item)">{{ item.status ? '下架' : '上架' }}</button>
                </div>
              </td>
            </tr>
          </tbody>
          </table>
          <div v-if="!visibleProducts.length" class="empty-state">暂无符合条件的学习产品</div>
        </div>
        <div class="table-footer">
          <PaginationBar v-model:page="productPage" v-model:page-size="pageSize" :total="visibleProducts.length" />
        </div>
      </div>

      <div v-else class="table-panel">
        <div class="table-viewport">
        <table class="ag-table order-table">
          <thead>
            <tr class="group-head">
              <th class="row-num"></th>
              <th class="check-col"></th>
              <th colspan="2">订单信息</th>
              <th colspan="2">商户信息</th>
              <th colspan="4">支付信息</th>
            </tr>
            <tr class="column-head">
              <th class="row-num">#</th>
              <th class="check-col"><input type="checkbox" :checked="allVisibleOrdersChecked" @change="toggleAllOrders"></th>
              <th class="wide-col">订单 / 产品 <button @click="openMenu('order')">⋮</button></th>
              <th>用户 <button @click="openMenu('user_id')">⋮</button></th>
              <th class="wide-col">所属商户 <button @click="openMenu('school')">⋮</button></th>
              <th>商户账号 <button @click="openMenu('merchant')">⋮</button></th>
              <th>金额 <button @click="openMenu('amount')">⋮</button></th>
              <th>方式 <button @click="openMenu('payment_method')">⋮</button></th>
              <th>状态 <button @click="openMenu('payment_status')">⋮</button></th>
              <th>下单时间 <button @click="openMenu('created_at')">⋮</button></th>
            </tr>
            <tr class="filter-row">
              <th></th>
              <th></th>
              <th><input v-model.trim="orderKeyword" placeholder="筛选订单"><i>⌕</i></th>
              <th><input v-model.trim="userFilter" placeholder="用户ID"></th>
              <th><input v-model.trim="merchantKeyword" placeholder="商户名"><i>⌕</i></th>
              <th><input v-model.trim="merchantAccountKeyword" placeholder="账号"><i>⌕</i></th>
              <th><input v-model.trim="amountFilter" placeholder="≥ 金额"></th>
              <th><select v-model="paymentMethodFilter"><option value="all">全部</option><option value="wechat">微信支付</option><option value="mock">开发模拟</option></select></th>
              <th><select v-model="payFilter"><option value="all">全部</option><option value="pending">待支付</option><option value="paid">已支付</option><option value="canceled">已取消</option><option value="refunded">已退款</option></select></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(order, index) in pagedOrders" :key="order.id">
              <td class="row-num">{{ orderStartIndex + index + 1 }}</td>
              <td class="check-col"><input type="checkbox" :checked="selectedOrders.has(order.id)" @change="toggleOrderCheck(order.id)"></td>
              <td class="main-cell order-main">
                <div class="drag-dot">⋮⋮</div>
                <div>
                  <b>{{ order.product_name }}</b>
                  <small>{{ order.order_no }}</small>
                </div>
              </td>
              <td>#{{ order.user_id }}</td>
              <td><b>{{ schoolName(order.school_id) }}</b><small>ID：{{ order.school_id || '平台' }}</small></td>
              <td><small>{{ merchantAccount(order.school_id) }}</small></td>
              <td><strong class="money">￥{{ order.amount }}</strong></td>
              <td>{{ order.payment_method === 'mock' ? '开发模拟' : '微信支付' }}</td>
              <td><span class="pay-status" :class="order.payment_status">{{ payName(order.payment_status) }}</span></td>
              <td>{{ formatTime(order.created_at) }}</td>
            </tr>
          </tbody>
          </table>
          <div v-if="!visibleOrders.length" class="empty-state">暂无符合条件的学习订单</div>
        </div>
        <div class="table-footer">
          <PaginationBar v-model:page="orderPage" v-model:page-size="pageSize" :total="visibleOrders.length" />
        </div>
      </div>

      <div v-if="gridMenu" class="column-menu">
        <button @click="sortBy(gridMenu, 'asc')">↑ 升序排列</button>
        <button @click="sortBy(gridMenu, 'desc')">↓ 降序排列</button>
        <button @click="closeMenu">⚑ Pin Column</button>
        <button @click="closeMenu">↔ Autosize This Column</button>
        <button @click="closeMenu">☰ Group by {{ gridMenu }}</button>
        <button @click="closeMenu">▦ Choose Columns</button>
        <button @click="resetGrid">重置表格</button>
      </div>
    </div>

    <div v-if="editing" class="dialog-mask" @click.self="editing = null">
      <form class="dialog product-dialog" @submit.prevent="save">
        <div class="dialog-head">
          <div>
            <h2>编辑学习产品</h2>
            <p>平台可调整产品展示内容；未审核通过的产品不能上架。</p>
          </div>
          <button type="button" @click="editing = null">×</button>
        </div>
        <div class="dialog-body">
          <div class="merchant-note">
            <span>所属商户</span>
            <b>{{ schoolName(form.school_id) }}</b>
            <small>{{ merchantAccount(form.school_id) }}</small>
          </div>
          <div class="two-fields">
            <label class="field">产品名称<input v-model.trim="form.name" required></label>
            <label class="field">产品类型
              <select v-model="form.product_type">
                <option value="community">付费社群</option>
                <option value="package">长期套餐</option>
                <option value="material">资料包</option>
              </select>
            </label>
          </div>
          <label class="field">一句话卖点<input v-model.trim="form.subtitle"></label>
          <label class="field">详细介绍<textarea v-model="form.description" rows="3"></textarea></label>
          <div class="three-fields">
            <label class="field">售价<input v-model.number="form.price" type="number" min="0" step="0.01"></label>
            <label class="field">划线价<input v-model.number="form.original_price" type="number" min="0" step="0.01"></label>
            <label class="field">计费周期
              <select v-model="form.billing_cycle">
                <option value="once">一次性</option>
                <option value="month">按月</option>
                <option value="year">按年</option>
              </select>
            </label>
          </div>
          <div class="three-fields">
            <label class="field">免费试看（分钟）<input v-model.number="form.trial_minutes" type="number" min="0"></label>
            <label class="field">库存（-1不限）<input v-model.number="form.stock" type="number" min="-1"></label>
            <label class="field">最多分期期数<input v-model.number="form.installment_count" type="number" min="1" max="24"></label>
          </div>
          <label class="field">封面图片 URL<input v-model.trim="form.cover" placeholder="https://..."></label>
          <label class="field">权益（每行一项）<textarea v-model="benefitText" rows="4"></textarea></label>
          <div class="check-row">
            <label><input v-model="form.featured" type="checkbox"> 首页推荐</label>
            <label><input v-model="form.installment_enabled" type="checkbox"> 支持分期</label>
            <label><input v-model="form.status" type="checkbox" :disabled="form.review_status !== 'approved'"> 上架</label>
          </div>
        </div>
        <div class="dialog-actions">
          <button type="button" @click="editing = null">取消</button>
          <button class="primary-btn" type="submit" :disabled="saving">{{ saving ? '保存中...' : '保存产品' }}</button>
        </div>
      </form>
    </div>

    <div v-if="rejecting" class="dialog-mask" @click.self="rejecting = null">
      <form class="dialog reject-dialog" @submit.prevent="confirmReject">
        <div class="dialog-head">
          <div><h2>驳回产品</h2><p>驳回原因会同步给商户端。</p></div>
          <button type="button" @click="rejecting = null">×</button>
        </div>
        <label class="field">驳回原因<textarea v-model.trim="rejectReason" rows="4" placeholder="请说明需要商户修改的地方"></textarea></label>
        <div class="dialog-actions">
          <button type="button" @click="rejecting = null">取消</button>
          <button class="danger-btn" type="submit">确认驳回</button>
        </div>
      </form>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { api } from '../services/api'
import { COMMERCE_PAYMENT_STATUS, REVIEW_STATUS, paymentStatusName, reviewStatusName } from '../utils/orderStatus'
import PaginationBar from './PaginationBar.vue'

const emit = defineEmits(['toast'])
const tab = ref('products')
const products = ref([])
const orders = ref([])
const schools = ref([])
const schoolFilter = ref('all')
const reviewFilter = ref('all')
const payFilter = ref('all')
const keyword = ref('')
const productNameFilter = ref('')
const typeFilter = ref('all')
const priceFilter = ref('')
const salesFilter = ref('')
const merchantKeyword = ref('')
const merchantAccountKeyword = ref('')
const saleFilter = ref('all')
const orderKeyword = ref('')
const orderNoFilter = ref('')
const userFilter = ref('')
const amountFilter = ref('')
const paymentMethodFilter = ref('all')
const sortState = ref({ key: '', direction: '' })
const gridMenu = ref('')
const selectedProducts = ref(new Set())
const selectedOrders = ref(new Set())
const editing = ref(null)
const rejecting = ref(null)
const saving = ref(false)
const rejectReason = ref('')
const productPage = ref(1)
const orderPage = ref(1)
const pageSize = ref(10)
const benefitText = ref('')
const fallbackCover = 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1000'
const form = ref({})

const schoolMap = computed(() => Object.fromEntries(schools.value.map(item => [Number(item.id), item])))
const merchantSchools = computed(() => schools.value.filter(item => item.merchant_account || item.has_merchant_password))
const merchantProductCount = computed(() => products.value.filter(item => Number(item.school_id) > 0).length)
const revenue = computed(() => orders.value.filter(x => x.payment_status === COMMERCE_PAYMENT_STATUS.PAID).reduce((n, x) => n + Number(x.amount), 0).toFixed(2))
const productOrdersMap = computed(() => {
  const map = {}
  orders.value.forEach(order => {
    const productId = Number(order.product_id || 0)
    if (!productId) return
    if (!map[productId]) map[productId] = []
    map[productId].push(order)
  })
  return map
})

const schoolName = schoolId => {
  if (!Number(schoolId)) return '平台自营'
  return schoolMap.value[Number(schoolId)]?.name || `未知商户 #${schoolId}`
}
const merchantAccount = schoolId => {
  if (!Number(schoolId)) return '平台产品'
  const school = schoolMap.value[Number(schoolId)]
  return school?.merchant_account ? `商户账号：${school.merchant_account}` : '未配置商户账号'
}
const merchantRawAccount = schoolId => {
  if (!Number(schoolId)) return '平台产品'
  return schoolMap.value[Number(schoolId)]?.merchant_account || ''
}
const typeName = value => ({ community: '付费社群', package: '长期套餐', material: '资料包' }[value] || value)
const reviewName = value => reviewStatusName(value)
const cycleName = value => ({ month: '按月', year: '按年', once: '一次性' }[value] || value)
const payName = value => paymentStatusName(value)
const formatTime = value => value ? new Date(value).toLocaleString() : '-'
const coverStyle = cover => `linear-gradient(135deg,rgba(17,61,55,.18),rgba(17,61,55,.58)),url(${cover || fallbackCover})`
const numberAtLeast = (value, filter) => filter === '' || Number(value || 0) >= Number(filter || 0)
const productOrders = item => productOrdersMap.value[Number(item?.id || 0)] || []
const productOrderNos = item => productOrders(item).map(order => order.order_no).filter(Boolean)
const productOrderNoText = item => productOrderNos(item).join(' ')
const productOrderNoSummary = item => {
  const list = productOrderNos(item)
  if (!list.length) return '暂无订单'
  const summary = list.slice(0, 3).join(' / ')
  return list.length > 3 ? `${summary} 等 ${list.length} 单` : summary
}

const productSortValue = (item, key) => ({
  name: item.name,
  product_type: item.product_type,
  price: Number(item.price || 0),
  sales: Number(item.sales || 0),
  school: schoolName(item.school_id),
  merchant: merchantRawAccount(item.school_id),
  review_status: item.review_status,
  status: item.status ? 1 : 0,
  order_no: productOrderNoText(item),
}[key] ?? '')

const orderSortValue = (item, key) => ({
  order: item.product_name,
  user_id: Number(item.user_id || 0),
  school: schoolName(item.school_id),
  merchant: merchantRawAccount(item.school_id),
  amount: Number(item.amount || 0),
  payment_method: item.payment_method,
  payment_status: item.payment_status,
  created_at: new Date(item.created_at || 0).getTime(),
}[key] ?? '')

const sortRows = (rows, getter) => {
  if (!sortState.value.key) return rows
  const direction = sortState.value.direction === 'desc' ? -1 : 1
  return [...rows].sort((a, b) => {
    const av = getter(a, sortState.value.key)
    const bv = getter(b, sortState.value.key)
    if (av > bv) return direction
    if (av < bv) return -direction
    return 0
  })
}

const visibleProducts = computed(() => {
  const key = keyword.value.toLowerCase()
  const merchantKey = merchantKeyword.value.toLowerCase()
  const merchantAccountKey = merchantAccountKeyword.value.toLowerCase()
  const productKey = productNameFilter.value.toLowerCase()
  const orderNoKey = orderNoFilter.value.toLowerCase()
  const rows = products.value.filter(item => {
    const school = schoolMap.value[Number(item.school_id)]
    const merchantText = `${school?.name || ''} ${school?.merchant_account || ''}`.toLowerCase()
    const orderNoText = productOrderNoText(item).toLowerCase()
    const text = `${item.name || ''} ${item.subtitle || ''} ${orderNoText} ${merchantText}`.toLowerCase()
    return (schoolFilter.value === 'all' || String(item.school_id || 0) === schoolFilter.value)
      && (reviewFilter.value === 'all' || item.review_status === reviewFilter.value)
      && (typeFilter.value === 'all' || item.product_type === typeFilter.value)
      && (saleFilter.value === 'all' || (saleFilter.value === 'on' ? item.status : !item.status))
      && (!key || text.includes(key))
      && (!productKey || `${item.name || ''} ${item.subtitle || ''}`.toLowerCase().includes(productKey))
      && (!orderNoKey || orderNoText.includes(orderNoKey))
      && (!merchantKey || String(school?.name || '').toLowerCase().includes(merchantKey))
      && (!merchantAccountKey || String(school?.merchant_account || '').toLowerCase().includes(merchantAccountKey))
      && numberAtLeast(item.price, priceFilter.value)
      && numberAtLeast(item.sales, salesFilter.value)
  })
  return sortRows(rows, productSortValue)
})

const visibleOrders = computed(() => {
  const key = keyword.value.toLowerCase()
  const orderKey = orderKeyword.value.toLowerCase()
  const merchantKey = merchantKeyword.value.toLowerCase()
  const merchantAccountKey = merchantAccountKeyword.value.toLowerCase()
  const rows = orders.value.filter(item => {
    const school = schoolMap.value[Number(item.school_id)]
    const merchantText = `${school?.name || ''} ${school?.merchant_account || ''}`.toLowerCase()
    const text = `${item.product_name || ''} ${item.order_no || ''} ${merchantText}`.toLowerCase()
    return (schoolFilter.value === 'all' || String(item.school_id || 0) === schoolFilter.value)
      && (payFilter.value === 'all' || item.payment_status === payFilter.value)
      && (paymentMethodFilter.value === 'all' || item.payment_method === paymentMethodFilter.value)
      && (!key || text.includes(key))
      && (!orderKey || `${item.product_name || ''} ${item.order_no || ''}`.toLowerCase().includes(orderKey))
      && (!userFilter.value || String(item.user_id).includes(userFilter.value))
      && (!merchantKey || String(school?.name || '').toLowerCase().includes(merchantKey))
      && (!merchantAccountKey || String(school?.merchant_account || '').toLowerCase().includes(merchantAccountKey))
      && numberAtLeast(item.amount, amountFilter.value)
  })
  return sortRows(rows, orderSortValue)
})

const productStartIndex = computed(() => (productPage.value - 1) * pageSize.value)
const orderStartIndex = computed(() => (orderPage.value - 1) * pageSize.value)
const pagedProducts = computed(() => visibleProducts.value.slice(productStartIndex.value, productStartIndex.value + pageSize.value))
const pagedOrders = computed(() => visibleOrders.value.slice(orderStartIndex.value, orderStartIndex.value + pageSize.value))
const allVisibleProductsChecked = computed(() => pagedProducts.value.length > 0 && pagedProducts.value.every(item => selectedProducts.value.has(item.id)))
const allVisibleOrdersChecked = computed(() => pagedOrders.value.length > 0 && pagedOrders.value.every(item => selectedOrders.value.has(item.id)))
watch(visibleProducts, () => { productPage.value = 1 })
watch(visibleOrders, () => { orderPage.value = 1 })

const openMenu = key => { gridMenu.value = gridMenu.value === key ? '' : key }
const closeMenu = () => { gridMenu.value = '' }
const sortBy = (key, direction) => {
  sortState.value = { key, direction }
  closeMenu()
}
const resetGrid = () => {
  sortState.value = { key: '', direction: '' }
  productNameFilter.value = ''
  typeFilter.value = 'all'
  priceFilter.value = ''
  salesFilter.value = ''
  merchantKeyword.value = ''
  merchantAccountKeyword.value = ''
  saleFilter.value = 'all'
  orderKeyword.value = ''
  orderNoFilter.value = ''
  userFilter.value = ''
  amountFilter.value = ''
  paymentMethodFilter.value = 'all'
  keyword.value = ''
  schoolFilter.value = 'all'
  reviewFilter.value = 'all'
  payFilter.value = 'all'
  closeMenu()
}
const toggleProductCheck = id => {
  const next = new Set(selectedProducts.value)
  next.has(id) ? next.delete(id) : next.add(id)
  selectedProducts.value = next
}
const toggleOrderCheck = id => {
  const next = new Set(selectedOrders.value)
  next.has(id) ? next.delete(id) : next.add(id)
  selectedOrders.value = next
}
const toggleAllProducts = () => {
  const next = new Set(selectedProducts.value)
  if (allVisibleProductsChecked.value) pagedProducts.value.forEach(item => next.delete(item.id))
  else pagedProducts.value.forEach(item => next.add(item.id))
  selectedProducts.value = next
}
const toggleAllOrders = () => {
  const next = new Set(selectedOrders.value)
  if (allVisibleOrdersChecked.value) pagedOrders.value.forEach(item => next.delete(item.id))
  else pagedOrders.value.forEach(item => next.add(item.id))
  selectedOrders.value = next
}

const load = async () => {
  try {
    const [productRows, orderRows, schoolRows] = await Promise.all([
      api.getStudyProducts(),
      api.getStudyOrders(),
      api.getSchools(),
    ])
    products.value = productRows
    orders.value = orderRows
    schools.value = schoolRows
  } catch (error) {
    emit('toast', error.message)
  }
}

const openEdit = item => {
  form.value = JSON.parse(JSON.stringify(item))
  benefitText.value = (item.benefits || []).join('\n')
  editing.value = item.id
}

const save = async () => {
  saving.value = true
  try {
    const payload = {
      ...form.value,
      benefits: benefitText.value.split('\n').map(x => x.trim()).filter(Boolean),
    }
    await api.updateStudyProduct(payload)
    editing.value = null
    await load()
    emit('toast', '学习产品已保存')
  } catch (error) {
    emit('toast', error.message)
  } finally {
    saving.value = false
  }
}

const review = async (item, approved, reason = '') => {
  try {
    await api.reviewStudyProduct(item.id, approved, reason)
    await load()
    emit('toast', approved ? '产品已审核通过并上架' : '产品已驳回')
  } catch (error) {
    emit('toast', error.message)
  }
}

const openReject = item => {
  rejecting.value = item
  rejectReason.value = item.reject_reason || ''
}

const confirmReject = async () => {
  await review(rejecting.value, false, rejectReason.value || '请完善产品信息后重新提交')
  rejecting.value = null
}

const toggle = async item => {
  try {
    await api.setStudyProductStatus(item.id, !item.status)
    item.status = !item.status
    emit('toast', item.status ? '商品已上架' : '商品已下架')
  } catch (error) {
    emit('toast', error.message)
  }
}

onMounted(load)
</script>

<style scoped>
.commerce-admin{background:linear-gradient(180deg,#fbf8ef 0,#f7fbf8 42%,#fff 100%)}.commerce-hero{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;margin-bottom:18px;padding:24px;border:1px solid #e7eee9;border-radius:24px;background:linear-gradient(135deg,#fffaf2,#ffffff 58%,#eef8f4);box-shadow:0 18px 45px rgba(25,68,59,.08)}.commerce-hero h1{margin:8px 0 8px;font-size:28px;color:#112c27;letter-spacing:.02em}.commerce-hero p{margin:0;max-width:760px;color:#758680;line-height:1.7}.eyebrow{display:inline-flex;padding:5px 10px;border-radius:999px;background:#173f38;color:#fff;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.hero-actions{display:flex;gap:10px;align-items:center}.soft-btn{border:1px solid #dce8e4;background:#fff;color:#244a42;border-radius:12px;padding:10px 14px;font-weight:800}.commerce-overview{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:18px}.commerce-overview article{display:flex;align-items:center;gap:14px;background:#fff;border:1px solid #e2e9e7;border-radius:18px;padding:18px;box-shadow:0 12px 28px rgba(25,68,59,.05)}.commerce-overview i{width:42px;height:42px;border-radius:14px;display:grid;place-items:center;background:#e5f5ef;color:#087e6e;font-style:normal;font-weight:900}.commerce-overview i.orange{background:#fff0e3;color:#ef7130}.commerce-overview i.cyan{background:#e9f7fb;color:#1689a6}.commerce-overview i.gold{background:#fff6d9;color:#aa7a00}.commerce-overview small,.commerce-overview strong{display:block}.commerce-overview small{color:#7d8e8a;font-size:11px}.commerce-overview strong{font-size:25px;margin-top:4px;color:#122d28}.grid-card{position:relative;background:#fff;border:1px solid #dfe8e4;border-radius:22px;overflow:hidden;box-shadow:0 18px 42px rgba(20,54,48,.08)}.grid-toolbar,.grid-filter-bar{display:none}.row-group-bar{display:flex;align-items:center;gap:10px;color:#60716c;font-size:13px;min-width:0}.row-group-bar .group-icon{width:30px;height:30px;border-radius:10px;display:grid;place-items:center;background:#eef6f3;color:#173f38}.row-group-bar em{font-style:normal;color:#a0aaa7;font-size:12px}.mode-tabs{display:flex;gap:8px;padding:5px;background:#f1f6f4;border-radius:15px}.mode-tabs button{border:0;background:transparent;color:#647772;border-radius:11px;padding:10px 14px;font-weight:900}.mode-tabs button b{margin-left:6px;font-size:11px}.mode-tabs .active{background:#173f38;color:#fff;box-shadow:0 10px 20px rgba(23,63,56,.18)}.grid-filter-bar label{font-size:11px;color:#71807c;font-weight:900}.grid-filter-bar label span{display:block;margin-bottom:6px}.grid-filter-bar select,.grid-filter-bar input{display:block;width:100%;height:38px;border:1px solid #dce5e2;border-radius:11px;background:#fff;padding:0 12px;outline:none;transition:.18s}.grid-filter-bar select:focus,.grid-filter-bar input:focus,.filter-row input:focus,.filter-row select:focus{border-color:#6fb8a9;box-shadow:0 0 0 3px rgba(111,184,169,.14)}.table-viewport{overflow:auto;max-height:660px;background:#fff}.ag-table{width:100%;border-collapse:separate;border-spacing:0;min-width:1280px;color:#233934}.ag-table th,.ag-table td{border-right:1px solid #e7ecea;border-bottom:1px solid #edf1ef}.ag-table th:last-child,.ag-table td:last-child{border-right:0}.group-head th{height:40px;background:#fbfcfb;color:#465a55;text-align:center;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:.03em}.column-head th{position:sticky;top:0;z-index:3;height:46px;background:#fff;color:#283f39;text-align:left;font-size:12px;font-weight:900;padding:0 12px;white-space:nowrap;box-shadow:0 1px 0 #edf1ef}.column-head button{float:right;border:0;background:transparent;color:#536762;font-size:18px;line-height:1;cursor:pointer;border-radius:6px;padding:2px 4px}.column-head button:hover{background:#eef6f3}.filter-row th{position:sticky;top:46px;z-index:3;height:46px;background:#f8fbfa;padding:7px 10px}.filter-row input,.filter-row select{width:100%;height:31px;border:1px solid #dde5e2;border-radius:8px;background:#fff;padding:0 9px;font-size:12px;outline:none}.filter-row i{float:right;margin-top:-23px;margin-right:7px;color:#8b9995;font-style:normal}.ag-table td{height:62px;background:#fff;padding:10px 12px;font-size:12px;vertical-align:middle}.ag-table tbody tr{transition:.16s}.ag-table tbody tr:hover td{background:#fbfdfc}.row-num{width:54px;text-align:center!important;color:#6f817c;background:#fbfcfc!important;font-weight:800}.check-col{width:44px;text-align:center!important}.check-col input{width:16px;height:16px;accent-color:#49a795}.wide-col{min-width:230px}.main-cell{display:flex;gap:10px;align-items:center;min-width:290px}.drag-dot{color:#b0bbb8;font-weight:900;letter-spacing:-2px;cursor:grab}.cover-mini{width:44px;height:44px;border-radius:13px;background-size:cover;background-position:center;flex:0 0 44px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.5),0 8px 18px rgba(17,61,55,.12)}.ag-table b{display:block;font-size:13px;color:#1f3630}.ag-table small{display:block;color:#7b8b86;margin-top:4px;line-height:1.35}.ag-table em{display:block;color:#c94a4a;font-style:normal;font-size:11px;margin-top:5px}.money{color:#ef7130!important;font-size:14px!important}.order-no-cell{min-width:190px}.order-no-cell span{display:block;max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.status-pill,.sale-pill,.pay-status{display:inline-flex;align-items:center;border-radius:999px;padding:6px 10px;font-size:11px;font-weight:900;white-space:nowrap}.status-pill.pending{background:#fff2d8;color:#a96e08}.status-pill.approved,.sale-pill.on,.pay-status.paid{background:#e1f7ef;color:#067765}.status-pill.rejected,.sale-pill.off{background:#ffe8e8;color:#c34646}.pay-status{background:#fff2d8;color:#a96e08}.pay-status.cancelled,.pay-status.refunded{background:#f1f2f2;color:#7b8985}.table-actions{display:flex;flex-wrap:wrap;gap:6px;min-width:200px}.table-actions button{border:1px solid #dce5e2;background:#fff;border-radius:9px;padding:7px 10px;font-size:11px;font-weight:800;color:#2f4842;transition:.16s}.table-actions button:hover{transform:translateY(-1px);box-shadow:0 6px 14px rgba(17,61,55,.08)}.table-actions button:disabled{opacity:.42;cursor:not-allowed;transform:none;box-shadow:none}.table-actions .approve{background:#e4f6f0;color:#087e6e;border-color:#c7eadf}.table-actions .danger-lite{background:#fff5f5;color:#d85d5d;border-color:#ffd8d8}.column-menu{position:absolute;z-index:8;top:152px;left:420px;width:236px;background:#fff;border:1px solid #cfd8d5;border-radius:12px;box-shadow:0 18px 40px rgba(22,45,40,.2);padding:7px;overflow:hidden}.column-menu button{display:block;width:100%;border:0;background:#fff;text-align:left;padding:12px 14px;color:#384943;font-size:13px;border-radius:8px}.column-menu button:hover{background:#eef6f3}.product-dialog{width:680px;max-height:90vh;overflow:auto}.reject-dialog{width:480px}.merchant-note{display:flex;align-items:center;gap:10px;background:#f3f8f6;border:1px solid #e0e8e5;border-radius:12px;padding:12px;margin-bottom:14px}.merchant-note span{color:#72827f;font-size:11px}.merchant-note b{color:#173f38}.merchant-note small{color:#7f908b}.field{display:block;font-size:11px;margin-bottom:12px}.field input,.field select,.field textarea{display:block;width:100%;margin-top:6px;border:1px solid #dce5e2;border-radius:9px;padding:9px;resize:vertical}.two-fields{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.three-fields{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.check-row{display:flex;gap:24px;background:#f2f7f5;padding:12px;border-radius:9px;font-size:11px}.danger-btn{background:#d85d5d;color:#fff;border:0;border-radius:10px;padding:10px 16px}
.column-head th{position:relative!important;padding-right:42px!important;line-height:46px}
.column-head button{position:absolute!important;top:50%;right:10px;width:26px;height:26px;display:inline-grid!important;place-items:center;transform:translateY(-50%);float:none!important;border-radius:9px!important;color:#8ca09a!important;transition:background .16s ease,color .16s ease,box-shadow .16s ease}
.column-head button:hover{background:#eef6f3!important;color:#173f38!important;box-shadow:inset 0 0 0 1px #dce9e5}
.column-menu button:nth-child(n+3){display:none}
@media(max-width:900px){.commerce-hero,.grid-toolbar{flex-direction:column;align-items:stretch}.commerce-overview,.grid-filter-bar{grid-template-columns:1fr}.ag-table{min-width:1180px}.two-fields,.three-fields{grid-template-columns:1fr}.mode-tabs{width:100%}.mode-tabs button{flex:1}}

/* Keep table header and filters fixed while only data rows scroll. */
.table-viewport{
  position:relative;
  overflow:auto;
  max-height:min(660px,calc(100vh - 260px));
  background:#fff;
}
.product-table .group-head th,
.order-table .group-head th{
  position:sticky;
  top:0;
  z-index:8;
  background:#fbfcfb;
}
.product-table .column-head th,
.order-table .column-head th{
  position:sticky!important;
  top:40px;
  z-index:7;
  background:#fff;
}
.product-table .filter-row th,
.order-table .filter-row th{
  position:sticky;
  top:86px;
  z-index:6;
  background:#f8fbfa;
  box-shadow:0 1px 0 #edf1ef,0 8px 14px rgba(17,61,55,.04);
}
.column-head th{position:sticky!important;line-height:46px}
.table-panel{
  display:flex;
  flex-direction:column;
  min-height:0;
  max-height:min(720px,calc(100vh - 220px));
  background:#fff;
}
.table-panel .table-viewport{
  flex:1 1 auto;
  min-height:0;
  max-height:none;
}
.table-footer{
  flex:0 0 auto;
  position:sticky;
  bottom:0;
  z-index:9;
  background:#fbfdfc;
  border-top:1px solid #edf1ef;
  box-shadow:0 -8px 18px rgba(17,61,55,.05);
}
.table-footer :deep(.pagination-bar){
  border-top:0;
}

</style>
