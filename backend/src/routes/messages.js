const express = require('express');
const { pgClient } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 公开：提交留言
router.post('/', async (req, res) => {
  const { nickname, content } = req.body;
  if (!nickname || !nickname.trim()) {
    return res.status(400).json({ error: '请输入昵称' });
  }
  if (!content || !content.trim()) {
    return res.status(400).json({ error: '请输入留言内容' });
  }

  // 简单防刷：同名昵称 1 分钟内只能提交一次
  // PostgREST 不支持 datetime 计算，先查所有同名留言再过滤
  const { data: recentMsgs } = await pgClient.select('messages', {
    columns: 'id,created_at',
    filters: { nickname: nickname.trim() },
    order: 'created_at.desc',
    limit: 1,
  });
  
  if (recentMsgs.length > 0) {
    const recentTime = new Date(recentMsgs[0].created_at);
    const oneMinAgo = new Date(Date.now() - 60 * 1000);
    if (recentTime > oneMinAgo) {
      return res.status(429).json({ error: '提交过于频繁，请稍后再试' });
    }
  }

  const maxSort = await pgClient.max('messages', 'sort_order', { status: 'approved' });
  const sortOrder = (maxSort || 0) + 1;

  const row = await pgClient.insert('messages', {
    nickname: nickname.trim(),
    content: content.trim(),
    sort_order: sortOrder,
  }, { returnData: true });

  res.status(201).json({ id: row?.id, message: '留言已提交，等待审核' });
});

// 公开：获取已审核通过的留言
router.get('/', async (req, res) => {
  const { data } = await pgClient.select('messages', {
    columns: 'id,nickname,content,created_at',
    filters: { status: 'approved' },
    order: 'sort_order.asc,created_at.desc',
  });
  res.json(data);
});

// ===== 以下为管理接口 =====

// 管理：留言列表（含未审核）
router.get('/admin/list', authMiddleware, async (req, res) => {
  const { data } = await pgClient.select('messages', {
    columns: 'id,nickname,content,status,sort_order,created_at,reviewed_at',
    order: 'created_at.desc',
  });
  res.json(data);
});

// 管理：审核留言
router.put('/admin/:id/review', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: '无效的审核状态' });
  }

  const existing = await pgClient.getOne('messages', { filters: { id } });
  if (!existing) {
    return res.status(404).json({ error: '留言不存在' });
  }

  await pgClient.update('messages', { status, reviewed_at: 'now()' }, { id });

  res.json({ message: `留言已${status === 'approved' ? '通过' : '拒绝'}` });
});

// 管理：删除留言
router.delete('/admin/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const existing = await pgClient.getOne('messages', { filters: { id } });
  if (!existing) {
    return res.status(404).json({ error: '留言不存在' });
  }

  await pgClient.delete('messages', { id });
  res.json({ message: '留言已删除' });
});

// 管理：批量调整排序
router.put('/admin/sort', authMiddleware, async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: '请提供排序数组' });
  }

  for (let i = 0; i < items.length; i++) {
    await pgClient.update('messages', { sort_order: i + 1 }, { id: items[i].id });
  }

  res.json({ message: '排序已更新' });
});

module.exports = router;
