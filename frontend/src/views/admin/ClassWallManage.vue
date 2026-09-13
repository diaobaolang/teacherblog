<template>
  <div class="class-manage">
    <div class="header-row">
      <h2 class="page-title">班级照管理</h2>
      <el-button type="primary" @click="openGroupDialog()">新增分组</el-button>
    </div>

    <!-- 分组列表 -->
    <el-card shadow="never" class="group-card">
      <template #header>
        <div class="card-header">
          <span>分组列表</span>
          <span class="tip">拖拽调整顺序</span>
        </div>
      </template>

      <div v-if="groups.length" class="group-list">
        <draggable
          v-model="groups"
          item-key="id"
          @end="handleGroupSort"
          handle=".drag-handle"
        >
          <template #item="{ element }">
            <div class="group-row" :class="{ active: activeGroupId === element.id }" @click="selectGroup(element.id)">
              <el-icon class="drag-handle"><Rank /></el-icon>
              <span class="group-name">{{ element.name }}</span>
              <span class="group-count">{{ element.photos?.length || 0 }} 张照片</span>
              <div class="group-actions" @click.stop>
                <el-button text type="primary" @click="openGroupDialog(element)">编辑</el-button>
                <el-popconfirm title="删除分组将同时删除组内所有照片，确定？" @confirm="handleDeleteGroup(element.id)">
                  <template #reference>
                    <el-button text type="danger">删除</el-button>
                  </template>
                </el-popconfirm>
              </div>
            </div>
          </template>
        </draggable>
      </div>
      <el-empty v-else description="暂无分组，请先创建一个分组" :image-size="80" />
    </el-card>

    <!-- 当前分组的照片管理 -->
    <el-card v-if="activeGroupId" shadow="never" class="photo-card">
      <template #header>
        <div class="card-header">
          <span>{{ activeGroup?.name }} - 照片管理</span>
          <el-upload
            :show-file-list="false"
            :before-upload="beforeUpload"
            :http-request="handlePhotoUpload"
            accept="image/*"
            multiple
          >
            <el-button type="primary" :loading="photoUploading">上传照片</el-button>
          </el-upload>
        </div>
      </template>

      <div v-if="activePhotos.length" class="photo-list">
        <draggable
          v-model="activePhotos"
          item-key="id"
          @end="handlePhotoSort"
          handle=".photo-drag"
        >
          <template #item="{ element }">
            <div class="photo-row">
              <el-icon class="photo-drag"><Rank /></el-icon>
              <img :src="$img(element.image_url)" class="photo-thumb" />
              <el-input v-model="element.title" placeholder="标题（可选）" class="photo-title-input" @blur="handleEditPhoto(element)" />
              <el-popconfirm title="确定删除此照片？" @confirm="handleDeletePhoto(element.id)">
                <template #reference>
                  <el-button text type="danger" :icon="Delete">删除</el-button>
                </template>
              </el-popconfirm>
            </div>
          </template>
        </draggable>
      </div>
      <el-empty v-else description="暂无照片，请上传" :image-size="80" />
    </el-card>

    <!-- 分组新增/编辑对话框 -->
    <el-dialog v-model="groupDialogVisible" :title="editingGroup ? '编辑分组' : '新增分组'" width="420px">
      <el-form :model="groupForm" label-position="top">
        <el-form-item label="分组名称">
          <el-input v-model="groupForm.name" placeholder="如：2024秋季运动会" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="分组封面（可选）">
          <el-upload
            :show-file-list="false"
            :before-upload="beforeCoverUpload"
            :http-request="handleCoverUpload"
            accept="image/*"
          >
            <div v-if="groupForm.cover_image" class="cover-preview">
              <img :src="$img(groupForm.cover_image)" />
              <div class="cover-mask">点击更换</div>
            </div>
            <el-button v-else type="primary" plain :loading="coverUploading">上传封面</el-button>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="groupDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="groupSaving" @click="handleSaveGroup">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import draggable from 'vuedraggable'
import {
  getAllClassData, createClassGroup, updateClassGroup, deleteClassGroup, sortClassGroups,
  addClassPhoto, updateClassPhoto, deleteClassPhoto, sortClassPhotos, uploadImage
} from '../../api'

const groups = ref([])
const activeGroupId = ref(null)
const photoUploading = ref(false)

const groupDialogVisible = ref(false)
const editingGroup = ref(null)
const groupForm = ref({ name: '', cover_image: '' })
const coverUploading = ref(false)
const groupSaving = ref(false)

const activeGroup = computed(() => groups.value.find(g => g.id === activeGroupId.value))
const activePhotos = computed(() => {
  const group = groups.value.find(g => g.id === activeGroupId.value)
  return group?.photos || []
})

onMounted(async () => {
  await loadGroups()
})

async function loadGroups() {
  try {
    const data = await getAllClassData()
    groups.value = data.map(g => ({ ...g, photos: g.photos || [] }))
    if (groups.value.length && !activeGroupId.value) {
      activeGroupId.value = groups.value[0].id
    }
  } catch (e) {
    // 错误已在拦截器处理
  }
}

function selectGroup(id) {
  activeGroupId.value = id
}

function openGroupDialog(group = null) {
  if (group) {
    editingGroup.value = group
    groupForm.value = { name: group.name, cover_image: group.cover_image || '' }
  } else {
    editingGroup.value = null
    groupForm.value = { name: '', cover_image: '' }
  }
  groupDialogVisible.value = true
}

async function handleSaveGroup() {
  if (!groupForm.value.name.trim()) {
    ElMessage.warning('请输入分组名称')
    return
  }
  groupSaving.value = true
  try {
    if (editingGroup.value) {
      await updateClassGroup(editingGroup.value.id, groupForm.value)
      ElMessage.success('分组已更新')
    } else {
      await createClassGroup(groupForm.value)
      ElMessage.success('分组已创建')
    }
    groupDialogVisible.value = false
    await loadGroups()
  } catch (e) {
    // 错误已在拦截器处理
  } finally {
    groupSaving.value = false
  }
}

async function handleDeleteGroup(id) {
  try {
    await deleteClassGroup(id)
    ElMessage.success('分组已删除')
    if (activeGroupId.value === id) {
      activeGroupId.value = groups.value.length > 1 ? groups.value.find(g => g.id !== id)?.id : null
    }
    await loadGroups()
  } catch (e) {
    // 错误已在拦截器处理
  }
}

async function handleGroupSort() {
  try {
    await sortClassGroups(groups.value.map(g => ({ id: g.id })))
    ElMessage.success('排序已更新')
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

async function handlePhotoUpload({ file }) {
  photoUploading.value = true
  try {
    const res = await uploadImage(file)
    await addClassPhoto(activeGroupId.value, { image_url: res.url, title: '' })
    ElMessage.success('照片上传成功')
    await loadGroups()
  } catch (e) {
    // 错误已在拦截器处理
  } finally {
    photoUploading.value = false
  }
}

async function handleEditPhoto(photo) {
  try {
    await updateClassPhoto(photo.id, { title: photo.title })
  } catch (e) {
    // 错误已在拦截器处理
  }
}

async function handleDeletePhoto(id) {
  try {
    await deleteClassPhoto(id)
    ElMessage.success('照片已删除')
    await loadGroups()
  } catch (e) {
    // 错误已在拦截器处理
  }
}

async function handlePhotoSort() {
  try {
    await sortClassPhotos(activeGroupId.value, activePhotos.value.map(p => ({ id: p.id })))
    ElMessage.success('排序已更新')
  } catch (e) {
    // 错误已在拦截器处理
  }
}

function beforeCoverUpload(file) {
  return beforeUpload(file)
}

async function handleCoverUpload({ file }) {
  coverUploading.value = true
  try {
    const res = await uploadImage(file)
    groupForm.value.cover_image = res.url
    ElMessage.success('封面上传成功')
  } catch (e) {
    // 错误已在拦截器处理
  } finally {
    coverUploading.value = false
  }
}
</script>

<style scoped>
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 20px;
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

.group-card {
  margin-bottom: 16px;
}

.group-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 8px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.2s;
}

.group-row:hover {
  background: #f5f7fa;
}

.group-row.active {
  background: #f0f9eb;
}

.drag-handle {
  cursor: move;
  font-size: 20px;
  color: #c0c4cc;
}

.group-name {
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.group-count {
  font-size: 13px;
  color: #909399;
}

.group-actions {
  margin-left: auto;
}

.photo-card {
  margin-bottom: 16px;
}

.photo-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.photo-drag {
  cursor: move;
  font-size: 20px;
  color: #c0c4cc;
}

.photo-thumb {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 6px;
  flex-shrink: 0;
}

.photo-title-input {
  flex: 1;
}

.cover-preview {
  position: relative;
  width: 200px;
  height: 120px;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
}

.cover-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.cover-preview:hover .cover-mask {
  opacity: 1;
}
</style>