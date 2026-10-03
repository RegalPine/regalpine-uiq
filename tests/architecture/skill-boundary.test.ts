import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SKILL_DIR = join(ROOT, '../../skills/uiq-ui-quality');

describe('AC-ARCH-07: Skill 集成边界约束', () => {
  it('Skill 目录包含 SKILL.md', () => {
    expect(statSync(join(SKILL_DIR, 'SKILL.md')).isFile()).toBe(true);
  });

  it('Skill 包含 workflows/ 目录', () => {
    const workflowsDir = join(SKILL_DIR, 'workflows');
    expect(statSync(workflowsDir).isDirectory()).toBe(true);
    const files = readdirSync(workflowsDir).filter((f) => f.endsWith('.md'));
    expect(files.length).toBeGreaterThanOrEqual(1);
  });

  it('Skill 包含 references/ 目录', () => {
    const refsDir = join(SKILL_DIR, 'references');
    expect(statSync(refsDir).isDirectory()).toBe(true);
    const files = readdirSync(refsDir).filter((f) => f.endsWith('.md'));
    expect(files.length).toBeGreaterThanOrEqual(1);
  });

  it('Skill workflow 引用 CLI 命令而非直接调用包 API', () => {
    const workflowsDir = join(SKILL_DIR, 'workflows');
    const files = readdirSync(workflowsDir).filter((f) => f.endsWith('.md'));
    for (const file of files) {
      const content = readFileSync(join(workflowsDir, file), 'utf-8');
      // Skill workflow 不应包含 TypeScript/JavaScript 模块导入语句
      expect(content).not.toMatch(/^import\s+\{/m);
      expect(content).not.toMatch(/^const\s+\w+\s*=\s*require\(/m);
    }
  });

  it('Skill schema 文件存在', () => {
    const schemasDir = join(SKILL_DIR, 'schemas');
    expect(statSync(schemasDir).isDirectory()).toBe(true);
    const files = readdirSync(schemasDir);
    expect(files.length).toBeGreaterThanOrEqual(1);
  });
});
