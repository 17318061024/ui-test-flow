package com.uitestflow.model;

import lombok.Data;
import java.util.Map;

/**
 * 子流程节点配置
 */
@Data
public class SubFlowConfig {
    private String flowId;              // 引用的流程图ID
    private Map<String, String> mapping; // 参数映射
}
