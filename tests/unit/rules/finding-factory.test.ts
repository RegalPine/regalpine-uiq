import { describe, expect, it } from 'vitest';
import type { EvaluationResult } from '@uiq/core';
import { FindingFactory } from '@uiq/rules';

function makeEval(
  state: 'PASS' | 'FAIL' | 'WARN' | 'NOT_APPLICABLE' | 'UNKNOWN' | 'ERROR',
  metricId = 'COLOR.CONTRAST',
): EvaluationResult {
  return {
    ruleId: 'TEST-RULE',
    ruleVersion: '1.0.0',
    subjectId: 'el-1',
    state,
    severity: 'HIGH',
    metricResult: {
      metricId,
      metricVersion: '1.0.0',
      subjectId: 'el-1',
      status: state === 'UNKNOWN' ? 'UNKNOWN' : state === 'ERROR' ? 'ERROR' : 'AVAILABLE',
      dependencies: [],
      fingerprint: '',
    },
    evidence: [],
    fingerprint: 'fp',
  };
}

describe('FindingFactory', () => {
  const factory = new FindingFactory(1000);

  it('FAIL 生成 Finding', () => {
    const findings = factory.createFindings([makeEval('FAIL')]);
    expect(findings).toHaveLength(1);
    expect(findings[0]!.state).toBe('DETECTED');
    expect(findings[0]!.severity).toBe('HIGH');
  });

  it('WARN 生成 Finding', () => {
    const findings = factory.createFindings([makeEval('WARN')]);
    expect(findings).toHaveLength(1);
  });

  it('ERROR 生成 Finding（EXECUTION_ERROR 类型）', () => {
    const findings = factory.createFindings([makeEval('ERROR')]);
    expect(findings).toHaveLength(1);
    expect(findings[0]!.type).toBe('EXECUTION_ERROR');
  });

  it('PASS 不生成 Finding', () => {
    const findings = factory.createFindings([makeEval('PASS')]);
    expect(findings).toHaveLength(0);
  });

  it('NOT_APPLICABLE 不生成 Finding', () => {
    const findings = factory.createFindings([makeEval('NOT_APPLICABLE')]);
    expect(findings).toHaveLength(0);
  });

  it('UNKNOWN 不生成 Finding', () => {
    const findings = factory.createFindings([makeEval('UNKNOWN')]);
    expect(findings).toHaveLength(0);
  });

  it('Finding ID 确定性', () => {
    const f1 = factory.createFindings([makeEval('FAIL')]);
    const f2 = factory.createFindings([makeEval('FAIL')]);
    expect(f1[0]!.id).toBe(f2[0]!.id);
  });

  it('COLOR 域 Finding 类型为 COLOR', () => {
    const findings = factory.createFindings([makeEval('FAIL', 'COLOR.CONTRAST')]);
    expect(findings[0]!.type).toBe('COLOR');
  });

  it('TYPOGRAPHY 域 Finding 类型为 TYPOGRAPHY', () => {
    const findings = factory.createFindings([makeEval('FAIL', 'TYPOGRAPHY.FONT_SIZE')]);
    expect(findings[0]!.type).toBe('TYPOGRAPHY');
  });

  it('多个评价生成对应数量 Finding', () => {
    const findings = factory.createFindings([
      makeEval('PASS'),
      makeEval('FAIL'),
      makeEval('WARN'),
      makeEval('NOT_APPLICABLE'),
    ]);
    expect(findings).toHaveLength(2);
  });
});
