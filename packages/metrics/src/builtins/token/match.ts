/**
 * TOKEN.MATCH@1.0.0（IMPL-09 §27，AD-17 裁决的指标 ID）。
 * 依赖：[TOKEN.RESOLUTION@1.0.0 REQUIRED, actualMetricId（默认 COLOR.SRGB@1.0.0）REQUIRED]。
 * 输出 value.result ∈ MATCH | NO_MATCH | UNKNOWN（§27）。
 *
 * 比较策略（确定性分派，不猜测）：
 * - 颜色 token（期望值为 hex）vs SRGB 实测值 → canonical sRGB 四通道相等比较；
 * - 数值 token（期望值为 number）vs 数值实测值 → 严格相等（偏差量化交给 DEVIATION）；
 * - 字符串 vs 字符串 → 严格相等；
 * - 形态不匹配 / 解析失败 → UNKNOWN。
 *
 * Actual 必须来自 Browser Measurement（IMPL-09 §30）：默认经 actualMetricId 指标依赖；
 * 也可设 actualMeasurementType 直接读取快照测量（与 COLOR.CONTRAST 读背景测量同一先例），
 * 供应用编排层投影约定使用（如背景 token → color.srgb.background）。
 * 工厂显式注册：port/actual 指标未就绪时静默 UNKNOWN 违反"不伪造"原则。
 */
import type { MetricCalculationContext, MetricDefinition, MetricResult } from '@uiq/core';
import { parseHex, type SRGB } from '@uiq/color';
import { findMeasurement } from '../helpers';
import type { TokenResolutionPortResult } from './types';

export interface TokenMatchMetricOptions {
  /** 提供实测值的指标（默认 COLOR.SRGB@1.0.0）；与 actualMeasurementType 互斥。 */
  readonly actualMetricId?: string;
  readonly actualMetricVersion?: string;
  /** 实测值为对象时提取的字段名（如 px）。 */
  readonly actualValueKey?: string;
  /** P5：直接读取快照测量的类型（如 color.srgb.background）；设置后 actual 依赖省略。 */
  readonly actualMeasurementType?: string;
}

export type TokenMatchOutcome = 'MATCH' | 'NO_MATCH' | 'UNKNOWN';

export interface TokenMatchValue {
  readonly result: TokenMatchOutcome;
}

export const TOKEN_RESOLUTION_METRIC_ID = 'TOKEN.RESOLUTION';
export const TOKEN_RESOLUTION_METRIC_VERSION = '1.0.0';

const DEFAULT_ACTUAL_METRIC_ID = 'COLOR.SRGB';
const DEFAULT_ACTUAL_METRIC_VERSION = '1.0.0';

const HEX_PATTERN = /^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i;

const UNKNOWN_RESULT: MetricResult<TokenMatchValue> = {
  metricId: 'TOKEN.MATCH',
  metricVersion: '1.0.0',
  subjectId: '',
  status: 'UNKNOWN',
  dependencies: [],
  fingerprint: '',
};

function isSrgbShape(value: unknown): value is SRGB {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Record<string, unknown>)['r'] === 'number' &&
    typeof (value as Record<string, unknown>)['g'] === 'number' &&
    typeof (value as Record<string, unknown>)['b'] === 'number'
  );
}

function srgbEquals(a: SRGB, b: SRGB): boolean {
  return a.r === b.r && a.g === b.g && a.b === b.b && (a.alpha ?? 1) === (b.alpha ?? 1);
}

/** 确定性比较分派；无法确证的形态 → UNKNOWN。 */
export function compareTokenValue(expected: unknown, actual: unknown): TokenMatchOutcome {
  if (typeof expected === 'number' && typeof actual === 'number') {
    return expected === actual ? 'MATCH' : 'NO_MATCH';
  }
  if (typeof expected === 'string' && HEX_PATTERN.test(expected) && isSrgbShape(actual)) {
    try {
      return srgbEquals(parseHex(expected), actual) ? 'MATCH' : 'NO_MATCH';
    } catch {
      return 'UNKNOWN';
    }
  }
  if (typeof expected === 'string' && typeof actual === 'string') {
    return expected === actual ? 'MATCH' : 'NO_MATCH';
  }
  return 'UNKNOWN';
}

export function createTokenMatchMetric(
  options: TokenMatchMetricOptions = {},
): MetricDefinition<TokenMatchValue> {
  const actualMetricId = options.actualMetricId ?? DEFAULT_ACTUAL_METRIC_ID;
  const actualMetricVersion = options.actualMetricVersion ?? DEFAULT_ACTUAL_METRIC_VERSION;
  const actualDepKey = `${actualMetricId}@${actualMetricVersion}`;
  return {
    id: 'TOKEN.MATCH',
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
    calculate(ctx: MetricCalculationContext): MetricResult<TokenMatchValue> {
      const resolution = ctx.dependencies.get(
        `${TOKEN_RESOLUTION_METRIC_ID}@${TOKEN_RESOLUTION_METRIC_VERSION}`,
      );
      const actual =
        options.actualMeasurementType !== undefined
          ? fromMeasurement(ctx, options.actualMeasurementType)
          : ctx.dependencies.get(actualDepKey);
      // 期望/实际任一缺失 → UNKNOWN（§27），不猜测结果。
      if (
        !resolution ||
        resolution.status !== 'AVAILABLE' ||
        !actual ||
        actual.status !== 'AVAILABLE'
      ) {
        return { ...UNKNOWN_RESULT, subjectId: ctx.subjectId };
      }
      const resolved = resolution.value as TokenResolutionPortResult | undefined;
      const expectedValue = resolved?.resolvedValue;
      let actualValue: unknown = actual.value;
      if (
        options.actualValueKey !== undefined &&
        typeof actualValue === 'object' &&
        actualValue !== null
      ) {
        actualValue = (actualValue as Record<string, unknown>)[options.actualValueKey];
      }
      const result = compareTokenValue(expectedValue, actualValue);
      if (result === 'UNKNOWN') {
        return { ...UNKNOWN_RESULT, subjectId: ctx.subjectId };
      }
      return {
        metricId: this.id,
        metricVersion: this.version,
        subjectId: ctx.subjectId,
        status: 'AVAILABLE',
        value: { result },
        dependencies: [],
        fingerprint: '',
      };
    },
  };
}

/** 直接从快照读取测量值（IMPL-09 §30：Actual 来自 Browser Measurement）。 */
function fromMeasurement(
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
