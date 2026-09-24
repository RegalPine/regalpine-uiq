import { describe, expect, it } from 'vitest';
import {
  RegressionInputError,
  runRegression,
  classifyEvaluationDiff,
  type RegressionOutcome,
} from '@uiq/regression';
import { makeAnalysisSnapshot, makeBaseline, makeEvaluation, makeMetric } from './helpers';

/** 便捷断言：可比路径下取报告。 */
function reportOf(outcome: RegressionOutcome) {
  if (outcome.status !== 'COMPLETED') throw new Error(`期望 COMPLETED，实际 ${outcome.status}`);
  return outcome.report;
}

describe('六类分类精确断言（IMPL-11 §46-52，engine 层）', () => {
  it('PASS→FAIL = NEW_FAILURE', () => {
    const baseline = makeBaseline(
      'bl',
      makeAnalysisSnapshot({ evaluations: [makeEvaluation({ state: 'PASS' })] }),
    );
    const current = makeAnalysisSnapshot({
      snapshotId: 'snap-002',
      evaluations: [makeEvaluation({ state: 'FAIL' })],
    });
    const report = reportOf(runRegression({ baseline, current }));
    expect(report.evaluationChanges[0]?.category).toBe('NEW_FAILURE');
    expect(report.summary.newFailures).toBe(1);
  });

  it('FAIL→PASS = FIXED_FAILURE（真实修复）', () => {
    const baseline = makeBaseline(
      'bl',
      makeAnalysisSnapshot({ evaluations: [makeEvaluation({ state: 'FAIL' })] }),
    );
    const current = makeAnalysisSnapshot({
      snapshotId: 'snap-002',
      evaluations: [makeEvaluation({ state: 'PASS' })],
    });
    const report = reportOf(runRegression({ baseline, current }));
    expect(report.evaluationChanges[0]?.category).toBe('FIXED_FAILURE');
    expect(report.summary.fixedFailures).toBe(1);
  });

  it('FAIL→FAIL = PERSISTING_FAILURE，不重复计一般变化', () => {
    const baseline = makeBaseline(
      'bl',
      makeAnalysisSnapshot({ evaluations: [makeEvaluation({ state: 'FAIL' })] }),
    );
    const current = makeAnalysisSnapshot({
      snapshotId: 'snap-002',
      evaluations: [makeEvaluation({ state: 'FAIL' })],
    });
    const report = reportOf(runRegression({ baseline, current }));
    expect(report.evaluationChanges[0]?.category).toBe('PERSISTING_FAILURE');
    expect(report.summary.persistingFailures).toBe(1);
    expect(report.summary.changedResults).toBe(0);
  });

  it('PASS→PASS 且指标变化 = CHANGED_RESULT', () => {
    const baseline = makeBaseline(
      'bl',
      makeAnalysisSnapshot({
        evaluations: [makeEvaluation({ state: 'PASS', metricResult: makeMetric({ value: 4.9 }) })],
      }),
    );
    const current = makeAnalysisSnapshot({
      snapshotId: 'snap-002',
      evaluations: [
        makeEvaluation({
          state: 'PASS',
          metricResult: makeMetric({ value: 3.2, fingerprint: 'fp-after' }),
        }),
      ],
    });
    const report = reportOf(runRegression({ baseline, current }));
    expect(report.evaluationChanges[0]?.category).toBe('CHANGED_RESULT');
    expect(report.summary.changedResults).toBe(1);
  });

  it('PASS→UNKNOWN = NEW_UNKNOWN', () => {
    const baseline = makeBaseline(
      'bl',
      makeAnalysisSnapshot({ evaluations: [makeEvaluation({ state: 'PASS' })] }),
    );
    const current = makeAnalysisSnapshot({
      snapshotId: 'snap-002',
      evaluations: [makeEvaluation({ state: 'UNKNOWN' })],
    });
    const report = reportOf(runRegression({ baseline, current }));
    expect(report.evaluationChanges[0]?.category).toBe('NEW_UNKNOWN');
    expect(report.summary.newUnknowns).toBe(1);
  });

  it('UNKNOWN→PASS = RESOLVED_UNKNOWN，note 声明"恢复可用 ≠ 修复"', () => {
    const baseline = makeBaseline(
      'bl',
      makeAnalysisSnapshot({ evaluations: [makeEvaluation({ state: 'UNKNOWN' })] }),
    );
    const current = makeAnalysisSnapshot({
      snapshotId: 'snap-002',
      evaluations: [makeEvaluation({ state: 'PASS' })],
    });
    const report = reportOf(runRegression({ baseline, current }));
    expect(report.evaluationChanges[0]?.category).toBe('RESOLVED_UNKNOWN');
    expect(report.evaluationChanges[0]?.note).toContain('不计为修复');
    expect(report.summary.resolvedUnknowns).toBe(1);
    expect(report.summary.fixedFailures).toBe(0);
  });
});

describe('严格分类边界（AD-23：不新增第七类）', () => {
  it('PASS→WARN：不归类，note 标注，summary 全零', () => {
    const baseline = makeBaseline(
      'bl',
      makeAnalysisSnapshot({ evaluations: [makeEvaluation({ state: 'PASS' })] }),
    );
    const current = makeAnalysisSnapshot({
      snapshotId: 'snap-002',
      evaluations: [makeEvaluation({ state: 'WARN' })],
    });
    const report = reportOf(runRegression({ baseline, current }));
    expect(report.evaluationChanges[0]?.category).toBeUndefined();
    expect(report.evaluationChanges[0]?.note).toContain('WARN');
    expect(report.summary).toEqual({
      newFailures: 0,
      fixedFailures: 0,
      persistingFailures: 0,
      changedResults: 0,
      newUnknowns: 0,
      resolvedUnknowns: 0,
    });
  });

  it('FAIL→ERROR：不归类（ERROR 转换留给调用方精确断言）', () => {
    expect(classifyEvaluationDiff('FAIL', 'ERROR', false).category).toBeUndefined();
    expect(classifyEvaluationDiff('ERROR', 'PASS', false).category).toBeUndefined();
    expect(classifyEvaluationDiff('PASS', 'NOT_APPLICABLE', false).category).toBeUndefined();
  });

  it('UNKNOWN→UNKNOWN：无分类，note 说明', () => {
    const result = classifyEvaluationDiff('UNKNOWN', 'UNKNOWN', true);
    expect(result.category).toBeUndefined();
    expect(result.note).toBeDefined();
  });

  it('目标消失：单侧评价不分类，missingTargets 记录事实（不伪判 FIXED）', () => {
    const baseline = makeBaseline(
      'bl',
      makeAnalysisSnapshot({
        evaluations: [makeEvaluation({ subjectId: 'gone', state: 'FAIL' })],
      }),
    );
    const current = makeAnalysisSnapshot({
      snapshotId: 'snap-002',
      evaluations: [makeEvaluation({ subjectId: 'kept', fingerprint: 'fp-kept' })],
    });
    const report = reportOf(runRegression({ baseline, current }));
    expect(report.summary.fixedFailures).toBe(0);
    expect(report.missingTargets).toEqual([
      { subjectId: 'gone', side: 'BASELINE_ONLY' },
      { subjectId: 'kept', side: 'CURRENT_ONLY' },
    ]);
  });
});

describe('可比性核验（AD-23：三维度各一断言）', () => {
  it('schemaVersion 不一致 → INCOMPARABLE', () => {
    const baseline = makeBaseline('bl', makeAnalysisSnapshot({ schemaVersion: '1.0.0' }));
    const current = makeAnalysisSnapshot({ snapshotId: 'snap-002', schemaVersion: '2.0.0' });
    const outcome = runRegression({ baseline, current });
    expect(outcome.status).toBe('INCOMPARABLE');
    if (outcome.status === 'INCOMPARABLE') {
      expect(outcome.reasons.map((r) => r.aspect)).toEqual(['SCHEMA_VERSION']);
    }
  });

  it('viewport 不一致 → INCOMPARABLE', () => {
    const baseline = makeBaseline(
      'bl',
      makeAnalysisSnapshot({
        environment: { viewport: { width: 800, height: 600 } },
      }),
    );
    const current = makeAnalysisSnapshot({
      snapshotId: 'snap-002',
      environment: { viewport: { width: 1280, height: 800 } },
    });
    const outcome = runRegression({ baseline, current });
    expect(outcome.status).toBe('INCOMPARABLE');
    if (outcome.status === 'INCOMPARABLE') {
      expect(outcome.reasons[0]?.aspect).toBe('ENVIRONMENT');
      expect(outcome.reasons[0]?.detail).toContain('viewport');
    }
  });

  it('themeId 不一致 → INCOMPARABLE', () => {
    const baseline = makeBaseline('bl', makeAnalysisSnapshot({ themeId: 'light' }));
    const current = makeAnalysisSnapshot({ snapshotId: 'snap-002', themeId: 'dark' });
    const outcome = runRegression({ baseline, current });
    expect(outcome.status).toBe('INCOMPARABLE');
    if (outcome.status === 'INCOMPARABLE') {
      expect(outcome.reasons[0]?.aspect).toBe('THEME_ID');
    }
  });

  it('browser 不一致 → INCOMPARABLE（嵌套环境字段）', () => {
    const baseline = makeBaseline(
      'bl',
      makeAnalysisSnapshot({
        environment: { browser: { name: 'chromium', version: '120' } },
      }),
    );
    const current = makeAnalysisSnapshot({
      snapshotId: 'snap-002',
      environment: { browser: { name: 'chromium', version: '121' } },
    });
    expect(runRegression({ baseline, current }).status).toBe('INCOMPARABLE');
  });

  it('两侧均无 environment / themeId → 可比', () => {
    const baseline = makeBaseline('bl', makeAnalysisSnapshot());
    const current = makeAnalysisSnapshot({ snapshotId: 'snap-002' });
    expect(runRegression({ baseline, current }).status).toBe('COMPLETED');
  });
});

describe('输入守卫（AD-22：缺失输入是错误，不报告"无回归"）', () => {
  it('request 缺失 / baseline 缺失 / current 缺失 → RegressionInputError', () => {
    const baseline = makeBaseline('bl', makeAnalysisSnapshot());
    const current = makeAnalysisSnapshot({ snapshotId: 'snap-002' });
    expect(() => runRegression(null as unknown as Parameters<typeof runRegression>[0])).toThrow(
      RegressionInputError,
    );
    expect(() =>
      runRegression({ current } as unknown as Parameters<typeof runRegression>[0]),
    ).toThrow(RegressionInputError);
    expect(() =>
      runRegression({ baseline } as unknown as Parameters<typeof runRegression>[0]),
    ).toThrow(RegressionInputError);
  });
});

describe('报告（§57/§58/§71-72）', () => {
  it('records 保留 §57 字段（baselineSnapshotId/currentSnapshotId/subjectId/kind/identity/category/before/after）', () => {
    const baseline = makeBaseline(
      'bl',
      makeAnalysisSnapshot({ evaluations: [makeEvaluation({ state: 'PASS' })] }),
    );
    const current = makeAnalysisSnapshot({
      snapshotId: 'snap-002',
      evaluations: [makeEvaluation({ state: 'FAIL' })],
    });
    const report = reportOf(runRegression({ baseline, current }));
    expect(report.records).toEqual([
      {
        baselineSnapshotId: 'snap-001',
        currentSnapshotId: 'snap-002',
        subjectId: 'button.primary',
        kind: 'RULE',
        identity: 'ACCESSIBILITY.CONTRAST.WCAG_AA@1.0.0|button.primary',
        category: 'NEW_FAILURE',
        before: 'PASS',
        after: 'FAIL',
      },
    ]);
  });

  it('指标变化产出 METRIC record（category: null）', () => {
    const baseline = makeBaseline(
      'bl',
      makeAnalysisSnapshot({ metrics: [makeMetric({ value: 4.9 })] }),
    );
    const current = makeAnalysisSnapshot({
      snapshotId: 'snap-002',
      metrics: [makeMetric({ value: 3.2, fingerprint: 'fp-after' })],
    });
    const report = reportOf(runRegression({ baseline, current }));
    const metricRecord = report.records.find((r) => r.kind === 'METRIC');
    expect(metricRecord).toMatchObject({
      subjectId: 'button.primary',
      identity: 'COLOR.CONTRAST@1.0.0|button.primary',
      category: null,
      before: 4.9,
      after: 3.2,
    });
  });

  it('同输入两次 runRegression → fingerprint 相同；输入不同 → fingerprint 不同', () => {
    const baseline = makeBaseline(
      'bl',
      makeAnalysisSnapshot({ evaluations: [makeEvaluation({ state: 'FAIL' })] }),
    );
    const current = makeAnalysisSnapshot({
      snapshotId: 'snap-002',
      evaluations: [makeEvaluation({ state: 'PASS' })],
    });
    const first = reportOf(runRegression({ baseline, current }));
    const second = reportOf(runRegression({ baseline, current }));
    expect(second.fingerprint).toBe(first.fingerprint);
    const other = makeAnalysisSnapshot({
      snapshotId: 'snap-002',
      evaluations: [makeEvaluation({ state: 'FAIL' })],
    });
    const third = reportOf(runRegression({ baseline, current: other }));
    expect(third.fingerprint).not.toBe(first.fingerprint);
  });

  it('无变化的可比对 → 全零 summary、空 records、仍有 fingerprint', () => {
    const snapshot = makeAnalysisSnapshot();
    const baseline = makeBaseline('bl', snapshot);
    const current = makeAnalysisSnapshot({ snapshotId: 'snap-002' });
    const report = reportOf(runRegression({ baseline, current }));
    expect(report.summary).toEqual({
      newFailures: 0,
      fixedFailures: 0,
      persistingFailures: 0,
      changedResults: 0,
      newUnknowns: 0,
      resolvedUnknowns: 0,
    });
    expect(report.records).toEqual([]);
    expect(report.fingerprint).toMatch(/^[0-9a-f]{64}$/);
  });
});
