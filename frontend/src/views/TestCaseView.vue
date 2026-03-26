<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as api from '@/api/flows'
import type { TestCase, TestFlow } from '@/types/flow'

const route = useRoute()
const router = useRouter()

const isLoading = ref(false)
const testCases = ref<TestCase[]>([])
const flow = ref<TestFlow | null>(null)
const expandedCases = ref<Set<string>>(new Set())

// 获取流程ID
const flowId = computed(() => route.query.flowId as string)

// 加载测试用例
async function loadTestCases() {
  // 清空旧数据，避免显示缓存
  testCases.value = []
  flow.value = null
  expandedCases.value.clear()

  if (!flowId.value) {
    // 加载所有用例
    testCases.value = await api.getTestCases()
    return
  }

  isLoading.value = true
  try {
    // 获取流程信息
    flow.value = await api.getFlow(flowId.value)
    // 生成测试用例
    testCases.value = await api.generateTestCases(flowId.value)
  } catch (e) {
    console.error('加载失败:', e)
  } finally {
    isLoading.value = false
  }
}

// 监听路由参数变化，重新加载数据
watch(() => route.query.flowId, () => {
  loadTestCases()
})

// 切换用例展开状态
function toggleCase(caseId: string) {
  if (expandedCases.value.has(caseId)) {
    expandedCases.value.delete(caseId)
  } else {
    expandedCases.value.add(caseId)
  }
}

// 获取步骤类型标签
function getStepTypeLabel(type: string) {
  const map: Record<string, string> = {
    action: '操作',
    assert: '断言',
    extract: '提取',
    wait: '等待'
  }
  return map[type] || type
}

// 获取步骤类型样式
function getStepTypeClass(type: string) {
  const map: Record<string, string> = {
    action: 'step-action',
    assert: 'step-assert',
    extract: 'step-extract',
    wait: 'step-wait'
  }
  return map[type] || ''
}

// 格式化日期
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 返回
function goBack() {
  router.push('/')
}

// 导出用例
async function exportCases(format: 'json' | 'yaml' | 'script') {
  if (!flowId.value) return

  try {
    const content = await api.exportTestCases(flowId.value, format)
    // 创建下载
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `test-cases.${format === 'script' ? 'js' : format}`
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    console.error('导出失败:', e)
  }
}

onMounted(() => {
  loadTestCases()
})
</script>

<template>
  <div class="test-case-preview">
    <!-- 头部 -->
    <div class="preview-header">
      <div class="header-left">
        <el-button @click="goBack" :icon="'ArrowLeft'">返回</el-button>
        <h2>{{ flow?.name || '测试用例' }}</h2>
        <span class="case-count">共 {{ testCases.length }} 条用例</span>
      </div>
      <div class="header-right">
        <el-button-group>
          <el-button @click="exportCases('json')">导出 JSON</el-button>
          <el-button @click="exportCases('yaml')">导出 YAML</el-button>
          <el-button @click="exportCases('script')">导出脚本</el-button>
        </el-button-group>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-state">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>生成测试用例中...</span>
    </div>

    <!-- 空状态 -->
    <div v-else-if="testCases.length === 0" class="empty-state">
      <div class="empty-state-icon">📝</div>
      <div class="empty-state-text">
        {{ flowId ? '暂无测试用例，请先创建流程' : '暂无测试用例数据' }}
      </div>
      <el-button v-if="flowId" type="primary" @click="goBack">
        去创建流程
      </el-button>
    </div>

    <!-- 用例列表 -->
    <div v-else class="test-case-list">
      <div
        v-for="testCase in testCases"
        :key="testCase.id"
        class="test-case-item"
      >
        <!-- 用例头部 -->
        <div class="test-case-header" @click="toggleCase(testCase.id)">
          <div class="case-info">
            <span class="expand-icon">{{ expandedCases.has(testCase.id) ? '▼' : '▶' }}</span>
            <span class="case-id">{{ testCase.id }}</span>
            <span class="case-name" :title="testCase.name">{{ testCase.name }}</span>
          </div>
          <div class="case-meta">
            <span class="case-steps-count">{{ testCase.steps?.length || 0 }} 步</span>
          </div>
        </div>

        <!-- 用例详情 -->
        <div v-if="expandedCases.has(testCase.id)" class="test-case-content">
          <div v-if="testCase.description" class="case-description">
            {{ testCase.description }}
          </div>

          <!-- 步骤列表 -->
          <div class="steps-list">
            <div
              v-for="(step, index) in (testCase.steps || [])"
              :key="step.id"
              class="test-case-step"
            >
              <div :class="['step-index', getStepTypeClass(step.type)]">
                {{ index + 1 }}
              </div>
              <div class="step-content">
                <div class="step-type">{{ getStepTypeLabel(step.type) }}</div>
                <div class="step-action">
                  <template v-if="step.type === 'action'">
                    <template v-if="step.description">
                      {{ step.description }}
                      <template v-if="step.target"> [目标: {{ step.target }}]</template>
                      <template v-if="step.value"> → 输入值: {{ step.value }}</template>
                    </template>
                    <template v-else>
                      {{ step.method || '操作' }}: {{ step.target || '-' }}
                      <span v-if="step.value"> → {{ step.value }}</span>
                    </template>
                  </template>
                  <template v-else-if="step.type === 'assert'">
                    <template v-if="step.description">{{ step.description }}</template>
                    <template v-else>
                      {{ step.assertType || '验证' }}: {{ step.target || '-' }}
                      <span v-if="step.expected"> → 期望: {{ step.expected }}</span>
                    </template>
                  </template>
                  <template v-else-if="step.type === 'extract'">
                    {{ step.description || '提取数据' }}
                    <template v-if="step.target"> [目标: {{ step.target }}]</template>
                    → 变量: {{ step.as || '-' }}
                  </template>
                  <template v-else-if="step.type === 'wait'">
                    {{ step.description || '等待' }} ({{ step.timeout || 0 }}秒)
                  </template>
                  <template v-else>
                    {{ step.description || '未知步骤' }}
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.test-case-preview {
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
}

.preview-header {
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

.case-count {
  font-size: 14px;
  color: #909399;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 60px;
  color: #909399;
}

.test-case-item {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 12px;
}

.test-case-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f5f7fa;
  cursor: pointer;
}

.test-case-header:hover {
  background: #ebeef5;
}

.case-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.expand-icon {
  font-size: 12px;
  color: #909399;
}

.case-id {
  font-family: monospace;
  font-size: 13px;
  color: #409eff;
  background: #ecf5ff;
  padding: 2px 8px;
  border-radius: 4px;
}

.case-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.case-meta {
  font-size: 13px;
  color: #909399;
}

.test-case-content {
  padding: 16px;
  border-top: 1px solid #e4e7ed;
}

.case-description {
  font-size: 13px;
  color: #606266;
  margin-bottom: 16px;
  padding: 8px 12px;
  background: #fdf6ec;
  border-radius: 4px;
  border-left: 3px solid #e6a23c;
}

.steps-list {
  display: flex;
  flex-direction: column;
}

.test-case-step {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #f0f2f5;
}

.test-case-step:last-child {
  border-bottom: none;
}

.step-index {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.step-index.step-action {
  background: #409eff;
  color: #fff;
}

.step-index.step-assert {
  background: #e6a23c;
  color: #fff;
}

.step-index.step-extract {
  background: #9b59b6;
  color: #fff;
}

.step-index.step-wait {
  background: #909399;
  color: #fff;
}

.step-content {
  flex: 1;
  min-width: 0;
}

.step-type {
  font-size: 11px;
  text-transform: uppercase;
  color: #909399;
  margin-bottom: 4px;
}

.step-action {
  font-size: 14px;
  color: #303133;
  word-break: break-all;
}
</style>
