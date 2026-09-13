<template>
  <div class="home">
    <!-- 荣誉墙轮播 -->
    <div class="honor-section">
      <h2 class="section-title" @click="goHonorWall">
        荣誉墙
        <span class="section-more">查看全部 ></span>
      </h2>
      <el-carousel
        v-if="honorPhotos.length"
        height="360px"
        :interval="4000"
        arrow="hover"
        class="honor-carousel"
        @click="goHonorWall"
      >
        <el-carousel-item v-for="(photo, index) in carouselPhotos" :key="index">
          <img :src="photo.image_url" :alt="photo.title" class="carousel-img" />
          <div v-if="photo.title" class="carousel-title">{{ photo.title }}</div>
        </el-carousel-item>
      </el-carousel>

      <!-- 无荣誉照片时的占位 -->
      <div v-else class="carousel-placeholder" @click="goHonorWall">
        <div class="placeholder-item">
          <el-icon class="placeholder-icon"><PictureFilled /></el-icon>
          <p class="placeholder-text">荣誉墙</p>
          <p class="placeholder-sub">请在后台上传荣誉照片</p>
          <el-button type="primary" text class="placeholder-btn">
            前往上传
          </el-button>
        </div>
      </div>
    </div>

    <!-- 个人介绍 -->
    <el-card class="profile-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><User /></el-icon>
          <span>个人介绍</span>
        </div>
      </template>
      <div class="profile-content" v-html="profile.content || '暂无介绍'"></div>
    </el-card>

    <!-- 最新文章 -->
    <el-card class="latest-articles" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><Document /></el-icon>
          <span>最新文章</span>
          <router-link to="/articles" class="more">查看全部</router-link>
        </div>
      </template>
      <div v-if="latestArticles.length" class="article-list">
        <div v-for="article in latestArticles" :key="article.id" class="article-item" @click="goArticle(article.id)">
          <img v-if="article.cover_image" :src="article.cover_image" class="article-cover" />
          <div class="article-info">
            <h3 class="article-title">{{ article.title }}</h3>
            <p class="article-summary">{{ article.summary || '暂无摘要' }}</p>
            <span class="article-date">{{ formatDate(article.created_at) }}</span>
          </div>
        </div>
      </div>
      <el-empty v-else description="暂无文章" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getProfile, getAllHonorData, getArticles } from '../api'

const router = useRouter()

const profile = ref({ content: '' })
const honorGroups = ref([])
const latestArticles = ref([])

// 所有荣誉照片（从所有分组中收集）
const honorPhotos = computed(() => {
  const photos = []
  honorGroups.value.forEach(g => {
    if (g.photos) {
      photos.push(...g.photos)
    }
  })
  return photos
})

// 首页轮播最多展示 10 张
const carouselPhotos = computed(() => honorPhotos.value.slice(0, 10))

onMounted(async () => {
  try {
    const [profileData, honorData, articlesData] = await Promise.all([
      getProfile(),
      getAllHonorData(),
      getArticles({ page: 1, pageSize: 5 })
    ])
    profile.value = profileData
    honorGroups.value = honorData
    latestArticles.value = articlesData.list
  } catch (e) {
    // 错误已在拦截器处理
  }
})

function goHonorWall() {
  router.push('/honor-wall')
}

function goArticle(id) {
  router.push(`/articles/${id}`)
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.honor-section {
  margin-bottom: 24px;
  border-radius: 8px;
  overflow: hidden;
}

.section-title {
  font-size: 22px;
  color: #333;
  margin-bottom: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: color 0.2s;
}

.section-title:hover {
  color: #409eff;
}

.section-more {
  font-size: 14px;
  font-weight: 400;
  color: #909399;
}

.honor-carousel {
  cursor: pointer;
}

.carousel-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.carousel-title {
  position: absolute;
  bottom: 40px;
  left: 0;
  right: 0;
  text-align: center;
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.profile-card,
.latest-articles {
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
}

.more {
  margin-left: auto;
  font-size: 14px;
  font-weight: 400;
}

.profile-content {
  line-height: 1.8;
  font-size: 15px;
  color: #444;
}

.article-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.article-item {
  display: flex;
  gap: 16px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.article-item:hover {
  background: #f5f7fa;
}

.article-cover {
  width: 120px;
  height: 80px;
  object-fit: cover;
  border-radius: 6px;
  flex-shrink: 0;
}

.article-info {
  flex: 1;
}

.article-title {
  font-size: 16px;
  color: #333;
  margin-bottom: 6px;
}

.article-summary {
  font-size: 14px;
  color: #909399;
  margin-bottom: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-date {
  font-size: 13px;
  color: #c0c4cc;
}

.carousel-placeholder {
  height: 360px;
  border-radius: 8px;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-item {
  text-align: center;
  color: #fff;
}

.placeholder-icon {
  font-size: 56px;
  opacity: 0.8;
}

.placeholder-text {
  font-size: 20px;
  font-weight: 600;
  margin-top: 12px;
}

.placeholder-sub {
  font-size: 14px;
  opacity: 0.7;
  margin-top: 4px;
}

.placeholder-btn {
  color: #fff;
  margin-top: 16px;
  border: 1px solid rgba(255, 255, 255, 0.5);
}

@media (max-width: 768px) {
  .honor-section :deep(.el-carousel) {
    height: 200px !important;
  }
  .carousel-placeholder {
    height: 200px;
  }
  .article-cover {
    width: 90px;
    height: 60px;
  }
  .section-title {
    font-size: 18px;
  }
}
</style>
