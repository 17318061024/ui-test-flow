package com.uitestflow.model;

import lombok.Data;

/**
 * 等待节点配置
 */
@Data
public class WaitConfig {
    // 语义化描述（推荐）
    private String prompt;

    // 精细控制模式
    private String waitType;               // 等待方式：time/element/network/function
    private Integer timeout;               // 等待时间（秒）
    private String waitFor;                // 等待元素出现
    private Boolean waitForVisible;        // 等待元素可见
    private Boolean waitForHidden;         // 等待元素隐藏
    private Boolean waitForEnabled;        // 等待元素可用

    // 网络等待
    private String waitForRequest;         // 等待特定请求
    private String waitForResponse;        // 等待特定响应

    // 函数等待
    private String waitForFunction;        // JavaScript表达式

    // 模式选择
    private Boolean useManualMode;         // 是否强制使用精细模式
}