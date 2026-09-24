import { describe, expect, it } from 'vitest';
import type { MetricCalculationContext, MeasurementSnapshot, MetricResult } from '@uiq/core';
import { COLOR_SRGB } from '@uiq/metrics';
import { COLOR_OKLAB } from '@uiq/metrics';
import { COLOR_OKLCH } from '@uiq/metrics';
import { COLOR_LIGHTNESS } from '@uiq/metrics';
import { COLOR_CHROMA } from '@uiq/metrics';
import { COLOR_HUE } from '@uiq/metrics';
import { COLOR_CONTRAST } from '@uiq/metrics';

const source = { type: 'STATIC' as const };

function makeSnapshot(
  measurements: Array<{ subjectId: string; type: string; value: unknown }>,
): MeasurementSnapshot {
  return {
    id: 'snap-color',
    capturedAt: 1000,
    source,
    measurements: measurements.map((m, i) => ({
      id: `m-${i}`,
      subjectId: m.subjectId,
      type: m.type,
      value: m.value,
      status: 'AVAILABLE' as const,
      source,
      timestamp: 1000,
    })),
  };
}

function makeCtx(
  snapshot: MeasurementSnapshot,
  subjectId: string,
  deps: Map<string, MetricResult> = new Map(),
): MetricCalculationContext {
  return { subjectId, snapshot, dependencies: deps };
}

describe('COLOR.SRGB', () => {
  it('提取 sRGB 值', () => {
    const snap = makeSnapshot([
      { subjectId: 'e1', type: 'color.srgb', value: { r: 1, g: 0, b: 0, alpha: 1 } },
    ]);
    const result = COLOR_SRGB.calculate(makeCtx(snap, 'e1'));
    expect(result.status).toBe('AVAILABLE');
    expect(result.value).toEqual({ r: 1, g: 0, b: 0, alpha: 1 });
  });

  it('缺失测量值返回 UNKNOWN', () => {
    const snap = makeSnapshot([]);
    const result = COLOR_SRGB.calculate(makeCtx(snap, 'e1'));
    expect(result.status).toBe('UNKNOWN');
  });
});

describe('COLOR.OKLAB', () => {
  it('从 SRGB 计算 OKLab', () => {
    const srgbValue = { r: 1, g: 0, b: 0, alpha: 1 };
    const snap = makeSnapshot([{ subjectId: 'e1', type: 'color.srgb', value: srgbValue }]);
    const depMap = new Map<string, MetricResult>();
    depMap.set('COLOR.SRGB@1.0.0', {
      metricId: 'COLOR.SRGB',
      metricVersion: '1.0.0',
      subjectId: 'e1',
      status: 'AVAILABLE',
      value: srgbValue,
      dependencies: [],
      fingerprint: 'fp',
    });
    const result = COLOR_OKLAB.calculate(makeCtx(snap, 'e1', depMap));
    expect(result.status).toBe('AVAILABLE');
    const lab = result.value as { L: number; a: number; b: number };
    expect(typeof lab.L).toBe('number');
    expect(typeof lab.a).toBe('number');
    expect(typeof lab.b).toBe('number');
  });

  it('依赖 UNKNOWN 则 UNKNOWN', () => {
    const snap = makeSnapshot([]);
    const depMap = new Map<string, MetricResult>();
    depMap.set('COLOR.SRGB@1.0.0', {
      metricId: 'COLOR.SRGB',
      metricVersion: '1.0.0',
      subjectId: 'e1',
      status: 'UNKNOWN',
      dependencies: [],
      fingerprint: '',
    });
    const result = COLOR_OKLAB.calculate(makeCtx(snap, 'e1', depMap));
    expect(result.status).toBe('UNKNOWN');
  });
});

describe('COLOR.OKLCH', () => {
  it('从 OKLab 计算 OKLCH', () => {
    const labValue = { L: 0.5, a: 0.2, b: 0.1 };
    const snap = makeSnapshot([]);
    const depMap = new Map<string, MetricResult>();
    depMap.set('COLOR.OKLAB@1.0.0', {
      metricId: 'COLOR.OKLAB',
      metricVersion: '1.0.0',
      subjectId: 'e1',
      status: 'AVAILABLE',
      value: labValue,
      dependencies: [],
      fingerprint: 'fp',
    });
    const result = COLOR_OKLCH.calculate(makeCtx(snap, 'e1', depMap));
    expect(result.status).toBe('AVAILABLE');
    const lch = result.value as { L: number; C: number; H: number | 'UNDEFINED' };
    expect(typeof lch.L).toBe('number');
    expect(typeof lch.C).toBe('number');
  });
});

describe('COLOR.LIGHTNESS', () => {
  it('提取 L 分量', () => {
    const labValue = { L: 0.73, a: 0.2, b: 0.1 };
    const depMap = new Map<string, MetricResult>();
    depMap.set('COLOR.OKLAB@1.0.0', {
      metricId: 'COLOR.OKLAB',
      metricVersion: '1.0.0',
      subjectId: 'e1',
      status: 'AVAILABLE',
      value: labValue,
      dependencies: [],
      fingerprint: 'fp',
    });
    const result = COLOR_LIGHTNESS.calculate(makeCtx(makeSnapshot([]), 'e1', depMap));
    expect(result.status).toBe('AVAILABLE');
    expect(result.value).toBe(0.73);
  });
});

describe('COLOR.CHROMA', () => {
  it('提取 C 分量', () => {
    const lchValue = { L: 0.5, C: 0.3, H: { degrees: 120 } };
    const depMap = new Map<string, MetricResult>();
    depMap.set('COLOR.OKLCH@1.0.0', {
      metricId: 'COLOR.OKLCH',
      metricVersion: '1.0.0',
      subjectId: 'e1',
      status: 'AVAILABLE',
      value: lchValue,
      dependencies: [],
      fingerprint: 'fp',
    });
    const result = COLOR_CHROMA.calculate(makeCtx(makeSnapshot([]), 'e1', depMap));
    expect(result.status).toBe('AVAILABLE');
    expect(result.value).toBe(0.3);
  });
});

describe('COLOR.HUE', () => {
  it('提取 H 分量', () => {
    const lchValue = { L: 0.5, C: 0.3, H: 270 as number | 'UNDEFINED' };
    const depMap = new Map<string, MetricResult>();
    depMap.set('COLOR.OKLCH@1.0.0', {
      metricId: 'COLOR.OKLCH',
      metricVersion: '1.0.0',
      subjectId: 'e1',
      status: 'AVAILABLE',
      value: lchValue,
      dependencies: [],
      fingerprint: 'fp',
    });
    const result = COLOR_HUE.calculate(makeCtx(makeSnapshot([]), 'e1', depMap));
    expect(result.status).toBe('AVAILABLE');
    expect(result.value).toBe(270);
  });
});

describe('COLOR.CONTRAST', () => {
  it('黑/白对比度 = 21', () => {
    const snap = makeSnapshot([
      { subjectId: 'e1', type: 'color.srgb', value: { r: 0, g: 0, b: 0, alpha: 1 } },
      { subjectId: 'e1', type: 'color.srgb.background', value: { r: 1, g: 1, b: 1, alpha: 1 } },
    ]);
    const result = COLOR_CONTRAST.calculate(makeCtx(snap, 'e1'));
    expect(result.status).toBe('AVAILABLE');
    expect((result.value as { ratio: number }).ratio).toBe(21);
  });

  it('缺少背景返回 UNKNOWN', () => {
    const snap = makeSnapshot([
      { subjectId: 'e1', type: 'color.srgb', value: { r: 0, g: 0, b: 0, alpha: 1 } },
    ]);
    const result = COLOR_CONTRAST.calculate(makeCtx(snap, 'e1'));
    expect(result.status).toBe('UNKNOWN');
  });

  it('相同颜色对比度 = 1', () => {
    const snap = makeSnapshot([
      { subjectId: 'e1', type: 'color.srgb', value: { r: 0.5, g: 0.5, b: 0.5, alpha: 1 } },
      {
        subjectId: 'e1',
        type: 'color.srgb.background',
        value: { r: 0.5, g: 0.5, b: 0.5, alpha: 1 },
      },
    ]);
    const result = COLOR_CONTRAST.calculate(makeCtx(snap, 'e1'));
    expect(result.status).toBe('AVAILABLE');
    expect((result.value as { ratio: number }).ratio).toBe(1);
  });
});
