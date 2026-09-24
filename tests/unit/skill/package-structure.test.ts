import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const SKILL_DIR = resolve(ROOT, 'skills/uiq-ui-quality');

/** SKILL-03 §1：Skill 包目录结构必须完整。 */
const REQUIRED_WORKFLOWS = [
  'inspect',
  'analyze',
  'accessibility',
  'color',
  'typography',
  'design-system',
  'theme',
  'regression',
  'report',
  'verify',
] as const;

const REQUIRED_REFERENCES = [
  'concepts',
  'cli',
  'metrics',
  'rules',
  'findings',
  'diagnostics',
  'recommendations',
  'conformance',
  'regression',
] as const;

describe('P11：Skill 包结构契约', () => {
  it('skills/uiq-ui-quality/ 目录存在', () => {
    expect(existsSync(SKILL_DIR)).toBe(true);
  });

  it('SKILL.md 存在且非空', () => {
    const skillMd = resolve(SKILL_DIR, 'SKILL.md');
    expect(existsSync(skillMd)).toBe(true);
    const content = readFileSync(skillMd, 'utf-8');
    expect(content.length).toBeGreaterThan(100);
  });

  it('workflows/ 目录包含全部 10 个工作流文件', () => {
    const workflowsDir = resolve(SKILL_DIR, 'workflows');
    expect(existsSync(workflowsDir)).toBe(true);
    const files = readdirSync(workflowsDir);
    for (const name of REQUIRED_WORKFLOWS) {
      expect(files).toContain(`${name}.md`);
    }
  });

  it('references/ 目录包含全部参考文件', () => {
    const referencesDir = resolve(SKILL_DIR, 'references');
    expect(existsSync(referencesDir)).toBe(true);
    const files = readdirSync(referencesDir);
    for (const name of REQUIRED_REFERENCES) {
      expect(files).toContain(`${name}.md`);
    }
  });

  it('无多余顶层文件（仅 SKILL.md + workflows/ + references/）', () => {
    const entries = readdirSync(SKILL_DIR);
    const allowed = new Set(['SKILL.md', 'workflows', 'references']);
    for (const entry of entries) {
      expect(allowed.has(entry)).toBe(true);
    }
  });
});

describe('P11：SKILL.md 内容契约', () => {
  const content = readFileSync(resolve(SKILL_DIR, 'SKILL.md'), 'utf-8');

  it('声明 Skill ID 和版本', () => {
    expect(content).toContain('Skill ID: uiq-ui-quality');
    expect(content).toContain('Version: 1.0.0');
  });

  it('声明 Source of Truth（UIQ 为确定性事实源）', () => {
    expect(content).toContain('Source of Truth');
    expect(content).toContain('deterministic');
  });

  it('声明 Evidence Rule（证据链不可发明）', () => {
    expect(content).toContain('Evidence Rule');
    expect(content).toContain('Do not invent evidence');
  });

  it('声明 State Rule（六态不可混淆）', () => {
    expect(content).toContain('State Rule');
    expect(content).toContain('PASS');
    expect(content).toContain('FAIL');
    expect(content).toContain('UNKNOWN');
    expect(content).toContain('NOT_APPLICABLE');
  });

  it('声明 Prohibited（禁止整体评分/自动修改等）', () => {
    expect(content).toContain('Prohibited');
    expect(content).toContain('beauty score');
    expect(content).toContain('automatically modify');
  });

  it('声明 Recommendation Rule（不自动修改源码/CSS/token）', () => {
    expect(content).toContain('Recommendation Rule');
    expect(content).toContain('source code');
  });

  it('声明 Verification Rule（实现 ≠ 验证）', () => {
    expect(content).toContain('Verification Rule');
    expect(content).toContain('Implementation is not verification');
  });

  it('列出全部 10 个工作流名称', () => {
    for (const name of REQUIRED_WORKFLOWS) {
      // 工作流名以 ### 标题出现在 SKILL.md 中
      const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
      // design-system 在 SKILL.md 中以 "Design System" 出现
      if (name === 'design-system') {
        expect(content).toContain('Design System');
      } else {
        expect(content).toContain(capitalized);
      }
    }
  });
});

describe('P11：工作流文件内容契约', () => {
  for (const name of REQUIRED_WORKFLOWS) {
    describe(`${name}.md`, () => {
      const content = readFileSync(resolve(SKILL_DIR, 'workflows', `${name}.md`), 'utf-8');

      it('包含 Purpose 节', () => {
        expect(content).toContain('Purpose');
      });

      it('包含 Execution 节或 CLI 命令', () => {
        // 每个工作流必须指明 CLI 调用方式
        const hasExecution = content.includes('Execution');
        const hasCliCommand = content.includes('uiq ');
        expect(hasExecution || hasCliCommand).toBe(true);
      });

      it('不产生主观质量判断（禁止整体评分）', () => {
        // 工作流不应声称 "good design" / "beautiful" 等主观判断
        const lower = content.toLowerCase();
        expect(lower).not.toContain('beautiful');
        expect(lower).not.toContain('ugly');
        // "overall score" 可能出现在禁止语境（"do not convert...into an overall score"）
        // 只检查不以肯定语气声称质量评分
        if (lower.includes('overall score')) {
          // 如果出现，必须在禁止/否定语境中
          expect(lower).toContain('do not');
        }
      });
    });
  }
});

describe('P11：参考文件内容契约', () => {
  for (const name of REQUIRED_REFERENCES) {
    describe(`${name}.md`, () => {
      const content = readFileSync(resolve(SKILL_DIR, 'references', `${name}.md`), 'utf-8');

      it('非空且包含有意义内容', () => {
        expect(content.length).toBeGreaterThan(50);
      });

      it('包含至少一个 Markdown 标题', () => {
        expect(content).toMatch(/^#/m);
      });
    });
  }
});
