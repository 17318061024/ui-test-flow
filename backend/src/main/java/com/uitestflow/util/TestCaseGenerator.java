package com.uitestflow.util;

import com.uitestflow.model.*;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * 测试用例生成引擎
 * 核心算法：遍历流程图，生成所有可能的测试路径
 */
@Component
public class TestCaseGenerator {

    private final FlowParser flowParser;

    public TestCaseGenerator(FlowParser flowParser) {
        this.flowParser = flowParser;
    }

    /**
     * 从流程图生成所有测试用例
     */
    public List<TestCase> generateTestCases(TestFlow flow, Map<String, TestFlow> allFlows) {
        List<TestCase> cases = new ArrayList<>();
        FlowNode startNode = flowParser.findStartNode(flow);

        if (startNode == null) {
            System.out.println("流程图缺少 Start 节点");
            return cases;
        }

        List<List<FlowNode>> allPaths = findAllPaths(flow, startNode.getId(), allFlows);

        for (int i = 0; i < allPaths.size(); i++) {
            List<FlowNode> path = allPaths.get(i);
            TestCase testCase = pathToTestCase(flow, path, i + 1);
            cases.add(testCase);
        }

        return cases;
    }

    /**
     * 查找所有从起点到终点的路径
     */
    private List<List<FlowNode>> findAllPaths(TestFlow flow, String startId,
                                              Map<String, TestFlow> allFlows) {
        List<List<FlowNode>> paths = new ArrayList<>();
        Set<String> visitedSubFlows = new HashSet<>();

        dfs(flow, startId, new ArrayList<>(), paths, allFlows, visitedSubFlows);

        return paths;
    }

    private void dfs(TestFlow flow, String currentNodeId, List<FlowNode> currentPath,
                      List<List<FlowNode>> paths, Map<String, TestFlow> allFlows,
                      Set<String> visitedSubFlows) {
        FlowNode node = flowParser.getNodeById(flow, currentNodeId);
        if (node == null) return;

        // 处理子流程展开
        if (node.getType() == NodeType.SubFlow) {
            String subFlowId = node.getSubFlow() != null ? node.getSubFlow().getFlowId() : null;

            // 如果 flowId 为空，视为普通节点处理
            if (subFlowId == null || subFlowId.trim().isEmpty()) {
                currentPath.add(node);
            } else if (!visitedSubFlows.contains(subFlowId) && allFlows != null) {
                // 有有效的 flowId，展开子流程
                TestFlow subFlow = allFlows.get(subFlowId);
                if (subFlow != null) {
                    visitedSubFlows.add(subFlowId);
                    FlowNode subStart = flowParser.findStartNode(subFlow);
                    if (subStart != null) {
                        List<List<FlowNode>> subPaths = findAllPaths(subFlow, subStart.getId(), allFlows);
                        for (List<FlowNode> subPath : subPaths) {
                            List<FlowNode> newPath = new ArrayList<>(currentPath);
                            newPath.add(node);
                            newPath.addAll(subPath);
                            dfs(flow, subPath.get(subPath.size() - 1).getId(), newPath, paths, allFlows, visitedSubFlows);
                        }
                        visitedSubFlows.remove(subFlowId);
                        return;
                    }
                }
            }
        }

        // 只有未被添加到路径的节点才添加
        boolean alreadyInPath = currentPath.stream().anyMatch(n -> n.getId().equals(node.getId()));
        if (!alreadyInPath) {
            currentPath.add(node);
        }

        if (node.getType() == NodeType.End) {
            paths.add(new ArrayList<>(currentPath));
            return;
        }

        List<FlowEdge> edges = flowParser.getOutgoingEdges(flow, currentNodeId);
        if (edges.isEmpty()) return;

        // 处理条件分支：每个分支都展开
        if (node.getType() == NodeType.Condition) {
            for (FlowEdge edge : edges) {
                String branchLabel = edge.getLabel();
                if (branchLabel == null && node.getCondition() != null) {
                    branchLabel = node.getCondition().getValue();
                }
                if (branchLabel == null) branchLabel = "";

                FlowNode branchNode = new FlowNode();
                branchNode.setId(edge.getId() + "_branch");
                branchNode.setType(NodeType.Action);
                branchNode.setLabel(branchLabel);

                ActionConfig actionConfig = new ActionConfig();
                actionConfig.setMethod(ActionMethod.wait);
                actionConfig.setTarget("条件分支");
                actionConfig.setValue(branchLabel);
                branchNode.setAction(actionConfig);

                List<FlowNode> newPath = new ArrayList<>(currentPath);
                newPath.add(branchNode);
                dfs(flow, edge.getTarget(), newPath, paths, allFlows, visitedSubFlows);
            }
        } else {
            // 处理所有出边（非条件分支）
            for (FlowEdge edge : edges) {
                dfs(flow, edge.getTarget(), new ArrayList<>(currentPath), paths, allFlows, visitedSubFlows);
            }
        }
    }

    /**
     * 将路径转换为测试用例
     */
    private TestCase pathToTestCase(TestFlow flow, List<FlowNode> path, int index) {
        List<TestStep> steps = new ArrayList<>();
        List<String> tags = new ArrayList<>();
        if (flow.getTags() != null) {
            tags.addAll(flow.getTags());
        }

        for (FlowNode node : path) {
            if (node.getType() == NodeType.Start || node.getType() == NodeType.End) continue;
            TestStep step = nodeToStep(node);
            if (step != null) steps.add(step);
        }

        TestCase testCase = new TestCase();
        testCase.setId("TC-" + String.format("%03d", index));
        testCase.setName(generateCaseName(path));
        testCase.setDescription("从流程图 \"" + flow.getName() + "\" 生成");
        testCase.setFlowId(flow.getId());
        testCase.setTags(tags);
        testCase.setSteps(steps);
        testCase.setCreatedAt(new Date().toString());
        testCase.setPath(new ArrayList<>());
        for (FlowNode node : path) {
            testCase.getPath().add(node.getId());
        }

        return testCase;
    }

    /**
     * 生成用例名称 - 根据路径唯一性生成区分的名称
     */
    private String generateCaseName(List<FlowNode> path) {
        List<String> parts = new ArrayList<>();

        // 收集关键节点信息用于区分不同路径
        for (FlowNode node : path) {
            if (node.getType() == NodeType.Start || node.getType() == NodeType.End) continue;

            // 处理条件分支标记节点（由系统生成）
            if (node.getId().contains("_branch")) {
                String value = node.getAction() != null ? node.getAction().getValue() : "";
                if (value != null && !value.isEmpty()) {
                    // 截取有意义的分支描述
                    if (value.length() > 10) {
                        parts.add(value.substring(0, 8));
                    } else {
                        parts.add(value);
                    }
                }
                continue;
            }

            if (node.getType() == NodeType.Action) {
                String label = node.getLabel();
                if (label != null && !label.isEmpty()) {
                    // 截取前几个字
                    parts.add(label.length() > 6 ? label.substring(0, 6) : label);
                }
            } else if (node.getType() == NodeType.Assert) {
                parts.add("验证");
            } else if (node.getType() == NodeType.Condition) {
                // 条件节点使用 prompt 或标签
                if (node.getCondition() != null) {
                    String condText = node.getCondition().getPrompt();
                    if (condText == null || condText.isEmpty()) {
                        condText = node.getLabel();
                    }
                    if (condText != null && !condText.isEmpty()) {
                        parts.add(condText.length() > 6 ? condText.substring(0, 6) : condText);
                    }
                }
            }
        }

        // 如果没有有效部分，使用路径长度
        if (parts.isEmpty()) {
            return "测试用例_" + path.size();
        }

        // 组合名称
        String name = String.join("_", parts);
        if (name.length() > 50) {
            name = name.substring(0, 47) + "...";
        }
        return name;
    }

    /**
     * 将节点转换为测试步骤
     */
    private TestStep nodeToStep(FlowNode node) {
        TestStep step = new TestStep();
        step.setId(UUID.randomUUID().toString());
        step.setType("action");
        step.setDescription(node.getLabel());

        switch (node.getType()) {
            case Action:
                step.setType("action");
                if (node.getAction() != null) {
                    step.setMethod(node.getAction().getMethod());
                    step.setTarget(node.getAction().getTarget() != null ?
                            node.getAction().getTarget() : node.getLabel());
                    step.setValue(node.getAction().getValue());
                }
                break;
            case Assert:
                step.setType("assert");
                if (node.getAssert_() != null) {
                    step.setAssertType(node.getAssert_().getType());
                    step.setTarget(node.getAssert_().getTarget() != null ?
                            node.getAssert_().getTarget() : node.getLabel());
                    step.setExpected(node.getAssert_().getExpected());
                }
                break;
            case Extract:
                step.setType("extract");
                if (node.getExtract() != null) {
                    step.setTarget(node.getExtract().getTarget());
                    step.setAs(node.getExtract().getAs());
                }
                break;
            case SubFlow:
                step.setType("action");
                step.setMethod(ActionMethod.wait);
                step.setTarget("子流程");
                step.setValue(node.getSubFlow() != null ?
                        (node.getSubFlow().getFlowId() != null ? node.getSubFlow().getFlowId() : "(空)") : "(空)");
                step.setDescription("[子流程] " + node.getLabel());
                break;
            case Condition:
                step.setType("action");
                step.setMethod(ActionMethod.wait);
                step.setTarget("条件判断");
                if (node.getCondition() != null) {
                    ConditionConfig cond = node.getCondition();
                    // 优先使用 prompt，其次使用结构化配置
                    if (cond.getPrompt() != null && !cond.getPrompt().isEmpty()) {
                        step.setValue(cond.getPrompt());
                    } else if (cond.getVariable() != null) {
                        String val = cond.getVariable();
                        if (cond.getOperator() != null) val += " " + cond.getOperator();
                        if (cond.getValue() != null) val += " " + cond.getValue();
                        step.setValue(val);
                    } else {
                        step.setValue(node.getLabel());
                    }
                } else {
                    step.setValue(node.getLabel());
                }
                step.setDescription("[条件] " + node.getLabel());
                break;
            default:
                return null;
        }

        return step;
    }
}
