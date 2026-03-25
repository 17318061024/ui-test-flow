import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { TestFlow, FlowMeta, FlowNode, FlowEdge, NodeConfig } from '@/types/flow'
import * as api from '@/api/flows'
import { v4 as uuidv4 } from 'uuid'

export const useFlowStore = defineStore('flow', () => {
  // 状态
  const flows = ref<FlowMeta[]>([])
  const currentFlow = ref<TestFlow | null>(null)
  const selectedNode = ref<FlowNode | null>(null)
  const selectedEdge = ref<FlowEdge | null>(null)
  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const hasUnsavedChanges = computed(() => !!currentFlow.value)

  // Actions

  // 获取流程列表
  async function fetchFlows() {
    isLoading.value = true
    error.value = null
    try {
      flows.value = await api.getFlowList()
    } catch (e) {
      error.value = e instanceof Error ? e.message : '获取流程列表失败'
      console.error('Failed to fetch flows:', e)
    } finally {
      isLoading.value = false
    }
  }

  // 获取单个流程
  async function fetchFlow(id: string) {
    isLoading.value = true
    error.value = null
    try {
      currentFlow.value = await api.getFlow(id)
      selectedNode.value = null
    } catch (e) {
      error.value = e instanceof Error ? e.message : '获取流程详情失败'
      console.error('Failed to fetch flow:', e)
    } finally {
      isLoading.value = false
    }
  }

  // 创建新流程
  function createNewFlow() {
    const id = uuidv4()
    currentFlow.value = {
      id,
      name: '新流程',
      description: '',
      version: 1,
      tags: [],
      nodes: [
        {
          id: 'start',
          type: 'Start',
          label: '开始'
        },
        {
          id: 'end',
          type: 'End',
          label: '结束'
        }
      ],
      edges: [
        {
          id: uuidv4(),
          source: 'start',
          target: 'end'
        }
      ]
    }
    selectedNode.value = null
  }

  // 保存流程
  async function saveFlow() {
    if (!currentFlow.value) return

    isSaving.value = true
    error.value = null
    try {
      const now = new Date().toISOString()
      currentFlow.value.updatedAt = now

      // 检查流程是否已存在（优先使用 flows 列表，否则通过 API 检查）
      let existing = flows.value.find(f => f.id === currentFlow.value?.id)

      // 如果 flows 列表为空或没找到，尝试通过 API 获取来确认是否存在
      if (!existing && flows.value.length === 0) {
        try {
          const flow = await api.getFlow(currentFlow.value.id)
          existing = { id: flow.id, name: flow.name }
        } catch (e) {
          // 流程不存在
        }
      }

      if (existing) {
        const result = await api.updateFlow(currentFlow.value.id, currentFlow.value)
        currentFlow.value = result
      } else {
        currentFlow.value.createdAt = now
        currentFlow.value = await api.createFlow(currentFlow.value)
      }

      // 刷新列表
      await fetchFlows()
    } catch (e) {
      error.value = e instanceof Error ? e.message : '保存流程失败'
      console.error('Failed to save flow:', e)
    } finally {
      isSaving.value = false
    }
  }

  // 删除流程
  async function deleteFlow(id: string) {
    isLoading.value = true
    error.value = null
    try {
      await api.deleteFlow(id)
      flows.value = flows.value.filter(f => f.id !== id)
      if (currentFlow.value?.id === id) {
        currentFlow.value = null
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : '删除流程失败'
      console.error('Failed to delete flow:', e)
    } finally {
      isLoading.value = false
    }
  }

  // 复制流程
  async function duplicateFlow(id: string) {
    isLoading.value = true
    error.value = null
    try {
      const duplicated = await api.duplicateFlow(id)
      // 添加到列表
      flows.value.unshift({
        id: duplicated.id,
        name: duplicated.name,
        description: duplicated.description,
        version: duplicated.version,
        tags: duplicated.tags,
        author: duplicated.author,
        nodeCount: duplicated.nodes?.length || 0,
        createdAt: duplicated.createdAt,
        updatedAt: duplicated.updatedAt
      })
      ElMessage.success('复制成功')
      return duplicated
    } catch (e) {
      error.value = e instanceof Error ? e.message : '复制流程失败'
      console.error('Failed to duplicate flow:', e)
      ElMessage.error('复制失败')
    } finally {
      isLoading.value = false
    }
    return null
  }

  // 添加节点
  function addNode(type: FlowNode['type'], position?: { x: number; y: number }) {
    if (!currentFlow.value) return

    const id = uuidv4()
    const labelMap: Record<string, string> = {
      Start: '开始',
      End: '结束',
      Action: '执行操作',
      Assert: '断言验证',
      Extract: '数据提取',
      Condition: '条件分支',
      SubFlow: '子流程'
    }

    const newNode: FlowNode = {
      id,
      type,
      label: labelMap[type] || type
    }

    // 设置位置
    if (position) {
      (newNode as any).position = position
    }

    // 添加新节点并重新赋值数组以触发响应式更新
    const newNodes = [...currentFlow.value.nodes, newNode]
    currentFlow.value.nodes = newNodes
    selectedNode.value = newNode
  }

  // 更新节点
  function updateNode(nodeId: string, updates: Partial<FlowNode>) {
    if (!currentFlow.value) return

    const node = currentFlow.value.nodes.find(n => n.id === nodeId)
    if (!node) return

    // 只更新提供的属性，保留原有对象的引用
    Object.assign(node, updates)

    // 更新选中节点
    if (selectedNode.value?.id === nodeId) {
      selectedNode.value = node
    }
  }

  // 删除节点
  function deleteNode(nodeId: string) {
    if (!currentFlow.value) return

    // 不能删除 Start 节点
    const node = currentFlow.value.nodes.find(n => n.id === nodeId)
    if (node?.type === 'Start') return

    // 过滤掉要删除的节点
    const newNodes = currentFlow.value.nodes.filter(n => n.id !== nodeId)
    currentFlow.value.nodes = newNodes

    // 同样过滤边
    const newEdges = currentFlow.value.edges.filter(
      e => e.source !== nodeId && e.target !== nodeId
    )
    currentFlow.value.edges = newEdges

    if (selectedNode.value?.id === nodeId) {
      selectedNode.value = null
    }
  }

  // 添加边
  function addEdge(source: string, target: string, label?: string, sourceHandle?: string) {
    if (!currentFlow.value) return

    // 检查是否已存在相同边
    const exists = currentFlow.value.edges.some(
      e => e.source === source && e.target === target
    )
    if (exists) return

    const edge: FlowEdge = {
      id: uuidv4(),
      source,
      target,
      label,
      sourceHandle  // 保存连接点位置信息
    }

    // 添加边并重新赋值数组以触发响应式更新
    const newEdges = [...currentFlow.value.edges, edge]
    currentFlow.value.edges = newEdges
  }

  // 更新边
  function updateEdge(edgeId: string, updates: Partial<FlowEdge>) {
    if (!currentFlow.value) return

    const edge = currentFlow.value.edges.find(e => e.id === edgeId)
    if (edge) {
      Object.assign(edge, updates)
    }
  }

  // 删除边
  function deleteEdge(edgeId: string) {
    if (!currentFlow.value) return

    currentFlow.value.edges = currentFlow.value.edges.filter(e => e.id !== edgeId)
  }

  // 选择节点
  function selectNode(node: FlowNode | null) {
    selectedNode.value = node
    // 选中节点时取消选择边
    if (node) {
      selectedEdge.value = null
    }
  }

  // 选择边
  function selectEdge(edge: FlowEdge | null) {
    selectedEdge.value = edge
    // 选中边时取消选择节点
    if (edge) {
      selectedNode.value = null
    }
  }

  // 清空当前流程
  function clearCurrentFlow() {
    currentFlow.value = null
    selectedNode.value = null
  }

  // 设置流程名称
  function setFlowName(name: string) {
    if (currentFlow.value) {
      currentFlow.value.name = name
    }
  }

  // 设置流程描述
  function setFlowDescription(description: string) {
    if (currentFlow.value) {
      currentFlow.value.description = description
    }
  }

  // 设置流程标签
  function setFlowTags(tags: string[]) {
    if (currentFlow.value) {
      currentFlow.value.tags = tags
    }
  }

  return {
    // State
    flows,
    currentFlow,
    selectedNode,
    selectedEdge,
    isLoading,
    isSaving,
    error,

    // Getters
    hasUnsavedChanges,

    // Actions
    fetchFlows,
    fetchFlow,
    createNewFlow,
    saveFlow,
    deleteFlow,
    duplicateFlow,
    addNode,
    updateNode,
    deleteNode,
    addEdge,
    updateEdge,
    deleteEdge,
    selectNode,
    selectEdge,
    clearCurrentFlow,
    setFlowName,
    setFlowDescription,
    setFlowTags
  }
})
