<template>
  <div class="article-manage">
    <div class="header-row">
      <h2 class="page-title">学习动态管理</h2>
      <el-button type="primary" @click="$router.push('/admin/articles/edit')">写新动态</el-button>
    </div>

    <el-card shadow="never" v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>动态列表</span>
          <span v-if="list.length > 1" class="tip">拖拽左侧手柄调整顺序，松开自动保存</span>
        </div>
      </template>

      <div v-if="list.length" class="article-table">
        <div class="article-row article-head">
          <span class="handle-col"></span>
          <span class="col-title">标题</span>
          <span class="col-status">状态</span>
          <span class="col-date">创建时间</span>
          <span class="col-actions">操作</span>
        </div>

        <draggable v-model="list" item-key="id" handle=".drag-handle" @end="handleSort">
          <template #item="{ element }">
            <div class="article-row">
              <el-icon class="drag-handle handle-col"><Rank /></el-icon>
              <span class="col-title" :title="element.title">{{ element.title }}</span>
              <span class="col-status">
                <el-tag :type="element.status === 'published' ? 'success' : 'info'" size="small">
                  {{ element.status === 'published' ? '已发布' : '草稿' }}
                </el-tag>
              </span>
              <span class="col-date">{{ formatDate(element.created_at) }}</span>
              <span class="col-actions">
                <el-button text type="primary" size="small" @click="$router.push(`/admin/articles/edit/${element.id}`)">编辑</el-button>
                <el-popconfirm title="确定删除此动态？" @confirm="handleDelete(element.id)">
                  <template #reference>
                    <el-button text type="danger" size="small">删除</el-button>
                  </template>
                </el-popconfirm>
              </span>
            </div>
          </template>
        </draggable>
      </div>
      <el-empty v-else description="暂无动态" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import draggable from 'vuedraggable'
import { getAdminArticles, deleteArticle, sortArticles } from '../../api'

const list = ref([])
const loading = ref(false)

onMounted(() => loadList())

async function loadList() {
  loading.value = true
  try {
    const data = await getAdminArticles()
    list.value = data
  } catch (e) {
    // 错误已在拦截器处理
  } finally {
    loading.value = false
  }
}

async function handleDelete(id) {
  try {
    await deleteArticle(id)
    ElMessage.success('已删除')
    await loadList()
  } catch (e) {
    // 错误已在拦截器处理
  }
}

// 拖拽结束后自动保存顺序
async function handleSort() {
  try {
    await sortArticles(list.value.map(item => ({ id: item.id })))
    ElMessage.success('排序已更新')
  } catch (e) {
    // 保存失败时重新拉取，恢复为服务端顺序
    await loadList()
  }
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('zh-CN')
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

.article-table {
  width: 100%;
}

.article-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 4px;
  border-bottom: 1px solid #f0f0f0;
}

.article-head {
  font-size: 13px;
  font-weight: 600;
  color: #909399;
  background: #fafafa;
  border-radius: 6px;
}

.article-head .handle-col {
  cursor: default;
}

.handle-col {
  width: 28px;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
}

.drag-handle {
  cursor: move;
  color: #c0c4cc;
  font-size: 18px;
}

.drag-handle:hover {
  color: #409eff;
}

.col-title {
  flex: 1;
  min-width: 0;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.col-status {
  width: 80px;
  flex-shrink: 0;
}

.col-date {
  width: 110px;
  flex-shrink: 0;
  font-size: 13px;
  color: #909399;
}

.col-actions {
  width: 130px;
  flex-shrink: 0;
  text-align: right;
}

@media (max-width: 768px) {
  .col-date,
  .article-head .col-date {
    display: none;
  }

  .col-actions {
    width: auto;
  }
}
</style>
