<script setup lang="ts">
import { ref, onMounted, onActivated, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFlowStore } from '@/stores/flow'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FlowMeta, TestFlow } from '@/types/flow'
import AIImporter from '@/components/AIImporter.vue'

const router = useRouter()
const flowStore = useFlowStore()

const searchText = ref('')
const aiImporterVisible = ref(false)

// 筛选后的流程列表
const filteredFlows = computed(() => {
  if (!searchText.value) return flowStore.flows
  const text = searchText.value.toLowerCase()
  return flowStore.flows.filter(flow =>
    flow.name.toLowerCase().includes(text) ||
    flow.description?.toLowerCase().includes(text) ||
    flow.tags?.some(t => t.toLowerCase().includes(text))
  )
})

// 创建新流程
function createNewFlow() {
  flowStore.createNewFlow()
  router.push('/designer')
}

// 编辑流程
function editFlow(id: string) {
  router.push(`/designer/${id}`)
}

// 删除流程
async function handleDelete(flow: FlowMeta) {
  try {
    await ElMessageBox.confirm(
      `确定要删除流程 "${flow.name}" 吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await flowStore.deleteFlow(flow.id)
    ElMessage.success('删除成功')
  } catch (e) {
    // 用户取消
  }
}

// 生成用例
function generateCases(flowId: string) {
  router.push(`/test-cases?flowId=${flowId}`)
}

// 复制流程
async function handleDuplicate(flow: FlowMeta) {
  await flowStore.duplicateFlow(flow.id)
}

// AI 生成成功
function handleAIGenerateSuccess(flow: TestFlow) {
  // 导航到流程设计器进行编辑
  router.push(`/designer/${flow.id}`)
}

// 导出流程
function exportFlow(flow: FlowMeta) {
  // TODO: 实现导出功能
  ElMessage.info('导出功能开发中')
}

// 格式化日期
function formatDate(dateStr?: string) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// 加载数据 - 每次进入页面都刷新
onMounted(async () => {
  await flowStore.fetchFlows()
})

// 每次返回列表页时都刷新
onActivated(async () => {
  await flowStore.fetchFlows()
})
</script>

<template>
  <div class="flow-list">
    <!-- 头部 -->
    <div class="flow-list-header">
      <div class="header-left">
        <h2>流程列表</h2>
        <span class="flow-count">共 {{ flowStore.flows.length }} 个流程</span>
      </div>
      <div class="header-right">
        <el-input
          v-model="searchText"
          placeholder="搜索流程..."
          style="width: 240px"
          clearable
        >
          <template #prefix>
            <span>🔍</span>
          </template>
        </el-input>
        <el-button type="primary" @click="createNewFlow">
          + 创建流程
        </el-button>
        <el-button type="success" @click="aiImporterVisible = true">
          🤖 AI 导入
        </el-button>
      </div>
    </div>

    <!-- 流程卡片列表 -->
    <div v-if="flowStore.isLoading" class="loading-state">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>加载中...</span>
    </div>

    <div v-else-if="filteredFlows.length === 0" class="empty-state">
      <div class="empty-state-icon">📋</div>
      <div class="empty-state-text">
        {{ searchText ? '没有匹配的流程' : '暂无流程，点击"创建流程"开始' }}
      </div>
    </div>

    <div v-else class="flow-grid">
      <div
        v-for="flow in filteredFlows"
        :key="flow.id"
        class="flow-card"
      >
        <div class="flow-card-title" :title="flow.name">{{ flow.name }}</div>
        <div class="flow-card-meta">
          <span>版本: v{{ flow.version }}</span>
          <span>•</span>
          <span>节点: {{ flow.nodeCount }}</span>
        </div>
        <div v-if="flow.description" class="flow-card-desc">
          {{ flow.description }}
        </div>
        <div v-if="flow.tags?.length" class="flow-card-tags">
          <span
            v-for="tag in flow.tags"
            :key="tag"
            class="flow-card-tag"
          >
            {{ tag }}
          </span>
        </div>
        <div class="flow-card-footer">
          <span class="flow-card-date">更新于 {{ formatDate(flow.updatedAt) }}</span>
        </div>
        <div class="flow-card-actions">
          <el-button size="small" type="primary" @click="editFlow(flow.id)">
            编辑
          </el-button>
          <el-button size="small" type="success" @click="generateCases(flow.id)">
            生成用例
          </el-button>
          <el-button size="small" @click="handleDuplicate(flow)">
            复制
          </el-button>
          <el-button size="small" type="danger" text @click="handleDelete(flow)">
            删除
          </el-button>
        </div>
      </div>
    </div>
  </div>

  <!-- AI 导入弹窗 -->
  <AIImporter
    v-model:visible="aiImporterVisible"
    @success="handleAIGenerateSuccess"
  />
</template>

<style scoped>
.flow-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.header-left h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.flow-count {
  font-size: 14px;
  color: #909399;
}

.header-right {
  display: flex;
  gap: 12px;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 60px;
  color: #909399;
}

.flow-card {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s;
}

.flow-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #409eff;
}

.flow-card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.flow-card-meta {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
  display: flex;
  gap: 8px;
}

.flow-card-desc {
  font-size: 13px;
  color: #606266;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.flow-card-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.flow-card-tag {
  font-size: 12px;
  padding: 2px 8px;
  background: #f0f2f5;
  color: #606266;
  border-radius: 4px;
}

.flow-card-footer {
  margin-bottom: 12px;
}

.flow-card-date {
  font-size: 12px;
  color: #c0c4cc;
}

.flow-card-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  border-top: 1px solid #f0f2f5;
  padding-top: 12px;
  margin-top: 4px;
}
</style>
