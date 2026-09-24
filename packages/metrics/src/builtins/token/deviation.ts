/**
 * TOKEN.DEVIATION@1.0.0（IMPL-09 §28-29，AD-17 裁决的指标 ID）。
 * 偏差不是统一距离（§29）：按 token 值类型使用不同数学，具体定义写入 value/metadata：
 * - 颜色：OKLCH 分量差 ΔL/ΔC/ΔH + OKLab 空间欧氏距离 ΔE，metadata.method='OKLAB_EUCLIDEAN@1.0'；
 *   色相未定义（无彩色）时 deltaH 为 null。
 * - 数值（px 等）：absolute = |期望-实际|，relative = absolute/|期望|；期望为 0 时 relative 无定义 → null。
 * V1.0 范围：COLOR + NUMERIC；TYPOGRAPHY 复合偏差不注册（IMPL-09 §29：不_declare 不实现）。
 *
 * 工厂显式注册：不进 createDefaultMetricRegistry。
 */
import type { MetricCalculationContext, MetricDefinition, MetricResult } from '@uiq/core';
import {
  deltaC,
  deltaH,
  deltaL,
  linearRgbToXyz,
  oklabToOklch,
  parseHex,
  toLinearRGB,
  xyzToOklab,
  type OKLab,
  type SRGB,
} from '@uiq/color';
import { TOKEN_RESOLUTION_METRIC_ID, TOKEN_RESOLUTION_METRIC_VERSION } from './match';
import { findMeasurement } from '../helpers';

export interface TokenDeviationMetricOptions {
  /** 提供实测值的指标（默认 COLOR.SRGB@1.0.0）；与 actualMeasurementType 互斥。 */
  readonly actualMetricId?: string;
  readonly actualMetricVersion?: string;
  readonly actualValueKey?: string;
  /** P5：直接读取快照测量的类型（如 color.srgb.background）；设置后 actual 依赖省略。 */
  readonly actualMeasurementType?: string;
}

export type TokenDeviationValue =
  | {
      readonly type: 'COLOR';
      readonly deltaL: number;
      readonly deltaC: number;
      readonly deltaH: number | null;
      readonly deltaE: number;
    }
  | {
      readonly type: 'NUMERIC';
      readonly absolute: number;
      readonly relative: number | null;
    };

const DEFAULT_ACTUAL_METRIC_ID = 'COLOR.SRGB';
const DEFAULT_ACTUAL_METRIC_VERSION = '1.0.0';

const HEX_PATTERN = /^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i;

const EMPTY_BASE = {
  metricId: 'TOKEN.DEVIATION',
  metricVersion: '1.0.0',
  subjectId: '',
  status: 'UNKNOWN',
  dependencies: [] as [],
  fingerprint: '',
} as const;

function isSrgbShape(value: unknown): value is SRGB {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Record<string, unknown>)['r'] === 'number' &&
    typeof (value as Record<string, unknown>)['g'] === 'number' &&
    typeof (value as Record<string, unknown>)['b'] === 'number'
  );
}

function srgbToOklab(color: SRGB): OKLab {
  return xyzToOklab(linearRgbToXyz(toLinearRGB(color)));
}

function computeColorDeviation(expectedHex: string, actual: SRGB): TokenDeviationValue | null {
  try {
    const expected = parseHex(expectedHex);
    const expectedLab = srgbToOklab(expected);
    const actualLab = srgbToOklab(actual);
    const expectedLch = oklabToOklch(expectedLab);
    const actualLch = oklabToOklch(actualLab);
    const hueDelta = deltaH(expectedLch.H, actualLch.H);
    return {
      type: 'COLOR',
      // deltaL/deltaC/deltaH 采用 @uiq/color 约定：actual - expected 方向。
      deltaL: deltaL(expectedLab, actualLab),
      deltaC: deltaC(expectedLch, actualLch),
      deltaH: hueDelta === 'UNDEFINED' ? null : hueDelta,
      // ΔE 为 OKLab 空间欧氏距离（与分量差方向无关）。
      deltaE: Math.hypot(
        actualLab.L - expectedLab.L,
        actualLab.a - expectedLab.a,
        actualLab.b - expectedLab.b,
      ),
    };
  } catch {
    return null;
  }
}

function computeNumericDeviation(expected: number, actual: number): TokenDeviationValue {
  const absolute = Math.abs(expected - actual);
  return {
    type: 'NUMERIC',
    absolute,
    relative: expected !== 0 ? absolute / Math.abs(expected) : null,
  };
}

export function createTokenDeviationMetric(
  options: TokenDeviationMetricOptions = {},
): MetricDefinition<TokenDeviationValue> {
  const actualMetricId = options.actualMetricId ?? DEFAULT_ACTUAL_METRIC_ID;
  const actualMetricVersion = options.actualMetricVersion ?? DEFAULT_ACTUAL_METRIC_VERSION;
  return {
    id: 'TOKEN.DEVIATION',
    version: '1.0.0',
    kind: 'DERIVED',
    dependencies: [
      {
        metricId: TOKEN_RESOLUTION_METRIC_ID,
        version: TOKEN_RESOLUTION_METRIC_VERSION,
        required: true,
      },
      ...(options.actualMeasurementType === undefined
        ? [{ metricId: actualMetricId, version: actualMetricVersion, required: true }]
        : []),
    ],
    calculate(ctx: MetricCalculationContext): MetricResult<TokenDeviationValue> {
      const resolution = ctx.dependencies.get(
        `${TOKEN_RESOLUTION_METRIC_ID}@${TOKEN_RESOLUTION_METRIC_VERSION}`,
      );
      const actual =
        options.actualMeasurementType !== undefined
          ? measurementAsResult(ctx, options.actualMeasurementType)
          : ctx.dependencies.get(`${actualMetricId}@${actualMetricVersion}`);
      if (
        !resolution ||
        resolution.status !== 'AVAILABLE' ||
        !actual ||
        actual.status !== 'AVAILABLE'
      ) {
        return { ...EMPTY_BASE, subjectId: ctx.subjectId };
      }
      const expectedValue = (resolution.value as { resolvedValue?: unknown } | undefined)
        ?.resolvedValue;
      let actualValue: unknown = actual.value;
      if (
        options.actualValueKey !== undefined &&
        typeof actualValue === 'object' &&
        actualValue !== null
      ) {
        actualValue = (actualValue as Record<string, unknown>)[options.actualValueKey];
      }

      let value: TokenDeviationValue | null = null;
      if (typeof expectedValue === 'number' && typeof actualValue === 'number') {
        value = computeNumericDeviation(expectedValue, actualValue);
      } else if (
        typeof expectedValue === 'string' &&
        HEX_PATTERN.test(expectedValue) &&
        isSrgbShape(actualValue)
      ) {
        value = computeColorDeviation(expectedValue, actualValue);
      }
      if (value === null) {
        return { ...EMPTY_BASE, subjectId: ctx.subjectId };
      }
      return {
        metricId: this.id,
        metricVersion: this.version,
        subjectId: ctx.subjectId,
        status: 'AVAILABLE',
        value,
        dependencies: [],
        fingerprint: '',
        ...(value.type === 'COLOR' ? { metadata: { method: 'OKLAB_EUCLIDEAN@1.0' } } : {}),
      };
    },
  };
}

/** 直接从快照读取测量值（IMPL-09 §30：Actual 来自 Browser Measurement）。 */
function measurementAsResult(
  ctx: MetricCalculationContext,
  measurementType: string,
): MetricResult | undefined {
  const measurement = findMeasurement(ctx, measurementType);
  if (!measurement || measurement.status !== 'AVAILABLE') return undefined;
  return {
    metricId: '',
    metricVersion: '',
    subjectId: ctx.subjectId,
    status: 'AVAILABLE',
    value: measurement.value,
    dependencies: [],
    fingerprint: '',
  };
}
