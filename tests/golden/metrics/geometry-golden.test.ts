import { describe, expect, it } from 'vitest';
import { MetricExecutionEngine, createDefaultMetricRegistry } from '@uiq/metrics';
import type { MeasurementSnapshot, EngineInfo } from '@uiq/core';

const engineInfo: EngineInfo = { name: 'golden-engine', version: '1.0.0' };
const source = { type: 'STATIC' as const };

function makeGeometrySnapshot(): MeasurementSnapshot {
  return {
    id: 'golden-geo-snap',
    capturedAt: 1000,
    source,
    measurements: [
      {
        id: 'm1',
        subjectId: 'e1',
        type: 'geometry.x',
        value: 0,
        status: 'AVAILABLE',
        source,
        timestamp: 1000,
      },
      {
        id: 'm2',
        subjectId: 'e1',
        type: 'geometry.y',
        value: 0,
        status: 'AVAILABLE',
        source,
        timestamp: 1000,
      },
      {
        id: 'm3',
        subjectId: 'e1',
        type: 'geometry.width',
        value: 200,
        status: 'AVAILABLE',
        source,
        timestamp: 1000,
      },
      {
        id: 'm4',
        subjectId: 'e1',
        type: 'geometry.height',
        value: 100,
        status: 'AVAILABLE',
        source,
        timestamp: 1000,
      },
      {
        id: 'm5',
        subjectId: 'e1',
        type: 'geometry.center-distance.reference',
        value: 'e2',
        status: 'AVAILABLE',
        source,
        timestamp: 1000,
      },
      {
        id: 'm6',
        subjectId: 'e1',
        type: 'geometry.edge-distance.reference',
        value: 'e2',
        status: 'AVAILABLE',
        source,
        timestamp: 1000,
      },
      {
        id: 'm7',
        subjectId: 'e1',
        type: 'geometry.overlap.reference',
        value: 'e2',
        status: 'AVAILABLE',
        source,
        timestamp: 1000,
      },
      {
        id: 'm8',
        subjectId: 'e2',
        type: 'geometry.x',
        value: 100,
        status: 'AVAILABLE',
        source,
        timestamp: 1000,
      },
      {
        id: 'm9',
        subjectId: 'e2',
        type: 'geometry.y',
        value: 50,
        status: 'AVAILABLE',
        source,
        timestamp: 1000,
      },
      {
        id: 'm10',
        subjectId: 'e2',
        type: 'geometry.width',
        value: 200,
        status: 'AVAILABLE',
        source,
        timestamp: 1000,
      },
      {
        id: 'm11',
        subjectId: 'e2',
        type: 'geometry.height',
        value: 100,
        status: 'AVAILABLE',
        source,
        timestamp: 1000,
      },
    ],
  };
}

describe('METRIC-GOLDEN-003: Geometry Metrics', () => {
  it('同一快照执行两次结果完全一致', () => {
    const registry = createDefaultMetricRegistry();
    const snapshot = makeGeometrySnapshot();
    const request = {
      snapshotId: 'golden-geo-snap',
      subjects: ['e1'],
      metrics: [
        { id: 'GEOMETRY.WIDTH', version: '1.0.0' },
        { id: 'GEOMETRY.HEIGHT', version: '1.0.0' },
        { id: 'GEOMETRY.AREA', version: '1.0.0' },
        { id: 'GEOMETRY.ASPECT_RATIO', version: '1.0.0' },
        { id: 'GEOMETRY.CENTER_DISTANCE', version: '1.0.0' },
        { id: 'GEOMETRY.EDGE_DISTANCE', version: '1.0.0' },
        { id: 'GEOMETRY.OVERLAP', version: '1.0.0' },
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

  it('AREA = WIDTH × HEIGHT', () => {
    const registry = createDefaultMetricRegistry();
    const snapshot = makeGeometrySnapshot();
    const engine = new MetricExecutionEngine({ engine: engineInfo, registry });
    const report = engine.execute(snapshot, {
      snapshotId: 'golden-geo-snap',
      subjects: ['e1'],
      metrics: [
        { id: 'GEOMETRY.WIDTH', version: '1.0.0' },
        { id: 'GEOMETRY.HEIGHT', version: '1.0.0' },
        { id: 'GEOMETRY.AREA', version: '1.0.0' },
      ],
    });

    const width = report.results.find((r) => r.metricId === 'GEOMETRY.WIDTH');
    const height = report.results.find((r) => r.metricId === 'GEOMETRY.HEIGHT');
    const area = report.results.find((r) => r.metricId === 'GEOMETRY.AREA');
    expect(width!.value).toBe(200);
    expect(height!.value).toBe(100);
    expect(area!.value).toBe(20000);
  });
});
