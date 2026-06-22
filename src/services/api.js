const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1'
const ADMIN_KEY = import.meta.env.VITE_ADMIN_API_KEY || 'xuetuxing-dev-key'

async function request(path, options = {}, admin = true) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(admin ? { 'X-Admin-Key': ADMIN_KEY } : {}),
      ...options.headers,
    },
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.detail || `接口请求失败：${response.status}`)
  }
  return response.status === 204 ? null : response.json()
}

export const api = {
  health: () => fetch(`${API_BASE.replace('/api/v1', '')}/health`).then(r => r.json()),
  getDraft: () => request('/admin/decoration/draft'),
  saveDraft: content => request('/admin/decoration/draft', { method: 'PUT', body: JSON.stringify(content) }),
  publish: content => request('/admin/decoration/publish', { method: 'POST', body: JSON.stringify(content) }),
  getPublished: () => request('/public/config', {}, false),
  getRoutes: () => request('/admin/routes'),
  createRoute: route => request('/admin/routes', { method: 'POST', body: JSON.stringify(route) }),
  updateRoute: route => request(`/admin/routes/${route.id}`, { method: 'PUT', body: JSON.stringify(route) }),
  setRouteStatus: (id, enabled) => request(`/admin/routes/${id}/status?enabled=${enabled}`, { method: 'PATCH' }),
  getAnnouncements: () => request('/admin/announcements'),
  createAnnouncement: announcement => request('/admin/announcements', { method: 'POST', body: JSON.stringify(announcement) }),
  updateAnnouncement: announcement => request(`/admin/announcements/${announcement.id}`, { method: 'PUT', body: JSON.stringify(announcement) }),
  setAnnouncementStatus: (id, enabled) => request(`/admin/announcements/${id}/status?enabled=${enabled}`, { method: 'PATCH' }),
  deleteAnnouncement: id => request(`/admin/announcements/${id}`, { method: 'DELETE' }),
  getPointRule: () => request('/admin/points/rule'),
  savePointRule: rule => request('/admin/points/rule', { method: 'PUT', body: JSON.stringify(rule) }),
  getOrders: status => request(`/admin/orders${status == null ? '' : `?status=${status}`}`),
  reviewOrder: (id, payload) => request(`/admin/orders/${id}/review`, { method: 'PATCH', body: JSON.stringify(payload) }),
  getPreferences: () => request('/admin/preferences'),
  getSupportConversations: () => request('/support/admin/conversations'),
  getSupportMessages: id => request(`/support/admin/conversations/${id}/messages`),
  closeSupportConversation: id => request(`/support/admin/conversations/${id}/close`, { method: 'PATCH' }),
}

export const getSupportWebSocketUrl = id => `${API_BASE.replace(/^http/, 'ws')}/support/ws/${id}?role=admin&token=${encodeURIComponent(ADMIN_KEY)}`
