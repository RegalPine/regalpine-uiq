import type { MetricDefinition } from '@uiq/core';
import { detectCycleAndSort } from './graph';
import type { MetricExecutionPlan, MetricReference } from './types';

export function buildExecutionPlan(
  requested: readonly MetricReference[],
  registry: { get(id: string, version: string): MetricDefinition | undefined },
): MetricExecutionPlan {
  const nodes = detectCycleAndSort(requested, registry);
  return { nodes };
}
