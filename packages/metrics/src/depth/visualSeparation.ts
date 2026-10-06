import type { MetricDefinition, MetricCalculationContext, MetricResult, Measurement } from '@uiq/core';
import { fingerprint } from '@uiq/core';
import type { VisualSeparationValue } from './types';

function collectSurfaceMeasurements(ctx: MetricCalculationContext): Measurement[] {
  return ctx.snapshot.measurements.filter((m) => m.type.startsWith('surface.') && m.status === 'AVAILABLE');
}

/** DEPTH.VISUAL.SEPARATION@1.0.0 — 视觉分离度证据。 */
export const DEPTH_VISUAL_SEPARATION: MetricDefinition<VisualSeparationValue> = {
  id: 'DEPTH.VISUAL.SEPARATION',
  version: '1.0.0',
  kind: 'COMPOSITE',
  dependencies: [],
  calculate(ctx: MetricCalculationContext): MetricResult<VisualSeparationValue> {
    const measurements = collectSurfaceMeasurements(ctx);
    const subjects = new Set(measurements.map((m) => m.subjectId));
    const populationSize = subjects.size;
    if (populationSize < 2) {
      return { metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId, status: 'UNKNOWN', dependencies: [], fingerprint: fingerprint({ metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId, status: 'UNKNOWN' }) };
    }
    const totalPairs = (populationSize * (populationSize - 1)) / 2;
    // 简化：有 shadow 或 border 的元素视为有视觉分离
    const subjectsWithShadow = new Set(
      ctx.snapshot.measurements.filter((m) => m.type === 'surface.shadow' && m.status === 'AVAILABLE').map((m) => m.subjectId)
    );
    const subjectsWithBorder = new Set(
      ctx.snapshot.measurements.filter((m) => m.type === 'surface.border' && m.status === 'AVAILABLE' && (m.value as { topWidth: number } | null)?.topWidth! > 0).map((m) => m.subjectId)
    );
    const separatedSubjects = new Set([...subjectsWithShadow, ...subjectsWithBorder]);
    const separatedPairs = Math.min(totalPairs, separatedSubjects.size * (separatedSubjects.size - 1) / 2);
    return {
      metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId, status: 'AVAILABLE',
      value: { populationSize, separatedPairs, totalPairs, separationRatio: totalPairs > 0 ? separatedPairs / totalPairs : 0 },
      dependencies: [],
      fingerprint: fingerprint({ metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId }),
    };
  },
};
