import { describe, expect, it } from 'vitest';
import { canonicalJson } from '@uiq/core';

describe('canonicalJson', () => {
  it('编码基本类型', () => {
    expect(canonicalJson(null)).toBe('null');
    expect(canonicalJson(true)).toBe('true');
    expect(canonicalJson(false)).toBe('false');
    expect(canonicalJson('hello')).toBe('"hello"');
    expect(canonicalJson(42)).toBe('42');
    expect(canonicalJson(0)).toBe('0');
  });

  it('按 UTF-16 键序排列对象属性', () => {
    expect(canonicalJson({ b: 2, a: 1 })).toBe('{"a":1,"b":2}');
    expect(canonicalJson({ z: 1, a: 2, m: 3 })).toBe('{"a":2,"m":3,"z":1}');
  });

  it('保持数组顺序', () => {
    expect(canonicalJson([3, 1, 2])).toBe('[3,1,2]');
    expect(canonicalJson([{ b: 2, a: 1 }])).toBe('[{"a":1,"b":2}]');
  });

  it('嵌套对象排序', () => {
    const input = { y: { d: 4, c: 3 }, x: { b: 2, a: 1 } };
    expect(canonicalJson(input)).toBe('{"x":{"a":1,"b":2},"y":{"c":3,"d":4}}');
  });

  it('拒绝非有限数值', () => {
    expect(() => canonicalJson(NaN)).toThrow('非有限数');
    expect(() => canonicalJson(Infinity)).toThrow('非有限数');
    expect(() => canonicalJson(-Infinity)).toThrow('非有限数');
  });

  it('拒绝循环引用', () => {
    const obj: Record<string, unknown> = {};
    obj.self = obj;
    expect(() => canonicalJson(obj)).toThrow('循环引用');
  });

  it('拒绝非普通对象', () => {
    expect(() => canonicalJson(new Date())).toThrow('不支持');
    expect(() => canonicalJson(new Map())).toThrow('不支持');
  });

  it('拒绝 undefined 和函数', () => {
    expect(() => canonicalJson(undefined)).toThrow('不是可序列化');
    expect(() => canonicalJson(() => 0)).toThrow('不是可序列化');
  });

  it('拒绝 Symbol 键', () => {
    const obj = { [Symbol('x')]: 1 };
    expect(() => canonicalJson(obj)).toThrow('Symbol');
  });

  it('拒绝稀疏数组', () => {
    // eslint-disable-next-line no-sparse-arrays
    expect(() => canonicalJson([1, , 3])).toThrow('空洞');
  });

  it('深度超过 256 抛出异常', () => {
    let nested: unknown = 42;
    for (let i = 0; i < 260; i++) nested = { a: nested };
    expect(() => canonicalJson(nested)).toThrow('嵌套深度');
  });

  it('空对象和空数组', () => {
    expect(canonicalJson({})).toBe('{}');
    expect(canonicalJson([])).toBe('[]');
  });
});
