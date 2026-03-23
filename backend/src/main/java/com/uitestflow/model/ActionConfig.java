package com.uitestflow.model;

import lombok.Data;

/**
 * 操作节点配置
 */
@Data
public class ActionConfig {
    private ActionMethod method;
    private String target;      // 目标元素描述（AI理解用）
    private String value;      // 输入值或配置
    private Integer timeout;   // 超时时间
}
