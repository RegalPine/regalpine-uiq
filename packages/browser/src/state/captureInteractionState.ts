import type { Measurement } from '@uiq/core';
import type { MeasurementFactory } from '../measurement-factory';

export interface InteractionStateMeasureContext {
  readonly subjectId: string;
  readonly element: Element;
  readonly style: CSSStyleDeclaration;
  readonly factory: MeasurementFactory;
}

export interface InteractionStateValue {
  readonly cursor: string;
  readonly outline: string;
  readonly outlineOffset: string;
  readonly userSelect: string;
  readonly pointerEvents: string;
  readonly isFocusable: boolean;
}

/**
 * 测量元素交互状态相关属性。
 * 规范：UIQ-VISUAL-QUALITY-34 §3
 */
export function captureInteractionState(
  ctx: InteractionStateMeasureContext,
): Measurement<InteractionStateValue | null> {
  const { subjectId, style, element, factory } = ctx;
  try {
    const isFocusable =
      element.hasAttribute('tabindex') ||
      ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName);
    const value: InteractionStateValue = {
      cursor: style.cursor,
      outline: style.outline,
      outlineOffset: style.outlineOffset,
      userSelect: style.userSelect,
      pointerEvents: style.pointerEvents,
      isFocusable,
    };
    return factory.create({ subjectId, type: 'state.interaction', value });
  } catch {
    return factory.create({ subjectId, type: 'state.interaction', value: null, status: 'ERROR' });
  }
}
