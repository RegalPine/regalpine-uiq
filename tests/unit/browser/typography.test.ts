import { describe, expect, it } from 'vitest';
import {
  normalizeFontWeight,
  normalizeLetterSpacing,
  normalizeLineHeight,
  parsePx,
} from '@uiq/browser';

describe('parsePx（IMPL-07 §26/§31 computed px 归一化）', () => {
  it('px 结尾的 computed 长度 → 数值', () => {
    expect(parsePx('16px')).toBe(16);
    expect(parsePx('24.5px')).toBe(24.5);
    expect(parsePx('  0px  ')).toBe(0);
  });

  it('非 px 单位或非法值 → null', () => {
    expect(parsePx('1em')).toBeNull();
    expect(parsePx('50%')).toBeNull();
    expect(parsePx('normal')).toBeNull();
  });
});

describe('normalizeLineHeight（IMPL-07 §29-30）', () => {
  it('px 值 → {px, ratio}', () => {
    expect(normalizeLineHeight('24px', 16)).toEqual({ px: 24, ratio: 1.5 });
  });

  it('normal → null（UNKNOWN，不假设字体度量）', () => {
    expect(normalizeLineHeight('normal', 16)).toBeNull();
    expect(normalizeLineHeight('NORMAL', 16)).toBeNull();
  });

  it('fontSize 为 0 时不产生 ratio（避免除零）', () => {
    const value = normalizeLineHeight('24px', 0);
    expect(value).toEqual({ px: 24 });
    expect(value && 'ratio' in value).toBe(false);
  });
});

describe('normalizeFontWeight（IMPL-07 §28，AC-BROWSER-07）', () => {
  it('变量字重小数原样保留，不四舍五入到档位', () => {
    expect(normalizeFontWeight('438.5')).toBe(438.5);
    expect(normalizeFontWeight('412.24')).toBe(412.24);
  });

  it('常规权重数值保留', () => {
    expect(normalizeFontWeight('400')).toBe(400);
    expect(normalizeFontWeight(' 700 ')).toBe(700);
  });

  it('非数值（关键字）→ null', () => {
    expect(normalizeFontWeight('bold')).toBeNull();
  });
});

describe('normalizeLetterSpacing（IMPL-07 §31）', () => {
  it('normal → null；px → 数值', () => {
    expect(normalizeLetterSpacing('normal')).toBeNull();
    expect(normalizeLetterSpacing('0.5px')).toBe(0.5);
    expect(normalizeLetterSpacing('-1px')).toBe(-1);
  });
});
