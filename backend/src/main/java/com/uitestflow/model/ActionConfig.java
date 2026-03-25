package com.uitestflow.model;

import lombok.Data;

/**
 * 操作节点配置
 */
@Data
public class ActionConfig {
    // 语义化描述（推荐）
    private String prompt;

    // 精细控制模式
    private ActionMethod method;           // 操作方法
    private String target;                 // 目标元素描述
    private String value;                  // 操作值
    private Boolean isVariable;            // value是否为变量引用

    // 选择操作
    private String selectBy;               // 选择方式：value/text/index
    private String[] selectOptions;        // 多选选项列表

    // 滚动选项
    private String scrollDirection;        // 滚动方向：up/down/left/right
    private Integer scrollAmount;         // 滚动距离
    private Boolean scrollIntoView;        // 滚动到元素可见

    // Frame操作
    private String frameSelector;          // Frame选择器
    private Integer frameIndex;            // Frame索引

    // 键盘操作
    private String[] modifiers;            // 修饰键：Alt/Control/Meta/Shift
    private String press;                  // 按键：Enter/Escape/ArrowDown等

    // 拖拽操作
    private String dragTo;                 // 拖拽到目标元素

    // 上传操作
    private String uploadFile;             // 上传文件路径
    private Boolean multiple;             // 是否多选文件

    // 时间设置
    private Integer timeout;               // 超时时间（秒）
    private Integer delay;                 // 操作前延迟（毫秒）

    // 强制选项
    private Boolean force;                 // 强制执行
    private Boolean noWaitAfter;           // 操作后不等待

    // 模式选择
    private Boolean useManualMode;         // 是否强制使用精细模式
}