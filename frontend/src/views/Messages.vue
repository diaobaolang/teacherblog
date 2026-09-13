<template>
  <div class="messages-page">
    <h1 class="page-title">留言板</h1>

    <!-- 留言列表 -->
    <div class="message-list">
      <el-card v-if="messages.length" shadow="never" class="message-card" v-for="msg in messages" :key="msg.id">
        <div class="message-item">
          <el-avatar :size="40" class="avatar">{{ msg.nickname.charAt(0).toUpperCase() }}</el-avatar>
          <div class="message-content">
            <div class="message-header">
              <span class="nickname">{{ msg.nickname }}</span>
              <span class="date">{{ formatDate(msg.created_at) }}</span>
            </div>
            <p class="text">{{ msg.content }}</p>
          </div>
        </div>
      </el-card>
      <el-empty v-else description="暂无留言，快来第一个留言吧" />
    </div>

    <!-- 提交留言 -->
    <el-card class="form-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><EditPen /></el-icon>
          <span>写留言</span>
        </div>
      </template>
      <el-form :model="form" label-position="top" @submit.prevent="handleSubmit">
        <el-form-item label="昵称">
          <el-input v-model="form.nickname" placeholder="请输入你的昵称" maxlength="20" show-word-limit />
        </el-form-item>
        <el-form-item label="留言内容">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="4"
            placeholder="请输入留言内容"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">提交留言</el-button>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getMessages, submitMessage } from '../api'

const messages = ref([])
const submitting = ref(false)
const form = ref({
  nickname: '',
  content: ''
})

onMounted(() => loadMessages())

async function loadMessages() {
  try {
    const data = await getMessages()
    messages.value = data
  } catch (e) {
    // 错误已在拦截器处理
  }
}

async function handleSubmit() {
  if (!form.value.nickname.trim()) {
    ElMessage.warning('请输入昵称')
    return
  }
  if (!form.value.content.trim()) {
    ElMessage.warning('请输入留言内容')
    return
  }

  submitting.value = true
  try {
    await submitMessage(form.value)
    ElMessage.success('留言已提交，等待管理员审核')
    form.value.nickname = ''
    form.value.content = ''
  } catch (e) {
    // 错误已在拦截器处理
  } finally {
    submitting.value = false
  }
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

.message-list {
  margin-bottom: 24px;
}

.message-card {
  margin-bottom: 12px;
}

.message-item {
  display: flex;
  gap: 12px;
}

.avatar {
  background: #409eff;
  color: #fff;
  flex-shrink: 0;
}

.message-content {
  flex: 1;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.nickname {
  font-weight: 600;
  font-size: 14px;
  color: #333;
}

.date {
  font-size: 12px;
  color: #c0c4cc;
}

.text {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
}

.form-card {
  margin-top: 24px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
}
</style>
