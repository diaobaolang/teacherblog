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
          <img :src="$img(photo.image_url)" :alt="photo.title" class="carousel-img" />
          <div v-if="photo.title" class="carousel-title">{{ photo.title }}</div>
        </el-carousel-item>
      </el-carousel>

      <!-- 无荣誉照片时的占位 -->
      <div v-else class="carousel-placeholder honor-placeholder" @click="goHonorWall">
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
      <div class="profile-content" v-html="profileContent"></div>
    </el-card>

    <!-- 班级照轮播 -->
    <div class="honor-section">
      <h2 class="section-title" @click="goClassWall">
        班级照
        <span class="section-more">查看全部 ></span>
      </h2>
      <el-carousel
        v-if="classPhotos.length"
        height="360px"
        :interval="4000"
        arrow="hover"
        class="honor-carousel"
        @click="goClassWall"
      >
        <el-carousel-item v-for="(photo, index) in carouselClassPhotos" :key="index">
          <img :src="$img(photo.image_url)" :alt="photo.title" class="carousel-img" />
          <div v-if="photo.title" class="carousel-title">{{ photo.title }}</div>
        </el-carousel-item>
      </el-carousel>

      <!-- 无班级照时的占位 -->
      <div v-else class="carousel-placeholder class-placeholder" @click="goClassWall">
        <div class="placeholder-item">
          <el-icon class="placeholder-icon"><Camera /></el-icon>
          <p class="placeholder-text">班级照</p>
          <p class="placeholder-sub">请在后台上传班级照片</p>
          <el-button type="primary" text class="placeholder-btn">
            前往上传
          </el-button>
        </div>
      </div>
    </div>

    <!-- 最新动态 -->
    <el-card class="latest-articles" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><Document /></el-icon>
          <span>最新动态</span>
          <router-link to="/articles" class="more">查看全部</router-link>
        </div>
      </template>
      <div v-if="latestArticles.length" class="article-list">
        <div v-for="article in latestArticles" :key="article.id" class="article-item" @click="goArticle(article.id)">
          <img v-if="article.cover_image" :src="$img(article.cover_image)" class="article-cover" />
          <div class="article-info">
            <h3 class="article-title">{{ article.title }}</h3>
            <p class="article-summary">{{ article.summary || '暂无摘要' }}</p>
            <span class="article-date">{{ formatDate(article.created_at) }}</span>
          </div>
        </div>
      </div>
      <el-empty v-else description="暂无动态" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getProfile, getAllHonorData, getAllClassData, getArticles } from '../api'
import { API_BASE } from '../api/request'

const router = useRouter()

const profile = ref({ content: '' })
const honorGroups = ref([])
const classGroups = ref([])
const latestArticles = ref([])

// 个人介绍富文本中的 /uploads/ 路径替换为后端绝对地址
const profileContent = computed(() => {
  if (!profile.value.content) return '暂无介绍'
  return profile.value.content.replace(
    /src="\/uploads\//g,
    `src="${API_BASE}/uploads/`
  ).replace(
    /src='\/uploads\//g,
    `src='${API_BASE}/uploads/`
  )
})

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

// 从照片数组中随机抽取 n 张
function pickRandom(arr, n) {
  const pool = [...arr]
  const result = []
  const count = Math.min(n, pool.length)
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * pool.length)
    result.push(pool.splice(idx, 1)[0])
  }
  return result
}

// 首页轮播随机展示 5 张
const carouselPhotos = computed(() => pickRandom(honorPhotos.value, 5))

// 所有班级照
const classPhotos = computed(() => {
  const photos = []
  classGroups.value.forEach(g => {
    if (g.photos) {
      photos.push(...g.photos)
    }
  })
  return photos
})

const carouselClassPhotos = computed(() => pickRandom(classPhotos.value, 5))

onMounted(async () => {
  try {
    const [profileData, honorData, classData, articlesData] = await Promise.all([
      getProfile(),
      getAllHonorData(),
      getAllClassData(),
      getArticles({ page: 1, pageSize: 5 })
    ])
    profile.value = profileData
    honorGroups.value = honorData
    classGroups.value = classData
    latestArticles.value = articlesData.list
  } catch (e) {
    // 错误已在拦截器处理
  }
})

function goHonorWall() {
  router.push('/honor-wall')
}

function goClassWall() {
  router.push('/class-wall')
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
  display: flex;
  align-items: center;
  justify-content: center;
}

.honor-placeholder {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.class-placeholder {
  background: linear-gradient(135deg, #43e97b 0%, #38a169 100%);
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
