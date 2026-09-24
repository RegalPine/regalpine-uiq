export interface SRGB {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly alpha: number;
}
export interface LinearRGB {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}
export interface XYZ {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}
export interface OKLab {
  readonly L: number;
  readonly a: number;
  readonly b: number;
}
export type Hue = number | 'UNDEFINED';
export interface OKLCH {
  readonly L: number;
  readonly C: number;
  readonly H: Hue;
}
export type ColorErrorCode = 'INVALID_COLOR' | 'UNSUPPORTED_COLOR' | 'UNRESOLVED_BACKGROUND';
export class ColorError extends Error {
  constructor(
    readonly code: ColorErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'ColorError';
  }
}

export function assertFinite(...values: readonly number[]): void {
  if (!values.every((value) => typeof value === 'number' && Number.isFinite(value))) {
    throw new ColorError('INVALID_COLOR', '颜色分量必须是有限数值');
  }
}
export function assertUnit(...values: readonly number[]): void {
  assertFinite(...values);
  if (values.some((value) => value < 0 || value > 1)) {
    throw new ColorError('INVALID_COLOR', '编码颜色与 alpha 必须在 [0,1] 内');
  }
}
export function assertSrgb(color: SRGB): void {
  assertUnit(color.r, color.g, color.b, color.alpha);
}
