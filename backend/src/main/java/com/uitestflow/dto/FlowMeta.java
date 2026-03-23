package com.uitestflow.dto;

import lombok.Data;
import java.util.List;

/**
 * 流程元信息（列表展示用）
 */
@Data
public class FlowMeta {
    private String id;
    private String name;
    private String description;
    private Integer version;
    private List<String> tags;
    private String author;
    private Integer nodeCount;
    private String createdAt;
    private String updatedAt;
}
