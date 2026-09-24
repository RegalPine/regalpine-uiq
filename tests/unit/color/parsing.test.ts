import { describe, expect, it } from 'vitest';
import { parseHex, parseRgb, parseColor, ColorError } from '@uiq/color';

describe('parseHex', () => {
  it('解析 6 位 HEX', () => {
    const color = parseHex('#ff0000');
    expect(color.r).toBe(1);
    expect(color.g).toBe(0);
    expect(color.b).toBe(0);
    expect(color.alpha).toBe(1);
  });

  it('解析 3 位 HEX', () => {
    const color = parseHex('#f00');
    expect(color.r).toBe(1);
    expect(color.g).toBe(0);
    expect(color.b).toBe(0);
    expect(color.alpha).toBe(1);
  });

  it('解析 8 位 HEX（含 alpha）', () => {
    const color = parseHex('#ff000080');
    expect(color.r).toBe(1);
    expect(color.g).toBe(0);
    expect(color.b).toBe(0);
    expect(color.alpha).toBeCloseTo(128 / 255, 5);
  });

  it('解析 4 位 HEX（含 alpha）', () => {
    const color = parseHex('#f008');
    expect(color.r).toBe(1);
    expect(color.g).toBe(0);
    expect(color.b).toBe(0);
    expect(color.alpha).toBeCloseTo(0x88 / 255, 5);
  });

  it('大小写不敏感', () => {
    const upper = parseHex('#FF0000');
    const lower = parseHex('#ff0000');
    expect(upper).toEqual(lower);
  });

  it('白色', () => {
    const color = parseHex('#ffffff');
    expect(color.r).toBe(1);
    expect(color.g).toBe(1);
    expect(color.b).toBe(1);
  });

  it('黑色', () => {
    const color = parseHex('#000000');
    expect(color.r).toBe(0);
    expect(color.g).toBe(0);
    expect(color.b).toBe(0);
  });

  it('拒绝无效 HEX', () => {
    expect(() => parseHex('ff0000')).toThrow(ColorError);
    expect(() => parseHex('#gg0000')).toThrow(ColorError);
    expect(() => parseHex('#12345')).toThrow(ColorError);
    expect(() => parseHex('')).toThrow(ColorError);
  });
});

describe('parseRgb', () => {
  it('解析逗号分隔 RGB', () => {
    const color = parseRgb('rgb(255, 0, 0)');
    expect(color.r).toBe(1);
    expect(color.g).toBe(0);
    expect(color.b).toBe(0);
    expect(color.alpha).toBe(1);
  });

  it('解析带 alpha 的 RGBA', () => {
    const color = parseRgb('rgba(255, 0, 0, 0.5)');
    expect(color.r).toBe(1);
    expect(color.g).toBe(0);
    expect(color.b).toBe(0);
    expect(color.alpha).toBe(0.5);
  });

  it('解析空格分隔语法', () => {
    const color = parseRgb('rgb(255 128 0)');
    expect(color.r).toBe(1);
    expect(color.g).toBeCloseTo(128 / 255, 5);
    expect(color.b).toBe(0);
  });

  it('解析带斜线 alpha', () => {
    const color = parseRgb('rgb(255 0 0 / 0.5)');
    expect(color.r).toBe(1);
    expect(color.g).toBe(0);
    expect(color.b).toBe(0);
    expect(color.alpha).toBe(0.5);
  });

  it('解析百分比', () => {
    const color = parseRgb('rgb(100%, 50%, 0%)');
    expect(color.r).toBe(1);
    expect(color.g).toBe(0.5);
    expect(color.b).toBe(0);
  });

  it('拒绝混用逗号和斜线', () => {
    expect(() => parseRgb('rgb(255, 0, 0 / 0.5)')).toThrow(ColorError);
  });

  it('拒绝无效格式', () => {
    expect(() => parseRgb('rgb()')).toThrow(ColorError);
    expect(() => parseRgb('rgb(255)')).toThrow(ColorError);
    expect(() => parseRgb('hsl(0, 0%, 0%)')).toThrow(ColorError);
  });

  it('拒绝超出范围的值', () => {
    expect(() => parseRgb('rgb(256, 0, 0)')).toThrow(ColorError);
    expect(() => parseRgb('rgb(-1, 0, 0)')).toThrow(ColorError);
  });
});

describe('parseColor', () => {
  it('解析 transparent', () => {
    const color = parseColor('transparent');
    expect(color).toEqual({ r: 0, g: 0, b: 0, alpha: 0 });
  });

  it('解析 Transparent（大小写不敏感）', () => {
    const color = parseColor('Transparent');
    expect(color).toEqual({ r: 0, g: 0, b: 0, alpha: 0 });
  });

  it('分发 HEX', () => {
    const color = parseColor('#ff0000');
    expect(color.r).toBe(1);
  });

  it('分发 RGB', () => {
    const color = parseColor('rgb(0, 255, 0)');
    expect(color.g).toBe(1);
  });

  it('拒绝不支持的格式', () => {
    expect(() => parseColor('hsl(0, 0%, 0%)')).toThrow(ColorError);
    expect(() => parseColor('red')).toThrow(ColorError);
  });

  it('拒绝非字符串输入', () => {
    expect(() => parseColor(123 as unknown as string)).toThrow(ColorError);
  });
});
