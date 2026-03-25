package com.uitestflow.model;

import lombok.Data;
import java.util.Map;

/**
 * 循环节点配置
 */
@Data
public class LoopConfig {
    // 语义化描述（推荐）
    private String prompt;

    // 精细控制模式
    private String loopType;               // 循环类型：times/while/forEach/selector
    private Integer times;                 // 循环次数
    private String variable;               // 循环变量名
    private String[] items;                 // 循环项列表
    private String itemsVariable;          // 项列表变量

    // 条件循环
    private Map<String, String> condition;  // 条件：variable/operator/value

    // 选择器循环
    private String selector;               // CSS选择器
    private Integer maxIterations;          // 最大迭代次数

    // 循环内操作
    private Integer iterationDelay;        // 每次循环延迟（毫秒）
    private Boolean continueOnError;       // 失败时继续执行

    // 模式选择
    private Boolean useManualMode;         // 是否强制使用精细模式
}