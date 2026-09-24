import { describe, expect, it } from 'vitest';
import { evaluateOperator } from '@uiq/rules';

describe('evaluateOperator', () => {
  describe('EQ', () => {
    it('相等返回 true', () => {
      expect(evaluateOperator('EQ', 5, 5)).toBe(true);
    });
    it('不等返回 false', () => {
      expect(evaluateOperator('EQ', 5, 6)).toBe(false);
    });
    it('非数值返回 null', () => {
      expect(evaluateOperator('EQ', 'abc', 5)).toBe(null);
    });
  });

  describe('NE', () => {
    it('不等返回 true', () => {
      expect(evaluateOperator('NE', 5, 6)).toBe(true);
    });
    it('相等返回 false', () => {
      expect(evaluateOperator('NE', 5, 5)).toBe(false);
    });
  });

  describe('GT', () => {
    it('大于返回 true', () => {
      expect(evaluateOperator('GT', 6, 5)).toBe(true);
    });
    it('等于返回 false', () => {
      expect(evaluateOperator('GT', 5, 5)).toBe(false);
    });
    it('小于返回 false', () => {
      expect(evaluateOperator('GT', 4, 5)).toBe(false);
    });
  });

  describe('GTE', () => {
    it('大于返回 true', () => {
      expect(evaluateOperator('GTE', 6, 5)).toBe(true);
    });
    it('等于返回 true', () => {
      expect(evaluateOperator('GTE', 5, 5)).toBe(true);
    });
    it('小于返回 false', () => {
      expect(evaluateOperator('GTE', 4, 5)).toBe(false);
    });
  });

  describe('LT', () => {
    it('小于返回 true', () => {
      expect(evaluateOperator('LT', 4, 5)).toBe(true);
    });
    it('等于返回 false', () => {
      expect(evaluateOperator('LT', 5, 5)).toBe(false);
    });
  });

  describe('LTE', () => {
    it('小于返回 true', () => {
      expect(evaluateOperator('LTE', 4, 5)).toBe(true);
    });
    it('等于返回 true', () => {
      expect(evaluateOperator('LTE', 5, 5)).toBe(true);
    });
    it('大于返回 false', () => {
      expect(evaluateOperator('LTE', 6, 5)).toBe(false);
    });
  });

  describe('IN', () => {
    it('在集合中返回 true', () => {
      expect(evaluateOperator('IN', 400, [400, 500, 600, 700])).toBe(true);
    });
    it('不在集合中返回 false', () => {
      expect(evaluateOperator('IN', 300, [400, 500, 600, 700])).toBe(false);
    });
    it('阈值非数组返回 null', () => {
      expect(evaluateOperator('IN', 400, 500)).toBe(null);
    });
  });

  describe('NOT_IN', () => {
    it('不在集合中返回 true', () => {
      expect(evaluateOperator('NOT_IN', 300, [400, 500])).toBe(true);
    });
    it('在集合中返回 false', () => {
      expect(evaluateOperator('NOT_IN', 400, [400, 500])).toBe(false);
    });
  });

  describe('类型不匹配', () => {
    it('数值操作符对字符串返回 null', () => {
      expect(evaluateOperator('GT', 'abc', 5)).toBe(null);
    });
    it('数值操作符对 undefined 返回 null', () => {
      expect(evaluateOperator('GTE', undefined, 5)).toBe(null);
    });
  });

  describe('边界值', () => {
    it('0 与 0 相等', () => {
      expect(evaluateOperator('EQ', 0, 0)).toBe(true);
    });
    it('浮点精度', () => {
      expect(evaluateOperator('GTE', 4.499999999999999, 4.5)).toBe(false);
    });
    it('负数比较', () => {
      expect(evaluateOperator('GT', -1, -2)).toBe(true);
    });
  });
});
