/**
 * 质量维度与统计模型（IMPL-17 §5-6 / REPORT-01 §11）。
 * 九个维度为固定集合；统计只做 COUNT/SUMMARIZE，不引入分数或权重（P7 不做 UI 总分）。
 */
export type QualityDimension =
  | 'ACCESSIBILITY'
  | 'COLOR'
  | 'TYPOGRAPHY'
  | 'GEOMETRY'
  | 'SPACING'
  | 'LAYOUT'
  | 'HIERARCHY'
  | 'DESIGN_SYSTEM'
  | 'CONFORMANCE';

/** 固定顺序，保证维度聚合输出确定性（IMPL-17 §6）。 */
export const QUALITY_DIMENSIONS: readonly QualityDimension[] = [
  'ACCESSIBILITY',
  'COLOR',
  'TYPOGRAPHY',
  'GEOMETRY',
  'SPACING',
  'LAYOUT',
  'HIERARCHY',
  'DESIGN_SYSTEM',
  'CONFORMANCE',
];

/** 全局摘要（IMPL-17 §5）。六态总和必须等于 evaluations（不变式在聚合层强制）。 */
export interface QualitySummary {
  readonly measuredElements: number;
  readonly metricResults: number;
  readonly evaluations: number;
  readonly pass: number;
  readonly fail: number;
  readonly warn: number;
  readonly unknown: number;
  readonly notApplicable: number;
  readonly error: number;
  readonly findings: number;
}

/** 维度聚合报告（IMPL-17 §6）。 */
export interface QualityDimensionReport {
  readonly dimension: QualityDimension;
  readonly evaluations: number;
  readonly pass: number;
  readonly fail: number;
  readonly warn: number;
  readonly unknown: number;
  readonly notApplicable: number;
  readonly error: number;
  readonly findings: number;
}
