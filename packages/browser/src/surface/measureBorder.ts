import type { Measurement } from '@uiq/core';
import type { MeasurementFactory } from '../measurement-factory';

export interface BorderMeasureContext {
  readonly subjectId: string;
  readonly element: Element;
  readonly style: CSSStyleDeclaration;
  readonly factory: MeasurementFactory;
}

export interface BorderValue {
  readonly topWidth: number;
  readonly rightWidth: number;
  readonly bottomWidth: number;
  readonly leftWidth: number;
  readonly topStyle: string;
  readonly rightStyle: string;
  readonly bottomStyle: string;
  readonly leftStyle: string;
  readonly unit: 'px';
}

function parseWidthPx(raw: string): number {
  const match = raw.trim().match(/^([\d.]+)\s*px$/);
  if (!match) return 0;
  return parseFloat(match[1] ?? '0');
}

/**
 * 测量元素边界 — width/style/color。
 * 规范：UIQ-VISUAL-QUALITY-26 §4
 */
export function measureBorder(ctx: BorderMeasureContext): Measurement<BorderValue | null> {
  const { subjectId, style, factory } = ctx;
  try {
    const value: BorderValue = {
      topWidth: parseWidthPx(style.borderTopWidth),
      rightWidth: parseWidthPx(style.borderRightWidth),
      bottomWidth: parseWidthPx(style.borderBottomWidth),
      leftWidth: parseWidthPx(style.borderLeftWidth),
      topStyle: style.borderTopStyle,
      rightStyle: style.borderRightStyle,
      bottomStyle: style.borderBottomStyle,
      leftStyle: style.borderLeftStyle,
      unit: 'px',
    };
    return factory.create({ subjectId, type: 'surface.border', value });
  } catch {
    return factory.create({ subjectId, type: 'surface.border', value: null, status: 'ERROR' });
  }
}
