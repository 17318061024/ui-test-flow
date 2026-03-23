package com.uitestflow.model;

/**
 * 断言类型枚举
 */
public enum AssertType {
    text,      // 检查文本
    visible,   // 元素可见
    hidden,    // 元素隐藏
    enabled,   // 元素可用
    contains   // 包含文本
}
