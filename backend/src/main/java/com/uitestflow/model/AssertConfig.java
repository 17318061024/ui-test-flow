package com.uitestflow.model;

import lombok.Data;

/**
 * 断言节点配置
 */
@Data
public class AssertConfig {
    private AssertType type;
    private String target;    // 目标元素
    private String expected;  // 期望值
}
