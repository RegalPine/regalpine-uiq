import { assertNonNegative } from './types';
import type { Rect, EdgeDistanceResult, OverlapResult } from './types';
import { rectCenterX, rectCenterY, rectRight, rectBottom } from './rect';
import { rectArea } from './area';
import { intersectRects } from './intersection';

export function centerDistance(a: Rect, b: Rect): number {
  assertNonNegative(a.width, a.height, b.width, b.height);
  const dx = rectCenterX(a) - rectCenterX(b);
  const dy = rectCenterY(a) - rectCenterY(b);
  return Math.hypot(dx, dy);
}

export function edgeDistance(a: Rect, b: Rect): EdgeDistanceResult {
  assertNonNegative(a.width, a.height, b.width, b.height);
  const horizontal = edgeGap(a.x, rectRight(a), b.x, rectRight(b));
  const vertical = edgeGap(a.y, rectBottom(a), b.y, rectBottom(b));
  return { horizontal, vertical, minimum: Math.min(horizontal, vertical) };
}

function edgeGap(startA: number, endA: number, startB: number, endB: number): number {
  if (endA <= startB) return startB - endA;
  if (endB <= startA) return startA - endB;
  return 0;
}

export function overlap(a: Rect, b: Rect): OverlapResult {
  assertNonNegative(a.width, a.height, b.width, b.height);
  const intersection = intersectRects(a, b);
  const intersectionArea = rectArea(intersection);
  const areaA = rectArea(a);
  const areaB = rectArea(b);
  return {
    area: intersectionArea,
    ratioA: areaA === 0 ? 0 : intersectionArea / areaA,
    ratioB: areaB === 0 ? 0 : intersectionArea / areaB,
  };
}
