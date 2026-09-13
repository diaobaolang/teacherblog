// 在每次 POST/PUT/DELETE 请求完成后，将内存中的 sql.js 数据库持久化到文件
function saveMiddleware(db) {
  return (req, res, next) => {
    const originalEnd = res.end;
    res.end = function (...args) {
      // 只对写操作保存
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        try {
          db.save();
        } catch (e) {
          console.error('[db-save] 保存失败:', e.message);
        }
      }
      originalEnd.apply(res, args);
    };
    next();
  };
}

module.exports = { saveMiddleware };
