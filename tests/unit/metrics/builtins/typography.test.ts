import { describe, expect, it } from 'vitest';
import type { MetricCalculationContext, MeasurementSnapshot, MetricResult } from '@uiq/core';
import { TYPOGRAPHY_FONT_SIZE } from '@uiq/metrics';
import { TYPOGRAPHY_FONT_WEIGHT } from '@uiq/metrics';
import { TYPOGRAPHY_LINE_HEIGHT } from '@uiq/metrics';
import { TYPOGRAPHY_LETTER_SPACING } from '@uiq/metrics';
import { TYPOGRAPHY_TEXT_MEASURE } from '@uiq/metrics';
import { TYPOGRAPHY_SCALE_RATIO } from '@uiq/metrics';

const source = { type: 'STATIC' as const };

function makeSnapshot(
  measurements: Array<{ subjectId: string; type: string; value: unknown }>,
): MeasurementSnapshot {
  return {
    id: 'snap-typo',
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

describe('TYPOGRAPHY.FONT_SIZE', () => {
  it('提取 px 字号', () => {
    for (const size of [12, 14, 16, 24, 32]) {
      const snap = makeSnapshot([{ subjectId: 'e1', type: 'typography.font-size', value: size }]);
      const result = TYPOGRAPHY_FONT_SIZE.calculate(makeCtx(snap, 'e1'));
      expect(result.status).toBe('AVAILABLE');
      expect(result.value).toBe(size);
    }
  });

  it('缺失返回 UNKNOWN', () => {
    const result = TYPOGRAPHY_FONT_SIZE.calculate(makeCtx(makeSnapshot([]), 'e1'));
    expect(result.status).toBe('UNKNOWN');
  });
});

describe('TYPOGRAPHY.FONT_WEIGHT', () => {
  it('数值直接返回', () => {
    for (const w of [400, 500, 600, 700]) {
      const snap = makeSnapshot([{ subjectId: 'e1', type: 'typography.font-weight', value: w }]);
      const result = TYPOGRAPHY_FONT_WEIGHT.calculate(makeCtx(snap, 'e1'));
      expect(result.status).toBe('AVAILABLE');
      expect(result.value).toBe(w);
    }
  });

  it('normal → 400', () => {
    const snap = makeSnapshot([
      { subjectId: 'e1', type: 'typography.font-weight', value: 'normal' },
    ]);
    const result = TYPOGRAPHY_FONT_WEIGHT.calculate(makeCtx(snap, 'e1'));
    expect(result.value).toBe(400);
  });

  it('bold → 700', () => {
    const snap = makeSnapshot([{ subjectId: 'e1', type: 'typography.font-weight', value: 'bold' }]);
    const result = TYPOGRAPHY_FONT_WEIGHT.calculate(makeCtx(snap, 'e1'));
    expect(result.value).toBe(700);
  });

  it('变量字体精确值', () => {
    const snap = makeSnapshot([{ subjectId: 'e1', type: 'typography.font-weight', value: 350 }]);
    const result = TYPOGRAPHY_FONT_WEIGHT.calculate(makeCtx(snap, 'e1'));
    expect(result.value).toBe(350);
  });
});

describe('TYPOGRAPHY.LINE_HEIGHT', () => {
  it('数值 px', () => {
    const snap = makeSnapshot([{ subjectId: 'e1', type: 'typography.line-height', value: 24 }]);
    const result = TYPOGRAPHY_LINE_HEIGHT.calculate(makeCtx(snap, 'e1'));
    expect(result.status).toBe('AVAILABLE');
    expect((result.value as { px: number }).px).toBe(24);
  });

  it('对象 { px, ratio }', () => {
    const snap = makeSnapshot([
      { subjectId: 'e1', type: 'typography.line-height', value: { px: 24, ratio: 1.5 } },
    ]);
    const result = TYPOGRAPHY_LINE_HEIGHT.calculate(makeCtx(snap, 'e1'));
    const val = result.value as { px: number; ratio: number };
    expect(val.px).toBe(24);
    expect(val.ratio).toBe(1.5);
  });
});

describe('TYPOGRAPHY.LETTER_SPACING', () => {
  it('正值', () => {
    const snap = makeSnapshot([{ subjectId: 'e1', type: 'typography.letter-spacing', value: 2 }]);
    const result = TYPOGRAPHY_LETTER_SPACING.calculate(makeCtx(snap, 'e1'));
    expect(result.value).toBe(2);
  });

  it('负值', () => {
    const snap = makeSnapshot([
      { subjectId: 'e1', type: 'typography.letter-spacing', value: -0.5 },
    ]);
    const result = TYPOGRAPHY_LETTER_SPACING.calculate(makeCtx(snap, 'e1'));
    expect(result.value).toBe(-0.5);
  });

  it('零值', () => {
    const snap = makeSnapshot([{ subjectId: 'e1', type: 'typography.letter-spacing', value: 0 }]);
    const result = TYPOGRAPHY_LETTER_SPACING.calculate(makeCtx(snap, 'e1'));
    expect(result.value).toBe(0);
  });
});

describe('TYPOGRAPHY.TEXT_MEASURE', () => {
  it('提取文本宽度', () => {
    const snap = makeSnapshot([{ subjectId: 'e1', type: 'typography.text-measure', value: 320 }]);
    const result = TYPOGRAPHY_TEXT_MEASURE.calculate(makeCtx(snap, 'e1'));
    expect(result.value).toBe(320);
  });
});

describe('TYPOGRAPHY.SCALE_RATIO', () => {
  it('计算字号比例', () => {
    const snap = makeSnapshot([
      { subjectId: 'e1', type: 'typography.font-size', value: 24 },
      { subjectId: 'e1', type: 'typography.scale-ratio.reference', value: 'e2' },
      { subjectId: 'e2', type: 'typography.font-size', value: 16 },
    ]);
    const depMap = new Map<string, MetricResult>();
    depMap.set('TYPOGRAPHY.FONT_SIZE@1.0.0', {
      metricId: 'TYPOGRAPHY.FONT_SIZE',
      metricVersion: '1.0.0',
      subjectId: 'e1',
      status: 'AVAILABLE',
      value: 24,
      dependencies: [],
      fingerprint: 'fp',
    });
    const result = TYPOGRAPHY_SCALE_RATIO.calculate(makeCtx(snap, 'e1', depMap));
    expect(result.status).toBe('AVAILABLE');
    expect(result.value).toBe(1.5);
  });

  it('依赖 UNKNOWN 则 UNKNOWN', () => {
    const snap = makeSnapshot([]);
    const result = TYPOGRAPHY_SCALE_RATIO.calculate(makeCtx(snap, 'e1'));
    expect(result.status).toBe('UNKNOWN');
  });
});
