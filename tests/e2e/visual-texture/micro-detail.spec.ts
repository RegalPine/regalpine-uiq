import { describe, expect, it } from 'vitest';
import type { MetricCalculationContext, MeasurementSnapshot } from '@uiq/core';
import { microDetailTextureMetrics } from '@uiq/metrics';
import { microDetailTextureRules } from '@uiq/rules';

const source = { type: 'STATIC' as const };
function makeSnapshot(m: Array<{ subjectId: string; type: string; value: unknown }>): MeasurementSnapshot { return { id: 'snap', capturedAt: 1000, source, measurements: m.map((x, i) => ({ id: `m-${i}`, subjectId: x.subjectId, type: x.type, value: x.value, status: 'AVAILABLE' as const, source, timestamp: 1000 })) }; }
function makeCtx(s: MeasurementSnapshot): MetricCalculationContext { return { subjectId: 'page-1', snapshot: s, dependencies: new Map() }; }

describe('Micro Detail E2E', () => {
  it('Pass: 完整交互状态', () => {
    const snap = makeSnapshot([
      { subjectId: 'e1', type: 'state.interaction', value: { hasHover: true, hasFocus: true, hasActive: true, hasDisabled: true } },
      { subjectId: 'e1', type: 'icon.dimensions', value: { width: 16, height: 16 } },
      { subjectId: 'e1', type: 'surface.border', value: { width: 1, style: 'solid', color: '#e0e0e0' } },
      { subjectId: 'e1', type: 'surface.radius', value: { topLeft: 8, topRight: 8, bottomRight: 8, bottomLeft: 8 } },
      { subjectId: 'e1', type: 'geometry.dimensions', value: { width: 100, height: 40, x: 0, y: 0 } },
    ]);
    const results = microDetailTextureMetrics.map((m) => m.calculate(makeCtx(snap)));
    expect(results.every((r) => r.status === 'AVAILABLE')).toBe(true);
  });
  it('Fail: 空测量', () => {
    const results = microDetailTextureMetrics.map((m) => m.calculate(makeCtx(makeSnapshot([]))));
    expect(results.every((r) => r.status === 'UNKNOWN')).toBe(true);
  });
  it('Rules 引用有效 Metric (MICRO_DETAIL.*)', () => {
    for (const rule of microDetailTextureRules) { expect(rule.metricId).toMatch(/^MICRO_DETAIL\./); }
  });
  it('16 条 Rule 对应 16 个 Metric', () => {
    expect(microDetailTextureRules).toHaveLength(16);
    expect(microDetailTextureMetrics).toHaveLength(16);
  });
});
