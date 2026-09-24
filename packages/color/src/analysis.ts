import { linearToSrgb, toLinearRGB } from './conversion';
import { assertFinite, assertSrgb, ColorError } from './types';
import type { Hue, LinearRGB, OKLCH, SRGB } from './types';

/** 输入已明确为 Linear RGB，不进行二次解码。 */
export function linearRelativeLuminance(rgb: LinearRGB): number {
  assertFinite(rgb.r, rgb.g, rgb.b);
  return 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b;
}

/** sRGB 入口沿用 IMPL-04；透明色必须先解析有效背景。 */
export function relativeLuminance(color: SRGB): number {
  assertSrgb(color);
  if (color.alpha !== 1) throw new ColorError('UNRESOLVED_BACKGROUND', '透明色需要先完成背景合成');
  return linearRelativeLuminance(toLinearRGB(color));
}

export function compositeOver(foreground: SRGB, background: SRGB): SRGB {
  assertSrgb(foreground);
  assertSrgb(background);
  const alpha = foreground.alpha + background.alpha * (1 - foreground.alpha);
  if (alpha === 0) return { r: 0, g: 0, b: 0, alpha: 0 };
  const front = toLinearRGB(foreground);
  const back = toLinearRGB(background);
  const channel = (first: number, second: number): number => {
    const linear =
      (first * foreground.alpha + second * background.alpha * (1 - foreground.alpha)) / alpha;
    return linearToSrgb(linear);
  };
  return {
    r: channel(front.r, back.r),
    g: channel(front.g, back.g),
    b: channel(front.b, back.b),
    alpha,
  };
}

export function contrastRatio(foreground: SRGB, background: SRGB): number {
  assertSrgb(foreground);
  assertSrgb(background);
  if (background.alpha !== 1) {
    throw new ColorError('UNRESOLVED_BACKGROUND', '对比度需要已解析的不透明背景，不能假设白底');
  }
  const actual = foreground.alpha === 1 ? foreground : compositeOver(foreground, background);
  const first = relativeLuminance(actual);
  const second = relativeLuminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

export function deltaL(a: { readonly L: number }, b: { readonly L: number }): number {
  assertFinite(a.L, b.L);
  return b.L - a.L;
}
export function deltaC(a: Pick<OKLCH, 'C'>, b: Pick<OKLCH, 'C'>): number {
  assertFinite(a.C, b.C);
  return b.C - a.C;
}
export function deltaH(a: Hue, b: Hue): Hue {
  if (a === 'UNDEFINED' || b === 'UNDEFINED') return 'UNDEFINED';
  assertFinite(a, b);
  const normalizedA = ((a % 360) + 360) % 360;
  const normalizedB = ((b % 360) + 360) % 360;
  let result = normalizedB - normalizedA;
  if (result > 180) result -= 360;
  if (result < -180) result += 360;
  return result;
}
export function isInSrgbGamut(rgb: LinearRGB, epsilon = 1e-7): boolean {
  assertFinite(rgb.r, rgb.g, rgb.b, epsilon);
  if (epsilon < 0) throw new ColorError('INVALID_COLOR', '色域 epsilon 不得为负值');
  return [rgb.r, rgb.g, rgb.b].every((value) => value >= -epsilon && value <= 1 + epsilon);
}
export function gamutDistance(rgb: LinearRGB): number {
  assertFinite(rgb.r, rgb.g, rgb.b);
  const excess = (value: number): number => value - Math.max(0, Math.min(1, value));
  return Math.hypot(excess(rgb.r), excess(rgb.g), excess(rgb.b));
}
