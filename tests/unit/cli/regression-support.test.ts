import { describe, expect, it } from 'vitest';
import type { MeasurementSnapshot } from '@uiq/core';
import { approveBaseline } from '@uiq/regression';
import { runAnalysis, type AnalysisArtifact } from '../../../apps/cli/src/artifact';
import { toAnalysisSnapshot, toGateInput } from '../../../apps/cli/src/regression-support';
import { makeEvaluation } from '../regression/helpers';

const SOURCE = { type: 'STATIC' } as const;

function snapshot(id: string): MeasurementSnapshot {
  return {
    id,
    capturedAt: 1700000000000,
    source: SOURCE,
    measurements: [
      {
        id: 'm1',
        subjectId: 'btn',
        type: 'color.srgb',
        value: { r: 0, g: 0, b: 0, alpha: 1 },
        status: 'AVAILABLE',
        source: SOURCE,
        timestamp: 1700000000000,
      },
      {
        id: 'm2',
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

describe('toAnalysisSnapshot：AnalysisArtifact → regression 交换契约（ARCH-01 §5.1）', () => {
  it('投影保真：六字段一一对应，不复制不转换', () => {
    const artifact: AnalysisArtifact = runAnalysis(snapshot('snap-001'));
    const projected = toAnalysisSnapshot(artifact);
    expect(projected.schemaVersion).toBe(artifact.schemaVersion);
    expect(projected.snapshot).toBe(artifact.snapshot);
    expect(projected.metricResults).toBe(artifact.metricResults);
    expect(projected.evaluations).toBe(artifact.evaluations);
    expect(projected.findings).toBe(artifact.findings);
    expect(projected.diagnostics).toBe(artifact.diagnostics);
    expect(projected.engine).toBe(artifact.engine);
    expect('themeId' in projected).toBe(false);
    expect('config' in projected).toBe(false);
  });

  it('themeId 显式补充（--theme 每主题独立评价，TK-01 §33）', () => {
    const artifact = runAnalysis(snapshot('snap-001'));
    const projected = toAnalysisSnapshot(artifact, 'dark');
    expect(projected.themeId).toBe('dark');
  });

  it('投影结果满足 approveBaseline 完整性校验（可直接批准）', () => {
    const artifact = runAnalysis(snapshot('snap-001'));
    const projected = toAnalysisSnapshot(artifact);
    const baseline = approveBaselineForTest(projected);
    expect(baseline.schemaVersion).toBe(artifact.schemaVersion);
    expect(baseline.metrics.length).toBe(artifact.metricResults.length);
  });
});

function approveBaselineForTest(snapshot: Parameters<typeof approveBaseline>[0]) {
  return approveBaseline(snapshot, { id: 'bl-cli', approvedAt: '2026-09-24T00:00:00.000Z' });
}

describe('toGateInput：评价 → GateInput 投影（ER-02 §64 输入）', () => {
  it('六态计数传播 + FAIL 最高 severity（多 FAIL 取最高）', () => {
    const evaluations = [
      makeEvaluation({ subjectId: 'a', state: 'PASS', severity: 'INFO' }),
      makeEvaluation({ subjectId: 'b', state: 'PASS', severity: 'INFO' }),
      makeEvaluation({ subjectId: 'c', state: 'FAIL', severity: 'MEDIUM' }),
      makeEvaluation({ subjectId: 'd', state: 'FAIL', severity: 'HIGH', fingerprint: 'fp-h' }),
      makeEvaluation({ subjectId: 'e', state: 'WARN', severity: 'LOW' }),
      makeEvaluation({ subjectId: 'f', state: 'UNKNOWN', severity: 'INFO', fingerprint: 'fp-u' }),
    ];
    const input = toGateInput(evaluations);
    expect(input.evaluationSummary).toEqual({
      total: 6,
      pass: 2,
      fail: 2,
      warn: 1,
      notApplicable: 0,
      unknown: 1,
      error: 0,
    });
    expect(input.highestFailureSeverity).toBe('HIGH');
    expect(input.regressionSummary).toBeUndefined();
  });

  it('无 FAIL 时 highestFailureSeverity 缺席', () => {
    const input = toGateInput([makeEvaluation({ state: 'PASS' })]);
    expect(input.evaluationSummary.fail).toBe(0);
    expect('highestFailureSeverity' in input).toBe(false);
  });

  it('回归事实透传（summary + highestNewFailureSeverity）', () => {
    const regression = {
      summary: {
        newFailures: 1,
        fixedFailures: 0,
        persistingFailures: 0,
        changedResults: 2,
        newUnknowns: 0,
        resolvedUnknowns: 0,
      },
      highestNewFailureSeverity: 'CRITICAL' as const,
    };
    const input = toGateInput([makeEvaluation({ state: 'PASS' })], regression);
    expect(input.regressionSummary).toEqual(regression.summary);
    expect(input.highestNewFailureSeverity).toBe('CRITICAL');
  });
});
