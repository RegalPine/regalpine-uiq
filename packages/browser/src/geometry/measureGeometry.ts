import type { Measurement } from '@uiq/core';
import type { MeasurementFactory } from '../measurement-factory';
import { rectMeasurements } from './measureRect';

export interface GeometryMeasureContext {
  readonly subjectId: string;
  readonly element: Element;
  readonly style: CSSStyleDeclaration;
  readonly factory: MeasurementFactory;
}

/**
 * IMPL-07 §34-39：getBoundingClientRect → geometry.x/y/width/height。
 * viewport-relative 坐标（§35）；`display: none` 必须记录在 metadata，
 * 避免 0×0 被误认为真实视觉尺寸（§39）；visibility/opacity 只记录不判定（§38/§40）。
 */
export function measureGeometry(ctx: GeometryMeasureContext): readonly Measurement<unknown>[] {
  const { subjectId, element, style, factory } = ctx;
  const rect = element.getBoundingClientRect();
  const extraMetadata: Record<string, unknown> = {
    display: style.display,
    visibility: style.visibility,
    opacity: style.opacity,
  };
  return rectMeasurements(subjectId, rect, factory, extraMetadata);
}
