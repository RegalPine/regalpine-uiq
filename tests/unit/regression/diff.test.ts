import { describe, expect, it } from 'vitest';
import {
  diffEvaluations,
  diffFindings,
  diffMetrics,
  diffSubjectPresence,
  evaluationKey,
  findingLogicKey,
  metricKey,
} from '@uiq/regression';
import {
  makeAnalysisSnapshot,
  makeBaseline,
  makeEvaluation,
  makeFinding,
  makeMetric,
} from './helpers';

describe('匹配键格式（AD-07：逻辑身份 = 目标 + 版本）', () => {
  it('metricKey / evaluationKey / findingLogicKey', () => {
    expect(metricKey(makeMetric())).toBe('COLOR.CONTRAST@1.0.0|button.primary');
    expect(evaluationKey(makeEvaluation())).toBe(
      'ACCESSIBILITY.CONTRAST.WCAG_AA@1.0.0|button.primary',
    );
    expect(findingLogicKey(makeFinding())).toBe(
      'button.primary|ACCESSIBILITY.CONTRAST.WCAG_AA@1.0.0',
    );
  });

  it('版本变化 → 不同键（同 id 不同 version 不伪判修复，AD-23）', () => {
    const v1 = evaluationKey(makeEvaluation({ ruleVersion: '1.0.0' }));
    const v2 = evaluationKey(makeEvaluation({ ruleVersion: '1.1.0' }));
    expect(v1).not.toBe(v2);
  });
});

describe('diffMetrics（IMPL-11 §53）', () => {
  it('数值变化 → changed + delta（after − before）', () => {
    const baseline = makeBaseline(
      'bl',
      makeAnalysisSnapshot({ metrics: [makeMetric({ value: 5.17 })] }),
    );
    const current = makeAnalysisSnapshot({
      snapshotId: 'snap-002',
      metrics: [makeMetric({ value: 3.21, fingerprint: 'fp2' })],
    });
    const diffs = diffMetrics(baseline, current);
    expect(diffs).toHaveLength(1);
    expect(diffs[0]?.changed).toBe(true);
    expect(diffs[0]?.before).toBe(5.17);
    expect(diffs[0]?.after).toBe(3.21);
    expect(diffs[0]?.delta).toBeCloseTo(-1.96);
  });

  it('值不变 → changed=false 无 delta 字段', () => {
    const baseline = makeBaseline(
      'bl',
      makeAnalysisSnapshot({ metrics: [makeMetric({ value: 5.17 })] }),
    );
    const current = makeAnalysisSnapshot({
      snapshotId: 'snap-002',
      metrics: [makeMetric({ value: 5.17 })],
    });
    const diffs = diffMetrics(baseline, current);
    expect(diffs[0]?.changed).toBe(false);
    expect(diffs[0]?.delta).toBeUndefined();
  });

  it('单侧指标（新增/移除）→ changed 且缺失侧 value 缺席', () => {
    const baseline = makeBaseline(
      'bl',
      makeAnalysisSnapshot({
        metrics: [
          makeMetric(),
          makeMetric({ metricId: 'GEOMETRY.WIDTH', value: 120, fingerprint: 'fp-w' }),
        ],
      }),
    );
    const current = makeAnalysisSnapshot({
      snapshotId: 'snap-002',
      metrics: [
        makeMetric(),
        makeMetric({ metricId: 'TYPOGRAPHY.FONT_SIZE', value: 16, fingerprint: 'fp-f' }),
      ],
    });
    const diffs = diffMetrics(baseline, current);
    expect(diffs).toHaveLength(3);
    const width = diffs.find((d) => d.metricId === 'GEOMETRY.WIDTH');
    const fontSize = diffs.find((d) => d.metricId === 'TYPOGRAPHY.FONT_SIZE');
    expect(width).toMatchObject({ changed: true, before: 120 });
    expect(width?.after).toBeUndefined();
    expect(fontSize).toMatchObject({ changed: true, after: 16 });
    expect(fontSize?.before).toBeUndefined();
  });

  it('UNKNOWN 化（value 消失）→ changed=true', () => {
    const baseline = makeBaseline(
      'bl',
      makeAnalysisSnapshot({ metrics: [makeMetric({ value: 5.17 })] }),
    );
    const current = makeAnalysisSnapshot({
      snapshotId: 'snap-002',
      metrics: [makeMetric({ value: undefined, status: 'UNKNOWN', fingerprint: 'fp-u' })],
    });
    expect(diffMetrics(baseline, current)[0]?.changed).toBe(true);
  });
});

describe('diffEvaluations（IMPL-11 §54，category 由 classifier 填）', () => {
  it('状态转换被记录，键不含状态', () => {
    const baseline = makeBaseline(
      'bl',
      makeAnalysisSnapshot({ evaluations: [makeEvaluation({ state: 'FAIL' })] }),
    );
    const current = makeAnalysisSnapshot({
      snapshotId: 'snap-002',
      evaluations: [makeEvaluation({ state: 'PASS' })],
    });
    const diffs = diffEvaluations(baseline, current);
    expect(diffs).toHaveLength(1);
    expect(diffs[0]).toMatchObject({ before: 'FAIL', after: 'PASS' });
    expect(diffs[0]?.category).toBeUndefined();
  });

  it('两侧状态相同也产出 diff 记录（供 CHANGED_RESULT 判定）', () => {
    const baseline = makeBaseline(
      'bl',
      makeAnalysisSnapshot({ evaluations: [makeEvaluation({ state: 'PASS' })] }),
    );
    const current = makeAnalysisSnapshot({
      snapshotId: 'snap-002',
      evaluations: [makeEvaluation({ state: 'PASS' })],
    });
    const diffs = diffEvaluations(baseline, current);
    expect(diffs).toHaveLength(1);
    expect(diffs[0]).toMatchObject({ before: 'PASS', after: 'PASS' });
  });
});

describe('diffFindings：逻辑键与内容指纹分离（AD-07 / P6-03）', () => {
  it('数值变化：同 logicKey → MATCHED + contentChanged（不打断同一逻辑问题）', () => {
    const baseline = makeBaseline(
      'bl',
      makeAnalysisSnapshot({
        findings: [makeFinding({ fingerprint: 'fp-A' })],
      }),
    );
    const current = makeAnalysisSnapshot({
      snapshotId: 'snap-002',
      findings: [makeFinding({ fingerprint: 'fp-B', id: 'finding-2' })],
    });
    const diffs = diffFindings(baseline, current);
    expect(diffs).toHaveLength(1);
    expect(diffs[0]?.status).toBe('MATCHED');
    expect(diffs[0]?.contentChanged).toBe(true);
  });

  it('证据未变（同 fingerprint）→ MATCHED + contentChanged=false', () => {
    const baseline = makeBaseline('bl', makeAnalysisSnapshot({ findings: [makeFinding()] }));
    const current = makeAnalysisSnapshot({
      snapshotId: 'snap-002',
      findings: [makeFinding({ id: 'finding-2' })],
    });
    const diffs = diffFindings(baseline, current);
    expect(diffs[0]?.status).toBe('MATCHED');
    expect(diffs[0]?.contentChanged).toBe(false);
  });

  it('数组重排不产生假 added/removed（身份与序号无关，§45）', () => {
    const a = makeFinding({ subjectId: 'subject-a', fingerprint: 'fp-a' });
    const b = makeFinding({ subjectId: 'subject-b', fingerprint: 'fp-b' });
    const baseline = makeBaseline('bl', makeAnalysisSnapshot({ findings: [a, b] }));
    const current = makeAnalysisSnapshot({ snapshotId: 'snap-002', findings: [b, a] });
    const diffs = diffFindings(baseline, current);
    expect(diffs.map((d) => d.status).sort()).toEqual(['MATCHED', 'MATCHED']);
  });

  it('规则版本变化 → 同 ruleId 不同 key → ADDED + REMOVED（不是 FAIL→PASS）', () => {
    const baseline = makeBaseline(
      'bl',
      makeAnalysisSnapshot({
        findings: [
          makeFinding({
            fingerprint: 'fp-v1',
            evaluation: makeEvaluation({ ruleVersion: '1.0.0', state: 'FAIL' }),
          }),
        ],
      }),
    );
    const current = makeAnalysisSnapshot({
      snapshotId: 'snap-002',
      findings: [
        makeFinding({
          fingerprint: 'fp-v2',
          evaluation: makeEvaluation({ ruleVersion: '1.1.0', state: 'PASS' }),
        }),
      ],
    });
    const diffs = diffFindings(baseline, current);
    expect(diffs.map((d) => d.status).sort()).toEqual(['ADDED', 'REMOVED']);
  });
});

describe('diffSubjectPresence：缺失目标事实记录（不归六类）', () => {
  it('双向缺失精确记录', () => {
    const baseline = makeBaseline(
      'bl',
      makeAnalysisSnapshot({
        evaluations: [makeEvaluation({ subjectId: 'gone' }), makeEvaluation({ subjectId: 'kept' })],
      }),
    );
    const current = makeAnalysisSnapshot({
      snapshotId: 'snap-002',
      evaluations: [
        makeEvaluation({ subjectId: 'kept' }),
        makeEvaluation({ subjectId: 'fresh', fingerprint: 'fp-fresh' }),
      ],
    });
    const missing = diffSubjectPresence(baseline, current);
    expect(missing).toEqual([
      { subjectId: 'fresh', side: 'CURRENT_ONLY' },
      { subjectId: 'gone', side: 'BASELINE_ONLY' },
    ]);
  });
});
