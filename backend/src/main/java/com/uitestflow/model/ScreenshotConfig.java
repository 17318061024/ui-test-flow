package com.uitestflow.model;

import lombok.Data;

/**
 * 截图节点配置
 */
@Data
public class ScreenshotConfig {
    // 语义化描述（推荐）
    private String prompt;

    // 精细控制模式
    private String type;                    // 截图类型：fullPage/viewport/element
    private String path;                    // 保存路径
    private String filename;                // 文件名（支持变量）

    // 元素截图
    private String target;                   // 目标元素描述

    // 截图选项
    private Boolean omitBackground;          // 透明背景
    private String encoding;                 // 编码方式：base64/binary

    // 是否保存到变量
    private String as;                       // 保存为base64变量

    // 模式选择
    private Boolean useManualMode;           // 是否强制使用精细模式
}