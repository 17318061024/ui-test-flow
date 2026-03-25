package com.uitestflow.model;

import lombok.Data;

/**
 * 日志节点配置
 */
@Data
public class LogConfig {
    // 语义化描述（推荐）
    private String prompt;

    // 精细控制模式
    private String level;                   // 日志级别：log/info/warn/error
    private String message;                  // 日志消息
    private String[] variables;             // 要输出的变量列表

    // 高级选项
    private String template;                 // 日志模板，支持{{变量名}}插值
    private Boolean enableTimestamp;         // 是否包含时间戳
    private Boolean enableScreenshot;        // 是否附带截图

    // 模式选择
    private Boolean useManualMode;           // 是否强制使用精细模式
}