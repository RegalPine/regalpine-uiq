import { describe, expect, it } from 'vitest';
import { DEFAULT_GATE_POLICY, evaluateGate, type GateInput } from '@uiq/rules';

const ZERO_REGRESSION = {
  newFailures: 0,
  fixedFailures: 0,
  persistingFailures: 0,
  changedResults: 0,
  newUnknowns: 0,
  resolvedUnknowns: 0,
} as const;

function makeSummary(counts: Partial<Record<string, number>>): GateInput['evaluationSummary'] {
  const pass = counts.pass ?? 0;
  const fail = counts.fail ?? 0;
  const warn = counts.warn ?? 0;
  const notApplicable = counts.notApplicable ?? 0;
  const unknown = counts.unknown ?? 0;
  const error = counts.error ?? 0;
  return {
    total: pass + fail + warn + notApplicable + unknown + error,
    pass,
    fail,
    warn,
    notApplicable,
    unknown,
    error,
  };
}

describe('评价六态传播（ER-02 §64 severity 映射）', () => {
  it('全 PASS → ALLOW（无 FAIL，不升级）', () => {
    const result = evaluateGate({ evaluationSummary: makeSummary({ pass: 8 }) });
    expect(result.decision).toBe('ALLOW');
    expect(result.reasons[0]).toContain('无 FAIL');
  });

  it('FAIL+CRITICAL / FAIL+HIGH → BLOCK', () => {
    const high = evaluateGate({
      evaluationSummary: makeSummary({ fail: 2 }),
      highestFailureSeverity: 'HIGH',
    });
    expect(high.decision).toBe('BLOCK');
    expect(high.reasons[0]).toContain('HIGH');

    const critical = evaluateGate({
      evaluationSummary: makeSummary({ fail: 1 }),
      highestFailureSeverity: 'CRITICAL',
    });
    expect(critical.decision).toBe('BLOCK');
  });

  it('FAIL+MEDIUM → WARN', () => {
    const result = evaluateGate({
      evaluationSummary: makeSummary({ fail: 1 }),
      highestFailureSeverity: 'MEDIUM',
    });
    expect(result.decision).toBe('WARN');
  });

  it('FAIL+LOW / FAIL 无 severity 标量 → ALLOW（INFO 记录，Gate≠Evaluation=FAIL）', () => {
    const low = evaluateGate({
      evaluationSummary: makeSummary({ fail: 1 }),
      highestFailureSeverity: 'LOW',
    });
    expect(low.decision).toBe('ALLOW');
    expect(low.reasons[0]).toContain('INFO');

    const unknownSeverity = evaluateGate({ evaluationSummary: makeSummary({ fail: 1 }) });
    expect(unknownSeverity.decision).toBe('ALLOW');
  });

  it('WARN/UNKNOWN/ERROR 评价本身不升级（仅 FAIL 参与映射）', () => {
    const result = evaluateGate({
      evaluationSummary: makeSummary({ warn: 3, unknown: 1, error: 1 }),
    });
    expect(result.decision).toBe('ALLOW');
  });
});

describe('回归摘要参与判定（IMPL-11 §62 示例）', () => {
  it('NEW_FAILURE + HIGH → BLOCK', () => {
    const result = evaluateGate({
      evaluationSummary: makeSummary({ pass: 5 }),
      highestFailureSeverity: 'HIGH',
      regressionSummary: { ...ZERO_REGRESSION, newFailures: 1 },
      highestNewFailureSeverity: 'HIGH',
    });
    expect(result.decision).toBe('BLOCK');
    expect(result.reasons.some((r) => r.includes('NEW_FAILURE'))).toBe(true);
  });

  it('NEW_FAILURE 无 severity → 保守 WARN（不静默放行新失败）', () => {
    const result = evaluateGate({
      evaluationSummary: makeSummary({ pass: 5 }),
      regressionSummary: { ...ZERO_REGRESSION, newFailures: 2 },
    });
    expect(result.decision).toBe('WARN');
  });

  it('CHANGED_RESULT → WARN（默认政策）', () => {
    const result = evaluateGate({
      evaluationSummary: makeSummary({ pass: 5 }),
      regressionSummary: { ...ZERO_REGRESSION, changedResults: 3 },
    });
    expect(result.decision).toBe('WARN');
    expect(result.reasons.some((r) => r.includes('CHANGED_RESULT'))).toBe(true);
  });

  it('FIXED_FAILURE/PERSISTING/UNKNOWN 类 → 仅 INFO 记录，不升级', () => {
    const result = evaluateGate({
      evaluationSummary: makeSummary({ pass: 5 }),
      regressionSummary: {
        ...ZERO_REGRESSION,
        fixedFailures: 1,
        persistingFailures: 1,
        newUnknowns: 1,
        resolvedUnknowns: 1,
      },
    });
    expect(result.decision).toBe('ALLOW');
    expect(result.reasons.some((r) => r.includes('FIXED_FAILURE'))).toBe(true);
    expect(result.reasons.some((r) => r.includes('恢复可用'))).toBe(true);
  });

  it('BLOCK 优先级高于 WARN（NEW_FAILURE+HIGH 与 CHANGED_RESULT 并存）', () => {
    const result = evaluateGate({
      evaluationSummary: makeSummary({ pass: 5 }),
      regressionSummary: { ...ZERO_REGRESSION, newFailures: 1, changedResults: 2 },
      highestNewFailureSeverity: 'CRITICAL',
    });
    expect(result.decision).toBe('BLOCK');
  });
});

describe('无回归摘要时仅按评价判定', () => {
  it('无 regressionSummary：FAIL+HIGH 仍 BLOCK（不因缺回归而放宽）', () => {
    const result = evaluateGate({
      evaluationSummary: makeSummary({ pass: 4, fail: 1 }),
      highestFailureSeverity: 'HIGH',
    });
    expect(result.decision).toBe('BLOCK');
    expect(result.reasons.every((r) => !r.startsWith('回归：'))).toBe(true);
  });

  it('自定义政策：可放行 HIGH（治理决策 ≠ 评价结果）', () => {
    const result = evaluateGate(
      {
        evaluationSummary: makeSummary({ fail: 1 }),
        highestFailureSeverity: 'HIGH',
        regressionSummary: { ...ZERO_REGRESSION, newFailures: 1 },
        highestNewFailureSeverity: 'HIGH',
      },
      {
        ...DEFAULT_GATE_POLICY,
        id: 'uiq.lenient-gate',
        blockingSeverities: ['CRITICAL'],
        regressionBlockingCategories: [],
      },
    );
    expect(result.decision).toBe('WARN');
  });

  it('DEFAULT_GATE_POLICY 契约形状（ER-02 §64 + IMPL-11 §62）', () => {
    expect(DEFAULT_GATE_POLICY.blockingSeverities).toEqual(['CRITICAL', 'HIGH']);
    expect(DEFAULT_GATE_POLICY.warningSeverities).toEqual(['MEDIUM']);
    expect(DEFAULT_GATE_POLICY.regressionBlockingCategories).toEqual(['NEW_FAILURE']);
    expect(DEFAULT_GATE_POLICY.regressionWarningCategories).toEqual(['CHANGED_RESULT']);
  });
});
