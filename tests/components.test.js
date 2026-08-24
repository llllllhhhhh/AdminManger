import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const apiMock = vi.hoisted(() => ({
  getAnnouncements: vi.fn(),
  getSliderCaptcha: vi.fn(),
  verifySliderCaptcha: vi.fn(),
  adminLogin: vi.fn(),
}))

vi.mock('../src/services/api', async importOriginal => ({
  ...(await importOriginal()),
  api: apiMock,
}))

import App from '../src/App.vue'
import AnnouncementManager from '../src/components/AnnouncementManager.vue'
import SliderCaptcha from '../src/components/SliderCaptcha.vue'

describe('admin component smoke tests', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders an empty announcement state', async () => {
    apiMock.getAnnouncements.mockResolvedValue([])
    const wrapper = mount(AnnouncementManager)
    await flushPromises()
    expect(wrapper.text()).toContain('暂无符合条件的公告')
  })

  it('emits a toast when announcement loading fails', async () => {
    apiMock.getAnnouncements.mockRejectedValue(new Error('网络不可用'))
    const wrapper = mount(AnnouncementManager)
    await flushPromises()
    expect(wrapper.emitted('toast')[0]).toEqual(['网络不可用'])
  })

  it('loads a slider challenge and handles refresh failures', async () => {
    apiMock.getSliderCaptcha.mockResolvedValue({
      enabled: true,
      challenge_id: 'challenge-1',
      title: '安全验证',
      description: '请拖动',
      image: '/captcha.jpg',
      shape: 'square',
      target_x: 120,
      piece_y: 40,
      piece_size: 42,
    })
    const wrapper = mount(SliderCaptcha)
    await flushPromises()
    expect(wrapper.text()).toContain('安全验证')

    apiMock.getSliderCaptcha.mockRejectedValue(new Error('加载失败'))
    await wrapper.find('.captcha-head button').trigger('click')
    await flushPromises()
    expect(wrapper.emitted('toast').at(-1)).toEqual(['加载失败'])
  })

  it('requires a slider ticket before submitting admin credentials', async () => {
    apiMock.getSliderCaptcha.mockResolvedValue({
      enabled: true,
      challenge_id: 'login-challenge',
      title: '安全验证',
      description: '请拖动',
      image: '/captcha.jpg',
      shape: 'rounded',
      target_x: 120,
      piece_y: 40,
      piece_size: 42,
    })
    const wrapper = mount(App)
    const inputs = wrapper.findAll('.login-form input')
    await inputs[0].setValue('admin')
    await inputs[1].setValue('secret')
    await wrapper.find('.login-form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('.slider-modal-mask').exists()).toBe(true)
    expect(apiMock.adminLogin).not.toHaveBeenCalled()
  })
})
