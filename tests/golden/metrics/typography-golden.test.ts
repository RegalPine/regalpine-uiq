import { describe, expect, it } from 'vitest';
import { MetricExecutionEngine, createDefaultMetricRegistry } from '@uiq/metrics';
import type { MeasurementSnapshot, EngineInfo } from '@uiq/core';

const engineInfo: EngineInfo = { name: 'golden-engine', version: '1.0.0' };
const source = { type: 'STATIC' as const };

function makeTypographySnapshot(): MeasurementSnapshot {
  return {
    id: 'golden-typo-snap',
    capturedAt: 1000,
    source,
    measurements: [
      {
        id: 'm1',
        subjectId: 'e1',
        type: 'typography.font-size',
        value: 16,
        status: 'AVAILABLE',
        source,
        timestamp: 1000,
      },
      {
        id: 'm2',
        subjectId: 'e1',
        type: 'typography.font-weight',
        value: 400,
        status: 'AVAILABLE',
        source,
        timestamp: 1000,
      },
      {
        id: 'm3',
        subjectId: 'e1',
        type: 'typography.line-height',
        value: 24,
        status: 'AVAILABLE',
        source,
        timestamp: 1000,
      },
      {
        id: 'm4',
        subjectId: 'e1',
        type: 'typography.letter-spacing',
        value: 0,
        status: 'AVAILABLE',
        source,
        timestamp: 1000,
      },
      {
        id: 'm5',
        subjectId: 'e1',
        type: 'typography.text-measure',
        value: 320,
        status: 'AVAILABLE',
        source,
        timestamp: 1000,
      },
    ],
  };
}

describe('METRIC-GOLDEN-002: Typography Metrics', () => {
  it('同一快照执行两次结果完全一致', () => {
    const registry = createDefaultMetricRegistry();
    const snapshot = makeTypographySnapshot();
    const request = {
      snapshotId: 'golden-typo-snap',
      subjects: ['e1'],
      metrics: [
        { id: 'TYPOGRAPHY.FONT_SIZE', version: '1.0.0' },
        { id: 'TYPOGRAPHY.FONT_WEIGHT', version: '1.0.0' },
        { id: 'TYPOGRAPHY.LINE_HEIGHT', version: '1.0.0' },
        { id: 'TYPOGRAPHY.LETTER_SPACING', version: '1.0.0' },
        { id: 'TYPOGRAPHY.TEXT_MEASURE', version: '1.0.0' },
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

  it('BASE 指标值正确', () => {
    const registry = createDefaultMetricRegistry();
    const snapshot = makeTypographySnapshot();
    const engine = new MetricExecutionEngine({ engine: engineInfo, registry });
    const report = engine.execute(snapshot, {
      snapshotId: 'golden-typo-snap',
      subjects: ['e1'],
      metrics: [
        { id: 'TYPOGRAPHY.FONT_SIZE', version: '1.0.0' },
        { id: 'TYPOGRAPHY.FONT_WEIGHT', version: '1.0.0' },
      ],
    });

    const fontSize = report.results.find((r) => r.metricId === 'TYPOGRAPHY.FONT_SIZE');
    expect(fontSize!.value).toBe(16);
    const fontWeight = report.results.find((r) => r.metricId === 'TYPOGRAPHY.FONT_WEIGHT');
    expect(fontWeight!.value).toBe(400);
  });
});
