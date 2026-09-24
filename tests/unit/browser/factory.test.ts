import { describe, expect, it } from 'vitest';
import { ADAPTER_NAME, ADAPTER_VERSION, createMeasurementFactory } from '@uiq/browser';

describe('createMeasurementFactory（IMPL-07 §46/§59）', () => {
  const factory = createMeasurementFactory(1000);

  it('AVAILABLE 测量结构统一', () => {
    const m = factory.create({ subjectId: 'el-1', type: 'geometry.width', value: 120, unit: 'px' });
    expect(m).toMatchObject({
      id: 'bm-000001',
      subjectId: 'el-1',
      type: 'geometry.width',
      value: 120,
      unit: 'px',
      status: 'AVAILABLE',
      timestamp: 1000,
    });
    expect(m.source).toEqual({ type: 'BROWSER', adapter: ADAPTER_NAME, version: ADAPTER_VERSION });
  });

  it('value null → UNKNOWN 且 value 序列化为 null（不伪造数值）', () => {
    const m = factory.create({ subjectId: 'el-1', type: 'color.srgb', value: null });
    expect(m.status).toBe('UNKNOWN');
    expect(m.value).toBeNull();
  });

  it('显式 ERROR 状态时 value 强制为 null', () => {
    const m = factory.create({
      subjectId: 'el-1',
      type: 'geometry.width',
      value: 120,
      status: 'ERROR',
    });
    expect(m.status).toBe('ERROR');
    expect(m.value).toBeNull();
  });

  it('快照内序号递增，保证 Measurement id 唯一', () => {
    const a = factory.create({ subjectId: 'el-1', type: 'a', value: 1 });
    const b = factory.create({ subjectId: 'el-1', type: 'b', value: 2 });
    expect(a.id).not.toBe(b.id);
    expect(b.id).toBe('bm-000005');
  });

  it('同一快照共享同一时间戳（§46 Snapshot Atomicity）', () => {
    const f = createMeasurementFactory(42_000);
    const list = [1, 2, 3].map((v) => f.create({ subjectId: 's', type: 't', value: v }));
    expect(list.every((m) => m.timestamp === 42_000)).toBe(true);
  });
});
