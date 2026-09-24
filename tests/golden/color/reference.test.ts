import { describe, expect, it } from 'vitest';
import {
  compositeOver,
  contrastRatio,
  deltaC,
  deltaH,
  deltaL,
  gamutDistance,
  isInSrgbGamut,
  linearRgbToXyz,
  oklabToOklch,
  parseHex,
  srgbToLinear,
  toLinearRGB,
  xyzToOklab,
  xyzToLinearRgb,
} from '@uiq/color';

/**
 * P0-04 / P1-04：独立推导基线 v1.0.0，禁止使用被测函数生成 expected。
 * WCAG：https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
 * CSS Color 4：https://www.w3.org/TR/css-color-4/#color-conversion-code
 * OKLab：https://bottosson.github.io/posts/oklab/ （2021-01-25 的直接 Linear RGB 矩阵）
 * 约定：测试绝对容差不进入运行时 Rule。重算 Golden 必须重新核对来源与版本。
 */
const CONTRAST_CASES = [
  { id: 'P1-COLOR-001', fg: '#000000', bg: '#ffffff', expected: 21, tolerance: 0 },
  { id: 'P1-COLOR-002', fg: '#808080', bg: '#808080', expected: 1, tolerance: 0 },
  {
    id: 'P1-COLOR-003',
    fg: '#777777',
    bg: '#ffffff',
    expected: 4.478089453577214,
    tolerance: 1e-12,
  },
  {
    id: 'P1-COLOR-004',
    fg: '#ffffff',
    bg: '#2563eb',
    expected: 5.168555560022562,
    tolerance: 1e-12,
  },
] as const;

// 每个通道独立套用 WCAG 分段传输函数，Y=.2126R+.7152G+.0722B，ratio=(Ymax+.05)/(Ymin+.05)。
// 以上期望来自独立算式计算；黑白分别为 1.05/.05、同色为分子/自身。
describe('P1 Color 独立 Golden v1.0.0', () => {
  for (const fixture of CONTRAST_CASES) {
    it(fixture.id, () => {
      const actual = contrastRatio(parseHex(fixture.fg), parseHex(fixture.bg));
      expect(Math.abs(actual - fixture.expected)).toBeLessThanOrEqual(fixture.tolerance);
    });
  }

  it('P1-COLOR-005：线性半透明黑合成与对比度，不使用编码空间平均', () => {
    const foreground = { r: 0, g: 0, b: 0, alpha: 0.5 };
    const background = { r: 1, g: 1, b: 1, alpha: 1 };
    // 线性通道=.5；编码值=1.055*(.5^(1/2.4))-.055；ratio=1.05/.55。
    const actual = compositeOver(foreground, background);
    for (const channel of [actual.r, actual.g, actual.b]) {
      expect(Math.abs(channel - 0.7353569830524495)).toBeLessThanOrEqual(1e-12);
    }
    expect(actual.alpha).toBe(1);
    expect(Math.abs(contrastRatio(foreground, background) - 1.909090909090909)).toBeLessThanOrEqual(
      1e-12,
    );
  });

  it('P1-COLOR-006：HEX alpha 保留，未知有效背景拒绝计算', () => {
    expect(parseHex('#1234')).toEqual({ r: 17 / 255, g: 34 / 255, b: 51 / 255, alpha: 68 / 255 });
    expect(() => contrastRatio(parseHex('#fff'), parseHex('#0000'))).toThrow();
    expect(compositeOver(parseHex('#0000'), parseHex('#fff0')).alpha).toBe(0);
  });

  it('P1-COLOR-007：sRGB 传输函数分段边界', () => {
    // 低段使用 .04045/12.92，不先钳制或舍入。
    expect(Math.abs(srgbToLinear(0.04045) - 0.0031308049535603713)).toBeLessThanOrEqual(1e-15);
    expect(srgbToLinear(0)).toBe(0);
    expect(srgbToLinear(1)).toBe(1);
  });

  it('P1-COLOR-008：独立 CSS Color 4 有理数矩阵的红色基向量', () => {
    const actual = linearRgbToXyz({ r: 1, g: 0, b: 0 });
    const expected = { x: 506752 / 1228815, y: 87098 / 409605, z: 7918 / 409605 };
    for (const axis of ['x', 'y', 'z'] as const) {
      expect(Math.abs(actual[axis] - expected[axis])).toBeLessThanOrEqual(1e-12);
    }
  });

  it('P1-COLOR-009：直接 Linear RGB→OKLab 的独立红色基线', () => {
    // 用 Ottosson 的直接矩阵计算，未使用生产实现的 RGB→XYZ→LMS 链。
    // 两份公布矩阵的舍入精度不同，绝对容差 2e-7；不改变生产数学精度。
    const actual = xyzToOklab(linearRgbToXyz(toLinearRGB(parseHex('#f00'))));
    const expected = { L: 0.6279553606145516, a: 0.22486306106597398, b: 0.1258462985307351 };
    for (const axis of ['L', 'a', 'b'] as const) {
      expect(Math.abs(actual[axis] - expected[axis])).toBeLessThanOrEqual(2e-7);
    }
  });

  it('P1-COLOR-010：无彩色 Hue 与有向差值', () => {
    expect(oklabToOklch({ L: 0.5, a: 0, b: 0 })).toEqual({ L: 0.5, C: 0, H: 'UNDEFINED' });
    expect(deltaH(350, 10)).toBe(20);
    expect(deltaH(10, 350)).toBe(-20);
    expect(deltaH('UNDEFINED', 10)).toBe('UNDEFINED');
    expect(Math.abs(deltaL({ L: 0.7 }, { L: 0.3 }) + 0.4)).toBeLessThanOrEqual(1e-15);
    expect(Math.abs(deltaC({ C: 0.2 }, { C: 0.1 }) + 0.1)).toBeLessThanOrEqual(1e-15);
  });

  it('P1-COLOR-011：原始超色域值、零容差边界与独立距离', () => {
    expect(isInSrgbGamut({ r: 1, g: 0, b: 0 }, 0)).toBe(true);
    expect(isInSrgbGamut({ r: 1.001, g: 0, b: 0 }, 0)).toBe(false);
    // 超出分量 (3,0,-4)，欧氏距离按 3-4-5 三角形独立推导。
    expect(gamutDistance({ r: 4, g: 0, b: -4 })).toBe(5);
  });

  it('P1-COLOR-012：往返和非有限数值反例（不是独立 Golden 的替代）', () => {
    const input = { r: 1.2, g: 0.3, b: -0.1 };
    const actual = xyzToLinearRgb(linearRgbToXyz(input));
    for (const axis of ['r', 'g', 'b'] as const) {
      expect(Math.abs(actual[axis] - input[axis])).toBeLessThanOrEqual(1e-12);
    }
    expect(() => linearRgbToXyz({ r: Infinity, g: 0, b: 0 })).toThrow();
    expect(() => srgbToLinear(NaN)).toThrow();
  });
});
