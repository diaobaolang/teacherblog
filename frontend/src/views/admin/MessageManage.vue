<template>
  <div class="message-manage">
    <h2 class="page-title">留言审核</h2>

    <el-tabs v-model="activeTab" @tab-change="loadList">
      <el-tab-pane label="待审核" name="pending" />
      <el-tab-pane label="已通过" name="approved" />
      <el-tab-pane label="已拒绝" name="rejected" />
      <el-tab-pane label="全部" name="all" />
    </el-tabs>

    <el-card shadow="never">
      <div v-if="filteredList.length" class="message-list">
        <div v-for="msg in filteredList" :key="msg.id" class="message-row">
          <div class="message-info">
            <div class="message-header">
              <span class="nickname">{{ msg.nickname }}</span>
              <el-tag :type="statusTagType(msg.status)" size="small">{{ statusText(msg.status) }}</el-tag>
              <span class="date">{{ formatDate(msg.created_at) }}</span>
            </div>
            <p class="content">{{ msg.content }}</p>
          </div>

          <div class="message-actions">
            <template v-if="msg.status === 'pending'">
              <el-button type="success" size="small" @click="handleReview(msg.id, 'approved')">通过</el-button>
              <el-button type="danger" size="small" @click="handleReview(msg.id, 'rejected')">拒绝</el-button>
            </template>
            <el-popconfirm title="确定删除此留言？" @confirm="handleDelete(msg.id)">
              <template #reference>
                <el-button type="danger" text size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </div>
        </div>
      </div>
      <el-empty v-else description="暂无留言" />
    </el-card>

    <!-- 已通过留言排序 -->
    <el-card v-if="activeTab === 'approved' && approvedList.length" shadow="never" class="sort-card">
      <template #header>
        <div class="card-header">
          <span>调整展示顺序</span>
          <el-button type="primary" size="small" @click="handleSort">保存排序</el-button>
        </div>
      </template>
      <draggable v-model="approvedList" item-key="id" handle=".drag-handle">
        <template #item="{ element }">
          <div class="sort-item">
            <el-icon class="drag-handle"><Rank /></el-icon>
            <span class="sort-nickname">{{ element.nickname }}</span>
            <span class="sort-content">{{ element.content.slice(0, 40) }}...</span>
          </div>
        </template>
      </draggable>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import draggable from 'vuedraggable'
import { getAdminMessages, reviewMessage, deleteMessage, sortMessages } from '../../api'

const activeTab = ref('pending')
const list = ref([])
const approvedList = ref([])

onMounted(() => loadList())

async function loadList() {
  try {
    const data = await getAdminMessages()
    list.value = data
    approvedList.value = data.filter(m => m.status === 'approved')
  } catch (e) {
    // 错误已在拦截器处理
  }
}

const filteredList = computed(() => {
  if (activeTab.value === 'all') return list.value
  return list.value.filter(m => m.status === activeTab.value)
})

async function handleReview(id, status) {
  try {
    await reviewMessage(id, status)
    ElMessage.success(`已${status === 'approved' ? '通过' : '拒绝'}`)
    await loadList()
  } catch (e) {
    // 错误已在拦截器处理
  }
}

async function handleDelete(id) {
  try {
    await deleteMessage(id)
    ElMessage.success('已删除')
    await loadList()
  } catch (e) {
    // 错误已在拦截器处理
  }
}

async function handleSort() {
  try {
    await sortMessages(approvedList.value.map(item => ({ id: item.id })))
    ElMessage.success('排序已保存')
    await loadList()
  } catch (e) {
    // 错误已在拦截器处理
  }
}

function statusText(status) {
  return { pending: '待审核', approved: '已通过', rejected: '已拒绝' }[status]
}

function statusTagType(status) {
  return { pending: 'warning', approved: 'success', rejected: 'danger' }[status]
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('zh-CN')
}
</script>

<style scoped>
.page-title {
  font-size: 20px;
  margin-bottom: 20px;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
}

.message-info {
  flex: 1;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.nickname {
  font-weight: 600;
  font-size: 14px;
}

.date {
  font-size: 12px;
  color: #c0c4cc;
}

.content {
  font-size: 14px;
  color: #606266;
}

.message-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.sort-card {
  margin-top: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sort-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.drag-handle {
  cursor: move;
  color: #c0c4cc;
}

.sort-nickname {
  font-weight: 600;
  min-width: 80px;
}

.sort-content {
  color: #909399;
  font-size: 13px;
}
</style>
