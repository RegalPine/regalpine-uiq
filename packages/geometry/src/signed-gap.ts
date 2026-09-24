/**
 * P8：有向轴 gap（LAYOUT-08 §11）。
 *
 * 现有 edgeDistance 返回无符号最小距离；布局 ORDER/SPACING 需要
 * 有向 gap = b.start - a.end，负值表示重叠（AD-15/17）。
 */
import type { Rect } from './types';
import { assertNonNegative } from './types';
import { rectRight, rectBottom } from './rect';

/** 有向水平 gap：b.x - (a.x + a.width)。负值表示重叠。 */
export function signedHorizontalGap(a: Rect, b: Rect): number {
  assertNonNegative(a.width, a.height, b.width, b.height);
  return b.x - rectRight(a);
}

/** 有向垂直 gap：b.y - (a.y + a.height)。负值表示重叠。 */
export function signedVerticalGap(a: Rect, b: Rect): number {
  assertNonNegative(a.width, a.height, b.width, b.height);
  return b.y - rectBottom(a);
}

/** 有向轴 gap 对：按显式顺序计算相邻元素的间距序列。 */
export function signedAxisGaps(rects: readonly Rect[], axis: 'HORIZONTAL' | 'VERTICAL'): number[] {
  if (rects.length < 2) return [];
  const gaps: number[] = [];
  for (let i = 0; i < rects.length - 1; i++) {
    const a = rects[i]!;
    const b = rects[i + 1]!;
    gaps.push(axis === 'HORIZONTAL' ? signedHorizontalGap(a, b) : signedVerticalGap(a, b));
  }
  return gaps;
}
