import { describe, expect, it } from 'vitest';
import { fingerprint } from '@uiq/core';

describe('fingerprint', () => {
  it('相同输入产生相同指纹', () => {
    const input = { type: 'metric', version: '1.0.0', subjectId: 'e1', data: { value: 42 } };
    expect(fingerprint(input)).toBe(fingerprint(input));
  });

  it('键序不影响指纹', () => {
    const first = fingerprint({ a: 1, b: 2 });
    const second = fingerprint({ b: 2, a: 1 });
    expect(first).toBe(second);
  });

  it('不同输入产生不同指纹', () => {
    const first = fingerprint({ type: 'metric', data: 1 });
    const second = fingerprint({ type: 'metric', data: 2 });
    expect(first).not.toBe(second);
  });

  it('返回 64 字符十六进制', () => {
    const result = fingerprint({ test: true });
    expect(result).toMatch(/^[0-9a-f]{64}$/);
  });
});
