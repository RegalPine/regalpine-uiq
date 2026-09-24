import type { Measurement, MeasurementSource, MeasurementStatus } from '@uiq/core';

export const ADAPTER_NAME = '@uiq/browser';
export const ADAPTER_VERSION = '1.0.0';

/** IMPL-07 §9：Browser Measurement 必须记录 Adapter 与版本。 */
export function browserSource(): MeasurementSource {
  return { type: 'BROWSER', adapter: ADAPTER_NAME, version: ADAPTER_VERSION };
}

export interface MeasurementParams<T> {
  readonly subjectId: string;
  readonly type: string;
  /** null 表示无法可靠获得该值 → UNKNOWN（IMPL-07 §25：不伪造数值）。 */
  readonly value: T | null;
  readonly unit?: string;
  readonly metadata?: Record<string, unknown>;
  /** 默认由 value 是否为 null 推断；显式传入用于 ERROR 场景（IMPL-07 §53）。 */
  readonly status?: MeasurementStatus;
}

export interface MeasurementFactory {
  readonly source: MeasurementSource;
  readonly timestamp: number;
  create<T>(params: MeasurementParams<T>): Measurement<T | null>;
}

/**
 * IMPL-07 §46/§59：同一快照内测量应来自同一浏览器状态，
 * 工厂绑定单一时间戳与快照内递增序号，保证结构一致。
 */
export function createMeasurementFactory(timestamp: number): MeasurementFactory {
  let sequence = 0;
  return {
    source: browserSource(),
    timestamp,
    create<T>(params: MeasurementParams<T>): Measurement<T | null> {
      sequence += 1;
      const { subjectId, type, value, unit, metadata } = params;
      const status = params.status ?? (value === null ? 'UNKNOWN' : 'AVAILABLE');
      return {
        id: `bm-${String(sequence).padStart(6, '0')}`,
        subjectId,
        type,
        value: status === 'AVAILABLE' ? value : null,
        ...(unit !== undefined ? { unit } : {}),
        source: browserSource(),
        status,
        timestamp,
        ...(metadata !== undefined ? { metadata } : {}),
      };
    },
  };
}
