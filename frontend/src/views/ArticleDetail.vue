<template>
  <div class="article-detail">
    <div v-if="loading" class="loading">
      <el-skeleton :rows="10" animated />
    </div>

    <article v-else-if="article">
      <el-button text @click="$router.push('/articles')" class="back-btn">
        <el-icon><ArrowLeft /></el-icon>
        返回列表
      </el-button>

      <h1 class="title">{{ article.title }}</h1>
      <div class="meta">
        <span>{{ formatDate(article.created_at) }}</span>
      </div>

      <img v-if="article.cover_image" :src="article.cover_image" class="cover" />

      <div class="content" v-html="article.content"></div>
    </article>

    <el-empty v-else description="文章不存在或未发布" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getArticle } from '../api'

const route = useRoute()
const article = ref(null)
const loading = ref(true)

onMounted(async () => {
  try {
    const data = await getArticle(route.params.id)
    article.value = data
  } catch (e) {
    // 错误已在拦截器处理
  } finally {
    loading.value = false
  }
})

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.back-btn {
  margin-bottom: 16px;
}

.title {
  font-size: 28px;
  color: #333;
  margin-bottom: 12px;
}

.meta {
  font-size: 14px;
  color: #909399;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e4e7ed;
}

.cover {
  width: 100%;
  max-height: 400px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 24px;
}

.content {
  font-size: 16px;
  line-height: 1.8;
  color: #333;
}

.content :deep(img) {
  max-width: 100%;
  border-radius: 6px;
}

.content :deep(h1),
.content :deep(h2),
.content :deep(h3) {
  margin: 20px 0 12px;
}

.content :deep(p) {
  margin-bottom: 12px;
}

.content :deep(blockquote) {
  border-left: 4px solid #409eff;
  padding-left: 16px;
  margin: 16px 0;
  color: #606266;
}

.content :deep(pre) {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
}

.content :deep(code) {
  font-family: Consolas, Monaco, monospace;
}
</style>
