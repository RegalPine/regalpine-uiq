/**
 * 建议引擎（IMPL-17 §12/§25/§26/§34）。
 * 按注册表顺序执行规则 → 全局去重合并 → 指纹派生 ID → 计算影响 → 确定性排序。
 * 多个 Finding 产生同一建议时合并为一条，并保留 affectedFindingIds 追溯（§25）。
 */
import { canonicalJson, fingerprint } from '@uiq/core';
import type { Severity } from '@uiq/core';

import { calculateImpact } from '../impact/calculate-impact';
import type { ImprovementRecommendation } from '../model/recommendation';
import type { QualityDimension } from '../model/quality';
import { QUALITY_DIMENSIONS } from '../model/quality';
import type { RecommendationContext } from './context';
import type { RecommendationDraft } from './recommendation-rule';
import type { RecommendationRuleRegistry } from './registry';

/** 建议引擎接口（IMPL-17 §12）。 */
export interface RecommendationEngine {
  recommend(context: RecommendationContext): readonly ImprovementRecommendation[];
}

const SEVERITY_RANK: Readonly<Record<Severity, number>> = {
  INFO: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

const DIMENSION_ORDER = new Map<QualityDimension, number>(QUALITY_DIMENSIONS.map((d, i) => [d, i]));

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}

function dedupByCanonical<T>(items: readonly T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    const key = canonicalJson(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}

function runRecommendation(
  context: RecommendationContext,
  registry: RecommendationRuleRegistry,
): readonly ImprovementRecommendation[] {
  const severityByFinding = new Map<string, Severity>(
    context.findings.map((f) => [f.id, f.severity]),
  );
  const subjectByFinding = new Map<string, string>(
    context.findings.map((f) => [f.id, f.subjectId]),
  );

  // 1. 执行规则收集草稿（注册表 list 顺序稳定）。
  const drafts: RecommendationDraft[] = [];
  for (const rule of registry.list()) {
    if (rule.matches(context)) {
      drafts.push(...rule.generate(context));
    }
  }

  // 2. 按 (type, dimension, targetType, targetIds) 合并去重。
  const merged = new Map<string, RecommendationDraft>();
  for (const draft of drafts) {
    const targetIds = [...draft.targetIds].sort();
    const key = `${draft.type}|${draft.dimension}|${draft.targetType}|${targetIds.join(',')}`;
    const existing = merged.get(key);
    if (existing === undefined) {
      merged.set(key, { ...draft, targetIds });
    } else {
      merged.set(key, {
        ...existing,
        evidence: dedupByCanonical([...existing.evidence, ...draft.evidence]),
        verification: dedupByCanonical([...existing.verification, ...draft.verification]),
        affectedFindingIds: sortedUnique([
          ...existing.affectedFindingIds,
          ...draft.affectedFindingIds,
        ]),
        ruleDomains: sortedUnique([...(existing.ruleDomains ?? []), ...(draft.ruleDomains ?? [])]),
      });
    }
  }

  // 3. 派生 ID 与影响，产出最终建议。
  const recommendations: ImprovementRecommendation[] = [];
  for (const draft of merged.values()) {
    const evidence = dedupByCanonical(draft.evidence);
    recommendations.push({
      id: fingerprint({
        type: draft.type,
        dimension: draft.dimension,
        targetType: draft.targetType,
        targetIds: draft.targetIds,
        evidence,
      }),
      type: draft.type,
      title: draft.title,
      dimension: draft.dimension,
      targetType: draft.targetType,
      targetIds: draft.targetIds,
      rationale: draft.rationale,
      evidence,
      impact: calculateImpact({
        targetType: draft.targetType,
        targetIds: draft.targetIds,
        affectedSubjectIds: draft.affectedFindingIds
          .map((id) => subjectByFinding.get(id))
          .filter((s): s is string => s !== undefined),
        ...(draft.ruleDomains !== undefined ? { potentialRegressionAreas: draft.ruleDomains } : {}),
        ...(context.impactTraces !== undefined ? { impactTraces: context.impactTraces } : {}),
      }),
      verification: draft.verification,
      affectedFindingIds: draft.affectedFindingIds,
    });
  }

  // 4. 确定性排序：dimension → severity → targetType → targetIds → id（IMPL-17 §34）。
  return recommendations.sort((a, b) => {
    const dimA = DIMENSION_ORDER.get(a.dimension) ?? Number.MAX_SAFE_INTEGER;
    const dimB = DIMENSION_ORDER.get(b.dimension) ?? Number.MAX_SAFE_INTEGER;
    if (dimA !== dimB) return dimA - dimB;
    const sevDelta =
      SEVERITY_RANK[b.affectedFindingIds.length > 0 ? severityFor(b, severityByFinding) : 'INFO'] -
      SEVERITY_RANK[a.affectedFindingIds.length > 0 ? severityFor(a, severityByFinding) : 'INFO'];
    if (sevDelta !== 0) return sevDelta;
    if (a.targetType !== b.targetType) return a.targetType < b.targetType ? -1 : 1;
    const t = a.targetIds.join(',').localeCompare(b.targetIds.join(','));
    if (t !== 0) return t;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}

function severityFor(
  recommendation: ImprovementRecommendation,
  severityByFinding: ReadonlyMap<string, Severity>,
): Severity {
  let highest: Severity = 'INFO';
  for (const id of recommendation.affectedFindingIds) {
    const severity = severityByFinding.get(id);
    if (severity !== undefined && SEVERITY_RANK[severity] > SEVERITY_RANK[highest])
      highest = severity;
  }
  return highest;
}

/** 默认引擎实现：持有一个规则注册表。 */
export class DefaultRecommendationEngine implements RecommendationEngine {
  constructor(private readonly registry: RecommendationRuleRegistry) {}

  recommend(context: RecommendationContext): readonly ImprovementRecommendation[] {
    return runRecommendation(context, this.registry);
  }
}

/** 纯函数形态：显式传入注册表（与类实现等价）。 */
export function recommend(
  context: RecommendationContext,
  registry: RecommendationRuleRegistry,
): readonly ImprovementRecommendation[] {
  return runRecommendation(context, registry);
}
