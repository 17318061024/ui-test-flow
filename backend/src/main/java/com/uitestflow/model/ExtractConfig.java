package com.uitestflow.model;

import lombok.Data;

/**
 * 提取节点配置
 */
@Data
public class ExtractConfig {
    // 语义化描述（推荐）
    private String prompt;

    // 精细控制模式
    private String target;                 // 目标元素
    private String field;                  // 提取字段：innerText/value/href/src等
    private String as;                     // 保存为变量名

    // 提取选项
    private Boolean multiple;              // 是否提取多个元素
    private Integer index;                // 多个元素时的索引
    private String regex;                 // 正则表达式提取

    // JSON提取
    private String jsonPath;               // JSON路径

    // 页面级提取
    private Boolean pageTitle;            // 提取页面标题
    private Boolean pageUrl;               // 提取页面URL
    private Boolean pageCookies;          // 提取页面Cookies
    private String localStorage;          // 提取localStorage项
    private String sessionStorage;        // 提取sessionStorage项

    // 截图提取
    private Boolean screenshot;           // 是否同时截图

    // 模式选择
    private Boolean useManualMode;        // 是否强制使用精细模式
}