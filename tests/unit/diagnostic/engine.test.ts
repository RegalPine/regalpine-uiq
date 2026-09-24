import { describe, expect, it } from 'vitest';
import type { Finding, MetricResult } from '@uiq/core';
import { DiagnosticEngine } from '@uiq/diagnostic';

function makeMetricResult(
  subjectId: string,
  metricId: string,
  value: unknown,
  status: 'AVAILABLE' | 'UNKNOWN' | 'ERROR' = 'AVAILABLE',
): MetricResult {
  return {
    metricId,
    metricVersion: '1.0.0',
    subjectId,
    status,
    value,
    dependencies: [],
    fingerprint: '',
  };
}

function makeFinding(subjectId: string, metricId: string, evidenceCount = 1): Finding {
  const metricResult = makeMetricResult(subjectId, metricId, { ratio: 4.4 });
  const evidence = Array.from({ length: evidenceCount }, (_, i) => ({
    id: `ev-${i}`,
    type: 'METRIC' as const,
    referenceId: `${metricId}@1.0.0`,
    relation: 'EVALUATED_BY' as const,
  }));
  return {
    id: 'F-abc12345',
    fingerprint: 'fp',
    type: 'COLOR',
    state: 'DETECTED',
    severity: 'HIGH',
    subjectId,
    evaluation: {
      ruleId: 'ACCESSIBILITY.CONTRAST.WCAG_AA',
      ruleVersion: '1.0.0',
      subjectId,
      state: 'FAIL',
      severity: 'HIGH',
      metricResult,
      evidence,
      fingerprint: 'fp',
      message: 'ACCESSIBILITY.CONTRAST.WCAG_AA: 值 4.4 未达要求 4.5',
    },
    evidence,
    createdAt: 1000,
    updatedAt: 1000,
  };
}

describe('DiagnosticEngine', () => {
  const engine = new DiagnosticEngine();

  it('每个 Finding 生成一个 Diagnostic', () => {
    const findings = [makeFinding('el-1', 'COLOR.CONTRAST'), makeFinding('el-2', 'COLOR.CONTRAST')];
    const diagnostics = engine.diagnose(findings, []);
    expect(diagnostics).toHaveLength(2);
  });

  it('空 Finding 列表返回空诊断', () => {
    expect(engine.diagnose([], [])).toHaveLength(0);
  });

  it('findingId 与 Finding 关联', () => {
    const findings = [makeFinding('el-1', 'COLOR.CONTRAST')];
    const diagnostics = engine.diagnose(findings, []);
    expect(diagnostics[0]!.findingId).toBe('F-abc12345');
  });

  it('Diagnostic ID 确定性且带 DX- 前缀', () => {
    const findings = [makeFinding('el-1', 'COLOR.CONTRAST')];
    const d1 = engine.diagnose(findings, []);
    const d2 = engine.diagnose(findings, []);
    expect(d1[0]!.id).toMatch(/^DX-/);
    expect(d1[0]!.id).toBe(d2[0]!.id);
  });

  it('对比度 FAIL → cause = MEASUREMENT', () => {
    const findings = [makeFinding('el-1', 'COLOR.CONTRAST')];
    const diagnostics = engine.diagnose(findings, [
      makeMetricResult('el-1', 'COLOR.CONTRAST', { ratio: 4.4 }),
    ]);
    expect(diagnostics[0]!.cause).toBe('MEASUREMENT');
  });

  it('证据完整 + Metric AVAILABLE → confidence = DIRECT', () => {
    const findings = [makeFinding('el-1', 'COLOR.CONTRAST', 1)];
    const diagnostics = engine.diagnose(findings, [
      makeMetricResult('el-1', 'COLOR.CONTRAST', { ratio: 4.4 }),
    ]);
    expect(diagnostics[0]!.confidence).toBe('DIRECT');
  });

  it('Metric UNKNOWN → confidence = INFERRED', () => {
    const findings = [makeFinding('el-1', 'COLOR.CONTRAST', 1)];
    const diagnostics = engine.diagnose(findings, [
      makeMetricResult('el-1', 'COLOR.CONTRAST', undefined, 'UNKNOWN'),
    ]);
    expect(diagnostics[0]!.confidence).toBe('INFERRED');
  });

  it('无证据 → confidence = INFERRED', () => {
    const findings = [makeFinding('el-1', 'COLOR.CONTRAST', 0)];
    const diagnostics = engine.diagnose(findings, [
      makeMetricResult('el-1', 'COLOR.CONTRAST', { ratio: 4.4 }),
    ]);
    expect(diagnostics[0]!.confidence).toBe('INFERRED');
  });

  it('Evidence 包含 METRIC 引用', () => {
    const findings = [makeFinding('el-1', 'COLOR.CONTRAST')];
    const diagnostics = engine.diagnose(findings, [
      makeMetricResult('el-1', 'COLOR.CONTRAST', { ratio: 4.4 }),
    ]);
    expect(
      diagnostics[0]!.evidence.some(
        (e) => e.type === 'METRIC' && e.referenceId === 'COLOR.CONTRAST@1.0.0',
      ),
    ).toBe(true);
  });

  it('解释非空且包含度量值', () => {
    const findings = [makeFinding('el-1', 'COLOR.CONTRAST')];
    const diagnostics = engine.diagnose(findings, [
      makeMetricResult('el-1', 'COLOR.CONTRAST', { ratio: 4.4 }),
    ]);
    expect(diagnostics[0]!.explanation.length).toBeGreaterThan(0);
    expect(diagnostics[0]!.explanation).toContain('Measured COLOR.CONTRAST');
  });

  it('Metric 命中注册表时使用真实 MetricResult', () => {
    const findings = [makeFinding('el-1', 'COLOR.CONTRAST')];
    const real = makeMetricResult('el-1', 'COLOR.CONTRAST', { ratio: 3.9 });
    const diagnostics = engine.diagnose(findings, [real]);
    expect(diagnostics[0]!.explanation).toContain('3.9');
  });

  it('type 继承自 Finding', () => {
    const findings = [makeFinding('el-1', 'COLOR.CONTRAST')];
    const diagnostics = engine.diagnose(findings, []);
    expect(diagnostics[0]!.type).toBe('COLOR');
  });
});
