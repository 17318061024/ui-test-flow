package com.uitestflow.model;

import lombok.Data;
import java.util.Map;

/**
 * 变量节点配置
 */
@Data
public class VariableConfig {
    // 语义化描述（推荐）
    private String prompt;

    // 精细控制模式
    private String operation;              // 操作类型：set/update/delete/clear
    private String name;                    // 变量名
    private Object value;                   // 变量值
    private Boolean isExpression;          // value是否为表达式

    // 运算操作
    private String operator;                // 运算操作符：+/-*/%/=
    private String operand;                 // 运算操作数

    // 数组/对象操作
    private Boolean arrayPush;              // 数组推入
    private Boolean arrayPop;               // 数组弹出
    private Map<String, Object> objectAssign; // 对象合并

    // 默认值
    private Object defaultValue;            // 默认值（变量不存在时）

    // 模式选择
    private Boolean useManualMode;         // 是否强制使用精细模式
}