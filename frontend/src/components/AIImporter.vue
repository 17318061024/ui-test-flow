<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { aiGenerateFlow, type AIGenerateRequest } from '@/api/flows'
import type { TestFlow } from '@/types/flow'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'success', flow: TestFlow): void
}>()

const loading = ref(false)
const appName = ref('')
const requirement = ref('')
const images = ref<string[]>([])
const fileInputRef = ref<HTMLInputElement | null>(null)

// 上传图片
function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const files = target.files

  if (!files || files.length === 0) return

  const imagePromises: Promise<string>[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const promise = new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        // 转换为 base64 格式（data:image/jpeg;base64,xxxxx）
        resolve(result)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
    imagePromises.push(promise)
  }

  Promise.all(imagePromises)
    .then(base64Images => {
      images.value = [...images.value, ...base64Images]
      ElMessage.success(`已上传 ${base64Images.length} 张图片`)
    })
    .catch(() => {
      ElMessage.error('图片上传失败')
    })

  // 清空 input 以便重复选择同一文件
  target.value = ''
}

// 移除图片
function removeImage(index: number) {
  images.value.splice(index, 1)
}

// 提交生成
async function handleSubmit() {
  if (images.value.length === 0) {
    ElMessage.warning('请至少上传一张图片')
    return
  }

  if (!requirement.value.trim()) {
    ElMessage.warning('请输入需求描述')
    return
  }

  loading.value = true

  try {
    const request: AIGenerateRequest = {
      images: images.value,
      requirement: requirement.value,
      appName: appName.value || undefined
    }

    const flow = await aiGenerateFlow(request)
    ElMessage.success('AI 生成流程图成功')
    emit('success', flow)
    handleClose()
  } catch (error) {
    console.error('AI 生成失败:', error)
    ElMessage.error(error instanceof Error ? error.message : 'AI 生成失败')
  } finally {
    loading.value = false
  }
}

// 关闭弹窗
function handleClose() {
  appName.value = ''
  requirement.value = ''
  images.value = []
  emit('update:visible', false)
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="AI 导入 - 从设计图生成流程"
    width="600px"
    :close-on-click-modal="false"
    @update:model-value="emit('update:visible', $event)"
  >
    <div class="ai-importer">
      <!-- 应用名称 -->
      <el-form-item label="应用名称">
        <el-input
          v-model="appName"
          placeholder="可选，用于命名生成的流程"
          clearable
        />
      </el-form-item>

      <!-- 上传图片 -->
      <el-form-item label="设计图片" required>
        <div class="image-upload-area">
          <input
            ref="fileInputRef"
            type="file"
            accept="image/*"
            multiple
            style="display: none"
            @change="handleFileChange"
          />
          <div class="upload-button" @click="fileInputRef?.click()">
            <span class="upload-icon">📁</span>
            <span>点击上传设计图</span>
            <span class="upload-hint">支持多张图片（PNG、JPG、JPEG）</span>
          </div>

          <!-- 已上传图片预览 -->
          <div v-if="images.length > 0" class="image-preview-list">
            <div
              v-for="(img, index) in images"
              :key="index"
              class="image-preview-item"
            >
              <img :src="img" alt="预览" />
              <span class="remove-btn" @click.stop="removeImage(index)">×</span>
            </div>
          </div>
        </div>
      </el-form-item>

      <!-- 需求描述 -->
      <el-form-item label="需求描述" required>
        <el-input
          v-model="requirement"
          type="textarea"
          :rows="5"
          placeholder="请描述测试需求，例如：测试登录功能的正常登录、错误密码登录、账号不存在等场景"
        />
      </el-form-item>

      <!-- 提示 -->
      <div class="tip">
        <p>💡 提示：上传 UI 设计图并描述测试需求，AI 将自动分析并生成流程图。您可以在流程设计器中编辑和调整。</p>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button
        type="primary"
        :loading="loading"
        :disabled="images.length === 0 || !requirement.trim()"
        @click="handleSubmit"
      >
        {{ loading ? '生成中...' : '生成流程图' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.ai-importer {
  padding: 0 10px;
}

.image-upload-area {
  width: 100%;
}

.upload-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  background: #fafafa;
}

.upload-button:hover {
  border-color: #409eff;
  background: #f0f7ff;
}

.upload-icon {
  font-size: 32px;
  margin-bottom: 10px;
}

.upload-hint {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

.image-preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 15px;
}

.image-preview-item {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e4e7ed;
}

.image-preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
}

.remove-btn:hover {
  background: #f56c6c;
}

.tip {
  background: #f4f4f5;
  padding: 12px;
  border-radius: 6px;
  margin-top: 10px;
}

.tip p {
  margin: 0;
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
}
</style>