import { describe, expect, it } from 'vitest';
import {
  MetricExecutionEngine,
  InMemoryMetricCache,
  createDefaultMetricRegistry,
} from '@uiq/metrics';
import { SnapshotBuilder } from '@uiq/measurement';
import type { EngineInfo } from '@uiq/core';

const engineInfo: EngineInfo = { name: 'e2e-engine', version: '1.0.0' };
const source = { type: 'STATIC' as const };

describe('E2E: 完整 Metric 管线', () => {
  it('构建快照 → 注册指标 → 执行 → 指纹确定性', () => {
    // 1. 构建快照
    const builder = new SnapshotBuilder({ snapshotId: 'e2e-snap', source });
    builder.setCapturedAt(1000);
    builder.addRaw({
      subjectId: 'btn',
      type: 'color.srgb',
      value: { r: 0, g: 0, b: 0, alpha: 1 },
      status: 'AVAILABLE',
      timestamp: 1000,
    });
    builder.addRaw({
      subjectId: 'btn',
      type: 'color.srgb.background',
      value: { r: 1, g: 1, b: 1, alpha: 1 },
      status: 'AVAILABLE',
      timestamp: 1000,
    });
    builder.addRaw({
      subjectId: 'btn',
      type: 'typography.font-size',
      value: 14,
      status: 'AVAILABLE',
      timestamp: 1000,
    });
    builder.addRaw({
      subjectId: 'btn',
      type: 'typography.font-weight',
      value: 'bold',
      status: 'AVAILABLE',
      timestamp: 1000,
    });
    builder.addRaw({
      subjectId: 'btn',
      type: 'geometry.width',
      value: 120,
      status: 'AVAILABLE',
      timestamp: 1000,
    });
    builder.addRaw({
      subjectId: 'btn',
      type: 'geometry.height',
      value: 40,
      status: 'AVAILABLE',
      timestamp: 1000,
    });
    const snapshot = builder.build();

    // 2. 注册指标
    const registry = createDefaultMetricRegistry();

    // 3. 执行
    const cache = new InMemoryMetricCache();
    const engine = new MetricExecutionEngine({ engine: engineInfo, registry, cache });
    const request = {
      snapshotId: 'e2e-snap',
      subjects: ['btn'],
      metrics: [
        { id: 'COLOR.SRGB', version: '1.0.0' },
        { id: 'COLOR.CONTRAST', version: '1.0.0' },
        { id: 'TYPOGRAPHY.FONT_SIZE', version: '1.0.0' },
        { id: 'TYPOGRAPHY.FONT_WEIGHT', version: '1.0.0' },
        { id: 'GEOMETRY.WIDTH', version: '1.0.0' },
        { id: 'GEOMETRY.HEIGHT', version: '1.0.0' },
        { id: 'GEOMETRY.AREA', version: '1.0.0' },
        { id: 'GEOMETRY.ASPECT_RATIO', version: '1.0.0' },
      ],
    };

    const report1 = engine.execute(snapshot, request);

    // 4. 验证结果
    expect(report1.results.length).toBeGreaterThan(0);
    for (const result of report1.results) {
      expect(result.fingerprint).toBeTruthy();
      expect(result.metricId).toBeTruthy();
      expect(result.metricVersion).toBe('1.0.0');
      expect(result.subjectId).toBe('btn');
    }

    // 5. 指纹确定性：再次执行应完全一致
    const engine2 = new MetricExecutionEngine({ engine: engineInfo, registry });
    const report2 = engine2.execute(snapshot, request);

    expect(report1.results.length).toBe(report2.results.length);
    for (let i = 0; i < report1.results.length; i++) {
      expect(report1.results[i]!.fingerprint).toBe(report2.results[i]!.fingerprint);
    }

    // 6. 缓存命中：第二次使用同一引擎应减少执行
    const report3 = engine.execute(snapshot, request);
    expect(report3.execution.cachedMetrics).toBeGreaterThan(0);
  });

  it('不同快照缓存键不同', () => {
    const registry = createDefaultMetricRegistry();
    const cache = new InMemoryMetricCache();
    const engine = new MetricExecutionEngine({ engine: engineInfo, registry, cache });

    const snap1 = {
      id: 'snap-A',
      capturedAt: 1000,
      source,
      measurements: [
        {
          id: 'm1',
          subjectId: 'e1',
          type: 'geometry.width',
          value: 100,
          status: 'AVAILABLE' as const,
          source,
          timestamp: 1000,
        },
        {
          id: 'm2',
          subjectId: 'e1',
          type: 'geometry.height',
          value: 50,
          status: 'AVAILABLE' as const,
          source,
          timestamp: 1000,
        },
      ],
    };
    const snap2 = {
      id: 'snap-B',
      capturedAt: 2000,
      source,
      measurements: [
        {
          id: 'm3',
          subjectId: 'e1',
          type: 'geometry.width',
          value: 200,
          status: 'AVAILABLE' as const,
          source,
          timestamp: 2000,
        },
        {
          id: 'm4',
          subjectId: 'e1',
          type: 'geometry.height',
          value: 100,
          status: 'AVAILABLE' as const,
          source,
          timestamp: 2000,
        },
      ],
    };

    engine.execute(snap1, {
      snapshotId: 'snap-A',
      subjects: ['e1'],
      metrics: [{ id: 'GEOMETRY.WIDTH', version: '1.0.0' }],
    });
    engine.execute(snap2, {
      snapshotId: 'snap-B',
      subjects: ['e1'],
      metrics: [{ id: 'GEOMETRY.WIDTH', version: '1.0.0' }],
    });

    // 两个快照的缓存键不同，所以缓存 size 应为 2
    expect(cache.size).toBe(2);
  });

  it('排序输出稳定性', () => {
    const registry = createDefaultMetricRegistry();
    const engine = new MetricExecutionEngine({ engine: engineInfo, registry });
    const snapshot = {
      id: 'snap-sort',
      capturedAt: 1000,
      source,
      measurements: [
        {
          id: 'm1',
          subjectId: 'b',
          type: 'geometry.width',
          value: 10,
          status: 'AVAILABLE' as const,
          source,
          timestamp: 1000,
        },
        {
          id: 'm2',
          subjectId: 'a',
          type: 'geometry.width',
          value: 20,
          status: 'AVAILABLE' as const,
          source,
          timestamp: 1000,
        },
      ],
    };

    const report = engine.execute(snapshot, {
      snapshotId: 'snap-sort',
      subjects: ['b', 'a'],
      metrics: [{ id: 'GEOMETRY.WIDTH', version: '1.0.0' }],
    });

    // 应按 subjectId 排序：a 在前，b 在后
    expect(report.results[0]!.subjectId).toBe('a');
    expect(report.results[1]!.subjectId).toBe('b');
    expect(report.results[0]!.value).toBe(20);
    expect(report.results[1]!.value).toBe(10);
  });
});
