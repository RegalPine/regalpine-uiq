import type { Measurement } from '@uiq/core';
import type { MeasurementFactory } from '../measurement-factory';

export interface RadiusMeasureContext {
  readonly subjectId: string;
  readonly element: Element;
  readonly style: CSSStyleDeclaration;
  readonly factory: MeasurementFactory;
}

export interface RadiusValue {
  readonly topLeft: number;
  readonly topRight: number;
  readonly bottomRight: number;
  readonly bottomLeft: number;
  readonly unit: 'px';
}

function parseRadiusPx(raw: string): number {
  const match = raw.trim().match(/^([\d.]+)\s*(px|%)?$/);
  if (!match) return 0;
  return parseFloat(match[1] ?? '0');
}

/**
 * 测量元素圆角 — 读取四角 radius 值（px 归一化）。
 * 规范：UIQ-VISUAL-QUALITY-26 §3
 */
export function measureRadius(ctx: RadiusMeasureContext): Measurement<RadiusValue | null> {
  const { subjectId, style, factory } = ctx;
  try {
    const topLeft = parseRadiusPx(style.borderTopLeftRadius);
    const topRight = parseRadiusPx(style.borderTopRightRadius);
    const bottomRight = parseRadiusPx(style.borderBottomRightRadius);
    const bottomLeft = parseRadiusPx(style.borderBottomLeftRadius);
    const value: RadiusValue = { topLeft, topRight, bottomRight, bottomLeft, unit: 'px' };
    return factory.create({ subjectId, type: 'surface.radius', value });
  } catch {
    return factory.create({ subjectId, type: 'surface.radius', value: null, status: 'ERROR' });
  }
}
