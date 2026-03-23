package com.uitestflow.model;

import lombok.Data;

/**
 * 提取节点配置
 */
@Data
public class ExtractConfig {
    private String target;  // 目标元素
    private String field;   // 提取字段
    private String as;      // 变量名
}
