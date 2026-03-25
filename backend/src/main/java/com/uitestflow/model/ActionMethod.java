package com.uitestflow.model;

/**
 * 操作方法枚举
 */
public enum ActionMethod {
    click,           // 点击元素
    doubleClick,     // 双击元素
    rightClick,      // 右键点击
    input,           // 输入文本
    select,          // 选择选项
    hover,           // 悬停元素
    scroll,          // 滚动页面
    scrollIntoView,  // 滚动到元素可见
    wait,            // 等待指定时间
    screenshot,      // 截图
    refresh,         // 刷新页面
    switchFrame,     // 切换iframe
    goto             // 导航到URL
}
