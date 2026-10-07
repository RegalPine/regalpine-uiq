import type { Measurement, MeasurementSnapshot, ComponentBoundary } from '@uiq/core';

/**
 * 组件度量分组 — 单个组件内所有度量的集合。
 */
export interface ComponentMetricGroup {
  readonly componentId: string;
  readonly instanceId?: string;
  readonly measurements: readonly Measurement[];
  readonly memberElementIds: readonly string[];
  readonly source: 'EXPLICIT' | 'INFERRED';
}

/**
 * 将度量快照按组件边界分组。
 *
 * 优先级：
 * 1. 显式 ComponentBoundary（来自 data-uiq-component）→ EXPLICIT 分组
 * 2. 无边界信息时 → 返回空 Map（降级为 V1.0 行为）
 *
 * 规范基线：UIQ-CROSS-COMPONENT-VISUAL-CONTINUITY §6.2
 */
export function groupMeasurementsByComponent(
  snapshot: MeasurementSnapshot,
): Map<string, ComponentMetricGroup> {
  const boundaries = snapshot.componentBoundaries;
  if (!boundaries || boundaries.length === 0) {
    return new Map();
  }

  const groups = new Map<string, ComponentMetricGroup>();

  for (const boundary of boundaries) {
    const memberSet = new Set(boundary.memberElementIds);
    const memberMeasurements = snapshot.measurements.filter(
      (m) => memberSet.has(m.subjectId),
    );

    groups.set(boundary.componentId, {
      componentId: boundary.componentId,
      ...(boundary.instanceId !== undefined ? { instanceId: boundary.instanceId } : {}),
      measurements: memberMeasurements,
      memberElementIds: boundary.memberElementIds,
      source: boundary.source,
    });
  }

  return groups;
}

/**
 * 从显式 ComponentBoundary 数组构建分组（供外部直接传入边界时使用）。
 */
export function groupByExplicitBoundaries(
  measurements: readonly Measurement[],
  boundaries: readonly ComponentBoundary[],
): Map<string, ComponentMetricGroup> {
  const groups = new Map<string, ComponentMetricGroup>();

  for (const boundary of boundaries) {
    const memberSet = new Set(boundary.memberElementIds);
    const memberMeasurements = measurements.filter(
      (m) => memberSet.has(m.subjectId),
    );

    groups.set(boundary.componentId, {
      componentId: boundary.componentId,
      ...(boundary.instanceId !== undefined ? { instanceId: boundary.instanceId } : {}),
      measurements: memberMeasurements,
      memberElementIds: boundary.memberElementIds,
      source: boundary.source,
    });
  }

  return groups;
}
