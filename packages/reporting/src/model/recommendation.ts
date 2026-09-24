/**
 * 改进建议模型（IMPL-17 §9-11/27）。
 * 建议是"Review …"级动作，不是修复完成记录；文本不得包含具体替换值（如替换色值）。
 */
import type { Evidence } from '@uiq/core';

import type { QualityDimension } from './quality';
import type { VerificationCriterion } from './verification';

export type RecommendationType =
  | 'REVIEW_MEASUREMENT'
  | 'REVIEW_METRIC'
  | 'REVIEW_RULE_CONFIGURATION'
  | 'REVIEW_TOKEN'
  | 'REVIEW_COMPONENT'
  | 'REVIEW_THEME'
  | 'REVIEW_LAYOUT'
  | 'REVIEW_TYPOGRAPHY'
  | 'REVIEW_COLOR'
  | 'REVIEW_ACCESSIBILITY';

export type RecommendationTargetType =
  | 'ELEMENT'
  | 'COMPONENT'
  | 'TOKEN'
  | 'THEME'
  | 'LAYOUT'
  | 'TYPOGRAPHY'
  | 'COLOR';

/** 建议证据引用复用 core Evidence 形状（事实回链）。 */
export type EvidenceReference = Evidence;

/** 影响评估（IMPL-17 §27）。表示"修改可能影响什么"，与 Regression（实际测量变化）严格区分（§30）。 */
export interface ImpactAssessment {
  readonly affectedElements: number;
  readonly affectedComponents: number;
  readonly affectedTokens: readonly string[];
  readonly affectedThemes: readonly string[];
  readonly potentialRegressionAreas: readonly string[];
}

export interface ImprovementRecommendation {
  readonly id: string;
  readonly type: RecommendationType;
  readonly title: string;
  readonly dimension: QualityDimension;
  readonly targetType: RecommendationTargetType;
  readonly targetIds: readonly string[];
  readonly rationale: string;
  readonly evidence: readonly EvidenceReference[];
  readonly impact: ImpactAssessment;
  readonly verification: readonly VerificationCriterion[];
  /** 建议来源 Finding ID（去重后保留，IMPL-17 §25）。 */
  readonly affectedFindingIds: readonly string[];
}
