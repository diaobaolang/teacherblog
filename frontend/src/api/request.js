import axios from 'axios'
import { ElMessage } from 'element-plus'

// 后端地址 - 本地开发留空走 Vite proxy；
// 生产构建时由 .env.production 中的 VITE_API_BASE 注入 Cloud Run 地址
export const API_BASE = import.meta.env.VITE_API_BASE || ''

// 将 /uploads/ 开头的相对路径转为后端绝对地址
export function resolveUrl(url) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  if (url.startsWith('/uploads/')) return API_BASE + url
  return url
}

const request = axios.create({
  baseURL: API_BASE + '/api',
  timeout: 15000
})

// 请求拦截器：附带 JWT
request.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, error => Promise.reject(error))

// 响应拦截器：统一错误处理
request.interceptors.response.use(
  response => response.data,
  error => {
    const msg = error.response?.data?.error || '请求失败'
    ElMessage.error(msg)

    // 401 跳转登录（hash 路由需要带 #）
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.hash = '#/admin/login'
    }

    return Promise.reject(error)
  }
)

export default request
