import { describe, expect, it } from 'vitest';
import { MetricExecutionEngine, createDefaultMetricRegistry } from '@uiq/metrics';
import type { MeasurementSnapshot, EngineInfo } from '@uiq/core';

const engineInfo: EngineInfo = { name: 'golden-engine', version: '1.0.0' };
const source = { type: 'STATIC' as const };

function makeColorSnapshot(): MeasurementSnapshot {
  return {
    id: 'golden-color-snap',
    capturedAt: 1000,
    source,
    measurements: [
      {
        id: 'm1',
        subjectId: 'fg',
        type: 'color.srgb',
        value: { r: 0, g: 0, b: 0, alpha: 1 },
        status: 'AVAILABLE',
        source,
        timestamp: 1000,
      },
      {
        id: 'm2',
        subjectId: 'fg',
        type: 'color.srgb.background',
        value: { r: 1, g: 1, b: 1, alpha: 1 },
        status: 'AVAILABLE',
        source,
        timestamp: 1000,
      },
    ],
  };
}

describe('METRIC-GOLDEN-001: Color Metrics', () => {
  it('同一快照执行两次结果完全一致', () => {
    const registry = createDefaultMetricRegistry();
    const snapshot = makeColorSnapshot();
    const request = {
      snapshotId: 'golden-color-snap',
      subjects: ['fg'],
      metrics: [
        { id: 'COLOR.SRGB', version: '1.0.0' },
        { id: 'COLOR.OKLAB', version: '1.0.0' },
        { id: 'COLOR.OKLCH', version: '1.0.0' },
        { id: 'COLOR.LIGHTNESS', version: '1.0.0' },
        { id: 'COLOR.CHROMA', version: '1.0.0' },
        { id: 'COLOR.HUE', version: '1.0.0' },
        { id: 'COLOR.CONTRAST', version: '1.0.0' },
      ],
    };

    const engine1 = new MetricExecutionEngine({ engine: engineInfo, registry });
    const report1 = engine1.execute(snapshot, request);

    const engine2 = new MetricExecutionEngine({ engine: engineInfo, registry });
    const report2 = engine2.execute(snapshot, request);

    expect(report1.results.length).toBe(report2.results.length);
    for (let i = 0; i < report1.results.length; i++) {
      const r1 = report1.results[i]!;
      const r2 = report2.results[i]!;
      expect(r1.metricId).toBe(r2.metricId);
      expect(r1.status).toBe(r2.status);
      expect(r1.value).toEqual(r2.value);
      expect(r1.fingerprint).toBe(r2.fingerprint);
    }
  });

  it('黑/白对比度 = 21', () => {
    const registry = createDefaultMetricRegistry();
    const snapshot = makeColorSnapshot();
    const engine = new MetricExecutionEngine({ engine: engineInfo, registry });
    const report = engine.execute(snapshot, {
      snapshotId: 'golden-color-snap',
      subjects: ['fg'],
      metrics: [{ id: 'COLOR.CONTRAST', version: '1.0.0' }],
    });
    const contrast = report.results.find((r) => r.metricId === 'COLOR.CONTRAST');
    expect(contrast).toBeDefined();
    expect(contrast!.status).toBe('AVAILABLE');
    expect((contrast!.value as { ratio: number }).ratio).toBe(21);
  });
});
