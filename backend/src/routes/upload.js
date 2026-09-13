const express = require('express');
const multer = require('multer');
const path = require('path');
const { authMiddleware } = require('../middleware/auth');
const { uploadObject, MIME_BY_EXT } = require('../storage');

const router = express.Router();

const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB，与存储桶 file_size_limit 保持一致

// 图片先读进内存再转存云存储：
// 云托管容器没有持久化存储，落盘的文件重新部署后会丢失
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXT.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件格式，仅支持 jpg/jpeg/png/gif/webp'));
    }
  }
});

// 管理员图片上传
router.post('/', authMiddleware, (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      const message = err.code === 'LIMIT_FILE_SIZE'
        ? '图片大小不能超过 10MB'
        : (err.message || '文件上传失败');
      return res.status(400).json({ error: message });
    }

    if (!req.file) {
      return res.status(400).json({ error: '请选择要上传的文件' });
    }

    try {
      const ext = path.extname(req.file.originalname).toLowerCase();
      const filename = `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
      const contentType = MIME_BY_EXT[ext] || req.file.mimetype;

      const url = await uploadObject(`uploads/${filename}`, req.file.buffer, contentType);
      res.json({ url, filename });
    } catch (e) {
      console.error('[upload] 转存云存储失败:', e.message);
      res.status(500).json({ error: '图片上传失败，请稍后重试' });
    }
  });
});

module.exports = router;
