import { existsSync, rmSync, symlinkSync, cpSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { buildResponse, type CliResponse } from '../artifact';
import { CliError } from '../errors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export type SupportedAgent = 'qoder' | 'claude' | 'codex' | 'kiro';

export interface InstallSkillOptions {
  readonly agent: SupportedAgent;
  readonly copy: boolean;
}

export interface InstallSkillData {
  readonly agent: string;
  readonly targetPath: string;
  readonly mode: 'symlink' | 'copy';
}

/** Agent → skills 目录映射 */
const AGENT_SKILL_DIRS: Record<SupportedAgent, string> = {
  qoder: join(homedir(), '.qoder', 'skills'),
  claude: join(homedir(), '.claude', '.claude', 'skills'),
  codex: join(homedir(), '.codex', 'skills'),
  kiro: join(homedir(), '.kiro', 'skills'),
};

/**
 * 安装 UIQ Skill 到指定 Agent 的 skills 目录。
 * 默认使用符号链接（开发时修改即时生效），--copy 则复制。
 */
export async function runInstallSkill(options: InstallSkillOptions): Promise<CliResponse<InstallSkillData>> {
  const { agent, copy } = options;
  const targetDir = AGENT_SKILL_DIRS[agent];

  if (targetDir === undefined) {
    throw new CliError('INVALID_CONFIGURATION', `未知 agent：${agent}。支持：qoder、claude、codex、kiro`);
  }

  if (!existsSync(targetDir)) {
    throw new CliError(
      'INPUT_ERROR',
      `Agent skills 目录不存在：${targetDir}\n请先安装对应 Agent 或手动创建目录`,
    );
  }

  // Skill 源路径（相对于 CLI 包的位置）
  // dist/ 在 apps/cli/dist/，需要上溯 3 级到项目根目录
  const skillSource = resolve(__dirname, '../../../skills/uiq-ui-quality');
  if (!existsSync(skillSource)) {
    throw new CliError('EXECUTION_ERROR', `Skill 源目录不存在：${skillSource}`);
  }

  const dest = join(targetDir, 'uiq-ui-quality');

  // 已存在则先清理
  if (existsSync(dest)) {
    try {
      rmSync(dest, { recursive: true, force: true });
    } catch {
      // 忽略清理失败
    }
  }

  if (copy) {
    cpSync(skillSource, dest, { recursive: true });
    process.stderr.write(`[uiq] 已复制 skill → ${dest}\n`);
  } else {
    symlinkSync(skillSource, dest, 'dir');
    process.stderr.write(`[uiq] 已链接 skill → ${dest}\n`);
  }

  process.stderr.write(`\n完成。重启 Agent 后 skill 生效。\n`);
  process.stderr.write(`验证：在 Agent 中输入 /uiq 或让 Agent 分析 UI 质量。\n`);

  return buildResponse<InstallSkillData>('install-skill', {
    status: 'COMPLETED',
    data: {
      agent,
      targetPath: dest,
      mode: copy ? 'copy' : 'symlink',
    },
  });
}
