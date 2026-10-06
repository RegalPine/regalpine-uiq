import { describe, expect, it } from 'vitest';
import type { MetricCalculationContext, MeasurementSnapshot } from '@uiq/core';
import {
  surfaceMetrics, depthMetrics, colorTextureMetrics,
  typographyTextureMetrics, spatialTextureMetrics, motionTextureMetrics,
  microDetailTextureMetrics,
} from '@uiq/metrics';
import { diagnoseAllVisualTexture } from '@uiq/diagnostic';
import { aggregateVisualTexture, generateVerification, buildVisualTextureReport, recommendVisualTexture } from '@uiq/reporting';

const source = { type: 'STATIC' as const };
function makeSnapshot(m: Array<{ subjectId: string; type: string; value: unknown }>): MeasurementSnapshot { return { id: 'snap', capturedAt: 1000, source, measurements: m.map((x, i) => ({ id: `m-${i}`, subjectId: x.subjectId, type: x.type, value: x.value, status: 'AVAILABLE' as const, source, timestamp: 1000 })) }; }
function makeCtx(s: MeasurementSnapshot): MetricCalculationContext { return { subjectId: 'page-1', snapshot: s, dependencies: new Map() }; }

describe('Full Analysis E2E: 七维全分析', () => {
  it('所有 7 维度 Metric 可计算', () => {
    const snap = makeSnapshot([
      { subjectId: 'e1', type: 'surface.radius', value: { topLeft: 8, topRight: 8, bottomRight: 8, bottomLeft: 8 } },
      { subjectId: 'e1', type: 'surface.shadow', value: { layerCount: 1 } },
      { subjectId: 'e1', type: 'color.srgb', value: { r: 0.1, g: 0.45, b: 0.91, alpha: 1 } },
      { subjectId: 'e1', type: 'typography.font', value: { family: 'Arial', size: 16, weight: 400, lineHeight: 1.5 } },
      { subjectId: 'e1', type: 'geometry.dimensions', value: { width: 128, height: 64, x: 0, y: 0 } },
      { subjectId: 'e1', type: 'motion.transition', value: { property: 'all', duration: 200, timingFunction: 'ease' } },
      { subjectId: 'e1', type: 'state.interaction', value: { hasHover: true, hasFocus: true, hasActive: true, hasDisabled: true } },
    ]);
    const ctx = makeCtx(snap);

    const allMetrics = [
      ...surfaceMetrics, ...depthMetrics, ...colorTextureMetrics,
      ...typographyTextureMetrics, ...spatialTextureMetrics,
      ...motionTextureMetrics, ...microDetailTextureMetrics,
    ];
    const results = allMetrics.map((m) => m.calculate(ctx));
    const availableCount = results.filter((r) => r.status === 'AVAILABLE').length;
    expect(availableCount).toBeGreaterThan(0);
  });

  it('diagnoseAllVisualTexture 处理空输入', () => {
    expect(diagnoseAllVisualTexture([])).toEqual([]);
  });

  it('aggregateVisualTexture 处理空输入', () => {
    const agg = aggregateVisualTexture([], []);
    expect(agg.totalFindings).toBe(0);
    expect(agg.overallScore).toBe(1);
  });

  it('完整 Metric 数量: 58 (8+6+7+7+7+7+16)', () => {
    const total = surfaceMetrics.length + depthMetrics.length + colorTextureMetrics.length +
      typographyTextureMetrics.length + spatialTextureMetrics.length +
      motionTextureMetrics.length + microDetailTextureMetrics.length;
    expect(total).toBe(58);
  });
});
