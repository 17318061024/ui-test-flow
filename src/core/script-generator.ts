/**
 * Midscene.js 脚本生成器
 * 将测试用例转换为可执行的 Midscene.js 脚本
 */

import { TestCase, TestStep } from './types.js';

/**
 * 生成 Midscene.js 脚本
 */
export function generateMidsceneScript(testCase: TestCase, options?: ScriptOptions): string {
  const lines: string[] = [];

  // 文件头部
  lines.push(`// 测试用例: ${testCase.name}`);
  lines.push(`// ID: ${testCase.id}`);
  lines.push(`// 生成时间: ${testCase.createdAt}`);
  lines.push('');
  lines.push(`const { ai, aiAssert, aiQuery } = require('@midscene/web');`);
  lines.push('');
  lines.push(`async function ${toFunctionName(testCase.name)}(page) {`);

  // 生成每个步骤的代码
  for (const step of testCase.steps) {
    const stepCode = generateStepCode(step);
    if (stepCode) {
      lines.push(`  ${stepCode}`);
    }
  }

  lines.push('}');
  lines.push('');
  lines.push(`module.exports = { ${toFunctionName(testCase.name)} };`);

  return lines.join('\n');
}

/**
 * 生成单个步骤的代码
 */
function generateStepCode(step: TestStep): string | null {
  const target = step.target ? `'${step.target}'` : '';
  const value = step.value ? `'${step.value}'` : '';
  const expected = step.expected ? `'${step.expected}'` : '';

  switch (step.type) {
    case 'action':
      return generateActionCode(step, target, value);

    case 'assert':
      return generateAssertCode(step, target, expected);

    case 'extract':
      return generateExtractCode(step, target);

    default:
      return null;
  }
}

/**
 * 生成操作代码
 */
function generateActionCode(step: TestStep, target: string, value: string): string {
  const descriptions: Record<string, string> = {
    click: `点击${target}`,
    input: `在${target}中输入${value}`,
    select: `在${target}中选择${value}`,
    hover: `悬停在${target}上`,
    scroll: `滚动到${target}`,
    wait: `等待${target}`,
    screenshot: `对${target}截图`
  };

  const description = descriptions[step.method || 'click'] || `执行操作: ${step.method}`;

  switch (step.method) {
    case 'input':
      return `await ai('${description.replace("'" , "\\'")}');`;
    case 'wait':
      return `// 等待: ${step.target}`;
    default:
      return `await ai('${description.replace("'" , "\\'")}');`;
  }
}

/**
 * 生成断言代码
 */
function generateAssertCode(step: TestStep, target: string, expected: string): string {
  const descriptions: Record<string, string> = {
    text: `页面显示${target}文本为${expected}`,
    visible: `${target}可见`,
    hidden: `${target}隐藏`,
    enabled: `${target}可用`,
    contains: `${target}包含${expected}`
  };

  const description = descriptions[step.assertType || 'text'] || `验证${target}`;

  return `await aiAssert('${description.replace(/'/g, "\\'")}');`;
}

/**
 * 生成提取代码
 */
function generateExtractCode(step: TestStep, target: string): string {
  const field = step.field || 'text';
  const as = step.as || 'extracted';

  return `const ${as} = await aiQuery('获取${target}的${field}');`;
}

/**
 * 将名称转换为函数名
 */
function toFunctionName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase() || 'test_case';
}

/**
 * 批量生成脚本
 */
export function generateMidsceneScripts(testCases: TestCase[]): Map<string, string> {
  const scripts = new Map<string, string>();

  for (const tc of testCases) {
    scripts.set(tc.id, generateMidsceneScript(tc));
  }

  return scripts;
}

/**
 * 生成 Playwright 集成脚本
 */
export function generatePlaywrightIntegration(testCase: TestCase): string {
  const lines: string[] = [];

  lines.push(`// ${testCase.name}`);
  lines.push(`// ID: ${testCase.id}`);
  lines.push('');
  lines.push(`const { test, expect } = require('@playwright/test');`);
  lines.push(`const midscene = require('@midscene/web');`);
  lines.push('');

  // 读取环境变量配置
  lines.push(`// Midscene 配置`);
  lines.push(`midscene.setModelConfig({`);
  lines.push(`  modelFamily: process.env.MIDSCENE_MODEL_FAMILY || 'qwen2.5-vl',`);
  lines.push(`  modelName: process.env.MIDSCENE_MODEL_NAME || 'qwen-vl-max-latest',`);
  lines.push(`  baseURL: process.env.MIDSCENE_MODEL_BASE_URL,`);
  lines.push(`  apiKey: process.env.MIDSCENE_MODEL_API_KEY,`);
  lines.push(`});`);
  lines.push('');

  lines.push(`test.describe('${testCase.name}', () => {`);
  lines.push(`  test('${testCase.description || testCase.name}', async ({ page }) => {`);
  lines.push('');

  // 生成步骤代码
  for (const step of testCase.steps) {
    const stepCode = generateStepCode(step);
    if (stepCode) {
      lines.push(`    ${stepCode}`);
    }
  }

  lines.push('  });');
  lines.push('});');

  return lines.join('\n');
}

interface ScriptOptions {
  includeModelConfig?: boolean;
  modelFamily?: string;
  modelName?: string;
}
