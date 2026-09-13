<template>
  <div class="article-list-page">
    <h1 class="page-title">学习动态</h1>

    <div v-if="loading" class="loading">
      <el-skeleton :rows="5" animated />
    </div>

    <div v-else-if="articles.length" class="articles-grid">
      <el-card
        v-for="article in articles"
        :key="article.id"
        class="article-card"
        shadow="hover"
        @click="goDetail(article.id)"
      >
        <img v-if="article.cover_image" :src="$img(article.cover_image)" class="cover" />
        <div class="no-cover" v-else>
          <el-icon><Picture /></el-icon>
        </div>
        <div class="card-body">
          <h3 class="title">{{ article.title }}</h3>
          <p class="summary">{{ article.summary || '暂无摘要' }}</p>
          <span class="date">{{ formatDate(article.created_at) }}</span>
        </div>
      </el-card>
    </div>

    <el-empty v-else description="暂无动态" />

    <div v-if="totalPages > 1" class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next"
        @current-change="loadArticles"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getArticles } from '../api'

const router = useRouter()

const articles = ref([])
const loading = ref(true)
const currentPage = ref(1)
const pageSize = ref(12)
const total = ref(0)
const totalPages = ref(0)

onMounted(() => loadArticles())

async function loadArticles() {
  loading.value = true
  try {
    const data = await getArticles({ page: currentPage.value, pageSize: pageSize.value })
    articles.value = data.list
    total.value = data.total
    totalPages.value = data.totalPages
  } catch (e) {
    // 错误已在拦截器处理
  } finally {
    loading.value = false
  }
}

function goDetail(id) {
  router.push(`/articles/${id}`)
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.page-title {
  font-size: 24px;
  margin-bottom: 24px;
  color: #333;
}

.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.article-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.article-card:hover {
  transform: translateY(-4px);
}

.cover {
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-radius: 4px;
}

.no-cover {
  width: 100%;
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 4px;
}

.no-cover .el-icon {
  font-size: 48px;
  color: #dcdfe6;
}

:deep(.el-card__body) {
  padding: 12px;
}

.card-body {
  padding: 8px 4px 4px;
}

.title {
  font-size: 16px;
  color: #333;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.summary {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.date {
  font-size: 13px;
  color: #c0c4cc;
}

.pagination {
  margin-top: 32px;
  display: flex;
  justify-content: center;
}

@media (max-width: 768px) {
  .articles-grid {
    grid-template-columns: 1fr;
  }
}
</style>
