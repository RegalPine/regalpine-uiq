/**
 * P8：COMPONENT_SIZE_VARIANCE 指标算法（LAYOUT-08 §19）。
 *
 * 仅同 componentType/variant 的显式实例组。
 * 宽高均值、总体方差、标准差及逐实例数值。
 * 不以标准差替代契约最大偏差检查。
 */
import type { LayoutRect } from '@uiq/measurement';

export interface ComponentSizeVarianceInput {
  readonly componentType: string;
  readonly instances: ReadonlyArray<{ readonly id: string; readonly rect: LayoutRect }>;
}

export interface ComponentSizeVarianceOutput {
  readonly componentType: string;
  readonly count: number;
  readonly meanWidth: number;
  readonly meanHeight: number;
  readonly widthVariance: number;
  readonly heightVariance: number;
  readonly widthStandardDeviation: number;
  readonly heightStandardDeviation: number;
  readonly perInstance: ReadonlyArray<{
    readonly id: string;
    readonly width: number;
    readonly height: number;
    readonly widthDeviationFromMean: number;
    readonly heightDeviationFromMean: number;
  }>;
}

/** 总体方差（分母 n，非 n-1）。 */
function populationVariance(values: readonly number[], mean: number): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
}

export function calculateComponentSizeVariance(
  input: ComponentSizeVarianceInput,
): ComponentSizeVarianceOutput | undefined {
  if (input.instances.length === 0) return undefined;

  const widths = input.instances.map((i) => i.rect.width);
  const heights = input.instances.map((i) => i.rect.height);

  const meanWidth = widths.reduce((a, b) => a + b, 0) / widths.length;
  const meanHeight = heights.reduce((a, b) => a + b, 0) / heights.length;

  const widthVariance = populationVariance(widths, meanWidth);
  const heightVariance = populationVariance(heights, meanHeight);

  const perInstance = input.instances.map((inst, idx) => ({
    id: inst.id,
    width: widths[idx]!,
    height: heights[idx]!,
    widthDeviationFromMean: widths[idx]! - meanWidth,
    heightDeviationFromMean: heights[idx]! - meanHeight,
  }));

  return {
    componentType: input.componentType,
    count: input.instances.length,
    meanWidth,
    meanHeight,
    widthVariance,
    heightVariance,
    widthStandardDeviation: Math.sqrt(widthVariance),
    heightStandardDeviation: Math.sqrt(heightVariance),
    perInstance,
  };
}
