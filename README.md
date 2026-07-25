# 学徒行管理后台（Vue 3 + Vite）

管理后台用于运营管理：页面装修、用户审核、用户管理、入驻学校、商户产品审核、学习产品、订单审核、旅行路线、人工定制方案、平台公告、文章系统、图片资源、用户偏好和在线客服。

## 本地启动

先启动后端 `xuetuxingServer`，再启动管理端：

```bash
cd outputs/xuetuxingAdmin
npm install
npm run dev
```

访问：

```text
http://localhost:5178
```

默认管理员：

- 账号：`13800000000`
- 密码：`admin123456`

## 连接线上后端

本地管理端连接公网后端：

```bash
npm run dev:remote
```

读取 `.env.remote`：

```env
VITE_API_BASE_URL=http://113.44.149.128/api/v1
VITE_WS_BASE_URL=ws://113.44.149.128/api/v1
```

## 生产构建

```bash
npm run build
```

输出目录：

```text
dist
```

上传部署时，把 `dist` 里的所有文件放到服务器：

```text
/var/www/admin
```

如果你已经把新 `dist` 上传到 `/root/pythonServer/dist`，可在服务器执行：

```bash
sudo rm -rf /var/www/admin/*
sudo cp -r /root/pythonServer/dist/* /var/www/admin/
sudo nginx -t
sudo systemctl reload nginx
```

## Nginx 配置重点

管理端是前端单页应用，必须配置回退到 `index.html`：

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

API 代理：

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8000/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

客服 WebSocket：

```nginx
location /api/v1/support/ws/ {
    proxy_pass http://127.0.0.1:8000/api/v1/support/ws/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
}
```

## 功能使用说明

### 页面装修

1. 打开「页面装修」。
2. 拖拽组件到指定位置。
3. 已有组件之间可拖动交换位置。
4. 点击「保存草稿」保存当前编辑。
5. 点击「发布」后，用户端首页读取最新发布内容。

注意：用户端展示的是「已发布」内容，不是草稿。

### 用户注册审核

1. 用户端提交注册申请。
2. 管理端打开「注册审核」。
3. 通过后用户才能登录。
4. 驳回后用户需要重新提交或联系平台。

### 用户管理

支持：

- 查看用户列表
- 查看用户详情
- 查看注册状态、账号状态、余额、积分
- 修改密码
- 停用 / 恢复 / 注销账号
- 查看录取通知书认证信息
- 审核录取通知书
- 调整用户余额

### 入驻学校管理

学校入驻流程：

1. 商户端提交学校入驻申请。
2. 管理端在「入驻学校」中审核。
3. 审核通过并上架后，用户端站点页展示该学校。
4. 管理端可配置商户账号密码。
5. 学校商户使用该账号登录商户端。

### 学习产品与付费服务

产品来源有两种：

- 管理端直接维护。
- 商户端提交，管理端审核。

管理端可以：

- 按商户 / 学校区分产品。
- 审核商户提交的学习产品。
- 上架 / 下架产品。
- 查看学习服务订单。
- 查看订单所属商户和学校。

### 订单审核中心

用于统一处理：

- 积分兑换订单
- 人工深度定制旅行需求
- 学习服务订单
- 上岸权益相关订单
- 旅行合同签名审核

人工深度定制流程：

1. 用户端提交定制需求。
2. 管理端「订单审核中心」出现「人工深度定制」订单。
3. 点击「通过」填写方案：
   - 方案标题
   - 方案说明
   - 预估积分 / 报价
   - 每日行程
   - 包含项目
   - 预约须知
4. 审核通过后，用户端方案页展示对应内容。
5. 驳回后，用户端展示驳回原因。

旅行合同签名审核流程：

1. 在「订单审核中心」点击「合同模板」，维护合同标题、正文和可选出行日期。
2. 用户端「我的旅行」展示平台合同内容，用户选择出行日期后手写签名并提交。
3. 管理端「订单审核中心」的合同签名列显示「待审核」。
4. 点击「合同」查看签署人、联系电话、证件号、出行日期、合同正文、历史时间和手写签名图片。
5. 平台通过后，用户端合同状态变为「合同已通过」。
6. 平台驳回后，用户端展示驳回原因并允许重新签署。

### 旅行路线管理

- 新增 / 编辑路线。
- 上架 / 下架路线。
- 下架后用户端不展示。
- 管理路线分类、积分、库存、旅行社。

### 平台公告

管理铃铛消息：

- 新增公告
- 设置是否置顶
- 设置是否发布
- 用户端铃铛同步显示公告

### 文章系统

用于维护：

- 用户协议
- 隐私政策
- 平台规则
- 帮助中心文章

用户端可通过文章接口读取并展示。

### 图片资源

管理所有上传图片：

- 客服图片
- 录取通知书
- 学校 logo
- 路线图片
- 其他业务图片

图片建议存储到 OBS，管理端展示后端代理地址，避免直接暴露私有桶。

### 在线客服

支持：

- 平台客服
- 商户客服
- 用户、商户、平台三方订单会话
- 图片上传
- 历史消息
- 在线状态
- 会话关闭

## 常见问题

### 1. 登录接口 404

确认后端是最新版本，并重启 FastAPI。打开：

```text
http://127.0.0.1:8000/docs
```

检查是否存在对应接口。

### 2. 打包后线上没更新

只运行 `npm run build` 不会自动替换服务器文件。需要把新 `dist` 覆盖到 `/var/www/admin`。

### 3. WebSocket 一直重连

检查：

- 后端是否运行
- Nginx 是否配置 WebSocket upgrade
- `VITE_WS_BASE_URL` 是否正确

### 4. 图片显示 403

OBS 私有桶不能直接访问。应使用后端图片代理接口或配置公共读权限。

## 构建检查

```bash
npm run build
```

构建成功后再部署。
