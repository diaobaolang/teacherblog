<template>
  <div class="profile-manage">
    <h2 class="page-title">个人介绍管理</h2>
    <el-card shadow="never">
      <div class="editor-toolbar">
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </div>
      <div class="editor-wrapper wangeditor-wrap">
        <Toolbar
          :editor="editorRef"
          :defaultConfig="toolbarConfig"
          mode="default"
          class="wangeditor-toolbar"
        />
        <Editor
          v-model="content"
          :defaultConfig="editorConfig"
          mode="default"
          style="height: 400px; overflow-y: hidden"
          @onCreated="handleEditorCreated"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, shallowRef } from 'vue'
import { ElMessage } from 'element-plus'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import '@wangeditor/editor/dist/css/style.css'
import { getProfile, updateProfile, uploadImage } from '../../api'

const content = ref('')
const saving = ref(false)
const editorRef = shallowRef()

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
  try {
    const data = await getProfile()
    content.value = data.content || ''
  } catch (e) {
    // 错误已在拦截器处理
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

async function handleSave() {
  saving.value = true
  try {
    await updateProfile(content.value)
    ElMessage.success('保存成功')
  } catch (e) {
    // 错误已在拦截器处理
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.page-title {
  font-size: 20px;
  margin-bottom: 20px;
}

.editor-toolbar {
  margin-bottom: 12px;
}

.editor-wrapper {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}
</style>
