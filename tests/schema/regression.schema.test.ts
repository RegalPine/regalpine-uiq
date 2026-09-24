import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import Ajv2020 from 'ajv/dist/2020.js';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);

const REG_SCHEMA_ID = 'https://uiq.local/schemas/regression/1.0.0/regression';

const ajv = new Ajv2020({ strict: false, allErrors: true });
ajv.addSchema(
  JSON.parse(readFileSync(require.resolve('@uiq/core/schemas/contracts.schema.json'), 'utf-8')),
);
ajv.addSchema(
  JSON.parse(
    readFileSync(require.resolve('@uiq/regression/schemas/regression.schema.json'), 'utf-8'),
  ),
);

const HEX64 = 'a'.repeat(64);
const TIMESTAMP = 1700000000000;
const SOURCE = { type: 'STATIC' } as const;

function validate(def: string, value: unknown): { valid: boolean; errors: string[] } {
  const validateFn = ajv.getSchema(`${REG_SCHEMA_ID}#/$defs/${def}`);
  expect(validateFn, `Schema $defs.${def} 未定义`).toBeDefined();
  const valid = validateFn!(value) as boolean;
  const errors = (validateFn!.errors ?? []).map((e) => `${e.instancePath}: ${e.message}`);
  return { valid, errors };
}

const METRIC = {
  metricId: 'COLOR.CONTRAST',
  metricVersion: '1.0.0',
  subjectId: 'btn',
  value: 4.6,
  status: 'AVAILABLE',
  dependencies: [],
  fingerprint: HEX64,
};

const EVALUATION = {
  ruleId: 'ACCESSIBILITY.CONTRAST.WCAG_AA',
  ruleVersion: '1.0.0',
  subjectId: 'btn',
  state: 'PASS',
  severity: 'INFO',
  metricResult: METRIC,
  evidence: [],
  fingerprint: HEX64,
};

const SNAPSHOT = {
  id: 'snap-001',
  capturedAt: TIMESTAMP,
  source: SOURCE,
  measurements: [],
};

const ANALYSIS_SNAPSHOT = {
  schemaVersion: '1.0.0',
  snapshot: SNAPSHOT,
  metricResults: [METRIC],
  evaluations: [EVALUATION],
  findings: [],
  engine: { metrics: { name: '@uiq/metrics', version: '1.0.0' } },
};

const BASELINE = {
  id: 'bl-1',
  createdAt: '2026-09-24T00:00:00.000Z',
  schemaVersion: '1.0.0',
  engine: { name: 'uiq', version: '1.0.0' },
  snapshot: SNAPSHOT,
  metrics: [METRIC],
  evaluations: [EVALUATION],
  findings: [],
  approvedAt: '2026-09-24T00:00:00.000Z',
};

const ZERO_SUMMARY = {
  newFailures: 0,
  fixedFailures: 0,
  persistingFailures: 0,
  changedResults: 0,
  newUnknowns: 0,
  resolvedUnknowns: 0,
};

describe('AnalysisSnapshot 契约', () => {
  it('合法 AnalysisSnapshot → 通过', () => {
    const result = validate('AnalysisSnapshot', ANALYSIS_SNAPSHOT);
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it('缺 engine → 拒绝', () => {
    const { engine: _engine, ...withoutEngine } = ANALYSIS_SNAPSHOT;
    void _engine;
    expect(validate('AnalysisSnapshot', withoutEngine).valid).toBe(false);
  });

  it('evaluations 为空数组 → 通过（schema 层允许，approveBaseline 负责非空校验）', () => {
    const result = validate('AnalysisSnapshot', { ...ANALYSIS_SNAPSHOT, evaluations: [] });
    expect(result.valid).toBe(true);
  });
});

describe('Baseline 契约', () => {
  it('合法 Baseline → 通过', () => {
    const result = validate('Baseline', BASELINE);
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it('缺 approvedAt → 拒绝（显式批准字段必填）', () => {
    const { approvedAt: _approvedAt, ...withoutApprovedAt } = BASELINE;
    void _approvedAt;
    expect(validate('Baseline', withoutApprovedAt).valid).toBe(false);
  });

  it('缺 schemaVersion → 拒绝（可比性核验输入）', () => {
    const { schemaVersion: _schemaVersion, ...withoutSchemaVersion } = BASELINE;
    void _schemaVersion;
    expect(validate('Baseline', withoutSchemaVersion).valid).toBe(false);
  });

  it('额外未知字段 → 拒绝（additionalProperties: false）', () => {
    expect(validate('Baseline', { ...BASELINE, extra: true }).valid).toBe(false);
  });
});

describe('Diff 族', () => {
  it('MetricDiff：完整形状 → 通过；缺 changed → 拒绝', () => {
    expect(
      validate('MetricDiff', {
        metricId: 'COLOR.CONTRAST',
        metricVersion: '1.0.0',
        subjectId: 'btn',
        before: 4.9,
        after: 3.2,
        changed: true,
        delta: -1.7,
      }).valid,
    ).toBe(true);
    expect(
      validate('MetricDiff', { metricId: 'X', metricVersion: '1.0.0', subjectId: 'btn' }).valid,
    ).toBe(false);
  });

  it('EvaluationDiff：category 非法值 → 拒绝（六类之外不新增）', () => {
    expect(
      validate('EvaluationDiff', {
        ruleId: 'R',
        ruleVersion: '1.0.0',
        subjectId: 'btn',
        before: 'PASS',
        after: 'FAIL',
        category: 'NEW_FAILURE',
      }).valid,
    ).toBe(true);
    expect(
      validate('EvaluationDiff', {
        ruleId: 'R',
        ruleVersion: '1.0.0',
        subjectId: 'btn',
        before: 'PASS',
        after: 'FAIL',
        category: 'SOMEWHAT_WORSE',
      }).valid,
    ).toBe(false);
  });

  it('FindingDiff：status 枚举 + contentChanged → 通过；非法 status → 拒绝', () => {
    expect(
      validate('FindingDiff', {
        logicKey: 'btn|R@1.0.0',
        status: 'MATCHED',
        contentChanged: false,
      }).valid,
    ).toBe(true);
    expect(
      validate('FindingDiff', {
        logicKey: 'btn|R@1.0.0',
        status: 'CHANGED',
        contentChanged: false,
      }).valid,
    ).toBe(false);
  });

  it('MissingTarget：side 枚举 → 通过/拒绝', () => {
    expect(validate('MissingTarget', { subjectId: 'gone', side: 'BASELINE_ONLY' }).valid).toBe(
      true,
    );
    expect(validate('MissingTarget', { subjectId: 'gone', side: 'GONE' }).valid).toBe(false);
  });
});

describe('RegressionRecord / Summary / Report', () => {
  it('Record：RULE + category → 通过；category: null（FINDING/无分类）→ 通过', () => {
    expect(
      validate('RegressionRecord', {
        baselineSnapshotId: 'snap-001',
        currentSnapshotId: 'snap-002',
        subjectId: 'btn',
        kind: 'RULE',
        identity: 'R@1.0.0|btn',
        category: 'NEW_FAILURE',
        before: 'PASS',
        after: 'FAIL',
      }).valid,
    ).toBe(true);
    expect(
      validate('RegressionRecord', {
        baselineSnapshotId: 'snap-001',
        currentSnapshotId: 'snap-002',
        subjectId: 'btn',
        kind: 'FINDING',
        identity: 'btn|R@1.0.0',
        category: null,
      }).valid,
    ).toBe(true);
  });

  it('Record：kind 非法 → 拒绝', () => {
    expect(
      validate('RegressionRecord', {
        baselineSnapshotId: 'a',
        currentSnapshotId: 'b',
        subjectId: 'btn',
        kind: 'TOKEN',
        identity: 'x',
        category: null,
      }).valid,
    ).toBe(false);
  });

  it('Summary：全零六计数 → 通过；负数 → 拒绝', () => {
    expect(validate('RegressionSummary', ZERO_SUMMARY).valid).toBe(true);
    expect(validate('RegressionSummary', { ...ZERO_SUMMARY, newFailures: -1 }).valid).toBe(false);
  });

  it('Report：完整形状 → 通过；缺 fingerprint → 拒绝', () => {
    const report = {
      baselineId: 'bl-1',
      currentSnapshotId: 'snap-002',
      metricChanges: [],
      evaluationChanges: [],
      findingChanges: [],
      missingTargets: [],
      summary: ZERO_SUMMARY,
      records: [],
      fingerprint: HEX64,
    };
    expect(validate('RegressionReport', report).valid).toBe(true);
    const { fingerprint: _fingerprint, ...withoutFingerprint } = report;
    void _fingerprint;
    expect(validate('RegressionReport', withoutFingerprint).valid).toBe(false);
  });

  it('Report：fingerprint 非 64hex → 拒绝（core Fingerprint 契约）', () => {
    expect(
      validate('RegressionReport', {
        baselineId: 'bl-1',
        currentSnapshotId: 'snap-002',
        metricChanges: [],
        evaluationChanges: [],
        findingChanges: [],
        missingTargets: [],
        summary: ZERO_SUMMARY,
        records: [],
        fingerprint: 'not-a-hash',
      }).valid,
    ).toBe(false);
  });
});
