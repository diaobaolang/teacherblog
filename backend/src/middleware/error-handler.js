function notFound(req, res) {
  res.status(404).json({ error: '接口不存在' });
}

function errorHandler(err, req, res, next) {
  console.error('[error]', err.message);
  res.status(err.status || 500).json({
    error: err.message || '服务器内部错误'
  });
}

module.exports = { errorHandler, notFound };
