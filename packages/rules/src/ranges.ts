import type { NumericRange } from '@uiq/core';

/** 求值数值区间约束。无边界时该侧不限制。 */
export function evaluateRange(range: NumericRange, value: number): boolean {
  if (range.min !== undefined) {
    const inclusive = range.minInclusive !== false;
    if (inclusive ? value < range.min : value <= range.min) return false;
  }
  if (range.max !== undefined) {
    const inclusive = range.maxInclusive !== false;
    if (inclusive ? value > range.max : value >= range.max) return false;
  }
  return true;
}
