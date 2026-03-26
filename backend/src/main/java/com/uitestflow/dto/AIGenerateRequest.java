package com.uitestflow.dto;

import java.util.List;

/**
 * AI 生成流程图的请求体
 */
public class AIGenerateRequest {
    /**
     * 图片列表（Base64 编码或 URL）
     */
    private List<String> images;

    /**
     * 需求描述文档内容
     */
    private String requirement;

    /**
     * 应用名称（可选，用于命名生成的流程）
     */
    private String appName;

    public List<String> getImages() {
        return images;
    }

    public void setImages(List<String> images) {
        this.images = images;
    }

    public String getRequirement() {
        return requirement;
    }

    public void setRequirement(String requirement) {
        this.requirement = requirement;
    }

    public String getAppName() {
        return appName;
    }

    public void setAppName(String appName) {
        this.appName = appName;
    }
}