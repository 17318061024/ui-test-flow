/**
 * 节点类型定义
 * 所有节点都支持语义化描述，由 AI 解析执行
 * 分为两类：
 * 1. 语义化模式：通过 prompt 描述，AI 自动解析执行
 * 2. 精细模式：手动配置具体的操作方法、目标元素等
 */
export type NodeType =
  // 流程控制
  | 'Start'        // 开始节点
  | 'End'          // 结束节点
  // 页面操作
  | 'Navigate'     // 页面导航节点
  | 'Action'       // 操作节点（点击、输入、选择等）
  | 'Wait'         // 等待节点
  // 验证与数据
  | 'Assert'       // 断言节点（验证）
  | 'Extract'      // 数据提取节点
  // 流程逻辑
  | 'Condition'    // 条件分支节点
  | 'SubFlow'      // 子流程节点
  // 扩展节点
  | 'Loop'         // 循环节点
  | 'Variable'     // 变量节点
  | 'Script'       // 脚本节点
  | 'Log'          // 日志节点
  | 'Screenshot'   // 截图节点

/**
 * 等待策略 - 页面加载完成的标准
 */
export type WaitUntil = 'load' | 'domcontentloaded' | 'networkidle' | 'commit'

/**
 * 变量引用 - 用于动态值
 */
export interface VariableRef {
  name: string           // 变量名
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array'  // 变量类型
  defaultValue?: any     // 默认值
}

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
  | 'text'          // 元素包含指定文本（精确匹配）
  | 'visible'       // 元素可见
  | 'hidden'        // 元素隐藏
  | 'enabled'       // 元素可用
  | 'disabled'      // 元素禁用
  | 'contains'      // 文本包含（模糊匹配）
  | 'notContains'   // 文本不包含
  | 'url'          // URL 匹配
  | 'title'        // 页面标题匹配
  | 'count'        // 元素数量匹配
  | 'value'        // 输入框值匹配
  | 'checked'       // 复选框/单选框选中状态
  | 'notEmpty'     // 元素非空
  | 'regex'        // 正则表达式匹配

/**
 * 断言配置扩展
 */
export interface AssertCondition {
  type: AssertType
  target?: string           // 目标元素描述
  expected?: string        // 期望值
  isVariable?: boolean     // 期望值是否为变量引用
  not?: boolean            // 取反
  timeout?: number         // 超时时间（秒）
  message?: string         // 自定义错误消息
}

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

  // 选择操作选项
  selectBy?: SelectBy  // 选择方式
  selectOptions?: string[]  // 多选选项列表

  // 滚动选项
  scrollDirection?: ScrollDirection  // 滚动方向
  scrollAmount?: number // 滚动距离（像素）
  scrollIntoView?: boolean  // 滚动到元素可见

  // Frame 操作
  frameSelector?: string // Frame 选择器
  frameIndex?: number   // Frame 索引

  // 键盘操作
  modifiers?: ('Alt' | 'Control' | 'Meta' | 'Shift')[]  // 修饰键
  press?: string       // 按键（如：Enter, Escape, ArrowDown）

  // 拖拽操作
  dragTo?: string      // 拖拽到目标元素

  // 上传操作
  uploadFile?: string  // 上传文件路径
  multiple?: boolean  // 是否多选文件

  // 时间设置
  timeout?: number     // 超时时间（秒）
  delay?: number      // 操作前延迟（毫秒）

  // 强制选项
  force?: boolean     // 强制执行（忽略可见性等）
  noWaitAfter?: boolean  // 操作后不等待

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
  isVariable?: boolean  // 期望值是否为变量引用
  not?: boolean        // 取反
  ignoreCase?: boolean  // 忽略大小写
  timeout?: number     // 超时时间（秒）

  // 多条件断言
  conditions?: AssertCondition[]  // 多个断言条件

  // 软断言（失败继续执行）
  soft?: boolean       // 是否为软断言

  // 截图验证
  screenshot?: boolean // 是否截图保存

  // 错误消息
  message?: string     // 自定义错误消息

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
  field?: string        // 要提取的字段（innerText, value, href, src, attributeName 等）
  as?: string          // 保存为变量名

  // 提取选项
  multiple?: boolean    // 是否提取多个元素
  index?: number       // 多个元素时的索引
  regex?: string       // 正则表达式提取

  // JSON 提取
  jsonPath?: string    // JSON 路径（用于提取 JSON 数据）

  // 页面级提取
  pageTitle?: boolean   // 提取页面标题
  pageUrl?: boolean    // 提取页面 URL
  pageCookies?: boolean // 提取页面 Cookies
  localStorage?: string // 提取 localStorage 项
  sessionStorage?: string // 提取 sessionStorage 项

  // 截图提取
  screenshot?: boolean // 是否同时截图

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

  // 多条件组合
  conditions?: {
    variable: string    // 变量名
    operator: ConditionOperator  // 操作符
    value: string      // 比较值
    logic?: 'and' | 'or'  // 逻辑关系
  }[]

  // 页面状态条件
  pageUrl?: string     // URL 匹配条件
  pageTitle?: string   // 标题匹配条件
  elementExists?: string  // 元素存在条件
  elementVisible?: string // 元素可见条件

  // 变量类型条件
  variableExists?: string   // 变量存在
  variableEmpty?: string    // 变量为空

  // 是否强制使用精细控制模式
  useManualMode?: boolean
}

/**
 * 子流程节点配置 - 调用其他流程
 */
export interface SubFlowConfig {
  flowId: string                    // 子流程 ID
  flowName?: string                 // 子流程名称（用于展示）
  mapping?: Record<string, string>  // 输入参数映射：{ 子流程参数名: 当前流程变量名 }
  outputMapping?: Record<string, string> // 输出参数映射：{ 当前流程变量名: 子流程返回值名 }
  async?: boolean                   // 是否异步执行
  timeout?: number                  // 超时时间（秒）
}

/**
 * 等待节点配置
 * 支持语义化描述和精细控制两种模式
 */
export interface WaitConfig {
  // 语义化描述模式（推荐）
  prompt?: string        // 自然语言描述等待条件，如"等待页面加载完成"

  // 精细控制模式（高级选项）
  waitType?: 'time' | 'element' | 'network' | 'function'  // 等待方式：时间、元素、网络请求、函数
  timeout?: number      // 等待时间（秒）
  waitFor?: string     // 等待元素出现（CSS 选择器或描述）
  waitForVisible?: boolean  // 等待元素可见（默认 true）
  waitForHidden?: boolean   // 等待元素隐藏
  waitForEnabled?: boolean  // 等待元素可用

  // 网络等待
  waitForRequest?: string   // 等待特定请求
  waitForResponse?: string  // 等待特定响应

  // 函数等待
  waitForFunction?: string  // JavaScript 表达式

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
  waitUntil?: WaitUntil // 等待策略：load、domcontentloaded、networkidle
  timeout?: number      // 超时时间（秒）
  referer?: string     // Referer 头
  headers?: Record<string, string> // 自定义请求头

  // 是否强制使用精细控制模式
  useManualMode?: boolean
}

/**
 * 循环节点配置
 */
export interface LoopConfig {
  // 语义化描述模式（推荐）
  prompt?: string        // 自然语言描述循环条件，如"遍历商品列表"

  // 精细控制模式（高级选项）
  loopType?: 'times' | 'while' | 'forEach' | 'selector'  // 循环类型
  times?: number        // 循环次数（times 类型）
  variable?: string    // 循环变量名（forEach 类型）
  items?: string[]    // 循环项列表（forEach 类型）
  itemsVariable?: string  // 项列表变量（forEach 类型）

  // 条件循环
  condition?: {
    variable: string   // 变量名
    operator: ConditionOperator  // 操作符
    value: string     // 比较值
  }

  // 选择器循环
  selector?: string    // CSS 选择器
  maxIterations?: number  // 最大迭代次数

  // 循环内操作延迟
  iterationDelay?: number  // 每次循环延迟（毫秒）
  continueOnError?: boolean  // 失败时继续执行

  // 是否强制使用精细控制模式
  useManualMode?: boolean
}

/**
 * 变量节点配置
 */
export interface VariableConfig {
  // 语义化描述模式（推荐）
  prompt?: string        // 自然语言描述变量操作，如"设置用户名为张三"

  // 精细控制模式（高级选项）
  operation?: 'set' | 'update' | 'delete' | 'clear'  // 操作类型
  name?: string         // 变量名
  value?: any          // 变量值
  isExpression?: boolean  // value 是否为表达式

  // 运算操作
  operator?: '+' | '-' | '*' | '/' | '%' | '='  // 运算操作符
  operand?: string     // 运算操作数

  // 数组/对象操作
  arrayPush?: boolean  // 数组推入
  arrayPop?: boolean   // 数组弹出
  objectAssign?: Record<string, any>  // 对象合并

  // 默认值
  defaultValue?: any  // 默认值（变量不存在时）

  // 是否强制使用精细控制模式
  useManualMode?: boolean
}

/**
 * 脚本节点配置
 */
export interface ScriptConfig {
  // 语义化描述模式（推荐）
  prompt?: string        // 自然语言描述脚本逻辑，如"计算商品总价"

  // 精细控制模式（高级选项）
  script?: string       // JavaScript 代码
  async?: boolean       // 是否异步执行

  // 脚本参数
  params?: Record<string, any>  // 输入参数

  // 脚本结果
  as?: string          // 保存结果为变量名

  // 错误处理
  throwError?: boolean // 是否抛出错误

  // 是否强制使用精细控制模式
  useManualMode?: boolean
}

/**
 * 日志节点配置
 */
export interface LogConfig {
  // 语义化描述模式（推荐）
  prompt?: string        // 自然语言描述日志内容，如"输出用户信息"

  // 精细控制模式（高级选项）
  level?: 'log' | 'info' | 'warn' | 'error'  // 日志级别
  message?: string      // 日志消息
  variables?: string[]  // 要输出的变量列表

  // 高级选项
  template?: string     // 日志模板，支持 {{变量名}} 插值
  enableTimestamp?: boolean  // 是否包含时间戳
  enableScreenshot?: boolean  // 是否附带截图

  // 是否强制使用精细控制模式
  useManualMode?: boolean
}

/**
 * 截图节点配置
 */
export interface ScreenshotConfig {
  // 语义化描述模式（推荐）
  prompt?: string        // 自然语言描述截图，如"截取当前页面"

  // 精细控制模式（高级选项）
  type?: 'fullPage' | 'viewport' | 'element'  // 截图类型
  path?: string         // 保存路径
  filename?: string     // 文件名（支持变量）

  // 元素截图
  target?: string       // 目标元素描述

  // 截图选项
  omitBackground?: boolean  // 透明背景
  encoding?: 'base64' | 'binary'  // 编码方式

  // 是否保存到变量
  as?: string          // 保存为 base64 变量

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
  // 扩展节点配置
  loop?: LoopConfig
  variable?: VariableConfig
  script?: ScriptConfig
  log?: LogConfig
  screenshot?: ScreenshotConfig
}

// 流程边
export interface FlowEdge {
  id: string
  source: string
  target: string
  label?: string
  condition?: string
  sourceHandle?: string  // 连接点位置（left/right/top/bottom）
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
  wait?: WaitConfig
  navigate?: NavigateConfig
  // 扩展节点配置
  loop?: LoopConfig
  variable?: VariableConfig
  script?: ScriptConfig
  log?: LogConfig
  screenshot?: ScreenshotConfig
}
