export const componentCatalog = [
  { type: 'banner', name: '轮播海报', icon: '▣', desc: '主视觉轮播内容' },
  { type: 'activity', name: '积分活动', icon: '◆', desc: '邀友积分进度卡' },
  { type: 'grid', name: '功能宫格', icon: '▦', desc: '快捷功能入口' },
  { type: 'study', name: '学习任务', icon: '✓', desc: '备考任务与进度' },
  { type: 'smart', name: '智能定制', icon: '✦', desc: 'AI 路线匹配入口' },
  { type: 'routes', name: '路线推荐', icon: '⌁', desc: '旅行路线卡片' },
  { type: 'video', name: '种草视频', icon: '▷', desc: '学长旅行内容流' },
  { type: 'notice', name: '公告文本', icon: '≡', desc: '自定义通知内容' }
]

export const defaultConfig = {
  brand: {
    name: '学徒行', slogan: '愿你提笔上岸，收笔远行', logoText: '行',
    primary: '#ff7a35', secondary: '#12a594', background: '#f6f7f4', dark: '#172c2a'
  },
  pages: [
    {
      id: 'home', name: '小程序首页', path: '/pages/index/index', status: 'published',
      blocks: [
        { id: 'b1', type: 'banner', name: '首页轮播', visible: true, title: '备考上岸，全包定制长线旅行', subtitle: '用一次远行，奖励认真生活的自己', image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1200', badge: '上岸限定', color: '#ffffff', background: '#0f6f66' },
        { id: 'b2', type: 'activity', name: '积分活动横幅', visible: true, title: '邀好友赚积分，免费泰山经典游', subtitle: '当前 68 积分 / 100 积分', button: '立即邀请', progress: 68, background: '#fff5e9' },
        { id: 'b3', type: 'grid', name: '核心功能宫格', visible: true, title: '学 · 游一站式服务', items: ['备考刷题','资料商城','定制旅行','邀请有礼','我的积分','上岸权益'], columns: 3 },
        { id: 'b4', type: 'study', name: '今日上岸计划', visible: true, title: '连续打卡 7 天', subtitle: '今天再完成 2 项，离目标更近一步', progress: 72 },
        { id: 'b5', type: 'notice', name: '底部励志语', visible: true, title: '“愿你提笔上岸，收笔远行。”', subtitle: '— 学徒行' }
      ]
    },
    {
      id: 'travel', name: '旅行首页', path: '/pages/travel/index', status: 'published',
      blocks: [
        { id: 't1', type: 'smart', name: '智能定制入口', visible: true, title: '一键生成专属路线', subtitle: '30 秒匹配你的积分预算与偏好', button: '开始定制', background: '#dff5ef' },
        { id: 't2', type: 'routes', name: '推荐路线', visible: true, title: '为你推荐', subtitle: '瀑布灵感路线' },
        { id: 't3', type: 'video', name: '种草短视频', visible: true, title: '上岸学长旅行种草', subtitle: '考研结束后的第一站，去看山河辽阔', image: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=900' }
      ]
    },
    {
      id: 'points', name: '邀请有礼页', path: '/pages/points/activity', status: 'published',
      blocks: [
        { id: 'p1', type: 'activity', name: '积分数据看板', visible: true, title: '当前可用积分', subtitle: '还差 32 人兑换泰山游', button: '立即兑换', progress: 68, background: '#153e38' },
        { id: 'p2', type: 'grid', name: '分享方式', visible: true, title: '分享给好友', items: ['小程序卡片','专属邀请海报','复制邀请链接'], columns: 3 },
        { id: 'p3', type: 'notice', name: '积分规则', visible: true, title: '积分与兑换规则', subtitle: '积分 1 年内有效，每年限兑 1 次泰山游' }
      ]
    },
    {
      id: 'mine', name: '个人中心', path: '/pages/mine/index', status: 'draft',
      blocks: [
        { id: 'm1', type: 'activity', name: '用户资产', visible: true, title: '小徒同学 · 备考中', subtitle: '68 积分 · 3 条收藏路线', progress: 72, background: '#eaf7f3' },
        { id: 'm2', type: 'grid', name: '个人功能入口', visible: true, title: '我的服务', items: ['我的积分','我的旅行','上岸权益','我的订单','收藏路线','学习记录'], columns: 3 }
      ]
    }
  ],
  routes: [
    { id: 1, name: '川西雪山轻徒步', category: '户外', days: '5天4夜', price: 3680, stock: 42, agency: '山海旅行', status: true, image: 'https://images.unsplash.com/photo-1464278533981-50106e6176b1?w=600' },
    { id: 2, name: '泉州非遗漫游', category: '研学', days: '3天2夜', price: 1580, stock: 28, agency: '知行文旅', status: true, image: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=600' },
    { id: 3, name: '青岛海风毕业季', category: '团建', days: '3天2夜', price: 1880, stock: 0, agency: '青年假日', status: false, image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600' }
  ],
  points: { inviteScore: 1, exchangeScore: 100, validDays: 365, yearlyLimit: 1, monthlyStock: 50, enabled: true }
}

export const cloneDefault = () => JSON.parse(JSON.stringify(defaultConfig))
