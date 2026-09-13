import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// GitHub Pages 部署在 https://<用户名>.github.io/<仓库名>/ 子路径下，
// 由 Actions 构建时注入 VITE_BASE=/teacherblog/；
// 本地开发与 CloudBase 静态托管都在根路径，保持默认 '/'。
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})
