import type { Measurement, MeasurementSnapshot, MeasurementStatus } from '@uiq/core';
import { MeasurementError } from './types';

export function validateMeasurement(measurement: Measurement): void {
  if (typeof measurement.id !== 'string' || measurement.id.trim() === '') {
    throw new MeasurementError('INVALID_MEASUREMENT', 'Measurement 需要非空 id');
  }
  if (typeof measurement.subjectId !== 'string' || measurement.subjectId.trim() === '') {
    throw new MeasurementError('INVALID_MEASUREMENT', 'Measurement 需要非空 subjectId');
  }
  if (typeof measurement.type !== 'string' || measurement.type.trim() === '') {
    throw new MeasurementError('INVALID_MEASUREMENT', 'Measurement 需要非空 type');
  }
  if (!Number.isFinite(measurement.timestamp)) {
    throw new MeasurementError('INVALID_MEASUREMENT', 'Measurement 需要有限时间戳');
  }
  if (measurement.source === null || typeof measurement.source !== 'object') {
    throw new MeasurementError('INVALID_MEASUREMENT', 'Measurement 需要来源信息');
  }
  validateStatus(measurement.status, measurement.value);
}

function validateStatus(status: MeasurementStatus, value: unknown): void {
  const validStatuses: readonly MeasurementStatus[] = ['AVAILABLE', 'UNKNOWN', 'ERROR'];
  if (!validStatuses.includes(status)) {
    throw new MeasurementError('INVALID_MEASUREMENT', `无效状态：${status}`);
  }
  if (status === 'AVAILABLE' && value === undefined) {
    throw new MeasurementError('INVALID_MEASUREMENT', 'AVAILABLE 状态的 Measurement 必须有 value');
  }
}

export function validateSnapshot(snapshot: MeasurementSnapshot): void {
  if (typeof snapshot.id !== 'string' || snapshot.id.trim() === '') {
    throw new MeasurementError('INVALID_SNAPSHOT', 'Snapshot 需要非空 id');
  }
  if (!Number.isFinite(snapshot.capturedAt)) {
    throw new MeasurementError('INVALID_SNAPSHOT', 'Snapshot 需要有限 capturedAt');
  }
  if (snapshot.source === null || typeof snapshot.source !== 'object') {
    throw new MeasurementError('INVALID_SNAPSHOT', 'Snapshot 需要来源信息');
  }
  if (!Array.isArray(snapshot.measurements)) {
    throw new MeasurementError('INVALID_SNAPSHOT', 'Snapshot 需要 measurements 数组');
  }
  for (const measurement of snapshot.measurements) {
    validateMeasurement(measurement);
  }
  // P8 前置修复（P2-02）：拒绝重复 Measurement ID
  const ids = new Set<string>();
  for (const measurement of snapshot.measurements) {
    if (ids.has(measurement.id)) {
      throw new MeasurementError(
        'DUPLICATE_MEASUREMENT_ID',
        `Snapshot 包含重复 Measurement ID：${measurement.id}`,
      );
    }
    ids.add(measurement.id);
  }
}
