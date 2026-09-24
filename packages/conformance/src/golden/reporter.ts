import type { EngineInfo } from '@uiq/core';
import type { GoldenReport } from './types';

/**
 * UIQ-IMPL-11 §66-67：Conformance Report / JSON 形状。
 * failed 仅计 status==='FAIL' 的用例；ERROR 单独计入 errors（CI 失败分类，§65）。
 */
export interface ConformanceSummary {
  readonly level: string;
  readonly total: number;
  readonly passed: number;
  readonly failed: number;
  readonly unknown: number;
  readonly errors: number;
  readonly engine: EngineInfo;
}

export function toConformanceSummary(
  report: GoldenReport,
  options: { readonly level: string; readonly engine: EngineInfo },
): ConformanceSummary {
  const errors = report.cases.filter((c) => c.status === 'ERROR').length;
  return {
    level: options.level,
    total: report.total,
    passed: report.passed,
    failed: report.failed,
    unknown: 0,
    errors,
    engine: options.engine,
  };
}
