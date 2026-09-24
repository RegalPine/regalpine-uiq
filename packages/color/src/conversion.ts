import { assertFinite, assertSrgb, assertUnit, ColorError } from './types';
import type { LinearRGB, OKLab, OKLCH, SRGB, XYZ } from './types';

type Vector = readonly [number, number, number];
type Matrix = readonly [Vector, Vector, Vector];
const RGB_TO_XYZ: Matrix = [
  [0.41239079926595934, 0.35758433938387796, 0.18048078871500267],
  [0.21263900587151027, 0.7151686787677559, 0.07219231536073371],
  [0.01933081871559185, 0.11919477979462598, 0.9505321522496607],
];
const XYZ_TO_LMS: Matrix = [
  [0.819022437996703, 0.3619062600528904, -0.1288737815209879],
  [0.0329836539323885, 0.9292868615863434, 0.0361446663506424],
  [0.0481771893596242, 0.2642395317527308, 0.6335478284694309],
];
const LMS_TO_LAB: Matrix = [
  [0.2104542553, 0.793617785, -0.0040720468],
  [1.9779984951, -2.428592205, 0.4505937099],
  [0.0259040371, 0.7827717662, -0.808675766],
];

// 从冻结正向矩阵求逆，避免混用不同精度版本的逆矩阵。
function inverse(matrix: Matrix): Matrix {
  const [[a, b, c], [d, e, f], [g, h, i]] = matrix;
  const determinant = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  return [
    [(e * i - f * h) / determinant, (c * h - b * i) / determinant, (b * f - c * e) / determinant],
    [(f * g - d * i) / determinant, (a * i - c * g) / determinant, (c * d - a * f) / determinant],
    [(d * h - e * g) / determinant, (b * g - a * h) / determinant, (a * e - b * d) / determinant],
  ];
}
const XYZ_TO_RGB = inverse(RGB_TO_XYZ);
const LMS_TO_XYZ = inverse(XYZ_TO_LMS);
const LAB_TO_LMS = inverse(LMS_TO_LAB);

function multiply(matrix: Matrix, vector: Vector): [number, number, number] {
  assertFinite(...vector);
  const result = matrix.map(
    (row) => row[0] * vector[0] + row[1] * vector[1] + row[2] * vector[2],
  ) as [number, number, number];
  assertFinite(...result);
  return result;
}

export function srgbToLinear(value: number): number {
  assertFinite(value);
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}
export function linearToSrgb(value: number): number {
  assertFinite(value);
  return value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055;
}
export function toLinearRGB(color: SRGB): LinearRGB {
  assertSrgb(color);
  return { r: srgbToLinear(color.r), g: srgbToLinear(color.g), b: srgbToLinear(color.b) };
}
export function linearRgbToXyz(rgb: LinearRGB): XYZ {
  const [x, y, z] = multiply(RGB_TO_XYZ, [rgb.r, rgb.g, rgb.b]);
  return { x, y, z };
}
export function xyzToLinearRgb(xyz: XYZ): LinearRGB {
  const [r, g, b] = multiply(XYZ_TO_RGB, [xyz.x, xyz.y, xyz.z]);
  return { r, g, b };
}
export function xyzToOklab(xyz: XYZ): OKLab {
  const [l, m, s] = multiply(XYZ_TO_LMS, [xyz.x, xyz.y, xyz.z]);
  const [L, a, b] = multiply(LMS_TO_LAB, [Math.cbrt(l), Math.cbrt(m), Math.cbrt(s)]);
  return { L, a, b };
}
export function oklabToXyz(lab: OKLab): XYZ {
  const [l, m, s] = multiply(LAB_TO_LMS, [lab.L, lab.a, lab.b]);
  const [x, y, z] = multiply(LMS_TO_XYZ, [l ** 3, m ** 3, s ** 3]);
  return { x, y, z };
}
export const ACHROMATIC_EPSILON = 1e-7;
export function oklabToOklch(lab: OKLab): OKLCH {
  assertFinite(lab.L, lab.a, lab.b);
  const C = Math.hypot(lab.a, lab.b);
  const hue = (Math.atan2(lab.b, lab.a) * 180) / Math.PI;
  return { L: lab.L, C, H: C < ACHROMATIC_EPSILON ? 'UNDEFINED' : (hue + 360) % 360 };
}
export function oklchToOklab(lch: OKLCH): OKLab {
  assertFinite(lch.L, lch.C);
  if (lch.C < 0) throw new ColorError('INVALID_COLOR', 'Chroma 不得为负值');
  if (lch.H === 'UNDEFINED') {
    if (lch.C >= ACHROMATIC_EPSILON) throw new ColorError('INVALID_COLOR', '有彩色必须提供 Hue');
    return { L: lch.L, a: 0, b: 0 };
  }
  assertFinite(lch.H);
  const radians = ((((lch.H % 360) + 360) % 360) * Math.PI) / 180;
  return { L: lch.L, a: lch.C * Math.cos(radians), b: lch.C * Math.sin(radians) };
}

/** 显式输出阶段才允许裁切；内部转换保留超色域分量。 */
export function linearRgbToSrgbOutput(rgb: LinearRGB, alpha = 1): SRGB {
  assertFinite(rgb.r, rgb.g, rgb.b);
  assertUnit(alpha);
  const channel = (value: number): number => Math.max(0, Math.min(1, linearToSrgb(value)));
  return { r: channel(rgb.r), g: channel(rgb.g), b: channel(rgb.b), alpha };
}
