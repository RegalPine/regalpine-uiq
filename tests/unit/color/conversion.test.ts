import { describe, expect, it } from 'vitest';
import {
  srgbToLinear,
  linearToSrgb,
  toLinearRGB,
  linearRgbToXyz,
  xyzToLinearRgb,
  xyzToOklab,
  oklabToXyz,
  oklabToOklch,
  oklchToOklab,
  linearRgbToSrgbOutput,
  ACHROMATIC_EPSILON,
  ColorError,
} from '@uiq/color';
import type { SRGB, OKLCH } from '@uiq/color';

describe('sRGB 传输函数', () => {
  it('srgbToLinear 在低段使用线性映射', () => {
    expect(srgbToLinear(0)).toBe(0);
    expect(srgbToLinear(0.04045)).toBeCloseTo(0.04045 / 12.92, 10);
  });

  it('srgbToLinear 在高段使用 gamma 2.4', () => {
    expect(srgbToLinear(1)).toBeCloseTo(1, 10);
    expect(srgbToLinear(0.5)).toBeCloseTo(((0.5 + 0.055) / 1.055) ** 2.4, 10);
  });

  it('linearToSrgb 是 srgbToLinear 的逆', () => {
    for (const value of [0, 0.1, 0.25, 0.5, 0.75, 1]) {
      expect(linearToSrgb(srgbToLinear(value))).toBeCloseTo(value, 10);
    }
  });

  it('拒绝非有限值', () => {
    expect(() => srgbToLinear(NaN)).toThrow(ColorError);
    expect(() => linearToSrgb(Infinity)).toThrow(ColorError);
  });
});

describe('toLinearRGB', () => {
  it('转换 sRGB 到线性 RGB', () => {
    const linear = toLinearRGB({ r: 1, g: 0, b: 0, alpha: 1 });
    expect(linear.r).toBe(1);
    expect(linear.g).toBe(0);
    expect(linear.b).toBe(0);
  });

  it('拒绝超出范围的 sRGB', () => {
    expect(() => toLinearRGB({ r: 1.5, g: 0, b: 0, alpha: 1 })).toThrow(ColorError);
    expect(() => toLinearRGB({ r: 0, g: 0, b: 0, alpha: -0.1 })).toThrow(ColorError);
  });
});

describe('RGB ↔ XYZ 往返', () => {
  it('白色 sRGB(1,1,1) → XYZ 接近 D65 白点', () => {
    const xyz = linearRgbToXyz({ r: 1, g: 1, b: 1 });
    expect(xyz.x).toBeCloseTo(0.9505, 2);
    expect(xyz.y).toBeCloseTo(1.0, 2);
    expect(xyz.z).toBeCloseTo(1.089, 2);
  });

  it('往返转换保持精度', () => {
    const original = { r: 0.5, g: 0.3, b: 0.8 };
    const xyz = linearRgbToXyz(original);
    const result = xyzToLinearRgb(xyz);
    expect(result.r).toBeCloseTo(original.r, 10);
    expect(result.g).toBeCloseTo(original.g, 10);
    expect(result.b).toBeCloseTo(original.b, 10);
  });
});

describe('XYZ ↔ OKLab 往返', () => {
  it('D65 白点的 OKLab L 接近 1', () => {
    const lab = xyzToOklab({ x: 0.95047, y: 1.0, z: 1.08883 });
    expect(lab.L).toBeCloseTo(1.0, 2);
    expect(lab.a).toBeCloseTo(0, 2);
    expect(lab.b).toBeCloseTo(0, 2);
  });

  it('往返转换保持精度', () => {
    const original = { x: 0.4, y: 0.3, z: 0.2 };
    const lab = xyzToOklab(original);
    const result = oklabToXyz(lab);
    expect(result.x).toBeCloseTo(original.x, 8);
    expect(result.y).toBeCloseTo(original.y, 8);
    expect(result.z).toBeCloseTo(original.z, 8);
  });
});

describe('OKLab ↔ OKLCH', () => {
  it('无彩色（a=0, b=0）的色度为 0，色相为 UNDEFINED', () => {
    const lch = oklabToOklch({ L: 0.5, a: 0, b: 0 });
    expect(lch.L).toBe(0.5);
    expect(lch.C).toBe(0);
    expect(lch.H).toBe('UNDEFINED');
  });

  it('极小色度低于 epsilon 时色相为 UNDEFINED', () => {
    const lch = oklabToOklch({ L: 0.5, a: 1e-8, b: 1e-8 });
    expect(lch.C).toBeLessThan(ACHROMATIC_EPSILON);
    expect(lch.H).toBe('UNDEFINED');
  });

  it('有彩色的色相在 [0, 360)', () => {
    const lch = oklabToOklch({ L: 0.5, a: 0.1, b: 0.1 });
    expect(typeof lch.H).toBe('number');
    expect(lch.H as number).toBeGreaterThanOrEqual(0);
    expect(lch.H as number).toBeLessThan(360);
  });

  it('纯红色方向色相接近 0°/360°', () => {
    const lch = oklabToOklch({ L: 0.5, a: 0.2, b: 0 });
    expect(lch.H).toBeCloseTo(0, 5);
  });

  it('往返 OKLCH → OKLab → OKLCH', () => {
    const original: OKLCH = { L: 0.6, C: 0.15, H: 210 };
    const lab = oklchToOklab(original);
    const result = oklabToOklch(lab);
    expect(result.L).toBeCloseTo(original.L, 10);
    expect(result.C).toBeCloseTo(original.C, 10);
    expect(result.H).toBeCloseTo(original.H as number, 8);
  });

  it('UNDEFINED 色相的 OKLCH 往返', () => {
    const original: OKLCH = { L: 0.5, C: 0, H: 'UNDEFINED' };
    const lab = oklchToOklab(original);
    expect(lab.a).toBe(0);
    expect(lab.b).toBe(0);
    const result = oklabToOklch(lab);
    expect(result.H).toBe('UNDEFINED');
  });

  it('拒绝负 Chroma', () => {
    expect(() => oklchToOklab({ L: 0.5, C: -0.1, H: 180 })).toThrow(ColorError);
  });

  it('有彩色但 Hue 为 UNDEFINED 时抛异常', () => {
    expect(() => oklchToOklab({ L: 0.5, C: 0.2, H: 'UNDEFINED' })).toThrow(ColorError);
  });
});

describe('linearRgbToSrgbOutput', () => {
  it('裁切超色域值到 [0,1]', () => {
    const result = linearRgbToSrgbOutput({ r: 1.5, g: -0.1, b: 0.5 });
    expect(result.r).toBe(1);
    expect(result.g).toBe(0);
    expect(result.b).toBeCloseTo(srgbToLinear(0.5) > 0 ? linearToSrgb(0.5) : 0, 5);
  });

  it('默认 alpha 为 1', () => {
    const result = linearRgbToSrgbOutput({ r: 0, g: 0, b: 0 });
    expect(result.alpha).toBe(1);
  });

  it('支持自定义 alpha', () => {
    const result = linearRgbToSrgbOutput({ r: 0, g: 0, b: 0 }, 0.5);
    expect(result.alpha).toBe(0.5);
  });
});

describe('完整 sRGB → OKLCH 往返', () => {
  it('红色 #ff0000 的 OKLCH 色相在红色区域', () => {
    const srgb: SRGB = { r: 1, g: 0, b: 0, alpha: 1 };
    const linear = toLinearRGB(srgb);
    const xyz = linearRgbToXyz(linear);
    const lab = xyzToOklab(xyz);
    const lch = oklabToOklch(lab);
    expect(lch.L).toBeGreaterThan(0);
    expect(lch.C).toBeGreaterThan(0);
    // 红色色相在 ~29° 附近（OKLCH 空间）
    expect(lch.H as number).toBeCloseTo(29, 0);
  });
});
