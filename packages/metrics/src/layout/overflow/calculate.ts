/**
 * P8：OVERFLOW 指标算法（LAYOUT-08 §17）。
 *
 * 相对显式参考矩形的 left/right/top/bottom/maxOverflow。
 * 仅输出事实，不做判断。
 */
import type { LayoutRect } from '@uiq/measurement';

export interface OverflowInput {
  readonly element: LayoutRect;
  readonly container: LayoutRect;
}

export interface OverflowOutput {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
  readonly maxOverflow: number;
}

export function calculateOverflow(input: OverflowInput): OverflowOutput {
  const { element, container } = input;

  const left = Math.max(0, container.x - element.x);
  const right = Math.max(0, element.x + element.width - (container.x + container.width));
  const top = Math.max(0, container.y - element.y);
  const bottom = Math.max(0, element.y + element.height - (container.y + container.height));

  return {
    left,
    right,
    top,
    bottom,
    maxOverflow: Math.max(left, right, top, bottom),
  };
}
