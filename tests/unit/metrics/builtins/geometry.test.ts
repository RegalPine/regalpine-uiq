import { describe, expect, it } from 'vitest';
import type { MetricCalculationContext, MeasurementSnapshot, MetricResult } from '@uiq/core';
import { GEOMETRY_WIDTH } from '@uiq/metrics';
import { GEOMETRY_HEIGHT } from '@uiq/metrics';
import { GEOMETRY_AREA } from '@uiq/metrics';
import { GEOMETRY_ASPECT_RATIO } from '@uiq/metrics';
import { GEOMETRY_CENTER_DISTANCE } from '@uiq/metrics';
import { GEOMETRY_EDGE_DISTANCE } from '@uiq/metrics';
import { GEOMETRY_OVERLAP } from '@uiq/metrics';

const source = { type: 'STATIC' as const };

function makeSnapshot(
  measurements: Array<{ subjectId: string; type: string; value: unknown }>,
): MeasurementSnapshot {
  return {
    id: 'snap-geo',
    capturedAt: 1000,
    source,
    measurements: measurements.map((m, i) => ({
      id: `m-${i}`,
      subjectId: m.subjectId,
      type: m.type,
      value: m.value,
      status: 'AVAILABLE' as const,
      source,
      timestamp: 1000,
    })),
  };
}

function makeCtx(
  snapshot: MeasurementSnapshot,
  subjectId: string,
  deps: Map<string, MetricResult> = new Map(),
): MetricCalculationContext {
  return { subjectId, snapshot, dependencies: deps };
}

describe('GEOMETRY.WIDTH', () => {
  it('提取宽度', () => {
    const snap = makeSnapshot([{ subjectId: 'e1', type: 'geometry.width', value: 200 }]);
    expect(GEOMETRY_WIDTH.calculate(makeCtx(snap, 'e1')).value).toBe(200);
  });

  it('零宽度', () => {
    const snap = makeSnapshot([{ subjectId: 'e1', type: 'geometry.width', value: 0 }]);
    expect(GEOMETRY_WIDTH.calculate(makeCtx(snap, 'e1')).value).toBe(0);
  });
});

describe('GEOMETRY.HEIGHT', () => {
  it('提取高度', () => {
    const snap = makeSnapshot([{ subjectId: 'e1', type: 'geometry.height', value: 100 }]);
    expect(GEOMETRY_HEIGHT.calculate(makeCtx(snap, 'e1')).value).toBe(100);
  });
});

describe('GEOMETRY.AREA', () => {
  it('width × height', () => {
    const depMap = new Map<string, MetricResult>();
    depMap.set('GEOMETRY.WIDTH@1.0.0', {
      metricId: 'GEOMETRY.WIDTH',
      metricVersion: '1.0.0',
      subjectId: 'e1',
      status: 'AVAILABLE',
      value: 200,
      dependencies: [],
      fingerprint: '',
    });
    depMap.set('GEOMETRY.HEIGHT@1.0.0', {
      metricId: 'GEOMETRY.HEIGHT',
      metricVersion: '1.0.0',
      subjectId: 'e1',
      status: 'AVAILABLE',
      value: 100,
      dependencies: [],
      fingerprint: '',
    });
    const result = GEOMETRY_AREA.calculate(makeCtx(makeSnapshot([]), 'e1', depMap));
    expect(result.value).toBe(20000);
    expect(result.unit).toBe('px\u00B2');
  });

  it('依赖缺失 → UNKNOWN', () => {
    const result = GEOMETRY_AREA.calculate(makeCtx(makeSnapshot([]), 'e1'));
    expect(result.status).toBe('UNKNOWN');
  });
});

describe('GEOMETRY.ASPECT_RATIO', () => {
  it('正常比例', () => {
    const depMap = new Map<string, MetricResult>();
    depMap.set('GEOMETRY.WIDTH@1.0.0', {
      metricId: 'GEOMETRY.WIDTH',
      metricVersion: '1.0.0',
      subjectId: 'e1',
      status: 'AVAILABLE',
      value: 200,
      dependencies: [],
      fingerprint: '',
    });
    depMap.set('GEOMETRY.HEIGHT@1.0.0', {
      metricId: 'GEOMETRY.HEIGHT',
      metricVersion: '1.0.0',
      subjectId: 'e1',
      status: 'AVAILABLE',
      value: 100,
      dependencies: [],
      fingerprint: '',
    });
    const result = GEOMETRY_ASPECT_RATIO.calculate(makeCtx(makeSnapshot([]), 'e1', depMap));
    expect(result.value).toBe(2);
  });

  it('height=0 → UNKNOWN', () => {
    const depMap = new Map<string, MetricResult>();
    depMap.set('GEOMETRY.WIDTH@1.0.0', {
      metricId: 'GEOMETRY.WIDTH',
      metricVersion: '1.0.0',
      subjectId: 'e1',
      status: 'AVAILABLE',
      value: 200,
      dependencies: [],
      fingerprint: '',
    });
    depMap.set('GEOMETRY.HEIGHT@1.0.0', {
      metricId: 'GEOMETRY.HEIGHT',
      metricVersion: '1.0.0',
      subjectId: 'e1',
      status: 'AVAILABLE',
      value: 0,
      dependencies: [],
      fingerprint: '',
    });
    const result = GEOMETRY_ASPECT_RATIO.calculate(makeCtx(makeSnapshot([]), 'e1', depMap));
    expect(result.status).toBe('UNKNOWN');
  });
});

describe('GEOMETRY.CENTER_DISTANCE', () => {
  it('计算中心距离', () => {
    const snap = makeSnapshot([
      { subjectId: 'e1', type: 'geometry.x', value: 0 },
      { subjectId: 'e1', type: 'geometry.y', value: 0 },
      { subjectId: 'e1', type: 'geometry.width', value: 10 },
      { subjectId: 'e1', type: 'geometry.height', value: 10 },
      { subjectId: 'e1', type: 'geometry.center-distance.reference', value: 'e2' },
      { subjectId: 'e2', type: 'geometry.x', value: 30 },
      { subjectId: 'e2', type: 'geometry.y', value: 0 },
      { subjectId: 'e2', type: 'geometry.width', value: 10 },
      { subjectId: 'e2', type: 'geometry.height', value: 10 },
    ]);
    const result = GEOMETRY_CENTER_DISTANCE.calculate(makeCtx(snap, 'e1'));
    expect(result.status).toBe('AVAILABLE');
    expect(result.value).toBe(30);
  });

  it('缺少参考 → UNKNOWN', () => {
    const snap = makeSnapshot([{ subjectId: 'e1', type: 'geometry.x', value: 0 }]);
    const result = GEOMETRY_CENTER_DISTANCE.calculate(makeCtx(snap, 'e1'));
    expect(result.status).toBe('UNKNOWN');
  });
});

describe('GEOMETRY.EDGE_DISTANCE', () => {
  it('计算边缘距离', () => {
    const snap = makeSnapshot([
      { subjectId: 'e1', type: 'geometry.x', value: 0 },
      { subjectId: 'e1', type: 'geometry.y', value: 0 },
      { subjectId: 'e1', type: 'geometry.width', value: 10 },
      { subjectId: 'e1', type: 'geometry.height', value: 10 },
      { subjectId: 'e1', type: 'geometry.edge-distance.reference', value: 'e2' },
      { subjectId: 'e2', type: 'geometry.x', value: 20 },
      { subjectId: 'e2', type: 'geometry.y', value: 30 },
      { subjectId: 'e2', type: 'geometry.width', value: 10 },
      { subjectId: 'e2', type: 'geometry.height', value: 10 },
    ]);
    const result = GEOMETRY_EDGE_DISTANCE.calculate(makeCtx(snap, 'e1'));
    expect(result.status).toBe('AVAILABLE');
    const val = result.value as { horizontal: number; vertical: number; minimum: number };
    expect(val.horizontal).toBe(10);
    expect(val.vertical).toBe(20);
    expect(val.minimum).toBe(10);
  });
});

describe('GEOMETRY.OVERLAP', () => {
  it('计算重叠', () => {
    const snap = makeSnapshot([
      { subjectId: 'e1', type: 'geometry.x', value: 0 },
      { subjectId: 'e1', type: 'geometry.y', value: 0 },
      { subjectId: 'e1', type: 'geometry.width', value: 10 },
      { subjectId: 'e1', type: 'geometry.height', value: 10 },
      { subjectId: 'e1', type: 'geometry.overlap.reference', value: 'e2' },
      { subjectId: 'e2', type: 'geometry.x', value: 5 },
      { subjectId: 'e2', type: 'geometry.y', value: 5 },
      { subjectId: 'e2', type: 'geometry.width', value: 10 },
      { subjectId: 'e2', type: 'geometry.height', value: 10 },
    ]);
    const result = GEOMETRY_OVERLAP.calculate(makeCtx(snap, 'e1'));
    expect(result.status).toBe('AVAILABLE');
    const val = result.value as { area: number; ratioA: number; ratioB: number };
    expect(val.area).toBe(25);
    expect(val.ratioA).toBe(0.25);
  });
});
