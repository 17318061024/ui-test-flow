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
      base.subFlow = { flowId: '', mapping: {} }
    }
    // 导航节点
    if (node.type === 'Navigate' && !base.navigate) {
      base.navigate = { url: '', isVariable: false, waitUntil: 'load', timeout: 30 }
    }
    // 等待节点
    if (node.type === 'Wait' && !base.wait) {
      base.wait = { waitType: 'time', timeout: 1, waitFor: '' }
    }
    // 日志节点
    if (node.type === 'Log' && !base.log) {
      base.log = { level: 'log', message: '', variables: [] }
    }
    // 循环节点
    if (node.type === 'Loop' && !base.loop) {
      base.loop = { loopType: 'times', times: 1 }
    }
    // 变量节点
    if (node.type === 'Variable' && !base.variable) {
      base.variable = { operation: 'set', name: '', value: '' }
    }
    // 脚本节点
    if (node.type === 'Script' && !base.script) {
      base.script = { script: '', as: '' }
    }
    // 截图节点
    if (node.type === 'Screenshot' && !base.screenshot) {
      base.screenshot = { type: 'viewport' }
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

// 判断操作是否需要目标元素
const needsTarget = computed(() => {
  const method = localNode.value.action?.method
  return method && !['wait', 'screenshot', 'refresh'].includes(method)
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
            <el-form-item label="目标元素" v-if="needsTarget">
              <el-input v-model="localNode.action.target" placeholder="描述目标元素" @blur="saveChanges" />
            </el-form-item>
            <el-form-item label="输入值" v-if="needsInputValue">
              <el-input v-model="localNode.action.value" placeholder="输入的值" @blur="saveChanges" />
            </el-form-item>
            <el-form-item label="变量输入" v-if="needsInputValue">
              <el-switch v-model="localNode.action.isVariable" @change="saveChanges" />
              <span style="margin-left: 8px; color: #909399; font-size: 12px;">勾选后输入值将作为变量引用</span>
            </el-form-item>
            <el-form-item label="Frame" v-if="localNode.action.method === 'switchFrame'">
              <el-input v-model="localNode.action.frameSelector" placeholder="iframe 的 id、name 或索引" @blur="saveChanges" />
            </el-form-item>
            <el-form-item label="滚动方向" v-if="localNode.action.method === 'scroll'">
              <el-select v-model="localNode.action.scrollDirection" @change="saveChanges">
                <el-option
                  v-for="sd in scrollDirectionOptions"
                  :key="sd.value"
                  :label="sd.label"
                  :value="sd.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="滚动距离" v-if="localNode.action.method === 'scroll'">
              <el-input-number v-model="localNode.action.scrollAmount" :min="0" :step="100" @change="saveChanges" />
              <span style="margin-left: 8px; color: #909399;">像素</span>
            </el-form-item>
            <el-form-item label="超时时间">
              <el-input-number v-model="localNode.action.timeout" :min="0" :step="1" @change="saveChanges" />
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
            <el-form-item label="变量引用">
              <el-switch v-model="localNode.assert.isVariable" @change="saveChanges" />
              <span style="margin-left: 8px; color: #909399; font-size: 12px;">勾选后期望值将作为变量引用</span>
            </el-form-item>
            <el-form-item label="超时时间">
              <el-input-number v-model="localNode.assert.timeout" :min="0" :step="5" @change="saveChanges" />
              <span style="margin-left: 8px; color: #909399;">秒</span>
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

      <!-- Log 节点配置 -->
      <template v-if="selectedNode.type === 'Log' && localNode.log">
        <div class="property-section-title">日志配置</div>

        <el-form label-width="80px" size="small">
          <el-form-item label="日志级别">
            <el-select v-model="localNode.log.level" @change="saveChanges">
              <el-option label="普通 (log)", value="log" />
              <el-option label="信息 (info)", value="info" />
              <el-option label="警告 (warn)", value="warn" />
              <el-option label="错误 (error)", value="error" />
            </el-select>
          </el-form-item>
          <el-form-item label="日志消息">
            <el-input v-model="localNode.log.message" placeholder="日志内容" @blur="saveChanges" />
          </el-form-item>
          <el-form-item label="输出变量">
            <el-input v-model="localNode.log.variables" placeholder="变量名，多个用逗号分隔" @blur="saveChanges" />
          </el-form-item>
          <el-form-item label="日志模板">
            <el-input v-model="localNode.log.template" placeholder="支持 {{变量名}} 插值" @blur="saveChanges" />
          </el-form-item>
          <el-form-item label="时间戳">
            <el-switch v-model="localNode.log.enableTimestamp" @change="saveChanges" />
          </el-form-item>
          <el-form-item label="附带截图">
            <el-switch v-model="localNode.log.enableScreenshot" @change="saveChanges" />
          </el-form-item>
        </el-form>
      </template>

      <!-- Loop 节点配置 -->
      <template v-if="selectedNode.type === 'Loop' && localNode.loop">
        <div class="property-section-title">循环配置</div>

        <el-form label-width="80px" size="small">
          <el-form-item label="循环类型">
            <el-select v-model="localNode.loop.loopType" @change="saveChanges">
              <el-option label="次数循环 (times)", value="times" />
              <el-option label="条件循环 (while)", value="while" />
              <el-option label="遍历列表 (forEach)", value="forEach" />
              <el-option label="选择器循环 (selector)", value="selector" />
            </el-select>
          </el-form-item>
          <el-form-item label="循环次数" v-if="localNode.loop.loopType === 'times'">
            <el-input-number v-model="localNode.loop.times" :min="1" :step="1" @change="saveChanges" />
          </el-form-item>
          <el-form-item label="循环变量" v-if="localNode.loop.loopType === 'forEach'">
            <el-input v-model="localNode.loop.variable" placeholder="循环变量名" @blur="saveChanges" />
          </el-form-item>
          <el-form-item label="项列表" v-if="localNode.loop.loopType === 'forEach'">
            <el-input v-model="localNode.loop.items" placeholder="项列表，多个用逗号分隔" @blur="saveChanges" />
          </el-form-item>
          <el-form-item label="选择器" v-if="localNode.loop.loopType === 'selector'">
            <el-input v-model="localNode.loop.selector" placeholder="CSS 选择器" @blur="saveChanges" />
          </el-form-item>
          <el-form-item label="最大迭代">
            <el-input-number v-model="localNode.loop.maxIterations" :min="1" :step="10" @change="saveChanges" />
          </el-form-item>
          <el-form-item label="迭代延迟">
            <el-input-number v-model="localNode.loop.iterationDelay" :min="0" :step="100" @change="saveChanges" />
            <span style="margin-left: 8px; color: #909399;">毫秒</span>
          </el-form-item>
          <el-form-item label="失败继续">
            <el-switch v-model="localNode.loop.continueOnError" @change="saveChanges" />
          </el-form-item>
        </el-form>
      </template>

      <!-- Variable 节点配置 -->
      <template v-if="selectedNode.type === 'Variable' && localNode.variable">
        <div class="property-section-title">变量配置</div>

        <el-form label-width="80px" size="small">
          <el-form-item label="操作类型">
            <el-select v-model="localNode.variable.operation" @change="saveChanges">
              <el-option label="设置 (set)", value="set" />
              <el-option label="更新 (update)", value="update" />
              <el-option label="删除 (delete)", value="delete" />
              <el-option label="清空 (clear)", value="clear" />
            </el-select>
          </el-form-item>
          <el-form-item label="变量名">
            <el-input v-model="localNode.variable.name" placeholder="变量名称" @blur="saveChanges" />
          </el-form-item>
          <el-form-item label="变量值">
            <el-input v-model="localNode.variable.value" placeholder="变量值" @blur="saveChanges" />
          </el-form-item>
          <el-form-item label="表达式">
            <el-switch v-model="localNode.variable.isExpression" @change="saveChanges" />
            <span style="margin-left: 8px; color: #909399; font-size: 12px;">勾选后值作为表达式计算</span>
          </el-form-item>
          <el-form-item label="运算操作符" v-if="localNode.variable.operation === 'update'">
            <el-select v-model="localNode.variable.operator" @change="saveChanges">
              <el-option label="赋值 (=)", value="=" />
              <el-option label="加 (+)", value="+" />
              <el-option label="减 (-)", value="-" />
              <el-option label="乘 (*)", value="*" />
              <el-option label="除 (/)", value="/" />
            </el-select>
          </el-form-item>
          <el-form-item label="默认值">
            <el-input v-model="localNode.variable.defaultValue" placeholder="变量不存在时的默认值" @blur="saveChanges" />
          </el-form-item>
        </el-form>
      </template>

      <!-- Script 节点配置 -->
      <template v-if="selectedNode.type === 'Script' && localNode.script">
        <div class="property-section-title">脚本配置</div>

        <el-form label-width="80px" size="small">
          <el-form-item label="脚本代码">
            <el-input v-model="localNode.script.script" type="textarea" :rows="4" placeholder="JavaScript 代码" @blur="saveChanges" />
          </el-form-item>
          <el-form-item label="异步执行">
            <el-switch v-model="localNode.script.async" @change="saveChanges" />
          </el-form-item>
          <el-form-item label="输入参数">
            <el-input v-model="localNode.script.params" placeholder="JSON 格式参数" @blur="saveChanges" />
          </el-form-item>
          <el-form-item label="结果变量">
            <el-input v-model="localNode.script.as" placeholder="保存结果为变量名" @blur="saveChanges" />
          </el-form-item>
          <el-form-item label="抛出错误">
            <el-switch v-model="localNode.script.throwError" @change="saveChanges" />
          </el-form-item>
        </el-form>
      </template>

      <!-- Screenshot 节点配置 -->
      <template v-if="selectedNode.type === 'Screenshot' && localNode.screenshot">
        <div class="property-section-title">截图配置</div>

        <el-form label-width="80px" size="small">
          <el-form-item label="截图类型">
            <el-select v-model="localNode.screenshot.type" @change="saveChanges">
              <el-option label="视口截图 (viewport)", value="viewport" />
              <el-option label="整页截图 (fullPage)", value="fullPage" />
              <el-option label="元素截图 (element)", value="element" />
            </el-select>
          </el-form-item>
          <el-form-item label="目标元素" v-if="localNode.screenshot.type === 'element'">
            <el-input v-model="localNode.screenshot.target" placeholder="描述目标元素" @blur="saveChanges" />
          </el-form-item>
          <el-form-item label="保存路径">
            <el-input v-model="localNode.screenshot.path" placeholder="保存目录路径" @blur="saveChanges" />
          </el-form-item>
          <el-form-item label="文件名">
            <el-input v-model="localNode.screenshot.filename" placeholder="文件名，支持变量" @blur="saveChanges" />
          </el-form-item>
          <el-form-item label="透明背景">
            <el-switch v-model="localNode.screenshot.omitBackground" @change="saveChanges" />
          </el-form-item>
          <el-form-item label="编码方式">
            <el-select v-model="localNode.screenshot.encoding" @change="saveChanges">
              <el-option label="二进制 (binary)", value="binary" />
              <el-option label="Base64 (base64)", value="base64" />
            </el-select>
          </el-form-item>
          <el-form-item label="保存变量">
            <el-input v-model="localNode.screenshot.as" placeholder="保存为 base64 变量" @blur="saveChanges" />
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
.mode-switch {
  margin: 12px 0;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
}

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
