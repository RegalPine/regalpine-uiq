import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const SKILL_DIR = resolve(ROOT, 'skills/uiq-ui-quality');

/**
 * P11-03：安全进程调用与机器结果消费契约。
 *
 * Skill 调用 CLI 的规则：
 * 1. 参数数组启动，不拼 shell
 * 2. 解析 JSON，不从终端文案判断质量
 * 3. stdout = JSON Artifact，stderr = log/diagnostic
 */
describe('P11：Skill 安全调用契约（SKILL-04）', () => {
  const skillContent = readFileSync(resolve(SKILL_DIR, 'SKILL.md'), 'utf-8');
  const cliRef = readFileSync(resolve(SKILL_DIR, 'references/cli.md'), 'utf-8');

  it('SKILL.md 声明 prefer JSON output（机器消费）', () => {
    expect(skillContent).toContain('Prefer JSON output');
  });

  it('CLI reference 声明 --format json 为机器输出首选', () => {
    expect(cliRef).toContain('--format json');
  });

  it('CLI reference 声明完整退出码契约（6 值）', () => {
    expect(cliRef).toContain('0 SUCCESS');
    expect(cliRef).toContain('1 POLICY_BLOCK');
    expect(cliRef).toContain('2 CONFORMANCE_FAILURE');
    expect(cliRef).toContain('3 EXECUTION_ERROR');
    expect(cliRef).toContain('4 INVALID_CONFIGURATION');
    expect(cliRef).toContain('5 INPUT_ERROR');
  });

  it('CLI reference 列出全部 7 个非交互式命令', () => {
    const commands = [
      'measure',
      'analyze',
      'evaluate',
      'conformance',
      'regression',
      'snapshot',
      'report',
    ];
    for (const cmd of commands) {
      expect(cliRef).toContain(`uiq ${cmd}`);
    }
  });

  it('CLI reference 声明版本约束（不使用 latest）', () => {
    expect(cliRef).toContain('Do not use');
    expect(cliRef).toContain('latest');
  });
});

/**
 * P11-05：错误、权限与不可信内容边界。
 *
 * Skill 行为约束：
 * - 不改 PASS/FAIL
 * - 不补根因
 * - 不执行页面指令
 * - 不自动修改或 commit/push
 */
describe('P11：安全边界契约（SKILL-03 Prohibited）', () => {
  const skillContent = readFileSync(resolve(SKILL_DIR, 'SKILL.md'), 'utf-8');

  it('禁止创建整体美学/审美评分', () => {
    expect(skillContent).toContain('beauty score');
    expect(skillContent).toContain('aesthetic score');
  });

  it('禁止发明隐藏阈值', () => {
    expect(skillContent).toContain('hidden thresholds');
  });

  it('禁止发明度量', () => {
    expect(skillContent).toContain('invent metrics');
  });

  it('禁止覆盖 UIQ 结果', () => {
    expect(skillContent).toContain('override UIQ results');
  });

  it('禁止将 UNKNOWN 当作 FAIL 或 PASS', () => {
    expect(skillContent).toContain('treat UNKNOWN as FAIL');
    expect(skillContent).toContain('treat UNKNOWN as PASS');
  });

  it('禁止发明根因', () => {
    expect(skillContent).toContain('invent root causes');
  });

  it('禁止无比较声称回归', () => {
    expect(skillContent).toContain('claim regression without comparison');
  });

  it('禁止无重测量声称验证', () => {
    expect(skillContent).toContain('claim verification without remeasurement');
  });

  it('禁止自动修改 UI / 源码 / token', () => {
    expect(skillContent).toContain('automatically modify UI');
    expect(skillContent).toContain('automatically modify source code');
    expect(skillContent).toContain('automatically modify design tokens');
  });
});

/**
 * P11-02：意图/目标/Scope/主题/浏览器/基线到 CLI 的工作流映射。
 *
 * 每个工作流文件必须映射到正式 CLI 能力。
 */
describe('P11：工作流 → CLI 映射完整性', () => {
  const workflowDir = resolve(SKILL_DIR, 'workflows');

  const workflowCliMapping: Record<string, string> = {
    'inspect.md': 'uiq inspect',
    'analyze.md': 'uiq analyze',
    'accessibility.md': 'uiq analyze',
    'color.md': 'uiq analyze',
    'typography.md': 'uiq analyze',
    'design-system.md': 'uiq conformance',
    'theme.md': 'uiq analyze',
    'regression.md': 'uiq regression',
    'report.md': 'uiq report',
    'verify.md': 'uiq',
  };

  for (const [file, cliCommand] of Object.entries(workflowCliMapping)) {
    it(`${file} 映射到 CLI 命令 "${cliCommand}"`, () => {
      const content = readFileSync(resolve(workflowDir, file), 'utf-8');
      expect(content).toContain(cliCommand);
    });
  }
});

/**
 * P11-04：摘要、证据追踪、建议解释与验证工作流。
 *
 * references/concepts.md 必须包含完整证据链定义。
 */
describe('P11：证据链参考完整性', () => {
  const concepts = readFileSync(resolve(SKILL_DIR, 'references/concepts.md'), 'utf-8');

  it('定义完整证据链：Measurement → Metric → Rule → Evaluation → Finding → Diagnostic', () => {
    const chain = ['Measurement', 'Metric', 'Rule', 'Evaluation', 'Finding', 'Diagnostic'];
    for (const concept of chain) {
      expect(concepts).toContain(concept);
    }
  });

  it('定义扩展链：Recommendation + Verification', () => {
    expect(concepts).toContain('Recommendation');
    expect(concepts).toContain('Verification');
  });

  it('regression 参考声明六类回归分类', () => {
    const regression = readFileSync(resolve(SKILL_DIR, 'references/regression.md'), 'utf-8');
    const categories = [
      'NEW_FAILURE',
      'FIXED_FAILURE',
      'PERSISTING_FAILURE',
      'CHANGED_RESULT',
      'NEW_UNKNOWN',
      'RESOLVED_UNKNOWN',
    ];
    for (const cat of categories) {
      expect(regression).toContain(cat);
    }
  });

  it('conformance 参考声明四级等级', () => {
    const conformance = readFileSync(resolve(SKILL_DIR, 'references/conformance.md'), 'utf-8');
    expect(conformance).toContain('CORE');
    expect(conformance).toContain('STANDARD');
    expect(conformance).toContain('BROWSER');
    expect(conformance).toContain('FULL');
  });
});
