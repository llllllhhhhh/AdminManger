import { describe, expect, it } from 'vitest'
import {
  isTravelCheckinPending,
  isTravelFulfillmentOpen,
  paymentStatusName,
  reviewStatusName,
  travelFulfillmentStatusName,
} from '../src/utils/orderStatus'

describe('admin order status helpers', () => {
  it('maps known and unknown values consistently', () => {
    expect(paymentStatusName('paid')).toBe('已支付')
    expect(reviewStatusName('pending')).toBe('待审核')
    expect(travelFulfillmentStatusName('qr_issued')).toBe('待核销')
    expect(paymentStatusName('custom')).toBe('custom')
  })

  it('identifies terminal and check-in states', () => {
    expect(isTravelFulfillmentOpen('completed')).toBe(false)
    expect(isTravelFulfillmentOpen('info_pending')).toBe(true)
    expect(isTravelCheckinPending('qr_issued')).toBe(true)
    expect(isTravelCheckinPending('completed')).toBe(false)
  })
})
