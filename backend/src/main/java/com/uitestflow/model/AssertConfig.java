package com.uitestflow.model;

import lombok.Data;
import java.util.List;

/**
 * 断言节点配置
 */
@Data
public class AssertConfig {
    // 语义化描述（推荐）
    private String prompt;

    // 精细控制模式
    private AssertType type;               // 断言类型
    private String target;                 // 目标元素
    private String expected;               // 期望值
    private Boolean isVariable;            // 期望值是否为变量引用
    private Boolean not;                   // 取反
    private Boolean ignoreCase;             // 忽略大小写
    private Integer timeout;               // 超时时间（秒）

    // 多条件断言
    private List<AssertCondition> conditions;

    // 软断言
    private Boolean soft;                  // 是否为软断言（失败继续执行）

    // 截图验证
    private Boolean screenshot;            // 是否截图保存

    // 错误消息
    private String message;                 // 自定义错误消息

    // 模式选择
    private Boolean useManualMode;         // 是否强制使用精细模式
}

/**
 * 断言条件配置
 */
@Data
class AssertCondition {
    private AssertType type;               // 断言类型
    private String target;                  // 目标元素
    private String expected;                // 期望值
    private Boolean isVariable;             // 期望值是否为变量
    private Boolean not;                   // 取反
    private Integer timeout;                // 超时时间
    private String message;                 // 自定义错误消息
}
