import { assertFinite, assertNonNegative } from './types';
import type { Rect } from './types';

export function createRect(x: number, y: number, width: number, height: number): Rect {
  assertFinite(x, y);
  assertNonNegative(width, height);
  return { x, y, width, height };
}

export function isValidRect(value: unknown): value is Rect {
  if (value === null || typeof value !== 'object') return false;
  const rect = value as Record<string, unknown>;
  return (
    typeof rect.x === 'number' &&
    Number.isFinite(rect.x) &&
    typeof rect.y === 'number' &&
    Number.isFinite(rect.y) &&
    typeof rect.width === 'number' &&
    Number.isFinite(rect.width) &&
    rect.width >= 0 &&
    typeof rect.height === 'number' &&
    Number.isFinite(rect.height) &&
    rect.height >= 0
  );
}

export function rectRight(rect: Rect): number {
  return rect.x + rect.width;
}

export function rectBottom(rect: Rect): number {
  return rect.y + rect.height;
}

export function rectCenterX(rect: Rect): number {
  return rect.x + rect.width / 2;
}

export function rectCenterY(rect: Rect): number {
  return rect.y + rect.height / 2;
}
