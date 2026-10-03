import type { MetricDefinition, MetricCalculationContext, MetricResult, Measurement } from '@uiq/core';
import { fingerprint } from '@uiq/core';
import { toLinearRGB, linearRgbToXyz, xyzToOklab, oklabToOklch } from '@uiq/color';
import type { SRGB } from '@uiq/color';
import { analyzeConsistency, summarize, circularHueDistance } from '../builtins/stats';

// === Types ===
export interface ColorLightnessHierarchyValue { readonly populationSize: number; readonly distinctLevels: number; readonly hierarchyDepth: number; }
export interface ColorChromaDistributionValue { readonly populationSize: number; readonly min: number; readonly max: number; readonly mean: number; readonly median: number; readonly stdDev: number; }
export interface ColorHueRelationshipValue { readonly populationSize: number; readonly avgHueDistance: number | 'UNDEFINED'; readonly distinctHues: number; }
export interface ColorHarmonyValue { readonly populationSize: number; readonly hueDistances: readonly number[]; readonly chromaVariance: number; }
export interface ColorTokenConsistencyValue { readonly populationSize: number; readonly consistentCount: number; readonly deviationCount: number; }
export interface ColorNoiseValue { readonly populationSize: number; readonly distinctColors: number; readonly noiseRatio: number; }
export interface ColorContrastQualityValue { readonly populationSize: number; readonly minContrast: number; readonly avgContrast: number; readonly failCount: number; }

// === Helpers ===
function collectByType(ctx: MetricCalculationContext, type: string): Measurement[] {
  return ctx.snapshot.measurements.filter((m) => m.type === type && m.status === 'AVAILABLE');
}
function unknownResult(id: string, ver: string, sid: string): MetricResult<never> {
  return { metricId: id, metricVersion: ver, subjectId: sid, status: 'UNKNOWN', dependencies: [], fingerprint: fingerprint({ metricId: id, metricVersion: ver, subjectId: sid, status: 'UNKNOWN' }) };
}

/**
 * sRGB → Linear RGB → XYZ D65 → OKLab，返回 OKLab L (感知亮度)。
 * 规范：UIQ-VISUAL-TEXTURE-ARCHITECTURE §7.2
 */
function srgbToOklabL(srgb: { r: number; g: number; b: number }): number {
  const linear = toLinearRGB(srgb as SRGB);
  const xyz = linearRgbToXyz(linear);
  const lab = xyzToOklab(xyz);
  return lab.L;
}

/**
 * sRGB → OKLCH，返回 OKLCH C (感知色度)。
 */
function srgbToOklchC(srgb: { r: number; g: number; b: number }): number {
  const linear = toLinearRGB(srgb as SRGB);
  const xyz = linearRgbToXyz(linear);
  const lab = xyzToOklab(xyz);
  const lch = oklabToOklch(lab);
  return lch.C;
}

/**
 * sRGB → OKLCH，返回 OKLCH H (感知色相，度)。
 * 低 Chroma 时返回 'UNDEFINED'。
 */
function srgbToOklchH(srgb: { r: number; g: number; b: number }): number | 'UNDEFINED' {
  const linear = toLinearRGB(srgb as SRGB);
  const xyz = linearRgbToXyz(linear);
  const lab = xyzToOklab(xyz);
  const lch = oklabToOklch(lab);
  if (lch.C < 0.02) return 'UNDEFINED';
  return lch.H;
}

// === Metrics ===

/** COLOR.LIGHTNESS.HIERARCHY@1.0.0 — 使用 OKLab L 感知亮度 */
export const COLOR_LIGHTNESS_HIERARCHY: MetricDefinition<ColorLightnessHierarchyValue> = {
  id: 'COLOR.LIGHTNESS.HIERARCHY', version: '1.0.0', kind: 'COMPOSITE', dependencies: [],
  calculate(ctx): MetricResult<ColorLightnessHierarchyValue> {
    const ms = collectByType(ctx, 'color.srgb');
    if (ms.length === 0) return unknownResult(this.id, this.version, ctx.subjectId);
    const lightnessValues = ms.map((m) => {
      const v = m.value as { r: number; g: number; b: number } | null;
      return v ? srgbToOklabL(v) : 0;
    });
    const distinct = new Set(lightnessValues.map((l) => Math.round(l * 100) / 100)).size;
    return { metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId, status: 'AVAILABLE', value: { populationSize: ms.length, distinctLevels: distinct, hierarchyDepth: distinct }, dependencies: [], fingerprint: fingerprint({ metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId }) };
  },
};

/** COLOR.CHROMA.DISTRIBUTION@1.0.0 — 使用 OKLCH C 感知色度 */
export const COLOR_CHROMA_DISTRIBUTION: MetricDefinition<ColorChromaDistributionValue> = {
  id: 'COLOR.CHROMA.DISTRIBUTION', version: '1.0.0', kind: 'COMPOSITE', dependencies: [],
  calculate(ctx): MetricResult<ColorChromaDistributionValue> {
    const ms = collectByType(ctx, 'color.srgb');
    if (ms.length === 0) return unknownResult(this.id, this.version, ctx.subjectId);
    const chromas = ms.map((m) => {
      const v = m.value as { r: number; g: number; b: number } | null;
      return v ? srgbToOklchC(v) : 0;
    });
    const s = summarize(chromas);
    return { metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId, status: 'AVAILABLE', value: { populationSize: chromas.length, min: s.min, max: s.max, mean: s.mean, median: s.median, stdDev: s.stdDev }, dependencies: [], fingerprint: fingerprint({ metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId }) };
  },
};

/** COLOR.HUE.RELATIONSHIP@1.0.0 — 使用 OKLCH H 感知色相 */
export const COLOR_HUE_RELATIONSHIP: MetricDefinition<ColorHueRelationshipValue> = {
  id: 'COLOR.HUE.RELATIONSHIP', version: '1.0.0', kind: 'COMPOSITE', dependencies: [],
  calculate(ctx): MetricResult<ColorHueRelationshipValue> {
    const ms = collectByType(ctx, 'color.srgb');
    if (ms.length < 2) return unknownResult(this.id, this.version, ctx.subjectId);
    const hues = ms.map((m) => {
      const v = m.value as { r: number; g: number; b: number } | null;
      return v ? srgbToOklchH(v) : 'UNDEFINED' as const;
    });
    const numericHues = hues.filter((h): h is number => h !== 'UNDEFINED');
    if (numericHues.length < 2) return { metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId, status: 'AVAILABLE', value: { populationSize: ms.length, avgHueDistance: 'UNDEFINED', distinctHues: 0 }, dependencies: [], fingerprint: fingerprint({ metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId }) };
    let totalDist = 0; let count = 0;
    for (let i = 0; i < numericHues.length; i++) for (let j = i + 1; j < numericHues.length; j++) { const d = circularHueDistance(numericHues[i]!, numericHues[j]!); if (d !== 'UNDEFINED') { totalDist += d; count++; } }
    return { metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId, status: 'AVAILABLE', value: { populationSize: ms.length, avgHueDistance: count > 0 ? totalDist / count : 'UNDEFINED', distinctHues: new Set(numericHues.map((h) => Math.round(h / 10) * 10)).size }, dependencies: [], fingerprint: fingerprint({ metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId }) };
  },
};

export const COLOR_HARMONY: MetricDefinition<ColorHarmonyValue> = {
  id: 'COLOR.HARMONY', version: '1.0.0', kind: 'COMPOSITE', dependencies: [],
  calculate(ctx): MetricResult<ColorHarmonyValue> {
    const ms = collectByType(ctx, 'color.srgb');
    if (ms.length < 2) return unknownResult(this.id, this.version, ctx.subjectId);
    const chromas = ms.map((m) => { const v = m.value as { r: number; g: number; b: number } | null; return v ? srgbToOklchC(v) : 0; });
    return { metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId, status: 'AVAILABLE', value: { populationSize: ms.length, hueDistances: [], chromaVariance: analyzeConsistency(chromas).deviationCount }, dependencies: [], fingerprint: fingerprint({ metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId }) };
  },
};

export const COLOR_TOKEN_CONSISTENCY: MetricDefinition<ColorTokenConsistencyValue> = {
  id: 'COLOR.TOKEN.CONSISTENCY', version: '1.0.0', kind: 'COMPOSITE', dependencies: [],
  calculate(ctx): MetricResult<ColorTokenConsistencyValue> {
    const ms = collectByType(ctx, 'color.srgb');
    if (ms.length === 0) return unknownResult(this.id, this.version, ctx.subjectId);
    const colors = ms.map((m) => JSON.stringify(m.value));
    const consistency = analyzeConsistency(colors.map((_, i) => i));
    return { metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId, status: 'AVAILABLE', value: { populationSize: ms.length, consistentCount: new Set(colors).size === 1 ? ms.length : 0, deviationCount: new Set(colors).size - 1 }, dependencies: [], fingerprint: fingerprint({ metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId }) };
  },
};

export const COLOR_NOISE: MetricDefinition<ColorNoiseValue> = {
  id: 'COLOR.NOISE', version: '1.0.0', kind: 'COMPOSITE', dependencies: [],
  calculate(ctx): MetricResult<ColorNoiseValue> {
    const ms = collectByType(ctx, 'color.srgb');
    if (ms.length === 0) return unknownResult(this.id, this.version, ctx.subjectId);
    const colors = new Set(ms.map((m) => JSON.stringify(m.value)));
    return { metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId, status: 'AVAILABLE', value: { populationSize: ms.length, distinctColors: colors.size, noiseRatio: ms.length > 0 ? colors.size / ms.length : 0 }, dependencies: [], fingerprint: fingerprint({ metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId }) };
  },
};

export const COLOR_CONTRAST_QUALITY: MetricDefinition<ColorContrastQualityValue> = {
  id: 'COLOR.CONTRAST.QUALITY', version: '1.0.0', kind: 'COMPOSITE', dependencies: [],
  calculate(ctx): MetricResult<ColorContrastQualityValue> {
    const fgMs = collectByType(ctx, 'color.srgb');
    const bgMs = collectByType(ctx, 'color.srgb.background');
    if (fgMs.length === 0 || bgMs.length === 0) return unknownResult(this.id, this.version, ctx.subjectId);
    const contrasts: number[] = [];
    for (const fg of fgMs) for (const bg of bgMs) {
      const fgV = fg.value as { r: number; g: number; b: number; alpha: number } | null;
      const bgV = bg.value as { r: number; g: number; b: number; alpha: number } | null;
      if (fgV && bgV) { const l1 = 0.2126 * fgV.r + 0.7152 * fgV.g + 0.0722 * fgV.b; const l2 = 0.2126 * bgV.r + 0.7152 * bgV.g + 0.0722 * bgV.b; contrasts.push((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)); }
    }
    const failCount = contrasts.filter((c) => c < 4.5).length;
    return { metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId, status: 'AVAILABLE', value: { populationSize: contrasts.length, minContrast: Math.min(...contrasts), avgContrast: contrasts.reduce((s, c) => s + c, 0) / contrasts.length, failCount }, dependencies: [], fingerprint: fingerprint({ metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId }) };
  },
};

export const colorTextureMetrics: readonly MetricDefinition[] = [
  COLOR_LIGHTNESS_HIERARCHY, COLOR_CHROMA_DISTRIBUTION, COLOR_HUE_RELATIONSHIP,
  COLOR_HARMONY, COLOR_TOKEN_CONSISTENCY, COLOR_NOISE, COLOR_CONTRAST_QUALITY,
] as const;
