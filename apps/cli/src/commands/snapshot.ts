import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { captureWithBrowser } from '../browser/executor';
import { buildResponse, type CliResponse } from '../artifact';
import { CliError } from '../errors';
import { formatViolations, validateSnapshot } from '../validate';

export interface SnapshotOptions {
  readonly target: string;
  readonly outputPath: string;
  readonly subjects?: string;
  readonly allowExternal: boolean;
}

export interface SnapshotData {
  readonly path: string;
  readonly snapshotId: string;
}

/**
 * snapshot：浏览器采集 → Schema 校验 → 写入文件。
 * --output 必选；原子写入（writeFileSync 保证单次写入）。
 * 路径安全：resolve 后写入，不允许目录遍历到工作区外（由调用方保证）。
 */
export async function runSnapshot(options: SnapshotOptions): Promise<CliResponse<SnapshotData>> {
  if (options.outputPath === '') {
    throw new CliError('INVALID_CONFIGURATION', 'snapshot 需要 --output 参数指定输出文件路径');
  }

  const snapshot = await captureWithBrowser(options.target, {
    ...(options.subjects !== undefined ? { subjects: options.subjects } : {}),
  });

  const violations = validateSnapshot(snapshot);
  if (violations.length > 0) {
    throw new CliError('EXECUTION_ERROR', `采集结果不符合契约：${formatViolations(violations)}`);
  }

  const resolvedPath = resolve(options.outputPath);
  writeFileSync(resolvedPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf-8');

  return buildResponse<SnapshotData>('snapshot', {
    status: 'COMPLETED',
    data: {
      path: resolvedPath,
      snapshotId: snapshot.id,
    },
    reproducibility: {
      deterministic: false,
      snapshotId: snapshot.id,
      note: '浏览器测量含时间戳与渲染环境，重放分析请使用保存的快照文件',
    },
  });
}
