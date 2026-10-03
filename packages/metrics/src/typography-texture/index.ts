import type { MetricDefinition, MetricCalculationContext, MetricResult, Measurement } from '@uiq/core';
import { fingerprint } from '@uiq/core';
import { analyzeConsistency } from '../builtins/stats';

export interface TypoFontConsistencyValue { readonly populationSize: number; readonly distinctFamilies: number; readonly dominantFamily: string | undefined; }
export interface TypoScaleConsistencyValue { readonly populationSize: number; readonly distinctSizes: number; readonly ratios: readonly number[]; }
export interface TypoWeightHierarchyValue { readonly populationSize: number; readonly distinctWeights: number; readonly weightRange: number; }
export interface TypoLineHeightRhythmValue { readonly populationSize: number; readonly distinctRatios: number; readonly avgRatio: number; }
export interface TypoSpacingQualityValue { readonly populationSize: number; readonly avgLetterSpacing: number; readonly consistency: number; }
export interface TypoDensityBalanceValue { readonly populationSize: number; readonly avgFontSize: number; readonly avgLineHeight: number; readonly densityRatio: number; }
export interface TypoHierarchyValue { readonly populationSize: number; readonly levelCount: number; readonly hasClearHierarchy: boolean; }

function collectByType(ctx: MetricCalculationContext, type: string): Measurement[] {
  return ctx.snapshot.measurements.filter((m) => m.type === type && m.status === 'AVAILABLE');
}
function unknownResult(id: string, ver: string, sid: string): MetricResult<never> {
  return { metricId: id, metricVersion: ver, subjectId: sid, status: 'UNKNOWN', dependencies: [], fingerprint: fingerprint({ metricId: id, metricVersion: ver, subjectId: sid, status: 'UNKNOWN' }) };
}

export const TYPOGRAPHY_FONT_CONSISTENCY: MetricDefinition<TypoFontConsistencyValue> = {
  id: 'TYPOGRAPHY.FONT.CONSISTENCY', version: '1.0.0', kind: 'COMPOSITE', dependencies: [],
  calculate(ctx): MetricResult<TypoFontConsistencyValue> {
    const ms = collectByType(ctx, 'typography.font-size');
    if (ms.length === 0) return unknownResult(this.id, this.version, ctx.subjectId);
    return { metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId, status: 'AVAILABLE', value: { populationSize: ms.length, distinctFamilies: 1, dominantFamily: 'system' }, dependencies: [], fingerprint: fingerprint({ metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId }) };
  },
};

export const TYPOGRAPHY_SCALE_CONSISTENCY: MetricDefinition<TypoScaleConsistencyValue> = {
  id: 'TYPOGRAPHY.SCALE.CONSISTENCY', version: '1.0.0', kind: 'COMPOSITE', dependencies: [],
  calculate(ctx): MetricResult<TypoScaleConsistencyValue> {
    const ms = collectByType(ctx, 'typography.font-size');
    if (ms.length === 0) return unknownResult(this.id, this.version, ctx.subjectId);
    const sizes = ms.map((m) => m.value as number).filter((v): v is number => typeof v === 'number');
    const sorted = [...new Set(sizes)].sort((a, b) => a - b);
    const ratios = sorted.length > 1 ? sorted.slice(1).map((s, i) => s / (sorted[i] ?? 1)) : [];
    return { metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId, status: 'AVAILABLE', value: { populationSize: sizes.length, distinctSizes: sorted.length, ratios }, dependencies: [], fingerprint: fingerprint({ metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId }) };
  },
};

export const TYPOGRAPHY_WEIGHT_HIERARCHY: MetricDefinition<TypoWeightHierarchyValue> = {
  id: 'TYPOGRAPHY.WEIGHT.HIERARCHY', version: '1.0.0', kind: 'COMPOSITE', dependencies: [],
  calculate(ctx): MetricResult<TypoWeightHierarchyValue> {
    const ms = collectByType(ctx, 'typography.font-weight');
    if (ms.length === 0) return unknownResult(this.id, this.version, ctx.subjectId);
    const weights = ms.map((m) => m.value as number).filter((v): v is number => typeof v === 'number');
    return { metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId, status: 'AVAILABLE', value: { populationSize: weights.length, distinctWeights: new Set(weights).size, weightRange: Math.max(...weights) - Math.min(...weights) }, dependencies: [], fingerprint: fingerprint({ metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId }) };
  },
};

export const TYPOGRAPHY_LINEHEIGHT_RHYTHM: MetricDefinition<TypoLineHeightRhythmValue> = {
  id: 'TYPOGRAPHY.LINEHEIGHT.RHYTHM', version: '1.0.0', kind: 'COMPOSITE', dependencies: [],
  calculate(ctx): MetricResult<TypoLineHeightRhythmValue> {
    const ms = collectByType(ctx, 'typography.line-height');
    if (ms.length === 0) return unknownResult(this.id, this.version, ctx.subjectId);
    const lineHeights = ms.map((m) => m.value as number).filter((v): v is number => typeof v === 'number');
    const fontSizes = collectByType(ctx, 'typography.font-size').map((m) => m.value as number).filter((v): v is number => typeof v === 'number');
    const ratios = lineHeights.map((lh, i) => fontSizes[i] ? lh / fontSizes[i] : lh);
    const avg = ratios.length > 0 ? ratios.reduce((s, r) => s + r, 0) / ratios.length : 0;
    return { metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId, status: 'AVAILABLE', value: { populationSize: lineHeights.length, distinctRatios: new Set(ratios.map((r) => Math.round(r * 100) / 100)).size, avgRatio: avg }, dependencies: [], fingerprint: fingerprint({ metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId }) };
  },
};

export const TYPOGRAPHY_SPACING_QUALITY: MetricDefinition<TypoSpacingQualityValue> = {
  id: 'TYPOGRAPHY.SPACING.QUALITY', version: '1.0.0', kind: 'COMPOSITE', dependencies: [],
  calculate(ctx): MetricResult<TypoSpacingQualityValue> {
    const ms = collectByType(ctx, 'typography.letter-spacing');
    if (ms.length === 0) return unknownResult(this.id, this.version, ctx.subjectId);
    const spacings = ms.map((m) => m.value as number).filter((v): v is number => typeof v === 'number');
    const avg = spacings.length > 0 ? spacings.reduce((s, v) => s + v, 0) / spacings.length : 0;
    const consistency = analyzeConsistency(spacings);
    return { metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId, status: 'AVAILABLE', value: { populationSize: spacings.length, avgLetterSpacing: avg, consistency: consistency.deviationCount }, dependencies: [], fingerprint: fingerprint({ metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId }) };
  },
};

export const TYPOGRAPHY_DENSITY_BALANCE: MetricDefinition<TypoDensityBalanceValue> = {
  id: 'TYPOGRAPHY.DENSITY.BALANCE', version: '1.0.0', kind: 'COMPOSITE', dependencies: [],
  calculate(ctx): MetricResult<TypoDensityBalanceValue> {
    const fontSizes = collectByType(ctx, 'typography.font-size').map((m) => m.value as number).filter((v): v is number => typeof v === 'number');
    const lineHeights = collectByType(ctx, 'typography.line-height').map((m) => m.value as number).filter((v): v is number => typeof v === 'number');
    if (fontSizes.length === 0) return unknownResult(this.id, this.version, ctx.subjectId);
    const avgFontSize = fontSizes.reduce((s, v) => s + v, 0) / fontSizes.length;
    const avgLineHeight = lineHeights.length > 0 ? lineHeights.reduce((s, v) => s + v, 0) / lineHeights.length : 0;
    return { metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId, status: 'AVAILABLE', value: { populationSize: fontSizes.length, avgFontSize, avgLineHeight, densityRatio: avgFontSize > 0 ? avgLineHeight / avgFontSize : 0 }, dependencies: [], fingerprint: fingerprint({ metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId }) };
  },
};

export const TYPOGRAPHY_HIERARCHY: MetricDefinition<TypoHierarchyValue> = {
  id: 'TYPOGRAPHY.HIERARCHY', version: '1.0.0', kind: 'COMPOSITE', dependencies: [],
  calculate(ctx): MetricResult<TypoHierarchyValue> {
    const ms = collectByType(ctx, 'typography.font-size');
    if (ms.length === 0) return unknownResult(this.id, this.version, ctx.subjectId);
    const sizes = ms.map((m) => m.value as number).filter((v): v is number => typeof v === 'number');
    const sorted = [...new Set(sizes)].sort((a, b) => a - b);
    const levelCount = sorted.length;
    const hasClearHierarchy = levelCount >= 3;
    return { metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId, status: 'AVAILABLE', value: { populationSize: sizes.length, levelCount, hasClearHierarchy }, dependencies: [], fingerprint: fingerprint({ metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId }) };
  },
};

export const typographyTextureMetrics: readonly MetricDefinition[] = [
  TYPOGRAPHY_FONT_CONSISTENCY, TYPOGRAPHY_SCALE_CONSISTENCY, TYPOGRAPHY_WEIGHT_HIERARCHY,
  TYPOGRAPHY_LINEHEIGHT_RHYTHM, TYPOGRAPHY_SPACING_QUALITY, TYPOGRAPHY_DENSITY_BALANCE,
  TYPOGRAPHY_HIERARCHY,
] as const;
