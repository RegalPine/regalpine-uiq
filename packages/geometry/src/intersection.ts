import { assertNonNegative } from './types';
import type { Rect } from './types';
import { rectRight, rectBottom } from './rect';

export function intersectRects(a: Rect, b: Rect): Rect {
  assertNonNegative(a.width, a.height, b.width, b.height);
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const right = Math.min(rectRight(a), rectRight(b));
  const bottom = Math.min(rectBottom(a), rectBottom(b));
  const width = Math.max(0, right - x);
  const height = Math.max(0, bottom - y);
  return { x, y, width, height };
}

export function intersects(a: Rect, b: Rect): boolean {
  assertNonNegative(a.width, a.height, b.width, b.height);
  return a.x < rectRight(b) && rectRight(a) > b.x && a.y < rectBottom(b) && rectBottom(a) > b.y;
}
