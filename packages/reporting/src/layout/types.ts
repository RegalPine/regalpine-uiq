/**
 * P8：布局报告模型（计划 §P8-04）。
 *
 * 在 UIQualityReport.layout 增加 Page/Region/Component/Element 四级结构。
 * 保留原始成员引用，禁止总分。每级对原始 Evaluation 身份集合计数。
 */
import type { EvaluationState } from '@uiq/core';

/** 布局层级。 */
export type LayoutLevel = 'PAGE' | 'REGION' | 'COMPONENT' | 'ELEMENT';

/** 布局维度报告（挂在 UIQualityReport.layout）。 */
export interface LayoutDimensionReport {
  readonly schemaVersion: string;
  readonly page?: LayoutLevelReport;
  readonly regions: readonly LayoutLevelReport[];
  readonly components: readonly LayoutLevelReport[];
  readonly elements: readonly LayoutLevelReport[];
  /** 六态分布（跨层级去重计数）。 */
  readonly stateDistribution: Readonly<Record<EvaluationState, number>>;
  /** Finding 分组（按规则/约束/原因/组件/Token/主题/viewport）。 */
  readonly findingGroups: readonly LayoutFindingGroup[];
  /** 覆盖率：已评估目标 / 配置目标总数。 */
  readonly coverage: { readonly evaluated: number; readonly total: number };
}

/** 单层级报告。 */
export interface LayoutLevelReport {
  readonly level: LayoutLevel;
  readonly id: string;
  readonly memberIds: readonly string[];
  readonly evaluations: number;
  readonly stateCounts: Readonly<Record<EvaluationState, number>>;
  readonly findingIds: readonly string[];
}

/** Finding 分组。 */
export interface LayoutFindingGroup {
  readonly groupKey: string;
  readonly ruleId?: string;
  readonly constraintId?: string;
  readonly cause?: string;
  readonly componentId?: string;
  readonly tokenId?: string;
  readonly subjectId?: string;
  readonly viewport?: string;
  readonly findingIds: readonly string[];
  /** SYSTEMIC 仅在用户给出 threshold 且共享来源满足时判定。 */
  readonly isSystemic: boolean;
}

/** 布局报告 Schema 版本。 */
export const LAYOUT_REPORT_SCHEMA_VERSION = '1.1.0';

/** 空布局报告（无布局评估时使用）。 */
export function emptyLayoutReport(): LayoutDimensionReport {
  return {
    schemaVersion: LAYOUT_REPORT_SCHEMA_VERSION,
    regions: [],
    components: [],
    elements: [],
    stateDistribution: {
      PASS: 0,
      FAIL: 0,
      WARN: 0,
      NOT_APPLICABLE: 0,
      UNKNOWN: 0,
      ERROR: 0,
    },
    findingGroups: [],
    coverage: { evaluated: 0, total: 0 },
  };
}
