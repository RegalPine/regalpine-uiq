/**
 * 建议规则接口（IMPL-17 §14）。
 * 规则本身不计算 Metric，只从上下文事实匹配并生成建议草稿。
 */
import type { QualityDimension } from '../model/quality';
import type { VerificationCriterion } from '../model/verification';
import type {
  EvidenceReference,
  RecommendationTargetType,
  RecommendationType,
} from '../model/recommendation';
import type { RecommendationContext } from './context';

/** 规则产出的建议草稿；id 与 impact 由引擎统一派生（IMPL-17 §26/§27）。 */
export interface RecommendationDraft {
  readonly type: RecommendationType;
  readonly title: string;
  readonly dimension: QualityDimension;
  readonly targetType: RecommendationTargetType;
  readonly targetIds: readonly string[];
  readonly rationale: string;
  readonly evidence: readonly EvidenceReference[];
  readonly verification: readonly VerificationCriterion[];
  readonly affectedFindingIds: readonly string[];
  /** 建议关联的规则域（进入 impact.potentialRegressionAreas）。 */
  readonly ruleDomains?: readonly string[];
}

export interface RecommendationRule {
  readonly id: string;
  readonly version: string;
  matches(context: RecommendationContext): boolean;
  generate(context: RecommendationContext): readonly RecommendationDraft[];
}
