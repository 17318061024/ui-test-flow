package com.uitestflow.model;

/**
 * AI 动作节点配置 - Midscene.js aiAction
 */
public class AIActionConfig {
    private String prompt;      // 自然语言指令
    private Integer timeout;    // 超时时间

    public String getPrompt() {
        return prompt;
    }

    public void setPrompt(String prompt) {
        this.prompt = prompt;
    }

    public Integer getTimeout() {
        return timeout;
    }

    public void setTimeout(Integer timeout) {
        this.timeout = timeout;
    }
}
