/**
 * 核心类型定义
 * UI测试流程图谱化生成工具
 */

// 节点类型
export type NodeType =
  | 'Start'     // 开始节点
  | 'End'       // 结束节点
  | 'Action'    // 执行操作
  | 'Assert'    // 断言验证
  | 'Extract'   // 数据提取
  | 'Condition'  // 条件分支
  | 'SubFlow';   // 子流程

// 操作方法
export type ActionMethod =
  | 'click'     // 点击
  | 'input'     // 输入
  | 'select'    // 选择
  | 'hover'     // 悬停
  | 'scroll'    // 滚动
  | 'wait'      // 等待
  | 'screenshot'; // 截图

// 断言类型
export type AssertType =
  | 'text'      // 检查文本
  | 'visible'   // 元素可见
  | 'hidden'    // 元素隐藏
  | 'enabled'   // 元素可用
  | 'contains'; // 包含文本

// 操作节点配置
export interface ActionConfig {
  method: ActionMethod;
  target: string;      // 目标元素描述（AI理解用）
  value?: string;      // 输入值或配置
  timeout?: number;    // 超时时间
}

// 断言节点配置
export interface AssertConfig {
  type: AssertType;
  target: string;      // 目标元素
  expected: string;    // 期望值
}

// 提取节点配置
export interface ExtractConfig {
  target: string;      // 目标元素
  field: string;        // 提取字段
  as: string;           // 变量名
}

// 条件节点配置
export interface ConditionConfig {
  variable: string;     // 判断变量
  operator: '==' | '!=' | 'contains' | 'empty' | 'notEmpty';
  value: string;        // 比较值
}

// 子流程节点配置
export interface SubFlowConfig {
  flowId: string;      // 引用的流程图ID
  mapping?: Record<string, string>; // 参数映射
}

// 流程节点
export interface FlowNode {
  id: string;
  type: NodeType;
  label: string;
  description?: string;

  // 各类型节点配置
  action?: ActionConfig;
  assert?: AssertConfig;
  extract?: ExtractConfig;
  condition?: ConditionConfig;
  subFlow?: SubFlowConfig;
}

// 流程边
export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;       // 显示标签
  condition?: string;  // 条件（仅Condition节点使用）
}

// 流程图定义
export interface TestFlow {
  id: string;
  name: string;
  description?: string;
  version: number;
  tags?: string[];
  author?: string;

  nodes: FlowNode[];
  edges: FlowEdge[];

  createdAt?: string;
  updatedAt?: string;
}

// 测试步骤
export interface TestStep {
  id: string;
  type: 'action' | 'assert' | 'extract' | 'wait';
  description: string;

  // Action
  method?: ActionMethod;
  target?: string;
  value?: string;

  // Assert
  assertType?: AssertType;
  expected?: string;

  // Extract
  field?: string;
  as?: string;

  // Common
  timeout?: number;
}

// 生成的测试用例
export interface TestCase {
  id: string;
  name: string;
  description?: string;
  flowId: string;
  tags?: string[];
  steps: TestStep[];

  // 元信息
  createdAt: string;
  path?: string[];  // 路径经过的节点ID
}

// Midscene.js执行脚本
export interface MidsceneScript {
  id: string;
  name: string;
  code: string;
}
