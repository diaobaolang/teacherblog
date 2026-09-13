<template>
  <div class="admin-layout">
    <el-container>
      <el-aside :width="isCollapse ? '64px' : '200px'" class="sidebar">
        <div class="sidebar-logo">
          <el-icon><Setting /></el-icon>
          <span v-if="!isCollapse">后台管理</span>
        </div>
        <el-menu
          :default-active="activeMenu"
          :collapse="isCollapse"
          router
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409eff"
        >
          <el-menu-item index="/admin">
            <el-icon><DataAnalysis /></el-icon>
            <span>仪表盘</span>
          </el-menu-item>
          <el-menu-item index="/admin/profile">
            <el-icon><User /></el-icon>
            <span>个人介绍</span>
          </el-menu-item>
          <el-menu-item index="/admin/honor-wall">
            <el-icon><Picture /></el-icon>
            <span>荣誉墙</span>
          </el-menu-item>
          <el-menu-item index="/admin/articles">
            <el-icon><Document /></el-icon>
            <span>文章管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/messages">
            <el-icon><ChatDotRound /></el-icon>
            <span>留言审核</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <el-container>
        <el-header class="header">
          <div class="header-left">
            <el-icon class="collapse-btn" @click="isCollapse = !isCollapse">
              <Fold v-if="!isCollapse" />
              <Expand v-else />
            </el-icon>
          </div>
          <div class="header-right">
            <span class="username">{{ auth.username || '管理员' }}</span>
            <el-button text type="primary" @click="handleLogout">退出</el-button>
            <el-button text @click="goHome">前台</el-button>
          </div>
        </el-header>

        <el-main class="content">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const isCollapse = ref(false)

const activeMenu = computed(() => route.path)

function handleLogout() {
  auth.logout()
  router.push('/admin/login')
}

function goHome() {
  router.push('/')
}
</script>

<style scoped>
.admin-layout {
  height: 100vh;
}

.sidebar {
  background-color: #304156;
  transition: width 0.3s;
  overflow: hidden;
}

.sidebar-logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  background: #2b3a4d;
}

.sidebar-logo .el-icon {
  font-size: 20px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
}

.collapse-btn {
  font-size: 20px;
  cursor: pointer;
  color: #333;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.username {
  font-size: 14px;
  color: #333;
}

.content {
  background: #f5f7fa;
  padding: 20px;
}

.el-menu {
  border-right: none;
}
</style>
