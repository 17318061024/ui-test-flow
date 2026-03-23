/**
 * API 服务器
 * 为前端提供 REST API 服务
 */

import express from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync, unlinkSync } from 'fs';
import { join, extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as yaml from 'js-yaml';

import {
  TestFlow,
  FlowMeta,
  TestCase,
  FlowNode,
  FlowEdge
} from './core/types.js';
import { loadFlow, validateFlow } from './core/flow-parser.js';
import { generateTestCases } from './core/test-case-generator.js';

// 配置
const FLOW_DIR = join(process.cwd(), 'flows');
const OUTPUT_DIR = join(process.cwd(), 'output');

// 确保目录存在
if (!existsSync(FLOW_DIR)) {
  mkdirSync(FLOW_DIR, { recursive: true });
}
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

const app = express();
const PORT = 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 工具函数：获取流程文件路径
function getFlowPath(id: string): string {
  return join(FLOW_DIR, `${id}.json`);
}

// 工具函数：获取流程元信息
function getFlowMeta(flow: TestFlow): FlowMeta {
  return {
    id: flow.id,
    name: flow.name,
    description: flow.description,
    version: flow.version,
    tags: flow.tags,
    author: flow.author,
    nodeCount: flow.nodes.length,
    createdAt: flow.createdAt,
    updatedAt: flow.updatedAt
  };
}

// 工具函数：加载所有流程
function loadAllFlows(): FlowMeta[] {
  const metas: FlowMeta[] = [];

  if (!existsSync(FLOW_DIR)) {
    return metas;
  }

  const files = readdirSync(FLOW_DIR);
  for (const file of files) {
    const filePath = join(FLOW_DIR, file);
    const stat = statSync(filePath);

    if (stat.isFile() && (file.endsWith('.json') || file.endsWith('.yaml') || file.endsWith('.yml'))) {
      try {
        const flow = loadFlow(filePath);
        metas.push(getFlowMeta(flow));
      } catch (e) {
        console.warn(`加载流程失败: ${file}`, e);
      }
    }
  }

  return metas.sort((a, b) => {
    const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return dateB - dateA;
  });
}

// ===== API 路由 =====

// 获取流程列表
app.get('/api/flows', (req, res) => {
  try {
    const flows = loadAllFlows();
    res.json(flows);
  } catch (e) {
    res.status(500).json({ message: e instanceof Error ? e.message : '获取流程列表失败' });
  }
});

// 获取单个流程
app.get('/api/flows/:id', (req, res) => {
  try {
    const { id } = req.params;
    const filePath = getFlowPath(id);

    if (!existsSync(filePath)) {
      // 尝试 YAML 格式
      const yamlPath = join(FLOW_DIR, `${id}.yaml`);
      if (!existsSync(yamlPath)) {
        return res.status(404).json({ message: '流程不存在' });
      }
      const flow = loadFlow(yamlPath);
      return res.json(flow);
    }

    const flow = loadFlow(filePath);
    res.json(flow);
  } catch (e) {
    res.status(500).json({ message: e instanceof Error ? e.message : '获取流程失败' });
  }
});

// 创建流程
app.post('/api/flows', (req, res) => {
  try {
    const flow: TestFlow = req.body;

    // 生成 ID
    if (!flow.id) {
      flow.id = uuidv4();
    }

    // 设置时间戳
    const now = new Date().toISOString();
    if (!flow.createdAt) {
      flow.createdAt = now;
    }
    flow.updatedAt = now;

    // 验证
    const validation = validateFlow(flow);
    if (!validation.valid) {
      return res.status(400).json({
        message: '验证失败',
        errors: validation.errors
      });
    }

    // 保存
    const filePath = getFlowPath(flow.id);
    writeFileSync(filePath, JSON.stringify(flow, null, 2), 'utf-8');

    res.json(flow);
  } catch (e) {
    res.status(500).json({ message: e instanceof Error ? e.message : '创建流程失败' });
  }
});

// 更新流程
app.put('/api/flows/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const filePath = getFlowPath(id);
    if (!existsSync(filePath)) {
      return res.status(404).json({ message: '流程不存在' });
    }

    // 加载现有流程
    const existingFlow = loadFlow(filePath);

    // 合并更新
    const updatedFlow: TestFlow = {
      ...existingFlow,
      ...updates,
      id: id, // 确保 ID 不被修改
      updatedAt: new Date().toISOString()
    };

    // 验证
    const validation = validateFlow(updatedFlow);
    if (!validation.valid) {
      console.error('Flow validation failed:', validation.errors);
      return res.status(400).json({
        message: '验证失败',
        errors: validation.errors
      });
    }

    // 打印成功验证
    console.log('Flow validated successfully:', updatedFlow.id);

    // 保存
    writeFileSync(filePath, JSON.stringify(updatedFlow, null, 2), 'utf-8');

    res.json(updatedFlow);
  } catch (e) {
    res.status(500).json({ message: e instanceof Error ? e.message : '更新流程失败' });
  }
});

// 删除流程
app.delete('/api/flows/:id', (req, res) => {
  try {
    const { id } = req.params;
    const filePath = getFlowPath(id);

    if (!existsSync(filePath)) {
      return res.status(404).json({ message: '流程不存在' });
    }

    // 删除文件
    unlinkSync(filePath);

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: e instanceof Error ? e.message : '删除流程失败' });
  }
});

// 复制流程
app.post('/api/flows/:id/duplicate', (req, res) => {
  try {
    const { id } = req.params;
    const filePath = getFlowPath(id);

    if (!existsSync(filePath)) {
      return res.status(404).json({ message: '流程不存在' });
    }

    // 加载现有流程
    const flow = loadFlow(filePath);

    // 创建副本
    const newId = uuidv4();
    const duplicated: TestFlow = {
      ...flow,
      id: newId,
      name: `${flow.name} (副本)`,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 保存
    const newPath = getFlowPath(newId);
    writeFileSync(newPath, JSON.stringify(duplicated, null, 2), 'utf-8');

    res.json(duplicated);
  } catch (e) {
    res.status(500).json({ message: e instanceof Error ? e.message : '复制流程失败' });
  }
});

// 导出流程
app.get('/api/flows/:id/export', (req, res) => {
  try {
    const { id } = req.params;
    const filePath = getFlowPath(id);

    if (!existsSync(filePath)) {
      return res.status(404).json({ message: '流程不存在' });
    }

    const flow = loadFlow(filePath);
    const content = JSON.stringify(flow, null, 2);
    res.send(content);
  } catch (e) {
    res.status(500).json({ message: e instanceof Error ? e.message : '导出流程失败' });
  }
});

// 导入流程
app.post('/api/flows/import', (req, res) => {
  try {
    const { json } = req.body;
    const flow: TestFlow = JSON.parse(json);

    // 生成新 ID
    flow.id = uuidv4();
    flow.createdAt = new Date().toISOString();
    flow.updatedAt = new Date().toISOString();

    // 验证
    const validation = validateFlow(flow);
    if (!validation.valid) {
      return res.status(400).json({
        message: '验证失败',
        errors: validation.errors
      });
    }

    // 保存
    const filePath = getFlowPath(flow.id);
    writeFileSync(filePath, JSON.stringify(flow, null, 2), 'utf-8');

    res.json(flow);
  } catch (e) {
    res.status(500).json({ message: e instanceof Error ? e.message : '导入流程失败' });
  }
});

// 生成测试用例
app.post('/api/flows/:id/generate', async (req, res) => {
  try {
    const { id } = req.params;
    const filePath = getFlowPath(id);

    if (!existsSync(filePath)) {
      return res.status(404).json({ message: '流程不存在' });
    }

    // 加载流程
    const flow = loadFlow(filePath);

    // 加载所有流程，以便子流程展开
    const allFlows = new Map<string, TestFlow>();
    const allFiles = readdirSync(FLOW_DIR);
    for (const f of allFiles) {
      if (f.endsWith('.json')) {
        try {
          const subFlow = loadFlow(join(FLOW_DIR, f));
          allFlows.set(subFlow.id, subFlow);
        } catch (e) {
          // 忽略加载失败的文件
        }
      }
    }

    // 生成用例（传入所有流程用于子流程展开）
    const testCases = generateTestCases(flow, allFlows);

    // 保存到输出目录
    const outputPath = join(OUTPUT_DIR, `test-cases.json`);
    writeFileSync(outputPath, JSON.stringify(testCases, null, 2), 'utf-8');

    res.json(testCases);
  } catch (e) {
    res.status(500).json({ message: e instanceof Error ? e.message : '生成测试用例失败' });
  }
});

// 获取测试用例列表
app.get('/api/test-cases', (req, res) => {
  try {
    const outputPath = join(OUTPUT_DIR, 'test-cases.json');

    if (!existsSync(outputPath)) {
      return res.json([]);
    }

    const content = readFileSync(outputPath, 'utf-8');
    const testCases = JSON.parse(content);
    res.json(testCases);
  } catch (e) {
    res.status(500).json({ message: e instanceof Error ? e.message : '获取测试用例失败' });
  }
});

// 导出测试用例
app.get('/api/flows/:id/export-cases', async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'json' } = req.query;

    // 支持 JSON 和 YAML 格式
    const jsonPath = join(FLOW_DIR, `${id}.json`);
    const yamlPath = join(FLOW_DIR, `${id}.yaml`);

    let filePath: string;
    if (existsSync(jsonPath)) {
      filePath = jsonPath;
    } else if (existsSync(yamlPath)) {
      filePath = yamlPath;
    } else {
      return res.status(404).json({ message: '流程不存在' });
    }

    // 加载流程
    const flow = loadFlow(filePath);

    // 生成用例
    const testCases = generateTestCases(flow);

    let content: string;
    let contentType: string;

    switch (format) {
      case 'yaml':
        content = yaml.dump(testCases, { indent: 2 });
        contentType = 'text/yaml';
        break;
      case 'script':
        // 生成 Midscene.js 脚本
        content = generateMidsceneScripts(testCases);
        contentType = 'application/javascript';
        break;
      default:
        content = JSON.stringify(testCases, null, 2);
        contentType = 'application/json';
    }

    res.setHeader('Content-Type', contentType);
    res.send(content);
  } catch (e) {
    res.status(500).json({ message: e instanceof Error ? e.message : '导出测试用例失败' });
  }
});

// 生成 Midscene.js 脚本
function generateMidsceneScripts(testCases: TestCase[]): string {
  const scripts = testCases.map(tc => {
    const lines: string[] = [
      `// ${tc.id}: ${tc.name}`,
      'async function test' + tc.id.replace('TC-', '') + '(page) {'
    ];

    for (const step of tc.steps) {
      if (step.type === 'action') {
        if (step.method === 'input') {
          lines.push(`  await ai('在${step.target}输入 ${step.value}');`);
        } else if (step.method === 'click') {
          lines.push(`  await ai('点击${step.target}');`);
        } else if (step.method === 'wait') {
          lines.push(`  await page.waitForTimeout(${step.timeout || 1000});`);
        } else {
          lines.push(`  await ai('${step.method} ${step.target}');`);
        }
      } else if (step.type === 'assert') {
        lines.push(`  await aiAssert('${step.target}显示${step.expected}');`);
      }
    }

    lines.push('}');
    return lines.join('\n');
  });

  return `// Generated by UI Test Flow
const { ai, aiAssert, aiQuery } = require('@midscenejs/playwright');

${scripts.join('\n\n')}
`;
}

// 启动服务器
app.listen(PORT, () => {
  console.log(`API 服务器运行在 http://localhost:${PORT}`);
});
