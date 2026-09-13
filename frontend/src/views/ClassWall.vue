<template>
  <div class="class-wall">
    <h1 class="page-title">班级照</h1>
    <p class="page-sub">记录班级的每一个美好瞬间</p>

    <div v-if="loading" class="loading">
      <el-skeleton :rows="6" animated />
    </div>

    <el-empty v-else-if="groups.length === 0" description="暂无班级照" />

    <!-- 所有分组直接铺开 -->
    <div v-else class="groups-container">
      <div v-for="group in groups" :key="group.id" class="group-block">
        <h2 class="group-title">{{ group.name }}</h2>
        <div class="photo-grid" v-if="group.photos && group.photos.length">
          <div
            v-for="(photo, idx) in group.photos"
            :key="photo.id"
            class="photo-item"
            @click="openViewer(group, idx)"
          >
            <img :src="photo.image_url" :alt="photo.title" loading="lazy" />
            <div v-if="photo.title" class="photo-label">{{ photo.title }}</div>
          </div>
        </div>
        <el-empty v-else :description="`${group.name} 组暂无照片`" :image-size="60" />
      </div>
    </div>

    <!-- 手机相册风格的全屏查看器 -->
    <transition name="viewer-fade">
      <div v-if="viewerVisible" class="photo-viewer" @click.self="closeViewer">
        <div class="viewer-header">
          <span class="viewer-counter">{{ currentIndex + 1 }} / {{ currentPhotos.length }}</span>
          <el-icon class="viewer-close" @click="closeViewer"><Close /></el-icon>
        </div>

        <div class="viewer-body" @click.self="closeViewer">
          <transition :name="slideDirection" mode="out-in">
            <div :key="currentIndex" class="viewer-image-wrap">
              <img
                :src="currentPhotos[currentIndex]?.image_url"
                :alt="currentPhotos[currentIndex]?.title"
                class="viewer-image"
              />
              <div v-if="currentPhotos[currentIndex]?.title" class="viewer-title">
                {{ currentPhotos[currentIndex].title }}
              </div>
            </div>
          </transition>

          <div v-if="currentPhotos.length > 1" class="viewer-arrow left" @click.stop="prev">
            <el-icon><ArrowLeft /></el-icon>
          </div>
          <div v-if="currentPhotos.length > 1" class="viewer-arrow right" @click.stop="next">
            <el-icon><ArrowRight /></el-icon>
          </div>
        </div>

        <div v-if="currentPhotos.length > 1" class="viewer-thumbs">
          <div
            v-for="(photo, index) in currentPhotos"
            :key="photo.id"
            class="thumb-item"
            :class="{ active: index === currentIndex }"
            @click="currentIndex = index"
          >
            <img :src="photo.image_url" />
          </div>
        </div>

        <div class="swipe-hint" v-if="currentPhotos.length > 1 && firstOpen">
          左右滑动查看更多
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { getAllClassData } from '../api'

const groups = ref([])
const loading = ref(true)

const viewerVisible = ref(false)
const currentPhotos = ref([])
const currentIndex = ref(0)
const slideDirection = ref('slide-left')
const firstOpen = ref(true)

const touchStartX = ref(0)
const touchEndX = ref(0)

onMounted(async () => {
  try {
    const data = await getAllClassData()
    groups.value = data
  } catch (e) {
    // 错误已在拦截器处理
  } finally {
    loading.value = false
  }

  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('touchstart', handleTouchStart, { passive: true })
  window.addEventListener('touchend', handleTouchEnd, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('touchstart', handleTouchStart)
  window.removeEventListener('touchend', handleTouchEnd)
})

function openViewer(group, index) {
  currentPhotos.value = group.photos || []
  currentIndex.value = index
  viewerVisible.value = true
  firstOpen.value = true
  document.body.style.overflow = 'hidden'
  setTimeout(() => { firstOpen.value = false }, 2000)
}

function closeViewer() {
  viewerVisible.value = false
  document.body.style.overflow = ''
}

function next() {
  if (!currentPhotos.value.length) return
  slideDirection.value = 'slide-left'
  currentIndex.value = (currentIndex.value + 1) % currentPhotos.value.length
}

function prev() {
  if (!currentPhotos.value.length) return
  slideDirection.value = 'slide-right'
  currentIndex.value = (currentIndex.value - 1 + currentPhotos.value.length) % currentPhotos.value.length
}

function handleKeydown(e) {
  if (!viewerVisible.value) return
  if (e.key === 'ArrowRight') next()
  else if (e.key === 'ArrowLeft') prev()
  else if (e.key === 'Escape') closeViewer()
}

function handleTouchStart(e) {
  if (!viewerVisible.value) return
  touchStartX.value = e.changedTouches[0].screenX
}

function handleTouchEnd(e) {
  if (!viewerVisible.value) return
  touchEndX.value = e.changedTouches[0].screenX
  const diff = touchStartX.value - touchEndX.value
  if (Math.abs(diff) > 50) {
    if (diff > 0) next()
    else prev()
  }
}
</script>

<style scoped>
.page-title {
  font-size: 28px;
  text-align: center;
  color: #333;
  margin-bottom: 4px;
}

.page-sub {
  text-align: center;
  color: #909399;
  font-size: 14px;
  margin-bottom: 32px;
}

.groups-container {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.group-block {
  background: transparent;
}

.group-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px;
  padding-left: 8px;
  border-left: 4px solid #67c23a;
  line-height: 1.4;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}

.photo-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  background: #f5f7fa;
}

.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.photo-item:hover img {
  transform: scale(1.05);
}

.photo-label {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 8px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.6));
  color: #fff;
  font-size: 13px;
  text-align: center;
}

/* 全屏查看器 */
.photo-viewer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  z-index: 9999;
  display: flex;
  flex-direction: column;
}

.viewer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  color: #fff;
}

.viewer-counter {
  font-size: 15px;
}

.viewer-close {
  font-size: 28px;
  cursor: pointer;
  color: #fff;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.viewer-close:hover {
  opacity: 1;
}

.viewer-body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 0 60px;
}

.viewer-image-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 100%;
  max-height: 100%;
}

.viewer-image {
  max-width: 100%;
  max-height: 75vh;
  object-fit: contain;
  border-radius: 4px;
}

.viewer-title {
  color: #fff;
  font-size: 15px;
  margin-top: 16px;
  text-align: center;
}

.viewer-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fff;
  font-size: 24px;
  transition: background 0.2s;
}

.viewer-arrow:hover {
  background: rgba(255, 255, 255, 0.2);
}

.viewer-arrow.left { left: 16px; }
.viewer-arrow.right { right: 16px; }

.viewer-thumbs {
  display: flex;
  gap: 8px;
  padding: 12px 24px;
  overflow-x: auto;
  justify-content: center;
}

.thumb-item {
  width: 56px;
  height: 56px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
  cursor: pointer;
  opacity: 0.5;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.thumb-item.active {
  opacity: 1;
  border-color: #67c23a;
}

.thumb-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.swipe-hint {
  position: absolute;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
  animation: fadeOut 2s ease forwards;
}

@keyframes fadeOut {
  0%, 50% { opacity: 1; }
  100% { opacity: 0; }
}

.viewer-fade-enter-active,
.viewer-fade-leave-active {
  transition: opacity 0.3s;
}

.viewer-fade-enter-from,
.viewer-fade-leave-to {
  opacity: 0;
}

.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-left-enter-from { transform: translateX(100%); opacity: 0; }
.slide-left-leave-to { transform: translateX(-100%); opacity: 0; }
.slide-right-enter-from { transform: translateX(-100%); opacity: 0; }
.slide-right-leave-to { transform: translateX(100%); opacity: 0; }

@media (max-width: 768px) {
  .photo-grid {
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    gap: 8px;
  }
  .viewer-body { padding: 0 8px; }
  .viewer-arrow { display: none; }
  .page-title { font-size: 22px; }
  .group-title { font-size: 16px; }
}
</style>