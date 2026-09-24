import { canonicalJson } from '@uiq/core';

/**
 * 深值相等（canonical JSON 语义）。任一侧 undefined 视为"字段缺席"：
 * 均缺席相等、单侧缺席不等 —— 不触发 canonicalJson 对 undefined 的异常。
 */
export function jsonEquals(a: unknown, b: unknown): boolean {
  if (a === undefined || b === undefined) return a === b;
  return canonicalJson(a) === canonicalJson(b);
}
