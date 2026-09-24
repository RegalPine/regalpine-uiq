import type { EvaluationState } from '@uiq/core';
import type { RegressionCategory } from '../diff/categories';

export interface ClassificationResult {
  readonly category?: RegressionCategory;
  readonly note?: string;
}

/**
 * WARN/NOT_APPLICABLE/ERROR 参与的状态转换不参与六类分类（AD-23：不新增第七类；
 * ERROR 转换的语义留给调用方精确断言）。PASS/FAIL/UNKNOWN 转换映射（IMPL-11 §46-52）：
 * - PASS→FAIL = NEW_FAILURE；FAIL→PASS = FIXED_FAILURE；FAIL→FAIL = PERSISTING_FAILURE
 * - 同态非 UNKNOWN 且指标变化 = CHANGED_RESULT（FAIL→FAIL 已归 PERSISTING，不重复计）
 * - 非 UNKNOWN→UNKNOWN = NEW_UNKNOWN；UNKNOWN→非 UNKNOWN = RESOLVED_UNKNOWN
 *   （note：恢复可用 ≠ 规则 PASS，不是修复）
 */
export function classifyEvaluationDiff(
  before: EvaluationState,
  after: EvaluationState,
  metricChanged: boolean,
): ClassificationResult {
  if (NON_CLASSIFIABLE.has(before) || NON_CLASSIFIABLE.has(after)) {
    return {
      note: `状态转换 ${before}→${after} 涉及 WARN/NOT_APPLICABLE/ERROR，不参与六类分类（不新增分类）`,
    };
  }
  if (before === 'FAIL' && after === 'PASS') return { category: 'FIXED_FAILURE' };
  if (before === 'PASS' && after === 'FAIL') return { category: 'NEW_FAILURE' };
  if (before === 'FAIL' && after === 'FAIL') return { category: 'PERSISTING_FAILURE' };
  if (before === 'UNKNOWN' && after === 'UNKNOWN') {
    return { note: 'UNKNOWN→UNKNOWN：结果仍不可用，无可断言变化' };
  }
  if (before === 'UNKNOWN') {
    return { category: 'RESOLVED_UNKNOWN', note: 'UNKNOWN 恢复可用 ≠ 规则 PASS，不计为修复' };
  }
  if (after === 'UNKNOWN') return { category: 'NEW_UNKNOWN' };
  // 剩余组合只有 PASS→PASS（其余等值组合已在上文返回）。
  if (before === after && metricChanged) return { category: 'CHANGED_RESULT' };
  return {};
}

const NON_CLASSIFIABLE: ReadonlySet<EvaluationState> = new Set(['WARN', 'NOT_APPLICABLE', 'ERROR']);
