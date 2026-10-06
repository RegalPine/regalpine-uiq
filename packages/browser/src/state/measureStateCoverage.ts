import type { Measurement } from '@uiq/core';
import type { MeasurementFactory } from '../measurement-factory';

export interface StateCoverageMeasureContext {
  readonly subjectId: string;
  readonly element: Element;
  readonly style: CSSStyleDeclaration;
  readonly factory: MeasurementFactory;
}

/**
 * 组件交互状态的完整枚举。
 * 规范：UIQ-VISUAL-QUALITY-34 §3
 */
export const REQUIRED_INTERACTION_STATES = [
  'DEFAULT',
  'HOVER',
  'FOCUS',
  'FOCUS_VISIBLE',
  'ACTIVE',
  'SELECTED',
  'DISABLED',
  'LOADING',
  'ERROR',
  'SUCCESS',
  'EMPTY',
] as const;

export type InteractionStateName = (typeof REQUIRED_INTERACTION_STATES)[number];

export interface StateCoverageValue {
  readonly requiredStates: readonly string[];
  readonly observedStates: readonly string[];
  readonly missingStates: readonly string[];
  readonly coverageRatio: number;
  readonly isInteractive: boolean;
}

/**
 * 测量元素的交互状态覆盖率。
 *
 * 对比 required states vs observed states，输出缺失状态列表。
 * 基于元素当前可见的 CSS 属性推断已实现的状态。
 *
 * 规范：UIQ-VISUAL-QUALITY-34 §4
 */
export function measureStateCoverage(
  ctx: StateCoverageMeasureContext,
): Measurement<StateCoverageValue | null> {
  const { subjectId, element, style, factory } = ctx;
  try {
    const isInteractive =
      element.hasAttribute('tabindex') ||
      ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName) ||
      element.hasAttribute('role');

    if (!isInteractive) {
      return factory.create({
        subjectId,
        type: 'state.coverage',
        value: {
          requiredStates: [],
          observedStates: ['DEFAULT'],
          missingStates: [],
          coverageRatio: 1,
          isInteractive: false,
        },
      });
    }

    const observedStates: string[] = ['DEFAULT'];
    const cursor = style.cursor;
    const outline = style.outline;
    const opacity = parseFloat(style.opacity);
    const pointerEvents = style.pointerEvents;

    // 推断 HOVER: cursor 非 default 或有 transition 涉及背景/颜色
    if (cursor !== '' && cursor !== 'auto' && cursor !== 'default') {
      observedStates.push('HOVER');
    }

    // 推断 FOCUS: outline 非 none
    if (outline !== '' && outline !== 'none') {
      observedStates.push('FOCUS');
      observedStates.push('FOCUS_VISIBLE');
    }

    // 推断 DISABLED: opacity < 1 或 pointerEvents === 'none' 或 disabled 属性
    if (
      element.hasAttribute('disabled') ||
      pointerEvents === 'none' ||
      (!Number.isNaN(opacity) && opacity < 0.7)
    ) {
      observedStates.push('DISABLED');
    }

    // 推断 SELECTED: aria-pressed / aria-selected / checked
    if (
      element.getAttribute('aria-pressed') === 'true' ||
      element.getAttribute('aria-selected') === 'true' ||
      (element as HTMLInputElement).checked === true
    ) {
      observedStates.push('SELECTED');
    }

    // 推断 LOADING: aria-busy
    if (element.getAttribute('aria-busy') === 'true') {
      observedStates.push('LOADING');
    }

    // 推断 ERROR: aria-invalid
    if (element.getAttribute('aria-invalid') === 'true') {
      observedStates.push('ERROR');
    }

    const requiredStates = ['DEFAULT', 'HOVER', 'FOCUS', 'DISABLED'];
    const missingStates = requiredStates.filter((s) => !observedStates.includes(s));
    const coverageRatio = requiredStates.length > 0
      ? (requiredStates.length - missingStates.length) / requiredStates.length
      : 1;

    return factory.create({
      subjectId,
      type: 'state.coverage',
      value: {
        requiredStates,
        observedStates,
        missingStates,
        coverageRatio,
        isInteractive: true,
      },
    });
  } catch {
    return factory.create({ subjectId, type: 'state.coverage', value: null, status: 'ERROR' });
  }
}
