<template>
  <div class="article-manage">
    <div class="header-row">
      <h2 class="page-title">文章管理</h2>
      <el-button type="primary" @click="$router.push('/admin/articles/edit')">写新文章</el-button>
    </div>

    <el-card shadow="never">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column label="标题" prop="title" min-width="200" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'published' ? 'success' : 'info'">
              {{ row.status === 'published' ? '已发布' : '草稿' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="120">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" @click="$router.push(`/admin/articles/edit/${row.id}`)">编辑</el-button>
            <el-popconfirm title="确定删除此文章？" @confirm="handleDelete(row.id)">
              <template #reference>
                <el-button text type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getAdminArticles, deleteArticle } from '../../api'

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
</style>
