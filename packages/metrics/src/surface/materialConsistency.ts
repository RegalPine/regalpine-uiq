import type { MetricDefinition, MetricCalculationContext, MetricResult, Measurement } from '@uiq/core';
import { fingerprint } from '@uiq/core';
import type { RadiusMeasurementValue, BorderMeasurementValue, ShadowMeasurementValue, TransparencyMeasurementValue, MaterialConsistencyValue } from './types';

/**
 * 生成元素的 MaterialSignature（材质签名）。
 * 将 radius + border + shadow + opacity 组合为字符串标识。
 */
function computeSignature(
  radius: RadiusMeasurementValue | undefined,
  border: BorderMeasurementValue | undefined,
  shadow: ShadowMeasurementValue | undefined,
  transparency: TransparencyMeasurementValue | undefined,
): string {
  const r = radius ? `${radius.topLeft}/${radius.topRight}/${radius.bottomRight}/${radius.bottomLeft}` : 'none';
  const b = border ? `${border.topWidth}/${border.topStyle}` : 'none';
  const s = shadow ? `${shadow.layerCount}L` : 'none';
  const o = transparency ? `${transparency.opacity}` : '1';
  return `${r}|${b}|${s}|${o}`;
}

function collectByType(ctx: MetricCalculationContext, type: string): Map<string, Measurement> {
  const map = new Map<string, Measurement>();
  for (const m of ctx.snapshot.measurements) {
    if (m.type === type && m.status === 'AVAILABLE') {
      map.set(m.subjectId, m);
    }
  }
  return map;
}

/**
 * SURFACE.MATERIAL.CONSISTENCY@1.0.0
 *
 * 比较材质签名的一致性。
 */
export const SURFACE_MATERIAL_CONSISTENCY: MetricDefinition<MaterialConsistencyValue> = {
  id: 'SURFACE.MATERIAL.CONSISTENCY',
  version: '1.0.0',
  kind: 'COMPOSITE',
  dependencies: [],
  calculate(ctx: MetricCalculationContext): MetricResult<MaterialConsistencyValue> {
    const radiusMap = collectByType(ctx, 'surface.radius');
    const borderMap = collectByType(ctx, 'surface.border');
    const shadowMap = collectByType(ctx, 'surface.shadow');
    const transparencyMap = collectByType(ctx, 'surface.transparency');

    // 收集所有有至少一个 surface 测量的 subject
    const allSubjects = new Set<string>();
    for (const m of ctx.snapshot.measurements) {
      if (m.type.startsWith('surface.') && m.status === 'AVAILABLE') {
        allSubjects.add(m.subjectId);
      }
    }

    if (allSubjects.size === 0) {
      return {
        metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId,
        status: 'UNKNOWN', dependencies: [],
        fingerprint: fingerprint({ metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId, status: 'UNKNOWN' }),
      };
    }

    const signatures: string[] = [];
    for (const subjectId of allSubjects) {
      const r = radiusMap.get(subjectId)?.value as RadiusMeasurementValue | undefined;
      const b = borderMap.get(subjectId)?.value as BorderMeasurementValue | undefined;
      const s = shadowMap.get(subjectId)?.value as ShadowMeasurementValue | undefined;
      const t = transparencyMap.get(subjectId)?.value as TransparencyMeasurementValue | undefined;
      signatures.push(computeSignature(r, b, s, t));
    }

    const sigFreq = new Map<string, number>();
    for (const sig of signatures) {
      sigFreq.set(sig, (sigFreq.get(sig) ?? 0) + 1);
    }
    let dominantSig: string | undefined;
    let dominantCount = 0;
    for (const [sig, count] of sigFreq) {
      if (count > dominantCount) { dominantCount = count; dominantSig = sig; }
    }
    const deviationCount = dominantSig !== undefined
      ? signatures.filter((s) => s !== dominantSig).length
      : 0;

    return {
      metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId,
      status: 'AVAILABLE',
      value: {
        populationSize: signatures.length,
        distinctSignatures: sigFreq.size,
        dominantSignature: dominantSig,
        deviationCount,
      },
      dependencies: [],
      fingerprint: fingerprint({ metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId }),
    };
  },
};
