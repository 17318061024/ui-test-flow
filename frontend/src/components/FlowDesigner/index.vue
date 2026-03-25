<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, toRaw } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { VueFlow, useVueFlow, Position, MarkerType } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import { useFlowStore } from '@/stores/flow'
import { nodeTypes } from './CustomNodes'
import NodePalette from './NodePalette.vue'
import PropertyPanel from './PropertyPanel.vue'
import type { FlowNode, FlowEdge, NodeType } from '@/types/flow'
import type { Node, Edge } from '@vue-flow/core'

const route = useRoute()
const router = useRouter()
const flowStore = useFlowStore()

const vueFlowRef = ref<any>(null)
const { onConnect, onNodeDragStop } = useVueFlow()

// 处理拖拽放置
function onDragOver(event: DragEvent) {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

function onDrop(event: DragEvent) {
  const nodeType = event.dataTransfer?.getData('application/vueflow') as NodeType
  if (!nodeType) return

  // 获取拖拽时的偏移（鼠标点击位置相对于节点元素的偏移）
  const offsetX = parseFloat(event.dataTransfer?.getData('offsetX') || '0')
  const offsetY = parseFloat(event.dataTransfer?.getData('offsetY') || '0')

  // 计算相对于画布的位置
  let position = { x: 0, y: 0 }

  // 获取画布区域
  const canvas = event.currentTarget as HTMLElement
  const rect = canvas.getBoundingClientRect()

  // 尝试使用 Vue Flow 的 screenToFlowPosition
  const transformFn = vueFlowRef.value?.screenToFlowPosition
  if (transformFn) {
    position = transformFn({
      x: event.clientX - offsetX,
      y: event.clientY - offsetY
    })
  } else {
    // 简单的相对位置计算（适用于初次加载时）
    // 获取左侧面板宽度
    const palette = document.querySelector('.flow-designer-palette') as HTMLElement
    const paletteWidth = palette?.offsetWidth || 200
    position = {
      x: event.clientX - rect.left - offsetX - paletteWidth,
      y: event.clientY - rect.top - offsetY
    }
  }

  // 添加新节点
  flowStore.addNode(nodeType, position)
}

// 将 store 中的数据转换为 Vue Flow 格式
const vueFlowNodes = computed<Node[]>(() => {
  if (!flowStore.currentFlow) return []

  return flowStore.currentFlow.nodes.map((node, index) => {
    // 提取节点配置到顶层，方便组件使用
    const data: Record<string, any> = {
      label: node.label,
      ...node
    }

    // Action 节点：将 action 配置展开到顶层
    if (node.type === 'Action' && node.action) {
      data.method = node.action.method
      data.target = node.action.target
      data.value = node.action.value
    }

    // Assert 节点：将 assert 配置展开到顶层
    if (node.type === 'Assert' && node.assert) {
      data.type = node.assert.type
      data.target = node.assert.target
      data.expected = node.assert.expected
    }

    // Extract 节点
    if (node.type === 'Extract' && node.extract) {
      data.target = node.extract.target
      data.field = node.extract.field
      data.as = node.extract.as
    }

    // Condition 节点
    if (node.type === 'Condition' && node.condition) {
      data.variable = node.condition.variable
      data.operator = node.condition.operator
      data.value = node.condition.value
    }

    // SubFlow 节点
    if (node.type === 'SubFlow' && node.subFlow) {
      data.flowId = node.subFlow.flowId
      data.mapping = node.subFlow.mapping
    }

    return {
      id: node.id,
      type: node.type,
      position: (node as any).position || { x: 100 + (index % 3) * 220, y: 100 + Math.floor(index / 3) * 150 },
      data,
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top
    }
  })
})

const vueFlowEdges = computed<Edge[]>(() => {
  if (!flowStore.currentFlow) return []

  return flowStore.currentFlow.edges
    .filter(edge => edge.source && edge.target) // 过滤无效边
    .map(edge => ({
      id: edge.id || `edge-${edge.source}-${edge.target}-${Date.now()}`,
      source: edge.source!,
      target: edge.target!,
      label: edge.label,
      type: 'smoothstep',
      animated: true,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#606266'
      },
      style: { stroke: '#606266', strokeWidth: 2 },
      class: 'clickable-edge'
    }))
})

// 监听连接事件
onConnect((params) => {
  if (flowStore.currentFlow) {
    flowStore.addEdge(params.source, params.target)
  }
})

// 处理节点点击
function onNodeClick(event: any) {
  const nodeId = event.node.id
  const node = flowStore.currentFlow?.nodes.find(n => n.id === nodeId)
  if (node) {
    flowStore.selectNode(node)
  }
}

// 处理画布点击（取消选择）
function onPaneClick() {
  flowStore.selectNode(null)
  flowStore.selectEdge(null)
}

// 处理边点击（选择边）
function onEdgeClick(event: any) {
  const edge = event.edge
  const edgeId = edge.id

  // 查找对应的边数据
  const flowEdge = flowStore.currentFlow?.edges.find(e => e.id === edgeId)
  if (flowEdge) {
    flowStore.selectEdge(flowEdge)
  }
}

// 处理边双击（删除边）
async function onEdgeDoubleClick(event: any) {
  const edgeId = event.edge.id
  if (edgeId) {
    flowStore.deleteEdge(edgeId)
    await flowStore.saveFlow()
  }
}

// 处理节点拖拽结束
onNodeDragStop(({ node }) => {
  // 检查节点是否存在于 store 中
  if (flowStore.currentFlow) {
    const exists = flowStore.currentFlow.nodes.some(n => n.id === node.id)
    if (exists) {
      // 使用 updateNode 保存位置
      flowStore.updateNode(node.id, { position: node.position } as any)
    }
  }
})

// 监听路由参数变化，加载流程
watch(
  () => route.params.id,
  async (id) => {
    if (id) {
      await flowStore.fetchFlow(id as string)
    } else {
      flowStore.createNewFlow()
    }
  },
  { immediate: true }
)

// 保存流程
async function handleSave() {
  await flowStore.saveFlow()
  router.push('/')
}

// 生成用例
function handleGenerate() {
  if (flowStore.currentFlow) {
    flowStore.saveFlow()
    router.push(`/test-cases?flowId=${flowStore.currentFlow.id}`)
  }
}

// 返回列表
function handleBack() {
  router.push('/')
}

// 处理键盘删除
async function handleKeyDown(event: KeyboardEvent) {
  // 只处理 Delete 或 Backspace 键
  if (event.key === 'Delete' || event.key === 'Backspace') {
    // 如果焦点在输入框中，不处理
    const target = event.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return
    }

    // 删除选中的边
    if (flowStore.selectedEdge) {
      flowStore.deleteEdge(flowStore.selectedEdge.id)
      await flowStore.saveFlow()
      return
    }

    // 删除选中的节点（不能删除 Start 节点）
    if (flowStore.selectedNode) {
      flowStore.deleteNode(flowStore.selectedNode.id)
      await flowStore.saveFlow()
    }
  }
}

// 加载时初始化
onMounted(() => {
  if (!route.params.id) {
    flowStore.createNewFlow()
  }
  // 添加键盘事件监听
  window.addEventListener('keydown', handleKeyDown)
})

// 卸载时清理
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div class="flow-designer">
    <!-- 工具栏 -->
    <div class="flow-designer-toolbar">
      <el-button @click="handleBack" :icon="'ArrowLeft'">返回</el-button>
      <el-input
        v-if="flowStore.currentFlow"
        v-model="flowStore.currentFlow.name"
        placeholder="流程名称"
        style="width: 200px"
      />
      <el-button type="primary" @click="handleSave" :loading="flowStore.isSaving">
        保存
      </el-button>
      <el-button type="success" @click="handleGenerate">
        生成用例
      </el-button>
    </div>

    <!-- 主内容区 -->
    <div class="flow-designer-main">
      <!-- 左侧节点面板 -->
      <NodePalette />

      <!-- 中间画布 -->
      <div
        class="flow-designer-canvas"
        @dragover.prevent="onDragOver"
        @drop.prevent="onDrop"
      >
        <VueFlow
          v-if="flowStore.currentFlow"
          ref="vueFlowRef"
          :nodes="vueFlowNodes"
          :edges="vueFlowEdges"
          :node-types="nodeTypes"
          :default-viewport="{ zoom: 1 }"
          :min-zoom="0.1"
          :max-zoom="2"
          fit-view-on-init
          @node-click="onNodeClick"
          @pane-click="onPaneClick"
          @edge-click="onEdgeClick"
          @edge-dblclick="onEdgeDoubleClick"
        >
          <Background pattern-color="#aaa" :gap="16" />
          <Controls />
          <MiniMap />
        </VueFlow>
        <div v-else class="empty-state">
          <div class="empty-state-icon">📋</div>
          <div class="empty-state-text">加载中...</div>
        </div>
      </div>

      <!-- 右侧属性面板 -->
      <PropertyPanel />
    </div>
  </div>
</template>

<style>
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';
@import '@vue-flow/controls/dist/style.css';
@import '@vue-flow/minimap/dist/style.css';

.clickable-edge {
  cursor: pointer;
}

.clickable-edge:hover {
  stroke: #409eff !important;
  stroke-width: 3px !important;
}

.vue-flow__edge-path {
  stroke-width: 2;
}
</style>
