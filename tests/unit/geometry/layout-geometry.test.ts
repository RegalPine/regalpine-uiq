import { describe, expect, it } from 'vitest';
import {
  multiRectRawArea,
  multiRectUnionArea,
  signedAxisGaps,
  signedHorizontalGap,
  signedVerticalGap,
} from '@uiq/geometry';
import type { Rect } from '@uiq/geometry';

describe('P8: multiRectUnionArea (LAYOUT-08 §13)', () => {
  it('returns 0 for empty array', () => {
    expect(multiRectUnionArea([])).toBe(0);
  });

  it('returns area of single rect', () => {
    const rects: Rect[] = [{ x: 0, y: 0, width: 10, height: 10 }];
    expect(multiRectUnionArea(rects)).toBe(100);
  });

  it('computes union of two non-overlapping rects', () => {
    const rects: Rect[] = [
      { x: 0, y: 0, width: 10, height: 10 },
      { x: 20, y: 0, width: 10, height: 10 },
    ];
    expect(multiRectUnionArea(rects)).toBe(200);
  });

  it('computes union of two fully overlapping rects as single area', () => {
    const rects: Rect[] = [
      { x: 0, y: 0, width: 10, height: 10 },
      { x: 0, y: 0, width: 10, height: 10 },
    ];
    expect(multiRectUnionArea(rects)).toBe(100);
  });

  it('computes union of two partially overlapping rects', () => {
    const rects: Rect[] = [
      { x: 0, y: 0, width: 10, height: 10 },
      { x: 5, y: 5, width: 10, height: 10 },
    ];
    // union = 100 + 100 - 25 = 175
    expect(multiRectUnionArea(rects)).toBe(175);
  });

  it('handles rects with negative coordinates (AD-15)', () => {
    const rects: Rect[] = [
      { x: -5, y: 0, width: 10, height: 10 },
      { x: 0, y: 0, width: 10, height: 10 },
    ];
    // [-5,0,10,10] covers x:-5..5, y:0..10 → area 100
    // [0,0,10,10] covers x:0..10, y:0..10 → area 100
    // intersection: x:0..5, y:0..10 → 50
    // union: 100 + 100 - 50 = 150
    expect(multiRectUnionArea(rects)).toBe(150);
  });

  it('filters zero-size rects', () => {
    const rects: Rect[] = [
      { x: 0, y: 0, width: 0, height: 0 },
      { x: 0, y: 0, width: 10, height: 10 },
    ];
    expect(multiRectUnionArea(rects)).toBe(100);
  });

  it('rejects negative dimensions', () => {
    const rects = [{ x: 0, y: 0, width: -1, height: 10 }];
    expect(() => multiRectUnionArea(rects)).toThrow();
  });

  it('handles three rects in L-shape', () => {
    const rects: Rect[] = [
      { x: 0, y: 0, width: 10, height: 10 },
      { x: 10, y: 0, width: 10, height: 5 },
      { x: 0, y: 10, width: 5, height: 10 },
    ];
    // 100 + 50 + 50 = 200, no overlap
    expect(multiRectUnionArea(rects)).toBe(200);
  });
});

describe('P8: multiRectRawArea', () => {
  it('returns sum of individual areas', () => {
    const rects: Rect[] = [
      { x: 0, y: 0, width: 10, height: 10 },
      { x: 0, y: 0, width: 10, height: 10 },
    ];
    expect(multiRectRawArea(rects)).toBe(200);
  });

  it('can be greater than union area (overlapping)', () => {
    const rects: Rect[] = [
      { x: 0, y: 0, width: 10, height: 10 },
      { x: 5, y: 0, width: 10, height: 10 },
    ];
    expect(multiRectRawArea(rects)).toBe(200);
    expect(multiRectUnionArea(rects)).toBeLessThan(200);
  });
});

describe('P8: signedHorizontalGap / signedVerticalGap (LAYOUT-08 §11)', () => {
  it('positive horizontal gap (non-overlapping)', () => {
    const a: Rect = { x: 0, y: 0, width: 10, height: 10 };
    const b: Rect = { x: 18, y: 0, width: 10, height: 10 };
    expect(signedHorizontalGap(a, b)).toBe(8);
  });

  it('negative horizontal gap (overlapping)', () => {
    const a: Rect = { x: 0, y: 0, width: 10, height: 10 };
    const b: Rect = { x: 6, y: 0, width: 10, height: 10 };
    expect(signedHorizontalGap(a, b)).toBe(-4);
  });

  it('zero horizontal gap (touching)', () => {
    const a: Rect = { x: 0, y: 0, width: 10, height: 10 };
    const b: Rect = { x: 10, y: 0, width: 10, height: 10 };
    expect(signedHorizontalGap(a, b)).toBe(0);
  });

  it('positive vertical gap', () => {
    const a: Rect = { x: 0, y: 0, width: 10, height: 10 };
    const b: Rect = { x: 0, y: 20, width: 10, height: 10 };
    expect(signedVerticalGap(a, b)).toBe(10);
  });

  it('negative vertical gap (overlapping)', () => {
    const a: Rect = { x: 0, y: 0, width: 10, height: 10 };
    const b: Rect = { x: 0, y: 5, width: 10, height: 10 };
    expect(signedVerticalGap(a, b)).toBe(-5);
  });

  it('works with negative coordinates (AD-15)', () => {
    const a: Rect = { x: -20, y: -10, width: 10, height: 10 };
    const b: Rect = { x: -5, y: -10, width: 10, height: 10 };
    // gap = -5 - (-20 + 10) = -5 - (-10) = 5
    expect(signedHorizontalGap(a, b)).toBe(5);
  });
});

describe('P8: signedAxisGaps', () => {
  it('returns empty for single rect', () => {
    const rects: Rect[] = [{ x: 0, y: 0, width: 10, height: 10 }];
    expect(signedAxisGaps(rects, 'HORIZONTAL')).toEqual([]);
  });

  it('returns empty for no rects', () => {
    expect(signedAxisGaps([], 'HORIZONTAL')).toEqual([]);
  });

  it('computes horizontal gaps in explicit order (G4)', () => {
    const rects: Rect[] = [
      { x: 0, y: 0, width: 10, height: 10 },
      { x: 18, y: 0, width: 10, height: 10 },
      { x: 36, y: 0, width: 10, height: 10 },
    ];
    expect(signedAxisGaps(rects, 'HORIZONTAL')).toEqual([8, 8]);
  });

  it('computes vertical gaps', () => {
    const rects: Rect[] = [
      { x: 0, y: 0, width: 10, height: 10 },
      { x: 0, y: 20, width: 10, height: 10 },
      { x: 0, y: 40, width: 10, height: 10 },
    ];
    expect(signedAxisGaps(rects, 'VERTICAL')).toEqual([10, 10]);
  });

  it('returns negative gaps for overlapping rects', () => {
    const rects: Rect[] = [
      { x: 0, y: 0, width: 10, height: 10 },
      { x: 5, y: 0, width: 10, height: 10 },
    ];
    expect(signedAxisGaps(rects, 'HORIZONTAL')).toEqual([-5]);
  });

  it('preserves explicit order (does not sort)', () => {
    const rects: Rect[] = [
      { x: 36, y: 0, width: 10, height: 10 },
      { x: 0, y: 0, width: 10, height: 10 },
    ];
    // gap = 0 - (36 + 10) = -46 (overlapping in reverse order)
    expect(signedAxisGaps(rects, 'HORIZONTAL')).toEqual([-46]);
  });
});
