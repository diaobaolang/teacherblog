<template>
  <div class="public-layout">
    <!-- 顶部导航 -->
    <header class="header">
      <div class="container header-inner">
        <router-link to="/" class="logo">
          <el-icon><Notebook /></el-icon>
          <span>石老师教学圈</span>
        </router-link>

        <nav class="nav-pc">
          <router-link to="/" class="nav-link">首页</router-link>
          <router-link to="/honor-wall" class="nav-link">荣誉墙</router-link>
          <router-link to="/class-wall" class="nav-link">班级照</router-link>
          <router-link to="/articles" class="nav-link">学习动态</router-link>
          <router-link to="/messages" class="nav-link">学生与家长留言</router-link>
        </nav>
      </div>
    </header>

    <!-- 页面内容 -->
    <main class="main">
      <div class="container">
        <router-view />
      </div>
    </main>

    <!-- 底部 -->
    <footer class="footer">
      <div class="container">
        <p>教师个人博客 &copy; {{ year }} &nbsp;|&nbsp; 基于Vue3 + Express构建</p>
      </div>
    </footer>

    <!-- 移动端底部导航栏（仅手机端显示，命名与电脑端区分） -->
    <nav class="tabbar">
      <router-link
        v-for="item in mobileTabs"
        :key="item.path"
        :to="item.path"
        class="tabbar-item"
        :class="{ 'is-active': isActive(item) }"
      >
        <el-icon class="tabbar-icon"><component :is="item.icon" /></el-icon>
        <span class="tabbar-text">{{ item.label }}</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { HomeFilled, Document, ChatDotRound } from '@element-plus/icons-vue'

const route = useRoute()
const year = ref(new Date().getFullYear())

// 手机端底部栏：命名与电脑端不同（动态=学习动态，留言=学生与家长留言）
const mobileTabs = [
  { path: '/', label: '首页', icon: HomeFilled, match: ['/'] },
  { path: '/articles', label: '动态', icon: Document, match: ['/articles'] },
  { path: '/messages', label: '留言', icon: ChatDotRound, match: ['/messages'] }
]

function isActive(item) {
  const current = route.path
  return item.match.some(prefix => (prefix === '/' ? current === '/' : current.startsWith(prefix)))
}
</script>

<style scoped>
.public-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 700;
  color: #333;
}

.logo .el-icon {
  font-size: 24px;
  color: #409eff;
}

.nav-pc {
  display: flex;
  gap: 24px;
}

.nav-link {
  font-size: 16px;
  color: #333;
  transition: color 0.2s;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: #409eff;
}

.main {
  flex: 1;
  padding: 24px 0;
}

.footer {
  background: #fff;
  border-top: 1px solid #e4e7ed;
  padding: 16px 0;
  text-align: center;
  font-size: 14px;
  color: #909399;
}

/* 底部导航栏默认隐藏，仅手机端显示 */
.tabbar {
  display: none;
}

@media (max-width: 768px) {
  .nav-pc {
    display: none;
  }

  .main {
    padding: 16px 0;
  }

  /* 预留高度，避免内容被固定底栏遮挡 */
  .footer {
    padding-bottom: 68px;
  }

  .tabbar {
    display: flex;
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 200;
    background: #fff;
    border-top: 1px solid #e4e7ed;
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.06);
    padding-bottom: constant(safe-area-inset-bottom);
    padding-bottom: env(safe-area-inset-bottom);
  }

  .tabbar-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    height: 54px;
    font-size: 12px;
    color: #909399;
    transition: color 0.2s;
    -webkit-tap-highlight-color: transparent;
  }

  .tabbar-item.is-active {
    color: #409eff;
  }

  .tabbar-icon {
    font-size: 20px;
  }

  .tabbar-text {
    line-height: 1;
  }
}
</style>
