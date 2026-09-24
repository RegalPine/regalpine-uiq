import { describe, expect, it } from 'vitest';
import type { MeasurementSnapshot } from '@uiq/core';
import { RegressionInputError, approveBaseline, runRegression } from '@uiq/regression';
import { evaluateGate } from '@uiq/rules';
import { runAnalysis } from '../../apps/cli/src/artifact';
import { toAnalysisSnapshot, toGateInput } from '../../apps/cli/src/regression-support';

const SOURCE = { type: 'STATIC' } as const;

/** 前景灰度（on 白背景）：0=黑(21:1 PASS)、0.35≈6.98 PASS、0.4≈5.74 PASS、0.48≈4.27 FAIL、0.5≈3.98 FAIL；
 * 0.45≈4.76 落在 WARN 区间 [4.5,5.0)（warnThreshold）—— 不用于 FAIL 案例。 */
function buttonSnapshot(
  id: string,
  gray: number,
  viewport?: { width: number; height: number },
): MeasurementSnapshot {
  return {
    id,
    capturedAt: 1700000000000,
    source: SOURCE,
    ...(viewport !== undefined ? { environment: { viewport } } : {}),
    measurements: [
      {
        id: 'm-fg',
        subjectId: 'btn',
        type: 'color.srgb',
        value: { r: gray, g: gray, b: gray, alpha: 1 },
        status: 'AVAILABLE',
        source: SOURCE,
        timestamp: 1700000000000,
      },
      {
        id: 'm-bg',
        subjectId: 'btn',
        type: 'color.srgb.background',
        value: { r: 1, g: 1, b: 1, alpha: 1 },
        status: 'AVAILABLE',
        source: SOURCE,
        timestamp: 1700000000000,
      },
    ],
  };
}

function analyze(id: string, gray: number, viewport?: { width: number; height: number }) {
  return toAnalysisSnapshot(runAnalysis(buttonSnapshot(id, gray, viewport)));
}

function baselineOf(id: string, gray: number, viewport?: { width: number; height: number }) {
  return approveBaseline(analyze(id, gray, viewport), {
    id,
    approvedAt: '2026-09-24T00:00:00.000Z',
  });
}

describe('真实产物链：MeasurementSnapshot → runAnalysis → approveBaseline → runRegression', () => {
  it('对比度修复：0.5 灰(FAIL) → 黑(PASS) = FIXED_FAILURE', () => {
    const baseline = baselineOf('bl-fix', 0.5);
    const current = analyze('snap-after', 0);
    const beforeEvaluation = baseline.evaluations.find(
      (e) => e.ruleId === 'ACCESSIBILITY.CONTRAST.WCAG_AA',
    );
    expect(beforeEvaluation?.state).toBe('FAIL');

    const outcome = runRegression({ baseline, current });
    expect(outcome.status).toBe('COMPLETED');
    if (outcome.status !== 'COMPLETED') return;
    const ruleDiff = outcome.report.evaluationChanges.find(
      (d) => d.ruleId === 'ACCESSIBILITY.CONTRAST.WCAG_AA',
    );
    expect(ruleDiff?.category).toBe('FIXED_FAILURE');
    expect(outcome.report.summary.fixedFailures).toBe(1);
    // 真实引擎指纹：before FAIL / after PASS 的 metricResult 内容不同。
    expect(ruleDiff?.before).toBe('FAIL');
    expect(ruleDiff?.after).toBe('PASS');
  });

  it('对比度回退：黑(PASS) → 0.5 灰(FAIL) = NEW_FAILURE + RULE record', () => {
    const baseline = baselineOf('bl-new', 0);
    const current = analyze('snap-after', 0.5);
    const outcome = runRegression({ baseline, current });
    expect(outcome.status).toBe('COMPLETED');
    if (outcome.status !== 'COMPLETED') return;
    expect(outcome.report.summary.newFailures).toBe(1);
    const record = outcome.report.records.find((r) => r.kind === 'RULE');
    expect(record).toMatchObject({
      baselineSnapshotId: 'bl-new',
      currentSnapshotId: 'snap-after',
      subjectId: 'btn',
      identity: 'ACCESSIBILITY.CONTRAST.WCAG_AA@1.0.0|btn',
      category: 'NEW_FAILURE',
      before: 'PASS',
      after: 'FAIL',
    });
  });

  it('结果变化但状态不变：0.35(PASS) → 0.4(PASS) = CHANGED_RESULT + 指标 delta', () => {
    const baseline = baselineOf('bl-changed', 0.35);
    const current = analyze('snap-after', 0.4);
    const outcome = runRegression({ baseline, current });
    expect(outcome.status).toBe('COMPLETED');
    if (outcome.status !== 'COMPLETED') return;
    const ruleDiff = outcome.report.evaluationChanges.find(
      (d) => d.ruleId === 'ACCESSIBILITY.CONTRAST.WCAG_AA',
    );
    expect(ruleDiff?.before).toBe('PASS');
    expect(ruleDiff?.after).toBe('PASS');
    expect(ruleDiff?.category).toBe('CHANGED_RESULT');
    expect(outcome.report.summary.changedResults).toBe(1);
    const metricDiff = outcome.report.metricChanges.find((d) => d.metricId === 'COLOR.CONTRAST');
    expect(metricDiff?.changed).toBe(true);
    // COLOR.CONTRAST 的 value 是 {ratio} 对象：两侧均变化；delta 仅数值 value 产出。
    expect(metricDiff?.before).toMatchObject({ ratio: expect.any(Number) });
    expect(metricDiff?.after).toMatchObject({ ratio: expect.any(Number) });
  });

  it('PERSISTING：0.5 灰(FAIL) → 0.48 灰(FAIL) = PERSISTING_FAILURE（不判修复）', () => {
    const baseline = baselineOf('bl-persist', 0.5);
    const current = analyze('snap-after', 0.48);
    const outcome = runRegression({ baseline, current });
    expect(outcome.status).toBe('COMPLETED');
    if (outcome.status !== 'COMPLETED') return;
    const ruleDiff = outcome.report.evaluationChanges.find(
      (d) => d.ruleId === 'ACCESSIBILITY.CONTRAST.WCAG_AA',
    );
    expect(ruleDiff?.category).toBe('PERSISTING_FAILURE');
    expect(outcome.report.summary.persistingFailures).toBe(1);
    expect(outcome.report.summary.fixedFailures).toBe(0);
  });
});

describe('不可比与输入守卫（端到端）', () => {
  it('viewport 不同 → INCOMPARABLE（无六类结论，summary 不产出）', () => {
    const baseline = baselineOf('bl-env', 0, { width: 800, height: 600 });
    const current = analyze('snap-env', 0, { width: 1280, height: 800 });
    const outcome = runRegression({ baseline, current });
    expect(outcome.status).toBe('INCOMPARABLE');
    if (outcome.status !== 'INCOMPARABLE') return;
    expect(outcome.reasons[0]?.aspect).toBe('ENVIRONMENT');
    expect(outcome.reasons[0]?.detail).toContain('viewport');
  });

  it('没有 Baseline 不生成回归结论（RegressionInputError，不报告"无回归"）', () => {
    const current = analyze('snap-after', 0);
    expect(() =>
      runRegression({ current } as unknown as Parameters<typeof runRegression>[0]),
    ).toThrow(RegressionInputError);
  });
});

describe('Gate 投影消费（toGateInput + evaluateGate）', () => {
  it('NEW_FAILURE(HIGH) 回归 → BLOCK；修复后 → ALLOW', () => {
    const baseline = baselineOf('bl-gate', 0);
    const regressed = analyze('snap-regressed', 0.5);
    const outcome = runRegression({ baseline, current: regressed });
    expect(outcome.status).toBe('COMPLETED');
    if (outcome.status !== 'COMPLETED') return;

    // NEW_FAILURE 的 severity 从当前侧 FAIL 评价提取（NEW_FAILURE 必对应 current 侧 FAIL）。
    const highestNewFailureSeverity = regressed.evaluations
      .filter((e) => e.state === 'FAIL')
      .map((e) => e.severity)[0];
    const gate = evaluateGate(
      toGateInput(regressed.evaluations, {
        summary: outcome.report.summary,
        ...(highestNewFailureSeverity !== undefined ? { highestNewFailureSeverity } : {}),
      }),
    );
    expect(gate.decision).toBe('BLOCK');
    expect(gate.reasons.some((r) => r.includes('NEW_FAILURE'))).toBe(true);

    // 修复后：无 FAIL、无新回归 → ALLOW。
    const fixedOutcome = runRegression({
      baseline: baselineOf('bl-gate', 0.5),
      current: analyze('snap-fixed', 0),
    });
    expect(fixedOutcome.status).toBe('COMPLETED');
    if (fixedOutcome.status !== 'COMPLETED') return;
    const fixedGate = evaluateGate(
      toGateInput(analyze('snap-fixed', 0).evaluations, {
        summary: fixedOutcome.report.summary,
      }),
    );
    expect(fixedGate.decision).toBe('ALLOW');
  });
});
