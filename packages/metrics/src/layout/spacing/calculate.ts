/**
 * P8：SPACING_VARIANCE 指标算法（LAYOUT-08 §10）。
 *
 * 显式有序间距序列；count/mean/variance/standardDeviation/values。
 * 分母 n（总体方差），空序列 → undefined（UNKNOWN）。
 */

export interface SpacingVarianceOutput {
  readonly count: number;
  readonly mean: number;
  readonly variance: number;
  readonly standardDeviation: number;
  readonly values: readonly number[];
}

export function calculateSpacingVariance(
  values: readonly number[],
): SpacingVarianceOutput | undefined {
  if (values.length === 0) return undefined;

  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;

  return {
    count: values.length,
    mean,
    variance,
    standardDeviation: Math.sqrt(variance),
    values: [...values],
  };
}
