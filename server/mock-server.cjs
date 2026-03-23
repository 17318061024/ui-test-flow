const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

const FLOWS_DIR = path.join(__dirname, '..', 'flows');
const TEST_CASES_DIR = path.join(__dirname, '..', 'output');

// 确保目录存在
if (!fs.existsSync(FLOWS_DIR)) {
  fs.mkdirSync(FLOWS_DIR, { recursive: true });
}
if (!fs.existsSync(TEST_CASES_DIR)) {
  fs.mkdirSync(TEST_CASES_DIR, { recursive: true });
}

// 内存存储
let flows = new Map();

// 加载现有流程
function loadFlows() {
  flows.clear();
  try {
    const files = fs.readdirSync(FLOWS_DIR);
    files.forEach(file => {
      if (file.endsWith('.json')) {
        const content = fs.readFileSync(path.join(FLOWS_DIR, file), 'utf-8');
        const flow = JSON.parse(content);
        flows.set(flow.id, flow);
      }
    });
  } catch (e) {
    console.log('No existing flows or error loading:', e.message);
  }
}

loadFlows();

// 验证流程
function validateFlow(flow) {
  const errors = [];

  if (!flow.nodes || !Array.isArray(flow.nodes) || flow.nodes.length === 0) {
    errors.push('流程必须包含节点');
  }

  const hasStart = flow.nodes?.some(n => n.type === 'Start' || n.type === 'start');
  if (!hasStart) {
    errors.push('流程必须包含开始节点');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }
  return { valid: true };
}

// GET /api/flows - 获取所有流程
app.get('/api/flows', (req, res) => {
  const flowList = Array.from(flows.values()).map(flow => ({
    id: flow.id,
    name: flow.name,
    description: flow.description,
    version: flow.version,
    tags: flow.tags,
    author: flow.author,
    nodeCount: flow.nodes?.length || 0,
    createdAt: flow.createdAt,
    updatedAt: flow.updatedAt
  }));
  res.json(flowList);
});

// GET /api/flows/:id - 获取单个流程
app.get('/api/flows/:id', (req, res) => {
  const flow = flows.get(req.params.id);
  if (!flow) {
    return res.status(404).json({ message: '流程不存在' });
  }
  res.json(flow);
});

// POST /api/flows - 创建流程
app.post('/api/flows', (req, res) => {
  const validation = validateFlow(req.body);
  if (!validation.valid) {
    return res.status(400).json({ message: validation.errors.join(', '), errors: validation.errors });
  }

  const flow = {
    ...req.body,
    id: req.body.id || uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  flows.set(flow.id, flow);

  // 保存到文件
  fs.writeFileSync(
    path.join(FLOWS_DIR, `${flow.id}.json`),
    JSON.stringify(flow, null, 2)
  );

  res.json(flow);
});

// PUT /api/flows/:id - 更新流程
app.put('/api/flows/:id', (req, res) => {
  const existing = flows.get(req.params.id);
  if (!existing) {
    return res.status(404).json({ message: '流程不存在' });
  }

  const validation = validateFlow(req.body);
  if (!validation.valid) {
    return res.status(400).json({ message: validation.errors.join(', '), errors: validation.errors });
  }

  const flow = {
    ...existing,
    ...req.body,
    id: req.params.id,
    updatedAt: new Date().toISOString()
  };

  flows.set(flow.id, flow);

  // 保存到文件
  fs.writeFileSync(
    path.join(FLOWS_DIR, `${flow.id}.json`),
    JSON.stringify(flow, null, 2)
  );

  res.json(flow);
});

// DELETE /api/flows/:id - 删除流程
app.delete('/api/flows/:id', (req, res) => {
  const flow = flows.get(req.params.id);
  if (!flow) {
    return res.status(400).json({ message: '流程不存在' });
  }

  flows.delete(req.params.id);

  // 删除文件
  const filePath = path.join(FLOWS_DIR, `${req.params.id}.json`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  res.json({ message: '删除成功' });
});

// POST /api/flows/:id/duplicate - 复制流程
app.post('/api/flows/:id/duplicate', (req, res) => {
  const flow = flows.get(req.params.id);
  if (!flow) {
    return res.status(404).json({ message: '流程不存在' });
  }

  const newFlow = {
    ...flow,
    id: uuidv4(),
    name: `${flow.name}(副本)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  flows.set(newFlow.id, newFlow);

  // 保存到文件
  fs.writeFileSync(
    path.join(FLOWS_DIR, `${newFlow.id}.json`),
    JSON.stringify(newFlow, null, 2)
  );

  res.json(newFlow);
});

// GET /api/flows/:id/export - 导出流程
app.get('/api/flows/:id/export', (req, res) => {
  const flow = flows.get(req.params.id);
  if (!flow) {
    return res.status(404).json({ message: '流程不存在' });
  }

  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(flow, null, 2));
});

// POST /api/flows/import - 导入流程
app.post('/api/flows/import', (req, res) => {
  let flow;
  try {
    flow = JSON.parse(req.body.json);
  } catch (e) {
    return res.status(400).json({ message: '无效的 JSON 格式' });
  }

  const validation = validateFlow(flow);
  if (!validation.valid) {
    return res.status(400).json({ message: validation.errors.join(', '), errors: validation.errors });
  }

  flow.id = uuidv4();
  flow.createdAt = new Date().toISOString();
  flow.updatedAt = new Date().toISOString();

  flows.set(flow.id, flow);

  // 保存到文件
  fs.writeFileSync(
    path.join(FLOWS_DIR, `${flow.id}.json`),
    JSON.stringify(flow, null, 2)
  );

  res.json(flow);
});

// POST /api/flows/:id/generate - 生成测试用例
app.post('/api/flows/:id/generate', (req, res) => {
  const flow = flows.get(req.params.id);
  if (!flow) {
    return res.status(404).json({ message: '流程不存在' });
  }

  // 生成测试用例 - 将整个流程作为一个用例
  const testCases = [];
  const steps = [];

  flow.nodes?.forEach((node, index) => {
    let step = null;

    if (node.type === 'Start' || node.type === 'start') {
      step = {
        id: `step-${index + 1}`,
        type: 'action',
        description: node.label || '开始',
        method: 'navigate',
        target: '',
        value: ''
      };
    } else if (node.type === 'Navigate' || node.type === 'navigate') {
      step = {
        id: `step-${index + 1}`,
        type: 'action',
        description: node.label || '导航',
        method: 'goto',
        target: node.navigate?.url || node.navigate?.prompt || '',
        value: node.navigate?.prompt || ''
      };
    } else if (node.type === 'Action' || node.type === 'action') {
      // 语义化模式
      if (node.action?.prompt) {
        step = {
          id: `step-${index + 1}`,
          type: 'action',
          description: node.action.prompt,
          method: node.action.method || 'click',
          target: node.action.target || '',
          value: node.action.value || ''
        };
      } else {
        step = {
          id: `step-${index + 1}`,
          type: 'action',
          description: node.label || '操作',
          method: node.action?.method || 'click',
          target: node.action?.target || '',
          value: node.action?.value || ''
        };
      }
    } else if (node.type === 'Assert' || node.type === 'assert') {
      step = {
        id: `step-${index + 1}`,
        type: 'assert',
        description: node.assert?.prompt || node.label || '验证',
        assertType: node.assert?.type || 'text',
        target: node.assert?.target || '',
        expected: node.assert?.expected || ''
      };
    } else if (node.type === 'Extract' || node.type === 'extract') {
      step = {
        id: `step-${index + 1}`,
        type: 'extract',
        description: node.extract?.prompt || node.label || '提取数据',
        field: node.extract?.field || '',
        as: node.extract?.as || ''
      };
    } else if (node.type === 'Wait' || node.type === 'wait') {
      step = {
        id: `step-${index + 1}`,
        type: 'wait',
        description: node.wait?.prompt || node.label || '等待',
        timeout: node.wait?.timeout || 5
      };
    } else if (node.type === 'Condition' || node.type === 'condition') {
      step = {
        id: `step-${index + 1}`,
        type: 'action',
        description: node.condition?.prompt || node.label || '条件判断',
        target: node.condition?.variable || '',
        value: node.condition?.value || ''
      };
    } else if (node.type === 'End' || node.type === 'end') {
      step = {
        id: `step-${index + 1}`,
        type: 'action',
        description: node.label || '结束',
        method: 'end',
        target: '',
        value: ''
      };
    }

    if (step) {
      steps.push(step);
    }
  });

  // 创建一个包含所有步骤的测试用例
  testCases.push({
    id: `tc-${flow.id}-1`,
    name: flow.name || '测试用例',
    description: flow.description || '',
    flowId: flow.id,
    tags: flow.tags || [],
    steps: steps,
    createdAt: new Date().toISOString()
  });

  // 保存测试用例
  fs.writeFileSync(
    path.join(TEST_CASES_DIR, `test-cases-${flow.id}.json`),
    JSON.stringify(testCases, null, 2)
  );

  res.json(testCases);
});

// GET /api/test-cases - 获取测试用例列表
app.get('/api/test-cases', (req, res) => {
  const testCases = [];

  try {
    const files = fs.readdirSync(TEST_CASES_DIR);
    files.forEach(file => {
      if (file.startsWith('test-cases-') && file.endsWith('.json')) {
        const content = fs.readFileSync(path.join(TEST_CASES_DIR, file), 'utf-8');
        const cases = JSON.parse(content);
        // 统一转换为 steps 字段
        cases.forEach(tc => {
          if (tc.testSteps && !tc.steps) {
            tc.steps = tc.testSteps;
            delete tc.testSteps;
          }
        });
        testCases.push(...cases);
      }
    });
  } catch (e) {
    // 忽略错误
  }

  res.json(testCases);
});

// GET /api/flows/:id/export-cases - 导出测试用例
app.get('/api/flows/:id/export-cases', (req, res) => {
  const flow = flows.get(req.params.id);
  if (!flow) {
    return res.status(404).json({ message: '流程不存在' });
  }

  const format = req.query.format || 'json';

  // 生成测试用例数据 - 使用与 generate 相同的逻辑
  const steps = [];

  flow.nodes?.forEach((node, index) => {
    let step = null;

    if (node.type === 'Start' || node.type === 'start') {
      step = {
        id: `step-${index + 1}`,
        type: 'action',
        description: node.label || '开始',
        method: 'navigate',
        target: '',
        value: ''
      };
    } else if (node.type === 'Navigate' || node.type === 'navigate') {
      step = {
        id: `step-${index + 1}`,
        type: 'action',
        description: node.label || '导航',
        method: 'goto',
        target: node.navigate?.url || node.navigate?.prompt || '',
        value: node.navigate?.prompt || ''
      };
    } else if (node.type === 'Action' || node.type === 'action') {
      if (node.action?.prompt) {
        step = {
          id: `step-${index + 1}`,
          type: 'action',
          description: node.action.prompt,
          method: node.action.method || 'click',
          target: node.action.target || '',
          value: node.action.value || ''
        };
      } else {
        step = {
          id: `step-${index + 1}`,
          type: 'action',
          description: node.label || '操作',
          method: node.action?.method || 'click',
          target: node.action?.target || '',
          value: node.action?.value || ''
        };
      }
    } else if (node.type === 'Assert' || node.type === 'assert') {
      step = {
        id: `step-${index + 1}`,
        type: 'assert',
        description: node.assert?.prompt || node.label || '验证',
        assertType: node.assert?.type || 'text',
        target: node.assert?.target || '',
        expected: node.assert?.expected || ''
      };
    } else if (node.type === 'Extract' || node.type === 'extract') {
      step = {
        id: `step-${index + 1}`,
        type: 'extract',
        description: node.extract?.prompt || node.label || '提取数据',
        field: node.extract?.field || '',
        as: node.extract?.as || ''
      };
    } else if (node.type === 'Wait' || node.type === 'wait') {
      step = {
        id: `step-${index + 1}`,
        type: 'wait',
        description: node.wait?.prompt || node.label || '等待',
        timeout: node.wait?.timeout || 5
      };
    } else if (node.type === 'Condition' || node.type === 'condition') {
      step = {
        id: `step-${index + 1}`,
        type: 'action',
        description: node.condition?.prompt || node.label || '条件判断',
        target: node.condition?.variable || '',
        value: node.condition?.value || ''
      };
    } else if (node.type === 'End' || node.type === 'end') {
      step = {
        id: `step-${index + 1}`,
        type: 'action',
        description: node.label || '结束',
        method: 'end',
        target: '',
        value: ''
      };
    }

    if (step) {
      steps.push(step);
    }
  });

  const testCase = {
    id: `tc-${flow.id}-1`,
    name: flow.name || '测试用例',
    description: flow.description || '',
    flowId: flow.id,
    tags: flow.tags || [],
    steps: steps,
    createdAt: new Date().toISOString()
  };

  if (format === 'yaml') {
    let yaml = 'testCases:\n';
    yaml += `  - id: ${testCase.id}\n`;
    yaml += `    name: ${testCase.name}\n`;
    yaml += `    description: ${testCase.description}\n`;
    yaml += `    steps:\n`;
    testCase.steps.forEach(step => {
      yaml += `      - id: ${step.id}\n`;
      yaml += `        type: ${step.type}\n`;
      yaml += `        description: ${step.description}\n`;
      if (step.method) yaml += `        method: ${step.method}\n`;
      if (step.target) yaml += `        target: ${step.target}\n`;
      if (step.value) yaml += `        value: ${step.value}\n`;
      if (step.as) yaml += `        as: ${step.as}\n`;
      if (step.timeout) yaml += `        timeout: ${step.timeout}\n`;
    });
    res.setHeader('Content-Type', 'text/yaml');
    res.send(yaml);
  } else if (format === 'json') {
    res.json([testCase]);
  } else if (format === 'script') {
    // 生成 Playwright 脚本
    let script = `// Playwright Test Script - ${testCase.name}\n`;
    script += `// Generated: ${testCase.createdAt}\n\n`;
    script += `import { test, expect } from '@playwright/test';\n\n`;
    script += `test('${testCase.name}', async ({ page }) => {\n`;
    testCase.steps.forEach(step => {
      if (step.type === 'action') {
        if (step.method === 'goto' || step.method === 'navigate') {
          script += `  await page.goto('${step.target || step.value}');\n`;
        } else if (step.method === 'click') {
          script += `  await page.click('${step.target || 'selector'}');\n`;
        } else if (step.method === 'input') {
          script += `  await page.fill('${step.target || 'selector'}', '${step.value}');\n`;
        }
      } else if (step.type === 'wait') {
        script += `  await page.waitForTimeout(${step.timeout * 1000});\n`;
      } else if (step.type === 'assert') {
        script += `  // Assert: ${step.description}\n`;
      }
    });
    script += `});\n`;
    res.setHeader('Content-Type', 'text/javascript');
    res.send(script);
  } else {
    res.status(400).json({ message: '不支持的格式' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Mock API server running on http://localhost:${PORT}`);
});
