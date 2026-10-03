import { describe, expect, it } from 'vitest';
import type { MetricCalculationContext, MeasurementSnapshot } from '@uiq/core';
import { typographyTextureMetrics } from '@uiq/metrics';
import { typographyTextureRules } from '@uiq/rules';

const source = { type: 'STATIC' as const };
function makeSnapshot(m: Array<{ subjectId: string; type: string; value: unknown }>): MeasurementSnapshot { return { id: 'snap', capturedAt: 1000, source, measurements: m.map((x, i) => ({ id: `m-${i}`, subjectId: x.subjectId, type: x.type, value: x.value, status: 'AVAILABLE' as const, source, timestamp: 1000 })) }; }
function makeCtx(s: MeasurementSnapshot): MetricCalculationContext { return { subjectId: 'page-1', snapshot: s, dependencies: new Map() }; }

describe('Typography E2E', () => {
  it('Pass: 3 级排版层次', () => {
    const snap = makeSnapshot([
      { subjectId: 'e1', type: 'typography.font', value: { family: 'Arial', size: 28, weight: 700, lineHeight: 1.2 } },
      { subjectId: 'e2', type: 'typography.font', value: { family: 'Arial', size: 16, weight: 400, lineHeight: 1.5 } },
      { subjectId: 'e3', type: 'typography.font', value: { family: 'Arial', size: 12, weight: 400, lineHeight: 1.4 } },
    ]);
    const results = typographyTextureMetrics.map((m) => m.calculate(makeCtx(snap)));
    expect(results.every((r) => r.status === 'AVAILABLE')).toBe(true);
  });
  it('Fail: 空测量', () => {
    const results = typographyTextureMetrics.map((m) => m.calculate(makeCtx(makeSnapshot([]))));
    expect(results.every((r) => r.status === 'UNKNOWN')).toBe(true);
  });
  it('Rules 引用有效 Metric', () => {
    for (const rule of typographyTextureRules) { expect(rule.metricId).toMatch(/^TYPOGRAPHY\./); }
  });
});
