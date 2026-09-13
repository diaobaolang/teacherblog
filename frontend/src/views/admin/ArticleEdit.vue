<template>
  <div class="article-edit">
    <div class="header-row">
      <h2 class="page-title">{{ isEdit ? '编辑文章' : '写新文章' }}</h2>
      <el-button text @click="$router.back()">
        <el-icon><ArrowLeft /></el-icon>返回
      </el-button>
    </div>

    <el-card shadow="never" v-loading="loading">
      <el-form :model="form" label-position="top">
        <el-form-item label="标题">
          <el-input v-model="form.title" placeholder="请输入文章标题" maxlength="100" show-word-limit />
        </el-form-item>

        <el-form-item label="摘要">
          <el-input v-model="form.summary" type="textarea" :rows="2" placeholder="一句话概括文章内容" maxlength="200" show-word-limit />
        </el-form-item>

        <el-form-item label="封面图">
          <el-upload
            :show-file-list="false"
            :before-upload="beforeCoverUpload"
            :http-request="handleCoverUpload"
            accept="image/*"
          >
            <div v-if="form.cover_image" class="cover-preview">
              <img :src="form.cover_image" />
              <div class="cover-mask">点击更换</div>
            </div>
            <el-button v-else type="primary" plain :loading="coverUploading">上传封面图</el-button>
          </el-upload>
          <el-button v-if="form.cover_image" text type="danger" @click="form.cover_image = ''">移除封面</el-button>
        </el-form-item>

        <el-form-item label="正文内容">
          <div class="editor-wrapper wangeditor-wrap">
            <Toolbar
              :editor="editorRef"
              :defaultConfig="toolbarConfig"
              mode="default"
              class="wangeditor-toolbar"
            />
            <Editor
              v-model="form.content"
              :defaultConfig="editorConfig"
              mode="default"
              style="height: 500px; overflow-y: hidden"
              @onCreated="handleEditorCreated"
            />
          </div>
        </el-form-item>

        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio value="draft">草稿</el-radio>
            <el-radio value="published">发布</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
          <el-button @click="$router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import '@wangeditor/editor/dist/css/style.css'
import { getAdminArticle, createArticle, updateArticle, uploadImage } from '../../api'

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => !!route.params.id)
const loading = ref(false)
const saving = ref(false)
const coverUploading = ref(false)
const editorRef = shallowRef()

const form = reactive({
  title: '',
  summary: '',
  cover_image: '',
  content: '',
  status: 'draft'
})

const editorConfig = {
  MENU_CONF: {
    uploadImage: {
      async customUpload(file, insertFn) {
        try {
          const res = await uploadImage(file)
          insertFn(res.url, file.name, res.url)
        } catch (e) {
          ElMessage.error('图片上传失败')
        }
      }
    }
  }
}

const toolbarConfig = {}

onMounted(async () => {
  if (route.params.id) {
    loading.value = true
    try {
      const data = await getAdminArticle(route.params.id)
      Object.assign(form, data)
    } catch (e) {
      // 错误已在拦截器处理
    } finally {
      loading.value = false
    }
  }
})

onBeforeUnmount(() => {
  if (editorRef.value) {
    editorRef.value.destroy()
  }
})

function handleEditorCreated(editor) {
  editorRef.value = editor
}

function beforeCoverUpload(file) {
  const valid = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)
  if (!valid) {
    ElMessage.error('仅支持 jpg/png/gif/webp 格式')
    return false
  }
  return true
}

async function handleCoverUpload({ file }) {
  coverUploading.value = true
  try {
    const res = await uploadImage(file)
    form.cover_image = res.url
    ElMessage.success('封面上传成功')
  } catch (e) {
    // 错误已在拦截器处理
  } finally {
    coverUploading.value = false
  }
}

async function handleSave() {
  if (!form.title.trim()) {
    ElMessage.warning('请输入文章标题')
    return
  }

  saving.value = true
  try {
    if (isEdit.value) {
      await updateArticle(route.params.id, form)
      ElMessage.success('保存成功')
    } else {
      await createArticle(form)
      ElMessage.success('创建成功')
    }
    router.push('/admin/articles')
  } catch (e) {
    // 错误已在拦截器处理
  } finally {
    saving.value = false
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

.editor-wrapper {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}
</style>
