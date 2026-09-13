import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  baseURL: '/api',
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

    // 401 跳转登录
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/admin/login'
    }

    return Promise.reject(error)
  }
)

export default request
