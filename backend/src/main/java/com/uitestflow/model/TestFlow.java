package com.uitestflow.model;

import lombok.Data;
import java.util.List;

/**
 * 流程图定义
 */
@Data
public class TestFlow {
    private String id;
    private String name;
    private String description;
    private Integer version;
    private List<String> tags;
    private String author;

    private List<FlowNode> nodes;
    private List<FlowEdge> edges;

    private String createdAt;
    private String updatedAt;
}
