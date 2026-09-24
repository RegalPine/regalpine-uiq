import { describe, expect, it } from 'vitest';
import {
  evaluateAlignmentConformance,
  evaluateGridConformance,
  evaluateSpacingConformance,
  evaluateContainerConstraint,
  evaluateOverflowConstraint,
  evaluateDensityRange,
  evaluateSymmetryConformance,
  evaluateComponentSizeConsistency,
  evaluateResponsiveConstraint,
  evaluateResponsiveNoOverflow,
  evaluateOrderConformance,
} from '@uiq/rules';

// ─── 1. ALIGNMENT.CONFORMANCE ───────────────────────────────────────────────

describe('P8: ALIGNMENT.CONFORMANCE', () => {
  it('PASS when max deviation within tolerance', () => {
    expect(
      evaluateAlignmentConformance({
        maxAbsoluteDeviation: 0.5,
        config: { maxAllowedDeviation: 1 },
      }),
    ).toBe('PASS');
  });

  it('FAIL when max deviation exceeds tolerance', () => {
    expect(
      evaluateAlignmentConformance({ maxAbsoluteDeviation: 2, config: { maxAllowedDeviation: 1 } }),
    ).toBe('FAIL');
  });

  it('ERROR when tolerance is negative (config error)', () => {
    expect(
      evaluateAlignmentConformance({
        maxAbsoluteDeviation: 0,
        config: { maxAllowedDeviation: -1 },
      }),
    ).toBe('ERROR');
  });

  it('boundary: exact match is PASS', () => {
    expect(
      evaluateAlignmentConformance({ maxAbsoluteDeviation: 1, config: { maxAllowedDeviation: 1 } }),
    ).toBe('PASS');
  });
});

// ─── 2. GRID.CONFORMANCE ────────────────────────────────────────────────────

describe('P8: GRID.CONFORMANCE', () => {
  it('PASS when both axes within tolerance', () => {
    expect(
      evaluateGridConformance({
        maxAbsoluteDeviationX: 0.5,
        maxAbsoluteDeviationY: 0.3,
        config: { tolerance: 1 },
      }),
    ).toBe('PASS');
  });

  it('FAIL when any axis exceeds tolerance', () => {
    expect(
      evaluateGridConformance({
        maxAbsoluteDeviationX: 2,
        maxAbsoluteDeviationY: 0.3,
        config: { tolerance: 1 },
      }),
    ).toBe('FAIL');
  });
});

// ─── 3. SPACING.CONFORMANCE ─────────────────────────────────────────────────

describe('P8: SPACING.CONFORMANCE', () => {
  it('PASS when all values within tolerance of expected', () => {
    expect(
      evaluateSpacingConformance({
        values: [23, 24, 25],
        config: { expected: 24, tolerance: 1 },
      }),
    ).toBe('PASS');
  });

  it('FAIL when any value outside tolerance', () => {
    expect(
      evaluateSpacingConformance({
        values: [23, 24, 26],
        config: { expected: 24, tolerance: 1 },
      }),
    ).toBe('FAIL');
  });

  it('UNKNOWN for empty values', () => {
    expect(evaluateSpacingConformance({ values: [], config: { expected: 24, tolerance: 1 } })).toBe(
      'UNKNOWN',
    );
  });

  it('24±1: 22.9 → FAIL, 23 → PASS, 25.1 → FAIL', () => {
    const config = { expected: 24, tolerance: 1 };
    expect(evaluateSpacingConformance({ values: [22.9], config })).toBe('FAIL');
    expect(evaluateSpacingConformance({ values: [23], config })).toBe('PASS');
    expect(evaluateSpacingConformance({ values: [25], config })).toBe('PASS');
    expect(evaluateSpacingConformance({ values: [25.1], config })).toBe('FAIL');
  });
});

// ─── 4. CONTAINER.CONSTRAINT ────────────────────────────────────────────────

describe('P8: CONTAINER.CONSTRAINT', () => {
  it('PASS when within all constraints', () => {
    expect(
      evaluateContainerConstraint({
        actualWidth: 320,
        actualHeight: 480,
        config: { minWidth: 320, maxWidth: 1200 },
      }),
    ).toBe('PASS');
  });

  it('FAIL when width below minimum (G5)', () => {
    expect(
      evaluateContainerConstraint({
        actualWidth: 9,
        actualHeight: 100,
        config: { minWidth: 10 },
      }),
    ).toBe('FAIL');
  });

  it('FAIL when width exceeds maximum', () => {
    expect(
      evaluateContainerConstraint({
        actualWidth: 1300,
        actualHeight: 480,
        config: { maxWidth: 1200 },
      }),
    ).toBe('FAIL');
  });
});

// ─── 5. OVERFLOW.CONSTRAINT ─────────────────────────────────────────────────

describe('P8: OVERFLOW.CONSTRAINT', () => {
  it('FORBID: PASS when no overflow', () => {
    expect(
      evaluateOverflowConstraint({
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        config: { mode: 'FORBID' },
      }),
    ).toBe('PASS');
  });

  it('FORBID: FAIL when any overflow', () => {
    expect(
      evaluateOverflowConstraint({
        left: 2,
        right: 0,
        top: 0,
        bottom: 0,
        config: { mode: 'FORBID' },
      }),
    ).toBe('FAIL');
  });

  it('ALLOW: always PASS', () => {
    expect(
      evaluateOverflowConstraint({
        left: 10,
        right: 10,
        top: 10,
        bottom: 10,
        config: { mode: 'ALLOW' },
      }),
    ).toBe('PASS');
  });

  it('ALLOW_AXIS Y: X overflow still fails', () => {
    expect(
      evaluateOverflowConstraint({
        left: 2,
        right: 0,
        top: 0,
        bottom: 0,
        config: { mode: 'ALLOW_AXIS', axis: 'Y' },
      }),
    ).toBe('FAIL');
  });

  it('ALLOW_AXIS Y: Y overflow passes', () => {
    expect(
      evaluateOverflowConstraint({
        left: 0,
        right: 0,
        top: 5,
        bottom: 0,
        config: { mode: 'ALLOW_AXIS', axis: 'Y' },
      }),
    ).toBe('PASS');
  });
});

// ─── 6. DENSITY.RANGE ───────────────────────────────────────────────────────

describe('P8: DENSITY.RANGE', () => {
  it('PASS when density within range', () => {
    expect(evaluateDensityRange({ density: 0.5, config: { min: 0.1, max: 0.9 } })).toBe('PASS');
  });

  it('FAIL when density exceeds max', () => {
    expect(evaluateDensityRange({ density: 1.5, config: { max: 1.0 } })).toBe('FAIL');
  });

  it('UNKNOWN when density is undefined', () => {
    expect(evaluateDensityRange({ density: undefined, config: { max: 1.0 } })).toBe('UNKNOWN');
  });
});

// ─── 7. SYMMETRY.CONFORMANCE ────────────────────────────────────────────────

describe('P8: SYMMETRY.CONFORMANCE', () => {
  it('PASS when symmetry within tolerance', () => {
    expect(
      evaluateSymmetryConformance({ maxDeviation: 0.5, config: { maxAllowedDeviation: 1 } }),
    ).toBe('PASS');
  });

  it('NOT_APPLICABLE when no symmetry required', () => {
    expect(
      evaluateSymmetryConformance({ maxDeviation: undefined, config: { maxAllowedDeviation: 1 } }),
    ).toBe('NOT_APPLICABLE');
  });
});

// ─── 8. COMPONENT.SIZE_CONSISTENCY ──────────────────────────────────────────

describe('P8: COMPONENT.SIZE_CONSISTENCY', () => {
  it('PASS when variance within limit', () => {
    expect(
      evaluateComponentSizeConsistency({
        widthVariance: 1,
        heightVariance: 0,
        perInstance: [{ width: 10, height: 4 }],
        config: { maxVariance: 2 },
      }),
    ).toBe('PASS');
  });

  it('FAIL when variance exceeds limit', () => {
    expect(
      evaluateComponentSizeConsistency({
        widthVariance: 5,
        heightVariance: 0,
        perInstance: [{ width: 10, height: 4 }],
        config: { maxVariance: 2 },
      }),
    ).toBe('FAIL');
  });

  it('FAIL when instance outside width range', () => {
    expect(
      evaluateComponentSizeConsistency({
        widthVariance: 0,
        heightVariance: 0,
        perInstance: [{ width: 5, height: 4 }],
        config: { widthRange: { min: 8, max: 12 } },
      }),
    ).toBe('FAIL');
  });
});

// ─── 9. RESPONSIVE.CONSTRAINT ───────────────────────────────────────────────

describe('P8: RESPONSIVE.CONSTRAINT', () => {
  it('PASS when position delta within limit', () => {
    expect(
      evaluateResponsiveConstraint({
        positionDistance: 2,
        maxOverflow: 0,
        config: { maxPositionDelta: 5 },
      }),
    ).toBe('PASS');
  });

  it('FAIL when position delta exceeds limit', () => {
    expect(
      evaluateResponsiveConstraint({
        positionDistance: 10,
        maxOverflow: 0,
        config: { maxPositionDelta: 5 },
      }),
    ).toBe('FAIL');
  });
});

// ─── 10. RESPONSIVE.NO_OVERFLOW ─────────────────────────────────────────────

describe('P8: RESPONSIVE.NO_OVERFLOW', () => {
  it('PASS when no overflow', () => {
    expect(evaluateResponsiveNoOverflow({ maxOverflow: 0 })).toBe('PASS');
  });

  it('FAIL when overflow detected', () => {
    expect(evaluateResponsiveNoOverflow({ maxOverflow: 5 })).toBe('FAIL');
  });
});

// ─── 11. ORDER.CONFORMANCE ──────────────────────────────────────────────────

describe('P8: ORDER.CONFORMANCE', () => {
  it('ASC: PASS when deviations in ascending order', () => {
    expect(
      evaluateOrderConformance({
        deviations: { a: -4, b: 0, c: 4 },
        config: { expectedSubjectIds: ['a', 'b', 'c'], direction: 'ASC' },
      }),
    ).toBe('PASS');
  });

  it('ASC: FAIL when order violated', () => {
    expect(
      evaluateOrderConformance({
        deviations: { a: 4, b: 0, c: -4 },
        config: { expectedSubjectIds: ['a', 'b', 'c'], direction: 'ASC' },
      }),
    ).toBe('FAIL');
  });

  it('DESC: PASS when deviations in descending order', () => {
    expect(
      evaluateOrderConformance({
        deviations: { a: 4, b: 0, c: -4 },
        config: { expectedSubjectIds: ['a', 'b', 'c'], direction: 'DESC' },
      }),
    ).toBe('PASS');
  });

  it('UNKNOWN when member missing', () => {
    expect(
      evaluateOrderConformance({
        deviations: { a: 0 },
        config: { expectedSubjectIds: ['a', 'b'], direction: 'ASC' },
      }),
    ).toBe('UNKNOWN');
  });

  it('ties rejected by default', () => {
    expect(
      evaluateOrderConformance({
        deviations: { a: 0, b: 0 },
        config: { expectedSubjectIds: ['a', 'b'], direction: 'ASC' },
      }),
    ).toBe('FAIL');
  });

  it('ties allowed when configured', () => {
    expect(
      evaluateOrderConformance({
        deviations: { a: 0, b: 0 },
        config: { expectedSubjectIds: ['a', 'b'], direction: 'ASC', allowTies: true },
      }),
    ).toBe('PASS');
  });

  it('negative deviations preserve direction (G2/ORDER)', () => {
    expect(
      evaluateOrderConformance({
        deviations: { a: -4, b: -2, c: 0 },
        config: { expectedSubjectIds: ['a', 'b', 'c'], direction: 'ASC' },
      }),
    ).toBe('PASS');
  });
});
