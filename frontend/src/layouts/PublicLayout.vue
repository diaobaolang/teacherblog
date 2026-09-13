<template>
  <div class="public-layout">
    <!-- 顶部导航 -->
    <header class="header">
      <div class="container header-inner">
        <router-link to="/" class="logo">
          <el-icon><Notebook /></el-icon>
          <span>教师博客</span>
        </router-link>

        <nav class="nav-pc">
          <router-link to="/" class="nav-link">首页</router-link>
          <router-link to="/honor-wall" class="nav-link">荣誉墙</router-link>
          <router-link to="/class-wall" class="nav-link">班级照</router-link>
          <router-link to="/articles" class="nav-link">学习动态</router-link>
          <router-link to="/messages" class="nav-link">学生与家长留言</router-link>
        </nav>

        <!-- 移动端汉堡菜单 -->
        <el-dropdown trigger="click" @command="handleNav" class="nav-mobile">
          <el-icon class="menu-icon"><Menu /></el-icon>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="/">首页</el-dropdown-item>
              <el-dropdown-item command="/honor-wall">荣誉墙</el-dropdown-item>
              <el-dropdown-item command="/class-wall">班级照</el-dropdown-item>
              <el-dropdown-item command="/articles">学习动态</el-dropdown-item>
              <el-dropdown-item command="/messages">学生与家长留言</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
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
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const year = ref(new Date().getFullYear())

function handleNav(path) {
  router.push(path)
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

.nav-mobile {
  display: none;
}

.menu-icon {
  font-size: 24px;
  cursor: pointer;
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

@media (max-width: 768px) {
  .nav-pc {
    display: none;
  }
  .nav-mobile {
    display: block;
  }
}
</style>
