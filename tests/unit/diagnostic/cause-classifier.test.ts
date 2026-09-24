import { describe, expect, it } from 'vitest';
import type { Finding, FindingType, MetricResult } from '@uiq/core';
import { classifyCause } from '@uiq/diagnostic';

let counter = 0;

function makeMetricResult(
  metricId: string,
  status: 'AVAILABLE' | 'UNKNOWN' | 'ERROR' = 'AVAILABLE',
): MetricResult {
  return {
    metricId,
    metricVersion: '1.0.0',
    subjectId: 'el-1',
    status,
    dependencies: [],
    fingerprint: '',
    ...(status === 'AVAILABLE' ? { value: 4.2 } : {}),
  };
}

function makeFinding(type: FindingType, metricId = 'COLOR.CONTRAST'): Finding {
  counter += 1;
  return {
    id: `F-test-${counter}`,
    fingerprint: 'fp',
    type,
    state: 'DETECTED',
    severity: 'HIGH',
    subjectId: 'el-1',
    evaluation: {
      ruleId: 'TEST.RULE',
      ruleVersion: '1.0.0',
      subjectId: 'el-1',
      state: 'FAIL',
      severity: 'HIGH',
      metricResult: makeMetricResult(metricId),
      evidence: [],
      fingerprint: 'fp',
    },
    evidence: [],
    createdAt: 1000,
    updatedAt: 1000,
  };
}

describe('classifyCause', () => {
  it('MetricResult.status = ERROR → METRIC', () => {
    const finding = makeFinding('COLOR');
    const cause = classifyCause(finding, makeMetricResult('COLOR.CONTRAST', 'ERROR'));
    expect(cause).toBe('METRIC');
  });

  it('MetricResult.status = UNKNOWN → MEASUREMENT', () => {
    const finding = makeFinding('COLOR');
    const cause = classifyCause(finding, makeMetricResult('COLOR.CONTRAST', 'UNKNOWN'));
    expect(cause).toBe('MEASUREMENT');
  });

  it('TOKEN.* Metric → TOKEN', () => {
    const finding = makeFinding('TOKEN_DEVIATION', 'TOKEN.COLOR.PRIMARY');
    const cause = classifyCause(finding, makeMetricResult('TOKEN.COLOR.PRIMARY'));
    expect(cause).toBe('TOKEN');
  });

  it('COLOR.* Metric → MEASUREMENT', () => {
    const finding = makeFinding('COLOR');
    const cause = classifyCause(finding, makeMetricResult('COLOR.CONTRAST'));
    expect(cause).toBe('MEASUREMENT');
  });

  it('TYPOGRAPHY.* Metric → MEASUREMENT', () => {
    const finding = makeFinding('TYPOGRAPHY');
    const cause = classifyCause(finding, makeMetricResult('TYPOGRAPHY.FONT_SIZE'));
    expect(cause).toBe('MEASUREMENT');
  });

  it('GEOMETRY.* Metric → MEASUREMENT', () => {
    const finding = makeFinding('VALUE_VIOLATION');
    const cause = classifyCause(finding, makeMetricResult('GEOMETRY.OVERLAP'));
    expect(cause).toBe('MEASUREMENT');
  });

  it('Finding.type = TOKEN_DEVIATION → TOKEN', () => {
    const finding = makeFinding('TOKEN_DEVIATION', 'OTHER.METRIC');
    const cause = classifyCause(finding, makeMetricResult('OTHER.METRIC'));
    expect(cause).toBe('TOKEN');
  });

  it('Finding.type = THEME_DEVIATION → THEME', () => {
    const finding = makeFinding('THEME_DEVIATION', 'OTHER.METRIC');
    const cause = classifyCause(finding, makeMetricResult('OTHER.METRIC'));
    expect(cause).toBe('THEME');
  });

  it('Finding.type = COMPONENT_DEVIATION → COMPONENT', () => {
    const finding = makeFinding('COMPONENT_DEVIATION', 'OTHER.METRIC');
    const cause = classifyCause(finding, makeMetricResult('OTHER.METRIC'));
    expect(cause).toBe('COMPONENT');
  });

  it('Finding.type = EXECUTION_ERROR → CONFIGURATION', () => {
    const finding = makeFinding('EXECUTION_ERROR', 'OTHER.METRIC');
    const cause = classifyCause(finding, makeMetricResult('OTHER.METRIC'));
    expect(cause).toBe('CONFIGURATION');
  });

  it('无法推断时返回 UNKNOWN', () => {
    const finding = makeFinding('VALUE_VIOLATION', 'OTHER.METRIC');
    const cause = classifyCause(finding, makeMetricResult('OTHER.METRIC'));
    expect(cause).toBe('UNKNOWN');
  });
});
