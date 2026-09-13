# 教师个人博客

前后端分离架构的个人博客系统，支持 PC 和移动端访问。

## 技术栈

- 前端：Vue 3 + Vite + Element Plus + Pinia
- 后端：Node.js + Express + better-sqlite3
- 认证：JWT
- 数据库：SQLite（零运维）

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
