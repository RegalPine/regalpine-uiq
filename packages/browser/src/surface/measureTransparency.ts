import type { Measurement } from '@uiq/core';
import type { MeasurementFactory } from '../measurement-factory';

export interface TransparencyMeasureContext {
  readonly subjectId: string;
  readonly element: Element;
  readonly style: CSSStyleDeclaration;
  readonly factory: MeasurementFactory;
}

export interface TransparencyValue {
  readonly opacity: number;
  readonly hasBackdropFilter: boolean;
}

/**
 * 测量元素透明度相关属性。
 * 规范：UIQ-VISUAL-QUALITY-26 §6
 */
export function measureTransparency(
  ctx: TransparencyMeasureContext,
): Measurement<TransparencyValue | null> {
  const { subjectId, style, factory } = ctx;
  try {
    const opacity = parseFloat(style.opacity ?? '1');
    const hasBackdropFilter =
      (style.backdropFilter ?? 'none') !== 'none';
    const value: TransparencyValue = { opacity, hasBackdropFilter };
    return factory.create({ subjectId, type: 'surface.transparency', value });
  } catch {
    return factory.create({
      subjectId,
      type: 'surface.transparency',
      value: null,
      status: 'ERROR',
    });
  }
}
