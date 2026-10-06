import type { Measurement } from '@uiq/core';
import type { MeasurementFactory } from '../measurement-factory';

export interface TransitionMeasureContext {
  readonly subjectId: string;
  readonly element: Element;
  readonly style: CSSStyleDeclaration;
  readonly factory: MeasurementFactory;
}

export interface TransitionValue {
  readonly properties: readonly string[];
  readonly durations: readonly number[];
  readonly delays: readonly number[];
  readonly timingFunctions: readonly string[];
  readonly hasTransition: boolean;
}

function parseTransitionList(raw: string): TransitionValue {
  const trimmed = raw.trim();
  if (trimmed === 'none' || trimmed === 'all 0s ease 0s' || trimmed === '') {
    return { properties: [], durations: [], delays: [], timingFunctions: [], hasTransition: false };
  }

  // 简化解析：按逗号分割
  const parts = trimmed.split(',').map((p) => p.trim());
  const properties: string[] = [];
  const durations: number[] = [];
  const delays: number[] = [];
  const timingFunctions: string[] = [];

  for (const part of parts) {
    const tokens = part.split(/\s+/);
    properties.push(tokens[0] ?? 'all');
    durations.push(parseDuration(tokens[1] ?? '0s'));
    timingFunctions.push(tokens[2] ?? 'ease');
    delays.push(parseDuration(tokens[3] ?? '0s'));
  }

  return { properties, durations, delays, timingFunctions, hasTransition: true };
}

function parseDuration(raw: string): number {
  const match = raw.match(/^([\d.]+)(ms|s)?$/);
  if (!match) return 0;
  const value = parseFloat(match[1] ?? '0');
  const unit = match[2];
  return unit === 'ms' ? value : unit === 's' ? value * 1000 : value;
}

/**
 * 测量元素 transition 属性。
 * 规范：UIQ-VISUAL-QUALITY-33 §3
 */
export function captureTransition(
  ctx: TransitionMeasureContext,
): Measurement<TransitionValue | null> {
  const { subjectId, style, factory } = ctx;
  try {
    const value = parseTransitionList(style.transition);
    return factory.create({ subjectId, type: 'motion.transition', value });
  } catch {
    return factory.create({ subjectId, type: 'motion.transition', value: null, status: 'ERROR' });
  }
}
