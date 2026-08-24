import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  api,
  getAdminToken,
  resolveApiAssetThumbUrl,
  setAdminSession,
} from '../src/services/api'

const response = (body, { ok = true, status = 200 } = {}) => ({
  ok,
  status,
  json: vi.fn().mockResolvedValue(body),
})

describe('admin api', () => {
  beforeEach(() => vi.stubGlobal('fetch', vi.fn()))

  it('persists the session and sends the bearer token', async () => {
    setAdminSession({ token: 'admin-token', user: { id: 1 } })
    fetch.mockResolvedValue(response([]))

    await api.getAnnouncements()

    expect(getAdminToken()).toBe('admin-token')
    expect(fetch).toHaveBeenCalledWith('/api/v1/admin/announcements', expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer admin-token' }),
    }))
  })

  it('surfaces backend detail and handles empty responses', async () => {
    fetch.mockResolvedValueOnce(response({ detail: '无权操作' }, { ok: false, status: 403 }))
    await expect(api.getAnnouncements()).rejects.toThrow('无权操作')

    fetch.mockResolvedValueOnce(response(null, { status: 204 }))
    await expect(api.deleteAnnouncement(9)).resolves.toBeNull()
  })

  it('does not force a JSON content type for image uploads', async () => {
    setAdminSession({ token: 'token', user: {} })
    fetch.mockResolvedValue(response({ url: '/asset/1' }))

    await api.uploadSupportImage('conversation-1', new File(['x'], 'x.png', { type: 'image/png' }))

    const options = fetch.mock.calls[0][1]
    expect(options.body).toBeInstanceOf(FormData)
    expect(options.headers['Content-Type']).toBeUndefined()
    expect(options.headers.Authorization).toBe('Bearer token')
  })

  it('normalizes private asset thumbnail URLs', () => {
    expect(resolveApiAssetThumbUrl('/api/v1/public/assets/12/file')).toBe('/api/v1/public/assets/12/thumb')
    expect(resolveApiAssetThumbUrl('/uploads/support/a.png')).toContain('/api/v1/public/assets/object-thumb/support/a.png')
  })
})
