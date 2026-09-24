import type { AnalysisSnapshot, Baseline, RegressionRequest } from '../baseline/contracts';
import { diffEvaluations, type EvaluationDiff } from '../diff/evaluation-diff';
import { diffFindings } from '../diff/finding-diff';
import { evaluationKey } from '../diff/identity';
import { diffMetrics } from '../diff/metric-diff';
import { diffSubjectPresence } from '../diff/missing-targets';
import { jsonEquals } from '../internal/json-equality';
import { buildRegressionReport, type RegressionReport } from '../report/report';
import { checkComparability, type ComparabilityReason } from './comparability';
import { classifyEvaluationDiff } from './classifier';

/** AD-22：缺失 Baseline / 当前快照是输入错误 —— 不得生成回归结论，更不得报告"无回归"。 */
export class RegressionInputError extends Error {
  override readonly name = 'RegressionInputError';
  constructor(message: string) {
    super(message);
  }
}

export type RegressionOutcome =
  | { readonly status: 'COMPLETED'; readonly report: RegressionReport }
  | { readonly status: 'INCOMPARABLE'; readonly reasons: readonly ComparabilityReason[] };

/**
 * UIQ-IMPL-11 §44 Pipeline：Identity Matching → Metric Diff → Evaluation Diff →
 * Finding Diff → Classification。§56：不重新执行 Rule —— 只比较两侧已有 EvaluationResult。
 * 不可比（AD-23）返回 INCOMPARABLE（无六类结论）；可比时产出完整报告。
 */
export function runRegression(request: RegressionRequest): RegressionOutcome {
  if (request === null || typeof request !== 'object') {
    throw new RegressionInputError('回归请求缺失：必须提供 { baseline, current }');
  }
  if (request.baseline === undefined || request.baseline === null) {
    throw new RegressionInputError(
      '缺少 Baseline：未重新测量或没有 Baseline 时不得生成回归结论（不报告"无回归"）',
    );
  }
  if (request.current === undefined || request.current === null) {
    throw new RegressionInputError('缺少当前快照（current）：未重新测量时不得生成回归结论');
  }
  const { baseline, current } = request;
  const comparability = checkComparability(baseline, current);
  if (!comparability.comparable) {
    return { status: 'INCOMPARABLE', reasons: comparability.reasons };
  }
  const metricChanges = diffMetrics(baseline, current);
  const findingChanges = diffFindings(baseline, current);
  const missingTargets = diffSubjectPresence(baseline, current);
  const evaluationChanges = classifyEvaluationDiffs(
    baseline,
    current,
    diffEvaluations(baseline, current),
  );
  const report = buildRegressionReport({
    baseline,
    current,
    metricChanges,
    evaluationChanges,
    findingChanges,
    missingTargets,
  });
  return { status: 'COMPLETED', report };
}

/**
 * 填写 category/note：仅双侧都在的评价参与六类分类（单侧缺失属于目标消失，
 * 由 missingTargets 记录事实，不产生"修复"结论 —— AD-23）。
 * metricChanged 按两侧嵌入的 metricResult 深值判定（证据变化 ⇒ 结果变化的前提事实）。
 */
function classifyEvaluationDiffs(
  baseline: Baseline,
  current: AnalysisSnapshot,
  diffs: readonly EvaluationDiff[],
): EvaluationDiff[] {
  const baselineByKey = new Map(baseline.evaluations.map((e) => [evaluationKey(e), e] as const));
  const currentByKey = new Map(current.evaluations.map((e) => [evaluationKey(e), e] as const));
  return diffs.map((diff) => {
    if (diff.before === undefined || diff.after === undefined) return diff;
    const key = evaluationKey(diff);
    const beforeEvaluation = baselineByKey.get(key);
    const afterEvaluation = currentByKey.get(key);
    const metricChanged = !jsonEquals(
      beforeEvaluation?.metricResult,
      afterEvaluation?.metricResult,
    );
    const { category, note } = classifyEvaluationDiff(diff.before, diff.after, metricChanged);
    return {
      ...diff,
      ...(category !== undefined ? { category } : {}),
      ...(note !== undefined ? { note } : {}),
    };
  });
}
