import { existsSync, rmSync, symlinkSync, cpSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { homedir, platform } from 'node:os';
import { fileURLToPath } from 'node:url';
import { buildResponse, type CliResponse } from '../artifact';
import { CliError } from '../errors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export type SupportedAgent = 'qoder' | 'claude' | 'codex' | 'kiro';
export type AgentTarget = SupportedAgent | 'all';

export interface InstallSkillOptions {
  readonly agent: AgentTarget;
  readonly copy: boolean;
}

export interface InstallSkillResult {
  readonly agent: string;
  readonly targetPath: string;
  readonly mode: 'symlink' | 'copy' | 'skipped';
  readonly error?: string;
}

export interface InstallSkillData {
  readonly results: InstallSkillResult[];
}

/** Agent → skills 目录映射 */
const AGENT_SKILL_DIRS: Record<SupportedAgent, string> = {
  qoder: join(homedir(), '.qoder', 'skills'),
  claude: join(homedir(), '.claude', '.claude', 'skills'),
  codex: join(homedir(), '.codex', 'skills'),
  kiro: join(homedir(), '.kiro', 'skills'),
};

const ALL_AGENTS: SupportedAgent[] = ['qoder', 'claude', 'codex', 'kiro'];

/**
 * 安装 UIQ Skill 到指定 Agent 的 skills 目录。
 * 默认使用符号链接（开发时修改即时生效），--copy 则复制。
 * 支持 --agent all 安装到所有已安装的 Agent。
 */
export async function runInstallSkill(options: InstallSkillOptions): Promise<CliResponse<InstallSkillData>> {
  const { agent, copy } = options;
  const agents = agent === 'all' ? ALL_AGENTS : [agent];
  const results: InstallSkillResult[] = [];

  // Skill 源路径：从当前文件向上查找包含 skills/uiq-ui-quality 的目录
  // 兼容 dist/（apps/cli/dist/）和 src/（apps/cli/src/commands/）两种运行模式
  let skillSource = '';
  let dir = __dirname;
  for (let i = 0; i < 10; i += 1) {
    const candidate = join(dir, 'skills', 'uiq-ui-quality');
    if (existsSync(candidate)) {
      skillSource = candidate;
      break;
    }
    const parent = join(dir, '..');
    if (parent === dir) break; // 到达根目录
    dir = parent;
  }
  if (skillSource === '') {
    throw new CliError('EXECUTION_ERROR', `Skill 源目录不存在（从 ${__dirname} 向上查找失败）`);
  }

  for (const a of agents) {
    const targetDir = AGENT_SKILL_DIRS[a];
    const dest = join(targetDir, 'uiq-ui-quality');

    // 检查 Agent 目录是否存在
    if (!existsSync(targetDir)) {
      process.stderr.write(`[skip] ${a} — 目录不存在：${targetDir}\n`);
      results.push({ agent: a, targetPath: dest, mode: 'skipped', error: 'Agent 目录不存在' });
      continue;
    }

    // 已存在则先清理
    if (existsSync(dest)) {
      try {
        rmSync(dest, { recursive: true, force: true });
      } catch {
        // 忽略清理失败
      }
    }

    try {
      if (copy) {
        cpSync(skillSource, dest, { recursive: true });
        process.stderr.write(`[ok] ${a} — 已复制 skill → ${dest}\n`);
        results.push({ agent: a, targetPath: dest, mode: 'copy' });
      } else {
        // Windows 兼容：如果符号链接失败则回退到复制
        try {
          symlinkSync(skillSource, dest, 'dir');
          process.stderr.write(`[ok] ${a} — 已链接 skill → ${dest}\n`);
          results.push({ agent: a, targetPath: dest, mode: 'symlink' });
        } catch (symlinkError) {
          if (platform() === 'win32') {
            // Windows 上符号链接可能需要管理员权限，回退到复制
            cpSync(skillSource, dest, { recursive: true });
            process.stderr.write(`[ok] ${a} — 已复制 skill（符号链接失败）→ ${dest}\n`);
            results.push({ agent: a, targetPath: dest, mode: 'copy' });
          } else {
            throw symlinkError;
          }
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      process.stderr.write(`[error] ${a} — 安装失败：${message}\n`);
      results.push({ agent: a, targetPath: dest, mode: 'skipped', error: message });
    }
  }

  const successCount = results.filter((r) => r.mode !== 'skipped').length;
  process.stderr.write(`\n完成（${successCount}/${agents.length}）。重启 Agent 后 skill 生效。\n`);

  return buildResponse<InstallSkillData>('install-skill', {
    status: 'COMPLETED',
    data: { results },
  });
}
