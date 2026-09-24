import type { MeasurementSnapshot } from '@uiq/core';
import { captureWithBrowser } from '../browser/executor';
import { buildResponse, type CliResponse } from '../artifact';
import { formatViolations, validateSnapshot } from '../validate';

export interface MeasureOptions {
  readonly target: string;
  readonly subjects?: string;
  readonly allowExternal: boolean;
  /** Playwright storageState JSON 文件路径（登录态恢复）。 */
  readonly authStatePath?: string;
}

/** P4-04：measure —— 只采集，输出 MeasurementSnapshot（UIQ-ARCH-01 §15.1）。 */
export async function runMeasure(
  options: MeasureOptions,
): Promise<CliResponse<MeasurementSnapshot>> {
  const snapshot = await captureWithBrowser(
    options.target,
    {
      ...(options.subjects !== undefined ? { subjects: options.subjects } : {}),
    },
    options.authStatePath,
  );
  const violations = validateSnapshot(snapshot);
  if (violations.length > 0) {
    return buildResponse<MeasurementSnapshot>('measure', {
      status: 'ERROR',
      errors: [
        { code: 'EXECUTION_ERROR', message: `采集结果不符合契约：${formatViolations(violations)}` },
      ],
    });
  }
  return buildResponse<MeasurementSnapshot>('measure', {
    status: 'COMPLETED',
    data: snapshot,
    reproducibility: {
      deterministic: false,
      snapshotId: snapshot.id,
      note: '浏览器测量含时间戳与渲染环境，重放分析请使用保存的快照文件',
    },
  });
}
