package com.uitestflow.model;

import lombok.Data;
import java.util.Map;

/**
 * 脚本节点配置
 */
@Data
public class ScriptConfig {
    // 语义化描述（推荐）
    private String prompt;

    // 精细控制模式
    private String script;                  // JavaScript代码
    private Boolean async;                  // 是否异步执行

    // 脚本参数
    private Map<String, Object> params;      // 输入参数

    // 脚本结果
    private String as;                       // 保存结果为变量名

    // 错误处理
    private Boolean throwError;             // 是否抛出错误

    // 模式选择
    private Boolean useManualMode;          // 是否强制使用精细模式
}