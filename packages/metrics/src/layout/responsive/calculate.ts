/**
 * P8：RESPONSIVE_SIZE_DELTA 和 RESPONSIVE_POSITION_DELTA 指标算法（LAYOUT-08 §18）。
 *
 * B−A 的宽高差与相对差；基准某维度为零时省略该 relative 值并记录字段 UNKNOWN。
 * B−A 的 deltaX/deltaY 与欧氏距离，保留两侧来源。
 */
import type { LayoutRect } from '@uiq/measurement';

export interface ResponsiveSizeDeltaInput {
  readonly baseline: LayoutRect;
  readonly current: LayoutRect;
}

export interface ResponsiveSizeDeltaOutput {
  readonly widthDelta: number;
  readonly heightDelta: number;
  /** 基准宽度为零时为 undefined（UNKNOWN）。 */
  readonly relativeWidthDelta: number | undefined;
  /** 基准高度为零时为 undefined（UNKNOWN）。 */
  readonly relativeHeightDelta: number | undefined;
}

export function calculateResponsiveSizeDelta(
  input: ResponsiveSizeDeltaInput,
): ResponsiveSizeDeltaOutput {
  const widthDelta = input.current.width - input.baseline.width;
  const heightDelta = input.current.height - input.baseline.height;

  return {
    widthDelta,
    heightDelta,
    relativeWidthDelta: input.baseline.width === 0 ? undefined : widthDelta / input.baseline.width,
    relativeHeightDelta:
      input.baseline.height === 0 ? undefined : heightDelta / input.baseline.height,
  };
}

export interface ResponsivePositionDeltaInput {
  readonly baseline: LayoutRect;
  readonly current: LayoutRect;
}

export interface ResponsivePositionDeltaOutput {
  readonly deltaX: number;
  readonly deltaY: number;
  readonly distance: number;
}

export function calculateResponsivePositionDelta(
  input: ResponsivePositionDeltaInput,
): ResponsivePositionDeltaOutput {
  const deltaX = input.current.x - input.baseline.x;
  const deltaY = input.current.y - input.baseline.y;

  return {
    deltaX,
    deltaY,
    distance: Math.hypot(deltaX, deltaY),
  };
}
