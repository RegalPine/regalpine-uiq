import type { MetricDefinition, MetricCalculationContext, MetricResult, Measurement } from '@uiq/core';
import { fingerprint } from '@uiq/core';
import { analyzeConsistency, summarize } from '../builtins/stats';

export interface SpatialGridConsistencyValue { readonly populationSize: number; readonly alignmentScore: number; }
export interface SpatialAlignmentConsistencyValue { readonly populationSize: number; readonly distinctPositions: number; readonly deviationCount: number; }
export interface SpatialSpacingRhythmValue { readonly populationSize: number; readonly distinctGaps: number; readonly avgGap: number; readonly variance: number; }
export interface SpatialWhitespaceQualityValue { readonly populationSize: number; readonly avgPadding: number; readonly avgMargin: number; readonly whitespaceRatio: number; }
export interface SpatialDensityBalanceValue { readonly populationSize: number; readonly avgDensity: number; readonly densityVariance: number; }
export interface SpatialProportionQualityValue { readonly populationSize: number; readonly avgRatio: number; readonly ratioVariance: number; }
export interface SpatialCompositionBalanceValue { readonly populationSize: number; readonly symmetryScore: number; readonly distributionScore: number; }

function collectByType(ctx: MetricCalculationContext, type: string): Measurement[] {
  return ctx.snapshot.measurements.filter((m) => m.type === type && m.status === 'AVAILABLE');
}
function unknownResult(id: string, ver: string, sid: string): MetricResult<never> {
  return { metricId: id, metricVersion: ver, subjectId: sid, status: 'UNKNOWN', dependencies: [], fingerprint: fingerprint({ metricId: id, metricVersion: ver, subjectId: sid, status: 'UNKNOWN' }) };
}
function makeResult<T>(id: string, ver: string, sid: string, value: T): MetricResult<T> {
  return { metricId: id, metricVersion: ver, subjectId: sid, status: 'AVAILABLE', value, dependencies: [], fingerprint: fingerprint({ metricId: id, metricVersion: ver, subjectId: sid }) };
}

/**
 * SPATIAL.GRID.CONSISTENCY@1.0.0
 * 基于 geometry.width 值的分布计算对齐分数：
 * 若大多数元素宽度一致（或为基准值的倍数），则 alignmentScore 高。
 */
export const SPATIAL_GRID_CONSISTENCY: MetricDefinition<SpatialGridConsistencyValue> = {
  id: 'SPATIAL.GRID.CONSISTENCY', version: '1.0.0', kind: 'COMPOSITE', dependencies: [],
  calculate(ctx): MetricResult<SpatialGridConsistencyValue> {
    const ms = collectByType(ctx, 'geometry.width');
    if (ms.length === 0) return unknownResult(this.id, this.version, ctx.subjectId);
    const widths = ms.map((m) => m.value as number).filter((v): v is number => typeof v === 'number');
    if (widths.length === 0) return unknownResult(this.id, this.version, ctx.subjectId);
    // 计算 distinct values 比率：越少越一致
    const distinctCount = new Set(widths).size;
    const consistency = analyzeConsistency(widths, 4);
    // alignmentScore: 1.0 = 完全一致, 0.0 = 完全碎片化
    const alignmentScore = distinctCount <= 2 ? 1 : Math.max(0, 1 - (distinctCount - 2) / widths.length);
    return makeResult(this.id, this.version, ctx.subjectId, { populationSize: widths.length, alignmentScore });
  },
};

export const SPATIAL_ALIGNMENT_CONSISTENCY: MetricDefinition<SpatialAlignmentConsistencyValue> = {
  id: 'SPATIAL.ALIGNMENT.CONSISTENCY', version: '1.0.0', kind: 'COMPOSITE', dependencies: [],
  calculate(ctx): MetricResult<SpatialAlignmentConsistencyValue> {
    const ms = collectByType(ctx, 'geometry.x');
    if (ms.length === 0) return unknownResult(this.id, this.version, ctx.subjectId);
    const positions = ms.map((m) => m.value as number).filter((v): v is number => typeof v === 'number');
    const c = analyzeConsistency(positions, 2);
    return makeResult(this.id, this.version, ctx.subjectId, { populationSize: positions.length, distinctPositions: c.distinctValues, deviationCount: c.deviationCount });
  },
};

export const SPATIAL_SPACING_RHYTHM: MetricDefinition<SpatialSpacingRhythmValue> = {
  id: 'SPATIAL.SPACING.RHYTHM', version: '1.0.0', kind: 'COMPOSITE', dependencies: [],
  calculate(ctx): MetricResult<SpatialSpacingRhythmValue> {
    const ms = collectByType(ctx, 'spacing.gap');
    if (ms.length === 0) return unknownResult(this.id, this.version, ctx.subjectId);
    const gaps = ms.map((m) => m.value as number).filter((v): v is number => typeof v === 'number');
    const s = summarize(gaps);
    return makeResult(this.id, this.version, ctx.subjectId, { populationSize: gaps.length, distinctGaps: new Set(gaps).size, avgGap: s.mean, variance: s.variance });
  },
};

/**
 * SPATIAL.WHITESPACE.QUALITY@1.0.0
 * 基于 geometry 测量估算留白比率：
 * 若元素总面积远小于容器面积，则 whitespaceRatio 高。
 */
export const SPATIAL_WHITESPACE_QUALITY: MetricDefinition<SpatialWhitespaceQualityValue> = {
  id: 'SPATIAL.WHITESPACE.QUALITY', version: '1.0.0', kind: 'COMPOSITE', dependencies: [],
  calculate(ctx): MetricResult<SpatialWhitespaceQualityValue> {
    const widths = collectByType(ctx, 'geometry.width').map((m) => m.value as number).filter((v): v is number => typeof v === 'number');
    const heights = collectByType(ctx, 'geometry.height').map((m) => m.value as number).filter((v): v is number => typeof v === 'number');
    const areas = collectByType(ctx, 'geometry.area').map((m) => m.value as number).filter((v): v is number => typeof v === 'number');
    if (widths.length === 0) return unknownResult(this.id, this.version, ctx.subjectId);
    // 估算元素总面积
    const elementAreas: number[] = [];
    const pairs = Math.min(widths.length, heights.length);
    for (let i = 0; i < pairs; i++) {
      elementAreas.push((widths[i] ?? 0) * (heights[i] ?? 0));
    }
    const totalElementArea = elementAreas.reduce((s, a) => s + a, 0);
    // 容器面积取最大 area 测量值或所有 area 之和
    const containerArea = areas.length > 0 ? Math.max(...areas) : totalElementArea;
    const whitespaceRatio = containerArea > 0 ? Math.max(0, Math.min(1, 1 - totalElementArea / containerArea)) : 0;
    return makeResult(this.id, this.version, ctx.subjectId, {
      populationSize: widths.length, avgPadding: 0, avgMargin: 0, whitespaceRatio,
    });
  },
};

export const SPATIAL_DENSITY_BALANCE: MetricDefinition<SpatialDensityBalanceValue> = {
  id: 'SPATIAL.DENSITY.BALANCE', version: '1.0.0', kind: 'COMPOSITE', dependencies: [],
  calculate(ctx): MetricResult<SpatialDensityBalanceValue> {
    const areas = collectByType(ctx, 'geometry.area').map((m) => m.value as number).filter((v): v is number => typeof v === 'number');
    if (areas.length === 0) return unknownResult(this.id, this.version, ctx.subjectId);
    const s = summarize(areas);
    return makeResult(this.id, this.version, ctx.subjectId, { populationSize: areas.length, avgDensity: s.mean, densityVariance: s.variance });
  },
};

export const SPATIAL_PROPORTION_QUALITY: MetricDefinition<SpatialProportionQualityValue> = {
  id: 'SPATIAL.PROPORTION.QUALITY', version: '1.0.0', kind: 'COMPOSITE', dependencies: [],
  calculate(ctx): MetricResult<SpatialProportionQualityValue> {
    const widths = collectByType(ctx, 'geometry.width').map((m) => m.value as number).filter((v): v is number => typeof v === 'number');
    const heights = collectByType(ctx, 'geometry.height').map((m) => m.value as number).filter((v): v is number => typeof v === 'number');
    if (widths.length === 0 || heights.length === 0) return unknownResult(this.id, this.version, ctx.subjectId);
    const ratios = widths.map((w, i) => heights[i] ? w / heights[i] : 0).filter((r) => r > 0);
    const avg = ratios.length > 0 ? ratios.reduce((s, r) => s + r, 0) / ratios.length : 0;
    const variance = ratios.length > 0 ? ratios.reduce((s, r) => s + (r - avg) ** 2, 0) / ratios.length : 0;
    return makeResult(this.id, this.version, ctx.subjectId, { populationSize: ratios.length, avgRatio: avg, ratioVariance: variance });
  },
};

/**
 * SPATIAL.COMPOSITION.BALANCE@1.0.0
 * 基于 geometry.x 位置分布计算对称性和分布均匀度。
 * symmetryScore: 元素在中心轴两侧的分布对称程度 (0~1)。
 * distributionScore: 元素间距的均匀程度 (0~1)。
 */
export const SPATIAL_COMPOSITION_BALANCE: MetricDefinition<SpatialCompositionBalanceValue> = {
  id: 'SPATIAL.COMPOSITION.BALANCE', version: '1.0.0', kind: 'COMPOSITE', dependencies: [],
  calculate(ctx): MetricResult<SpatialCompositionBalanceValue> {
    const ms = collectByType(ctx, 'geometry.x');
    if (ms.length === 0) return unknownResult(this.id, this.version, ctx.subjectId);
    const positions = ms.map((m) => m.value as number).filter((v): v is number => typeof v === 'number');
    if (positions.length < 2) return makeResult(this.id, this.version, ctx.subjectId, { populationSize: positions.length, symmetryScore: 1, distributionScore: 1 });

    // symmetryScore: 计算中位数左侧和右侧元素数目的平衡度
    const sorted = [...positions].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)] ?? 0;
    const leftCount = sorted.filter((p) => p < median).length;
    const rightCount = sorted.filter((p) => p > median).length;
    const total = leftCount + rightCount;
    const symmetryScore = total > 0 ? 1 - Math.abs(leftCount - rightCount) / total : 1;

    // distributionScore: 相邻元素间距的一致性
    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      gaps.push((sorted[i] ?? 0) - (sorted[i - 1] ?? 0));
    }
    const gapVariance = gaps.length > 0 ? summarize(gaps).variance : 0;
    const distributionScore = gapVariance < 10 ? 1 : gapVariance < 100 ? 0.7 : 0.4;

    return makeResult(this.id, this.version, ctx.subjectId, { populationSize: positions.length, symmetryScore, distributionScore });
  },
};

export const spatialTextureMetrics: readonly MetricDefinition[] = [
  SPATIAL_GRID_CONSISTENCY, SPATIAL_ALIGNMENT_CONSISTENCY, SPATIAL_SPACING_RHYTHM,
  SPATIAL_WHITESPACE_QUALITY, SPATIAL_DENSITY_BALANCE, SPATIAL_PROPORTION_QUALITY,
  SPATIAL_COMPOSITION_BALANCE,
] as const;
