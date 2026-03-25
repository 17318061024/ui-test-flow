/**
 * 流程解析和验证器
 */

import * as yaml from 'js-yaml';
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, basename } from 'path';
import {
  TestFlow,
  FlowNode,
  FlowEdge,
  NodeType
} from './types.js';

// 节点类型验证
const NODE_TYPES: NodeType[] = ['Start', 'End', 'Action', 'Assert', 'Extract', 'Condition', 'SubFlow', 'Wait', 'Navigate'];
const ACTION_METHODS = ['click', 'input', 'select', 'hover', 'scroll', 'wait', 'screenshot'];
const ASSERT_TYPES = ['text', 'visible', 'hidden', 'enabled', 'contains'];

/**
 * 加载流程图文件
 */
export function loadFlow(filePath: string): TestFlow {
  const content = readFileSync(filePath, 'utf-8');
  const ext = filePath.toLowerCase();

  let flow: TestFlow;
  if (ext.endsWith('.yaml') || ext.endsWith('.yml')) {
    flow = yaml.load(content) as TestFlow;
  } else if (ext.endsWith('.json')) {
    flow = JSON.parse(content);
  } else {
    throw new Error(`不支持的文件格式: ${filePath}`);
  }

  // 验证流程
  validateFlow(flow);

  return flow;
}

/**
 * 加载目录下所有流程图
 */
export function loadFlows(dirPath: string): TestFlow[] {
  const flows: TestFlow[] = [];

  if (!existsSync(dirPath)) {
    return flows;
  }

  const files = readdirSync(dirPath);
  for (const file of files) {
    const filePath = join(dirPath, file);
    const stat = statSync(filePath);

    if (stat.isFile() && (file.endsWith('.yaml') || file.endsWith('.yml') || file.endsWith('.json'))) {
      try {
        const flow = loadFlow(filePath);
        flows.push(flow);
      } catch (e) {
        console.warn(`加载流程失败: ${file}`, e);
      }
    }
  }

  return flows;
}

/**
 * 保存流程图到文件
 */
export function saveFlow(flow: TestFlow, filePath: string): void {
  const ext = filePath.toLowerCase();

  let content: string;
  if (ext.endsWith('.yaml') || ext.endsWith('.yml')) {
    content = yaml.dump(flow, { indent: 2, lineWidth: 120 });
  } else if (ext.endsWith('.json')) {
    content = JSON.stringify(flow, null, 2);
  } else {
    throw new Error(`不支持的文件格式: ${filePath}`);
  }

  writeFileSync(filePath, content, 'utf-8');
}

/**
 * 验证流程图
 */
export function validateFlow(flow: TestFlow): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 检查必填字段
  if (!flow.id) errors.push('流程图缺少 id 字段');
  if (!flow.name) errors.push('流程图缺少 name 字段');
  if (!flow.nodes || flow.nodes.length === 0) errors.push('流程图没有节点');
  // 边不是必填的，允许空流程图

  // 检查节点
  const nodeIds = new Set<string>();
  for (const node of flow.nodes || []) {
    if (!node.id) {
      errors.push('节点缺少 id');
      continue;
    }
    if (nodeIds.has(node.id)) {
      errors.push(`节点 id 重复: ${node.id}`);
    }
    nodeIds.add(node.id);

    if (!node.type) {
      errors.push(`节点 ${node.id} 缺少 type`);
    } else if (!NODE_TYPES.includes(node.type)) {
      errors.push(`节点 ${node.id} 类型无效: ${node.type}`);
    } else {
      // 检查各类型节点的必填字段
      switch (node.type) {
        case 'Action':
          // action 配置暂时不做必填校验
          if (!node.action) {
            console.log(`Action 节点 ${node.id} 缺少 action 配置 (可忽略)`);
          } else {
            if (!node.action.method) console.log(`Action 节点 ${node.id} 缺少 method (可忽略)`);
            if (node.action.method && !ACTION_METHODS.includes(node.action.method)) {
              errors.push(`Action 节点 ${node.id} method 无效: ${node.action.method}`);
            }
          }
          break;
        case 'Assert':
          // assert 配置暂时不做必填校验
          if (!node.assert) {
            console.log(`Assert 节点 ${node.id} 缺少 assert 配置 (可忽略)`);
          } else {
            if (!node.assert.type) console.log(`Assert 节点 ${node.id} 缺少 type (可忽略)`);
            if (node.assert.type && !ASSERT_TYPES.includes(node.assert.type)) {
              errors.push(`Assert 节点 ${node.id} type 无效: ${node.assert.type}`);
            }
          }
          break;
        case 'Extract':
          // extract 配置暂时不做必填校验
          if (!node.extract) {
            console.log(`Extract 节点 ${node.id} 缺少 extract 配置 (可忽略)`);
          }
          break;
        case 'Condition':
          // condition 配置暂时不做必填校验
          if (!node.condition) {
            console.log(`Condition 节点 ${node.id} 缺少 condition 配置 (可忽略)`);
          }
          break;
        case 'SubFlow':
          // subFlow 配置暂时不做必填校验
          if (!node.subFlow) {
            console.log(`SubFlow 节点 ${node.id} 缺少 subFlow 配置 (可忽略)`);
          }
      }
    }
  }

  // 检查边的引用
  for (const edge of flow.edges || []) {
    if (!nodeIds.has(edge.source)) {
      errors.push(`边的源节点不存在: ${edge.source}`);
    }
    if (!nodeIds.has(edge.target)) {
      errors.push(`边的目标节点不存在: ${edge.target}`);
    }
  }

  // 检查必须有一个 Start 和 End 节点
  const startNodes = flow.nodes.filter(n => n.type === 'Start');
  const endNodes = flow.nodes.filter(n => n.type === 'End');

  if (startNodes.length === 0) errors.push('缺少 Start 节点');
  if (startNodes.length > 1) errors.push('Start 节点只能有一个');
  if (endNodes.length === 0) errors.push('缺少 End 节点');

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 获取节点的所有出边
 */
export function getOutgoingEdges(flow: TestFlow, nodeId: string): FlowEdge[] {
  return flow.edges.filter(e => e.source === nodeId);
}

/**
 * 获取节点的所有入边
 */
export function getIncomingEdges(flow: TestFlow, nodeId: string): FlowEdge[] {
  return flow.edges.filter(e => e.target === nodeId);
}

/**
 * 根据ID获取节点
 */
export function getNodeById(flow: TestFlow, nodeId: string): FlowNode | undefined {
  return flow.nodes.find(n => n.id === nodeId);
}

/**
 * 查找 Start 节点
 */
export function findStartNode(flow: TestFlow): FlowNode | undefined {
  return flow.nodes.find(n => n.type === 'Start');
}

/**
 * 查找所有 End 节点
 */
export function findEndNodes(flow: TestFlow): FlowNode[] {
  return flow.nodes.filter(n => n.type === 'End');
}
