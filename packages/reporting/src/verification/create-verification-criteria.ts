/**
 * 验证条件生成（IMPL-17 §31）。
 * 每个建议至少包含一个验证条件：metricId@version + ruleId@version + expectedState。
 */
import { canonicalJson } from '@uiq/core';
import type { EvaluationResult } from '@uiq/core';

import type { VerificationCriterion } from '../model/verification';

export function createVerificationCriteria(
  evaluations: readonly EvaluationResult[],
): readonly VerificationCriterion[] {
  const seen = new Set<string>();
  const criteria: VerificationCriterion[] = [];
  for (const evaluation of evaluations) {
    const criterion: VerificationCriterion = {
      metricId: evaluation.metricResult.metricId,
      metricVersion: evaluation.metricResult.metricVersion,
      ruleId: evaluation.ruleId,
      ruleVersion: evaluation.ruleVersion,
      expectedState: 'PASS',
    };
    const key = canonicalJson(criterion);
    if (!seen.has(key)) {
      seen.add(key);
      criteria.push(criterion);
    }
  }
  return criteria;
}
