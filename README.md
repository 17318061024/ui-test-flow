# UI Test Flow - AI-Driven UI Testing Flow Designer

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License">
  <img src="https://img.shields.io/badge/Java-17-blue" alt="Java">
  <img src="https://img.shields.io/badge/Vue-3-green" alt="Vue">
  <img src="https://img.shields.io/badge/SpringBoot-3.2.0-blue" alt="Spring Boot">
</p>

## 项目简介

UI Test Flow 是一个可视化的 UI 测试用例流程设计工具，通过图形化界面创建和管理 UI 测试流程，并支持生成基于 [Midscene.js](https://midscenejs.com) 的 AI 驱动自动化测试脚本。

## 功能特性

- **可视化流程设计**：拖拽式节点设计，实时预览测试流程
- **多种节点类型**：
  - 基础节点：操作(Action)、断言(Assert)、数据提取(Extract)
  - AI 节点：AIAction、AIQuery、AIAssert（基于 Midscene.js）
  - 流程控制：条件分支(Condition)、子流程(SubFlow)、等待(Wait)、导航(Navigate)
- **一键生成测试用例**：自动生成可执行的测试脚本
- **多种导出格式**：支持 JSON、YAML、JavaScript 脚本导出
- **流程管理**：创建、编辑、复制、导入、导出流程

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | Vue 3 + TypeScript |
| UI 组件 | Element Plus |
| 流程图 | @vue-flow/core |
| 后端框架 | Spring Boot 3.2.0 |
| 数据存储 | JSON 文件系统 |
| 构建工具 | Maven (后端) / Vite (前端) |

## 快速开始

### 环境要求

- Node.js 18+
- JDK 17+
- Maven 3.8+

### 安装配置

#### 1. 克隆项目

```bash
git clone <repository-url>
cd ui-test-flow
```

#### 2. 启动后端 (Java Spring Boot)

```bash
cd backend
# 使用 Maven 启动
mvn spring-boot:run
```

后端服务将运行在 http://localhost:3001

#### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端应用将运行在 http://localhost:5173

### 使用流程

1. 打开浏览器访问 http://localhost:5173
2. 点击"新建流程"创建测试流程
3. 从左侧节点面板拖拽节点到画布
4. 选中节点，在右侧属性面板配置节点属性
5. 连接节点形成测试流程
6. 点击"保存"保存流程
7. 点击"生成测试用例"生成可执行脚本

## 项目结构

```
ui-test-flow/
├── frontend/                 # Vue 3 前端应用
│   ├── src/
│   │   ├── api/           # API 调用
│   │   ├── components/     # Vue 组件
│   │   │   └── FlowDesigner/  # 流程设计器
│   │   ├── stores/        # Pinia 状态管理
│   │   ├── types/         # TypeScript 类型定义
│   │   └── views/         # 页面视图
│   └── vite.config.ts     # Vite 配置
│
├── backend/                 # Java Spring Boot 后端
│   └── src/main/java/
│       └── com/uitestflow/
│           ├── config/    # 配置类
│           ├── controller/# REST API 控制器
│           ├── service/   # 业务逻辑层
│           ├── model/     # 实体类
│           ├── dto/       # 数据传输对象
│           └── util/      # 工具类
│
├── flows/                  # 流程文件存储目录
├── output/                 # 生成的测试用例输出目录
└── docs/                   # 项目文档
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/flows | 获取流程列表 |
| GET | /api/flows/:id | 获取单个流程 |
| POST | /api/flows | 创建流程 |
| PUT | /api/flows/:id | 更新流程 |
| DELETE | /api/flows/:id | 删除流程 |
| POST | /api/flows/:id/duplicate | 复制流程 |
| GET | /api/flows/:id/export | 导出流程 |
| POST | /api/flows/import | 导入流程 |
| POST | /api/flows/:id/generate | 生成测试用例 |
| GET | /api/test-cases | 获取测试用例列表 |
| GET | /api/flows/:id/export-cases | 导出测试用例 |

## 节点类型说明

### 基础节点

| 节点类型 | 说明 | 配置项 |
|---------|------|--------|
| Action | 执行 UI 操作 | method, target, value, timeout |
| Assert | 验证页面状态 | type, target, expected |
| Extract | 提取页面数据 | target, field, as |
| Wait | 等待指定时间 | timeout |
| Navigate | 页面导航 | url, waitUntil |

### AI 节点 (Midscene.js)

| 节点类型 | 说明 | 配置项 |
|---------|------|--------|
| AIAction | AI 驱动的自然语言交互 | prompt, timeout |
| AIQuery | AI 驱动的数据提取 | prompt, schema, as |
| AIAssert | AI 驱动的断言验证 | prompt, timeout |

### 流程控制节点

| 节点类型 | 说明 | 配置项 |
|---------|------|--------|
| Condition | 条件分支判断 | variable, operator, value |
| SubFlow | 调用子流程 | flowId, mapping |

## 配置说明

### 后端配置 (application.properties)

```properties
server.port=3001
flow.directory=../flows
output.directory=../output
```

### 前端配置 (vite.config.ts)

```typescript
proxy: {
  '/api': {
    target: 'http://localhost:3001',
    changeOrigin: true
  }
}
```

## 许可证

MIT License
