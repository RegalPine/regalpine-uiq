import { assertSrgb, ColorError } from './types';
import type { SRGB } from './types';

export function parseHex(input: string): SRGB {
  const value = input.trim();
  if (!/^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(value)) {
    throw new ColorError('INVALID_COLOR', 'HEX 必须包含 # 及 3、4、6 或 8 个十六进制字符');
  }
  let hex = value.slice(1);
  if (hex.length <= 4) hex = [...hex].map((digit) => digit + digit).join('');
  if (hex.length === 6) hex += 'ff';
  return {
    r: Number.parseInt(hex.slice(0, 2), 16) / 255,
    g: Number.parseInt(hex.slice(2, 4), 16) / 255,
    b: Number.parseInt(hex.slice(4, 6), 16) / 255,
    alpha: Number.parseInt(hex.slice(6, 8), 16) / 255,
  };
}

function component(token: string, scale: number): number {
  if (!/^[+-]?(?:\d*\.\d+|\d+)(?:e[+-]?\d+)?%?$/i.test(token)) {
    throw new ColorError('INVALID_COLOR', 'RGB 分量必须是数值或百分比');
  }
  const percentage = token.endsWith('%');
  return Number(percentage ? token.slice(0, -1) : token) / (percentage ? 100 : scale);
}

export function parseRgb(input: string): SRGB {
  const match = /^rgba?\(([^()]*)\)$/i.exec(input.trim());
  if (!match) throw new ColorError('INVALID_COLOR', 'RGB 函数格式无效');
  const body = match[1]!;
  let channels: string[];
  let alpha: string | undefined;
  if (body.includes(',')) {
    if (body.includes('/')) throw new ColorError('INVALID_COLOR', '不能混用逗号与斜线语法');
    const tokens = body.split(',').map((value) => value.trim());
    if (tokens.length !== 3 && tokens.length !== 4)
      throw new ColorError('INVALID_COLOR', 'RGB 分量数量无效');
    channels = tokens.slice(0, 3);
    alpha = tokens[3];
    const percentages = channels.filter((value) => value.endsWith('%')).length;
    if (percentages !== 0 && percentages !== 3)
      throw new ColorError('INVALID_COLOR', '旧式 RGB 分量必须使用相同单位');
  } else {
    const parts = body.split('/');
    if (parts.length > 2) throw new ColorError('INVALID_COLOR', 'RGB alpha 数量无效');
    channels = parts[0]!.trim().split(/\s+/);
    alpha = parts[1]?.trim();
  }
  if (channels.length !== 3) throw new ColorError('INVALID_COLOR', 'RGB 需要三个颜色分量');
  const color = {
    r: component(channels[0]!, 255),
    g: component(channels[1]!, 255),
    b: component(channels[2]!, 255),
    alpha: alpha === undefined ? 1 : component(alpha, 1),
  };
  assertSrgb(color);
  return color;
}

/** V1.0 仅解析 HEX、rgb/rgba 和 transparent；不借用浏览器进行解析。 */
export function parseColor(input: string): SRGB {
  if (typeof input !== 'string') throw new ColorError('INVALID_COLOR', '颜色输入必须是字符串');
  const value = input.trim();
  if (value.toLowerCase() === 'transparent') return { r: 0, g: 0, b: 0, alpha: 0 };
  if (value.startsWith('#')) return parseHex(value);
  if (/^rgba?\(/i.test(value)) return parseRgb(value);
  throw new ColorError('UNSUPPORTED_COLOR', '当前仅支持 HEX、rgb/rgba 与 transparent');
}
