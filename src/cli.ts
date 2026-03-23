/**
 * CLI 入口 - 生成测试用例
 */

import { loadFlow, loadFlows, validateFlow } from './core/flow-parser.js';
import { generateTestCases } from './core/test-case-generator.js';
import { generateMidsceneScript } from './core/script-generator.js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import * as yaml from 'js-yaml';

// 示例：加载流程并生成用例
async function main() {
  const flowsDir = './flows';

  console.log('🔄 加载流程图...\n');

  const flows = loadFlows(flowsDir);

  if (flows.length === 0) {
    console.log('❌ 未找到流程图文件');
    process.exit(1);
  }

  console.log(`✅ 加载了 ${flows.length} 个流程图\n`);

  const allCases: any[] = [];
  let caseIndex = 1;

  for (const flow of flows) {
    // 验证流程
    const validation = validateFlow(flow);
    if (!validation.valid) {
      console.log(`❌ 流程图 "${flow.name}" 验证失败:`);
      validation.errors.forEach(e => console.log(`   - ${e}`));
      continue;
    }

    console.log(`📋 生成用例: ${flow.name}`);

    const cases = generateTestCases(flow);

    // 重新编号
    for (const tc of cases) {
      tc.id = `TC-${String(caseIndex++).padStart(3, '0')}`;
      allCases.push(tc);
    }

    console.log(`   生成 ${cases.length} 条用例\n`);
  }

  // 输出用例到文件
  const outputDir = './output';
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // 保存 YAML 格式
  writeFileSync(
    join(outputDir, 'test-cases.yaml'),
    yaml.dump(allCases, { indent: 2 }),
    'utf-8'
  );

  // 保存 Midscene 脚本
  for (const tc of allCases) {
    const script = generateMidsceneScript(tc);
    writeFileSync(
      join(outputDir, `${tc.id}.js`),
      script,
      'utf-8'
    );
  }

  console.log('='.repeat(50));
  console.log(`📊 总计生成 ${allCases.length} 条测试用例`);
  console.log(`📁 输出目录: ${outputDir}`);
  console.log('='.repeat(50));

  // 打印用例列表
  console.log('\n📝 生成的测试用例:\n');
  allCases.forEach(tc => {
    console.log(`  ${tc.id}: ${tc.name}`);
  });
}

main().catch(console.error);
