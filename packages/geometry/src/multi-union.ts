/**
 * P8：多矩形扫描线并集面积（LAYOUT-08 §13）。
 *
 * geometry 已有二矩形 unionArea（交集容斥）；布局 DENSITY 需要 N 矩形并集，
 * 使用扫描线算法：按 x 坐标切分垂直条带，每条带内对 y 区间做合并。
 */
import type { Rect } from './types';
import { assertNonNegative } from './types';
import { rectRight, rectBottom } from './rect';

/** 计算多个矩形的并集面积（LAYOUT-08 §13 扫描线）。 */
export function multiRectUnionArea(rects: readonly Rect[]): number {
  const valid = rects.filter((r) => {
    assertNonNegative(r.width, r.height);
    return r.width > 0 && r.height > 0;
  });

  if (valid.length === 0) {
    return 0;
  }

  const xCoordinates = [...new Set(valid.flatMap((r) => [r.x, rectRight(r)]))].sort(
    (a, b) => a - b,
  );

  let area = 0;

  for (let i = 0; i < xCoordinates.length - 1; i++) {
    const x1 = xCoordinates[i]!;
    const x2 = xCoordinates[i + 1]!;
    if (x2 <= x1) continue;

    const intervals = valid
      .filter((r) => r.x < x2 && rectRight(r) > x1)
      .map((r) => [r.y, rectBottom(r)] as const)
      .sort((a, b) => a[0] - b[0]);

    let coveredY = 0;
    let currentStart: number | undefined;
    let currentEnd: number | undefined;

    for (const [start, end] of intervals) {
      if (currentStart === undefined) {
        currentStart = start;
        currentEnd = end;
        continue;
      }
      if (start > currentEnd!) {
        coveredY += currentEnd! - currentStart;
        currentStart = start;
        currentEnd = end;
      } else {
        currentEnd = Math.max(currentEnd!, end);
      }
    }
    if (currentStart !== undefined) {
      coveredY += currentEnd! - currentStart;
    }

    area += (x2 - x1) * coveredY;
  }

  return area;
}

/** 多个矩形的原始面积之和（可大于并集，用于 RAW_AREA density）。 */
export function multiRectRawArea(rects: readonly Rect[]): number {
  let total = 0;
  for (const r of rects) {
    assertNonNegative(r.width, r.height);
    total += r.width * r.height;
  }
  return total;
}
