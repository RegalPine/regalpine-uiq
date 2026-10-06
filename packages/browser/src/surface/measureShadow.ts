import type { Measurement } from '@uiq/core';
import type { MeasurementFactory } from '../measurement-factory';

export interface ShadowMeasureContext {
  readonly subjectId: string;
  readonly element: Element;
  readonly style: CSSStyleDeclaration;
  readonly factory: MeasurementFactory;
}

export interface ShadowLayer {
  readonly offsetX: number;
  readonly offsetY: number;
  readonly blur: number;
  readonly spread: number;
  readonly color: string;
  readonly inset: boolean;
}

export interface ShadowValue {
  readonly layers: readonly ShadowLayer[];
  readonly layerCount: number;
  readonly unit: 'px';
}

/**
 * 解析 CSS boxShadow 字符串。
 * 支持格式: [inset] offsetX offsetY [blur] [spread] color
 */
function parseBoxShadow(raw: string): ShadowLayer[] {
  const trimmed = raw.trim();
  if (trimmed === 'none' || trimmed === '') return [];

  // 按逗号分割多层 shadow，但要小心 rgb()/rgba() 中的逗号
  const shadows: string[] = [];
  let depth = 0;
  let current = '';
  for (const char of trimmed) {
    if (char === '(') depth++;
    else if (char === ')') depth--;
    if (char === ',' && depth === 0) {
      shadows.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) shadows.push(current.trim());

  return shadows.map((shadow) => {
    let inset = false;
    let remaining = shadow;
    if (remaining.startsWith('inset')) {
      inset = true;
      remaining = remaining.slice(5).trim();
    }

    // 提取数值部分（前4个 px/em 值）
    const parts = remaining.split(/\s+/);
    const numericParts: string[] = [];
    const colorParts: string[] = [];

    for (const part of parts) {
      if (numericParts.length < 4 && /^-?[\d.]+(px|em|rem)?/.test(part)) {
        numericParts.push(part);
      } else {
        colorParts.push(part);
      }
    }

    const parseNum = (s: string): number => {
      const m = s.match(/^(-?[\d.]+)/);
      return m ? parseFloat(m[1] ?? '0') : 0;
    };

    return {
      offsetX: parseNum(numericParts[0] ?? '0'),
      offsetY: parseNum(numericParts[1] ?? '0'),
      blur: parseNum(numericParts[2] ?? '0'),
      spread: parseNum(numericParts[3] ?? '0'),
      color: colorParts.join(' ') || 'currentColor',
      inset,
    };
  });
}

/**
 * 测量元素 box-shadow。
 * 规范：UIQ-VISUAL-QUALITY-26 §5
 */
export function measureShadow(ctx: ShadowMeasureContext): Measurement<ShadowValue | null> {
  const { subjectId, style, factory } = ctx;
  try {
    const raw = style.boxShadow;
    const layers = parseBoxShadow(raw);
    const value: ShadowValue = { layers, layerCount: layers.length, unit: 'px' };
    return factory.create({ subjectId, type: 'surface.shadow', value });
  } catch {
    return factory.create({ subjectId, type: 'surface.shadow', value: null, status: 'ERROR' });
  }
}
