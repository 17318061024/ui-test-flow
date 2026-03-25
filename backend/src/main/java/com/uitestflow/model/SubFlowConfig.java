package com.uitestflow.model;

import lombok.Data;
import java.util.Map;

/**
 * 子流程节点配置
 */
@Data
public class SubFlowConfig {
    private String flowId;                 // 子流程ID
    private String flowName;               // 子流程名称（用于展示）
    private Map<String, String> mapping;   // 输入参数映射：{子流程参数名: 当前流程变量名}
    private Map<String, String> outputMapping; // 输出参数映射：{当前流程变量名: 子流程返回值名}
    private Boolean async;                  // 是否异步执行
    private Integer timeout;               // 超时时间（秒）
}