const express = require('express');
const { pgClient } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 公开：获取轮播图列表
router.get('/', async (req, res) => {
  const { data } = await pgClient.select('carousel_images', {
    columns: '*',
    order: 'sort_order.asc,id.asc',
  });
  res.json(data);
});

// 管理：新增轮播图
router.post('/', authMiddleware, async (req, res) => {
  const { image_url, title } = req.body;
  if (!image_url) {
    return res.status(400).json({ error: '请提供图片地址' });
  }

  const maxSort = await pgClient.max('carousel_images', 'sort_order');
  const sortOrder = (maxSort || 0) + 1;

  const row = await pgClient.insert('carousel_images', {
    image_url, title: title || '', sort_order: sortOrder,
  }, { returnData: true });

  res.status(201).json({ id: row?.id, message: '轮播图已添加' });
});

// 管理：编辑轮播图
router.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { image_url, title } = req.body;

  const existing = await pgClient.getOne('carousel_images', { filters: { id } });
  if (!existing) {
    return res.status(404).json({ error: '轮播图不存在' });
  }

  await pgClient.update('carousel_images', {
    image_url: image_url || existing.image_url,
    title: title !== undefined ? title : existing.title,
  }, { id });

  res.json({ message: '轮播图已更新' });
});

// 管理：删除轮播图
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const existing = await pgClient.getOne('carousel_images', { filters: { id } });
  if (!existing) {
    return res.status(404).json({ error: '轮播图不存在' });
  }

  await pgClient.delete('carousel_images', { id });
  res.json({ message: '轮播图已删除' });
});

// 管理：批量调整排序
router.put('/sort', authMiddleware, async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: '请提供排序数组' });
  }

  for (let i = 0; i < items.length; i++) {
    await pgClient.update('carousel_images', { sort_order: i + 1 }, { id: items[i].id });
  }

  res.json({ message: '排序已更新' });
});

module.exports = router;
