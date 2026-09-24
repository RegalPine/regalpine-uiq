import { describe, expect, it } from 'vitest';
import { validateMeasurement, validateSnapshot } from '@uiq/measurement';
import { toPx, unitLabel } from '@uiq/measurement';
import { SnapshotBuilder, resetIdCounter } from '@uiq/measurement';
import type { Measurement, MeasurementSnapshot } from '@uiq/core';

const source = { type: 'STATIC' as const };

function makeMeasurement(overrides: Partial<Measurement> = {}): Measurement {
  return {
    id: 'm-1',
    subjectId: 'e1',
    type: 'color.srgb',
    value: { r: 1, g: 0, b: 0, alpha: 1 },
    status: 'AVAILABLE',
    source,
    timestamp: 1000,
    ...overrides,
  };
}

describe('validateMeasurement', () => {
  it('合法测量', () => {
    expect(() => validateMeasurement(makeMeasurement())).not.toThrow();
  });

  it('拒绝空 id', () => {
    expect(() => validateMeasurement(makeMeasurement({ id: '' }))).toThrow();
  });

  it('拒绝空 subjectId', () => {
    expect(() => validateMeasurement(makeMeasurement({ subjectId: '' }))).toThrow();
  });

  it('拒绝空 type', () => {
    expect(() => validateMeasurement(makeMeasurement({ type: '' }))).toThrow();
  });

  it('拒绝非有限时间戳', () => {
    expect(() => validateMeasurement(makeMeasurement({ timestamp: NaN }))).toThrow();
  });

  it('AVAILABLE 必须有 value', () => {
    expect(() => validateMeasurement(makeMeasurement({ value: undefined }))).toThrow();
  });

  it('UNKNOWN 允许无 value', () => {
    expect(() =>
      validateMeasurement(makeMeasurement({ status: 'UNKNOWN', value: undefined })),
    ).not.toThrow();
  });

  it('ERROR 允许无 value', () => {
    expect(() =>
      validateMeasurement(makeMeasurement({ status: 'ERROR', value: undefined })),
    ).not.toThrow();
  });
});

describe('validateSnapshot', () => {
  it('合法快照', () => {
    const snap: MeasurementSnapshot = {
      id: 'snap-1',
      capturedAt: 1000,
      source,
      measurements: [makeMeasurement()],
    };
    expect(() => validateSnapshot(snap)).not.toThrow();
  });

  it('拒绝空 id', () => {
    expect(() =>
      validateSnapshot({ id: '', capturedAt: 1000, source, measurements: [] }),
    ).toThrow();
  });

  it('拒绝无效 capturedAt', () => {
    expect(() =>
      validateSnapshot({ id: 's', capturedAt: NaN, source, measurements: [] }),
    ).toThrow();
  });

  it('校验内嵌 measurement', () => {
    expect(() =>
      validateSnapshot({
        id: 's',
        capturedAt: 1000,
        source,
        measurements: [makeMeasurement({ id: '' })],
      }),
    ).toThrow();
  });
});

describe('toPx', () => {
  it('px 直接返回', () => {
    expect(toPx({ value: 16, unit: 'px' })).toBe(16);
  });

  it('pt → px', () => {
    expect(toPx({ value: 12, unit: 'pt' })).toBeCloseTo(16);
  });

  it('em → px（需要 parentFontSize）', () => {
    expect(toPx({ value: 2, unit: 'em' }, { parentFontSize: 16 })).toBe(32);
  });

  it('em 无上下文抛异常', () => {
    expect(() => toPx({ value: 2, unit: 'em' })).toThrow();
  });

  it('rem → px（需要 rootFontSize）', () => {
    expect(toPx({ value: 1.5, unit: 'rem' }, { rootFontSize: 16 })).toBe(24);
  });

  it('rem 无上下文抛异常', () => {
    expect(() => toPx({ value: 1.5, unit: 'rem' })).toThrow();
  });

  it('dimensionless 直接返回', () => {
    expect(toPx({ value: 1.5, unit: 'dimensionless' })).toBe(1.5);
  });

  it('percent 抛异常', () => {
    expect(() => toPx({ value: 50, unit: 'percent' })).toThrow();
  });
});

describe('unitLabel', () => {
  it('返回正确标签', () => {
    expect(unitLabel('px')).toBe('px');
    expect(unitLabel('em')).toBe('em');
    expect(unitLabel('rem')).toBe('rem');
    expect(unitLabel('pt')).toBe('pt');
    expect(unitLabel('percent')).toBe('%');
    expect(unitLabel('dimensionless')).toBe('');
  });
});

describe('SnapshotBuilder', () => {
  it('构建不可变快照', () => {
    resetIdCounter();
    const builder = new SnapshotBuilder({ snapshotId: 'test-snap', source });
    builder.setCapturedAt(1000);
    builder.addRaw({
      subjectId: 'e1',
      type: 'color.srgb',
      value: { r: 1, g: 0, b: 0 },
      status: 'AVAILABLE',
      timestamp: 1000,
    });
    const snap = builder.build();

    expect(snap.id).toBe('test-snap');
    expect(snap.capturedAt).toBe(1000);
    expect(snap.measurements).toHaveLength(1);
    expect(Object.isFrozen(snap)).toBe(true);
  });

  it('快照深层冻结', () => {
    const builder = new SnapshotBuilder({ snapshotId: 's2', source });
    builder.setCapturedAt(2000);
    builder.addRaw({
      subjectId: 'e1',
      type: 'test',
      value: 42,
      status: 'AVAILABLE',
      timestamp: 2000,
    });
    const snap = builder.build();

    expect(() => {
      (snap.measurements as Measurement[]).push(makeMeasurement());
    }).toThrow();
  });

  it('addMeasurement 添加完整 Measurement', () => {
    const builder = new SnapshotBuilder({ snapshotId: 's3', source });
    builder.setCapturedAt(3000);
    builder.addMeasurement(makeMeasurement());
    const snap = builder.build();
    expect(snap.measurements).toHaveLength(1);
    expect(snap.measurements[0]!.id).toBe('m-1');
  });

  it('setEnvironment 记录环境', () => {
    const builder = new SnapshotBuilder({ snapshotId: 's4', source });
    builder.setCapturedAt(4000);
    builder.setEnvironment({ viewport: { width: 1920, height: 1080 } });
    const snap = builder.build();
    expect(snap.environment).toBeDefined();
    expect(snap.environment!.viewport!.width).toBe(1920);
  });

  it('自动生成 snapshotId', () => {
    resetIdCounter();
    const builder = new SnapshotBuilder({ source });
    builder.setCapturedAt(5000);
    const snap = builder.build();
    expect(typeof snap.id).toBe('string');
    expect(snap.id.length).toBeGreaterThan(0);
  });
});
