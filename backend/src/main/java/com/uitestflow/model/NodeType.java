package com.uitestflow.model;

/**
 * 节点类型枚举
 */
public enum NodeType {
    Start,       // 开始节点
    End,         // 结束节点
    Action,      // 执行操作（传统）
    Assert,      // 断言验证（传统）
    Extract,     // 数据提取（传统）
    Condition,   // 条件分支
    SubFlow,     // 子流程
    AIAction,    // AI 驱动的自然语言交互 (Midscene.js)
    AIQuery,     // AI 驱动的数据提取 (Midscene.js)
    AIAssert,    // AI 驱动的断言验证 (Midscene.js)
    Wait,        // 等待节点
    Navigate     // 导航节点
}
