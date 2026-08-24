const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1'
const WS_BASE = import.meta.env.VITE_WS_BASE_URL || ''
const TOKEN_KEY = 'xuetuxing-admin-token'
const USER_KEY = 'xuetuxing-admin-user'

export const resolveApiAssetUrl = url => {
  if (!url) return ''
  if (String(url).startsWith('/uploads/')) {
    const origin = API_BASE.replace(/\/api\/v1\/?$/, '')
    return `${origin}/api/v1/public/assets/object/${String(url).replace(/^\/uploads\//, '')}`
  }
  const obsMatch = String(url).match(/^https?:\/\/[^/]*obs[^/]*\/(.+)$/)
  if (obsMatch) {
    const origin = API_BASE.replace(/\/api\/v1\/?$/, '')
    return `${origin}/api/v1/public/assets/object/${obsMatch[1]}`
  }
  if (/^https?:\/\//.test(url)) return url
  const origin = API_BASE.replace(/\/api\/v1\/?$/, '')
  return `${origin}${url.startsWith('/') ? '' : '/'}${url}`
}

export const resolveApiAssetThumbUrl = url => resolveApiAssetUrl(url)
  .replace(/\/api\/v1\/public\/assets\/(\d+)\/file(\?.*)?$/, '/api/v1/public/assets/$1/thumb$2')
  .replace(/\/api\/v1\/public\/assets\/object\/(.+)$/, '/api/v1/public/assets/object-thumb/$1')

export const getAdminToken = () => localStorage.getItem(TOKEN_KEY) || ''
export const getAdminUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null')
  } catch {
    return null
  }
}
export const setAdminSession = payload => {
  localStorage.setItem(TOKEN_KEY, payload.token)
  localStorage.setItem(USER_KEY, JSON.stringify(payload.user))
}
export const clearAdminSession = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

function buildHeaders(options = {}, admin = true) {
  const headers = { ...(options.headers || {}) }
  const token = getAdminToken()
  if (!(options.body instanceof FormData) && !headers['Content-Type']) headers['Content-Type'] = 'application/json'
  if (admin && token) headers.Authorization = `Bearer ${token}`
  return headers
}

async function request(path, options = {}, admin = true) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: buildHeaders(options, admin),
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.detail || `接口请求失败：${response.status}`)
  }
  return response.status === 204 ? null : response.json()
}

export const api = {
  health: () => fetch(`${API_BASE.replace('/api/v1', '')}/health`).then(r => r.json()),
  adminLogin: payload => request('/auth/admin/login', { method: 'POST', body: JSON.stringify(payload) }, false),
  getSliderCaptcha: () => request(`/auth/slider-captcha?_t=${Date.now()}`, {}, false),
  verifySliderCaptcha: payload => request('/auth/slider-captcha/verify', { method: 'POST', body: JSON.stringify(payload) }, false),
  adminMe: () => request('/auth/admin/me'),
  getDraft: () => request('/admin/decoration/draft'),
  saveDraft: content => request('/admin/decoration/draft', { method: 'PUT', body: JSON.stringify(content) }),
  publish: content => request('/admin/decoration/publish', { method: 'POST', body: JSON.stringify(content) }),
  getPublished: () => request(`/public/config?fresh=1&_t=${Date.now()}`, {}, false),
  getRoutes: () => request('/admin/routes'),
  getTravelRouteReviews: params => {
    const query = new URLSearchParams()
    if (params?.routeId) query.set('route_id', params.routeId)
    if (params?.status) query.set('review_status', params.status)
    const suffix = query.toString() ? `?${query.toString()}` : ''
    return request(`/admin/travel/route-reviews${suffix}`)
  },
  getTravelMatchSettings: () => request('/admin/travel-match/settings'),
  saveTravelMatchSettings: payload => request('/admin/travel-match/settings', {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  getSliderCaptchaSettings: () => request('/admin/slider-captcha/settings'),
  saveSliderCaptchaSettings: payload => request('/admin/slider-captcha/settings', {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  createRoute: route => request('/admin/routes', { method: 'POST', body: JSON.stringify(route) }),
  updateRoute: route => request(`/admin/routes/${route.id}`, { method: 'PUT', body: JSON.stringify(route) }),
  reviewRoute: (id, approved, rejectReason = '') => request(`/admin/routes/${id}/review`, {
    method: 'PATCH',
    body: JSON.stringify({ approved, reject_reason: rejectReason }),
  }),
  setRouteStatus: (id, enabled) => request(`/admin/routes/${id}/status?enabled=${enabled}`, { method: 'PATCH' }),
  getAnnouncements: () => request('/admin/announcements'),
  createAnnouncement: announcement => request('/admin/announcements', { method: 'POST', body: JSON.stringify(announcement) }),
  updateAnnouncement: announcement => request(`/admin/announcements/${announcement.id}`, { method: 'PUT', body: JSON.stringify(announcement) }),
  setAnnouncementStatus: (id, enabled) => request(`/admin/announcements/${id}/status?enabled=${enabled}`, { method: 'PATCH' }),
  deleteAnnouncement: id => request(`/admin/announcements/${id}`, { method: 'DELETE' }),
  getArticles: () => request('/admin/articles'),
  createArticle: article => request('/admin/articles', { method: 'POST', body: JSON.stringify(article) }),
  updateArticle: article => request(`/admin/articles/${article.id}`, { method: 'PUT', body: JSON.stringify(article) }),
  setArticleStatus: (id, enabled) => request(`/admin/articles/${id}/status?enabled=${enabled}`, { method: 'PATCH' }),
  deleteArticle: id => request(`/admin/articles/${id}`, { method: 'DELETE' }),
  getSchools: () => request('/admin/schools'),
  createSchool: school => request('/admin/schools', { method: 'POST', body: JSON.stringify(school) }),
  updateSchool: school => request(`/admin/schools/${school.id}`, { method: 'PUT', body: JSON.stringify(school) }),
  setSchoolStatus: (id, enabled) => request(`/admin/schools/${id}/status?enabled=${enabled}`, { method: 'PATCH' }),
  setCurrentSchool: id => request(`/admin/schools/${id}/current`, { method: 'PATCH' }),
  reviewSchool: (id, approved, rejectReason = '') => request(`/admin/schools/${id}/review`, {
    method: 'PATCH',
    body: JSON.stringify({ approved, reject_reason: rejectReason }),
  }),
  setSchoolMerchantPassword: (id, payload) => request(`/admin/schools/${id}/merchant-password`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }),
  deleteSchool: id => request(`/admin/schools/${id}`, { method: 'DELETE' }),
  getPointRule: () => request('/admin/points/rule'),
  savePointRule: rule => request('/admin/points/rule', { method: 'PUT', body: JSON.stringify(rule) }),
  getOrders: status => request(`/admin/orders${status == null ? '' : `?status=${status}`}`),
  reviewOrderContract: (id, payload) => request(`/admin/orders/${id}/contract/review`, { method: 'PATCH', body: JSON.stringify(payload) }),
  scheduleOrderPickup: (id, payload) => request(`/admin/orders/${id}/pickup/schedule`, { method: 'PATCH', body: JSON.stringify(payload) }),
  issueOrderQr: id => request(`/admin/orders/${id}/qr/issue`, { method: 'PATCH' }),
  checkInOrder: (id, token) => request(`/admin/orders/${id}/check-in?token=${encodeURIComponent(token)}`, { method: 'PATCH' }),
  startOrderTrip: id => request(`/admin/orders/${id}/trip/start`, { method: 'PATCH' }),
  completeOrder: id => request(`/admin/orders/${id}/complete`, { method: 'PATCH' }),
  cancelTravelOrder: (id, reason) => request(`/admin/orders/${id}/cancel`, { method: 'PATCH', body: JSON.stringify({ reason }) }),
  getTravelOrderAudit: id => request(`/admin/orders/${id}/audit`),
  markOrderException: (id, reason) => request(`/admin/orders/${id}/exception`, { method: 'PATCH', body: JSON.stringify({ reason }) }),
  getCustomTravelRequests: () => request('/admin/custom-travel/requests'),
  reviewCustomTravelRequest: (id, payload) => request(`/admin/custom-travel/requests/${id}/review`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }),
  getPreferences: () => request('/admin/preferences'),
  getUsers: registeredOnly => request(`/admin/users${registeredOnly ? '?registered_only=true' : ''}`),
  getUserDetail: id => request(`/admin/users/${id}`),
  reviewGraduation: (id, approved, rejectReason = '') => request(`/admin/users/${id}/graduation/review`, {
    method: 'PATCH',
    body: JSON.stringify({ approved, reject_reason: rejectReason }),
  }),
  getRegistrations: () => request('/admin/registrations'),
  reviewRegistration: (id, approved) => request(`/admin/registrations/${id}/review`, { method: 'PATCH', body: JSON.stringify({ approved }) }),
  updateUserStatus: (id, status) => request(`/admin/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  resetUserPassword: (id, password) => request(`/admin/users/${id}/password`, { method: 'PATCH', body: JSON.stringify({ password }) }),
  adjustUserWallet: (id, payload) => request(`/admin/users/${id}/wallet/adjust`, { method: 'POST', body: JSON.stringify(payload) }),
  adjustUserPoints: (id, payload) => request(`/admin/users/${id}/points/adjust`, { method: 'POST', body: JSON.stringify(payload) }),
  getImageAssets: params => {
    const query = new URLSearchParams()
    if (params?.source) query.set('source', params.source)
    if (params?.storage) query.set('storage', params.storage)
    const suffix = query.toString() ? `?${query.toString()}` : ''
    return request(`/admin/assets/images${suffix}`)
  },
  getUploadSettings: () => request('/admin/upload/settings'),
  saveUploadSettings: payload => request('/admin/upload/settings', { method: 'PUT', body: JSON.stringify(payload) }),
  getContractTemplate: () => request('/admin/contract-template'),
  saveContractTemplate: payload => request('/admin/contract-template', { method: 'PUT', body: JSON.stringify(payload) }),
  getStudyProducts: () => request('/admin/study/products'),
  createStudyProduct: product => request('/admin/study/products', { method: 'POST', body: JSON.stringify(product) }),
  updateStudyProduct: product => request(`/admin/study/products/${product.id}`, { method: 'PUT', body: JSON.stringify(product) }),
  reviewStudyProduct: (id, approved, rejectReason = '') => request(`/admin/study/products/${id}/review`, {
    method: 'PATCH',
    body: JSON.stringify({ approved, reject_reason: rejectReason }),
  }),
  setStudyProductStatus: (id, enabled) => request(`/admin/study/products/${id}/status?enabled=${enabled}`, { method: 'PATCH' }),
  getStudyOrders: () => request('/admin/study/orders'),
  getSupportConversations: () => request('/support/admin/conversations'),
  getSupportMessages: id => request(`/support/admin/conversations/${id}/messages`),
  closeSupportConversation: id => request(`/support/admin/conversations/${id}/close`, { method: 'PATCH' }),
  uploadSupportImage: (conversationId, file) => {
    const body = new FormData()
    body.append('conversation_id', conversationId)
    body.append('role', 'admin')
    body.append('file', file)
    return request('/support/upload', { method: 'POST', body })
  },
}

export const getSupportWebSocketUrl = id => {
  const token = getAdminToken()
  const wsBase = WS_BASE || (API_BASE.startsWith('http')
    ? API_BASE.replace(/^http/, 'ws')
    : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}${API_BASE}`)
  return `${wsBase}/support/ws/${id}?role=admin&token=${encodeURIComponent(token)}`
}
