/**
 * 节点类型定义
 * 所有节点都支持语义化描述，由 AI 解析执行
 */
export type NodeType =
  | 'Start'        // 开始节点
  | 'End'          // 结束节点
  | 'Action'       // 操作节点（点击、输入、选择等）
  | 'Assert'       // 断言节点（验证）
  | 'Extract'      // 数据提取节点
  | 'Condition'    // 条件分支节点
  | 'SubFlow'      // 子流程节点
  | 'Wait'         // 等待节点
  | 'Navigate'     // 页面导航节点

/**
 * 操作类型 - 传统操作方法的类型定义（用于高级模式）
 */
export type ActionMethod =
  | 'click'        // 点击元素
  | 'doubleClick'  // 双击元素
  | 'rightClick'   // 右键点击
  | 'input'        // 输入文本
  | 'select'       // 选择选项
  | 'hover'        // 悬停元素
  | 'scroll'       // 滚动页面
  | 'scrollIntoView' // 滚动到元素可见
  | 'wait'         // 等待指定时间
  | 'screenshot'   // 截图
  | 'refresh'      // 刷新页面
  | 'switchFrame'  // 切换 iframe
  | 'goto'         // 导航到 URL

/**
 * 断言类型 - 用于验证页面状态
 */
export type AssertType =
  | 'text'        // 元素包含指定文本
  | 'visible'     // 元素可见
  | 'hidden'      // 元素隐藏
  | 'enabled'     // 元素可用
  | 'disabled'    // 元素禁用
  | 'contains'   // 文本包含
  | 'notContains' // 文本不包含

/**
 * 条件操作符
 */
export type ConditionOperator = '==' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'empty' | 'notEmpty'

/**
 * 选择方式（用于 Select 操作）
 */
export type SelectBy = 'value' | 'text' | 'index'

/**
 * 滚动方向
 */
export type ScrollDirection = 'up' | 'down' | 'left' | 'right'

/**
 * 操作节点配置
 * 支持语义化描述和精细控制两种模式
 */
export interface ActionConfig {
  // 语义化描述模式（推荐）
  prompt?: string        // 自然语言描述要执行的操作，如"点击登录按钮"

  // 精细控制模式（高级选项）
  method?: ActionMethod  // 操作方法
  target?: string       // 目标元素描述
  value?: string       // 操作值（输入文本、选择值等）
  isVariable?: boolean // value 是否为变量引用
  selectBy?: SelectBy  // 选择方式
  scrollDirection?: ScrollDirection  // 滚动方向
  scrollAmount?: number // 滚动距离（像素）
  frameSelector?: string // Frame 选择器
  timeout?: number     // 超时时间（秒）

  // 是否强制使用精细控制模式
  useManualMode?: boolean
}

/**
 * 断言节点配置
 * 支持语义化描述和精细控制两种模式
 */
export interface AssertConfig {
  // 语义化描述模式（推荐）
  prompt?: string        // 自然语言描述要验证的内容，如"页面显示登录成功"

  // 精细控制模式（高级选项）
  type?: AssertType     // 断言类型
  target?: string       // 目标元素描述
  expected?: string    // 期望值
  timeout?: number      // 超时时间（秒）

  // 是否强制使用精细控制模式
  useManualMode?: boolean
}

/**
 * 提取节点配置
 * 支持语义化描述和精细控制两种模式
 */
export interface ExtractConfig {
  // 语义化描述模式（推荐）
  prompt?: string        // 自然语言描述要提取的内容，如"获取当前页面的用户名"

  // 精细控制模式（高级选项）
  target?: string       // 目标元素描述
  field?: string        // 要提取的字段
  as?: string          // 保存为变量名

  // 是否强制使用精细控制模式
  useManualMode?: boolean
}

/**
 * 条件节点配置 - 条件分支
 */
export interface ConditionConfig {
  // 语义化描述模式（推荐）
  prompt?: string        // 自然语言描述判断条件，如"检查用户是否已登录"

  // 精细控制模式（高级选项）
  variable?: string     // 变量名
  operator?: ConditionOperator // 操作符
  value?: string       // 比较值

  // 是否强制使用精细控制模式
  useManualMode?: boolean
}

/**
 * 子流程节点配置 - 调用其他流程
 */
export interface SubFlowConfig {
  flowId: string                    // 子流程 ID
  mapping?: Record<string, string>   // 参数映射
}

/**
 * 等待节点配置
 * 支持语义化描述和精细控制两种模式
 */
export interface WaitConfig {
  // 语义化描述模式（推荐）
  prompt?: string        // 自然语言描述等待条件，如"等待页面加载完成"

  // 精细控制模式（高级选项）
  waitType?: 'time' | 'element'  // 等待方式
  timeout?: number      // 等待时间（秒）
  waitFor?: string     // 等待元素出现

  // 是否强制使用精细控制模式
  useManualMode?: boolean
}

/**
 * 导航节点配置
 * 支持语义化描述和精细控制两种模式
 */
export interface NavigateConfig {
  // 语义化描述模式（推荐）
  prompt?: string        // 自然语言描述目标页面，如"打开百度首页"

  // 精细控制模式（高级选项）
  url?: string          // 目标 URL
  isVariable?: boolean // URL 是否为变量引用
  waitUntil?: string    // 等待策略：load、domcontentloaded、networkidle
  timeout?: number      // 超时时间（秒）

  // 是否强制使用精细控制模式
  useManualMode?: boolean
}

/**
 * 流程节点
 */
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
  wait?: WaitConfig
  navigate?: NavigateConfig
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
