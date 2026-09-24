import { describe, expect, it } from 'vitest';
import { sha256 } from '@uiq/core';

describe('sha256', () => {
  it('空字符串', () => {
    expect(sha256('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  it('abc', () => {
    expect(sha256('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('长消息', () => {
    expect(sha256('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq')).toBe(
      '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1',
    );
  });

  it('UTF-8 多字节字符', () => {
    // "你好" 的 SHA-256
    const result = sha256('你好');
    expect(result).toMatch(/^[0-9a-f]{64}$/);
    expect(result).toBe('670d9743542cae3ea7ebe36af56bd53648b0a1126162e78d81a32934a711302e');
  });

  it('确定性输出', () => {
    const first = sha256('test');
    const second = sha256('test');
    expect(first).toBe(second);
  });

  it('不同输入产生不同输出', () => {
    expect(sha256('a')).not.toBe(sha256('b'));
  });

  it('输出长度始终 64 字符', () => {
    expect(sha256('short')).toHaveLength(64);
    expect(sha256('a'.repeat(1000))).toHaveLength(64);
  });
});
