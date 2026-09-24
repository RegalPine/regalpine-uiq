import type { Measurement } from '@uiq/core';
import type { MeasurementFactory } from '../measurement-factory';

/** IMPL-07 §34-35：getBoundingClientRect 的原始数据（viewport-relative）。 */
export interface RectData {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

export interface RectMetadata {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

/** Rect → 四条基础几何 Measurement（纯转换，便于测试）。 */
export function rectMeasurements(
  subjectId: string,
  rect: RectData,
  factory: MeasurementFactory,
  extraMetadata?: Record<string, unknown>,
): readonly Measurement<unknown>[] {
  const metadata: Record<string, unknown> = {
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    left: rect.left,
    ...(extraMetadata ?? {}),
  };
  return [
    factory.create({ subjectId, type: 'geometry.x', value: rect.x, unit: 'px', metadata }),
    factory.create({ subjectId, type: 'geometry.y', value: rect.y, unit: 'px', metadata }),
    factory.create({ subjectId, type: 'geometry.width', value: rect.width, unit: 'px', metadata }),
    factory.create({
      subjectId,
      type: 'geometry.height',
      value: rect.height,
      unit: 'px',
      metadata,
    }),
  ];
}
