package com.uitestflow.model;

import lombok.Data;
import java.util.List;
import java.util.Map;

/**
 * 条件节点配置
 */
@Data
public class ConditionConfig {
    // 语义化描述（推荐）
    private String prompt;

    // 精细控制模式
    private String variable;               // 变量名
    private String operator;               // 操作符：==/!=/>/</>=/<=contains/empty/notEmpty
    private String value;                 // 比较值

    // 多条件组合
    private List<Map<String, String>> conditions;  // 多条件列表

    // 页面状态条件
    private String pageUrl;                // URL匹配条件
    private String pageTitle;              // 标题匹配条件
    private String elementExists;          // 元素存在条件
    private String elementVisible;         // 元素可见条件

    // 变量类型条件
    private String variableExists;         // 变量存在
    private String variableEmpty;          // 变量为空

    // 模式选择
    private Boolean useManualMode;         // 是否强制使用精细模式
}