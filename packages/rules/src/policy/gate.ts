import type { Severity } from '@uiq/core';
import type { EvaluationSummary } from '../evaluation/types';

/**
 * 六类回归计数（IMPL-11 §59）。结构化标量 DTO：形状兼容 @uiq/regression 的
 * RegressionSummary，但本包不依赖 regression/conformance（ARCH-01 §4.3：
 * Release Gate 在 rules 中只接收 core 评价与结构化政策事实 DTO）。
 */
export interface RegressionSummaryCounts {
  readonly newFailures: number;
  readonly fixedFailures: number;
  readonly persistingFailures: number;
  readonly changedResults: number;
  readonly newUnknowns: number;
  readonly resolvedUnknowns: number;
}

/** Gate 可感知的回归分类名（与 regression 包字符串字面量对齐，非类型依赖）。 */
export type GateRegressionCategory =
  | 'NEW_FAILURE'
  | 'FIXED_FAILURE'
  | 'PERSISTING_FAILURE'
  | 'CHANGED_RESULT'
  | 'NEW_UNKNOWN'
  | 'RESOLVED_UNKNOWN';

export interface GateInput {
  /** 评价六态计数（ER-02 §68）。 */
  readonly evaluationSummary: EvaluationSummary;
  /** FAIL 评价的最高 severity（无 FAIL 时缺席）—— ER-02 §64 severity 映射的输入。 */
  readonly highestFailureSeverity?: Severity;
  /** 回归摘要（无 Baseline 比对时缺席：无回归事实 ≠ 无回归，AD-22 由调用方守卫）。 */
  readonly regressionSummary?: RegressionSummaryCounts;
  /** NEW_FAILURE 的最高 severity（无 NEW_FAILURE 时缺席）—— IMPL-11 §62 示例的输入。 */
  readonly highestNewFailureSeverity?: Severity;
}

export interface GatePolicy {
  readonly id: string;
  readonly version: string;
  /** 映射为 BLOCK 的 FAIL severity（ER-02 §64 默认 CRITICAL/HIGH）。 */
  readonly blockingSeverities: readonly Severity[];
  /** 映射为 WARN 的 FAIL severity（默认 MEDIUM；LOW/INFO → INFO 不升级）。 */
  readonly warningSeverities: readonly Severity[];
  /** 映射为 BLOCK 的回归分类（IMPL-11 §62 示例：NEW_FAILURE）。 */
  readonly regressionBlockingCategories: readonly GateRegressionCategory[];
  /** 映射为 WARN 的回归分类（默认 CHANGED_RESULT）。 */
  readonly regressionWarningCategories: readonly GateRegressionCategory[];
}

/** 默认政策：ER-02 §64 severity 映射 + IMPL-11 §62 示例回归分类。 */
export const DEFAULT_GATE_POLICY: GatePolicy = {
  id: 'uiq.release-gate',
  version: '1.0.0',
  blockingSeverities: ['CRITICAL', 'HIGH'],
  warningSeverities: ['MEDIUM'],
  regressionBlockingCategories: ['NEW_FAILURE'],
  regressionWarningCategories: ['CHANGED_RESULT'],
};

export type GateDecision = 'ALLOW' | 'WARN' | 'BLOCK';

export interface GateResult {
  readonly decision: GateDecision;
  readonly reasons: readonly string[];
}

const DECISION_RANK: Readonly<Record<GateDecision, number>> = { ALLOW: 0, WARN: 1, BLOCK: 2 };

/**
 * Release Gate 纯函数：评价六态计数 + 回归摘要 + severity 标量 → ALLOW/WARN/BLOCK。
 *
 * 语义边界（IMPL-11 §60-63）：Gate=BLOCK 是治理决策，≠ Evaluation=FAIL——
 * FAIL 结果在 LOW/INFO 政策下可 ALLOW；Gate 不重新执行 Rule、不读取快照，
 * 只消费调用方投影的标量事实。
 */
export function evaluateGate(
  input: GateInput,
  policy: GatePolicy = DEFAULT_GATE_POLICY,
): GateResult {
  const reasons: string[] = [];
  let decision: GateDecision = 'ALLOW';
  const escalate = (target: GateDecision, reason: string): void => {
    reasons.push(reason);
    if (DECISION_RANK[target] > DECISION_RANK[decision]) decision = target;
  };

  // 评价侧（ER-02 §64：CRITICAL/HIGH FAIL→BLOCK、MEDIUM→WARN、LOW→INFO）。
  const { evaluationSummary } = input;
  if (evaluationSummary.fail > 0) {
    const severity = input.highestFailureSeverity;
    if (severity !== undefined && policy.blockingSeverities.includes(severity)) {
      escalate('BLOCK', `评价：${evaluationSummary.fail} 个 FAIL（最高 ${severity}）→ BLOCK`);
    } else if (severity !== undefined && policy.warningSeverities.includes(severity)) {
      escalate('WARN', `评价：${evaluationSummary.fail} 个 FAIL（最高 ${severity}）→ WARN`);
    } else {
      escalate(
        'ALLOW',
        `评价：${evaluationSummary.fail} 个 FAIL（最高 ${severity ?? '未知'}）→ INFO，不升级`,
      );
    }
  } else {
    reasons.push(
      `评价：PASS ${evaluationSummary.pass}、WARN ${evaluationSummary.warn}、NOT_APPLICABLE ${evaluationSummary.notApplicable}、UNKNOWN ${evaluationSummary.unknown}、ERROR ${evaluationSummary.error}，无 FAIL`,
    );
  }

  // 回归侧（IMPL-11 §62 示例：NEW_FAILURE+HIGH→BLOCK、CHANGED_RESULT→WARN）。
  const regression = input.regressionSummary;
  if (regression !== undefined) {
    if (regression.newFailures > 0) {
      const severity = input.highestNewFailureSeverity;
      const blocking =
        policy.regressionBlockingCategories.includes('NEW_FAILURE') &&
        severity !== undefined &&
        policy.blockingSeverities.includes(severity);
      if (blocking) {
        escalate(
          'BLOCK',
          `回归：NEW_FAILURE × ${regression.newFailures}（最高 ${severity}）→ BLOCK`,
        );
      } else {
        // 新回归但 severity 缺失/低于 BLOCK 线：保守降为 WARN（不静默放行新失败）。
        escalate(
          'WARN',
          `回归：NEW_FAILURE × ${regression.newFailures}（最高 ${severity ?? '未知'}）→ WARN`,
        );
      }
    }
    if (
      regression.changedResults > 0 &&
      policy.regressionWarningCategories.includes('CHANGED_RESULT')
    ) {
      escalate('WARN', `回归：CHANGED_RESULT × ${regression.changedResults} → WARN`);
    }
    if (regression.fixedFailures > 0) {
      reasons.push(`回归：FIXED_FAILURE × ${regression.fixedFailures} → INFO（改善）`);
    }
    if (regression.persistingFailures > 0) {
      reasons.push(
        `回归：PERSISTING_FAILURE × ${regression.persistingFailures} → INFO（已有失败持续，评价侧已计）`,
      );
    }
    if (regression.newUnknowns > 0) {
      reasons.push(`回归：NEW_UNKNOWN × ${regression.newUnknowns} → INFO（结果不可用）`);
    }
    if (regression.resolvedUnknowns > 0) {
      reasons.push(
        `回归：RESOLVED_UNKNOWN × ${regression.resolvedUnknowns} → INFO（恢复可用 ≠ PASS）`,
      );
    }
  }

  return { decision, reasons };
}
