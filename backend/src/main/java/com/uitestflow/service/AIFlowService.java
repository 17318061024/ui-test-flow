package com.uitestflow.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.uitestflow.dto.AIGenerateRequest;
import com.uitestflow.model.*;
import org.springframework.stereotype.Service;
import okhttp3.*;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * AI 流程图生成服务
 */
@Service
public class AIFlowService {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final MediaType JSON = MediaType.parse("application/json; charset=utf-8");

    // MiniMax API Key（与 Claude Code 相同）
    private static final String API_KEY = "sk-cp-iW4WoPsddH6b6KDxfg3O-m_NAyQDr5hUg9Hc4vpClxQ3btpH5RJQJZZCTDXz9CENrgy7P8s-4G_62PxjVtKvB_sdq5dzttCh0XKwmmL-3HiVwFoTh2JZzPs";

    private final String baseUrl = "https://api.minimaxi.com/v1";
    private final String model = "abab6.5s-chat";

    // 超时配置
    private final OkHttpClient client = new OkHttpClient.Builder()
            .connectTimeout(60, java.util.concurrent.TimeUnit.SECONDS)
            .readTimeout(120, java.util.concurrent.TimeUnit.SECONDS)
            .writeTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
            .build();

    // 可通过环境变量覆盖
    // @Value("${minimax.api.key:}")
    // private String apiKey;

    /**
     * 生成流程图
     */
    public TestFlow generateFlow(AIGenerateRequest request) throws IOException {
        // 构建 prompt
        String prompt = buildPrompt(request);

        // 调用 MiniMax API
        String aiResponse = callMiniMax(prompt, request.getImages());

        // 解析 AI 响应为流程图
        TestFlow flow = parseAIMessage(aiResponse);

        // 设置流程基本信息
        if (request.getAppName() != null && !request.getAppName().isEmpty()) {
            flow.setName(request.getAppName() + " 自动化测试流程");
        } else {
            flow.setName("AI 生成的测试流程");
        }
        flow.setId(UUID.randomUUID().toString());
        flow.setVersion(1);
        flow.setCreatedAt(java.time.Instant.now().toString());
        flow.setUpdatedAt(flow.getCreatedAt());

        return flow;
    }

    /**
     * 构建 prompt
     */
    private String buildPrompt(AIGenerateRequest request) {
        StringBuilder sb = new StringBuilder();
        sb.append("你是一个 UI 自动化测试流程设计助手。请根据以下 UI 设计图和需求描述，生成测试流程图。\n\n");
        sb.append("请输出 JSON 格式的流程图，包含以下结构：\n");
        sb.append("{\n");
        sb.append("  \"nodes\": [\n");
        sb.append("    {\n");
        sb.append("      \"id\": \"节点ID\",\n");
        sb.append("      \"type\": \"节点类型(Start/End/Action/Assert/Condition/Navigate/Wait/Extract/AIAction/AIQuery/AIAssert)\",\n");
        sb.append("      \"label\": \"节点名称\",\n");
        sb.append("      \"description\": \"描述\",\n");
        sb.append("      \"position\": {\"x\": x坐标, \"y\": y坐标},\n");
        sb.append("      // 各类型节点的配置\n");
        sb.append("      \"action\": {\"method\": \"操作方法(click/input/hover/scroll等)\", \"target\": \"目标元素\", \"value\": \"输入值\"},\n");
        sb.append("      \"assert\": {\"type\": \"断言类型(text/visible/contains等)\", \"target\": \"目标元素\", \"expected\": \"期望值\"},\n");
        sb.append("      \"navigate\": {\"url\": \"URL地址\"},\n");
        sb.append("      \"wait\": {\"seconds\": 等待秒数},\n");
        sb.append("      \"extract\": {\"target\": \"目标元素\", \"field\": \"字段名\", \"as\": \"变量名\"},\n");
        sb.append("      \"condition\": {\"variable\": \"变量名\", \"operator\": \"运算符(==/!=/>/</>=/<=)\", \"value\": \"比较值\"},\n");
        sb.append("      \"aiAction\": {\"prompt\": \"自然语言动作描述\"},\n");
        sb.append("      \"aiQuery\": {\"prompt\": \"自然语言查询\", \"as\": \"变量名\"},\n");
        sb.append("      \"aiAssert\": {\"prompt\": \"自然语言断言描述\"}\n");
        sb.append("    }\n");
        sb.append("  ],\n");
        sb.append("  \"edges\": [\n");
        sb.append("    {\n");
        sb.append("      \"id\": \"边ID\",\n");
        sb.append("      \"source\": \"源节点ID\",\n");
        sb.append("      \"target\": \"目标节点ID\"\n");
        sb.append("    }\n");
        sb.append("  ]\n");
        sb.append("}\n\n");

        if (request.getRequirement() != null && !request.getRequirement().isEmpty()) {
            sb.append("需求描述：\n").append(request.getRequirement()).append("\n\n");
        }

        sb.append("请生成完整的流程图，包含开始节点、结束节点，以及完整的业务流程路径。");
        return sb.toString();
    }

    /**
     * 调用 MiniMax API
     */
    private String callMiniMax(String prompt, List<String> images) throws IOException {
        // 构建消息列表
        List<Message> messages = new ArrayList<>();

        // 构建多模态内容
        List<Message.Content> contents = new ArrayList<>();

        // 添加图片
        if (images != null && !images.isEmpty()) {
            for (String image : images) {
                Message.Content content = new Message.Content();
                content.setType("image_url");
                Message.ImageUrl imageUrl = new Message.ImageUrl();
                imageUrl.setUrl(image);
                content.setImage_url(imageUrl);
                contents.add(content);
            }
        }

        // 添加文本
        Message.Content textContent = new Message.Content();
        textContent.setType("text");
        textContent.setText(prompt);
        contents.add(textContent);

        // 添加用户消息（多模态内容）
        messages.add(Message.ofMultiContent("user", contents));

        // 构建请求体
        RequestBody body = RequestBody.create(JSON, objectMapper.writeValueAsString(new ChatRequest(model, messages)));

        Request request = new Request.Builder()
                .url(baseUrl + "/text/chatcompletion_v2")
                .addHeader("Authorization", "Bearer " + API_KEY)
                .addHeader("Content-Type", "application/json")
                .post(body)
                .build();

        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("API 调用失败: " + response);
            }

            String responseBody = response.body().string();
            System.out.println("=== MiniMax API Response ===");
            System.out.println(responseBody);
            System.out.println("============================");
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode choices = root.path("choices");

            if (choices.isArray() && choices.size() > 0) {
                JsonNode message = choices.get(0).path("message");
                return message.path("content").asText();
            }

            throw new IOException("API 响应格式错误");
        }
    }

    /**
     * 解析 AI 响应为流程图
     */
    private TestFlow parseAIMessage(String aiMessage) throws IOException {
        // 尝试解析 JSON
        TestFlow flow = new TestFlow();
        List<FlowNode> nodes = new ArrayList<>();
        List<FlowEdge> edges = new ArrayList<>();

        // 尝试提取 JSON
        int startIdx = aiMessage.indexOf("{");
        int endIdx = aiMessage.lastIndexOf("}");

        if (startIdx >= 0 && endIdx > startIdx) {
            String jsonStr = aiMessage.substring(startIdx, endIdx + 1);
            JsonNode json = objectMapper.readTree(jsonStr);

            // 解析节点
            JsonNode nodesArray = json.path("nodes");
            if (nodesArray.isArray()) {
                for (JsonNode nodeJson : nodesArray) {
                    FlowNode node = parseNode(nodeJson);
                    nodes.add(node);
                }
            }

            // 解析边
            JsonNode edgesArray = json.path("edges");
            if (edgesArray.isArray()) {
                for (JsonNode edgeJson : edgesArray) {
                    FlowEdge edge = parseEdge(edgeJson);
                    edges.add(edge);
                }
            }
        }

        // 如果解析失败，创建默认流程
        if (nodes.isEmpty()) {
            nodes.add(createDefaultStartNode());
            nodes.add(createDefaultEndNode());
            edges.add(createDefaultEdge(nodes.get(0).getId(), nodes.get(1).getId()));
        }

        flow.setNodes(nodes);
        flow.setEdges(edges);

        return flow;
    }

    private FlowNode parseNode(JsonNode nodeJson) {
        FlowNode node = new FlowNode();
        node.setId(nodeJson.path("id").asText(UUID.randomUUID().toString()));
        node.setType(NodeType.valueOf(nodeJson.path("type").asText("Action")));
        node.setLabel(nodeJson.path("label").asText("节点"));
        node.setDescription(nodeJson.path("description").asText(null));

        // 位置
        if (nodeJson.has("position")) {
            java.util.Map<String, Object> position = new java.util.HashMap<>();
            position.put("x", nodeJson.path("position").path("x").asDouble(100));
            position.put("y", nodeJson.path("position").path("y").asDouble(100));
            node.setPosition(position);
        }

        // Action 配置
        if (nodeJson.has("action")) {
            ActionConfig action = new ActionConfig();
            String methodStr = nodeJson.path("action").path("method").asText("click");
            try {
                action.setMethod(ActionMethod.valueOf(methodStr));
            } catch (Exception e) {
                action.setMethod(ActionMethod.click);
            }
            action.setTarget(nodeJson.path("action").path("target").asText(""));
            action.setValue(nodeJson.path("action").path("value").asText(""));
            node.setAction(action);
        }

        // Assert 配置
        if (nodeJson.has("assert")) {
            AssertConfig assertConfig = new AssertConfig();
            String typeStr = nodeJson.path("assert").path("type").asText("text");
            try {
                assertConfig.setType(AssertType.valueOf(typeStr));
            } catch (Exception e) {
                assertConfig.setType(AssertType.text);
            }
            assertConfig.setTarget(nodeJson.path("assert").path("target").asText(""));
            assertConfig.setExpected(nodeJson.path("assert").path("expected").asText(""));
            node.setAssert_(assertConfig);
        }

        // Navigate 配置
        if (nodeJson.has("navigate")) {
            NavigateConfig navigate = new NavigateConfig();
            navigate.setUrl(nodeJson.path("navigate").path("url").asText(""));
            node.setNavigate(navigate);
        }

        // Wait 配置
        if (nodeJson.has("wait")) {
            WaitConfig wait = new WaitConfig();
            wait.setTimeout(nodeJson.path("wait").path("seconds").asInt(1));
            node.setWait(wait);
        }

        // Extract 配置
        if (nodeJson.has("extract")) {
            ExtractConfig extract = new ExtractConfig();
            extract.setTarget(nodeJson.path("extract").path("target").asText(""));
            extract.setField(nodeJson.path("extract").path("field").asText(""));
            extract.setAs(nodeJson.path("extract").path("as").asText(""));
            node.setExtract(extract);
        }

        // Condition 配置
        if (nodeJson.has("condition")) {
            ConditionConfig condition = new ConditionConfig();
            condition.setVariable(nodeJson.path("condition").path("variable").asText(""));
            condition.setOperator(nodeJson.path("condition").path("operator").asText("=="));
            condition.setValue(nodeJson.path("condition").path("value").asText(""));
            node.setCondition(condition);
        }

        // AI Action 配置
        if (nodeJson.has("aiAction")) {
            AIActionConfig aiAction = new AIActionConfig();
            aiAction.setPrompt(nodeJson.path("aiAction").path("prompt").asText(""));
            node.setAiAction(aiAction);
        }

        // AI Query 配置
        if (nodeJson.has("aiQuery")) {
            AIQueryConfig aiQuery = new AIQueryConfig();
            aiQuery.setPrompt(nodeJson.path("aiQuery").path("prompt").asText(""));
            aiQuery.setAs(nodeJson.path("aiQuery").path("as").asText(""));
            node.setAiQuery(aiQuery);
        }

        // AI Assert 配置
        if (nodeJson.has("aiAssert")) {
            AIAssertConfig aiAssert = new AIAssertConfig();
            aiAssert.setPrompt(nodeJson.path("aiAssert").path("prompt").asText(""));
            node.setAiAssert(aiAssert);
        }

        return node;
    }

    private FlowEdge parseEdge(JsonNode edgeJson) {
        FlowEdge edge = new FlowEdge();
        edge.setId(edgeJson.path("id").asText(UUID.randomUUID().toString()));
        edge.setSource(edgeJson.path("source").asText(""));
        edge.setTarget(edgeJson.path("target").asText(""));
        edge.setLabel(edgeJson.path("label").asText(null));
        return edge;
    }

    private FlowNode createDefaultStartNode() {
        FlowNode node = new FlowNode();
        node.setId("start");
        node.setType(NodeType.Start);
        node.setLabel("开始");
        java.util.Map<String, Object> pos = new java.util.HashMap<>();
        pos.put("x", 100);
        pos.put("y", 100);
        node.setPosition(pos);
        return node;
    }

    private FlowNode createDefaultEndNode() {
        FlowNode node = new FlowNode();
        node.setId("end");
        node.setType(NodeType.End);
        node.setLabel("结束");
        java.util.Map<String, Object> pos = new java.util.HashMap<>();
        pos.put("x", 100);
        pos.put("y", 300);
        node.setPosition(pos);
        return node;
    }

    private FlowEdge createDefaultEdge(String source, String target) {
        FlowEdge edge = new FlowEdge();
        edge.setId(UUID.randomUUID().toString());
        edge.setSource(source);
        edge.setTarget(target);
        return edge;
    }

    // 内部类
    private static class ChatRequest {
        private String model;
        private List<Message> messages;

        public ChatRequest(String model, List<Message> messages) {
            this.model = model;
            this.messages = messages;
        }

        public String getModel() { return model; }
        public List<Message> getMessages() { return messages; }
    }

    private static class Message {
        private String role;
        private Object content;

        public Message(String role, Object content) {
            this.role = role;
            this.content = content;
        }

        public String getRole() { return role; }
        public Object getContent() { return content; }

        public static Message ofText(String role, String text) {
            return new Message(role, text);
        }

        public static Message ofMultiContent(String role, List<Content> contents) {
            return new Message(role, contents);
        }

        public static class Content {
            private String type;
            private String text;
            private ImageUrl image_url;

            public Content() {}

            public String getType() { return type; }
            public void setType(String type) { this.type = type; }
            public String getText() { return text; }
            public void setText(String text) { this.text = text; }
            public ImageUrl getImage_url() { return image_url; }
            public void setImage_url(ImageUrl image_url) { this.image_url = image_url; }
        }

        public static class ImageUrl {
            private String url;

            public String getUrl() { return url; }
            public void setUrl(String url) { this.url = url; }
        }
    }
}