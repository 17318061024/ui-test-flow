// 节点类型
export type NodeType =
  | 'Start'
  | 'End'
  | 'Action'
  | 'Assert'
  | 'Extract'
  | 'Condition'
  | 'SubFlow'

// 操作方法
export type ActionMethod =
  | 'click'
  | 'input'
  | 'select'
  | 'hover'
  | 'scroll'
  | 'wait'
  | 'screenshot'

// 断言类型
export type AssertType =
  | 'text'
  | 'visible'
  | 'hidden'
  | 'enabled'
  | 'contains'

// 条件操作符
export type ConditionOperator = '==' | '!=' | 'contains' | 'empty' | 'notEmpty'

// 操作节点配置
export interface ActionConfig {
  method: ActionMethod
  target: string
  value?: string
  timeout?: number
}

// 断言节点配置
export interface AssertConfig {
  type: AssertType
  target: string
  expected: string
}

// 提取节点配置
export interface ExtractConfig {
  target: string
  field: string
  as: string
}

// 条件节点配置
export interface ConditionConfig {
  variable: string
  operator: ConditionOperator
  value: string
}

// 子流程节点配置
export interface SubFlowConfig {
  flowId: string
  mapping?: Record<string, string>
}

// 流程节点
export interface FlowNode {
  id: string
  type: NodeType
  label: string
  description?: string
  position?: { x: number; y: number }

  // 各类型节点配置
  action?: ActionConfig
  assert?: AssertConfig
  extract?: ExtractConfig
  condition?: ConditionConfig
  subFlow?: SubFlowConfig
}

// 流程边
export interface FlowEdge {
  id: string
  source: string
  target: string
  label?: string
  condition?: string
}

// 流程图定义
export interface TestFlow {
  id: string
  name: string
  description?: string
  version: number
  tags?: string[]
  author?: string
  nodes: FlowNode[]
  edges: FlowEdge[]
  createdAt?: string
  updatedAt?: string
}

// 流程元信息（列表展示用）
export interface FlowMeta {
  id: string
  name: string
  description?: string
  version: number
  tags?: string[]
  author?: string
  nodeCount: number
  createdAt?: string
  updatedAt?: string
}

// 测试步骤
export interface TestStep {
  id: string
  type: 'action' | 'assert' | 'extract' | 'wait'
  description: string
  method?: ActionMethod
  target?: string
  value?: string
  assertType?: AssertType
  expected?: string
  field?: string
  as?: string
  timeout?: number
}

// 生成的测试用例
export interface TestCase {
  id: string
  name: string
  description?: string
  flowId: string
  tags?: string[]
  steps: TestStep[]
  createdAt: string
  path?: string[]
}

// 节点配置（用于属性面板）
export interface NodeConfig {
  id: string
  type: NodeType
  label: string
  description?: string
  action?: ActionConfig
  assert?: AssertConfig
  extract?: ExtractConfig
  condition?: ConditionConfig
  subFlow?: SubFlowConfig
}
