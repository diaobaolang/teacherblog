const express = require('express');
const { pgClient } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 公开：获取个人介绍
router.get('/', async (req, res) => {
  const profile = await pgClient.getOne('profile', { order: 'id.desc' });
  res.json({ content: profile ? profile.content : '' });
});

// 管理：更新个人介绍
router.put('/', authMiddleware, async (req, res) => {
  const { content } = req.body;
  if (content === undefined) {
    return res.status(400).json({ error: '请提供介绍内容' });
  }

  const existing = await pgClient.getOne('profile', { order: 'id.desc' });
  if (existing) {
    await pgClient.update('profile', { content, updated_at: 'now()' }, { id: existing.id });
  } else {
    await pgClient.insert('profile', { content });
  }

  res.json({ message: '个人介绍已更新' });
});

module.exports = router;
