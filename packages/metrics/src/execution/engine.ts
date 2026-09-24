import type {
  MetricDefinition,
  MetricRegistry,
  MetricResult,
  MetricCalculationContext,
  MeasurementSnapshot,
  EngineInfo,
} from '@uiq/core';
import { buildExecutionPlan } from '../planner/plan';
import type { MetricReference as PlannerRef } from '../planner/types';
import { InMemoryMetricCache } from '../cache/memory';
import type { MetricCache, MetricCacheKey } from '../cache/types';
import { metricFingerprint } from '../fingerprint/metric-fingerprint';
import { MetricNotFoundError, MetricExecutionError } from '../errors';
import type {
  MetricExecutionRequest,
  MetricExecutionReport,
  MetricExecutionMetadata,
} from './types';

export interface MetricExecutionEngineOptions {
  readonly engine: EngineInfo;
  readonly registry: MetricRegistry;
  readonly cache?: MetricCache;
}

export class MetricExecutionEngine {
  private readonly engineInfo: EngineInfo;
  private readonly registry: MetricRegistry;
  private readonly cache: MetricCache;

  constructor(options: MetricExecutionEngineOptions) {
    this.engineInfo = options.engine;
    this.registry = options.registry;
    this.cache = options.cache ?? new InMemoryMetricCache();
  }

  execute(snapshot: MeasurementSnapshot, request: MetricExecutionRequest): MetricExecutionReport {
    const startedAt = Date.now();

    // P8 前置修复（P2-03/05）：校验请求 snapshotId 与实参一致
    if (request.snapshotId !== snapshot.id) {
      throw new MetricExecutionError(
        request.metrics[0]?.id ?? '',
        request.metrics[0]?.version ?? '',
        '',
        `snapshotId 不匹配：请求 ${request.snapshotId}，实际 ${snapshot.id}`,
      );
    }

    const requestedMetrics = request.subjects.length * request.metrics.length;

    const plannerRefs: PlannerRef[] = request.metrics.map((m) => ({
      metricId: m.id,
      version: m.version,
    }));

    for (const ref of plannerRefs) {
      if (!this.registry.has(ref.metricId, ref.version)) {
        throw new MetricNotFoundError(ref.metricId, ref.version);
      }
    }

    const plan = buildExecutionPlan(plannerRefs, this.registry);
    const results: MetricResult[] = [];
    let executedCount = 0;
    let cachedCount = 0;

    for (const subjectId of request.subjects) {
      const subjectResults = new Map<string, MetricResult>();

      for (const node of plan.nodes) {
        const cacheKey: MetricCacheKey = {
          snapshotId: request.snapshotId,
          subjectId,
          metricId: node.metricId,
          metricVersion: node.version,
          // P8 前置修复（P2-03/05）：配置感知缓存键
          ...(request.contentFingerprint !== undefined
            ? { contentFingerprint: request.contentFingerprint }
            : {}),
          ...(request.configHash !== undefined ? { configHash: request.configHash } : {}),
        };

        const cached = this.cache.get(cacheKey);
        if (cached) {
          cachedCount++;
          subjectResults.set(`${node.metricId}@${node.version}`, cached);
          results.push(cached);
          continue;
        }

        const def = this.registry.get(node.metricId, node.version)!;
        const depMap = new Map<string, MetricResult>();
        for (const dep of node.dependencies) {
          const depKey = `${dep.metricId}@${dep.version}`;
          const depResult = subjectResults.get(depKey);
          if (depResult) {
            depMap.set(depKey, depResult);
          }
        }

        const result = this.safeExecute(def, subjectId, snapshot, depMap);
        executedCount++;
        subjectResults.set(`${node.metricId}@${node.version}`, result);
        this.cache.set(cacheKey, result);
        results.push(result);
      }
    }

    results.sort((a, b) => {
      const subjectCmp = a.subjectId.localeCompare(b.subjectId);
      if (subjectCmp !== 0) return subjectCmp;
      const metricCmp = a.metricId.localeCompare(b.metricId);
      if (metricCmp !== 0) return metricCmp;
      return a.metricVersion.localeCompare(b.metricVersion);
    });

    const completedAt = Date.now();
    const available = results.filter((r) => r.status === 'AVAILABLE').length;
    const unknown = results.filter((r) => r.status === 'UNKNOWN').length;
    const errors = results.filter((r) => r.status === 'ERROR').length;

    const execution: MetricExecutionMetadata = {
      engine: this.engineInfo,
      startedAt: new Date(startedAt).toISOString(),
      completedAt: new Date(completedAt).toISOString(),
      durationMs: completedAt - startedAt,
      requestedMetrics,
      executedMetrics: executedCount,
      cachedMetrics: cachedCount,
      availableMetrics: available,
      unknownMetrics: unknown,
      errorMetrics: errors,
    };

    return {
      snapshotId: request.snapshotId,
      results,
      execution,
    };
  }

  private safeExecute(
    def: MetricDefinition,
    subjectId: string,
    snapshot: MeasurementSnapshot,
    dependencies: Map<string, MetricResult>,
  ): MetricResult {
    const context: MetricCalculationContext = { subjectId, snapshot, dependencies };

    // P8 前置修复（P2-03/05）：版本化依赖 trace
    const executionTrace = {
      schemaVersion: '1.1.0',
      snapshotId: snapshot.id,
      dependencyStates: Object.fromEntries(
        [...dependencies.entries()].map(([key, dep]) => [key, dep.status]),
      ),
      sourceMeasurementIds: snapshot.measurements
        .filter((m) => m.subjectId === subjectId)
        .map((m) => m.id),
    };

    try {
      const raw = def.calculate(context);
      const mergedMetadata = {
        ...(raw.metadata ?? {}),
        executionTrace,
      };
      const result: MetricResult = {
        metricId: def.id,
        metricVersion: def.version,
        subjectId,
        status: raw.status,
        dependencies: def.dependencies.map((d) => ({
          metricId: d.metricId,
          version: d.version,
          required: d.required,
        })),
        fingerprint: '',
        ...(raw.value !== undefined ? { value: raw.value } : {}),
        ...(raw.unit !== undefined ? { unit: raw.unit } : {}),
        metadata: mergedMetadata,
      };
      return { ...result, fingerprint: metricFingerprint(result) };
    } catch (cause) {
      const errorResult: MetricResult = {
        metricId: def.id,
        metricVersion: def.version,
        subjectId,
        status: 'ERROR',
        dependencies: def.dependencies.map((d) => ({
          metricId: d.metricId,
          version: d.version,
          required: d.required,
        })),
        fingerprint: '',
        metadata: {
          errorType: cause instanceof Error ? cause.constructor.name : 'Unknown',
          message: cause instanceof Error ? cause.message : String(cause),
          executionTrace,
        },
      };
      return { ...errorResult, fingerprint: metricFingerprint(errorResult) };
    }
  }
}
