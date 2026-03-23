package com.uitestflow.model;

/**
 * 导航节点配置
 */
public class NavigateConfig {
    private String url;          // 目标 URL
    private String waitUntil;   // 等待策略：load、domcontentloaded、networkidle

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getWaitUntil() {
        return waitUntil;
    }

    public void setWaitUntil(String waitUntil) {
        this.waitUntil = waitUntil;
    }
}
