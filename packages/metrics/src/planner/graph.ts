import type { MetricDefinition } from '@uiq/core';
import { MetricDependencyCycleError } from '../errors';
import type { MetricExecutionNode, MetricReference } from './types';

type State = 'UNVISITED' | 'VISITING' | 'VISITED';

function key(id: string, version: string): string {
  return `${id}@${version}`;
}

export function detectCycleAndSort(
  roots: readonly MetricReference[],
  registry: { get(id: string, version: string): MetricDefinition | undefined },
): MetricExecutionNode[] {
  const states = new Map<string, State>();
  const sorted: MetricExecutionNode[] = [];
  const definitions = new Map<string, MetricDefinition>();

  function resolve(ref: MetricReference): MetricDefinition {
    const k = key(ref.metricId, ref.version);
    const existing = definitions.get(k);
    if (existing) return existing;
    const def = registry.get(ref.metricId, ref.version);
    if (!def) {
      throw new Error(`Metric 未注册：${k}`);
    }
    definitions.set(k, def);
    return def;
  }

  function visit(ref: MetricReference, path: string[]): void {
    const k = key(ref.metricId, ref.version);
    const state = states.get(k);
    if (state === 'VISITED') return;
    if (state === 'VISITING') {
      const cycleStart = path.indexOf(k);
      const cycle = cycleStart >= 0 ? [...path.slice(cycleStart), k] : [...path, k];
      throw new MetricDependencyCycleError(cycle);
    }
    states.set(k, 'VISITING');
    path.push(k);
    const def = resolve(ref);
    for (const dep of def.dependencies) {
      visit({ metricId: dep.metricId, version: dep.version }, path);
    }
    path.pop();
    states.set(k, 'VISITED');
    sorted.push({
      metricId: ref.metricId,
      version: ref.version,
      dependencies: def.dependencies.map((d) => ({ metricId: d.metricId, version: d.version })),
    });
  }

  for (const root of roots) {
    visit(root, []);
  }
  return sorted;
}
