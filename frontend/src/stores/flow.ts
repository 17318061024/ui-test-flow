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

      // 如果 flows 列表为空，尝试通过 API 获取来确认是否存在
      if (!existing && flows.value.length === 0) {
        try {
          const flow = await api.getFlow(currentFlow.value.id)
          existing = { id: flow.id, name: flow.name }
        } catch (e) {
          // 流程不存在
        }
      }

      console.log('saveFlow - existing:', existing?.id, 'currentFlow.id:', currentFlow.value.id)
      console.log('saveFlow - currentFlow:', JSON.stringify(currentFlow.value))
      if (existing) {
        const result = await api.updateFlow(currentFlow.value.id, currentFlow.value)
        console.log('updateFlow result:', result)
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

    currentFlow.value.nodes.push(newNode)
    selectedNode.value = newNode
  }

  // 更新节点
  function updateNode(nodeId: string, updates: Partial<FlowNode>) {
    if (!currentFlow.value) return

    const index = currentFlow.value.nodes.findIndex(n => n.id === nodeId)
    if (index !== -1) {
      currentFlow.value.nodes[index] = {
        ...currentFlow.value.nodes[index],
        ...updates
      }

      // 更新选中节点
      if (selectedNode.value?.id === nodeId) {
        selectedNode.value = currentFlow.value.nodes[index]
      }
    }
  }

  // 删除节点
  function deleteNode(nodeId: string) {
    if (!currentFlow.value) return

    // 不能删除 Start 和 End 节点
    const node = currentFlow.value.nodes.find(n => n.id === nodeId)
    if (node?.type === 'Start' || node?.type === 'End') return

    currentFlow.value.nodes = currentFlow.value.nodes.filter(n => n.id !== nodeId)
    currentFlow.value.edges = currentFlow.value.edges.filter(
      e => e.source !== nodeId && e.target !== nodeId
    )

    if (selectedNode.value?.id === nodeId) {
      selectedNode.value = null
    }
  }

  // 添加边
  function addEdge(source: string, target: string, label?: string) {
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
      label
    }

    currentFlow.value.edges.push(edge)
  }

  // 更新边
  function updateEdge(edgeId: string, updates: Partial<FlowEdge>) {
    if (!currentFlow.value) return

    const index = currentFlow.value.edges.findIndex(e => e.id === edgeId)
    if (index !== -1) {
      currentFlow.value.edges[index] = {
        ...currentFlow.value.edges[index],
        ...updates
      }
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
    addNode,
    updateNode,
    deleteNode,
    addEdge,
    updateEdge,
    deleteEdge,
    selectNode,
    clearCurrentFlow,
    setFlowName,
    setFlowDescription,
    setFlowTags
  }
})
