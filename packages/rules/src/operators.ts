import type { ComparisonOperator } from '@uiq/core';

/**
 * 求值基础比较操作符。
 * 返回 `null` 表示输入类型不匹配（由调用方转为 ERROR）。
 */
export function evaluateOperator(
  operator: ComparisonOperator,
  actual: unknown,
  threshold: unknown,
): boolean | null {
  switch (operator) {
    case 'EQ':
    case 'NE': {
      // P5（ER-02 §59）：支持字符串相等比较（如 TOKEN.MATCH 的 'MATCH'）；数值路径保持不变。
      if (typeof actual === 'number' && typeof threshold === 'number') {
        const result = actual === threshold;
        return operator === 'EQ' ? result : !result;
      }
      if (typeof actual === 'string' && typeof threshold === 'string') {
        const result = actual === threshold;
        return operator === 'EQ' ? result : !result;
      }
      return null;
    }
    case 'GT':
    case 'GTE':
    case 'LT':
    case 'LTE': {
      if (typeof actual !== 'number' || typeof threshold !== 'number') return null;
      switch (operator) {
        case 'GT':
          return actual > threshold;
        case 'GTE':
          return actual >= threshold;
        case 'LT':
          return actual < threshold;
        case 'LTE':
          return actual <= threshold;
      }
      break;
    }
    case 'IN':
    case 'NOT_IN': {
      if (!Array.isArray(threshold)) return null;
      const inSet = threshold.includes(actual);
      return operator === 'IN' ? inSet : !inSet;
    }
  }
}
