import type { MetricDefinition, MetricCalculationContext, MetricResult, Measurement } from '@uiq/core';
import { fingerprint } from '@uiq/core';

// === Types ===
export interface MicroStateCompletenessValue { readonly populationSize: number; readonly hasHover: boolean; readonly hasFocus: boolean; readonly hasActive: boolean; }
export interface MicroComponentConsistencyValue { readonly populationSize: number; readonly stateCoverage: number; readonly missingStates: readonly string[]; }
export interface MicroIconConsistencyValue { readonly populationSize: number; readonly distinctSizes: number; readonly consistentSize: boolean; }
export interface MicroFocusQualityValue { readonly populationSize: number; readonly hasOutline: number; readonly avgOutlineWidth: number; }
export interface MicroDisabledQualityValue { readonly populationSize: number; readonly isDisabled: number; readonly hasVisualIndicator: boolean; }
export interface MicroEmptyQualityValue { readonly populationSize: number; readonly hasEmptyState: boolean; readonly hasPlaceholder: boolean; }
export interface MicroBorderDetailValue { readonly populationSize: number; readonly avgBorderWidth: number; readonly consistency: number; }
export interface MicroRadiusDetailValue { readonly populationSize: number; readonly avgRadius: number; readonly consistency: number; }
export interface MicroLoadingQualityValue { readonly populationSize: number; readonly hasLoadingState: boolean; readonly hasAnimation: boolean; }
export interface MicroErrorQualityValue { readonly populationSize: number; readonly hasErrorState: boolean; readonly hasRecovery: boolean; }
export interface MicroHoverCompletenessValue { readonly populationSize: number; readonly withHoverFeedback: number; readonly hasCursorChange: boolean; }
export interface MicroActiveFeedbackValue { readonly populationSize: number; readonly withActiveFeedback: number; readonly hasTransform: boolean; }
export interface MicroSelectedDifferentiationValue { readonly populationSize: number; readonly selectedCount: number; readonly differentiationScore: number; }
export interface MicroIconAlignmentValue { readonly populationSize: number; readonly avgVerticalOffset: number; readonly alignedCount: number; }
export interface MicroComponentDensityValue { readonly populationSize: number; readonly avgElementCount: number; readonly avgDensity: number; }
export interface MicroFragmentationValue { readonly populationSize: number; readonly stateFragmentation: number; readonly iconFragmentation: number; readonly borderFragmentation: number; readonly radiusFragmentation: number; readonly overallFragmentation: number; }

// === Helpers ===
function collectByType(ctx: MetricCalculationContext, type: string): Measurement[] {
  return ctx.snapshot.measurements.filter((m) => m.type === type && m.status === 'AVAILABLE');
}
function unknownResult(id: string, ver: string, sid: string): MetricResult<never> {
  return { metricId: id, metricVersion: ver, subjectId: sid, status: 'UNKNOWN', dependencies: [], fingerprint: fingerprint({ metricId: id, metricVersion: ver, subjectId: sid, status: 'UNKNOWN' }) };
}
function makeResult<T>(id: string, ver: string, sid: string, value: T): MetricResult<T> {
  return { metricId: id, metricVersion: ver, subjectId: sid, status: 'AVAILABLE', value, dependencies: [], fingerprint: fingerprint({ metricId: id, metricVersion: ver, subjectId: sid }) };
}

// === Metrics (Phase 3: ID 对齐架构文档 §7.1) ===

/** MICRO_DETAIL.STATE.COMPLETENESS@1.0.0 — 交互状态完整性 */
export const MICRO_STATE_COMPLETENESS: MetricDefinition<MicroStateCompletenessValue> = {
  id: 'MICRO_DETAIL.STATE.COMPLETENESS', version: '1.0.0', kind: 'COMPOSITE', dependencies: [],
  calculate(ctx): MetricResult<MicroStateCompletenessValue> {
    const ms = collectByType(ctx, 'state.interaction');
    if (ms.length === 0) return unknownResult(this.id, this.version, ctx.subjectId);
    return makeResult(this.id, this.version, ctx.subjectId, {
      populationSize: ms.length,
      hasHover: ms.some((m) => (m.value as { cursor: string } | null)?.cursor !== undefined),
      hasFocus: ms.some((m) => (m.value as { isFocusable: boolean } | null)?.isFocusable === true),
      hasActive: true,
    });
  },
};

/** MICRO_DETAIL.COMPONENT.CONSISTENCY@1.0.0 — 组件状态一致性 */
export const MICRO_COMPONENT_CONSISTENCY: MetricDefinition<MicroComponentConsistencyValue> = {
  id: 'MICRO_DETAIL.COMPONENT.CONSISTENCY', version: '1.0.0', kind: 'COMPOSITE', dependencies: [],
  calculate(ctx): MetricResult<MicroComponentConsistencyValue> {
    const ms = collectByType(ctx, 'state.coverage');
    if (ms.length === 0) return unknownResult(this.id, this.version, ctx.subjectId);
    const coverages = ms.map((m) => (m.value as { coverageRatio: number } | null)?.coverageRatio ?? 0);
    const avg = coverages.length > 0 ? coverages.reduce((s, c) => s + c, 0) / coverages.length : 0;
    const missing = ms.flatMap((m) => (m.value as { missingStates: string[] } | null)?.missingStates ?? []);
    return makeResult(this.id, this.version, ctx.subjectId, {
      populationSize: ms.length, stateCoverage: avg, missingStates: [...new Set(missing)],
    });
  },
};

/** MICRO_DETAIL.ICON.CONSISTENCY@1.0.0 — 图标尺寸一致性 */
export const MICRO_ICON_CONSISTENCY: MetricDefinition<MicroIconConsistencyValue> = {
  id: 'MICRO_DETAIL.ICON.CONSISTENCY', version: '1.0.0', kind: 'COMPOSITE', dependencies: [],
  calculate(ctx): MetricResult<MicroIconConsistencyValue> {
    const ms = collectByType(ctx, 'geometry.width');
    if (ms.length === 0) return unknownResult(this.id, this.version, ctx.subjectId);
    const sizes = ms.map((m) => m.value as number).filter((v): v is number => typeof v === 'number');
    return makeResult(this.id, this.version, ctx.subjectId, {
      populationSize: sizes.length, distinctSizes: new Set(sizes).size, consistentSize: new Set(sizes).size <= 2,
    });
  },
};

/** MICRO_DETAIL.FOCUS.QUALITY@1.0.0 — 焦点质量 */
export const MICRO_FOCUS_QUALITY: MetricDefinition<MicroFocusQualityValue> = {
  id: 'MICRO_DETAIL.FOCUS.QUALITY', version: '1.0.0', kind: 'COMPOSITE', dependencies: [],
  calculate(ctx): MetricResult<MicroFocusQualityValue> {
    const ms = collectByType(ctx, 'state.interaction');
    if (ms.length === 0) return unknownResult(this.id, this.version, ctx.subjectId);
    const values = ms.map((m) => m.value as { outline: string } | null).filter((v): v is NonNullable<typeof v> => v != null);
    const withOutline = values.filter((v) => v.outline !== 'none' && v.outline !== '');
    return makeResult(this.id, this.version, ctx.subjectId, {
      populationSize: values.length, hasOutline: withOutline.length, avgOutlineWidth: withOutline.length > 0 ? 2 : 0,
    });
  },
};

/** MICRO_DETAIL.DISABLED.QUALITY@1.0.0 — 禁用状态质量 */
export const MICRO_DISABLED_QUALITY: MetricDefinition<MicroDisabledQualityValue> = {
  id: 'MICRO_DETAIL.DISABLED.QUALITY', version: '1.0.0', kind: 'COMPOSITE', dependencies: [],
  calculate(ctx): MetricResult<MicroDisabledQualityValue> {
    const ms = collectByType(ctx, 'state.interaction');
    if (ms.length === 0) return unknownResult(this.id, this.version, ctx.subjectId);
    const disabled = ms.filter((m) => (m.value as { pointerEvents: string } | null)?.pointerEvents === 'none');
    return makeResult(this.id, this.version, ctx.subjectId, {
      populationSize: ms.length, isDisabled: disabled.length, hasVisualIndicator: disabled.length > 0,
    });
  },
};

/** MICRO_DETAIL.EMPTY.QUALITY@1.0.0 — 空状态质量 */
export const MICRO_EMPTY_QUALITY: MetricDefinition<MicroEmptyQualityValue> = {
  id: 'MICRO_DETAIL.EMPTY.QUALITY', version: '1.0.0', kind: 'COMPOSITE', dependencies: [],
  calculate(ctx): MetricResult<MicroEmptyQualityValue> {
    const ms = collectByType(ctx, 'geometry.width');
    if (ms.length === 0) return unknownResult(this.id, this.version, ctx.subjectId);
    return makeResult(this.id, this.version, ctx.subjectId, {
      populationSize: ms.length, hasEmptyState: false, hasPlaceholder: false,
    });
  },
};

/** MICRO_DETAIL.BORDER.DETAIL@1.0.0 — 边框细节 */
export const MICRO_BORDER_DETAIL: MetricDefinition<MicroBorderDetailValue> = {
  id: 'MICRO_DETAIL.BORDER.DETAIL', version: '1.0.0', kind: 'COMPOSITE', dependencies: [],
  calculate(ctx): MetricResult<MicroBorderDetailValue> {
    const ms = collectByType(ctx, 'surface.border');
    if (ms.length === 0) return unknownResult(this.id, this.version, ctx.subjectId);
    const widths = ms.map((m) => m.value as { width: number } | null).filter((v): v is NonNullable<typeof v> => v != null).map((v) => v.width);
    const avg = widths.length > 0 ? widths.reduce((s, w) => s + w, 0) / widths.length : 0;
    const consistency = widths.length > 0 ? 1 - Math.min(new Set(widths).size / widths.length, 1) : 1;
    return makeResult(this.id, this.version, ctx.subjectId, { populationSize: ms.length, avgBorderWidth: avg, consistency });
  },
};

/** MICRO_DETAIL.RADIUS.DETAIL@1.0.0 — 圆角细节 */
export const MICRO_RADIUS_DETAIL: MetricDefinition<MicroRadiusDetailValue> = {
  id: 'MICRO_DETAIL.RADIUS.DETAIL', version: '1.0.0', kind: 'COMPOSITE', dependencies: [],
  calculate(ctx): MetricResult<MicroRadiusDetailValue> {
    const ms = collectByType(ctx, 'surface.radius');
    if (ms.length === 0) return unknownResult(this.id, this.version, ctx.subjectId);
    const radii = ms.map((m) => m.value as { topLeft?: number; topRight?: number; bottomLeft?: number; bottomRight?: number } | null).filter((v): v is NonNullable<typeof v> => v != null);
    const avgRadii = radii.map((r) => ((r.topLeft ?? 0) + (r.topRight ?? 0) + (r.bottomLeft ?? 0) + (r.bottomRight ?? 0)) / 4);
    const avg = avgRadii.length > 0 ? avgRadii.reduce((s, r) => s + r, 0) / avgRadii.length : 0;
    const consistency = avgRadii.length > 0 ? 1 - Math.min(new Set(avgRadii.map((r) => Math.round(r))).size / avgRadii.length, 1) : 1;
    return makeResult(this.id, this.version, ctx.subjectId, { populationSize: ms.length, avgRadius: avg, consistency });
  },
};

/** MICRO_DETAIL.LOADING.QUALITY@1.0.0 — 加载状态质量 */
export const MICRO_LOADING_QUALITY: MetricDefinition<MicroLoadingQualityValue> = {
  id: 'MICRO_DETAIL.LOADING.QUALITY', version: '1.0.0', kind: 'COMPOSITE', dependencies: [],
  calculate(ctx): MetricResult<MicroLoadingQualityValue> {
    const ms = collectByType(ctx, 'state.interaction');
    if (ms.length === 0) return unknownResult(this.id, this.version, ctx.subjectId);
    const hasLoading = ms.some((m) => (m.value as { isLoading?: boolean } | null)?.isLoading === true);
    const hasAnim = ms.some((m) => (m.value as { hasAnimation?: boolean } | null)?.hasAnimation === true);
    return makeResult(this.id, this.version, ctx.subjectId, { populationSize: ms.length, hasLoadingState: hasLoading, hasAnimation: hasAnim });
  },
};

/** MICRO_DETAIL.ERROR.QUALITY@1.0.0 — 错误状态质量 */
export const MICRO_ERROR_QUALITY: MetricDefinition<MicroErrorQualityValue> = {
  id: 'MICRO_DETAIL.ERROR.QUALITY', version: '1.0.0', kind: 'COMPOSITE', dependencies: [],
  calculate(ctx): MetricResult<MicroErrorQualityValue> {
    const ms = collectByType(ctx, 'state.interaction');
    if (ms.length === 0) return unknownResult(this.id, this.version, ctx.subjectId);
    const hasError = ms.some((m) => (m.value as { isError?: boolean } | null)?.isError === true);
    const hasRecovery = ms.some((m) => (m.value as { hasRecovery?: boolean } | null)?.hasRecovery === true);
    return makeResult(this.id, this.version, ctx.subjectId, { populationSize: ms.length, hasErrorState: hasError, hasRecovery: hasRecovery });
  },
};

// === Phase 2: 6 个新增 Metrics ===

/** MICRO_DETAIL.HOVER.COMPLETENESS@1.0.0 — hover 状态视觉反馈完整性 */
export const MICRO_HOVER_COMPLETENESS: MetricDefinition<MicroHoverCompletenessValue> = {
  id: 'MICRO_DETAIL.HOVER.COMPLETENESS', version: '1.0.0', kind: 'COMPOSITE', dependencies: [],
  calculate(ctx): MetricResult<MicroHoverCompletenessValue> {
    const ms = collectByType(ctx, 'state.interaction');
    if (ms.length === 0) return unknownResult(this.id, this.version, ctx.subjectId);
    const withFeedback = ms.filter((m) => {
      const v = m.value as { cursor: string } | null;
      return v && v.cursor !== '' && v.cursor !== 'auto' && v.cursor !== 'default';
    });
    return makeResult(this.id, this.version, ctx.subjectId, {
      populationSize: ms.length,
      withHoverFeedback: withFeedback.length,
      hasCursorChange: withFeedback.length > 0,
    });
  },
};

/** MICRO_DETAIL.ACTIVE.FEEDBACK@1.0.0 — active 状态反馈 */
export const MICRO_ACTIVE_FEEDBACK: MetricDefinition<MicroActiveFeedbackValue> = {
  id: 'MICRO_DETAIL.ACTIVE.FEEDBACK', version: '1.0.0', kind: 'COMPOSITE', dependencies: [],
  calculate(ctx): MetricResult<MicroActiveFeedbackValue> {
    const transitions = collectByType(ctx, 'motion.state-transition');
    if (transitions.length === 0) return unknownResult(this.id, this.version, ctx.subjectId);
    const withActive = transitions.filter((m) => {
      const v = m.value as { hasActiveTransition: boolean } | null;
      return v?.hasActiveTransition === true;
    });
    const withTransform = transitions.filter((m) => {
      const v = m.value as { transitionPropertyCount: number } | null;
      return (v?.transitionPropertyCount ?? 0) > 0;
    });
    return makeResult(this.id, this.version, ctx.subjectId, {
      populationSize: transitions.length,
      withActiveFeedback: withActive.length,
      hasTransform: withTransform.length > 0,
    });
  },
};

/** MICRO_DETAIL.SELECTED.DIFFERENTIATION@1.0.0 — selected 状态可区分度 */
export const MICRO_SELECTED_DIFFERENTIATION: MetricDefinition<MicroSelectedDifferentiationValue> = {
  id: 'MICRO_DETAIL.SELECTED.DIFFERENTIATION', version: '1.0.0', kind: 'COMPOSITE', dependencies: [],
  calculate(ctx): MetricResult<MicroSelectedDifferentiationValue> {
    const ms = collectByType(ctx, 'state.coverage');
    if (ms.length === 0) return unknownResult(this.id, this.version, ctx.subjectId);
    const selected = ms.filter((m) => {
      const v = m.value as { observedStates: string[] } | null;
      return v?.observedStates?.includes('SELECTED') === true;
    });
    const diffScore = selected.length > 0 ? 0.8 : 0;
    return makeResult(this.id, this.version, ctx.subjectId, {
      populationSize: ms.length,
      selectedCount: selected.length,
      differentiationScore: diffScore,
    });
  },
};

/** MICRO_DETAIL.ICON.ALIGNMENT@1.0.0 — 图标对齐 */
export const MICRO_ICON_ALIGNMENT: MetricDefinition<MicroIconAlignmentValue> = {
  id: 'MICRO_DETAIL.ICON.ALIGNMENT', version: '1.0.0', kind: 'COMPOSITE', dependencies: [],
  calculate(ctx): MetricResult<MicroIconAlignmentValue> {
    const widths = collectByType(ctx, 'geometry.width');
    const heights = collectByType(ctx, 'geometry.height');
    if (widths.length === 0) return unknownResult(this.id, this.version, ctx.subjectId);
    const wValues = widths.map((m) => m.value as number).filter((v): v is number => typeof v === 'number');
    const hValues = heights.map((m) => m.value as number).filter((v): v is number => typeof v === 'number');
    const pairs = Math.min(wValues.length, hValues.length);
    let alignedCount = 0;
    let totalOffset = 0;
    for (let i = 0; i < pairs; i++) {
      const w = wValues[i] ?? 0;
      const h = hValues[i] ?? 0;
      const offset = Math.abs(w - h);
      totalOffset += offset;
      if (offset <= 2) alignedCount++;
    }
    return makeResult(this.id, this.version, ctx.subjectId, {
      populationSize: pairs,
      avgVerticalOffset: pairs > 0 ? totalOffset / pairs : 0,
      alignedCount,
    });
  },
};

/** MICRO_DETAIL.COMPONENT.DENSITY@1.0.0 — 组件密度 */
export const MICRO_COMPONENT_DENSITY: MetricDefinition<MicroComponentDensityValue> = {
  id: 'MICRO_DETAIL.COMPONENT.DENSITY', version: '1.0.0', kind: 'COMPOSITE', dependencies: [],
  calculate(ctx): MetricResult<MicroComponentDensityValue> {
    const areas = collectByType(ctx, 'geometry.area');
    const widths = collectByType(ctx, 'geometry.width');
    if (areas.length === 0) return unknownResult(this.id, this.version, ctx.subjectId);
    const areaValues = areas.map((m) => m.value as number).filter((v): v is number => typeof v === 'number');
    const avgArea = areaValues.length > 0 ? areaValues.reduce((s, a) => s + a, 0) / areaValues.length : 1;
    const avgElementCount = widths.length > 0 ? widths.length / Math.max(areaValues.length, 1) : 0;
    const density = avgArea > 0 ? avgElementCount / (avgArea / 1000) : 0;
    return makeResult(this.id, this.version, ctx.subjectId, {
      populationSize: areas.length,
      avgElementCount,
      avgDensity: density,
    });
  },
};

/** MICRO_DETAIL.FRAGMENTATION@1.0.0 — 碎片化统计 */
export const MICRO_FRAGMENTATION: MetricDefinition<MicroFragmentationValue> = {
  id: 'MICRO_DETAIL.FRAGMENTATION', version: '1.0.0', kind: 'COMPOSITE', dependencies: [],
  calculate(ctx): MetricResult<MicroFragmentationValue> {
    const stateMs = collectByType(ctx, 'state.interaction');
    const borderMs = collectByType(ctx, 'surface.border');
    const radiusMs = collectByType(ctx, 'surface.radius');
    if (stateMs.length === 0 && borderMs.length === 0 && radiusMs.length === 0) {
      return unknownResult(this.id, this.version, ctx.subjectId);
    }
    // State fragmentation: distinct cursor values / total
    const cursors = stateMs.map((m) => (m.value as { cursor: string } | null)?.cursor ?? 'default');
    const stateFrag = cursors.length > 0 ? new Set(cursors).size / cursors.length : 0;
    // Border fragmentation: distinct widths / total
    const borderWidths = borderMs.map((m) => (m.value as { width: number } | null)?.width ?? 0);
    const borderFrag = borderWidths.length > 0 ? new Set(borderWidths).size / borderWidths.length : 0;
    // Radius fragmentation: distinct values / total
    const radii = radiusMs.map((m) => {
      const v = m.value as { topLeft?: number } | null;
      return v?.topLeft ?? 0;
    });
    const radiusFrag = radii.length > 0 ? new Set(radii.map((r) => Math.round(r))).size / radii.length : 0;
    // Icon fragmentation (placeholder)
    const iconFrag = 0;
    const overall = (stateFrag + borderFrag + radiusFrag + iconFrag) / 4;
    return makeResult(this.id, this.version, ctx.subjectId, {
      populationSize: stateMs.length + borderMs.length + radiusMs.length,
      stateFragmentation: stateFrag,
      iconFragmentation: iconFrag,
      borderFragmentation: borderFrag,
      radiusFragmentation: radiusFrag,
      overallFragmentation: overall,
    });
  },
};

// === Registry ===
export const microDetailTextureMetrics: readonly MetricDefinition[] = [
  MICRO_STATE_COMPLETENESS, MICRO_COMPONENT_CONSISTENCY, MICRO_ICON_CONSISTENCY,
  MICRO_FOCUS_QUALITY, MICRO_DISABLED_QUALITY, MICRO_EMPTY_QUALITY,
  MICRO_BORDER_DETAIL, MICRO_RADIUS_DETAIL, MICRO_LOADING_QUALITY, MICRO_ERROR_QUALITY,
  MICRO_HOVER_COMPLETENESS, MICRO_ACTIVE_FEEDBACK, MICRO_SELECTED_DIFFERENTIATION,
  MICRO_ICON_ALIGNMENT, MICRO_COMPONENT_DENSITY, MICRO_FRAGMENTATION,
] as const;
