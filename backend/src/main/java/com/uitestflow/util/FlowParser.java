package com.uitestflow.util;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import com.fasterxml.jackson.dataformat.yaml.YAMLGenerator;
import com.uitestflow.dto.ValidationResult;
import com.uitestflow.model.*;
import org.springframework.stereotype.Component;

import java.io.*;
import java.nio.file.*;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 流程解析和验证器
 */
@Component
public class FlowParser {

    private static final Set<NodeType> NODE_TYPES = new HashSet<>(Arrays.asList(
            NodeType.Start, NodeType.End, NodeType.Action, NodeType.Assert,
            NodeType.Extract, NodeType.Condition, NodeType.SubFlow,
            NodeType.AIAction, NodeType.AIQuery, NodeType.AIAssert,
            NodeType.Wait, NodeType.Navigate
    ));

    private static final Set<String> ACTION_METHODS = new HashSet<>(Arrays.asList(
            "click", "input", "select", "hover", "scroll", "wait", "screenshot"
    ));

    private static final Set<String> ASSERT_TYPES = new HashSet<>(Arrays.asList(
            "text", "visible", "hidden", "enabled", "contains"
    ));

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final ObjectMapper yamlObjectMapper;

    public FlowParser() {
        // 配置 JSON 解析器忽略未知字段
        objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

        // 配置 YAML 工厂
        YAMLFactory yamlFactory = YAMLFactory.builder()
                .disable(YAMLGenerator.Feature.WRITE_DOC_START_MARKER)
                .build();
        yamlObjectMapper = new ObjectMapper(yamlFactory);
        yamlObjectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }

    /**
     * 加载流程图文件
     */
    public TestFlow loadFlow(String filePath) throws IOException {
        String content = new String(Files.readAllBytes(Paths.get(filePath)));

        TestFlow flow;
        if (filePath.toLowerCase().endsWith(".yaml") || filePath.toLowerCase().endsWith(".yml")) {
            flow = yamlObjectMapper.readValue(content, TestFlow.class);
        } else if (filePath.toLowerCase().endsWith(".json")) {
            flow = objectMapper.readValue(content, TestFlow.class);
        } else {
            throw new IOException("不支持的文件格式: " + filePath);
        }

        // 验证流程
        validateFlow(flow);

        return flow;
    }

    /**
     * 加载目录下所有流程图
     */
    public List<TestFlow> loadFlows(String dirPath) throws IOException {
        List<TestFlow> flows = new ArrayList<>();

        File dir = new File(dirPath);
        if (!dir.exists() || !dir.isDirectory()) {
            return flows;
        }

        File[] files = dir.listFiles();
        if (files == null) {
            return flows;
        }

        for (File file : files) {
            if (file.isFile() && (file.getName().endsWith(".yaml") ||
                    file.getName().endsWith(".yml") || file.getName().endsWith(".json"))) {
                try {
                    TestFlow flow = loadFlow(file.getAbsolutePath());
                    flows.add(flow);
                } catch (Exception e) {
                    System.out.println("加载流程失败: " + file.getName() + ", " + e.getMessage());
                }
            }
        }

        return flows;
    }

    /**
     * 保存流程图到文件
     */
    public void saveFlow(TestFlow flow, String filePath) throws IOException {
        String content;
        if (filePath.toLowerCase().endsWith(".yaml") || filePath.toLowerCase().endsWith(".yml")) {
            content = yamlObjectMapper.writeValueAsString(flow);
        } else if (filePath.toLowerCase().endsWith(".json")) {
            content = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(flow);
        } else {
            throw new IOException("不支持的文件格式: " + filePath);
        }

        Files.write(Paths.get(filePath), content.getBytes());
    }

    /**
     * 验证流程图
     */
    public ValidationResult validateFlow(TestFlow flow) {
        List<String> errors = new ArrayList<>();

        // 检查必填字段
        if (flow.getId() == null || flow.getId().isEmpty()) {
            errors.add("流程图缺少 id 字段");
        }
        if (flow.getName() == null || flow.getName().isEmpty()) {
            errors.add("流程图缺少 name 字段");
        }
        if (flow.getNodes() == null || flow.getNodes().isEmpty()) {
            errors.add("流程图没有节点");
        }

        // 检查节点
        Set<String> nodeIds = new HashSet<>();
        if (flow.getNodes() != null) {
            for (FlowNode node : flow.getNodes()) {
                if (node.getId() == null || node.getId().isEmpty()) {
                    errors.add("节点缺少 id");
                    continue;
                }
                if (nodeIds.contains(node.getId())) {
                    errors.add("节点 id 重复: " + node.getId());
                }
                nodeIds.add(node.getId());

                if (node.getType() == null) {
                    errors.add("节点 " + node.getId() + " 缺少 type");
                } else if (!NODE_TYPES.contains(node.getType())) {
                    errors.add("节点 " + node.getId() + " 类型无效: " + node.getType());
                } else {
                    // 检查各类型节点的配置
                    switch (node.getType()) {
                        case Action:
                            if (node.getAction() != null && node.getAction().getMethod() != null) {
                                if (!ACTION_METHODS.contains(node.getAction().getMethod().name().toLowerCase())) {
                                    errors.add("Action 节点 " + node.getId() + " method 无效: " + node.getAction().getMethod());
                                }
                            }
                            break;
                        case Assert:
                            if (node.getAssert_() != null && node.getAssert_().getType() != null) {
                                if (!ASSERT_TYPES.contains(node.getAssert_().getType().name().toLowerCase())) {
                                    errors.add("Assert 节点 " + node.getId() + " type 无效: " + node.getAssert_().getType());
                                }
                            }
                            break;
                        default:
                            break;
                    }
                }
            }
        }

        // 检查边的引用
        if (flow.getEdges() != null) {
            for (FlowEdge edge : flow.getEdges()) {
                if (!nodeIds.contains(edge.getSource())) {
                    errors.add("边的源节点不存在: " + edge.getSource());
                }
                if (!nodeIds.contains(edge.getTarget())) {
                    errors.add("边的目标节点不存在: " + edge.getTarget());
                }
            }
        }

        // 检查必须有一个 Start 和 End 节点
        if (flow.getNodes() != null) {
            long startCount = flow.getNodes().stream()
                    .filter(n -> n.getType() == NodeType.Start)
                    .count();
            long endCount = flow.getNodes().stream()
                    .filter(n -> n.getType() == NodeType.End)
                    .count();

            if (startCount == 0) errors.add("缺少 Start 节点");
            if (startCount > 1) errors.add("Start 节点只能有一个");
            if (endCount == 0) errors.add("缺少 End 节点");
        }

        if (errors.isEmpty()) {
            return ValidationResult.success();
        } else {
            return ValidationResult.failure(errors);
        }
    }

    /**
     * 获取节点的所有出边
     */
    public List<FlowEdge> getOutgoingEdges(TestFlow flow, String nodeId) {
        if (flow.getEdges() == null) return Collections.emptyList();
        return flow.getEdges().stream()
                .filter(e -> e.getSource().equals(nodeId))
                .collect(Collectors.toList());
    }

    /**
     * 获取节点的所有入边
     */
    public List<FlowEdge> getIncomingEdges(TestFlow flow, String nodeId) {
        if (flow.getEdges() == null) return Collections.emptyList();
        return flow.getEdges().stream()
                .filter(e -> e.getTarget().equals(nodeId))
                .collect(Collectors.toList());
    }

    /**
     * 根据ID获取节点
     */
    public FlowNode getNodeById(TestFlow flow, String nodeId) {
        if (flow.getNodes() == null) return null;
        return flow.getNodes().stream()
                .filter(n -> n.getId().equals(nodeId))
                .findFirst()
                .orElse(null);
    }

    /**
     * 查找 Start 节点
     */
    public FlowNode findStartNode(TestFlow flow) {
        if (flow.getNodes() == null) return null;
        return flow.getNodes().stream()
                .filter(n -> n.getType() == NodeType.Start)
                .findFirst()
                .orElse(null);
    }

    /**
     * 查找所有 End 节点
     */
    public List<FlowNode> findEndNodes(TestFlow flow) {
        if (flow.getNodes() == null) return Collections.emptyList();
        return flow.getNodes().stream()
                .filter(n -> n.getType() == NodeType.End)
                .collect(Collectors.toList());
    }
}
