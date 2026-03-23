<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import { useFlowStore } from '@/stores/flow'
import type { ActionMethod, AssertType, ConditionOperator, FlowNode, FlowEdge } from '@/types/flow'

const flowStore = useFlowStore()

const selectedNode = computed(() => flowStore.selectedNode)
const selectedEdge = computed(() => flowStore.selectedEdge)

// 本地编辑状态
const localNode = ref<Partial<FlowNode>>({})
const localEdge = ref<Partial<FlowEdge>>({})

// 监听选中节点变化，同步到本地状态
watch(selectedNode, (node) => {
  if (node) {
    // 为不同类型节点初始化配置对象
    const base = { ...node }

    // 点击操作节点
    if (node.type === 'Click' && !base.action) {
      base.action = { method: 'click', target: '', value: '', timeout: 30 }
    }
    if (node.type === 'DoubleClick' && !base.action) {
      base.action = { method: 'doubleClick', target: '', value: '', timeout: 30 }
    }
    if (node.type === 'RightClick' && !base.action) {
      base.action = { method: 'rightClick', target: '', value: '', timeout: 30 }
    }
    if (node.type === 'Hover' && !base.action) {
      base.action = { method: 'hover', target: '', value: '', timeout: 30 }
    }
    // 输入操作节点
    if (node.type === 'Input' && !base.action) {
      base.action = { method: 'input', target: '', value: '', isVariable: false, timeout: 30 }
    }
    if (node.type === 'Select' && !base.action) {
      base.action = { method: 'select', target: '', value: '', selectBy: 'value', timeout: 30 }
    }
    // 页面操作节点
    if (node.type === 'Scroll' && !base.action) {
      base.action = { method: 'scroll', target: '', scrollDirection: 'down', scrollAmount: 300, timeout: 30 }
    }
    if (node.type === 'Screenshot' && !base.action) {
      base.action = { method: 'screenshot', target: '', timeout: 30 }
    }
    if (node.type === 'Refresh' && !base.action) {
      base.action = { method: 'refresh', target: '', timeout: 30 }
    }
    if (node.type === 'SwitchFrame' && !base.action) {
      base.action = { method: 'switchFrame', frameSelector: '', timeout: 30 }
    }
    // 通用操作节点
    if (node.type === 'Action' && !base.action) {
      base.action = { method: 'click', target: '', value: '' }
    }
    // 断言节点
    if (node.type === 'Assert' && !base.assert) {
      base.assert = { type: 'visible', target: '', expected: '' }
    }
    // 提取节点
    if (node.type === 'Extract' && !base.extract) {
      base.extract = { target: '', field: '', as: '' }
    }
    // 条件节点
    if (node.type === 'Condition' && !base.condition) {
      base.condition = { variable: '', operator: '==', value: '' }
    }
    // 子流程节点
    if (node.type === 'SubFlow' && !base.subFlow) {
      base.subFlow = { flowId: '' }
    }
    // 导航节点
    if (node.type === 'Navigate' && !base.navigate) {
      base.navigate = { url: '', isVariable: false, waitUntil: 'load', timeout: 30 }
    }
    // 等待节点
    if (node.type === 'Wait' && !base.wait) {
      base.wait = { waitType: 'time', timeout: 1, waitFor: '' }
    }
    // AI 动作节点
    if (node.type === 'AIAction' && !base.aiAction) {
      base.aiAction = { prompt: '', timeout: 30 }
    }
    // AI 查询节点
    if (node.type === 'AIQuery' && !base.aiQuery) {
      base.aiQuery = { prompt: '', schema: '', as: '' }
    }
    // AI 断言节点
    if (node.type === 'AIAssert' && !base.aiAssert) {
      base.aiAssert = { prompt: '', timeout: 30 }
    }
    localNode.value = base
  } else {
    localNode.value = {}
  }
}, { immediate: true })

// 监听选中边变化
watch(selectedEdge, (edge) => {
  if (edge) {
    localEdge.value = { ...edge }
  } else {
    localEdge.value = {}
  }
}, { immediate: true })

// 保存节点更改
async function saveChanges() {
  if (selectedNode.value && localNode.value.id) {
    flowStore.updateNode(localNode.value.id, localNode.value)
    await flowStore.saveFlow()
    // 保存后从 currentFlow 中重新获取节点数据，更新 localNode
    if (flowStore.currentFlow) {
      const updatedNode = flowStore.currentFlow.nodes.find(n => n.id === localNode.value.id)
      if (updatedNode) {
        localNode.value = { ...updatedNode }
      }
    }
  }
}

// 保存边更改
async function saveEdgeChanges() {
  if (selectedEdge.value && localEdge.value.id) {
    flowStore.updateEdge(localEdge.value.id, {
      label: localEdge.value.label
    })
    await flowStore.saveFlow()
    // 保存后从 currentFlow 中重新获取边数据，更新 localEdge
    if (flowStore.currentFlow) {
      const updatedEdge = flowStore.currentFlow.edges.find(e => e.id === localEdge.value.id)
      if (updatedEdge) {
        localEdge.value = { ...updatedEdge }
      }
    }
  }
}

// 删除节点
async function deleteNode() {
  if (selectedNode.value) {
    flowStore.deleteNode(selectedNode.value.id)
    await flowStore.saveFlow()
  }
}

// 删除边
async function deleteEdge() {
  if (selectedEdge.value) {
    flowStore.deleteEdge(selectedEdge.value.id)
    flowStore.selectEdge(null)
    await flowStore.saveFlow()
  }
}

// 切换等待类型时清空另一个选项
function handleWaitTypeChange(waitType: string) {
  if (waitType === 'time') {
    localNode.value.wait!.waitFor = ''
  } else {
    localNode.value.wait!.timeout = 0
  }
  saveChanges()
}

// 判断是否为条件节点的出边
const isConditionEdge = computed(() => {
  if (!selectedEdge.value || !flowStore.currentFlow) return false
  const sourceNode = flowStore.currentFlow.nodes.find(
    n => n.id === selectedEdge.value?.source
  )
  return sourceNode?.type === 'Condition'
})

// 获取源节点标签
function getSourceNodeLabel() {
  if (!selectedEdge.value || !flowStore.currentFlow) return ''
  const node = flowStore.currentFlow.nodes.find(
    n => n.id === selectedEdge.value?.source
  )
  return node?.label || ''
}

// 获取目标节点标签
function getTargetNodeLabel() {
  if (!selectedEdge.value || !flowStore.currentFlow) return ''
  const node = flowStore.currentFlow.nodes.find(
    n => n.id === selectedEdge.value?.target
  )
  return node?.label || ''
}

// 操作方法选项
const actionMethods: { label: string; value: ActionMethod }[] = [
  { label: '点击 (click)', value: 'click' },
  { label: '双击 (doubleClick)', value: 'doubleClick' },
  { label: '右键 (rightClick)', value: 'rightClick' },
  { label: '输入 (input)', value: 'input' },
  { label: '选择 (select)', value: 'select' },
  { label: '悬停 (hover)', value: 'hover' },
  { label: '滚动 (scroll)', value: 'scroll' },
  { label: '滚动到可见 (scrollIntoView)', value: 'scrollIntoView' },
  { label: '等待 (wait)', value: 'wait' },
  { label: '截图 (screenshot)', value: 'screenshot' },
  { label: '刷新 (refresh)', value: 'refresh' },
  { label: '切换 Frame (switchFrame)', value: 'switchFrame' }
]

// 选择方式选项
const selectByOptions = [
  { label: '按值 (value)', value: 'value' },
  { label: '按文本 (text)', value: 'text' },
  { label: '按索引 (index)', value: 'index' }
]

// 断言类型选项
const assertTypes: { label: string; value: AssertType }[] = [
  { label: '检查文本 (text)', value: 'text' },
  { label: '元素可见 (visible)', value: 'visible' },
  { label: '元素隐藏 (hidden)', value: 'hidden' },
  { label: '元素可用 (enabled)', value: 'enabled' },
  { label: '元素禁用 (disabled)', value: 'disabled' },
  { label: '包含文本 (contains)', value: 'contains' },
  { label: '不包含文本 (notContains)', value: 'notContains' }
]

// 条件操作符选项
const conditionOperators: { label: string; value: ConditionOperator }[] = [
  { label: '等于 (==)', value: '==' },
  { label: '不等于 (!=)', value: '!=' },
  { label: '包含 (contains)', value: 'contains' },
  { label: '为空 (empty)', value: 'empty' },
  { label: '不为空 (notEmpty)', value: 'notEmpty' }
]

// 滚动方向选项
const scrollDirectionOptions = [
  { label: '向下 (down)', value: 'down' },
  { label: '向上 (up)', value: 'up' },
  { label: '向左 (left)', value: 'left' },
  { label: '向右 (right)', value: 'right' }
]

// 导航等待策略选项
const waitUntilOptions = [
  { label: '页面加载完成 (load)', value: 'load' },
  { label: 'DOMContentLoaded', value: 'domcontentloaded' },
  { label: '网络空闲 (networkidle)', value: 'networkidle' }
]

// 判断操作是否需要输入值
const needsInputValue = computed(() => {
  return localNode.value.action?.method === 'input' || localNode.value.action?.method === 'select'
})

// 获取 Select 节点的占位符
function getSelectPlaceholder() {
  const selectBy = localNode.value.action?.selectBy
  if (selectBy === 'value') return 'option 元素的 value 属性值'
  if (selectBy === 'text') return 'option 元素显示的文本'
  if (selectBy === 'index') return '选项的索引号（从 0 开始）'
  return '选择值'
}
</script>

<template>
  <div class="flow-designer-properties">
    <template v-if="selectedNode">
      <div class="property-panel-title">
        {{ selectedNode.type }} - 属性配置
      </div>

      <!-- 基础属性 -->
      <el-form label-width="80px" size="small">
        <el-form-item label="节点名称">
          <el-input v-model="localNode.label" @blur="saveChanges" />
        </el-form-item>

        <el-form-item label="描述">
          <el-input v-model="localNode.description" type="textarea" rows="2" @blur="saveChanges" />
        </el-form-item>
      </el-form>

      <!-- Click 节点配置 -->
      <template v-if="selectedNode.type === 'Click' && localNode.action">
        <div class="property-section-title">点击配置</div>
        <el-form label-width="80px" size="small">
          <el-form-item label="目标元素">
            <el-input v-model="localNode.action.target" placeholder="描述目标元素，如：登录按钮" @blur="saveChanges" />
          </el-form-item>
          <el-form-item label="超时时间">
            <el-input-number v-model="localNode.action.timeout" :min="0" :step="5" @change="saveChanges" />
            <span style="margin-left: 8px; color: #909399;">秒</span>
          </el-form-item>
        </el-form>
      </template>

      <!-- DoubleClick 节点配置 -->
      <template v-if="selectedNode.type === 'DoubleClick' && localNode.action">
        <div class="property-section-title">双击配置</div>
        <el-form label-width="80px" size="small">
          <el-form-item label="目标元素">
            <el-input v-model="localNode.action.target" placeholder="描述目标元素，如：文件列表项" @blur="saveChanges" />
          </el-form-item>
          <el-form-item label="超时时间">
            <el-input-number v-model="localNode.action.timeout" :min="0" :step="5" @change="saveChanges" />
            <span style="margin-left: 8px; color: #909399;">秒</span>
          </el-form-item>
        </el-form>
      </template>

      <!-- RightClick 节点配置 -->
      <template v-if="selectedNode.type === 'RightClick' && localNode.action">
        <div class="property-section-title">右键点击配置</div>
        <el-form label-width="80px" size="small">
          <el-form-item label="目标元素">
            <el-input v-model="localNode.action.target" placeholder="描述目标元素" @blur="saveChanges" />
          </el-form-item>
          <el-form-item label="超时时间">
            <el-input-number v-model="localNode.action.timeout" :min="0" :step="5" @change="saveChanges" />
            <span style="margin-left: 8px; color: #909399;">秒</span>
          </el-form-item>
        </el-form>
      </template>

      <!-- Hover 节点配置 -->
      <template v-if="selectedNode.type === 'Hover' && localNode.action">
        <div class="property-section-title">悬停配置</div>
        <el-form label-width="80px" size="small">
          <el-form-item label="目标元素">
            <el-input v-model="localNode.action.target" placeholder="描述目标元素，如：下拉菜单" @blur="saveChanges" />
          </el-form-item>
          <el-form-item label="超时时间">
            <el-input-number v-model="localNode.action.timeout" :min="0" :step="5" @change="saveChanges" />
            <span style="margin-left: 8px; color: #909399;">秒</span>
          </el-form-item>
        </el-form>
      </template>

      <!-- Input 节点配置 -->
      <template v-if="selectedNode.type === 'Input' && localNode.action">
        <div class="property-section-title">输入配置</div>
        <el-form label-width="80px" size="small">
          <el-form-item label="目标元素">
            <el-input v-model="localNode.action.target" placeholder="描述目标元素，如：用户名输入框" @blur="saveChanges" />
          </el-form-item>
          <el-form-item label="输入值">
            <el-input v-model="localNode.action.value" placeholder="输入的内容" @blur="saveChanges" />
          </el-form-item>
          <el-form-item label="变量输入">
            <el-switch v-model="localNode.action.isVariable" @change="saveChanges" />
            <span style="margin-left: 8px; color: #909399; font-size: 12px;">勾选后输入值将作为变量引用</span>
          </el-form-item>
          <el-form-item label="超时时间">
            <el-input-number v-model="localNode.action.timeout" :min="0" :step="5" @change="saveChanges" />
            <span style="margin-left: 8px; color: #909399;">秒</span>
          </el-form-item>
        </el-form>
      </template>

      <!-- Select 节点配置 -->
      <template v-if="selectedNode.type === 'Select' && localNode.action">
        <div class="property-section-title">选择配置</div>
        <el-form label-width="80px" size="small">
          <el-form-item label="目标元素">
            <el-input v-model="localNode.action.target" placeholder="描述目标元素，如：下拉选择框" @blur="saveChanges" />
          </el-form-item>
          <el-form-item label="选择方式">
            <el-select v-model="localNode.action.selectBy" @change="saveChanges">
              <el-option
                v-for="sb in selectByOptions"
                :key="sb.value"
                :label="sb.label"
                :value="sb.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="选择值">
            <el-input v-model="localNode.action.value" :placeholder="getSelectPlaceholder()" @blur="saveChanges" />
          </el-form-item>
          <el-form-item label="变量输入">
            <el-switch v-model="localNode.action.isVariable" @change="saveChanges" />
            <span style="margin-left: 8px; color: #909399; font-size: 12px;">勾选后选择值将作为变量引用</span>
          </el-form-item>
          <el-form-item label="超时时间">
            <el-input-number v-model="localNode.action.timeout" :min="0" :step="5" @change="saveChanges" />
            <span style="margin-left: 8px; color: #909399;">秒</span>
          </el-form-item>
        </el-form>
      </template>

      <!-- Action 节点配置 -->
      <template v-if="selectedNode.type === 'Action' && localNode.action">
        <div class="property-section-title">操作配置</div>
        <el-form label-width="80px" size="small">
          <el-form-item label="操作方法">
            <el-select v-model="localNode.action.method" @change="saveChanges">
              <el-option
                v-for="method in actionMethods"
                :key="method.value"
                :label="method.label"
                :value="method.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="目标元素">
            <el-input v-model="localNode.action.target" placeholder="描述目标元素" @blur="saveChanges" />
          </el-form-item>
          <el-form-item label="输入值" v-if="needsInputValue">
            <el-input v-model="localNode.action.value" placeholder="输入的值" @blur="saveChanges" />
          </el-form-item>
          <el-form-item label="超时时间">
            <el-input-number v-model="localNode.action.timeout" :min="0" :step="1" @change="saveChanges" />
            <span style="margin-left: 8px; color: #909399;">秒</span>
          </el-form-item>
        </el-form>
      </template>

      <!-- Scroll 节点配置 -->
      <template v-if="selectedNode.type === 'Scroll' && localNode.action">
        <div class="property-section-title">滚动配置</div>
        <el-form label-width="80px" size="small">
          <el-form-item label="目标元素">
            <el-input v-model="localNode.action.target" placeholder="留空则滚动整个页面，否则滚动到指定元素" @blur="saveChanges" />
          </el-form-item>
          <el-form-item label="滚动方向">
            <el-select v-model="localNode.action.scrollDirection" @change="saveChanges">
              <el-option
                v-for="sd in scrollDirectionOptions"
                :key="sd.value"
                :label="sd.label"
                :value="sd.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="滚动距离">
            <el-input-number v-model="localNode.action.scrollAmount" :min="0" :step="100" @change="saveChanges" />
            <span style="margin-left: 8px; color: #909399;">像素</span>
          </el-form-item>
          <el-form-item label="超时时间">
            <el-input-number v-model="localNode.action.timeout" :min="0" :step="5" @change="saveChanges" />
            <span style="margin-left: 8px; color: #909399;">秒</span>
          </el-form-item>
        </el-form>
      </template>

      <!-- Screenshot 节点配置 -->
      <template v-if="selectedNode.type === 'Screenshot' && localNode.action">
        <div class="property-section-title">截图配置</div>
        <el-form label-width="80px" size="small">
          <el-form-item label="目标元素">
            <el-input v-model="localNode.action.target" placeholder="留空则截取整个页面，否则截取指定元素" @blur="saveChanges" />
          </el-form-item>
          <el-form-item label="超时时间">
            <el-input-number v-model="localNode.action.timeout" :min="0" :step="5" @change="saveChanges" />
            <span style="margin-left: 8px; color: #909399;">秒</span>
          </el-form-item>
        </el-form>
      </template>

      <!-- Refresh 节点配置 -->
      <template v-if="selectedNode.type === 'Refresh' && localNode.action">
        <div class="property-section-title">刷新配置</div>
        <el-form label-width="80px" size="small">
          <el-form-item label="超时时间">
            <el-input-number v-model="localNode.action.timeout" :min="0" :step="5" @change="saveChanges" />
            <span style="margin-left: 8px; color: #909399;">秒</span>
          </el-form-item>
        </el-form>
      </template>

      <!-- SwitchFrame 节点配置 -->
      <template v-if="selectedNode.type === 'SwitchFrame' && localNode.action">
        <div class="property-section-title">切换 Frame 配置</div>
        <el-form label-width="80px" size="small">
          <el-form-item label="Frame 选择器">
            <el-input v-model="localNode.action.frameSelector" placeholder="iframe 的 id、name 或索引，如：#frame1、0" @blur="saveChanges" />
          </el-form-item>
          <el-form-item label="说明">
            <div style="color: #909399; font-size: 12px;">
              支持以下格式：<br>
              • #frameId - 通过 id 选择<br>
              • frameName - 通过 name 选择<br>
              • 0 - 通过索引选择（从 0 开始）<br>
              • parent - 返回父 Frame<br>
              • top - 返回顶层 Frame
            </div>
          </el-form-item>
          <el-form-item label="超时时间">
            <el-input-number v-model="localNode.action.timeout" :min="0" :step="5" @change="saveChanges" />
            <span style="margin-left: 8px; color: #909399;">秒</span>
          </el-form-item>
        </el-form>
      </template>

      <!-- Assert 节点配置 -->
      <template v-if="selectedNode.type === 'Assert' && localNode.assert">
        <div class="property-section-title">断言配置</div>
        <el-form label-width="80px" size="small">
          <el-form-item label="断言类型">
            <el-select v-model="localNode.assert.type" @change="saveChanges">
              <el-option
                v-for="t in assertTypes"
                :key="t.value"
                :label="t.label"
                :value="t.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="目标元素">
            <el-input v-model="localNode.assert.target" placeholder="描述目标元素" @blur="saveChanges" />
          </el-form-item>
          <el-form-item label="期望值">
            <el-input v-model="localNode.assert.expected" placeholder="期望的值" @blur="saveChanges" />
          </el-form-item>
        </el-form>
      </template>

      <!-- Extract 节点配置 -->
      <template v-if="selectedNode.type === 'Extract' && localNode.extract">
        <div class="property-section-title">提取配置</div>
        <el-form label-width="80px" size="small">
          <el-form-item label="目标元素">
            <el-input v-model="localNode.extract.target" placeholder="描述目标元素" @blur="saveChanges" />
          </el-form-item>
          <el-form-item label="提取字段">
            <el-input v-model="localNode.extract.field" placeholder="提取的字段名" @blur="saveChanges" />
          </el-form-item>
          <el-form-item label="变量名">
            <el-input v-model="localNode.extract.as" placeholder="保存为变量名" @blur="saveChanges" />
          </el-form-item>
        </el-form>
      </template>

      <!-- Condition 节点配置 -->
      <template v-if="selectedNode.type === 'Condition' && localNode.condition">
        <div class="property-section-title">条件配置</div>
        <el-form label-width="80px" size="small">
          <el-form-item label="变量名">
            <el-input v-model="localNode.condition.variable" placeholder="判断的变量名" @blur="saveChanges" />
          </el-form-item>
          <el-form-item label="操作符">
            <el-select v-model="localNode.condition.operator" @change="saveChanges">
              <el-option
                v-for="op in conditionOperators"
                :key="op.value"
                :label="op.label"
                :value="op.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="比较值">
            <el-input v-model="localNode.condition.value" placeholder="比较的值" @blur="saveChanges" />
          </el-form-item>
        </el-form>
      </template>

      <!-- SubFlow 节点配置 -->
      <template v-if="selectedNode.type === 'SubFlow' && localNode.subFlow">
        <div class="property-section-title">子流程配置</div>
        <el-form label-width="80px" size="small">
          <el-form-item label="流程ID">
            <el-input v-model="localNode.subFlow.flowId" placeholder="引用的流程ID" @blur="saveChanges" />
          </el-form-item>
        </el-form>
      </template>

      <!-- Navigate 节点配置 -->
      <template v-if="selectedNode.type === 'Navigate' && localNode.navigate">
        <div class="property-section-title">导航配置</div>
        <el-form label-width="80px" size="small">
          <el-form-item label="目标URL">
            <el-input v-model="localNode.navigate.url" placeholder="https://example.com" @blur="saveChanges" />
          </el-form-item>
          <el-form-item label="变量URL">
            <el-switch v-model="localNode.navigate.isVariable" @change="saveChanges" />
            <span style="margin-left: 8px; color: #909399; font-size: 12px;">勾选后 URL 将作为变量引用</span>
          </el-form-item>
          <el-form-item label="等待策略">
            <el-select v-model="localNode.navigate.waitUntil" @change="saveChanges">
              <el-option
                v-for="wu in waitUntilOptions"
                :key="wu.value"
                :label="wu.label"
                :value="wu.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="超时时间">
            <el-input-number v-model="localNode.navigate.timeout" :min="0" :step="10" @change="saveChanges" />
            <span style="margin-left: 8px; color: #909399;">秒</span>
          </el-form-item>
        </el-form>
      </template>

      <!-- Wait 节点配置 -->
      <template v-if="selectedNode.type === 'Wait' && localNode.wait">
        <div class="property-section-title">等待配置</div>
        <el-form label-width="80px" size="small">
          <el-form-item label="等待方式">
            <el-radio-group v-model="localNode.wait.waitType" @change="handleWaitTypeChange">
              <el-radio label="time">等待时间</el-radio>
              <el-radio label="element">等待元素</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="等待时间" v-if="localNode.wait.waitType === 'time' || !localNode.wait.waitType">
            <el-input-number v-model="localNode.wait.timeout" :min="0" :step="1" @change="saveChanges" />
            <span style="margin-left: 8px; color: #909399;">秒</span>
          </el-form-item>
          <el-form-item label="等待元素" v-if="localNode.wait.waitType === 'element'">
            <el-input v-model="localNode.wait.waitFor" placeholder="等待元素出现，如：加载完成按钮" @blur="saveChanges" />
          </el-form-item>
          <el-form-item label="元素超时" v-if="localNode.wait.waitType === 'element'">
            <el-input-number v-model="localNode.wait.timeout" :min="1" :step="5" @change="saveChanges" />
            <span style="margin-left: 8px; color: #909399;">秒</span>
          </el-form-item>
        </el-form>
      </template>

      <!-- AIAction 节点配置 -->
      <template v-if="selectedNode.type === 'AIAction' && localNode.aiAction">
        <div class="property-section-title">AI 动作配置 (Midscene.js)</div>
        <el-form label-width="80px" size="small">
          <el-form-item label="AI 指令">
            <el-input v-model="localNode.aiAction.prompt" type="textarea" rows="3" placeholder="用自然语言描述要执行的操作，如：点击登录按钮" @blur="saveChanges" />
          </el-form-item>
          <el-form-item label="超时时间">
            <el-input-number v-model="localNode.aiAction.timeout" :min="5" :step="5" @change="saveChanges" />
            <span style="margin-left: 8px; color: #909399;">秒</span>
          </el-form-item>
        </el-form>
      </template>

      <!-- AIQuery 节点配置 -->
      <template v-if="selectedNode.type === 'AIQuery' && localNode.aiQuery">
        <div class="property-section-title">AI 查询配置 (Midscene.js)</div>
        <el-form label-width="80px" size="small">
          <el-form-item label="查询指令">
            <el-input v-model="localNode.aiQuery.prompt" type="textarea" rows="3" placeholder="用自然语言描述要查询的内容，如：获取当前页面的用户名" @blur="saveChanges" />
          </el-form-item>
          <el-form-item label="返回格式">
            <el-select v-model="localNode.aiQuery.schema" placeholder="选择返回格式" @change="saveChanges" clearable>
              <el-option label="字符串 (string)" value="string" />
              <el-option label="数字 (number)" value="number" />
              <el-option label="布尔值 (boolean)" value="boolean" />
              <el-option label="对象 (object)" value="object" />
              <el-option label="数组 (array)" value="array" />
              <el-option label="自定义 JSON" value="custom" />
            </el-select>
          </el-form-item>
          <el-form-item label="变量名">
            <el-input v-model="localNode.aiQuery.as" placeholder="保存查询结果为变量名" @blur="saveChanges" />
          </el-form-item>
        </el-form>
      </template>

      <!-- AIAssert 节点配置 -->
      <template v-if="selectedNode.type === 'AIAssert' && localNode.aiAssert">
        <div class="property-section-title">AI 断言配置 (Midscene.js)</div>
        <el-form label-width="80px" size="small">
          <el-form-item label="断言内容">
            <el-input v-model="localNode.aiAssert.prompt" type="textarea" rows="3" placeholder="用自然语言描述要验证的内容，如：页面显示登录成功" @blur="saveChanges" />
          </el-form-item>
          <el-form-item label="超时时间">
            <el-input-number v-model="localNode.aiAssert.timeout" :min="5" :step="5" @change="saveChanges" />
            <span style="margin-left: 8px; color: #909399;">秒</span>
          </el-form-item>
        </el-form>
      </template>

      <!-- 删除按钮 -->
      <div class="property-actions" v-if="selectedNode.type !== 'Start'">
        <el-button type="danger" size="small" @click="deleteNode">删除节点</el-button>
      </div>
    </template>

    <!-- 边编辑面板 -->
    <template v-else-if="selectedEdge">
      <div class="property-panel-title">
        边 - 属性配置
      </div>

      <el-form label-width="80px" size="small" v-if="isConditionEdge">
        <el-form-item label="分支标签">
          <el-input v-model="localEdge.label" placeholder="如: 是、否" @blur="saveEdgeChanges" />
        </el-form-item>
      </el-form>

      <div v-else class="edge-info">
        <p>从 <strong>{{ getSourceNodeLabel() }}</strong> 到 <strong>{{ getTargetNodeLabel() }}</strong></p>
      </div>

      <div class="property-actions">
        <el-button type="danger" size="small" @click="deleteEdge">删除边</el-button>
      </div>
    </template>

    <!-- 空状态 -->
    <template v-else>
      <div class="empty-state">
        <div class="empty-state-icon">👆</div>
        <div class="empty-state-text">点击节点/边查看属性</div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.property-section-title {
  font-size: 13px;
  font-weight: 600;
  color: #606266;
  margin: 16px 0 12px;
  padding-top: 12px;
  border-top: 1px solid #e4e7ed;
}

.property-actions {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e4e7ed;
  text-align: center;
}

.edge-info {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 13px;
  color: #606266;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #909399;
}

.empty-state-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state-text {
  font-size: 14px;
}
</style>
