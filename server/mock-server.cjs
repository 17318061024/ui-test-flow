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

  // 生成简单的测试用例
  const testCases = [];
  let stepId = 1;

  flow.nodes?.forEach(node => {
    if (node.type === 'Start' || node.type === 'start') {
      testCases.push({
        id: `tc-${flow.id}-${stepId++}`,
        name: `${flow.name} - ${node.label || '开始'}`,
        flowId: flow.id,
        testSteps: [
          {
            id: `step-${stepId}`,
            action: 'navigate',
            target: 'http://example.com',
            value: ''
          }
        ]
      });
    } else if (node.type === 'Action' || node.type === 'action') {
      testCases.push({
        id: `tc-${flow.id}-${stepId++}`,
        name: `${flow.name} - ${node.label || '操作'}`,
        flowId: flow.id,
        testSteps: [
          {
            id: `step-${stepId}`,
            action: 'click',
            target: node.data?.target || '#submit-btn',
            value: node.data?.value || ''
          }
        ]
      });
    } else if (node.type === 'Assert' || node.type === 'assert') {
      testCases.push({
        id: `tc-${flow.id}-${stepId++}`,
        name: `${flow.name} - ${node.label || '断言'}`,
        flowId: flow.id,
        testSteps: [
          {
            id: `step-${stepId}`,
            action: 'assert',
            target: node.data?.target || '',
            value: node.data?.expected || ''
          }
        ]
      });
    }
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

  // 生成测试用例数据
  const testCases = [];
  let stepId = 1;

  flow.nodes?.forEach(node => {
    if (node.type === 'Start' || node.type === 'start') {
      testCases.push({
        id: `tc-${flow.id}-${stepId}`,
        name: `${flow.name} - ${node.label || '开始'}`,
        flowId: flow.id,
        testSteps: [
          {
            id: `step-${stepId}`,
            action: 'navigate',
            target: 'http://example.com',
            value: ''
          }
        ]
      });
      stepId++;
    }
  });

  if (format === 'yaml') {
    let yaml = 'testCases:\n';
    testCases.forEach(tc => {
      yaml += `  - id: ${tc.id}\n`;
      yaml += `    name: ${tc.name}\n`;
      yaml += `    testSteps:\n`;
      tc.testSteps.forEach(step => {
        yaml += `      - id: ${step.id}\n`;
        yaml += `        action: ${step.action}\n`;
        yaml += `        target: ${step.target}\n`;
        yaml += `        value: ${step.value}\n`;
      });
    });
    res.setHeader('Content-Type', 'text/yaml');
    res.send(yaml);
  } else if (format === 'json') {
    res.json(testCases);
  } else {
    res.status(400).json({ message: '不支持的格式' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Mock API server running on http://localhost:${PORT}`);
});
