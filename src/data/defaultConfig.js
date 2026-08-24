export const componentCatalog = [
  { type: 'banner', name: '轮播海报', icon: '▣', desc: '首页大图、活动主视觉、专题封面' },
  { type: 'activity', name: '积分活动', icon: '◉', desc: '邀请积分、权益进度、兑换入口' },
  { type: 'grid', name: '功能宫格', icon: '▦', desc: '快捷入口、分类导航、个人中心菜单' },
  { type: 'study', name: '学习任务', icon: '✓', desc: '备考计划、打卡进度、学习服务' },
  { type: 'smart', name: '智能定制', icon: '✦', desc: 'AI 路线匹配、人工定制入口' },
  { type: 'routes', name: '路线推荐', icon: '⌁', desc: '展示已上架旅行路线卡片' },
  { type: 'schools', name: '入驻学校', icon: '校', desc: '展示已审核入驻学校' },
  { type: 'articles', name: '文章列表', icon: '文', desc: '用户协议、平台规则、内容文章' },
  { type: 'video', name: '种草视频', icon: '▶', desc: 'OBS 视频播放、案例故事、宣传素材' },
  { type: 'notice', name: '公告文本', icon: '≡', desc: '提示说明、规则文案、底部说明' },
  { type: 'spacer', name: '留白间距', icon: '↕', desc: '控制页面模块之间的呼吸感' },
]

const img = {
  mountain: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1200',
  travel: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200',
  study: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200',
  school: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200',
  video: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=900',
}

export const defaultPages = [
  {
    id: 'home',
    name: '小程序首页',
    path: '/pages/index/index',
    status: 'published',
    blocks: [
      { id: 'home_banner', type: 'banner', name: '首页轮播', visible: true, title: '备考上岸，全包定制长线旅行', subtitle: '用一次远行，奖励认真生活的自己', image: img.mountain, badge: '上岸限定', background: '#0f6f66' },
      { id: 'home_activity', type: 'activity', name: '积分活动横幅', visible: true, title: '邀好友赚积分，免费泰山经典游', subtitle: '当前积分 / 100 积分', button: '立即邀请', progress: 68, background: '#fff5e9', link: '/pages/points/activity' },
      { id: 'home_grid', type: 'grid', name: '核心功能宫格', visible: true, title: '学 · 游一站式服务', items: ['备考刷题', '资料商城', '定制旅行', '邀请有礼', '我的积分', '上岸权益'], columns: 3 },
      { id: 'home_study', type: 'study', name: '今日上岸计划', visible: true, title: '连续打卡 7 天', subtitle: '今天再完成 2 项，离目标更近一步', progress: 72 },
    ],
  },
  {
    id: 'travel',
    name: '旅行首页',
    path: '/pages/travel/index',
    status: 'published',
    blocks: [
      { id: 'travel_smart', type: 'smart', name: '智能定制入口', visible: true, title: '一键生成专属路线', subtitle: '30 秒匹配你的积分预算与偏好', button: '开始定制', label: 'AI 智能匹配', labelColor: '#128c7e', background: '#eef8f5', padding: 24, titleColor: '#173f38', textColor: '#60736e', shadow: 'soft', link: '/pages/custom/params' },
      { id: 'travel_routes', type: 'routes', name: '推荐路线', visible: true, title: '为你推荐', subtitle: '仅展示已上架路线' },
      { id: 'travel_video', type: 'video', name: '种草短视频', visible: true, title: '上岸学长旅行种草', subtitle: '考试结束后的第一站，去看山河辽阔', image: img.video, video_url: '' },
    ],
  },
  {
    id: 'points',
    name: '邀请有礼页',
    path: '/pages/points/activity',
    status: 'published',
    blocks: [
      { id: 'points_board', type: 'activity', name: '积分数据看板', visible: true, title: '当前可用积分', subtitle: '满 100 积分兑换泰山游', button: '立即兑换', progress: 68, background: '#153e38' },
      { id: 'points_share', type: 'grid', name: '分享方式', visible: true, title: '分享给好友', items: ['小程序卡片', '专属邀请海报', '复制邀请链接'], columns: 3 },
      { id: 'points_rule', type: 'notice', name: '积分规则', visible: true, title: '积分与兑换规则', subtitle: '积分 1 年内有效，每年限兑 1 次泰山游' },
    ],
  },
  {
    id: 'study',
    name: '学习服务页',
    path: '/pages/study/index',
    status: 'published',
    blocks: [
      { id: 'study_banner', type: 'banner', name: '学习服务头图', visible: true, title: '陪你认真备考，一步一步去上岸', subtitle: '督学陪伴 · 资料课程 · 长期规划', image: img.study, badge: '学习成长计划', background: '#173f38' },
      { id: 'study_center', type: 'study', name: '学习中心入口', visible: true, title: '我的学习中心', subtitle: '查看已购课程、会员权益和学习进度', progress: 45 },
      { id: 'study_notice', type: 'notice', name: '试看说明', visible: true, title: '先体验，再决定', subtitle: '支持免费试看、资料试读和顾问咨询' },
    ],
  },
  {
    id: 'mine',
    name: '个人中心',
    path: '/pages/mine/index',
    status: 'published',
    blocks: [
      { id: 'mine_asset', type: 'activity', name: '用户资产', visible: true, title: '我的积分与权益', subtitle: '积分、订单、学习服务统一管理', progress: 72, background: '#eaf7f3' },
      { id: 'mine_grid', type: 'grid', name: '个人功能入口', visible: true, title: '我的服务', items: ['我的积分', '我的旅行', '上岸权益', '我的订单', '收藏路线', '学习记录'], columns: 3 },
    ],
  },
  {
    id: 'schools',
    name: '入驻学校页',
    path: '/pages/schools/index',
    status: 'published',
    blocks: [
      { id: 'schools_banner', type: 'banner', name: '站点头图', visible: true, title: '当前已入驻学校', subtitle: '查找你的学校站点，获取本校服务与活动', image: img.school, badge: '校园站点', background: '#173f38' },
      { id: 'schools_list', type: 'schools', name: '学校列表', visible: true, title: '其他站点', subtitle: '仅展示已审核通过并上架的学校' },
    ],
  },
  {
    id: 'articles',
    name: '文章中心页',
    path: '/pages/article/index',
    status: 'published',
    blocks: [
      { id: 'articles_banner', type: 'banner', name: '文章中心头图', visible: true, title: '平台规则与内容中心', subtitle: '用户协议、隐私政策、服务说明都在这里', image: img.study, badge: '内容中心', background: '#173f38' },
      { id: 'articles_list', type: 'articles', name: '文章列表', visible: true, title: '推荐阅读', subtitle: '展示已发布文章' },
    ],
  },
  {
    id: 'notice',
    name: '平台公告页',
    path: '/pages/notice/index',
    status: 'published',
    blocks: [
      { id: 'notice_banner', type: 'banner', name: '公告头图', visible: true, title: '平台公告', subtitle: '活动、审核、服务变更会第一时间同步', image: img.travel, badge: '消息中心', background: '#173f38' },
      { id: 'notice_text', type: 'notice', name: '公告说明', visible: true, title: '重要消息不错过', subtitle: '点击首页铃铛可查看全部公告与已读状态' },
    ],
  },
  {
    id: 'taishan',
    name: '泰山兑换详情页',
    path: '/pages/taishan/detail',
    status: 'draft',
    blocks: [
      { id: 'taishan_banner', type: 'banner', name: '泰山路线封面', visible: true, title: '泰山经典游 2 天 1 夜', subtitle: '满 100 积分即可预约兑换', image: img.mountain, badge: '积分专属', background: '#173f38' },
      { id: 'taishan_notice', type: 'notice', name: '预约须知', visible: true, title: '预约须知', subtitle: '需提前 7 天预约，仅限本人使用，不可转让或折现' },
    ],
  },
  {
    id: 'support',
    name: '在线客服页',
    path: '/pages/support/chat',
    status: 'draft',
    blocks: [
      { id: 'support_notice', type: 'notice', name: '客服说明', visible: true, title: '学徒行在线客服', subtitle: '路线定制、积分兑换、订单预约都可以在这里问我' },
    ],
  },
]

export const defaultOnboarding = {
  enabled: true,
  version: 3,
  eyebrow: '个性化学习向导',
  title: '先认识你，再推荐更合适的内容',
  description: '用 4 个简单问题建立学习画像，后续课程、资料和顾问服务会更贴近你的目标。',
  completionText: '完成并开启学徒行',
  allowSkip: false,
  heroImage: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200',
  steps: [
    {
      key: 'stage',
      type: 'single',
      required: true,
      title: '你目前处于哪个学习阶段？',
      description: '我们会据此安排学习节奏与内容难度',
      options: ['大一在读', '大二在读', '大三在读', '大四在读', '已毕业，准备考试', '在职备考'],
    },
    {
      key: 'target',
      type: 'single',
      required: true,
      title: '你的目标考试时间是？',
      description: '目标时间用于生成阶段计划，之后可在学习中心修改',
      options: ['2026 年 12 月', '2027 年 12 月', '2028 年 12 月', '暂未确定'],
    },
    {
      key: 'schoolMajorStatus',
      type: 'single',
      required: true,
      title: '院校和专业确认了吗？',
      description: '我们会根据确认进度推荐择校、择专业或备考内容',
      options: ['只确认了专业', '只确认了院校', '院校和专业都确认了', '都还没有确认'],
    },
    {
      key: 'interests',
      type: 'multiple',
      required: true,
      max: 3,
      title: '你重点关注哪些学科？',
      description: '最多选择 3 项，用于优化学习内容和服务推荐',
      options: ['考研数学', '计算机', '人工智能', '电子信息', '电气工程', '机械工程', '经管', '法学', '教育学', '医药化工', '其他专业'],
    },
  ],
}

export const defaultConfig = {
  brand: {
    name: '学徒行',
    slogan: '愿你提笔上岸，收笔远行',
    logoText: '行',
    primary: '#ff7a35',
    secondary: '#12a594',
    background: '#f6f7f4',
    dark: '#172c2a',
  },
  pages: defaultPages,
  onboarding: defaultOnboarding,
  routes: [
    { id: 1, name: '川西雪山轻徒步', category: '户外', days: '5天4晚', price: 3680, stock: 42, agency: '山海旅行', display_weight: 30, status: true, image: 'https://images.unsplash.com/photo-1464278533981-50106e6176b1?w=600' },
    { id: 2, name: '泉州非遗漫游', category: '研学', days: '3天2晚', price: 1580, stock: 28, agency: '知行文旅', display_weight: 20, status: true, image: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=600' },
    { id: 3, name: '青岛海风毕业季', category: '团建', days: '3天2晚', price: 1880, stock: 0, agency: '青年假日', display_weight: 10, status: false, image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600' },
  ],
  points: {
    inviteScore: 1,
    checkinScore: 1,
    purchaseScore: 5,
    exchangeScore: 100,
    validDays: 365,
    yearlyLimit: 1,
    monthlyStock: 50,
    inviteEnabled: true,
    checkinEnabled: true,
    purchaseEnabled: true,
    enabled: true,
  },
}

export const cloneDefault = () => JSON.parse(JSON.stringify(defaultConfig))

export const mergeDefaultConfig = source => {
  const base = cloneDefault()
  if (!source || typeof source !== 'object') return base
  const next = {
    ...base,
    ...source,
    brand: { ...base.brand, ...(source.brand || {}) },
    points: { ...base.points, ...(source.points || {}) },
    onboarding: {
      ...base.onboarding,
      ...(source.onboarding || {}),
      steps: Array.isArray(source.onboarding?.steps) && source.onboarding.steps.length
        ? source.onboarding.steps
        : base.onboarding.steps,
    },
    routes: Array.isArray(source.routes) ? source.routes : base.routes,
  }
  const sourcePages = Array.isArray(source.pages) ? source.pages : []
  const sourceMap = new Map(sourcePages.map(page => [page.id, page]))
  const mergePage = basePage => {
    const sourcePage = sourceMap.get(basePage.id) || {}
    const hasValidBlocks = Array.isArray(sourcePage.blocks) && sourcePage.blocks.length > 0
    return {
      ...basePage,
      ...sourcePage,
      blocks: hasValidBlocks ? sourcePage.blocks : basePage.blocks,
    }
  }
  next.pages = [
    ...base.pages.map(mergePage),
    ...sourcePages
      .filter(page => !base.pages.some(item => item.id === page.id))
      .filter(page => Array.isArray(page.blocks) && page.blocks.length > 0),
  ]
  return next
}
