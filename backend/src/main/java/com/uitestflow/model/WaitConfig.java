package com.uitestflow.model;

/**
 * 等待节点配置 - 时间或等待元素二选一
 */
public class WaitConfig {
    private Integer timeout;     // 等待时间（秒）
    private String waitFor;      // 等待元素出现

    public Integer getTimeout() {
        return timeout;
    }

    public void setTimeout(Integer timeout) {
        this.timeout = timeout;
    }

    public String getWaitFor() {
        return waitFor;
    }

    public void setWaitFor(String waitFor) {
        this.waitFor = waitFor;
    }
}