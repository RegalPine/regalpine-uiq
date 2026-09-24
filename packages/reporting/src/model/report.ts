/**
 * UI 质量报告顶层模型（IMPL-17 §4）。
 * 报告是只读结果派生物（ARCH-01 §5）：聚合、建议与验证条件全部由输入事实投影，不重新计算。
 */
import type { ConformanceSummary } from '@uiq/conformance';
import type { RegressionReport } from '@uiq/regression';

import type { DiagnosticSummary, FindingSummary } from './finding';
import type { ImprovementRecommendation } from './recommendation';
import type { QualityDimensionReport, QualitySummary } from './quality';
import type { ReproducibilityMetadata } from './reproducibility';
import type { ReportScope } from './scope';
import type { LayoutDimensionReport } from '../layout';

/** 报告交换契约版本（区别于报告 version 字段随引擎演进的语义）。 */
export const QUALITY_REPORT_SCHEMA_VERSION = '1.0.0';

/** 扩展交换契约版本（P8 布局扩展）。 */
export const QUALITY_REPORT_SCHEMA_VERSION_EXTENDED = '1.1.0';

export interface UIQualityReport {
  /** 报告 ID：默认由报告事实指纹派生（确定性）；可由调用方显式指定。 */
  readonly id: string;
  readonly version: string;
  readonly projectId: string;
  /** ISO-8601 字符串；由调用方显式注入（AD-04：时间不内部取时钟）。 */
  readonly generatedAt: string;
  readonly scope: ReportScope;
  readonly summary: QualitySummary;
  readonly dimensions: readonly QualityDimensionReport[];
  readonly findings: readonly FindingSummary[];
  readonly diagnostics: readonly DiagnosticSummary[];
  readonly recommendations: readonly ImprovementRecommendation[];
  readonly conformance?: ConformanceSummary;
  readonly regression?: RegressionReport;
  readonly reproducibility: ReproducibilityMetadata;
  /** P8：布局维度报告（可选，仅布局 scope 时存在）。 */
  readonly layout?: LayoutDimensionReport;
}
