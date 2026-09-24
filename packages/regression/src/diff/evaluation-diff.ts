import type { EvaluationState } from '@uiq/core';
import type { AnalysisSnapshot, Baseline } from '../baseline/contracts';
import { evaluationKey } from './identity';
import type { RegressionCategory } from './categories';

/** UIQ-IMPL-11 §54：Evaluation Diff。category/note 由 classifier 填写（Task 4）。 */
export interface EvaluationDiff {
  readonly ruleId: string;
  readonly ruleVersion: string;
  readonly subjectId: string;
  readonly before?: EvaluationState;
  readonly after?: EvaluationState;
  readonly category?: RegressionCategory;
  readonly note?: string;
}

export type { RegressionCategory };

export function diffEvaluations(baseline: Baseline, current: AnalysisSnapshot): EvaluationDiff[] {
  const baselineByKey = new Map(baseline.evaluations.map((e) => [evaluationKey(e), e] as const));
  const currentByKey = new Map(current.evaluations.map((e) => [evaluationKey(e), e] as const));
  const keys = [...new Set([...baselineByKey.keys(), ...currentByKey.keys()])].sort();
  const diffs: EvaluationDiff[] = [];
  for (const key of keys) {
    const before = baselineByKey.get(key);
    const after = currentByKey.get(key);
    const identity = before ?? after;
    if (identity === undefined) continue;
    diffs.push({
      ruleId: identity.ruleId,
      ruleVersion: identity.ruleVersion,
      subjectId: identity.subjectId,
      ...(before !== undefined ? { before: before.state } : {}),
      ...(after !== undefined ? { after: after.state } : {}),
    });
  }
  return diffs;
}
