package com.uitestflow.model;

import lombok.Data;

/**
 * 测试步骤
 */
@Data
public class TestStep {
    private String id;
    private String type;  // action, assert, extract, wait
    private String description;

    // Action
    private ActionMethod method;
    private String target;
    private String value;

    // Assert
    private AssertType assertType;
    private String expected;

    // Extract
    private String field;
    private String as;

    // Common
    private Integer timeout;
}
