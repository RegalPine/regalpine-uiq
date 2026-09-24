import { assertNonNegative } from './types';
import type { Rect } from './types';

export function rectArea(rect: Rect): number {
  assertNonNegative(rect.width, rect.height);
  return rect.width * rect.height;
}
