package com.uitestflow.model;

/**
 * AI 查询节点配置 - Midscene.js aiQuery
 */
public class AIQueryConfig {
    private String prompt;       // 自然语言查询
    private String schema;      // 返回数据的 JSON schema 描述
    private String as;          // 保存为变量名

    public String getPrompt() {
        return prompt;
    }

    public void setPrompt(String prompt) {
        this.prompt = prompt;
    }

    public String getSchema() {
        return schema;
    }

    public void setSchema(String schema) {
        this.schema = schema;
    }

    public String getAs() {
        return as;
    }

    public void setAs(String as) {
        this.as = as;
    }
}
