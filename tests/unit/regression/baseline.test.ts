import { describe, expect, it } from 'vitest';
import type { EvaluationResult, Finding, MetricResult } from '@uiq/core';
import {
  approveBaseline,
  BaselineInputError,
  BaselineStoreError,
  createInMemoryBaselineStore,
  deserializeBaseline,
  serializeBaseline,
  type AnalysisSnapshot,
  type Baseline,
} from '@uiq/regression';

const METRIC: MetricResult = {
  metricId: 'COLOR.CONTRAST',
  metricVersion: '1.0.0',
  subjectId: 'button.primary',
  value: 5.17,
  status: 'AVAILABLE',
  dependencies: [],
  fingerprint: 'fp-metric-1',
};

const EVALUATION: EvaluationResult = {
  ruleId: 'ACCESSIBILITY.CONTRAST.WCAG_AA',
  ruleVersion: '1.0.0',
  subjectId: 'button.primary',
  state: 'PASS',
  severity: 'INFO',
  metricResult: METRIC,
  evidence: [],
  fingerprint: 'fp-eval-1',
};

const FINDING: Finding = {
  id: 'finding-1',
  fingerprint: 'fp-finding-1',
  type: 'ACCESSIBILITY',
  state: 'DETECTED',
  severity: 'MEDIUM',
  subjectId: 'button.primary',
  evaluation: EVALUATION,
  evidence: [],
  createdAt: 1700000000000,
  updatedAt: 1700000000000,
};

function makeSnapshot(overrides?: Partial<AnalysisSnapshot>): AnalysisSnapshot {
  return {
    schemaVersion: '1.0.0',
    snapshot: {
      id: 'snap-001',
      capturedAt: 1700000000000,
      source: { type: 'STATIC' },
      measurements: [],
    },
    metricResults: [METRIC],
    evaluations: [EVALUATION],
    findings: [FINDING],
    engine: {
      metrics: { name: '@uiq/metrics', version: '1.0.0' },
      rules: { name: '@uiq/rules', version: '1.0.0' },
    },
    ...overrides,
  };
}

describe('approveBaseline：显式批准是唯一入口（ARCH-01 §5.1 / PLAN P6-02）', () => {
  it('批准成功：字段投影与扩展保留', () => {
    const baseline = approveBaseline(makeSnapshot({ themeId: 'light' }), {
      id: 'bl-001',
      approvedAt: '2026-09-24T00:00:00.000Z',
    });
    expect(baseline.id).toBe('bl-001');
    expect(baseline.engine).toEqual({ name: 'uiq', version: '1.0.0' });
    expect(baseline.metrics).toHaveLength(1);
    expect(baseline.evaluations).toHaveLength(1);
    expect(baseline.themeId).toBe('light');
    expect(baseline.engines).toEqual(makeSnapshot().engine);
    expect(baseline.approvedAt).toBe('2026-09-24T00:00:00.000Z');
  });

  it('缺 schemaVersion / 空 evaluations / 缺 engine → 拒绝批准', () => {
    expect(() =>
      approveBaseline(makeSnapshot({ schemaVersion: '' }), { id: 'x', approvedAt: 't' }),
    ).toThrow(BaselineInputError);
    expect(() =>
      approveBaseline(makeSnapshot({ evaluations: [] }), { id: 'x', approvedAt: 't' }),
    ).toThrow(/evaluations 为空/);
    expect(() =>
      approveBaseline(makeSnapshot({ engine: {} }), { id: 'x', approvedAt: 't' }),
    ).toThrow(/engine/);
  });

  it('空 findings 合法（全 PASS 基线），空 evaluations 不合法', () => {
    const baseline = approveBaseline(makeSnapshot({ findings: [] }), {
      id: 'bl-clean',
      approvedAt: '2026-09-24T00:00:00.000Z',
    });
    expect(baseline.findings).toEqual([]);
  });

  it('显式 engine 与 config 保留（基线保留版本/配置）', () => {
    const baseline = approveBaseline(makeSnapshot(), {
      id: 'bl-002',
      approvedAt: '2026-09-24T00:00:00.000Z',
      engine: { name: 'uiq', version: '1.0.0' },
      config: { threshold: 4.5 },
    });
    expect(baseline.engine).toEqual({ name: 'uiq', version: '1.0.0' });
    expect(baseline.config).toEqual({ threshold: 4.5 });
  });
});

describe('BaselineStore：不默认覆盖（PLAN P6-02）', () => {
  it('save/load/list 往返', () => {
    const store = createInMemoryBaselineStore();
    const baseline = approveBaseline(makeSnapshot(), { id: 'bl-1', approvedAt: 't1' });
    store.save(baseline);
    expect(store.load('bl-1')).toEqual(baseline);
    expect(store.list()).toHaveLength(1);
    expect(store.load('missing')).toBeUndefined();
  });

  it('同 id 重复 save 默认拒绝，显式 overwrite 才可', () => {
    const store = createInMemoryBaselineStore();
    const first = approveBaseline(makeSnapshot(), { id: 'bl-1', approvedAt: 't1' });
    const second = approveBaseline(makeSnapshot({ themeId: 'dark' }), {
      id: 'bl-1',
      approvedAt: 't2',
    });
    store.save(first);
    expect(() => store.save(second)).toThrow(BaselineStoreError);
    expect(store.load('bl-1')).toEqual(first);
    store.save(second, { overwrite: true });
    expect(store.load('bl-1')).toEqual(second);
  });
});

describe('Baseline 序列化（IMPL-11 §69：JSON 存储）', () => {
  const baseline: Baseline = approveBaseline(
    makeSnapshot({ themeId: 'light', config: { threshold: 4.5 } }),
    { id: 'bl-ser', approvedAt: '2026-09-24T00:00:00.000Z', createdAt: '2026-09-23T00:00:00.000Z' },
  );

  it('serialize → deserialize 往返保真（深度相等）', () => {
    const round = deserializeBaseline(serializeBaseline(baseline));
    expect(round).toEqual(baseline);
  });

  it('序列化键序确定（canonical JSON）', () => {
    expect(serializeBaseline(baseline)).toBe(serializeBaseline(baseline));
  });

  it('非法 JSON / 缺字段 → BaselineInputError', () => {
    expect(() => deserializeBaseline('{not json')).toThrow(BaselineInputError);
    expect(() => deserializeBaseline('{"id":"x"}')).toThrow(BaselineInputError);
  });
});
