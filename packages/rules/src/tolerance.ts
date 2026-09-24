import type { Tolerance } from '@uiq/core';

/**
 * 应用容差到阈值，返回放宽后的有效阈值。
 * 容差只用于数值稳定性，不改变规范含义（AD-10）。
 * 对 GTE/LTE 方向：放宽意味着降低通过门槛。
 */
export function applyTolerance(threshold: number, tolerance: Tolerance): number {
  switch (tolerance.type) {
    case 'ABSOLUTE':
      return threshold - tolerance.value;
    case 'RELATIVE':
      return threshold * (1 - tolerance.value);
  }
}
