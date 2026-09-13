const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// 统一包装 async 路由异常（需在加载路由前引入），
// 避免未捕获异常导致请求悬挂、进程退出
require('./middleware/async-handler');

const { initDatabase } = require('./db');

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const honorwallRoutes = require('./routes/honorwall');
const classwallRoutes = require('./routes/classwall');
const articleRoutes = require('./routes/articles');
const messageRoutes = require('./routes/messages');
const uploadRoutes = require('./routes/upload');
const carouselRoutes = require('./routes/carousel');

const { errorHandler, notFound } = require('./middleware/error-handler');
const { isConfigured: isStorageConfigured } = require('./storage');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件 - 上传的图片（新上传已改为云存储直链，这里仅兜底本地历史文件）
app.use('/uploads', express.static(path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads')));

// 公开 API 路由
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/honorwall', honorwallRoutes);
app.use('/api/classwall', classwallRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin/upload', uploadRoutes);
app.use('/api/carousel', carouselRoutes);

// 错误处理
app.use(notFound);
app.use(errorHandler);

// 进程级兜底：打印异常但不让服务直接退出
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});

// 初始化数据库后启动服务
initDatabase().then(() => {
  if (!isStorageConfigured()) {
    console.warn('[teacherblog] 未配置 CLOUDBASE_API_KEY，图片上传到云存储将不可用');
  }
  app.listen(PORT, () => {
    console.log(`[teacherblog] 后端服务已启动: http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('[teacherblog] 数据库初始化失败:', err);
  process.exit(1);
});
