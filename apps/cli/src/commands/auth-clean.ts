import { existsSync, rmSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildResponse, type CliResponse } from '../artifact';
import { CliError } from '../errors';

export interface AuthCleanOptions {
  /** 要删除的 auth-state 文件路径。 */
  readonly path: string;
}

export interface AuthCleanData {
  readonly path: string;
  readonly removed: boolean;
  readonly hadCookies: number;
  readonly hadOrigins: number;
}

/**
 * auth-clean：删除 auth-state 文件，清理敏感认证数据。
 */
export async function runAuthClean(options: AuthCleanOptions): Promise<CliResponse<AuthCleanData>> {
  const resolvedPath = resolve(options.path);

  if (!existsSync(resolvedPath)) {
    process.stderr.write(`[uiq] 文件不存在：${resolvedPath}\n`);
    return buildResponse<AuthCleanData>('auth-clean', {
      status: 'COMPLETED',
      data: { path: resolvedPath, removed: false, hadCookies: 0, hadOrigins: 0 },
    });
  }

  // 读取文件内容以统计 cookies/origins 数量（用于日志）
  let hadCookies = 0;
  let hadOrigins = 0;
  try {
    const content = await import('node:fs').then((fs) => fs.readFileSync(resolvedPath, 'utf-8'));
    const parsed = JSON.parse(content) as Record<string, unknown>;
    if (Array.isArray(parsed.cookies)) hadCookies = parsed.cookies.length;
    if (Array.isArray(parsed.origins)) hadOrigins = parsed.origins.length;
  } catch {
    // 无法解析也不阻止删除
  }

  try {
    rmSync(resolvedPath, { force: true });
    process.stderr.write(
      `[uiq] 已删除认证状态文件：${resolvedPath}（原含 ${hadCookies} cookies, ${hadOrigins} origins）\n`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new CliError('EXECUTION_ERROR', `删除认证状态文件失败：${message}`);
  }

  return buildResponse<AuthCleanData>('auth-clean', {
    status: 'COMPLETED',
    data: { path: resolvedPath, removed: true, hadCookies, hadOrigins },
  });
}
