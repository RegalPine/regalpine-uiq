import type { MetricDefinition, MetricCalculationContext, MetricResult, Measurement } from '@uiq/core';
import { fingerprint } from '@uiq/core';

export interface MotionTransitionQualityValue { readonly populationSize: number; readonly hasTransition: number; readonly avgDuration: number; }
export interface MotionAnimationTimingValue { readonly populationSize: number; readonly hasAnimation: number; readonly avgDuration: number; }
export interface MotionEasingQualityValue { readonly populationSize: number; readonly distinctEasings: number; readonly dominantEasing: string; }
export interface MotionStateChangeValue { readonly populationSize: number; readonly stateCount: number; readonly hasFeedback: boolean; }
export interface MotionConsistencyValue { readonly populationSize: number; readonly distinctDurations: number; readonly durationVariance: number; }
export interface MotionLoadingQualityValue { readonly populationSize: number; readonly hasLoadingMotion: boolean; readonly avgDuration: number; }
export interface MotionDurationConsistencyValue { readonly populationSize: number; readonly distinctDurations: number; readonly consistency: number; readonly avgDuration: number; }

function collectByType(ctx: MetricCalculationContext, type: string): Measurement[] {
  return ctx.snapshot.measurements.filter((m) => m.type === type && m.status === 'AVAILABLE');
}
function unknownResult(id: string, ver: string, sid: string): MetricResult<never> {
  return { metricId: id, metricVersion: ver, subjectId: sid, status: 'UNKNOWN', dependencies: [], fingerprint: fingerprint({ metricId: id, metricVersion: ver, subjectId: sid, status: 'UNKNOWN' }) };
}

export const MOTION_TRANSITION_QUALITY: MetricDefinition<MotionTransitionQualityValue> = {
  id: 'MOTION.TRANSITION.QUALITY', version: '1.0.0', kind: 'COMPOSITE', dependencies: [],
  calculate(ctx): MetricResult<MotionTransitionQualityValue> {
    const ms = collectByType(ctx, 'motion.transition');
    if (ms.length === 0) return unknownResult(this.id, this.version, ctx.subjectId);
    const values = ms.map((m) => m.value as { hasTransition: boolean; durations: readonly number[] } | null).filter((v): v is NonNullable<typeof v> => v != null);
    const withTransition = values.filter((v) => v.hasTransition);
    const allDurations = withTransition.flatMap((v) => v.durations);
    const avg = allDurations.length > 0 ? allDurations.reduce((s, d) => s + d, 0) / allDurations.length : 0;
    return { metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId, status: 'AVAILABLE', value: { populationSize: values.length, hasTransition: withTransition.length, avgDuration: avg }, dependencies: [], fingerprint: fingerprint({ metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId }) };
  },
};

export const MOTION_ANIMATION_TIMING: MetricDefinition<MotionAnimationTimingValue> = {
  id: 'MOTION.ANIMATION.TIMING', version: '1.0.0', kind: 'COMPOSITE', dependencies: [],
  calculate(ctx): MetricResult<MotionAnimationTimingValue> {
    const ms = collectByType(ctx, 'motion.animation');
    if (ms.length === 0) return unknownResult(this.id, this.version, ctx.subjectId);
    const values = ms.map((m) => m.value as { hasAnimation: boolean; durations: readonly number[] } | null).filter((v): v is NonNullable<typeof v> => v != null);
    const withAnim = values.filter((v) => v.hasAnimation);
    const allDurations = withAnim.flatMap((v) => v.durations);
    const avg = allDurations.length > 0 ? allDurations.reduce((s, d) => s + d, 0) / allDurations.length : 0;
    return { metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId, status: 'AVAILABLE', value: { populationSize: values.length, hasAnimation: withAnim.length, avgDuration: avg }, dependencies: [], fingerprint: fingerprint({ metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId }) };
  },
};

export const MOTION_EASING_QUALITY: MetricDefinition<MotionEasingQualityValue> = {
  id: 'MOTION.EASING.QUALITY', version: '1.0.0', kind: 'COMPOSITE', dependencies: [],
  calculate(ctx): MetricResult<MotionEasingQualityValue> {
    const ms = collectByType(ctx, 'motion.transition');
    if (ms.length === 0) return unknownResult(this.id, this.version, ctx.subjectId);
    const values = ms.map((m) => m.value as { timingFunctions: readonly string[] } | null).filter((v): v is NonNullable<typeof v> => v != null);
    const easings = values.flatMap((v) => v.timingFunctions);
    const freq = new Map<string, number>();
    for (const e of easings) freq.set(e, (freq.get(e) ?? 0) + 1);
    let dominant = 'ease'; let maxCount = 0;
    for (const [e, c] of freq) if (c > maxCount) { dominant = e; maxCount = c; }
    return { metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId, status: 'AVAILABLE', value: { populationSize: values.length, distinctEasings: freq.size, dominantEasing: dominant }, dependencies: [], fingerprint: fingerprint({ metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId }) };
  },
};

export const MOTION_STATE_CHANGE: MetricDefinition<MotionStateChangeValue> = {
  id: 'MOTION.STATE.SMOOTHNESS', version: '1.0.0', kind: 'COMPOSITE', dependencies: [],
  calculate(ctx): MetricResult<MotionStateChangeValue> {
    const ms = collectByType(ctx, 'state.interaction');
    if (ms.length === 0) return unknownResult(this.id, this.version, ctx.subjectId);
    return { metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId, status: 'AVAILABLE', value: { populationSize: ms.length, stateCount: ms.length, hasFeedback: ms.length > 0 }, dependencies: [], fingerprint: fingerprint({ metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId }) };
  },
};

export const MOTION_CONSISTENCY: MetricDefinition<MotionConsistencyValue> = {
  id: 'MOTION.CONSISTENCY', version: '1.0.0', kind: 'COMPOSITE', dependencies: [],
  calculate(ctx): MetricResult<MotionConsistencyValue> {
    const ms = collectByType(ctx, 'motion.transition');
    if (ms.length === 0) return unknownResult(this.id, this.version, ctx.subjectId);
    const values = ms.map((m) => m.value as { durations: readonly number[] } | null).filter((v): v is NonNullable<typeof v> => v != null);
    const allDurations = values.flatMap((v) => v.durations);
    const avg = allDurations.length > 0 ? allDurations.reduce((s, d) => s + d, 0) / allDurations.length : 0;
    const variance = allDurations.length > 0 ? allDurations.reduce((s, d) => s + (d - avg) ** 2, 0) / allDurations.length : 0;
    return { metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId, status: 'AVAILABLE', value: { populationSize: values.length, distinctDurations: new Set(allDurations).size, durationVariance: variance }, dependencies: [], fingerprint: fingerprint({ metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId }) };
  },
};

export const MOTION_LOADING_QUALITY: MetricDefinition<MotionLoadingQualityValue> = {
  id: 'MOTION.LOADING.QUALITY', version: '1.0.0', kind: 'COMPOSITE', dependencies: [],
  calculate(ctx): MetricResult<MotionLoadingQualityValue> {
    const ms = collectByType(ctx, 'motion.animation');
    if (ms.length === 0) return unknownResult(this.id, this.version, ctx.subjectId);
    const values = ms.map((m) => m.value as { hasAnimation: boolean; durations: readonly number[] } | null).filter((v): v is NonNullable<typeof v> => v != null);
    return { metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId, status: 'AVAILABLE', value: { populationSize: values.length, hasLoadingMotion: values.some((v) => v.hasAnimation), avgDuration: 0 }, dependencies: [], fingerprint: fingerprint({ metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId }) };
  },
};

export const MOTION_DURATION_CONSISTENCY: MetricDefinition<MotionDurationConsistencyValue> = {
  id: 'MOTION.DURATION.CONSISTENCY', version: '1.0.0', kind: 'COMPOSITE', dependencies: [],
  calculate(ctx): MetricResult<MotionDurationConsistencyValue> {
    const transitions = collectByType(ctx, 'motion.transition');
    const animations = collectByType(ctx, 'motion.animation');
    const all = [...transitions, ...animations];
    if (all.length === 0) return unknownResult(this.id, this.version, ctx.subjectId);
    const values = all.map((m) => m.value as { durations?: readonly number[] } | null).filter((v): v is NonNullable<typeof v> => v != null);
    const allDurations = values.flatMap((v) => v.durations ?? []);
    const avg = allDurations.length > 0 ? allDurations.reduce((s, d) => s + d, 0) / allDurations.length : 0;
    const distinct = new Set(allDurations).size;
    const consistency = allDurations.length > 0 ? 1 - Math.min(distinct / allDurations.length, 1) : 1;
    return { metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId, status: 'AVAILABLE', value: { populationSize: all.length, distinctDurations: distinct, consistency, avgDuration: avg }, dependencies: [], fingerprint: fingerprint({ metricId: this.id, metricVersion: this.version, subjectId: ctx.subjectId }) };
  },
};

export const motionTextureMetrics: readonly MetricDefinition[] = [
  MOTION_TRANSITION_QUALITY, MOTION_ANIMATION_TIMING, MOTION_EASING_QUALITY,
  MOTION_STATE_CHANGE, MOTION_CONSISTENCY, MOTION_LOADING_QUALITY,
  MOTION_DURATION_CONSISTENCY,
] as const;
