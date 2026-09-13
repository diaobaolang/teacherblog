# 教师个人博客

前后端分离架构的个人博客系统，支持 PC 和移动端访问。

## 技术栈

- 前端：Vue 3 + Vite + Element Plus + Pinia
- 后端：Node.js + Express
- 认证：JWT
- 数据库：CloudBase PostgreSQL（通过 HTTPS 数据 API 访问，无需自建连接）

## 项目结构

```
teacherblog/
├── frontend/          # 前端项目
├── backend/           # 后端项目
├── nginx/             # Nginx 配置
└── 技术方案.md
```

## 快速开始

### 1. 后端启动

```bash
cd backend
npm install
npm run init-db    # 初始化数据库（首次）
npm run dev       # 开发模式启动
```

后端默认运行在 `http://localhost:3001`

默认管理员账号：`admin` / `admin123456`（可在 `.env` 中修改）

### 2. 前端启动

```bash
cd frontend
npm install
npm run dev       # 开发模式启动
```

前端默认运行在 `http://localhost:5173`，已配置代理转发 API 到后端。

### 3. 构建部署

```bash
# 构建前端
cd frontend
npm run build     # 产物在 dist/ 目录

# 后端生产模式
cd backend
npm start
```

## 功能清单

### 前台页面
- 首页：轮播图 + 个人介绍 + 最新文章
- 文章列表：分页卡片展示
- 文章详情：富文本渲染
- 留言板：提交留言 + 查看已审核留言

### 后台管理（/admin）
- 仪表盘：数据统计 + 快捷入口
- 个人介绍管理：富文本编辑
- 轮播图管理：上传 / 删除 / 拖拽排序
- 文章管理：增删改查 + 富文本编辑 + 封面上传
- 留言审核：通过 / 拒绝 / 删除 / 拖拽排序

## 部署说明

详见 `nginx/teacherblog.conf` 和 `技术方案.md`。

### CloudBase 云部署

本项目已部署到腾讯云 CloudBase，使用以下云资源：

| 资源类型 | 说明 |
|---------|------|
| Cloud Run（云托管） | 后端 Node.js + Express 容器服务 |
| 静态托管 | 前端 Vue 3 构建产物 |

#### 访问地址

- **前端网站**：https://teacherblog-d5gpp8xax79a35603-1300097627.tcloudbaseapp.com/
- **后端 API**：https://teacherblog-api-313028-8-1300097627.sh.run.tcloudbase.com/api
- **后台管理**：https://teacherblog-d5gpp8xax79a35603-1300097627.tcloudbaseapp.com/#/admin/login

#### 环境信息

- **EnvId**：`teacherblog-d5gpp8xax79a35603`
- **区域**：ap-shanghai
- **套餐**：体验版
- **云托管服务名**：`teacherblog-api`
- **云托管规格**：0.25 核 CPU / 0.5GB 内存 / 1-3 实例

#### 默认管理员

- 用户名：`admin`
- 密码：`admin123456`

#### 后端环境变量

| 变量 | 值 |
|------|-----|
| `PORT` | 3000 |
| `NODE_ENV` | production |
| `CLOUDBASE_ENV_ID` | teacherblog-d5gpp8xax79a35603 |
| `CLOUDBASE_PUBLISHABLE_KEY` | 可选，未设置时使用 `src/db/index.js` 内置的默认 Publishable Key |
| `UPLOAD_DIR` | uploads |
| `JWT_SECRET` | teacherblog-jwt-secret-2026 |
| `ADMIN_USERNAME` | admin |
| `ADMIN_PASSWORD` | admin123456 |

#### 更新部署

前端调用的后端地址不再写死在源码里，而是构建时由 `frontend/.env.production` 注入
（`src/api/request.js` 读取 `import.meta.env.VITE_API_BASE`）：

```bash
# 1. 更新后端（改动了 backend 代码时）
#    通过 CloudBase manageCloudRun 工具对 teacherblog-api 重新 deploy

# 2. 更新前端
cd frontend
npm run build     # 自动读取 .env.production 的 VITE_API_BASE
#    通过 CloudBase manageHosting 工具 upload dist 目录
```

> - 若更换云托管服务或域名，只需修改 `frontend/.env.production` 里的 `VITE_API_BASE` 后重新构建。
> - 本地 `npm run dev` 不会读取该文件，仍由 Vite 代理转发到 `http://localhost:3001`。

#### 已知限制

上传接口 `/api/admin/upload` 把图片写入容器内的 `uploads/` 目录，而云托管容器未挂载持久化存储，因此：

- 在本地开发环境上传的图片不会出现在线上（线上容器里没有这些文件）；
- 每次重新部署后端，容器内之前上传的图片都会丢失。

如需图片持久化，建议改为上传至 CloudBase 云存储（COS），或为云托管挂载 CFS 文件存储。
