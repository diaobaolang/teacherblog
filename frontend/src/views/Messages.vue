<template>
  <div class="messages-page">
    <h1 class="page-title">学生与家长留言</h1>

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

    <!-- 悬浮球形按钮 -->
    <div class="fab-container">
      <div class="fab-ball" :class="{ 'fab-active': showForm }" @click="showForm ? (showForm = false) : openForm()">
        <el-icon class="fab-icon"><EditPen v-if="!showForm" /><Close v-else /></el-icon>
        <span class="fab-ripple"></span>
        <span class="fab-ripple fab-ripple-delay"></span>
      </div>
    </div>

    <!-- 留言表单弹窗 -->
    <transition name="form-slide">
      <el-card v-if="showForm" class="form-popup" shadow="always">
        <template #header>
          <div class="card-header">
            <el-icon><EditPen /></el-icon>
            <span>写留言</span>
            <span class="form-subtitle">（学生与家长留言）</span>
            <el-icon class="form-close" @click="showForm = false"><Close /></el-icon>
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
          <div class="form-footer">
            <el-button @click="showForm = false">取消</el-button>
            <el-button type="primary" :loading="submitting" @click="handleSubmit">提交留言</el-button>
          </div>
        </el-form>
      </el-card>
    </transition>

    <!-- 遮罩层 -->
    <transition name="fade">
      <div v-if="showForm" class="fab-mask" @click="showForm = false"></div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Close } from '@element-plus/icons-vue'
import { getMessages, submitMessage } from '../api'

const messages = ref([])
const submitting = ref(false)
const showForm = ref(false)
const keyboardOffset = ref(0)
const form = ref({
  nickname: '',
  content: ''
})

onMounted(() => {
  loadMessages()
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleViewportResize)
    window.visualViewport.addEventListener('scroll', handleViewportResize)
  }
})

onBeforeUnmount(() => {
  if (window.visualViewport) {
    window.visualViewport.removeEventListener('resize', handleViewportResize)
    window.visualViewport.removeEventListener('scroll', handleViewportResize)
  }
})

// 监听可视区域变化（移动端键盘弹出/收起时触发）
function handleViewportResize() {
  const vv = window.visualViewport
  if (!vv) return
  // 键盘高度 = 窗口高度 - 可视区域高度
  const keyboardHeight = window.innerHeight - vv.height - vv.offsetTop
  keyboardOffset.value = Math.max(0, keyboardHeight)
}

async function openForm() {
  showForm.value = true
  await nextTick()
  // 触发一次 viewport 检测，确保弹窗位置正确
  handleViewportResize()
}

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
    showForm.value = false
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

/* ===== 悬浮球形按钮 ===== */
.fab-container {
  position: fixed;
  bottom: 40px;
  right: 40px;
  z-index: 200;
}

.fab-ball {
  position: relative;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background-size: 200% 200%;
  animation: gradientShift 4s ease infinite;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.5);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.fab-ball:hover {
  transform: scale(1.15) rotate(10deg);
  box-shadow: 0 6px 28px rgba(102, 126, 234, 0.7);
}

.fab-ball:active {
  transform: scale(1.05);
}

.fab-active {
  background: linear-gradient(135deg, #f56c6c 0%, #e6a23c 100%);
  background-size: 200% 200%;
  animation: gradientShift 4s ease infinite;
  box-shadow: 0 4px 20px rgba(245, 108, 108, 0.5);
}

.fab-active:hover {
  box-shadow: 0 6px 28px rgba(245, 108, 108, 0.7);
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.fab-icon {
  font-size: 26px;
  color: #fff;
  z-index: 2;
}

/* 波纹动画 */
.fab-ripple {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(102, 126, 234, 0.4);
  animation: ripple 2.5s ease-out infinite;
  pointer-events: none;
}

.fab-ripple-delay {
  animation-delay: 1.25s;
}

.fab-active .fab-ripple {
  border-color: rgba(245, 108, 108, 0.4);
}

@keyframes ripple {
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1.8);
    opacity: 0;
  }
}

/* ===== 遮罩层 ===== */
.fab-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 201;
  backdrop-filter: blur(2px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ===== 弹窗表单 ===== */
.form-popup {
  position: fixed;
  bottom: 120px;
  right: 40px;
  width: 400px;
  max-width: calc(100vw - 80px);
  z-index: 202;
  border-radius: 12px;
  overflow: hidden;
  /* 动态偏移：移动端键盘弹出时上移 */
  transform: translateY(calc(-1 * v-bind(keyboardOffset) + 0px));
  transition: transform 0.25s ease;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
}

.form-subtitle {
  font-size: 13px;
  font-weight: 400;
  color: #909399;
}

.form-close {
  margin-left: auto;
  cursor: pointer;
  color: #909399;
  font-size: 18px;
  transition: color 0.2s;
}

.form-close:hover {
  color: #f56c6c;
}

.form-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 弹窗滑入动画 */
.form-slide-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.form-slide-leave-active {
  transition: all 0.25s ease-in;
}

.form-slide-enter-from {
  opacity: 0;
  transform: translateY(30px) scale(0.9);
}

.form-slide-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

@media (max-width: 768px) {
  .fab-container {
    /* 抬高到底部导航栏（54px）之上，并预留安全区，避免被遮挡 */
    bottom: calc(54px + constant(safe-area-inset-bottom) + 24px);
    bottom: calc(54px + env(safe-area-inset-bottom) + 24px);
    right: 16px;
  }

  .fab-ball {
    width: 44px;
    height: 44px;
  }

  .fab-icon {
    font-size: 19px;
  }

  .form-popup {
    bottom: auto;
    top: 16px;
    right: 12px;
    left: 12px;
    width: auto;
    max-width: none;
    /* 移动端键盘弹出时，弹窗向上偏移避免被遮挡 */
    transform: translateY(calc(-1 * v-bind(keyboardOffset) + 0px));
    max-height: calc(100vh - 32px);
    overflow-y: auto;
  }

  /* 移动端弹窗从顶部滑入 */
  .form-slide-enter-from {
    opacity: 0;
    transform: translateY(-30px) scale(0.95) !important;
  }

  .form-slide-leave-to {
    opacity: 0;
    transform: translateY(-20px) scale(0.95) !important;
  }
}
</style>
