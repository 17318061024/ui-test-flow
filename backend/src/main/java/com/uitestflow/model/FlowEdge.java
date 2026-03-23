package com.uitestflow.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

/**
 * 流程边
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class FlowEdge {
    private String id;
    private String source;
    private String target;
    private String label;      // 显示标签
    private String condition;  // 条件（仅Condition节点使用）
}
