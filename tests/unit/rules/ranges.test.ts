import { describe, expect, it } from 'vitest';
import { evaluateRange } from '@uiq/rules';

describe('evaluateRange', () => {
  it('闭区间内返回 true', () => {
    expect(evaluateRange({ min: 0, max: 1 }, 0.5)).toBe(true);
  });

  it('闭区间边界返回 true', () => {
    expect(evaluateRange({ min: 0, max: 1, minInclusive: true, maxInclusive: true }, 0)).toBe(true);
    expect(evaluateRange({ min: 0, max: 1, minInclusive: true, maxInclusive: true }, 1)).toBe(true);
  });

  it('开区间边界返回 false', () => {
    expect(evaluateRange({ min: 0, max: 1, minInclusive: false, maxInclusive: false }, 0)).toBe(
      false,
    );
    expect(evaluateRange({ min: 0, max: 1, minInclusive: false, maxInclusive: false }, 1)).toBe(
      false,
    );
  });

  it('仅 min 约束', () => {
    expect(evaluateRange({ min: 5 }, 10)).toBe(true);
    expect(evaluateRange({ min: 5 }, 3)).toBe(false);
  });

  it('仅 max 约束', () => {
    expect(evaluateRange({ max: 10 }, 5)).toBe(true);
    expect(evaluateRange({ max: 10 }, 15)).toBe(false);
  });

  it('无约束始终返回 true', () => {
    expect(evaluateRange({}, 999)).toBe(true);
    expect(evaluateRange({}, -999)).toBe(true);
  });

  it('默认 inclusive 为 true', () => {
    expect(evaluateRange({ min: 0, max: 10 }, 0)).toBe(true);
    expect(evaluateRange({ min: 0, max: 10 }, 10)).toBe(true);
  });
});
