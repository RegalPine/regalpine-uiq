import { describe, expect, it } from 'vitest';
import {
  calculateAlignment,
  median,
  calculateGridAlignment,
  calculateGridGroup,
  calculateDensity,
  calculateSymmetry,
  calculateOverflow,
  calculateResponsiveSizeDelta,
  calculateResponsivePositionDelta,
  calculateComponentSizeVariance,
  calculateSpacingVariance,
} from '@uiq/metrics';
import type { LayoutRect } from '@uiq/measurement';

// ─── ALIGNMENT ───────────────────────────────────────────────────────────────

describe('P8: ALIGNMENT metric (G2)', () => {
  it('returns undefined for empty members', () => {
    expect(calculateAlignment({ members: [], axis: 'LEFT' })).toBeUndefined();
  });

  it('computes signed deviations with explicit reference (G2)', () => {
    const members = [
      { id: 'a', rect: { x: 10, y: 0, width: 5, height: 5 } },
      { id: 'b', rect: { x: 14, y: 0, width: 5, height: 5 } },
      { id: 'c', rect: { x: 6, y: 0, width: 5, height: 5 } },
    ];
    const result = calculateAlignment({ members, axis: 'LEFT', reference: 10 });
    expect(result).toBeDefined();
    expect(result!.deviations).toEqual({ a: 0, b: 4, c: -4 });
    expect(result!.maxAbsoluteDeviation).toBe(4);
    expect(result!.meanAbsoluteDeviation).toBe(8 / 3);
  });

  it('uses median as reference when not specified', () => {
    const members = [
      { id: 'a', rect: { x: 10, y: 0, width: 5, height: 5 } },
      { id: 'b', rect: { x: 20, y: 0, width: 5, height: 5 } },
      { id: 'c', rect: { x: 30, y: 0, width: 5, height: 5 } },
    ];
    const result = calculateAlignment({ members, axis: 'LEFT' });
    expect(result!.reference).toBe(20); // median
    expect(result!.deviations).toEqual({ a: -10, b: 0, c: 10 });
  });

  it('works with negative coordinates (AD-15)', () => {
    const members = [
      { id: 'a', rect: { x: -10, y: 0, width: 5, height: 5 } },
      { id: 'b', rect: { x: -5, y: 0, width: 5, height: 5 } },
    ];
    const result = calculateAlignment({ members, axis: 'LEFT', reference: -10 });
    expect(result!.deviations).toEqual({ a: 0, b: 5 });
  });
});

describe('P8: median', () => {
  it('throws for empty array', () => {
    expect(() => median([])).toThrow();
  });

  it('returns middle value for odd-length array', () => {
    expect(median([3, 1, 2])).toBe(2);
  });

  it('returns average of two middle values for even-length array', () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });
});

// ─── GRID_ALIGNMENT ──────────────────────────────────────────────────────────

describe('P8: GRID_ALIGNMENT metric (G3)', () => {
  it('throws for invalid gridSize', () => {
    expect(() => calculateGridAlignment({ coordinate: 10, gridSize: 0, origin: 0 })).toThrow();
    expect(() => calculateGridAlignment({ coordinate: 10, gridSize: -1, origin: 0 })).toThrow();
  });

  it('computes nearest grid line and signed deviation', () => {
    const result = calculateGridAlignment({
      coordinate: 17,
      gridSize: 8,
      origin: 0,
    });
    expect(result.nearestGridLine).toBe(16);
    expect(result.deviation).toBe(1);
  });

  it('handles negative coordinates (G3)', () => {
    const result = calculateGridAlignment({
      coordinate: -9,
      gridSize: 8,
      origin: 0,
    });
    // -9 is between -8 and -16; closer to -8
    expect(result.nearestGridLine).toBe(-8);
    expect(result.deviation).toBe(-1);
  });

  it('handles half-grid tie (Math.round rounds to even)', () => {
    // coordinate=12, origin=0, gridSize=8 → 12/8=1.5 → Math.round(1.5)=2 → nearest=16
    const result = calculateGridAlignment({
      coordinate: 12,
      gridSize: 8,
      origin: 0,
    });
    expect(result.nearestGridLine).toBe(16);
    expect(result.deviation).toBe(-4);
  });
});

describe('P8: calculateGridGroup', () => {
  it('computes per-member deviations', () => {
    const result = calculateGridGroup({
      members: [
        { id: 'a', x: 0, y: 0 },
        { id: 'b', x: 8, y: 0 },
        { id: 'c', x: 17, y: 1 },
      ],
      gridSizeX: 8,
      gridSizeY: 8,
      originX: 0,
      originY: 0,
    });
    expect(result.perMember[0]!.deviationX).toBe(0);
    expect(result.perMember[2]!.deviationX).toBe(1);
    expect(result.perMember[2]!.deviationY).toBe(1);
    expect(result.maxAbsoluteDeviationX).toBe(1);
    expect(result.maxAbsoluteDeviationY).toBe(1);
  });
});

// ─── DENSITY ─────────────────────────────────────────────────────────────────

describe('P8: DENSITY metric (G6)', () => {
  it('returns undefined density for zero container area', () => {
    const result = calculateDensity({
      mode: 'UNION_AREA',
      children: [{ x: 0, y: 0, width: 10, height: 10 }],
      container: { x: 0, y: 0, width: 0, height: 10 },
    });
    expect(result.density).toBeUndefined();
  });

  it('UNION_AREA clips children to container (G6)', () => {
    const result = calculateDensity({
      mode: 'UNION_AREA',
      children: [
        { x: -5, y: 0, width: 10, height: 10 },
        { x: 0, y: 0, width: 10, height: 10 },
      ],
      container: { x: 0, y: 0, width: 10, height: 10 },
    });
    // After clipping: [0,0,5,10] (50) and [0,0,10,10] (100) → union = 100
    expect(result.occupiedArea).toBe(100);
    expect(result.availableArea).toBe(100);
    expect(result.density).toBe(1);
  });

  it('RAW_AREA can be greater than 1 (overlapping)', () => {
    const result = calculateDensity({
      mode: 'RAW_AREA',
      children: [
        { x: 0, y: 0, width: 10, height: 10 },
        { x: 0, y: 0, width: 10, height: 10 },
      ],
      container: { x: 0, y: 0, width: 10, height: 10 },
    });
    // RAW: 100 + 100 = 200, available = 100, density = 2
    expect(result.density).toBe(2);
  });
});

// ─── SYMMETRY ────────────────────────────────────────────────────────────────

describe('P8: SYMMETRY metric (G7)', () => {
  it('returns undefined for empty pairs', () => {
    expect(
      calculateSymmetry({
        axis: 'VERTICAL',
        axisPosition: 50,
        pairs: [],
        elements: new Map(),
      }),
    ).toBeUndefined();
  });

  it('computes perfect symmetry (G7)', () => {
    const elements = new Map<string, LayoutRect>([
      ['a', { x: 20, y: 0, width: 10, height: 10 }],
      ['b', { x: 70, y: 0, width: 10, height: 10 }],
    ]);
    const result = calculateSymmetry({
      axis: 'VERTICAL',
      axisPosition: 50,
      pairs: [{ firstId: 'a', secondId: 'b' }],
      elements,
    });
    // a center = 25, b center = 75
    // |（25-50）+（75-50）| = |-25+25| = 0
    expect(result!.maxDeviation).toBe(0);
  });

  it('computes asymmetric deviation', () => {
    const elements = new Map<string, LayoutRect>([
      ['a', { x: 20, y: 0, width: 10, height: 10 }],
      ['b', { x: 80, y: 0, width: 10, height: 10 }],
    ]);
    const result = calculateSymmetry({
      axis: 'VERTICAL',
      axisPosition: 50,
      pairs: [{ firstId: 'a', secondId: 'b' }],
      elements,
    });
    // a center = 25, b center = 85
    // |（25-50）+（85-50）| = |-25+35| = 10
    expect(result!.maxDeviation).toBe(10);
  });
});

// ─── OVERFLOW ────────────────────────────────────────────────────────────────

describe('P8: OVERFLOW metric (G8)', () => {
  it('computes four-side overflow', () => {
    const result = calculateOverflow({
      element: { x: -2, y: -1, width: 15, height: 13 },
      container: { x: 0, y: 0, width: 10, height: 10 },
    });
    // left = max(0, 0-(-2)) = 2
    // right = max(0, (-2+15)-(0+10)) = max(0, 13-10) = 3
    // top = max(0, 0-(-1)) = 1
    // bottom = max(0, (-1+13)-(0+10)) = max(0, 12-10) = 2
    expect(result).toEqual({ left: 2, right: 3, top: 1, bottom: 2, maxOverflow: 3 });
  });

  it('returns zeros when element is inside container', () => {
    const result = calculateOverflow({
      element: { x: 2, y: 2, width: 5, height: 5 },
      container: { x: 0, y: 0, width: 10, height: 10 },
    });
    expect(result.maxOverflow).toBe(0);
  });
});

// ─── RESPONSIVE ──────────────────────────────────────────────────────────────

describe('P8: RESPONSIVE_SIZE_DELTA (G9)', () => {
  it('computes absolute and relative deltas', () => {
    const result = calculateResponsiveSizeDelta({
      baseline: { x: 10, y: 0, width: 100, height: 50 },
      current: { x: 12, y: 0, width: 80, height: 50 },
    });
    expect(result.widthDelta).toBe(-20);
    expect(result.heightDelta).toBe(0);
    expect(result.relativeWidthDelta).toBe(-0.2);
    expect(result.relativeHeightDelta).toBe(0);
  });

  it('returns undefined relative when baseline dimension is zero', () => {
    const result = calculateResponsiveSizeDelta({
      baseline: { x: 0, y: 0, width: 0, height: 50 },
      current: { x: 0, y: 0, width: 10, height: 50 },
    });
    expect(result.widthDelta).toBe(10);
    expect(result.relativeWidthDelta).toBeUndefined();
  });
});

describe('P8: RESPONSIVE_POSITION_DELTA (G9)', () => {
  it('computes position delta and distance', () => {
    const result = calculateResponsivePositionDelta({
      baseline: { x: 10, y: 20, width: 100, height: 50 },
      current: { x: 12, y: 24, width: 80, height: 50 },
    });
    expect(result.deltaX).toBe(2);
    expect(result.deltaY).toBe(4);
    expect(result.distance).toBe(Math.hypot(2, 4));
  });
});

// ─── COMPONENT_SIZE_VARIANCE ─────────────────────────────────────────────────

describe('P8: COMPONENT_SIZE_VARIANCE (G10)', () => {
  it('returns undefined for empty instances', () => {
    expect(
      calculateComponentSizeVariance({ componentType: 'button', instances: [] }),
    ).toBeUndefined();
  });

  it('computes population variance (G10)', () => {
    const result = calculateComponentSizeVariance({
      componentType: 'button',
      instances: [
        { id: 'b1', rect: { x: 0, y: 0, width: 10, height: 4 } },
        { id: 'b2', rect: { x: 0, y: 0, width: 12, height: 4 } },
        { id: 'b3', rect: { x: 0, y: 0, width: 14, height: 4 } },
      ],
    });
    expect(result!.meanWidth).toBe(12);
    expect(result!.widthVariance).toBeCloseTo(8 / 3);
    expect(result!.heightVariance).toBe(0);
    expect(result!.count).toBe(3);
  });
});

// ─── SPACING_VARIANCE ────────────────────────────────────────────────────────

describe('P8: SPACING_VARIANCE (G4)', () => {
  it('returns undefined for empty sequence', () => {
    expect(calculateSpacingVariance([])).toBeUndefined();
  });

  it('computes variance for equal gaps (G4)', () => {
    const result = calculateSpacingVariance([8, 8]);
    expect(result!.count).toBe(2);
    expect(result!.mean).toBe(8);
    expect(result!.variance).toBe(0);
    expect(result!.standardDeviation).toBe(0);
  });

  it('computes variance for unequal gaps', () => {
    const result = calculateSpacingVariance([8, 12, 16]);
    expect(result!.count).toBe(3);
    expect(result!.mean).toBe(12);
    // variance = ((8-12)^2 + (12-12)^2 + (16-12)^2) / 3 = (16+0+16)/3 = 32/3
    expect(result!.variance).toBeCloseTo(32 / 3);
  });

  it('preserves original values', () => {
    const result = calculateSpacingVariance([5, 10, 15]);
    expect(result!.values).toEqual([5, 10, 15]);
  });
});
