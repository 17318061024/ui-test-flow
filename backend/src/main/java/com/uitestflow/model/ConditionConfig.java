package com.uitestflow.model;

import lombok.Data;

/**
 * 条件节点配置
 */
@Data
public class ConditionConfig {
    private String variable;      // 判断变量
    private String operator;      // 操作符: ==, !=, contains, empty, notEmpty
    private String value;         // 比较值
}
