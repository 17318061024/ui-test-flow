package com.uitestflow.model;

import lombok.Data;
import java.util.Map;

/**
 * 导航节点配置
 */
@Data
public class NavigateConfig {
    // 语义化描述（推荐）
    private String prompt;

    // 精细控制模式
    private String url;                     // 目标URL
    private Boolean isVariable;            // URL是否为变量引用
    private String waitUntil;              // 等待策略：load/domcontentloaded/networkidle
    private Integer timeout;               // 超时时间（秒）
    private String referer;                 // Referer头
    private Map<String, String> headers;    // 自定义请求头

    // 模式选择
    private Boolean useManualMode;         // 是否强制使用精细模式
}