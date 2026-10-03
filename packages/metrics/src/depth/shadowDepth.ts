import type { MetricDefinition, MetricCalculationContext, MetricResult, Measurement } from '@uiq/core';
import { fingerprint } from '@uiq/core';
import { analyzeConsistency } from '../builtins/stats';
import type { ShadowDepthValue } from './types';

function collectShadowMeasurements(ctx: MetricCalculationContext): Measurement[] {
  return ctx.snapshot.measurements.filter((m) => m.type === 'surface.shadow' && m.status === 'AVAILABLE');
}

/** DEPTH.SHADOW.DEPTH@1.0.0 — 分析阴影深度分布。 */
export const DEPTH_SHADOW_DEPTH: MetricDefinition<ShadowDepthValue> = {
  id: 'DEPTH.SHADOW.DEPTH',
  version: '1.0.0',
  kind: 'COMPOSITE',
  dependencies: [],
  calculate(ctx: MetricCalculationContext): MetricResult<ShadowDepthValue> {
    const measurements = collectShadowMeasurements(ctx);
    if (measurements.length === 0) {
      return { metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId, status: 'UNKNOWN', dependencies: [], fingerprint: fingerprint({ metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId, status: 'UNKNOWN' }) };
    }
    const values = measurements.map((m) => m.value as { layers: readonly { blur: number; spread: number }[]; layerCount: number } | null).filter((v): v is NonNullable<typeof v> => v != null);
    const depths = values.map((v) => v.layers.reduce((sum, l) => sum + l.blur + l.spread, 0));
    const consistency = analyzeConsistency(depths);
    return {
      metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId, status: 'AVAILABLE',
      value: { populationSize: values.length, distinctDepths: new Set(depths).size, dominantDepth: consistency.dominantValue, maxDepth: Math.max(...depths) },
      dependencies: [],
      fingerprint: fingerprint({ metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId }),
    };
  },
};
