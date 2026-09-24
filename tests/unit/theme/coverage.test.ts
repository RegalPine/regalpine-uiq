import { describe, expect, it } from 'vitest';
import { themeCoverage } from '@uiq/theme';

describe('themeCoverage（IMPL-09 §25、TK-01 §35：Metric 事实，非 decision）', () => {
  it('部分覆盖：2/3 → ratio = 2/3', () => {
    expect(themeCoverage(['a', 'b', 'c'], ['a', 'b'])).toEqual({
      resolvedCount: 2,
      requiredCount: 3,
      ratio: 2 / 3,
    });
  });

  it('全覆盖与零覆盖', () => {
    expect(themeCoverage(['a', 'b'], new Set(['a', 'b'])).ratio).toBe(1);
    expect(themeCoverage(['a', 'b'], new Set<string>()).ratio).toBe(0);
  });

  it('空 required 集 → ratio = 1（没有未满足的要求）', () => {
    expect(themeCoverage([], ['a'])).toEqual({ resolvedCount: 0, requiredCount: 0, ratio: 1 });
  });

  it('required 去重；resolved 交集语义（额外 id 不计入）', () => {
    expect(themeCoverage(['a', 'a', 'b'], ['a', 'extra'])).toEqual({
      resolvedCount: 1,
      requiredCount: 2,
      ratio: 0.5,
    });
  });
});
