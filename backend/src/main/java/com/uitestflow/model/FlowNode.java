package com.uitestflow.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.Map;

/**
 * 流程节点
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class FlowNode {
    private String id;
    private NodeType type;
    private String label;
    private String description;

    // 节点位置（前端可视化用）
    private Map<String, Object> position;

    // 各类型节点配置
    private ActionConfig action;
    @JsonProperty("assert")
    private AssertConfig assert_;
    private ExtractConfig extract;
    private ConditionConfig condition;
    private SubFlowConfig subFlow;

    // AI 节点配置 (Midscene.js)
    private AIActionConfig aiAction;
    private AIQueryConfig aiQuery;
    private AIAssertConfig aiAssert;

    // 其他节点配置
    private WaitConfig wait;
    private NavigateConfig navigate;
}
