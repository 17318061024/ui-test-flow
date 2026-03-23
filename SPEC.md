# UI 测试用例图谱化生成方案

## 一、背景与目标

### 问题现状
- 编写 UI 测试用例需要逐条写执行步骤
- 大量用例存在重复的操作步骤
- 维护成本高，修改一处要改多处

### 解决方案
- 将测试步骤抽象为**图谱节点**
- 测试人员通过维护**流程图**来定义测试路径
- 系统自动遍历图谱，生成语义化的独立测试用例

---

## 二、核心概念设计

### 2.1 节点类型定义

```
┌─────────────────────────────────────────────────────────┐
│                      节点类型                             │
├──────────────┬──────────────────────────────────────────┤
│ Action       │ 执行操作：点击、输入、等待等                │
│ Assert       │ 断言验证：检查文本、元素存在、状态等         │
│ Extract      │ 数据提取：保存变量供后续使用                │
│ Condition    │ 条件分支：根据变量值判断走向                │
│ SubFlow      │ 子流程：引用其他流程图                      │
│ Start        │ 开始节点                                   │
│ End          │ 结束节点                                   │
└──────────────┴──────────────────────────────────────────┘
```

### 2.2 节点数据结构

```typescript
interface FlowNode {
  id: string;                    // 唯一标识
  type: 'Action' | 'Assert' | 'Extract' | 'Condition' | 'SubFlow' | 'Start' | 'End';
  label: string;                  // 显示名称
  description?: string;           // 描述说明

  // Action 节点
  action?: {
    method: 'click' | 'input' | 'select' | 'hover' | 'scroll' | 'wait' | 'screenshot';
    target: string;                // 目标元素描述（AI 理解用）
    value?: string;               // 输入值或配置
  };

  // Assert 节点
  assert?: {
    type: 'text' | 'visible' | 'hidden' | 'enabled' | 'contains';
    target: string;                // 目标元素
    expected: string;              // 期望值
  };

  // Extract 节点
  extract?: {
    target: string;                // 目标元素
    field: string;                 // 提取字段名
    as: string;                    // 变量名
  };

  // Condition 节点
  condition?: {
    variable: string;              // 判断变量
    operator: '==' | '!=' | 'contains' | 'empty';
    value: string;                 // 比较值
  };

  // SubFlow 节点
  subFlow?: {
    flowId: string;                // 引用的流程图ID
    mapping?: Record<string, string>; // 参数映射
  };
}
```

### 2.3 边（连接线）定义

```typescript
interface FlowEdge {
  id: string;
  source: string;                 // 源节点ID
  target: string;                 // 目标节点ID
  condition?: string;             // 条件（仅 Condition 节点使用）
  label?: string;                 // 显示标签
}
```

### 2.4 流程图定义

```typescript
interface TestFlow {
  id: string;
  name: string;                   // 流程图名称
  description?: string;
  version: number;
  nodes: FlowNode[];
  edges: FlowEdge[];

  // 元信息
  tags?: string[];                // 标签
  author?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## 三、系统架构设计

### 3.1 整体架构

```
┌──────────────────────────────────────────────────────────────┐
│                        Vue3 前端                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │
│  │  流程设计器  │  │  流程列表   │  │  测试用例预览/导出  │   │
│  └─────────────┘  └─────────────┘  └─────────────────────┘   │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                      Node.js 后端                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │
│  │  流程管理   │  │  用例生成   │  │  执行引擎           │   │
│  └─────────────┘  └─────────────┘  └─────────────────────┘   │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                       存储层                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │
│  │  文件存储   │  │  数据库     │  │  Midscene.js       │   │
│  │ (YAML/JSON) │  │ (SQLite)    │  │  (AI 执行)         │   │
│  └─────────────┘  └─────────────┘  └─────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 核心模块

#### 3.2.1 流程设计器（Vue3 前端）
- 拖拽式节点编辑
- 节点属性配置面板
- 流程图可视化
- 导入/导出 JSON

#### 3.2.2 用例生成器（核心引擎）
- 图遍历算法
- 条件分支展开
- 子流程展开
- 生成语义化测试用例

#### 3.2.3 执行引擎（Playwright + Midscene.js）
- 将生成的用例转为可执行脚本
- 支持调试模式
- 生成执行报告

---

## 四、用例生成算法

### 4.1 核心流程

```
1. 获取流程图
2. 找到 Start 节点
3. 深度优先遍历（DFS）
4. 遇到分支节点时：
   - 展开所有可能的路径
5. 遇到子流程时：
   - 展开子流程内容
6. 遇到 End 节点时：
   - 生成完整路径作为一条用例
```

### 4.2 示例：条件分支展开

原始流程：
```
Start → 登录 → [条件: 是否记住我?] → (是)记住密码 → → End
                                          ↓
                                      (否)不记住 → End
```

生成两条用例：
```yaml
用例1: 测试登录功能_记住密码
  - 登录（记住我=true）

用例2: 测试登录功能_不记住密码
  - 登录（记住我=false）
```

### 4.3 示例：子流程展开

公共流程「查询列表」：
```
Start → 输入关键词 → 点击搜索 → 等待加载 → End
```

主流程调用：
```
Start → 登录 → 调用「查询列表」 → 断言结果 → End
```

展开后：
```
Start → 登录 → 输入关键词 → 点击搜索 → 等待加载 → 断言结果 → End
```

---

## 五、输出格式设计

### 5.1 生成的测试用例（语义化 YAML）

```yaml
- id: TC-001
  name: 测试用户登录_记住密码
  description: 验证用户登录成功并记住密码
  tags:
    - 登录
    - 正常流程
  steps:
    - action: 打开页面
      target: 登录页面
      value: https://example.com/login

    - action: 输入账号
      target: 用户名输入框
      value: testuser

    - action: 输入密码
      target: 密码输入框
      value: testpass

    - action: 勾选
      target: 记住我复选框

    - action: 点击
      target: 登录按钮

    - assert: 检查文本
      target: 成功提示
      expected: 登录成功

    - extract: 保存用户名
      target: 用户名显示
      as: currentUser

- id: TC-002
  name: 测试用户登录_不记住密码
  ...
```

### 5.2 Midscene.js 执行脚本

```javascript
// TC-001: 测试用户登录_记住密码
const { ai, aiAssert, aiQuery } = require('@midscenejs/playwright');

async function testTC001(page) {
  // 1. 打开登录页面
  await page.goto('https://example.com/login');

  // 2. 输入账号
  await ai('在用户名输入框输入 testuser');

  // 3. 输入密码
  await ai('在密码输入框输入 testpass');

  // 4. 勾选记住我
  await ai('勾选记住我复选框');

  // 5. 点击登录
  await ai('点击登录按钮');

  // 6. 断言登录成功
  await aiAssert('页面显示登录成功');

  // 7. 提取当前用户
  const currentUser = await aiQuery('获取当前显示的用户名');
}
```

---

## 六、前端界面设计

### 6.1 流程列表页
- 显示所有流程图
- 支持搜索、筛选
- 创建/编辑/删除/复制

### 6.2 流程设计器
- 左侧：节点面板（拖拽）
- 中间：画布（节点连线）
- 右侧：属性配置
- 顶部：工具栏（保存、预览、生成用例）

### 6.3 用例预览页
- 显示生成的所有用例
- 用例详情展开
- 导出为 YAML/JSON/Midscene 脚本

---

## 七、技术实现要点

### 7.1 图遍历实现

```typescript
function generateTestCases(flow: TestFlow): TestCase[] {
  const cases: TestCase[] = [];
  const startNode = flow.nodes.find(n => n.type === 'Start');

  if (!startNode) return cases;

  // 遍历所有可能的路径
  const paths = findAllPaths(flow, startNode.id);

  for (const path of paths) {
    cases.push(pathToTestCase(path, flow));
  }

  return cases;
}

function findAllPaths(flow: TestFlow, startId: string): Node[][] {
  const paths: Node[][] = [];

  function dfs(current: string, path: Node[]) {
    const node = flow.nodes.find(n => n.id === current);
    if (!node) return;

    path.push(node);

    if (node.type === 'End') {
      paths.push([...path]);
      return;
    }

    // 获取出边
    const edges = flow.edges.filter(e => e.source === current);

    for (const edge of edges) {
      // 如果是条件节点，需要处理分支
      if (node.type === 'Condition') {
        // 分支展开
        dfs(edge.target, [...path]);
      } else {
        dfs(edge.target, path);
      }
    }
  }

  dfs(startId, []);
  return paths;
}
```

### 7.2 子流程展开

```typescript
function expandSubFlow(flow: TestFlow, subFlowId: string): FlowNode[] {
  const subFlow = getFlowById(subFlowId);
  if (!subFlow) return [];

  // 展开子流程节点
  let expandedNodes = [...subFlow.nodes];

  // 处理子流程中的子流程（递归）
  for (const node of expandedNodes) {
    if (node.type === 'SubFlow' && node.subFlow?.flowId) {
      const nested = expandSubFlow(flow, node.subFlow.flowId);
      // 替换子流程节点
      expandedNodes = replaceNode(expandedNodes, node.id, nested);
    }
  }

  return expandedNodes;
}
```

---

## 八、存储结构

### 8.1 文件存储（flows/）

```
flows/
├── login.yaml          # 登录流程
├── search.yaml         # 搜索流程
├── checkout.yaml       # 结账流程
└── common/
    ├── wait-loaded.yaml    # 等待加载
    └── verify-error.yaml   # 验证错误
```

### 8.2 流程文件示例

```yaml
id: login
name: 用户登录流程
version: 1
author: test-team
tags:
  - 登录
  - 公共流程

nodes:
  - id: start
    type: Start
    label: 开始

  - id: input-username
    type: Action
    label: 输入用户名
    action:
      method: input
      target: 用户名输入框
      value: "{{username}}"

  - id: input-password
    type: Action
    label: 输入密码
    action:
      method: input
      target: 密码输入框
      value: "{{password}}"

  - id: click-login
    type: Action
    label: 点击登录
    action:
      method: click
      target: 登录按钮

  - id: end
    type: End
    label: 结束

edges:
  - source: start
    target: input-username
  - source: input-username
    target: input-password
  - source: input-password
    target: click-login
  - source: click-login
    target: end
```

---

## 九、总结

### 核心价值
1. **复用**：公共步骤沉淀为子流程
2. **维护性**：修改流程图即可自动更新所有用例
3. **可视化**：非技术人员也能维护测试流程
4. **自动化**：一键生成可执行测试脚本

### 实施路径
1. 设计图谱数据模型
2. 开发 Vue3 流程设计器
3. 实现用例生成引擎
4. 集成 Midscene.js 执行
5. 完善存储和导入导出
