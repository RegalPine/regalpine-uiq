/**
 * 影响计算（IMPL-17 §27-29）。
 * Impact 表示"修改某对象可能影响什么"；Regression 表示"修改前后实际测量发生了什么变化"，
 * 两者严格区分（IMPL-17 §30）——本模块只做潜在影响投影，不产生回归结论。
 *
 * Token Graph 的传播（Primitive→Semantic→Component→Element，§28）由调用方以只读投影
 * ImpactTrace 提供：reporting 不 import @uiq/tokens（ARCH-01 §4.2）。
 */
import type { ImpactAssessment, RecommendationTargetType } from '../model/recommendation';

/** 调用方构造的 Token 影响投影：tokenId 及其下游 dependents 与引用主题。 */
export interface ImpactTrace {
  readonly tokenId: string;
  readonly dependents: readonly string[];
  readonly themes: readonly string[];
}

export interface ImpactInput {
  readonly targetType: RecommendationTargetType;
  readonly targetIds: readonly string[];
  /** 受影响的 subject（来自 Finding 组），用于 affectedElements 计数。 */
  readonly affectedSubjectIds: readonly string[];
  /** 潜在回归区域（通常为受影响评价的规则域），调用方投影。 */
  readonly potentialRegressionAreas?: readonly string[];
  readonly impactTraces?: readonly ImpactTrace[];
}

export function calculateImpact(input: ImpactInput): ImpactAssessment {
  const traceDependents = (input.impactTraces ?? []).flatMap((trace) => trace.dependents);
  const affectedTokens =
    input.targetType === 'TOKEN'
      ? [...new Set([...input.targetIds, ...traceDependents])].sort()
      : [];
  const affectedThemes = [
    ...new Set((input.impactTraces ?? []).flatMap((trace) => trace.themes)),
  ].sort();
  return {
    affectedElements: new Set(input.affectedSubjectIds).size,
    affectedComponents: input.targetType === 'COMPONENT' ? new Set(input.targetIds).size : 0,
    affectedTokens,
    affectedThemes,
    potentialRegressionAreas: [...new Set(input.potentialRegressionAreas ?? [])].sort(),
  };
}
