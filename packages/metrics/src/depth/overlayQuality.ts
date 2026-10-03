import type { MetricDefinition, MetricCalculationContext, MetricResult, Measurement } from '@uiq/core';
import { fingerprint } from '@uiq/core';
import type { OverlayQualityValue } from './types';

/** DEPTH.OVERLAY.QUALITY@1.0.0 — 覆盖层质量。 */
export const DEPTH_OVERLAY_QUALITY: MetricDefinition<OverlayQualityValue> = {
  id: 'DEPTH.OVERLAY.QUALITY',
  version: '1.0.0',
  kind: 'COMPOSITE',
  dependencies: [],
  calculate(ctx: MetricCalculationContext): MetricResult<OverlayQualityValue> {
    const transparencyMeasurements = ctx.snapshot.measurements.filter((m) => m.type === 'surface.transparency' && m.status === 'AVAILABLE');
    if (transparencyMeasurements.length === 0) {
      return { metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId, status: 'UNKNOWN', dependencies: [], fingerprint: fingerprint({ metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId, status: 'UNKNOWN' }) };
    }
    const values = transparencyMeasurements.map((m) => m.value as { opacity: number; hasBackdropFilter: boolean } | null).filter((v): v is NonNullable<typeof v> => v != null);
    const overlays = values.filter((v) => v.opacity < 1 || v.hasBackdropFilter);
    const avgOpacity = overlays.length > 0 ? overlays.reduce((s, v) => s + v.opacity, 0) / overlays.length : 1;
    return {
      metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId, status: 'AVAILABLE',
      value: { overlayCount: overlays.length, hasBackdrop: overlays.some((v) => v.hasBackdropFilter), avgOpacity },
      dependencies: [],
      fingerprint: fingerprint({ metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId }),
    };
  },
};
