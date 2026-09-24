import { describe, expect, it } from 'vitest';
import {
  relativeLuminance,
  contrastRatio,
  compositeOver,
  deltaL,
  deltaC,
  deltaH,
  isInSrgbGamut,
  gamutDistance,
  ColorError,
} from '@uiq/color';
import type { SRGB, LinearRGB } from '@uiq/color';

describe('relativeLuminance', () => {
  it('白色亮度为 1', () => {
    const white: SRGB = { r: 1, g: 1, b: 1, alpha: 1 };
    expect(relativeLuminance(white)).toBeCloseTo(1, 5);
  });

  it('黑色亮度为 0', () => {
    const black: SRGB = { r: 0, g: 0, b: 0, alpha: 1 };
    expect(relativeLuminance(black)).toBeCloseTo(0, 5);
  });

  it('透明色抛出异常', () => {
    const transparent: SRGB = { r: 1, g: 0, b: 0, alpha: 0.5 };
    expect(() => relativeLuminance(transparent)).toThrow(ColorError);
  });
});

describe('contrastRatio', () => {
  it('黑白对比度为 21:1', () => {
    const white: SRGB = { r: 1, g: 1, b: 1, alpha: 1 };
    const black: SRGB = { r: 0, g: 0, b: 0, alpha: 1 };
    expect(contrastRatio(white, black)).toBeCloseTo(21, 0);
  });

  it('同色对比度为 1:1', () => {
    const gray: SRGB = { r: 0.5, g: 0.5, b: 0.5, alpha: 1 };
    expect(contrastRatio(gray, gray)).toBeCloseTo(1, 5);
  });

  it('透明前景在白色背景上的对比度', () => {
    const semiBlack: SRGB = { r: 0, g: 0, b: 0, alpha: 0.5 };
    const white: SRGB = { r: 1, g: 1, b: 1, alpha: 1 };
    const ratio = contrastRatio(semiBlack, white);
    // alpha 合成在线性空间进行，半透明黑在白底对比度约 1.9:1
    expect(ratio).toBeGreaterThan(1.5);
    expect(ratio).toBeLessThan(3);
  });

  it('透明背景抛出异常', () => {
    const fg: SRGB = { r: 1, g: 0, b: 0, alpha: 1 };
    const bg: SRGB = { r: 0, g: 0, b: 0, alpha: 0.5 };
    expect(() => contrastRatio(fg, bg)).toThrow(ColorError);
  });

  it('对比度始终 >= 1', () => {
    const a: SRGB = { r: 0.8, g: 0.2, b: 0.1, alpha: 1 };
    const b: SRGB = { r: 0.1, g: 0.7, b: 0.9, alpha: 1 };
    expect(contrastRatio(a, b)).toBeGreaterThanOrEqual(1);
    expect(contrastRatio(b, a)).toBeGreaterThanOrEqual(1);
  });
});

describe('compositeOver', () => {
  it('不透明前景覆盖背景等于前景', () => {
    const fg: SRGB = { r: 1, g: 0, b: 0, alpha: 1 };
    const bg: SRGB = { r: 0, g: 0, b: 1, alpha: 1 };
    const result = compositeOver(fg, bg);
    expect(result.r).toBeCloseTo(1, 5);
    expect(result.g).toBeCloseTo(0, 5);
    expect(result.b).toBeCloseTo(0, 5);
    expect(result.alpha).toBeCloseTo(1, 5);
  });

  it('完全透明前景等于背景', () => {
    const fg: SRGB = { r: 1, g: 0, b: 0, alpha: 0 };
    const bg: SRGB = { r: 0, g: 0, b: 1, alpha: 1 };
    const result = compositeOver(fg, bg);
    expect(result.r).toBeCloseTo(0, 5);
    expect(result.g).toBeCloseTo(0, 5);
    expect(result.b).toBeCloseTo(1, 5);
    expect(result.alpha).toBeCloseTo(1, 5);
  });

  it('两者都完全透明返回黑色透明', () => {
    const fg: SRGB = { r: 1, g: 0, b: 0, alpha: 0 };
    const bg: SRGB = { r: 0, g: 0, b: 1, alpha: 0 };
    const result = compositeOver(fg, bg);
    expect(result.alpha).toBe(0);
  });
});

describe('deltaL / deltaC / deltaH', () => {
  it('deltaL 计算亮度差', () => {
    expect(deltaL({ L: 0.3 }, { L: 0.7 })).toBeCloseTo(0.4, 10);
    expect(deltaL({ L: 0.7 }, { L: 0.3 })).toBeCloseTo(-0.4, 10);
  });

  it('deltaC 计算色度差', () => {
    expect(deltaC({ C: 0.1 }, { C: 0.2 })).toBeCloseTo(0.1, 10);
  });

  it('deltaH 计算最短弧色相差', () => {
    expect(deltaH(10, 350)).toBeCloseTo(-20, 10);
    expect(deltaH(350, 10)).toBeCloseTo(20, 10);
    expect(deltaH(0, 180)).toBeCloseTo(180, 10);
  });

  it('deltaH 遇到 UNDEFINED 返回 UNDEFINED', () => {
    expect(deltaH('UNDEFINED', 180)).toBe('UNDEFINED');
    expect(deltaH(180, 'UNDEFINED')).toBe('UNDEFINED');
    expect(deltaH('UNDEFINED', 'UNDEFINED')).toBe('UNDEFINED');
  });
});

describe('isInSrgbGamut', () => {
  it('sRGB 范围内的值在色域内', () => {
    expect(isInSrgbGamut({ r: 0.5, g: 0.5, b: 0.5 })).toBe(true);
    expect(isInSrgbGamut({ r: 0, g: 0, b: 0 })).toBe(true);
    expect(isInSrgbGamut({ r: 1, g: 1, b: 1 })).toBe(true);
  });

  it('超出范围的值不在色域内', () => {
    expect(isInSrgbGamut({ r: 1.5, g: 0, b: 0 })).toBe(false);
    expect(isInSrgbGamut({ r: 0, g: -0.1, b: 0 })).toBe(false);
  });

  it('epsilon 容差', () => {
    expect(isInSrgbGamut({ r: 1 + 1e-8, g: 0, b: 0 })).toBe(true);
    expect(isInSrgbGamut({ r: 1.1, g: 0, b: 0 })).toBe(false);
  });

  it('拒绝负 epsilon', () => {
    expect(() => isInSrgbGamut({ r: 0, g: 0, b: 0 }, -1)).toThrow(ColorError);
  });
});

describe('gamutDistance', () => {
  it('色域内距离为 0', () => {
    expect(gamutDistance({ r: 0.5, g: 0.5, b: 0.5 })).toBe(0);
  });

  it('计算超出部分的欧氏距离', () => {
    const rgb: LinearRGB = { r: 1.3, g: 0.5, b: -0.1 };
    // excess: r=0.3, g=0, b=0.1
    const expected = Math.hypot(0.3, 0, 0.1);
    expect(gamutDistance(rgb)).toBeCloseTo(expected, 10);
  });
});
