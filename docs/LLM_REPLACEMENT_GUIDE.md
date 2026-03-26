# 大模型替换指南

本文档说明如何替换 AI 流程图生成功能使用的大模型。

## 当前配置

- **默认模型**: abab6.5s-chat
- **API 地址**: https://api.minimaxi.com/v1
- **API Key**: 已在代码中配置（见下方修改方式）

## 配置方式

### 方式1：直接在代码中修改（最简单）

编辑 `backend/src/main/java/com/uitestflow/service/AIFlowService.java`：

```java
// 第 25 行左右
private static final String API_KEY = "your-api-key";
```

修改为你的 API Key 即可。

### 方式2：环境变量配置（可选）

在启动后端前设置环境变量：

```bash
export MINIMAX_API_KEY="your-api-key"
```

## 替换为其他模型

### 替换为 OpenAI GPT-4V

1. 修改 `AIFlowService.java` 中的 API 调用逻辑
2. 使用 OpenAI 的 vision API 端点
3. 配置对应的 API Key

### 替换为 Anthropic Claude

1. 修改 `AIFlowService.java` 中的 API 调用逻辑
2. 使用 Claude 的 vision API 端点
3. 配置对应的 API Key

## 核心代码位置

- **服务类**: `backend/src/main/java/com/uitestflow/service/AIFlowService.java`
- **API Key 位置**: 第 26 行 `private static final String API_KEY = "..."`
- **模型名称**: 第 28 行 `private final String model = "..."`
- **API 地址**: 第 27 行 `private final String baseUrl = "..."`
- **请求 DTO**: `backend/src/main/java/com/uitestflow/dto/AIGenerateRequest.java`
- **API 接口**: `backend/src/main/java/com/uitestflow/controller/FlowController.java`

## 修改提示

在 `AIFlowService.java` 中，核心调用逻辑在 `callMiniMax` 方法，模型名称在第 28 行：

```java
private String callMiniMax(String prompt, List<String> images) throws IOException {
    // 构建请求体
    RequestBody body = RequestBody.create(JSON, objectMapper.writeValueAsString(new ChatRequest(model, messages)));

    Request request = new Request.Builder()
            .url(baseUrl + "/text/chatcompletion_v2")
            .addHeader("Authorization", "Bearer " + API_KEY)
            .addHeader("Content-Type", "application/json")
            .post(body)
            .build();
    // ...
}
```

要替换模型，需要：
1. 修改 `baseUrl` 为目标模型的 API 地址
2. 修改请求体格式（可能需要适配目标模型的 API）
3. 修改响应解析逻辑
4. 更新 prompt（不同模型可能需要不同的 prompt 格式）

## 测试

配置完成后：
1. 重启后端服务
2. 在前端使用"AI 导入"功能
3. 检查后端日志中的 `=== MiniMax API Response ===` 确认 API 调用成功