import type { Measurement } from '@uiq/core';
import type { MeasurementFactory } from '../measurement-factory';

export interface AnimationMeasureContext {
  readonly subjectId: string;
  readonly element: Element;
  readonly style: CSSStyleDeclaration;
  readonly factory: MeasurementFactory;
}

export interface AnimationValue {
  readonly names: readonly string[];
  readonly durations: readonly number[];
  readonly timingFunctions: readonly string[];
  readonly iterationCounts: readonly string[];
  readonly hasAnimation: boolean;
}

function parseDuration(raw: string): number {
  const match = raw.trim().match(/^([\d.]+)(ms|s)?$/);
  if (!match) return 0;
  const value = parseFloat(match[1] ?? '0');
  const unit = match[2];
  return unit === 'ms' ? value : unit === 's' ? value * 1000 : value;
}

function parseAnimationList(raw: string): AnimationValue {
  const trimmed = raw.trim();
  if (trimmed === 'none' || trimmed === '') {
    return { names: [], durations: [], timingFunctions: [], iterationCounts: [], hasAnimation: false };
  }

  const parts = trimmed.split(',').map((p) => p.trim());
  const names: string[] = [];
  const durations: number[] = [];
  const timingFunctions: string[] = [];
  const iterationCounts: string[] = [];

  for (const part of parts) {
    const tokens = part.split(/\s+/);
    names.push(tokens[0] ?? 'none');
    durations.push(parseDuration(tokens[1] ?? '0s'));
    timingFunctions.push(tokens[2] ?? 'ease');
    iterationCounts.push(tokens[3] ?? '1');
  }

  return { names, durations, timingFunctions, iterationCounts, hasAnimation: true };
}

/**
 * 测量元素 animation 属性。
 * 规范：UIQ-VISUAL-QUALITY-33 §4
 */
export function captureAnimation(
  ctx: AnimationMeasureContext,
): Measurement<AnimationValue | null> {
  const { subjectId, style, factory } = ctx;
  try {
    const value = parseAnimationList(style.animation);
    return factory.create({ subjectId, type: 'motion.animation', value });
  } catch {
    return factory.create({ subjectId, type: 'motion.animation', value: null, status: 'ERROR' });
  }
}
