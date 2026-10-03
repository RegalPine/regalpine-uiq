import type { Measurement } from '@uiq/core';
import type { MeasurementFactory } from '../measurement-factory';

export interface LayerMeasureContext {
  readonly subjectId: string;
  readonly element: Element;
  readonly style: CSSStyleDeclaration;
  readonly factory: MeasurementFactory;
}

export interface LayerValue {
  readonly zIndex: number | 'auto';
  readonly position: string;
  readonly createsStackingContext: boolean;
}

/**
 * 测量元素层叠属性。
 * 规范：UIQ-VISUAL-QUALITY-26 §7
 */
export function measureLayer(ctx: LayerMeasureContext): Measurement<LayerValue | null> {
  const { subjectId, style, factory } = ctx;
  try {
    const zIndexRaw = style.zIndex;
    const zIndex: number | 'auto' = zIndexRaw === 'auto' ? 'auto' : parseInt(zIndexRaw, 10);
    const position = style.position;
    // 简化判断：position 非 static + zIndex 非 auto 创建层叠上下文
    const createsStackingContext =
      position !== 'static' && zIndex !== 'auto' && !Number.isNaN(zIndex as number);
    const value: LayerValue = { zIndex, position, createsStackingContext };
    return factory.create({ subjectId, type: 'surface.layer', value });
  } catch {
    return factory.create({ subjectId, type: 'surface.layer', value: null, status: 'ERROR' });
  }
}
