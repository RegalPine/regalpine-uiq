import type {
  Measurement,
  MeasurementSource,
  MeasurementEnvironment,
  MeasurementSnapshot,
} from '@uiq/core';
import { MeasurementError } from './types';
import { validateMeasurement } from './validation';

let counter = 0;
function generateId(prefix = 'm'): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter.toString(36)}`;
}

export function resetIdCounter(): void {
  counter = 0;
}

export class SnapshotBuilder {
  private readonly measurements: Measurement[] = [];
  private readonly snapshotId: string;
  private readonly source: MeasurementSource;
  private capturedAt: number | undefined;
  private environment: MeasurementEnvironment | undefined;

  constructor(options: { snapshotId?: string; source: MeasurementSource }) {
    if (options.source === null || typeof options.source !== 'object') {
      throw new MeasurementError('INVALID_SNAPSHOT', 'SnapshotBuilder 需要来源信息');
    }
    this.snapshotId = options.snapshotId ?? generateId('snap');
    this.source = { ...options.source };
  }

  setCapturedAt(timestamp: number): this {
    if (!Number.isFinite(timestamp)) {
      throw new MeasurementError('INVALID_SNAPSHOT', 'capturedAt 必须是有限数值');
    }
    this.capturedAt = timestamp;
    return this;
  }

  setEnvironment(env: MeasurementEnvironment): this {
    this.environment = { ...env };
    return this;
  }

  /**
   * P8 前置修复（P2-02）：复制输入、校验后存储；不冻结调用方输入。
   * build 时再统一冻结产物。
   */
  addMeasurement(measurement: Measurement): this {
    const copy: Measurement = { ...measurement };
    validateMeasurement(copy);
    this.measurements.push(copy);
    return this;
  }

  addRaw(options: {
    subjectId: string;
    type: string;
    value: unknown;
    status: Measurement['status'];
    unit?: string;
    timestamp: number;
    metadata?: Readonly<Record<string, unknown>>;
  }): this {
    const measurement: Measurement = {
      id: generateId('m'),
      subjectId: options.subjectId,
      type: options.type,
      value: options.value,
      status: options.status,
      source: { ...this.source },
      timestamp: options.timestamp,
      ...(options.unit !== undefined ? { unit: options.unit } : {}),
      ...(options.metadata !== undefined ? { metadata: options.metadata } : {}),
    };
    validateMeasurement(measurement);
    this.measurements.push(measurement);
    return this;
  }

  build(): MeasurementSnapshot {
    const snapshot: MeasurementSnapshot = {
      id: this.snapshotId,
      capturedAt: this.capturedAt ?? Date.now(),
      source: { ...this.source },
      measurements: [...this.measurements],
      ...(this.environment !== undefined ? { environment: this.environment } : {}),
    };
    return deepFreeze(snapshot) as MeasurementSnapshot;
  }
}

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== 'object') return value;
  if (Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor && 'value' in descriptor) {
      deepFreeze(descriptor.value);
    }
  }
  return value;
}
