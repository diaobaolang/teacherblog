const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initDatabase, db } = require('./db');
const { saveMiddleware } = require('./middleware/db-save');

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const carouselRoutes = require('./routes/carousel');
const articleRoutes = require('./routes/articles');
const messageRoutes = require('./routes/messages');
const uploadRoutes = require('./routes/upload');

const { errorHandler, notFound } = require('./middleware/error-handler');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件 - 上传的图片
app.use('/uploads', express.static(path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads')));

// 每次写操作后自动保存数据库到文件
app.use(saveMiddleware(db));

// 公开 API 路由
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/carousel', carouselRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin/upload', uploadRoutes);

// 错误处理
app.use(notFound);
app.use(errorHandler);

// 初始化数据库后启动服务
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`[teacherblog] 后端服务已启动: http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('[teacherblog] 数据库初始化失败:', err);
  process.exit(1);
});
