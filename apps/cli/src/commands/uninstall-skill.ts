import { existsSync, rmSync, lstatSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { buildResponse, type CliResponse } from '../artifact';
import { CliError } from '../errors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export type SupportedAgent = 'qoder' | 'claude' | 'codex' | 'kiro';

export interface UninstallSkillOptions {
  readonly agent: SupportedAgent;
}

export interface UninstallSkillData {
  readonly agent: string;
  readonly removed: boolean;
  readonly wasSymlink: boolean;
}

/** Agent → skills 目录映射 */
const AGENT_SKILL_DIRS: Record<SupportedAgent, string> = {
  qoder: join(homedir(), '.qoder', 'skills'),
  claude: join(homedir(), '.claude', '.claude', 'skills'),
  codex: join(homedir(), '.codex', 'skills'),
  kiro: join(homedir(), '.kiro', 'skills'),
};

/**
 * 卸载 UIQ Skill。
 * 如果是符号链接则删除链接，如果是复制则删除整个目录。
 */
export async function runUninstallSkill(options: UninstallSkillOptions): Promise<CliResponse<UninstallSkillData>> {
  const { agent } = options;
  const targetDir = AGENT_SKILL_DIRS[agent];

  if (targetDir === undefined) {
    throw new CliError('INVALID_CONFIGURATION', `未知 agent：${agent}。支持：qoder、claude、codex、kiro`);
  }

  const dest = join(targetDir, 'uiq-ui-quality');

  if (!existsSync(dest)) {
    process.stderr.write(`[uiq] Skill 未安装：${dest}\n`);
    return buildResponse<UninstallSkillData>('uninstall-skill', {
      status: 'COMPLETED',
      data: { agent, removed: false, wasSymlink: false },
    });
  }

  // 检查是否是符号链接
  let wasSymlink = false;
  try {
    const stats = lstatSync(dest);
    wasSymlink = stats.isSymbolicLink();
  } catch {
    // 忽略
  }

  try {
    rmSync(dest, { recursive: true, force: true });
    process.stderr.write(`[uiq] 已卸载 skill ← ${dest}\n`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new CliError('EXECUTION_ERROR', `卸载失败：${message}`);
  }

  return buildResponse<UninstallSkillData>('uninstall-skill', {
    status: 'COMPLETED',
    data: { agent, removed: true, wasSymlink },
  });
}
