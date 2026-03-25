/**
 * 测试用例生成引擎
 * 核心算法：遍历流程图，生成所有可能的测试路径
 */

import { v4 as uuidv4 } from 'uuid';
import {
  TestFlow,
  FlowNode,
  TestCase,
  TestStep,
} from './types.js';
import { getOutgoingEdges, getNodeById, findStartNode } from './flow-parser.js';

/**
 * 从流程图生成所有测试用例
 */
export function generateTestCases(flow: TestFlow, allFlows?: Map<string, TestFlow>): TestCase[] {
  const cases: TestCase[] = [];
  const startNode = findStartNode(flow);

  if (!startNode) {
    console.warn('流程图缺少 Start 节点');
    return cases;
  }

  const allPaths = findAllPaths(flow, startNode.id, allFlows);

  for (let i = 0; i < allPaths.length; i++) {
    const path = allPaths[i];
    const testCase = pathToTestCase(flow, path, i + 1);
    cases.push(testCase);
  }

  return cases;
}

/**
 * 查找所有从起点到终点的路径
 * @param maxPathLength 限制最大路径长度，防止无限递归
 */
function findAllPaths(
  flow: TestFlow,
  startId: string,
  allFlows?: Map<string, TestFlow>,
  visitedSubFlows: Set<string> = new Set(),
  maxPathLength: number = 100
): FlowNode[][] {
  const paths: FlowNode[][] = [];

  function dfs(currentNodeId: string, currentPath: FlowNode[], visitedInPath: Set<string>) {
    const node = getNodeById(flow, currentNodeId);
    if (!node) return;

    // 循环检测：如果节点已在当前路径中，说明形成循环，停止递归
    if (visitedInPath.has(currentNodeId)) {
      return;
    }

    // 路径长度限制：防止无限增长
    if (currentPath.length >= maxPathLength) {
      console.warn(`路径长度超过限制 ${maxPathLength}，截断处理`);
      return;
    }

    // 处理子流程展开
    if (node.type === 'SubFlow') {
      const subFlowId = node.subFlow?.flowId;

      // 如果 flowId 为空，视为普通节点处理：添加到路径并继续
      if (!subFlowId || subFlowId.trim() === '') {
        currentPath.push(node);
        visitedInPath.add(currentNodeId);
      } else if (!visitedSubFlows.has(subFlowId) && allFlows) {
        // 有有效的 flowId，展开子流程
        const subFlow = allFlows.get(subFlowId);
        if (subFlow) {
          visitedSubFlows.add(subFlowId);
          const subStart = subFlow.nodes.find(n => n.type === 'Start');
          if (subStart) {
            const subPaths = findAllPaths(subFlow, subStart.id, allFlows, visitedSubFlows, maxPathLength);
            for (const subPath of subPaths) {
              dfs(subPath[subPath.length - 1].id, [...currentPath, node, ...subPath], new Set(visitedInPath));
            }
            visitedSubFlows.delete(subFlowId);
            return;
          }
        }
      }
    }

    // 添加节点到路径
    currentPath.push(node);
    visitedInPath.add(currentNodeId);

    if (node.type === 'End') {
      paths.push([...currentPath]);
      return;
    }

    const edges = getOutgoingEdges(flow, currentNodeId);
    if (edges.length === 0) return;

    // 处理条件分支：每个分支都展开
    if (node.type === 'Condition') {
      for (const edge of edges) {
        const branchLabel = edge.label || node.condition?.value || '';
        const branchNode: FlowNode = {
          id: `${edge.id}_branch`,
          type: 'Action',
          label: branchLabel,
          action: {
            method: 'wait',
            target: '条件分支',
            value: branchLabel
          }
        };
        dfs(edge.target, [...currentPath, branchNode], new Set(visitedInPath));
      }
    } else {
      // 处理所有出边（非条件分支）
      for (const edge of edges) {
        dfs(edge.target, [...currentPath], new Set(visitedInPath));
      }
    }
  }

  const startNode = getNodeById(flow, startId);
  if (startNode) {
    dfs(startId, [], new Set());
  }

  return paths;
}

/**
 * 将路径转换为测试用例
 */
function pathToTestCase(flow: TestFlow, path: FlowNode[], index: number): TestCase {
  const steps: TestStep[] = [];
  const tags = [...(flow.tags || [])];

  for (const node of path) {
    if (node.type === 'Start' || node.type === 'End') continue;
    const step = nodeToStep(node);
    if (step) steps.push(step);
  }

  return {
    id: `TC-${String(index).padStart(3, '0')}`,
    name: generateCaseName(path),
    description: `从流程图 "${flow.name}" 生成`,
    flowId: flow.id,
    tags,
    steps,
    createdAt: new Date().toISOString(),
    path: path.map(n => n.id)
  };
}

/**
 * 生成用例名称
 */
function generateCaseName(path: FlowNode[]): string {
  const parts: string[] = [];
  let lastLabel = '';

  for (let i = 0; i < path.length; i++) {
    const node = path[i];
    if (node.type === 'Start' || node.type === 'End') continue;

    // 跳过条件分支标记节点（由系统生成）
    if (node.id.includes('_branch')) {
      // 使用边的标签作为分支说明
      const value = node.action?.value || '';
      if (value) {
        parts.push(`分支${value}`);
      }
      continue;
    }

    if (node.type === 'Action') {
      let label = node.label;
      // 避免重复标签
      if (label === lastLabel) continue;
      lastLabel = label;
      parts.push(label);
    } else if (node.type === 'Assert') {
      parts.push(`验证${node.label}`);
    } else if (node.type === 'Condition') {
      // 条件节点不直接显示在名称中，分支会处理
    }
  }

  const name = parts.slice(0, 4).join('_');
  return name.length > 50 ? name.substring(0, 47) + '...' : name || `测试用例_${path.length}`;
}

/**
 * 将节点转换为测试步骤
 */
function nodeToStep(node: FlowNode): TestStep | null {
  const step: TestStep = {
    id: uuidv4(),
    type: 'action',
    description: node.label
  };

  switch (node.type) {
    case 'Action':
      step.type = 'action';
      step.method = node.action?.method;
      step.target = node.action?.target || node.label;
      step.value = node.action?.value;
      break;
    case 'Assert':
      step.type = 'assert';
      step.assertType = node.assert?.type;
      step.target = node.assert?.target || node.label;
      step.expected = node.assert?.expected;
      break;
    case 'Extract':
      step.type = 'extract';
      step.target = node.extract?.target;
      step.as = node.extract?.as;
      break;
    case 'SubFlow':
      // 处理子流程节点
      step.type = 'action';
      step.method = 'wait';
      step.target = '子流程';
      step.value = node.subFlow?.flowId || '(空)';
      step.description = `[子流程] ${node.label}`;
      break;
    case 'Condition':
      // 处理条件节点
      step.type = 'action';
      step.method = 'wait';
      step.target = '条件判断';
      step.value = node.condition?.variable ? `${node.condition.variable} ${node.condition.operator} ${node.condition.value}` : node.label;
      step.description = `[条件] ${node.label}`;
      break;
    default:
      return null;
  }

  return step;
}
