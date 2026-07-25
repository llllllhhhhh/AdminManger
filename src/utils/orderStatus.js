export const COMMERCE_PAYMENT_STATUS = Object.freeze({
  PENDING: 'pending',
  PAID: 'paid',
  CANCELED: 'canceled',
  REFUNDED: 'refunded',
})

export const REVIEW_STATUS = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
})

export const TRAVEL_CONTRACT_STATUS = Object.freeze({
  UNSIGNED: 'unsigned',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
})

export const TRAVEL_FULFILLMENT_STATUS = Object.freeze({
  CONTRACT_PENDING: 'contract_pending',
  CONTRACT_REVIEWING: 'contract_reviewing',
  CONTRACT_REJECTED: 'contract_rejected',
  INFO_PENDING: 'info_pending',
  INFO_SUBMITTED: 'info_submitted',
  PICKUP_CONFIRMED: 'pickup_confirmed',
  USER_CONFIRMED: 'user_confirmed',
  QR_ISSUED: 'qr_issued',
  CHECKED_IN: 'checked_in',
  IN_TRIP: 'in_trip',
  COMPLETED: 'completed',
  EXCEPTION: 'exception',
  CANCELLED: 'cancelled',
})

export const commercePaymentStatusText = Object.freeze({
  pending: '待支付',
  paid: '已支付',
  canceled: '已取消',
  cancelled: '已取消',
  refunded: '已退款',
})

export const reviewStatusText = Object.freeze({
  pending: '待审核',
  approved: '已通过',
  rejected: '已驳回',
})

export const travelContractStatusText = Object.freeze({
  unsigned: '未签署',
  pending: '待审核',
  approved: '已通过',
  rejected: '已驳回',
})

export const travelFulfillmentStatusText = Object.freeze({
  contract_pending: '待签合同',
  contract_reviewing: '合同审核中',
  contract_rejected: '合同驳回',
  info_pending: '待填接送',
  info_submitted: '待安排接送',
  pickup_confirmed: '待用户确认',
  user_confirmed: '待核销',
  qr_issued: '已发核销码',
  checked_in: '已核销',
  in_trip: '行程中',
  completed: '已完成',
  exception: '异常',
  cancelled: '已取消',
})

export const statusText = (map, value, fallback = '待处理') => map[value] || fallback
export const paymentStatusName = value => statusText(commercePaymentStatusText, value, value || '待支付')
export const reviewStatusName = value => statusText(reviewStatusText, value, value || '待审核')
export const travelContractStatusName = value => statusText(travelContractStatusText, value, '未签署')
export const travelFulfillmentStatusName = value => statusText(travelFulfillmentStatusText, value, '待处理')

export const travelFulfillmentTone = value => ({
  completed: 'green',
  checked_in: 'green',
  in_trip: 'green',
  exception: 'red',
  info_submitted: 'orange',
  pickup_confirmed: 'orange',
  user_confirmed: 'orange',
  qr_issued: 'orange',
  cancelled: 'gray',
}[value] || 'gray')

export const travelContractTone = value => ({ pending: 'orange', approved: 'green', rejected: 'red' }[value] || 'gray')

export const isTravelFulfillmentOpen = status => ![
  TRAVEL_FULFILLMENT_STATUS.COMPLETED,
  TRAVEL_FULFILLMENT_STATUS.CANCELLED,
  TRAVEL_FULFILLMENT_STATUS.EXCEPTION,
].includes(status)

export const isTravelCheckinPending = status => [
  TRAVEL_FULFILLMENT_STATUS.USER_CONFIRMED,
  TRAVEL_FULFILLMENT_STATUS.QR_ISSUED,
].includes(status)
