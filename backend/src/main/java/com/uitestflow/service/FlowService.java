package com.uitestflow.service;

import com.uitestflow.dto.FlowMeta;
import com.uitestflow.dto.ValidationResult;
import com.uitestflow.model.TestFlow;
import com.uitestflow.util.FlowParser;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 流程业务逻辑服务
 */
@Service
public class FlowService {

    private final FlowParser flowParser;

    @Value("${flow.directory:../flows}")
    private String flowDirectory;

    @Value("${output.directory:../output}")
    private String outputDirectory;

    public FlowService(FlowParser flowParser) {
        this.flowParser = flowParser;
    }

    /**
     * 获取流程目录路径
     */
    public String getFlowDirectory() {
        return flowDirectory;
    }

    /**
     * 获取输出目录路径
     */
    public String getOutputDirectory() {
        return outputDirectory;
    }

    /**
     * 确保目录存在
     */
    private void ensureDirectoriesExist() {
        File flowDir = new File(flowDirectory);
        File outputDir = new File(outputDirectory);

        if (!flowDir.exists()) {
            flowDir.mkdirs();
        }
        if (!outputDir.exists()) {
            outputDir.mkdirs();
        }
    }

    /**
     * 获取流程文件路径
     */
    private String getFlowPath(String id) {
        return Paths.get(flowDirectory, id + ".json").toString();
    }

    /**
     * 获取流程元信息
     */
    private FlowMeta getFlowMeta(TestFlow flow) {
        FlowMeta meta = new FlowMeta();
        meta.setId(flow.getId());
        meta.setName(flow.getName());
        meta.setDescription(flow.getDescription());
        meta.setVersion(flow.getVersion());
        meta.setTags(flow.getTags());
        meta.setAuthor(flow.getAuthor());
        meta.setNodeCount(flow.getNodes() != null ? flow.getNodes().size() : 0);
        meta.setCreatedAt(flow.getCreatedAt());
        meta.setUpdatedAt(flow.getUpdatedAt());
        return meta;
    }

    /**
     * 获取所有流程列表
     */
    public List<FlowMeta> getAllFlows() {
        ensureDirectoriesExist();
        List<FlowMeta> metas = new ArrayList<>();

        File flowDir = new File(flowDirectory);
        if (!flowDir.exists() || !flowDir.isDirectory()) {
            return metas;
        }

        File[] files = flowDir.listFiles();
        if (files == null) {
            return metas;
        }

        for (File file : files) {
            if (file.isFile() && (file.getName().endsWith(".json") ||
                    file.getName().endsWith(".yaml") || file.getName().endsWith(".yml"))) {
                try {
                    TestFlow flow = flowParser.loadFlow(file.getAbsolutePath());
                    metas.add(getFlowMeta(flow));
                } catch (Exception e) {
                    System.out.println("加载流程失败: " + file.getName() + ", " + e.getMessage());
                }
            }
        }

        // 按更新时间排序
        return metas.stream()
                .sorted((a, b) -> {
                    if (a.getUpdatedAt() == null && b.getUpdatedAt() == null) return 0;
                    if (a.getUpdatedAt() == null) return 1;
                    if (b.getUpdatedAt() == null) return -1;
                    return b.getUpdatedAt().compareTo(a.getUpdatedAt());
                })
                .collect(Collectors.toList());
    }

    /**
     * 获取单个流程
     */
    public TestFlow getFlow(String id) throws IOException {
        String filePath = getFlowPath(id);
        File file = new File(filePath);

        if (!file.exists()) {
            // 尝试 YAML 格式
            String yamlPath = Paths.get(flowDirectory, id + ".yaml").toString();
            if (!new File(yamlPath).exists()) {
                throw new IOException("流程不存在");
            }
            return flowParser.loadFlow(yamlPath);
        }

        return flowParser.loadFlow(filePath);
    }

    /**
     * 创建流程
     */
    public TestFlow createFlow(TestFlow flow) throws IOException {
        ensureDirectoriesExist();

        // 生成 ID
        if (flow.getId() == null || flow.getId().isEmpty()) {
            flow.setId(UUID.randomUUID().toString());
        }

        // 设置时间戳
        String now = new Date().toString();
        if (flow.getCreatedAt() == null) {
            flow.setCreatedAt(now);
        }
        flow.setUpdatedAt(now);

        // 验证
        ValidationResult validation = flowParser.validateFlow(flow);
        if (!validation.isValid()) {
            throw new IOException("验证失败: " + String.join(", ", validation.getErrors()));
        }

        // 保存
        String filePath = getFlowPath(flow.getId());
        flowParser.saveFlow(flow, filePath);

        return flow;
    }

    /**
     * 更新流程
     */
    public TestFlow updateFlow(String id, TestFlow updates) throws IOException {
        String filePath = getFlowPath(id);
        File file = new File(filePath);

        if (!file.exists()) {
            throw new IOException("流程不存在");
        }

        // 加载现有流程
        TestFlow existingFlow = flowParser.loadFlow(filePath);

        // 合并更新
        existingFlow.setName(updates.getName());
        existingFlow.setDescription(updates.getDescription());
        existingFlow.setVersion(updates.getVersion());
        existingFlow.setTags(updates.getTags());
        existingFlow.setAuthor(updates.getAuthor());
        existingFlow.setNodes(updates.getNodes());
        existingFlow.setEdges(updates.getEdges());
        existingFlow.setUpdatedAt(new Date().toString());

        // 验证
        ValidationResult validation = flowParser.validateFlow(existingFlow);
        if (!validation.isValid()) {
            throw new IOException("验证失败: " + String.join(", ", validation.getErrors()));
        }

        // 保存
        flowParser.saveFlow(existingFlow, filePath);

        return existingFlow;
    }

    /**
     * 删除流程
     */
    public void deleteFlow(String id) throws IOException {
        String filePath = getFlowPath(id);
        File file = new File(filePath);

        if (!file.exists()) {
            throw new IOException("流程不存在");
        }

        Files.delete(file.toPath());
    }

    /**
     * 复制流程
     */
    public TestFlow duplicateFlow(String id) throws IOException {
        String filePath = getFlowPath(id);
        File file = new File(filePath);

        if (!file.exists()) {
            throw new IOException("流程不存在");
        }

        // 加载现有流程
        TestFlow flow = flowParser.loadFlow(filePath);

        // 创建副本
        String newId = UUID.randomUUID().toString();
        flow.setId(newId);
        if (flow.getName() != null) {
            flow.setName(flow.getName() + " (副本)");
        } else {
            flow.setName("流程副本");
        }
        flow.setVersion(1);
        String now = new Date().toString();
        flow.setCreatedAt(now);
        flow.setUpdatedAt(now);

        // 保存
        String newPath = getFlowPath(newId);
        flowParser.saveFlow(flow, newPath);

        return flow;
    }

    /**
     * 导出流程
     */
    public String exportFlow(String id) throws IOException {
        TestFlow flow = getFlow(id);
        return new com.fasterxml.jackson.databind.ObjectMapper()
                .writerWithDefaultPrettyPrinter()
                .writeValueAsString(flow);
    }

    /**
     * 导入流程
     */
    public TestFlow importFlow(String json) throws IOException {
        TestFlow flow = new com.fasterxml.jackson.databind.ObjectMapper()
                .readValue(json, TestFlow.class);

        // 生成新 ID
        flow.setId(UUID.randomUUID().toString());
        String now = new Date().toString();
        flow.setCreatedAt(now);
        flow.setUpdatedAt(now);

        // 验证
        ValidationResult validation = flowParser.validateFlow(flow);
        if (!validation.isValid()) {
            throw new IOException("验证失败: " + String.join(", ", validation.getErrors()));
        }

        // 保存
        String filePath = getFlowPath(flow.getId());
        flowParser.saveFlow(flow, filePath);

        return flow;
    }

    /**
     * 验证流程
     */
    public ValidationResult validateFlow(TestFlow flow) {
        return flowParser.validateFlow(flow);
    }
}
