import { describe, expect, it } from 'vitest';
import type { Finding, FindingType, MetricResult } from '@uiq/core';
import { generateExplanation } from '@uiq/diagnostic';

function makeMetric(metricId: string, value: unknown): MetricResult {
  return {
    metricId,
    metricVersion: '1.0.0',
    subjectId: 'el-1',
    status: 'AVAILABLE',
    value,
    dependencies: [],
    fingerprint: '',
  };
}

function makeFinding(
  type: FindingType,
  state: 'FAIL' | 'WARN' | 'ERROR' | 'UNKNOWN',
  message: string | undefined,
  metric: MetricResult,
): Finding {
  return {
    id: 'F-x',
    fingerprint: 'fp',
    type,
    state: 'DETECTED',
    severity: 'HIGH',
    subjectId: 'el-1',
    evaluation: {
      ruleId: 'TEST.RULE',
      ruleVersion: '1.0.0',
      subjectId: 'el-1',
      state,
      severity: 'HIGH',
      metricResult: metric,
      evidence: [],
      fingerprint: 'fp',
      ...(message !== undefined ? { message } : {}),
    },
    evidence: [],
    createdAt: 1000,
    updatedAt: 1000,
  };
}

describe('generateExplanation', () => {
  it('FAIL：包含 Measured/required/结论', () => {
    const finding = makeFinding(
      'COLOR',
      'FAIL',
      'TEST.RULE: 值 4.2 未达要求 4.5',
      makeMetric('COLOR.CONTRAST', 4.2),
    );
    const text = generateExplanation(finding, makeMetric('COLOR.CONTRAST', 4.2));
    expect(text).toContain('Measured COLOR.CONTRAST = 4.2');
    expect(text).toContain('required GTE 4.5');
    expect(text).toContain('is below the required threshold');
  });

  it('FAIL：对象值使用 JSON 格式', () => {
    const finding = makeFinding(
      'COLOR',
      'FAIL',
      'TEST.RULE: 值 {"ratio":4.48} 未达要求 4.5',
      makeMetric('COLOR.CONTRAST', { ratio: 4.48 }),
    );
    const text = generateExplanation(finding, makeMetric('COLOR.CONTRAST', { ratio: 4.48 }));
    expect(text).toContain('Measured COLOR.CONTRAST = {"ratio":4.48}');
  });

  it('WARN：提示接近警告边界', () => {
    const finding = makeFinding(
      'COLOR',
      'WARN',
      'TEST.RULE: 值 4.6 未达阈值 4.5，但满足警告阈值 5',
      makeMetric('COLOR.CONTRAST', 4.6),
    );
    const text = generateExplanation(finding, makeMetric('COLOR.CONTRAST', 4.6));
    expect(text).toContain('meets minimum but is near the warning boundary');
  });

  it('ERROR：输出执行错误信息', () => {
    const finding = makeFinding(
      'EXECUTION_ERROR',
      'ERROR',
      'boom',
      makeMetric('COLOR.CONTRAST', undefined),
    );
    const text = generateExplanation(finding, makeMetric('COLOR.CONTRAST', undefined));
    expect(text).toContain('执行 TEST.RULE 时发生错误：boom');
  });

  it('ERROR：无 message 时输出未知错误', () => {
    const finding = makeFinding(
      'EXECUTION_ERROR',
      'ERROR',
      undefined,
      makeMetric('COLOR.CONTRAST', undefined),
    );
    const text = generateExplanation(finding, makeMetric('COLOR.CONTRAST', undefined));
    expect(text).toContain('未知错误');
  });

  it('UNKNOWN：说明证据不足', () => {
    const finding = makeFinding(
      'COLOR',
      'UNKNOWN',
      undefined,
      makeMetric('COLOR.CONTRAST', undefined),
    );
    const text = generateExplanation(finding, makeMetric('COLOR.CONTRAST', undefined));
    expect(text).toContain('COLOR.CONTRAST 无法获得足够证据进行评价');
  });

  it('说明文本以句号结尾', () => {
    const finding = makeFinding(
      'TYPOGRAPHY',
      'FAIL',
      'TEST.RULE: 值 10 未达要求 12',
      makeMetric('TYPOGRAPHY.FONT_SIZE', 10),
    );
    const text = generateExplanation(finding, makeMetric('TYPOGRAPHY.FONT_SIZE', 10));
    expect(text.endsWith('.')).toBe(true);
  });
});
