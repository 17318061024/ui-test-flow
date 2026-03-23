# UI Test Flow - 架构设计文档

## 系统概述

UI Test Flow 是一个可视化的 UI 测试用例流程设计工具，采用前后端分离架构。后端使用 Java Spring Boot 提供 REST API，前端使用 Vue 3 + TypeScript 构建单页应用。

## 架构设计

```
┌─────────────────────────────────────────────────────────────────┐
│                        前端 (Vue 3 + TypeScript)                │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │   Views      │  │ Components   │  │  Stores (Pinia)   │   │
│  │  - 列表页    │  │ - FlowDesigner│  │  - flow.ts       │   │
│  │  - 设计页    │  │ - PropertyPanel│ │                   │   │
│  │  - 用例页    │  │ - NodePalette │  │                   │   │
│  └──────────────┘  └──────────────┘  └──────────────────┘   │
│                              │                                 │
│                    ┌─────────┴─────────┐                      │
│                    │    Vue Flow        │                      │
│                    │  (流程可视化引擎)   │                      │
│                    └───────────────────┘                      │
└─────────────────────────────────────────────────────────────────┘
                               │
                              HTTP/HTTPS
                               │
┌─────────────────────────────────────────────────────────────────┐
│                     后端 (Spring Boot 3.2.0)                    │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    REST API Layer                       │   │
│  │  FlowController - 处理所有流程相关的 HTTP 请求            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Service Layer                          │   │
│  │  FlowService - 流程 CRUD 业务逻辑                        │   │
│  │  TestCaseService - 测试用例生成逻辑                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Utility Layer                          │   │
│  │  FlowParser - 流程文件解析/验证                          │   │
│  │  TestCaseGenerator - 测试用例生成器                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                Persistence Layer (File System)            │   │
│  │  流程文件存储: ./flows/*.json                            │   │
│  │  测试用例输出: ./output/test-cases.json                  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## 核心模块设计

### 前端模块

#### 1. 流程设计器 (FlowDesigner)

**职责**：提供可视化的流程设计界面

**核心组件**：

| 组件 | 职责 |
|------|------|
| `index.vue` | 主容器，管理 Vue Flow 实例，处理节点/边事件 |
| `NodePalette.vue` | 左侧节点面板，提供可拖拽的节点列表 |
| `PropertyPanel.vue` | 右侧属性面板，编辑选中节点/边的属性 |
| `CustomNodes/` | 自定义节点渲染组件 |

**状态管理 (flow.ts)**：

```typescript
// 核心状态
- flows: FlowMeta[]           // 流程列表
- currentFlow: TestFlow         // 当前编辑的流程
- selectedNode: FlowNode       // 选中的节点
- selectedEdge: FlowEdge       // 选中的边
- isLoading: boolean           // 加载状态
- isSaving: boolean            // 保存状态

// 核心方法
- fetchFlows()                 // 获取流程列表
- fetchFlow(id)                // 获取单个流程
- saveFlow()                  // 保存流程
- addNode(node)               // 添加节点
- updateNode(id, updates)      // 更新节点
- deleteNode(id)              // 删除节点
- addEdge(source, target)     // 添加边
- deleteEdge(id)              // 删除边
```

#### 2. 节点类型系统

**节点分类**：

```
NodeType
├── Start         // 开始节点
├── End           // 结束节点
├── Action        // 操作节点
├── Assert        // 断言节点
├── Extract       // 提取节点
├── AIAction      // AI 动作节点 (Midscene.js)
├── AIQuery       // AI 查询节点 (Midscene.js)
├── AIAssert      // AI 断言节点 (Midscene.js)
├── Condition     // 条件分支
├── SubFlow       // 子流程调用
├── Wait          // 等待
└── Navigate     // 导航
```

### 后端模块

#### 1. REST API 控制器 (FlowController)

**职责**：处理所有 HTTP 请求，返回 JSON 响应

**端点设计**：

```java
@RestController
@RequestMapping("/api")
public class FlowController {

    // 流程 CRUD
    GET    /flows           // 获取流程列表
    GET    /flows/{id}       // 获取单个流程
    POST   /flows            // 创建流程
    PUT    /flows/{id}      // 更新流程
    DELETE /flows/{id}      // 删除流程

    // 流程操作
    POST   /flows/{id}/duplicate  // 复制流程
    GET    /flows/{id}/export     // 导出流程
    POST   /flows/import          // 导入流程

    // 测试用例生成
    POST   /flows/{id}/generate   // 生成测试用例
    GET    /test-cases            // 获取测试用例
    GET    /flows/{id}/export-cases  // 导出测试用例
}
```

#### 2. 业务服务层 (FlowService)

**职责**：封装核心业务逻辑

```java
@Service
public class FlowService {
    // 获取所有流程列表
    List<FlowMeta> getAllFlows()

    // 获取单个流程
    TestFlow getFlow(String id) throws IOException

    // 创建流程
    TestFlow createFlow(TestFlow flow) throws IOException

    // 更新流程
    TestFlow updateFlow(String id, TestFlow updates) throws IOException

    // 删除流程
    void deleteFlow(String id) throws IOException

    // 复制流程
    TestFlow duplicateFlow(String id) throws IOException

    // 导出流程
    String exportFlow(String id) throws IOException

    // 导入流程
    TestFlow importFlow(String json) throws IOException
}
```

#### 3. 流程解析器 (FlowParser)

**职责**：流程文件的加载、保存和验证

```java
@Component
public class FlowParser {
    // 加载流程图文件 (支持 JSON/YAML)
    TestFlow loadFlow(String filePath) throws IOException

    // 保存流程图到文件
    void saveFlow(TestFlow flow, String filePath) throws IOException

    // 验证流程图
    ValidationResult validateFlow(TestFlow flow)

    // 获取节点的所有出边
    List<FlowEdge> getOutgoingEdges(TestFlow flow, String nodeId)

    // 获取节点的所有入边
    List<FlowEdge> getIncomingEdges(TestFlow flow, String nodeId)

    // 根据ID获取节点
    FlowNode getNodeById(TestFlow flow, String nodeId)

    // 查找 Start 节点
    FlowNode findStartNode(TestFlow flow)

    // 查找所有 End 节点
    List<FlowNode> findEndNodes(TestFlow flow)
}
```

#### 4. 测试用例生成器 (TestCaseGenerator)

**职责**：将流程图转换为可执行的测试用例

## 数据模型

### 前端类型定义

```typescript
// 流程节点
interface FlowNode {
  id: string
  type: NodeType
  label: string
  description?: string
  position?: { x: number; y: number }
  // 各类型节点配置
  action?: ActionConfig
  assert?: AssertConfig
  extract?: ExtractConfig
  aiAction?: AIActionConfig
  aiQuery?: AIQueryConfig
  aiAssert?: AIAssertConfig
  condition?: ConditionConfig
  subFlow?: SubFlowConfig
  wait?: WaitConfig
  navigate?: NavigateConfig
}

// 流程边
interface FlowEdge {
  id: string
  source: string      // 源节点 ID
  target: string      // 目标节点 ID
  label?: string      // 显示标签
  condition?: string  // 条件
}

// 流程图
interface TestFlow {
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
```

### 后端实体类

```
model/
├── NodeType.java          # 节点类型枚举
├── ActionMethod.java      # 操作方法枚举
├── AssertType.java       # 断言类型枚举
├── ConditionOperator.java # 条件操作符枚举
├── FlowNode.java         # 流程节点实体
├── FlowEdge.java         # 流程边实体
├── TestFlow.java         # 流程图实体
├── TestCase.java         # 测试用例实体
├── TestStep.java         # 测试步骤实体
├── ActionConfig.java     # 操作配置
├── AssertConfig.java     # 断言配置
├── ExtractConfig.java    # 提取配置
└── ...
```

## 流程验证规则

1. **必填字段**：流程必须有 id、name、nodes
2. **节点约束**：
   - 至少包含一个 Start 节点
   - 只能有一个 Start 节点
   - 至少包含一个 End 节点
   - 节点 ID 不能重复
3. **边约束**：
   - 边的源节点和目标节点必须存在
4. **类型约束**：
   - Action 节点的 method 必须在允许列表中
   - Assert 节点的 type 必须在允许列表中

## 测试用例生成流程

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐
│  流程图     │────▶│ 遍历节点     │────▶│ 生成测试步骤  │
│ (TestFlow)  │     │ (DFS/BFS)   │     │ (TestStep[]) │
└─────────────┘     └──────────────┘     └───────────────┘
                                                 │
                                                 ▼
                    ┌──────────────┐     ┌───────────────┐
                    │ 输出测试用例  │◀────│  序列化为 JSON │
                    │ (TestCase[]) │     │   / YAML      │
                    └──────────────┘     └───────────────┘
```

## 扩展点

1. **新增节点类型**：
   - 前端：在 `types/flow.ts` 添加新的类型定义
   - 前端：在 `NodePalette.vue` 添加节点项
   - 前端：在 `PropertyPanel.vue` 添加属性编辑表单
   - 前端：在 `CustomNodes/` 添加节点渲染组件
   - 后端：在 `model/` 添加对应的配置类

2. **新增导出格式**：
   - 在 `TestCaseService.exportTestCases()` 添加新的格式处理分支

3. **集成其他 AI 框架**：
   - 创建新的节点类型（AIAction、AIQuery、AIAssert）
   - 在测试用例生成器中调用对应的 AI SDK

## 性能考虑

1. **文件存储**：当前使用 JSON 文件系统，适合中小规模项目
2. **大数据量**：如需大规模部署，建议迁移到数据库
3. **前端优化**：Vue Flow 支持虚拟化，可处理大量节点
