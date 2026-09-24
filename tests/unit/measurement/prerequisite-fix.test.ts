import { describe, expect, it } from 'vitest';
import {
  SnapshotBuilder,
  MeasurementError,
  resetIdCounter,
  validateSnapshot,
} from '@uiq/measurement';
import type { Measurement } from '@uiq/core';

describe('P8 前置修复: 拒绝重复 Measurement ID (P2-02)', () => {
  it('snapshot 包含两个相同 ID 的 measurement 时抛出 DUPLICATE_MEASUREMENT_ID', () => {
    // 构造包含重复 ID 的 snapshot 对象，通过 validateSnapshot 检测
    const snapshot = {
      id: 'snap-dup',
      capturedAt: 1000,
      source: { type: 'STATIC' as const },
      measurements: [
        {
          id: 'dup-id',
          subjectId: 's1',
          type: 'test',
          value: 1,
          status: 'AVAILABLE' as const,
          source: { type: 'STATIC' as const },
          timestamp: 1000,
        },
        {
          id: 'dup-id',
          subjectId: 's2',
          type: 'test',
          value: 2,
          status: 'AVAILABLE' as const,
          source: { type: 'STATIC' as const },
          timestamp: 1000,
        },
      ],
    };

    expect(() => validateSnapshot(snapshot)).toThrow(MeasurementError);
    try {
      validateSnapshot(snapshot);
      expect.fail('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(MeasurementError);
      expect((e as MeasurementError).code).toBe('DUPLICATE_MEASUREMENT_ID');
    }
  });

  it('不同 ID 的 measurement 正常通过', () => {
    const builder = new SnapshotBuilder({
      snapshotId: 'snap-ok',
      source: { type: 'STATIC' },
    });
    builder.setCapturedAt(1000);
    builder.addMeasurement({
      id: 'm-1',
      subjectId: 's1',
      type: 'test',
      value: 1,
      status: 'AVAILABLE',
      source: { type: 'STATIC' },
      timestamp: 1000,
    });
    builder.addMeasurement({
      id: 'm-2',
      subjectId: 's2',
      type: 'test',
      value: 2,
      status: 'AVAILABLE',
      source: { type: 'STATIC' },
      timestamp: 1000,
    });
    const snapshot = builder.build();
    expect(snapshot.measurements).toHaveLength(2);
  });
});

describe('P8 前置修复: Builder 复制输入，不冻结调用方对象 (P2-02)', () => {
  it('调用方修改原始对象不影响已添加的 measurement', () => {
    resetIdCounter();
    const builder = new SnapshotBuilder({
      snapshotId: 'snap-copy',
      source: { type: 'STATIC' },
    });
    builder.setCapturedAt(1000);

    const original: Measurement = {
      id: 'm-orig',
      subjectId: 's1',
      type: 'test',
      value: 42,
      status: 'AVAILABLE',
      source: { type: 'STATIC' },
      timestamp: 1000,
    };

    builder.addMeasurement(original);

    // 调用方修改原始对象
    (original as { value: number }).value = 999;

    const snapshot = builder.build();
    // Builder 应存储副本，不受调用方修改影响
    expect(snapshot.measurements[0]!.value).toBe(42);
    // 调用方对象不被冻结
    expect(Object.isFrozen(original)).toBe(false);
  });
});

describe('P8 前置修复: Builder 校验输入 (P2-02)', () => {
  it('addMeasurement 拒绝无效 measurement（非有限时间戳）', () => {
    const builder = new SnapshotBuilder({
      snapshotId: 'snap-val',
      source: { type: 'STATIC' },
    });

    expect(() =>
      builder.addMeasurement({
        id: 'm-bad',
        subjectId: 's1',
        type: 'test',
        value: 1,
        status: 'AVAILABLE',
        source: { type: 'STATIC' },
        timestamp: NaN,
      }),
    ).toThrow(MeasurementError);
  });

  it('addRaw 拒绝无效 subjectId', () => {
    const builder = new SnapshotBuilder({
      snapshotId: 'snap-raw',
      source: { type: 'STATIC' },
    });

    expect(() =>
      builder.addRaw({
        subjectId: '',
        type: 'test',
        value: 1,
        status: 'AVAILABLE',
        timestamp: 1000,
      }),
    ).toThrow(MeasurementError);
  });
});
