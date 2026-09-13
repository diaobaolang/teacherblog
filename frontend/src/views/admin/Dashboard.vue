<template>
  <div class="dashboard">
    <h2 class="page-title">仪表盘</h2>
    <div class="stats-grid">
      <el-card class="stat-card" shadow="hover" v-for="stat in stats" :key="stat.label">
        <div class="stat-content">
          <el-icon class="stat-icon" :style="{ background: stat.color }">
            <component :is="stat.icon" />
          </el-icon>
          <div class="stat-info">
            <div class="stat-value">{{ stat.value }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
        </div>
      </el-card>
    </div>

    <el-card class="quick-card" shadow="hover">
      <template #header>
        <span>快捷操作</span>
      </template>
      <div class="quick-actions">
        <el-button type="primary" @click="$router.push('/admin/profile')">编辑个人介绍</el-button>
        <el-button type="success" @click="$router.push('/admin/honor-wall')">管理荣誉墙</el-button>
        <el-button type="warning" @click="$router.push('/admin/articles/edit')">写新动态</el-button>
        <el-button type="info" @click="$router.push('/admin/messages')">审核留言</el-button>
        <el-button type="danger" @click="$router.push('/admin/password')">修改密码</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getAdminArticles, getAdminMessages, getAllHonorData } from '../../api'

const stats = ref([
  { label: '动态总数', value: 0, icon: 'Document', color: '#409eff' },
  { label: '已发布', value: 0, icon: 'CircleCheck', color: '#67c23a' },
  { label: '待审核留言', value: 0, icon: 'ChatDotRound', color: '#e6a23c' },
  { label: '荣誉照片', value: 0, icon: 'Picture', color: '#f56c6c' }
])

onMounted(async () => {
  try {
    const [articles, messages, honorData] = await Promise.all([
      getAdminArticles(),
      getAdminMessages(),
      getAllHonorData()
    ])
    stats.value[0].value = articles.length
    stats.value[1].value = articles.filter(a => a.status === 'published').length
    stats.value[2].value = messages.filter(m => m.status === 'pending').length
    const photoCount = honorData.reduce((sum, g) => sum + (g.photos?.length || 0), 0)
    stats.value[3].value = photoCount
  } catch (e) {
    // 错误已在拦截器处理
  }
})
</script>

<style scoped>
.page-title {
  font-size: 20px;
  margin-bottom: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  color: #fff;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #333;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
