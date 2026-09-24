import { describe, expect, it } from 'vitest';
import { parseHex } from '@uiq/color';
import type { MeasurementSnapshot, MetricCalculationContext, MetricResult } from '@uiq/core';
import {
  createTokenDeviationMetric,
  createTokenMatchMetric,
  createTokenResolutionMetric,
  type TokenResolutionPort,
} from '@uiq/metrics';

const emptySnapshot: MeasurementSnapshot = {
  id: 'snap',
  capturedAt: 0,
  source: { type: 'OTHER' },
  measurements: [],
};

function ctx(subjectId: string, deps: readonly MetricResult[]): MetricCalculationContext {
  return {
    subjectId,
    snapshot: emptySnapshot,
    dependencies: new Map(deps.map((d) => [`${d.metricId}@${d.metricVersion}`, d])),
  };
}

function dep(
  metricId: string,
  value: unknown,
  status: 'AVAILABLE' | 'UNKNOWN' | 'ERROR' = 'AVAILABLE',
): MetricResult {
  return {
    metricId,
    metricVersion: '1.0.0',
    subjectId: 'x',
    status,
    ...(status === 'AVAILABLE' ? { value } : {}),
    dependencies: [],
    fingerprint: 'a'.repeat(64),
  };
}

/** port fake：按 tokenId 表驱动返回结果（计划：port fake 驱动三指标全状态）。 */
function portFake(
  outcomes: Readonly<
    Record<
      string,
      {
        status: 'RESOLVED' | 'UNKNOWN' | 'ERROR';
        resolvedValue?: unknown;
        chain?: readonly string[];
      }
    >
  >,
): TokenResolutionPort {
  return {
    resolve(tokenId) {
      const outcome = outcomes[tokenId];
      if (!outcome) return { status: 'UNKNOWN' };
      return outcome.status === 'RESOLVED'
        ? { status: 'RESOLVED', resolvedValue: outcome.resolvedValue, chain: outcome.chain ?? [] }
        : {
            status: outcome.status,
            ...(outcome.chain !== undefined ? { chain: outcome.chain } : {}),
          };
    },
  };
}

describe('TOKEN.RESOLUTION@1.0.0（IMPL-09 §26）', () => {
  const metric = createTokenResolutionMetric(
    portFake({
      't.resolved': { status: 'RESOLVED', resolvedValue: '#2563EB', chain: ['t.resolved', 'p'] },
      't.unknown': { status: 'UNKNOWN' },
      't.error': { status: 'ERROR', chain: ['a', 'b', 'a'] },
    }),
  );

  it('RESOLVED → AVAILABLE，value 含 resolvedValue 与 resolutionChain', () => {
    const result = metric.calculate(ctx('t.resolved', []));
    expect(result.status).toBe('AVAILABLE');
    expect(result.value).toEqual({
      resolvedValue: '#2563EB',
      resolutionChain: ['t.resolved', 'p'],
    });
    expect(result.metadata?.['source']).toBe('TOKEN_RESOLUTION_PORT');
  });

  it('UNKNOWN → UNKNOWN（不伪造值）', () => {
    const result = metric.calculate(ctx('t.unknown', []));
    expect(result.status).toBe('UNKNOWN');
    expect(result.value).toBeUndefined();
    expect(result.metadata?.['reason']).toBe('TOKEN_UNRESOLVED');
  });

  it('ERROR（环）→ ERROR，metadata 保留环路径', () => {
    const result = metric.calculate(ctx('t.error', []));
    expect(result.status).toBe('ERROR');
    expect(result.metadata?.['reason']).toBe('TOKEN_RESOLUTION_PORT_ERROR');
    expect(result.metadata?.['chain']).toEqual(['a', 'b', 'a']);
  });
});

describe('TOKEN.MATCH@1.0.0（IMPL-09 §27）', () => {
  const metric = createTokenMatchMetric();

  function matchCtx(
    expected: unknown,
    actual: unknown,
    resStatus: 'AVAILABLE' | 'UNKNOWN' = 'AVAILABLE',
  ) {
    return ctx('t.color', [
      dep('TOKEN.RESOLUTION', { resolvedValue: expected, resolutionChain: ['t.color'] }, resStatus),
      ...(actual !== undefined ? [dep('COLOR.SRGB', actual)] : []),
    ]);
  }

  it('颜色精确匹配 → MATCH（canonical sRGB 四通道）', () => {
    const result = metric.calculate(matchCtx('#2563EB', parseHex('#2563EB')));
    expect(result.status).toBe('AVAILABLE');
    expect(result.value).toEqual({ result: 'MATCH' });
  });

  it('颜色不一致 → NO_MATCH（含 alpha 差异）', () => {
    expect(metric.calculate(matchCtx('#2563EB', parseHex('#1D4ED8'))).value).toEqual({
      result: 'NO_MATCH',
    });
    expect(
      metric.calculate(matchCtx('#2563EB', { ...parseHex('#2563EB'), alpha: 0.5 })).value,
    ).toEqual({ result: 'NO_MATCH' });
  });

  it('期望/实际任一缺失 → UNKNOWN', () => {
    expect(metric.calculate(matchCtx('#2563EB', undefined)).status).toBe('UNKNOWN');
    const missingResolution = metric.calculate(
      ctx('t.color', [dep('COLOR.SRGB', parseHex('#2563EB'))]),
    );
    expect(missingResolution.status).toBe('UNKNOWN');
    expect(metric.calculate(matchCtx('#2563EB', parseHex('#2563EB'), 'UNKNOWN')).status).toBe(
      'UNKNOWN',
    );
  });

  it('形态不匹配 → UNKNOWN（非 hex 期望 vs SRGB 实测）', () => {
    const result = metric.calculate(matchCtx('not-a-color', parseHex('#2563EB')));
    expect(result.status).toBe('UNKNOWN');
  });

  it('数值 token：严格相等（偏差量化交给 DEVIATION）', () => {
    const numeric = createTokenMatchMetric({ actualMetricId: 'TEST.PX' });
    const build = (expected: number, actual: number) =>
      numeric.calculate(
        ctx('t.size', [
          dep('TOKEN.RESOLUTION', { resolvedValue: expected, resolutionChain: ['t.size'] }),
          dep('TEST.PX', actual),
        ]),
      );
    expect(build(16, 16).value).toEqual({ result: 'MATCH' });
    expect(build(16, 17).value).toEqual({ result: 'NO_MATCH' });
  });

  it('字符串 token：严格相等', () => {
    const textual = createTokenMatchMetric({ actualMetricId: 'TEST.STR' });
    const build = (expected: string, actual: string) =>
      textual.calculate(
        ctx('t.text', [
          dep('TOKEN.RESOLUTION', { resolvedValue: expected, resolutionChain: ['t.text'] }),
          dep('TEST.STR', actual),
        ]),
      );
    expect(build('bold', 'bold').value).toEqual({ result: 'MATCH' });
    expect(build('bold', 'normal').value).toEqual({ result: 'NO_MATCH' });
  });

  it('actualValueKey 从对象实测值提取字段', () => {
    const keyed = createTokenMatchMetric({ actualMetricId: 'TEST.PX', actualValueKey: 'px' });
    const result = keyed.calculate(
      ctx('t.size', [
        dep('TOKEN.RESOLUTION', { resolvedValue: 16, resolutionChain: ['t.size'] }),
        dep('TEST.PX', { px: 16 }),
      ]),
    );
    expect(result.value).toEqual({ result: 'MATCH' });
  });
});

describe('TOKEN.DEVIATION@1.0.0（IMPL-09 §28-29）', () => {
  const metric = createTokenDeviationMetric();

  function deviationCtx(expected: unknown, actual: unknown) {
    return ctx('t.dev', [
      dep('TOKEN.RESOLUTION', { resolvedValue: expected, resolutionChain: ['t.dev'] }),
      dep('COLOR.SRGB', actual),
    ]);
  }

  it('同色 → 全零偏差；有彩色 deltaH 为数值；metadata.method 声明数学定义', () => {
    const result = metric.calculate(deviationCtx('#2563EB', parseHex('#2563EB')));
    expect(result.status).toBe('AVAILABLE');
    expect(result.value).toEqual({ type: 'COLOR', deltaL: 0, deltaC: 0, deltaH: 0, deltaE: 0 });
    expect(result.metadata?.['method']).toBe('OKLAB_EUCLIDEAN@1.0');
  });

  it('无彩色（黑）→ deltaH 为 null（色相未定义，不猜测）', () => {
    const result = metric.calculate(deviationCtx('#000000', parseHex('#000000')));
    expect(result.value).toEqual({ type: 'COLOR', deltaL: 0, deltaC: 0, deltaH: null, deltaE: 0 });
  });

  it('黑白锚定：deltaL 与 deltaE ≈ 1.0（OKLab L 差）', () => {
    const result = metric.calculate(deviationCtx('#000000', parseHex('#FFFFFF')));
    const value = result.value as { deltaL: number; deltaE: number };
    expect(value.deltaL).toBeCloseTo(1, 5);
    expect(value.deltaE).toBeCloseTo(1, 5);
  });

  it('手写偏差反例 #2563EB vs #1D4ED8：ΔE>0 且 |ΔL| ≤ ΔE（回归锚定 ≈ 0.0583）', () => {
    const result = metric.calculate(deviationCtx('#2563EB', parseHex('#1D4ED8')));
    const value = result.value as {
      type: string;
      deltaL: number;
      deltaC: number;
      deltaH: number | null;
      deltaE: number;
    };
    expect(value.type).toBe('COLOR');
    expect(value.deltaE).toBeCloseTo(0.05826, 4);
    expect(value.deltaL).toBeLessThan(0); // blue700 更暗：actual - expected < 0
    expect(Math.abs(value.deltaL)).toBeLessThanOrEqual(value.deltaE + 1e-12);
    expect(value.deltaH).not.toBeNull();
  });

  it('数值 token：absolute 与 relative；期望为 0 时 relative 为 null', () => {
    const numeric = createTokenDeviationMetric({ actualMetricId: 'TEST.PX' });
    const build = (expected: number, actual: number) =>
      numeric.calculate(
        ctx('t.size', [
          dep('TOKEN.RESOLUTION', { resolvedValue: expected, resolutionChain: ['t.size'] }),
          dep('TEST.PX', actual),
        ]),
      );
    expect(build(16, 17).value).toEqual({ type: 'NUMERIC', absolute: 1, relative: 0.0625 });
    expect(build(0, 5).value).toEqual({ type: 'NUMERIC', absolute: 5, relative: null });
  });

  it('形态不匹配 → UNKNOWN', () => {
    expect(metric.calculate(deviationCtx('not-a-color', parseHex('#2563EB'))).status).toBe(
      'UNKNOWN',
    );
  });
});
