<template>
  <div class="support-center">
    <aside class="conversation-panel">
      <div class="support-panel-head">
        <div>
          <h2>在线客服</h2>
          <p>{{ openCount }} 个进行中会话</p>
        </div>
        <button title="刷新" @click="loadConversations">↻</button>
      </div>

      <div class="conversation-search">
        <span>⌕</span>
        <input v-model.trim="keyword" placeholder="搜索用户、商户、订单或消息">
      </div>

      <div class="conversation-tabs">
        <button :class="{ active: tab === 'open' }" @click="tab = 'open'">接待中 <span>{{ openCount }}</span></button>
        <button :class="{ active: tab === 'all' }" @click="tab = 'all'">全部会话</button>
      </div>

      <div class="conversation-list">
        <button v-for="c in filtered" :key="c.id" :class="{ active: selected?.id === c.id }" @click="selectConversation(c)">
          <i>{{ avatarText(c.user_name) }}<em v-if="c.user_online"></em></i>
          <span>
            <b>{{ c.user_name }}</b>
            <small class="conversation-type">{{ conversationTypeName(c) }}</small>
            <small>{{ formatConversationPreview(c.last_message) || '新会话，等待回复' }}</small>
          </span>
          <label>
            <time>{{ formatListTime(c.updated_at) }}</time>
            <strong v-if="c.unread_admin">{{ c.unread_admin }}</strong>
          </label>
        </button>
        <div v-if="!filtered.length" class="support-empty">暂无客服会话</div>
      </div>
    </aside>

    <main v-if="selected" class="chat-panel">
      <header class="chat-head">
        <div class="chat-user-avatar">{{ avatarText(selected.user_name) }}</div>
        <div>
          <h3>{{ selected.user_name }}</h3>
          <p>
            <i :class="{ online: selected.user_online }"></i>
            {{ selected.user_online ? '用户在线' : '用户离线' }} · {{ selected.user_id }}
          </p>
          <p v-if="selected.conversation_type === 'study_order'" class="order-line">
            {{ selected.school_name || '商户' }} · {{ selected.product_name || '学习订单' }} · {{ selected.order_no }}
          </p>
        </div>
        <div class="chat-head-actions">
          <button @click="$emit('toast', '已标记为重点会话')">☆ 重点</button>
          <button v-if="selected.status === 'open'" class="finish" @click="finishConversation">结束会话</button>
          <span v-else>已结束</span>
        </div>
      </header>

      <div ref="messageBox" class="admin-messages">
        <div class="conversation-start">会话开始于 {{ formatDate(selected.created_at) }}</div>
        <div v-for="m in messages" :key="m.id" class="admin-message" :class="messageClass(m)">
          <div v-if="m.sender_role !== 'admin'" class="message-avatar" :class="m.sender_role">{{ roleAvatar(m) }}</div>
          <div class="message-content">
            <small>
              <span class="role-pill" :class="m.sender_role">{{ roleName(m.sender_role) }}</span>
              {{ m.sender_name }} · {{ formatTime(m.created_at) }}
            </small>
            <div>
              <template v-if="m.message_type === 'image'">
                <div v-if="!m.image_load_failed" class="chat-image-wrap">
                <img
                  :src="getAdminImageUrl(m)"
                  class="chat-image"
                  loading="lazy"
                  alt="上传图片"
                  @click="previewAdminImage(m)"
                  @error="handleAdminImageError(m)"
                >
                  <div v-if="m.uploading" class="chat-image-mask"><i></i></div>
                </div>
                <div v-else class="chat-image-failed">图片加载失败</div>
                <p v-if="m.content">{{ m.content }}</p>
              </template>
              <template v-else-if="m.message_type === 'order_card'">
                <div class="support-order-message" @click="openOrderCard(m)">
                  <img v-if="parseOrderCard(m).image" :src="parseOrderCard(m).image" alt="">
                  <i v-else>{{ parseOrderCard(m).badge }}</i>
                  <span>
                    <b>{{ parseOrderCard(m).title }}</b>
                    <small>{{ parseOrderCard(m).orderNo }}</small>
                    <em>{{ parseOrderCard(m).statusText }}</em>
                  </span>
                </div>
              </template>
              <template v-else>{{ m.content }}</template>
            </div>
          </div>
          <div v-if="m.sender_role === 'admin'" class="message-avatar admin">平</div>
        </div>
        <div v-if="typingText" class="user-typing">{{ typingText }}</div>
      </div>

      <footer class="admin-composer">
        <div class="composer-tools">
          <button @click="insertQuick('您好，请问有什么可以帮您？')">常用语</button>
          <label class="upload-btn">
            图片
            <input type="file" accept="image/*" @change="uploadImage">
          </label>
          <span :class="{ connected: socketConnected }">{{ socketConnected ? '实时通道已连接' : '实时通道重连中' }}</span>
        </div>
        <textarea
          v-model="content"
          :disabled="selected.status !== 'open'"
          placeholder="输入平台客服回复，Enter 发送，Shift + Enter 换行"
          @keydown.enter.exact.prevent="sendMessage"
        ></textarea>
        <div class="composer-foot">
          <small>
            快捷回复：
            <button v-for="q in quickReplies" :key="q" @click="insertQuick(q)">{{ q }}</button>
          </small>
          <button class="send-message" :disabled="!content.trim() || !socketConnected || selected.status !== 'open'" @click="sendMessage">发送消息</button>
        </div>
      </footer>
    </main>

    <aside v-if="selected" class="customer-context">
      <div class="customer-card">
        <div class="context-avatar">{{ avatarText(selected.user_name) }}</div>
        <h3>{{ selected.user_name }}</h3>
        <p>{{ selected.user_id }}</p>
        <div class="context-tags">
          <span>{{ selected.user_online ? '用户在线' : '用户离线' }}</span>
          <span>{{ selected.status === 'open' ? '接待中' : '已结束' }}</span>
        </div>
      </div>

      <section v-if="selected.conversation_type === 'study_order'">
        <h4>订单客服</h4>
        <div><span>商户学校</span><b>{{ selected.school_name || '-' }}</b></div>
        <div><span>学习产品</span><b>{{ selected.product_name || '-' }}</b></div>
        <div><span>订单号</span><b>{{ selected.order_no || '-' }}</b></div>
      </section>

      <section>
        <h4>在线状态</h4>
        <div><span>用户在线</span><b>{{ selected.user_online ? '是' : '否' }}</b></div>
        <div><span>商户在线</span><b>{{ selected.merchant_online ? '是' : '否' }}</b></div>
        <div><span>平台在线</span><b>{{ selected.admin_online ? '是' : '否' }}</b></div>
      </section>

      <section>
        <h4>未读统计</h4>
        <div><span>用户未读</span><b>{{ selected.unread_user }}</b></div>
        <div><span>商户未读</span><b>{{ selected.unread_merchant || 0 }}</b></div>
        <div><span>平台未读</span><b>{{ selected.unread_admin }}</b></div>
      </section>

      <section>
        <h4>最近在线</h4>
        <div><span>用户</span><b>{{ formatDate(selected.last_user_online_at) }}</b></div>
        <div><span>商户</span><b>{{ formatDate(selected.last_merchant_online_at) }}</b></div>
        <div><span>平台</span><b>{{ formatDate(selected.last_admin_online_at) }}</b></div>
      </section>
    </aside>

    <main v-else class="no-conversation">
      <i>🎧</i>
      <h2>选择一条会话开始接待</h2>
      <p>平台客服可以进入普通平台客服会话，也可以参与用户与商户的订单会话。</p>
    </main>
    <div v-if="previewImageUrl" class="image-lightbox" @click="previewImageUrl = ''">
      <button @click.stop="previewImageUrl = ''">×</button>
      <img :src="previewImageUrl" alt="图片预览" @click.stop>
    </div>
    <div v-if="orderDetail" class="order-detail-mask" @click="orderDetail = null">
      <div class="order-detail-modal" @click.stop>
        <button @click="orderDetail = null">×</button>
        <div class="order-detail-head">
          <img v-if="orderDetail.image" :src="orderDetail.image" alt="">
          <i v-else>{{ orderDetail.badge }}</i>
          <div>
            <small>{{ orderDetail.type === 'travel' ? '旅行订单' : '学习订单' }}</small>
            <h3>{{ orderDetail.title }}</h3>
            <p>{{ orderDetail.orderNo }}</p>
          </div>
        </div>
        <div class="order-detail-grid">
          <div><span>订单状态</span><b>{{ orderDetail.statusText }}</b></div>
          <div><span>订单编号</span><b>{{ orderDetail.orderNo }}</b></div>
          <div><span>{{ orderDetail.metaLabelA || '订单类型' }}</span><b>{{ orderDetail.metaValueA || (orderDetail.type === 'travel' ? '旅行服务' : '学习服务') }}</b></div>
          <div><span>{{ orderDetail.metaLabelB || '内部 ID' }}</span><b>{{ orderDetail.metaValueB || orderDetail.rawId || '-' }}</b></div>
        </div>
        <p class="order-detail-tip">当前在客服小窗口查看订单卡片；如需处理合同、履约或退款，请到对应订单管理页面继续操作。</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { api, getSupportWebSocket, resolveApiAssetThumbUrl, resolveApiAssetUrl } from '../services/api'
import { cacheSupportImage, getCachedSupportImage } from '../services/imageCache'

const emit = defineEmits(['toast'])
const conversations = ref([])
const selected = ref(null)
const messages = ref([])
const keyword = ref('')
const tab = ref('open')
const content = ref('')
const socketConnected = ref(false)
const typingRole = ref('')
const messageBox = ref(null)
const previewImageUrl = ref('')
const orderDetail = ref(null)
const quickReplies = ['积分兑换说明', '预约须知', '商户客服已加入', '平台客服正在协助处理']

let socket = null
let pollTimer = null
let reconnectTimer = null
let manualClose = false
let conversationsRequestId = 0
let conversationSelectionId = 0

const openCount = computed(() => conversations.value.filter(c => c.status === 'open').length)
const formatConversationPreview = value => {
  const text = String(value || '')
  return text.includes('鍥') || text.includes('图') || text.includes('圖片') ? '[图片]' : text
}
const filtered = computed(() => {
  const key = keyword.value.trim()
  return conversations.value.filter(c => {
    const passTab = tab.value === 'all' || c.status === 'open'
    const text = `${c.user_name}${c.user_id}${formatConversationPreview(c.last_message)}${c.school_name || ''}${c.product_name || ''}${c.order_no || ''}`
    return passTab && (!key || text.includes(key))
  })
})
const typingText = computed(() => {
  if (!typingRole.value) return ''
  return `${roleName(typingRole.value)}正在输入...`
})

const avatarText = value => String(value || '客').slice(0, 1)
const roleName = role => ({ user: '用户', merchant: '商户客服', admin: '平台客服' }[role] || role)
const roleAvatar = message => message.sender_role === 'merchant' ? '商' : avatarText(selected.value?.user_name)
const messageClass = message => ({ user: 'from-user', merchant: 'from-merchant', admin: 'from-admin' }[message.sender_role] || '')
const conversationTypeName = c => c.conversation_type === 'study_order'
  ? `订单客服 · ${c.school_name || '商户'}`
  : '平台客服'
const parseOrderCard = message => {
  try {
    const data = message?.extra && Object.keys(message.extra).length
      ? message.extra
      : (typeof message?.content === 'string' ? JSON.parse(message.content) : (message?.content || {}))
    return {
      type: data.type || 'study',
      badge: data.badge || (data.type === 'travel' ? '旅' : '学'),
      title: data.title || '订单',
      orderNo: data.orderNo || data.order_no || '-',
      statusText: data.statusText || '待处理',
      image: data.image || '',
      rawId: data.rawId || data.id || '',
      metaLabelA: data.metaLabelA || '',
      metaValueA: data.metaValueA || '',
      metaLabelB: data.metaLabelB || '',
      metaValueB: data.metaValueB || '',
    }
  } catch {
    return { type: 'study', badge: '单', title: '订单信息', orderNo: '-', statusText: '待处理', image: '', rawId: '', metaLabelA: '', metaValueA: '', metaLabelB: '', metaValueB: '' }
  }
}
const openOrderCard = message => { orderDetail.value = parseOrderCard(message) }
const formatTime = value => (value ? new Date(value).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '')
const formatDate = value => (value ? new Date(value).toLocaleString('zh-CN') : '暂无')
const formatListTime = value => (value ? new Date(value).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '')
const scrollBottom = () => nextTick(() => {
  if (messageBox.value) messageBox.value.scrollTop = messageBox.value.scrollHeight
})

const getAdminImageUrl = message => message.local_preview || message.cached_image_src || message.resolved_image_url || resolveApiAssetUrl(message.image_url)
const getAdminFullImageUrl = message => message?.local_preview || resolveApiAssetUrl(message?.image_url || message?.resolved_image_url || message?.image_thumb_url)
const previewAdminImage = message => {
  const url = getAdminFullImageUrl(message)
  if (url) previewImageUrl.value = url
}
const handleAdminImageError = message => {
  if (!message) return
  if (message.local_preview) return
  message.cached_image_src = ''
  if (!message.thumb_failed) {
    message.thumb_failed = true
    message.resolved_image_url = resolveApiAssetUrl(message.image_url)
    return
  }
  message.image_load_failed = true
}
const hydrateImageMessage = message => {
  if (!message || message.message_type !== 'image' || message.local_preview) return message
  const remoteUrl = message.image_thumb_url ? resolveApiAssetUrl(message.image_thumb_url) : resolveApiAssetThumbUrl(message.image_url)
  message.resolved_image_url = remoteUrl
  getCachedSupportImage(remoteUrl).then(src => {
    if (src && src !== remoteUrl) message.cached_image_src = src
  })
  setTimeout(() => {
    cacheSupportImage(remoteUrl, src => {
      if (src) message.cached_image_src = src
    })
  }, 300)
  return message
}
const hydrateImageMessages = list => list.map(item => hydrateImageMessage(item))

const loadConversations = async () => {
  const requestId = ++conversationsRequestId
  try {
    const list = await api.getSupportConversations()
    if (requestId !== conversationsRequestId) return
    conversations.value = list
    if (selected.value) {
      const fresh = list.find(c => c.id === selected.value.id)
      if (fresh) Object.assign(selected.value, fresh)
    } else if (list.length) {
      await selectConversation(list[0])
    }
  } catch (error) {
    emit('toast', error.message || '客服列表加载失败')
  }
}

const closeSocket = () => {
  manualClose = true
  clearTimeout(reconnectTimer)
  if (socket) socket.close()
  socket = null
  socketConnected.value = false
}

const connectSocket = () => {
  if (!selected.value) return
  manualClose = false
  const { url, protocols } = getSupportWebSocket(selected.value.id)
  socket = new WebSocket(url, protocols)
  socket.onopen = () => { socketConnected.value = true }
  socket.onmessage = event => {
    let data = null
    try { data = JSON.parse(event.data) } catch { return }
    if (data.type === 'message') {
      if (!messages.value.some(m => m.id === data.message.id)) {
        const incoming = hydrateImageMessage(data.message)
        if (incoming.message_type === 'image' && incoming.sender_role === 'admin') {
          const pending = messages.value.find(m => m.local_pending && m.sender_role === 'admin')
          if (pending) {
            if (pending.local_preview?.startsWith('blob:')) URL.revokeObjectURL(pending.local_preview)
            Object.assign(pending, incoming, {
              local_preview: '',
              local_pending: false,
              uploading: false,
            })
            if (selected.value) selected.value.last_message = '[鍥剧墖]'
            typingRole.value = ''
            scrollBottom()
            loadConversations()
            return
          }
        }
        messages.value.push(incoming)
      }
      if (selected.value) selected.value.last_message = data.message.message_type === 'image' ? '[图片]' : data.message.content
      typingRole.value = ''
      scrollBottom()
      loadConversations()
    } else if (data.type === 'presence' && selected.value) {
      if (data.role === 'user') selected.value.user_online = data.online
      if (data.role === 'merchant') selected.value.merchant_online = data.online
      if (data.role === 'admin') selected.value.admin_online = data.online
    } else if (data.type === 'typing') {
      typingRole.value = data.typing ? data.role : ''
    } else if (data.type === 'status' && selected.value) {
      selected.value.status = data.status
    }
  }
  socket.onclose = () => {
    socketConnected.value = false
    if (!manualClose) reconnectTimer = setTimeout(connectSocket, 2000)
  }
  socket.onerror = () => { socketConnected.value = false }
}

const selectConversation = async conversation => {
  const selectionId = ++conversationSelectionId
  closeSocket()
  selected.value = { ...conversation }
  typingRole.value = ''
  try {
    const nextMessages = hydrateImageMessages(await api.getSupportMessages(conversation.id))
    if (selectionId !== conversationSelectionId || selected.value?.id !== conversation.id) return
    messages.value = nextMessages
  } catch {
    if (selectionId !== conversationSelectionId) return
    messages.value = []
  }
  if (selectionId !== conversationSelectionId || selected.value?.id !== conversation.id) return
  connectSocket()
  scrollBottom()
}

const sendMessage = () => {
  const text = content.value.trim()
  if (!text || !socketConnected.value || selected.value?.status !== 'open') return
  socket.send(JSON.stringify({ type: 'message', content: text }))
  content.value = ''
}
const insertQuick = text => { content.value = text }

const uploadImage = async event => {
  const file = event.target.files?.[0]
  if (!file || !selected.value) return
  let pendingMessage = null
  let previewUrl = ''
  try {
    previewUrl = URL.createObjectURL(file)
    pendingMessage = {
      id: `local-admin-${Date.now()}`,
      sender_role: 'admin',
      sender_name: '平台客服',
      message_type: 'image',
      image_url: previewUrl,
      local_preview: previewUrl,
      local_pending: true,
      uploading: true,
      content: '',
      created_at: new Date().toISOString(),
    }
    messages.value.push(pendingMessage)
    scrollBottom()
    const result = await api.uploadSupportImage(selected.value.id, file)
    Object.assign(pendingMessage, {
      image_url: result.url,
      image_thumb_url: result.thumb_url || result.url,
      resolved_image_url: result.thumb_url ? resolveApiAssetUrl(result.thumb_url) : resolveApiAssetThumbUrl(result.url),
    })
    if (!socket || socket.readyState !== WebSocket.OPEN) throw new Error('客服连接已断开，请稍后重试')
    socket.send(JSON.stringify({
      type: 'message',
      message_type: 'image',
      image_url: result.url,
      image_thumb_url: result.thumb_url || result.url,
      content: '',
    }))
  } catch (error) {
    if (pendingMessage) messages.value = messages.value.filter(item => item !== pendingMessage)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    emit('toast', error.message || '图片上传失败')
  } finally {
    event.target.value = ''
  }
}

const finishConversation = async () => {
  if (!confirm('确认结束本次客服会话吗？用户或商户再次发消息时会沿用原有历史记录。')) return
  try {
    selected.value = await api.closeSupportConversation(selected.value.id)
    emit('toast', '客服会话已结束')
    await loadConversations()
  } catch {
    emit('toast', '结束会话失败')
  }
}

onMounted(() => {
  loadConversations()
  pollTimer = setInterval(loadConversations, 5000)
})

onUnmounted(() => {
  clearInterval(pollTimer)
  closeSocket()
  messages.value.forEach(message => {
    if (message.local_preview?.startsWith('blob:')) URL.revokeObjectURL(message.local_preview)
  })
})
</script>

<style scoped>
.support-center{height:calc(100vh - 76px);display:grid;grid-template-columns:310px minmax(560px,1fr) 286px;background:#edf2f0;overflow:hidden;color:#14332e}.conversation-panel,.customer-context,.chat-panel{background:#fff;min-height:0}.conversation-panel{border-right:1px solid #dfe6e3;display:flex;flex-direction:column}.support-panel-head{height:76px;padding:0 18px;display:flex;align-items:center;justify-content:space-between}.support-panel-head h2{font-size:20px;margin:0 0 5px}.support-panel-head p{font-size:12px;color:#849590;margin:0}.support-panel-head button{border:1px solid #dce5e2;background:#fff;border-radius:12px;width:36px;height:36px;font-size:18px;cursor:pointer}.conversation-search{margin:0 14px 13px;background:#f3f6f5;border-radius:14px;padding:13px;color:#8b9a96;display:flex;align-items:center;gap:8px}.conversation-search input{border:0;background:transparent;outline:0;font-size:13px;width:100%}.conversation-tabs{display:flex;border-bottom:1px solid #e7ecea;padding:0 14px}.conversation-tabs button{flex:1;border:0;background:transparent;padding:13px 10px;font-size:13px;color:#758680;border-bottom:3px solid transparent;cursor:pointer}.conversation-tabs button.active{color:#078d7b;border-color:#12a594;font-weight:800}.conversation-tabs span{background:#ff7a35;color:#fff;border-radius:20px;padding:2px 7px;font-size:11px}.conversation-list{overflow-y:auto;flex:1}.conversation-list>button{width:100%;border:0;border-bottom:1px solid #edf1ef;background:#fff;padding:14px;display:flex;gap:11px;text-align:left;align-items:center;cursor:pointer}.conversation-list>button:hover,.conversation-list>button.active{background:#eef8f5}.conversation-list>button>i{position:relative;font-style:normal;width:45px;height:45px;border-radius:15px;background:linear-gradient(135deg,#ffe4d2,#e1f4ef);display:grid;place-items:center;font-weight:900;color:#27675c;flex:0 0 45px}.conversation-list>button>i em{position:absolute;right:-1px;bottom:-1px;width:10px;height:10px;border:2px solid #fff;border-radius:50%;background:#39c790}.conversation-list>button>span{flex:1;min-width:0}.conversation-list b,.conversation-list small{display:block}.conversation-list b{font-size:14px}.conversation-list small{font-size:12px;color:#81908c;margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.conversation-list .conversation-type{color:#0a8d7c;font-weight:700}.conversation-list label{text-align:right}.conversation-list time,.conversation-list strong{display:block}.conversation-list time{font-size:11px;color:#9ba7a4}.conversation-list strong{margin:7px 0 0 auto;background:#ff7044;color:#fff;width:20px;height:20px;border-radius:50%;font-size:11px;text-align:center;line-height:20px}.chat-panel{display:flex;flex-direction:column}.chat-head{height:86px;border-bottom:1px solid #e5ebe9;display:flex;align-items:center;padding:0 22px;gap:12px}.chat-user-avatar,.context-avatar{width:48px;height:48px;border-radius:16px;background:linear-gradient(135deg,#ffe1cd,#dff3ee);display:grid;place-items:center;font-weight:900;color:#27675d}.chat-head h3,.chat-head p{margin:0}.chat-head h3{font-size:18px}.chat-head p{font-size:12px;color:#81928e;margin-top:4px}.chat-head .order-line{color:#c26f35}.chat-head p i{display:inline-block;width:9px;height:9px;border-radius:50%;background:#aab5b2;margin-right:6px}.chat-head p i.online{background:#32c88e}.chat-head-actions{margin-left:auto;display:flex;gap:8px;align-items:center}.chat-head-actions button{border:1px solid #dbe5e2;background:#fff;border-radius:10px;padding:8px 12px;font-size:12px;cursor:pointer}.chat-head-actions button.finish{color:#d36351}.chat-head-actions span{font-size:12px;color:#899995}.admin-messages{flex:1;overflow-y:auto;padding:24px;background:#f7f9f8}.conversation-start{text-align:center;color:#98a5a2;font-size:11px;margin:4px 0 20px}.admin-message{display:flex;gap:10px;margin:18px 0;align-items:flex-start}.admin-message.from-admin{justify-content:flex-end}.message-avatar{width:36px;height:36px;border-radius:12px;display:grid;place-items:center;font-size:13px;font-weight:900;flex:0 0 36px}.message-avatar.user{background:#dff1ec;color:#137e70}.message-avatar.merchant{background:#fff0dd;color:#c87326}.message-avatar.admin{background:#ff8950;color:#fff}.message-content{max-width:70%}.message-content small{font-size:11px;color:#94a09d;margin-bottom:6px;display:flex;align-items:center;gap:6px}.role-pill{border-radius:999px;padding:2px 7px;font-size:10px;background:#eef3f1;color:#5d706b}.role-pill.user{background:#e1f4ee;color:#08816f}.role-pill.merchant{background:#fff0dd;color:#c87326}.role-pill.admin{background:#ffe8da;color:#df6b2d}.message-content>div{background:#fff;border:1px solid #e6ecea;border-radius:5px 15px 15px 15px;padding:11px 14px;font-size:14px;line-height:1.7;box-shadow:0 5px 14px rgba(17,61,55,.04)}.from-admin .message-content{text-align:right}.from-admin .message-content small{justify-content:flex-end}.from-admin .message-content>div{background:#16a18f;color:#fff;border:0;border-radius:15px 5px 15px 15px;text-align:left}.from-merchant .message-content>div{background:#fff7ed;border-color:#ffe0bd}.chat-image{max-width:260px;max-height:260px;border-radius:12px;display:block}.chat-image-failed{width:180px;height:125px;border-radius:12px;background:#f3f6f5;color:#8a9b96;display:grid;place-items:center;font-size:12px}.message-content p{margin:8px 0 0}.user-typing{font-size:12px;color:#869590;margin-left:46px}.admin-composer{height:210px;border-top:1px solid #e2e9e6;padding:12px 16px;display:flex;flex-direction:column}.composer-tools{display:flex;gap:8px;align-items:center}.composer-tools button,.composer-foot small button,.upload-btn{border:0;background:#f2f5f4;border-radius:8px;padding:7px 10px;font-size:12px;color:#647671;cursor:pointer}.upload-btn input{display:none}.composer-tools span{margin-left:auto;font-size:12px;color:#c37c45}.composer-tools span.connected{color:#09927f}.admin-composer textarea{border:0;outline:0;resize:none;flex:1;padding:12px 3px;font-size:14px}.composer-foot{display:flex;align-items:center;justify-content:space-between}.composer-foot small{font-size:12px;color:#92a09c}.composer-foot small button{margin-left:6px}.send-message{border:0;background:#ff7a35;color:#fff;border-radius:10px;padding:10px 20px;font-size:13px;cursor:pointer}.send-message:disabled{opacity:.4}.customer-context{border-left:1px solid #dfe7e4;padding:18px;overflow-y:auto}.customer-card{text-align:center;border-bottom:1px solid #e9eeec;padding:8px 0 18px}.context-avatar{width:58px;height:58px;border-radius:19px;margin:auto;font-size:20px}.customer-card h3{font-size:16px;margin:10px 0 4px}.customer-card p{font-size:11px;color:#8b9996;margin:0}.context-tags span{display:inline-block;font-size:11px;padding:5px 8px;border-radius:20px;background:#e5f5f1;color:#098b79;margin:9px 3px 0}.context-tags span:last-child{background:#fff0e5;color:#d96e2f}.customer-context section{padding:16px 0;border-bottom:1px solid #e9eeec}.customer-context h4{font-size:14px;margin:0 0 12px}.customer-context section>div{display:flex;justify-content:space-between;gap:12px;font-size:12px;padding:7px 0}.customer-context section>div span{color:#84938f}.customer-context section>div b{text-align:right;word-break:break-all}.support-empty,.no-conversation{text-align:center;color:#8c9c98}.support-empty{font-size:13px;padding:35px}.no-conversation{display:grid;place-content:center;background:#f7f9f8}.no-conversation i{font-style:normal;font-size:46px}.no-conversation h2{font-size:18px;color:#38534e;margin:12px 0 5px}.no-conversation p{font-size:13px}
.chat-image-wrap{position:relative;display:inline-block;max-width:260px;border-radius:12px;overflow:hidden;vertical-align:top}.chat-image{cursor:zoom-in}.chat-image-mask{position:absolute;inset:0;background:rgba(8,34,30,.38);display:grid;place-items:center;backdrop-filter:blur(2px)}.chat-image-mask i{width:32px;height:32px;border-radius:50%;border:3px solid rgba(255,255,255,.38);border-top-color:#fff;animation:chatSpin .76s linear infinite}.image-lightbox{position:fixed;inset:0;z-index:5000;background:rgba(8,22,20,.78);display:flex;align-items:center;justify-content:center;padding:32px}.image-lightbox img{max-width:92vw;max-height:88vh;object-fit:contain;border-radius:16px;box-shadow:0 22px 70px rgba(0,0,0,.35)}.image-lightbox button{position:absolute;right:30px;top:24px;width:42px;height:42px;border:0;border-radius:50%;background:rgba(255,255,255,.95);font-size:28px;line-height:38px;color:#173f38;cursor:pointer}.support-order-message{width:280px;display:flex;gap:12px;align-items:center;padding:12px;border:1px solid #dfe9e5;border-radius:16px;background:#fbfdfc;cursor:pointer;box-shadow:0 8px 18px rgba(17,61,55,.05)}.support-order-message img,.support-order-message i{width:58px;height:58px;border-radius:14px;flex:0 0 58px}.support-order-message img{object-fit:cover}.support-order-message i{display:grid;place-items:center;font-style:normal;background:linear-gradient(135deg,#ff8a4c,#ffc18f);color:#fff;font-weight:900;font-size:20px}.support-order-message span{min-width:0;flex:1;text-align:left}.support-order-message b,.support-order-message small,.support-order-message em{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.support-order-message b{font-size:14px;color:#173f38}.support-order-message small{margin-top:4px;color:#7f908b}.support-order-message em{margin-top:7px;font-style:normal;color:#0a8d7c;font-weight:800;font-size:12px}.order-detail-mask{position:fixed;inset:0;z-index:4999;background:rgba(8,22,20,.44);display:grid;place-items:center;padding:24px}.order-detail-modal{position:relative;width:min(520px,92vw);background:#fff;border-radius:24px;padding:24px;box-shadow:0 28px 90px rgba(0,0,0,.22)}.order-detail-modal>button{position:absolute;right:18px;top:18px;width:36px;height:36px;border:0;border-radius:12px;background:#f1f5f3;color:#31534d;font-size:24px;cursor:pointer}.order-detail-head{display:flex;gap:16px;align-items:center;padding-right:42px}.order-detail-head img,.order-detail-head i{width:82px;height:82px;border-radius:20px;flex:0 0 82px}.order-detail-head img{object-fit:cover}.order-detail-head i{display:grid;place-items:center;background:linear-gradient(135deg,#13a38f,#ff8a4c);color:#fff;font-style:normal;font-size:28px;font-weight:900}.order-detail-head small,.order-detail-head h3,.order-detail-head p{display:block;margin:0}.order-detail-head small{color:#0a8d7c;font-weight:800}.order-detail-head h3{margin-top:6px;font-size:20px}.order-detail-head p{margin-top:5px;color:#7d8d89;word-break:break-all}.order-detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:22px}.order-detail-grid div{padding:14px;border-radius:14px;background:#f5f8f7}.order-detail-grid span,.order-detail-grid b{display:block}.order-detail-grid span{color:#80908c;font-size:12px}.order-detail-grid b{margin-top:6px;word-break:break-all}.order-detail-tip{margin:18px 0 0;color:#7d8d89;font-size:12px;line-height:1.7}@keyframes chatSpin{to{transform:rotate(360deg)}}
</style>
