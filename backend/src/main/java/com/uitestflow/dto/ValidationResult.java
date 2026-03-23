package com.uitestflow.dto;

import lombok.Data;
import java.util.List;

/**
 * 验证结果
 */
@Data
public class ValidationResult {
    private boolean valid;
    private List<String> errors;

    public static ValidationResult success() {
        ValidationResult result = new ValidationResult();
        result.setValid(true);
        return result;
    }

    public static ValidationResult failure(List<String> errors) {
        ValidationResult result = new ValidationResult();
        result.setValid(false);
        result.setErrors(errors);
        return result;
    }
}
