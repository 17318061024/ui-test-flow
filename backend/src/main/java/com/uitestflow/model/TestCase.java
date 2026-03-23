package com.uitestflow.model;

import lombok.Data;
import java.util.List;

/**
 * 生成的测试用例
 */
@Data
public class TestCase {
    private String id;
    private String name;
    private String description;
    private String flowId;
    private List<String> tags;
    private List<TestStep> steps;

    // 元信息
    private String createdAt;
    private List<String> path;  // 路径经过的节点ID
}
