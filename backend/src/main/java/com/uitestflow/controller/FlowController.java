package com.uitestflow.controller;

import com.uitestflow.dto.AIGenerateRequest;
import com.uitestflow.dto.FlowMeta;
import com.uitestflow.model.TestCase;
import com.uitestflow.model.TestFlow;
import com.uitestflow.service.AIFlowService;
import com.uitestflow.service.FlowService;
import com.uitestflow.service.TestCaseService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST API 控制器
 */
@RestController
@RequestMapping("/api")
public class FlowController {

    private final FlowService flowService;
    private final TestCaseService testCaseService;
    private final AIFlowService aiFlowService;

    public FlowController(FlowService flowService, TestCaseService testCaseService, AIFlowService aiFlowService) {
        this.flowService = flowService;
        this.testCaseService = testCaseService;
        this.aiFlowService = aiFlowService;
    }

    /**
     * 获取流程列表
     */
    @GetMapping("/flows")
    public ResponseEntity<List<FlowMeta>> getFlows() {
        try {
            List<FlowMeta> flows = flowService.getAllFlows();
            return ResponseEntity.ok(flows);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 获取单个流程
     */
    @GetMapping("/flows/{id}")
    public ResponseEntity<?> getFlow(@PathVariable String id) {
        try {
            TestFlow flow = flowService.getFlow(id);
            return ResponseEntity.ok(flow);
        } catch (IOException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * 创建流程
     */
    @PostMapping("/flows")
    public ResponseEntity<?> createFlow(@RequestBody TestFlow flow) {
        try {
            TestFlow created = flowService.createFlow(flow);
            return ResponseEntity.ok(created);
        } catch (IOException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * 更新流程
     */
    @PutMapping("/flows/{id}")
    public ResponseEntity<?> updateFlow(@PathVariable String id, @RequestBody TestFlow updates) {
        try {
            TestFlow updated = flowService.updateFlow(id, updates);
            return ResponseEntity.ok(updated);
        } catch (IOException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", e.getMessage());
            if (e.getMessage().contains("不存在")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * 删除流程
     */
    @DeleteMapping("/flows/{id}")
    public ResponseEntity<?> deleteFlow(@PathVariable String id) {
        try {
            flowService.deleteFlow(id);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            return ResponseEntity.ok(result);
        } catch (IOException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * 复制流程
     */
    @PostMapping("/flows/{id}/duplicate")
    public ResponseEntity<?> duplicateFlow(@PathVariable String id) {
        try {
            TestFlow duplicated = flowService.duplicateFlow(id);
            return ResponseEntity.ok(duplicated);
        } catch (IOException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * 导出流程
     */
    @GetMapping("/flows/{id}/export")
    public ResponseEntity<?> exportFlow(@PathVariable String id) {
        try {
            String content = flowService.exportFlow(id);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(content);
        } catch (IOException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * 导入流程
     */
    @PostMapping("/flows/import")
    public ResponseEntity<?> importFlow(@RequestBody Map<String, String> request) {
        try {
            String json = request.get("json");
            TestFlow flow = flowService.importFlow(json);
            return ResponseEntity.ok(flow);
        } catch (IOException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * AI 生成流程图
     */
    @PostMapping("/flows/ai-generate")
    public ResponseEntity<?> generateFlowFromAI(@RequestBody AIGenerateRequest request) {
        try {
            TestFlow flow = aiFlowService.generateFlow(request);
            return ResponseEntity.ok(flow);
        } catch (IOException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", "AI 生成流程图失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", "AI 生成流程图失败: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * 生成测试用例
     */
    @PostMapping("/flows/{id}/generate")
    public ResponseEntity<?> generateTestCases(@PathVariable String id) {
        try {
            List<TestCase> testCases = testCaseService.generateTestCases(id);
            return ResponseEntity.ok(testCases);
        } catch (IOException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * 获取测试用例列表
     */
    @GetMapping("/test-cases")
    public ResponseEntity<?> getTestCases() {
        try {
            List<TestCase> testCases = testCaseService.getTestCases();
            return ResponseEntity.ok(testCases);
        } catch (IOException e) {
            return ResponseEntity.ok(new java.util.ArrayList<>());
        }
    }

    /**
     * 导出测试用例
     */
    @GetMapping("/flows/{id}/export-cases")
    public ResponseEntity<?> exportTestCases(
            @PathVariable String id,
            @RequestParam(defaultValue = "json") String format) {
        try {
            String content = testCaseService.exportTestCases(id, format);

            MediaType mediaType;
            switch (format) {
                case "yaml":
                    mediaType = MediaType.parseMediaType("text/yaml");
                    break;
                case "script":
                    mediaType = MediaType.parseMediaType("application/javascript");
                    break;
                default:
                    mediaType = MediaType.APPLICATION_JSON;
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(mediaType);
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(content);
        } catch (IOException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
}
