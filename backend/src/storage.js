require('dotenv').config();

// CloudBase PG 模式云存储（pgstore）客户端
// 文档：https://docs.cloudbase.net/http-api/storage-pg/pg-storage-api
//
// 为什么不用本地磁盘：云托管容器没有持久化存储，
// 落盘的图片既不会出现在线上，重新部署后也会全部丢失。

const ENV_ID = process.env.CLOUDBASE_ENV_ID || 'teacherblog-d5gpp8xax79a35603';
const GATEWAY = `https://${ENV_ID}.api.tcloudbasegateway.com`;
const BUCKET = process.env.CLOUDBASE_STORAGE_BUCKET || 'blog';

// 服务端 API Key（service_role），在云开发控制台或 manageAppAuth(action="createApiKey") 创建
const API_KEY = process.env.CLOUDBASE_API_KEY || '';

// 上传时以扩展名推导 MIME，避免某些浏览器给出 application/octet-stream
// 而被存储桶的 allowed_mime_types 白名单拦截
const MIME_BY_EXT = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

function isConfigured() {
  return Boolean(API_KEY);
}

// 公开桶的直链：bucket.public = true 时无需鉴权即可直接用于 <img src>
function publicUrl(key) {
  return `${GATEWAY}/v1/storages/object/${BUCKET}/${key}`;
}

/**
 * 上传对象到云存储
 * @param {string} key 桶内对象名，如 uploads/img_xxx.png
 * @param {Buffer} buffer 文件内容
 * @param {string} contentType MIME 类型
 * @returns {Promise<string>} 可直接访问的公网直链
 */
async function uploadObject(key, buffer, contentType) {
  if (!isConfigured()) {
    throw new Error('未配置 CLOUDBASE_API_KEY，无法上传到云存储');
  }

  const res = await fetch(`${GATEWAY}/v1/storages/object/${BUCKET}/${key}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': contentType || 'application/octet-stream',
    },
    body: buffer,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    const err = new Error(`云存储上传失败(${res.status}): ${detail.slice(0, 300)}`);
    err.status = res.status;
    throw err;
  }

  return publicUrl(key);
}

module.exports = { uploadObject, publicUrl, isConfigured, MIME_BY_EXT, BUCKET, ENV_ID };
