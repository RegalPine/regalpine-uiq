/**
 * 统计工具函数 — Texture Metrics 的公共数学基础。
 * 纯函数，不依赖任何 Metric/Rule 接口。
 */

/** 算术平均值。 */
export function mean(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** 中位数。 */
export function median(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 !== 0) return sorted[mid] as number;
  return ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2;
}

/** 方差（总体方差）。 */
export function variance(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const m = mean(values);
  return values.reduce((sum, v) => sum + (v - m) ** 2, 0) / values.length;
}

/** 标准差（总体标准差）。 */
export function standardDeviation(values: readonly number[]): number {
  return Math.sqrt(variance(values));
}

/** 最小值。 */
export function min(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return Math.min(...values);
}

/** 最大值。 */
export function max(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return Math.max(...values);
}

/** 分位数 (0-1)。使用线性插值法。 */
export function quantile(values: readonly number[], p: number): number {
  if (values.length === 0) return 0;
  if (p < 0 || p > 1) throw new RangeError(`分位数 p=${p} 必须在 [0, 1] 范围内`);
  const sorted = [...values].sort((a, b) => a - b);
  if (p === 0) return sorted[0] as number;
  if (p === 1) return sorted[sorted.length - 1] as number;
  const index = p * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  return (sorted[lower] as number) * (1 - weight) + (sorted[upper] as number) * weight;
}

/** 去重后的不同值数量。 */
export function distinctCount(values: readonly number[]): number {
  return new Set(values).size;
}

/** 去重后的字符串值数量。 */
export function distinctStringCount(values: readonly string[]): number {
  return new Set(values).size;
}

/** 值频率分布（Map<值, 次数>）。 */
export function frequencyMap(values: readonly number[]): Map<number, number> {
  const freq = new Map<number, number>();
  for (const v of values) {
    freq.set(v, (freq.get(v) ?? 0) + 1);
  }
  return freq;
}

/** 众数（出现次数最多的值）。如有多个，返回第一个。 */
export function mode(values: readonly number[]): number | undefined {
  if (values.length === 0) return undefined;
  const freq = frequencyMap(values);
  let maxCount = 0;
  let maxValue: number | undefined;
  for (const [value, count] of freq) {
    if (count > maxCount) {
      maxCount = count;
      maxValue = value;
    }
  }
  return maxValue;
}

/** 统计摘要。 */
export interface StatsSummary {
  readonly count: number;
  readonly min: number;
  readonly max: number;
  readonly mean: number;
  readonly median: number;
  readonly stdDev: number;
  readonly variance: number;
  readonly q25: number;
  readonly q75: number;
}

/** 计算统计摘要。 */
export function summarize(values: readonly number[]): StatsSummary {
  return {
    count: values.length,
    min: min(values),
    max: max(values),
    mean: mean(values),
    median: median(values),
    stdDev: standardDeviation(values),
    variance: variance(values),
    q25: quantile(values, 0.25),
    q75: quantile(values, 0.75),
  };
}

/**
 * Circular hue distance（色相圆距离）。
 * 返回 [0, 180] 范围内的角度差。
 * 低 Chroma 时 H='UNDEFINED'，不参与计算。
 */
export function circularHueDistance(a: number | 'UNDEFINED', b: number | 'UNDEFINED'): number | 'UNDEFINED' {
  if (a === 'UNDEFINED' || b === 'UNDEFINED') return 'UNDEFINED';
  const diff = Math.abs(((a - b) % 360 + 360) % 360);
  return diff > 180 ? 360 - diff : diff;
}

/**
 * 数值一致性检查 — 统计不同值数量、主值、偏差数。
 * 用于 RadiusConsistency、BorderConsistency 等。
 */
export interface ConsistencyResult {
  readonly populationSize: number;
  readonly distinctValues: number;
  readonly dominantValue: number | undefined;
  readonly dominantCount: number;
  readonly deviationCount: number;
  readonly values: readonly number[];
}

export function analyzeConsistency(values: readonly number[], tolerance = 0): ConsistencyResult {
  if (values.length === 0) {
    return {
      populationSize: 0,
      distinctValues: 0,
      dominantValue: undefined,
      dominantCount: 0,
      deviationCount: 0,
      values: [],
    };
  }
  const freq = frequencyMap(values);
  let dominantValue: number | undefined;
  let dominantCount = 0;
  for (const [value, count] of freq) {
    if (count > dominantCount) {
      dominantCount = count;
      dominantValue = value;
    }
  }
  // 偏差 = 与主值差异超过 tolerance 的数量
  const deviationCount =
    dominantValue !== undefined
      ? values.filter((v) => Math.abs(v - dominantValue) > tolerance).length
      : 0;
  return {
    populationSize: values.length,
    distinctValues: freq.size,
    dominantValue,
    dominantCount,
    deviationCount,
    values,
  };
}
