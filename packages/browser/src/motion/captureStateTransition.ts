import type { Measurement } from '@uiq/core';
import type { MeasurementFactory } from '../measurement-factory';

export interface StateTransitionMeasureContext {
  readonly subjectId: string;
  readonly element: Element;
  readonly style: CSSStyleDeclaration;
  readonly factory: MeasurementFactory;
}

export interface StateTransitionValue {
  readonly hasHoverTransition: boolean;
  readonly hasFocusTransition: boolean;
  readonly hasActiveTransition: boolean;
  readonly hoverDuration: number;
  readonly focusDuration: number;
  readonly activeDuration: number;
  readonly hoverEasing: string;
  readonly focusEasing: string;
  readonly activeEasing: string;
  readonly transitionPropertyCount: number;
}

function parseDuration(raw: string): number {
  const match = raw.trim().match(/^([\d.]+)(ms|s)?$/);
  if (!match) return 0;
  const value = parseFloat(match[1] ?? '0');
  const unit = match[2];
  return unit === 'ms' ? value : unit === 's' ? value * 1000 : value;
}

/**
 * 捕获元素在 hover/focus/active 状态切换时的 transition 特征。
 *
 * 通过检查元素当前 computed style 的 transition 属性，
 * 判断是否存在针对交互状态的过渡效果。
 *
 * 规范：UIQ-VISUAL-QUALITY-33 §5
 */
export function captureStateTransition(
  ctx: StateTransitionMeasureContext,
): Measurement<StateTransitionValue | null> {
  const { subjectId, style, factory } = ctx;
  try {
    const transition = style.transition.trim();
    const hasTransition = transition !== '' && transition !== 'none' && transition !== 'all 0s ease 0s';

    if (!hasTransition) {
      return factory.create({
        subjectId,
        type: 'motion.state-transition',
        value: {
          hasHoverTransition: false,
          hasFocusTransition: false,
          hasActiveTransition: false,
          hoverDuration: 0,
          focusDuration: 0,
          activeDuration: 0,
          hoverEasing: 'ease',
          focusEasing: 'ease',
          activeEasing: 'ease',
          transitionPropertyCount: 0,
        },
      });
    }

    const parts = transition.split(',').map((p) => p.trim());
    const stateProperties = ['background', 'background-color', 'color', 'border', 'border-color',
      'box-shadow', 'opacity', 'transform', 'outline', 'outline-offset'];

    let hoverDuration = 0;
    let focusDuration = 0;
    let activeDuration = 0;
    let hoverEasing = 'ease';
    let focusEasing = 'ease';
    let activeEasing = 'ease';
    let statePropCount = 0;

    for (const part of parts) {
      const tokens = part.split(/\s+/);
      const prop = tokens[0] ?? 'all';
      const dur = parseDuration(tokens[1] ?? '0s');
      const easing = tokens[2] ?? 'ease';

      if (prop === 'all' || stateProperties.includes(prop)) {
        statePropCount++;
        if (hoverDuration === 0) { hoverDuration = dur; hoverEasing = easing; }
        if (focusDuration === 0) { focusDuration = dur; focusEasing = easing; }
        if (activeDuration === 0) { activeDuration = dur; activeEasing = easing; }
      }
    }

    return factory.create({
      subjectId,
      type: 'motion.state-transition',
      value: {
        hasHoverTransition: statePropCount > 0,
        hasFocusTransition: statePropCount > 0,
        hasActiveTransition: statePropCount > 0,
        hoverDuration,
        focusDuration,
        activeDuration,
        hoverEasing,
        focusEasing,
        activeEasing,
        transitionPropertyCount: statePropCount,
      },
    });
  } catch {
    return factory.create({ subjectId, type: 'motion.state-transition', value: null, status: 'ERROR' });
  }
}
