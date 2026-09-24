import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));

const REPORT_SCHEMA = JSON.parse(
  readFileSync(
    join(here, '../../packages/reporting/schemas/ui-quality-report.schema.json'),
    'utf-8',
  ),
) as { $id: string };

const ajv = new Ajv2020({ strict: false, allErrors: true });
ajv.addSchema(REPORT_SCHEMA);

const HEX64 = 'a'.repeat(64);

function validateReport(value: unknown): { valid: boolean; errors: string[] } {
  const validateFn = ajv.getSchema(REPORT_SCHEMA.$id);
  expect(validateFn, 'ui-quality-report schema 未注册').toBeDefined();
  const valid = validateFn!(value) as boolean;
  const errors = (validateFn!.errors ?? []).map((e) => `${e.instancePath}: ${e.message}`);
  return { valid, errors };
}

function minimalReport(): Record<string, unknown> {
  return {
    id: HEX64,
    version: '1.0.0',
    projectId: 'proj-1',
    generatedAt: '2026-09-24T00:00:00.000Z',
    scope: {
      snapshotIds: ['snap-001'],
      subjects: ['btn'],
      themes: [],
      viewports: [],
      generatedFrom: 'ANALYSIS',
    },
    summary: {
      measuredElements: 1,
      metricResults: 1,
      evaluations: 1,
      pass: 1,
      fail: 0,
      warn: 0,
      unknown: 0,
      notApplicable: 0,
      error: 0,
      findings: 0,
    },
    dimensions: [],
    findings: [],
    diagnostics: [],
    recommendations: [],
    reproducibility: {
      deterministic: true,
      engine: { name: '@uiq/metrics', version: '1.0.0' },
      metricVersions: ['COLOR.CONTRAST@1.0.0'],
      ruleVersions: ['ACCESSIBILITY.CONTRAST.WCAG_AA@1.0.0'],
    },
  };
}

describe('ui-quality-report schema（IMPL-17 §41 / AC-RPT-13）', () => {
  it('最小合法报告通过', () => {
    const result = validateReport(minimalReport());
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it('完整报告（含 findings/recommendations/conformance/regression）通过', () => {
    const report = minimalReport();
    report.findings = [
      {
        id: 'f1',
        findingType: 'ACCESSIBILITY',
        severity: 'HIGH',
        subjectId: 'btn',
        ruleId: 'ACCESSIBILITY.CONTRAST.WCAG_AA',
        ruleVersion: '1.0.0',
        state: 'DETECTED',
        fingerprint: HEX64,
        diagnosticIds: ['d1'],
      },
    ];
    report.diagnostics = [
      {
        id: 'd1',
        findingId: 'f1',
        type: 'ACCESSIBILITY',
        cause: 'TOKEN',
        confidence: 'DIRECT',
        explanation: 'x',
      },
    ];
    report.recommendations = [
      {
        id: HEX64,
        type: 'REVIEW_ACCESSIBILITY',
        title: 'Accessibility color relationship',
        dimension: 'ACCESSIBILITY',
        targetType: 'ELEMENT',
        targetIds: ['btn'],
        rationale: 'Review accessibility color relationship.',
        evidence: [],
        impact: {
          affectedElements: 1,
          affectedComponents: 0,
          affectedTokens: [],
          affectedThemes: [],
          potentialRegressionAreas: ['ACCESSIBILITY'],
        },
        verification: [
          {
            metricId: 'COLOR.CONTRAST',
            metricVersion: '1.0.0',
            ruleId: 'ACCESSIBILITY.CONTRAST.WCAG_AA',
            ruleVersion: '1.0.0',
            expectedState: 'PASS',
          },
        ],
        affectedFindingIds: ['f1'],
      },
    ];
    report.conformance = {
      level: 'CORE',
      total: 1,
      passed: 1,
      failed: 0,
      unknown: 0,
      errors: 0,
      engine: { name: 'e', version: '1' },
    };
    report.regression = {
      summary: {
        newFailures: 0,
        fixedFailures: 1,
        persistingFailures: 0,
        changedResults: 0,
        newUnknowns: 0,
        resolvedUnknowns: 0,
      },
    };
    const result = validateReport(report);
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it('拒绝：缺少 required 字段（IMPL-17 §41 集合）', () => {
    for (const key of [
      'id',
      'version',
      'projectId',
      'summary',
      'dimensions',
      'findings',
      'recommendations',
      'reproducibility',
    ]) {
      const report = minimalReport();
      delete report[key];
      expect(validateReport(report).valid, `缺少 ${key} 应被拒绝`).toBe(false);
    }
  });

  it('拒绝：id/建议 ID 非 SHA-256 十六进制', () => {
    const report = minimalReport();
    report.id = 'not-a-fingerprint';
    expect(validateReport(report).valid).toBe(false);
  });

  it('拒绝：summary 计数为负数或非整数', () => {
    const report = minimalReport();
    (report.summary as Record<string, unknown>).fail = -1;
    expect(validateReport(report).valid).toBe(false);
    (report.summary as Record<string, unknown>).fail = 1.5;
    expect(validateReport(report).valid).toBe(false);
  });

  it('拒绝：维度枚举外值', () => {
    const report = minimalReport();
    report.dimensions = [
      {
        dimension: 'MOOD',
        evaluations: 0,
        pass: 0,
        fail: 0,
        warn: 0,
        unknown: 0,
        notApplicable: 0,
        error: 0,
        findings: 0,
      },
    ];
    expect(validateReport(report).valid).toBe(false);
  });

  it('拒绝：reproducibility.deterministic 非 true', () => {
    const report = minimalReport();
    (report.reproducibility as Record<string, unknown>).deterministic = false;
    expect(validateReport(report).valid).toBe(false);
  });
});
