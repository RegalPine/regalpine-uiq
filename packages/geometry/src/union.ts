import { assertNonNegative } from './types';
import type { Rect } from './types';
import { rectRight, rectBottom } from './rect';
import { rectArea } from './area';

export function unionRects(a: Rect, b: Rect): Rect {
  assertNonNegative(a.width, a.height, b.width, b.height);
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  const right = Math.max(rectRight(a), rectRight(b));
  const bottom = Math.max(rectBottom(a), rectBottom(b));
  return { x, y, width: right - x, height: bottom - y };
}

export function unionArea(a: Rect, b: Rect): number {
  return rectArea(a) + rectArea(b) - rectArea(intersectRects(a, b));
}

function intersectRects(a: Rect, b: Rect): Rect {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const right = Math.min(rectRight(a), rectRight(b));
  const bottom = Math.min(rectBottom(a), rectBottom(b));
  return { x, y, width: Math.max(0, right - x), height: Math.max(0, bottom - y) };
}
