import { describe, expect, it } from 'vitest';
import { applyTolerance } from '@uiq/rules';

describe('applyTolerance', () => {
  it('ABSOLUTE 容差降低阈值', () => {
    expect(applyTolerance(4.5, { type: 'ABSOLUTE', value: 0.1 })).toBeCloseTo(4.4);
  });

  it('RELATIVE 容差按比例降低', () => {
    expect(applyTolerance(100, { type: 'RELATIVE', value: 0.05 })).toBeCloseTo(95);
  });

  it('零容差不改变阈值', () => {
    expect(applyTolerance(4.5, { type: 'ABSOLUTE', value: 0 })).toBe(4.5);
  });

  it('大容差可显著降低', () => {
    expect(applyTolerance(10, { type: 'ABSOLUTE', value: 3 })).toBe(7);
  });

  it('RELATIVE 零值阈值不变', () => {
    expect(applyTolerance(0, { type: 'RELATIVE', value: 0.1 })).toBe(0);
  });
});
