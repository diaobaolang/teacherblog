<template>
  <div class="carousel-manage">
    <h2 class="page-title">轮播图管理</h2>

    <el-card shadow="never" class="upload-card">
      <el-upload
        :show-file-list="false"
        :before-upload="beforeUpload"
        :http-request="handleUpload"
        accept="image/*"
      >
        <el-button type="primary" :loading="uploading">上传轮播图</el-button>
      </el-upload>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>轮播图列表</span>
          <span class="tip">提示：拖拽可调整顺序</span>
        </div>
      </template>

      <div v-if="list.length" class="drag-area">
        <draggable
          v-model="list"
          item-key="id"
          @end="handleSort"
          handle=".drag-handle"
        >
          <template #item="{ element }">
            <div class="carousel-item">
              <el-icon class="drag-handle"><Rank /></el-icon>
              <img :src="element.image_url" class="thumb" />
              <el-input v-model="element.title" placeholder="标题（可选）" class="title-input" @blur="handleEdit(element)" />
              <el-popconfirm title="确定删除此轮播图？" @confirm="handleDelete(element.id)">
                <template #reference>
                  <el-button type="danger" text :icon="Delete">删除</el-button>
                </template>
              </el-popconfirm>
            </div>
          </template>
        </draggable>
      </div>
      <el-empty v-else description="暂无轮播图" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import draggable from 'vuedraggable'
import { getCarousel, addCarousel, updateCarousel, deleteCarousel, sortCarousel, uploadImage } from '../../api'

const list = ref([])
const uploading = ref(false)

onMounted(() => loadList())

async function loadList() {
  try {
    const data = await getCarousel()
    list.value = data
  } catch (e) {
    // 错误已在拦截器处理
  }
}

function beforeUpload(file) {
  const valid = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)
  if (!valid) {
    ElMessage.error('仅支持 jpg/png/gif/webp 格式')
    return false
  }
  if (file.size > 10 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过 10MB')
    return false
  }
  return true
}

async function handleUpload({ file }) {
  uploading.value = true
  try {
    const res = await uploadImage(file)
    await addCarousel({ image_url: res.url, title: '' })
    ElMessage.success('上传成功')
    await loadList()
  } catch (e) {
    // 错误已在拦截器处理
  } finally {
    uploading.value = false
  }
}

async function handleEdit(item) {
  try {
    await updateCarousel(item.id, { title: item.title })
    ElMessage.success('已更新')
  } catch (e) {
    // 错误已在拦截器处理
  }
}

async function handleDelete(id) {
  try {
    await deleteCarousel(id)
    ElMessage.success('已删除')
    await loadList()
  } catch (e) {
    // 错误已在拦截器处理
  }
}

async function handleSort() {
  try {
    await sortCarousel(list.value.map(item => ({ id: item.id })))
    ElMessage.success('排序已更新')
  } catch (e) {
    // 错误已在拦截器处理
  }
}
</script>

<style scoped>
.page-title {
  font-size: 20px;
  margin-bottom: 20px;
}

.upload-card {
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tip {
  font-size: 13px;
  color: #909399;
}

.carousel-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.drag-handle {
  cursor: move;
  font-size: 20px;
  color: #c0c4cc;
}

.thumb {
  width: 100px;
  height: 56px;
  object-fit: cover;
  border-radius: 4px;
}

.title-input {
  flex: 1;
}
</style>
