<template>
  <div class="message-manage">
    <h2 class="page-title">学生与家长留言审核</h2>

    <el-tabs v-model="activeTab" @tab-change="loadList">
      <el-tab-pane label="待审核" name="pending" />
      <el-tab-pane label="已通过" name="approved" />
      <el-tab-pane label="已拒绝" name="rejected" />
      <el-tab-pane label="全部" name="all" />
    </el-tabs>

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>留言列表</span>
          <span v-if="activeTab === 'approved' && displayList.length > 1" class="tip">
            拖拽左侧手柄调整展示顺序，松开自动保存
          </span>
        </div>
      </template>

      <draggable
        v-if="displayList.length"
        v-model="displayList"
        item-key="id"
        handle=".drag-handle"
        :disabled="activeTab !== 'approved'"
        @end="handleSort"
      >
        <template #item="{ element }">
          <div class="message-row" :class="{ 'is-draggable': activeTab === 'approved' }">
            <el-icon v-if="activeTab === 'approved'" class="drag-handle"><Rank /></el-icon>

            <div class="message-info">
              <div class="message-header">
                <span class="nickname">{{ element.nickname }}</span>
                <el-tag :type="statusTagType(element.status)" size="small">{{ statusText(element.status) }}</el-tag>
                <span class="date">{{ formatDate(element.created_at) }}</span>
              </div>
              <p class="content">{{ element.content }}</p>
            </div>

            <div class="message-actions">
              <template v-if="element.status === 'pending'">
                <el-button type="success" size="small" @click="handleReview(element.id, 'approved')">通过</el-button>
                <el-button type="danger" size="small" @click="handleReview(element.id, 'rejected')">拒绝</el-button>
              </template>
              <el-popconfirm title="确定删除此留言？" @confirm="handleDelete(element.id)">
                <template #reference>
                  <el-button type="danger" text size="small">删除</el-button>
                </template>
              </el-popconfirm>
            </div>
          </div>
        </template>
      </draggable>

      <el-empty v-else description="暂无留言" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import draggable from 'vuedraggable'
import { getAdminMessages, reviewMessage, deleteMessage, sortMessages } from '../../api'

const activeTab = ref('pending')
const list = ref([])
// 当前标签页展示的列表（仅"已通过"可拖拽排序）
const displayList = ref([])

onMounted(() => loadList())

async function loadList() {
  try {
    const data = await getAdminMessages()
    list.value = data
    rebuildDisplay()
  } catch (e) {
    // 错误已在拦截器处理
  }
}

function rebuildDisplay() {
  const filtered = activeTab.value === 'all'
    ? list.value
    : list.value.filter(m => m.status === activeTab.value)

  // "已通过"按实际展示顺序（sort_order）排列，与前台保持一致
  displayList.value = activeTab.value === 'approved'
    ? [...filtered].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    : [...filtered]
}

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

// 拖拽结束后自动保存顺序
async function handleSort() {
  try {
    await sortMessages(displayList.value.map(item => ({ id: item.id })))
    ElMessage.success('排序已更新')
  } catch (e) {
    // 保存失败时重新拉取，恢复为服务端顺序
    await loadList()
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

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tip {
  font-size: 13px;
  color: #909399;
}

.message-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  margin-bottom: 12px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  background: #fff;
}

.message-row.is-draggable {
  cursor: default;
}

.drag-handle {
  cursor: move;
  color: #c0c4cc;
  font-size: 18px;
  margin-top: 3px;
  flex-shrink: 0;
}

.drag-handle:hover {
  color: #409eff;
}

.message-info {
  flex: 1;
  min-width: 0;
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
</style>
