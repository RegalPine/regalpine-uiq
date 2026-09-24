/**
 * 报告事实输入（IMPL-17 §33 validate 阶段的输入形状）。
 * 全部为只读结果派生物的引用；reporting 不重新执行指标/规则/诊断。
 */
import type {
  Diagnostic,
  EvaluationResult,
  Finding,
  MeasurementSnapshot,
  MetricResult,
} from '@uiq/core';

export interface ReportFacts {
  readonly snapshot: MeasurementSnapshot;
  readonly metricResults: readonly MetricResult[];
  readonly evaluations: readonly EvaluationResult[];
  readonly findings: readonly Finding[];
  readonly diagnostics: readonly Diagnostic[];
}
