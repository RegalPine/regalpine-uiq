import { describe, expect, it } from 'vitest';
import type { MetricResult, Finding, Diagnostic, EvaluationResult, Evidence } from '@uiq/core';
import {
  groupMetricsByDomain,
  formatMetricValue,
  buildEvidenceTrace,
  extractDiagnosticSummary,
} from '@uiq/inspector';

function makeMetric(overrides: Partial<MetricResult> & { metricId: string }): MetricResult {
  return {
    metricVersion: '1.0.0',
    subjectId: 'btn-1',
    status: 'AVAILABLE',
    dependencies: [],
    fingerprint: 'fp-abc123',
    ...overrides,
  };
}

function makeEvidence(): Evidence {
  return { id: 'ev-001', type: 'MEASUREMENT', referenceId: 'm-001', relation: 'MEASURED_FROM' };
}

function makeFinding(overrides?: Partial<Finding>): Finding {
  const evaluation: EvaluationResult = {
    ruleId: 'ACCESSIBILITY.CONTRAST.WCAG_AA',
    ruleVersion: '1.0.0',
    subjectId: 'btn-1',
    state: 'FAIL',
    severity: 'HIGH',
    metricResult: makeMetric({ metricId: 'COLOR.CONTRAST', value: 3.2, unit: 'ratio' }),
    evidence: [makeEvidence()],
    fingerprint: 'eval-fp-001',
  };
  return {
    id: 'F-001',
    fingerprint: 'finding-fp-001',
    type: 'ACCESSIBILITY',
    state: 'DETECTED',
    severity: 'HIGH',
    subjectId: 'btn-1',
    evaluation,
    evidence: [makeEvidence()],
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  };
}

function makeDiagnostic(overrides?: Partial<Diagnostic>): Diagnostic {
  return {
    id: 'D-001',
    findingId: 'F-001',
    type: 'ACCESSIBILITY',
    cause: 'TOKEN',
    confidence: 'DIRECT',
    evidence: [makeEvidence()],
    explanation: 'Foreground contrast is below WCAG AA minimum',
    ...overrides,
  };
}

describe('P9: PanelHelpers — groupMetricsByDomain', () => {
  it('groups metrics by first segment of metricId', () => {
    const metrics = [
      makeMetric({ metricId: 'COLOR.SRGB' }),
      makeMetric({ metricId: 'COLOR.CONTRAST' }),
      makeMetric({ metricId: 'TYPOGRAPHY.FONT_SIZE' }),
      makeMetric({ metricId: 'GEOMETRY.WIDTH' }),
    ];
    const groups = groupMetricsByDomain(metrics);
    expect(groups.size).toBe(3);
    expect(groups.get('COLOR')).toHaveLength(2);
    expect(groups.get('TYPOGRAPHY')).toHaveLength(1);
    expect(groups.get('GEOMETRY')).toHaveLength(1);
  });

  it('empty input returns empty map', () => {
    expect(groupMetricsByDomain([]).size).toBe(0);
  });
});

describe('P9: PanelHelpers — formatMetricValue', () => {
  it('formats value with unit', () => {
    const m = makeMetric({ metricId: 'COLOR.CONTRAST', value: 4.5, unit: 'ratio' });
    expect(formatMetricValue(m)).toBe('4.5 ratio');
  });

  it('formats value without unit', () => {
    const m = makeMetric({ metricId: 'GEOMETRY.WIDTH', value: 100 });
    expect(formatMetricValue(m)).toBe('100');
  });

  it('returns status when value is undefined', () => {
    const m = makeMetric({ metricId: 'COLOR.SRGB', value: undefined, status: 'UNKNOWN' });
    expect(formatMetricValue(m)).toBe('UNKNOWN');
  });

  it('formats string value', () => {
    const m = makeMetric({ metricId: 'TYPOGRAPHY.FONT_FAMILY', value: 'Arial' });
    expect(formatMetricValue(m)).toBe('Arial');
  });
});

describe('P9: PanelHelpers — buildEvidenceTrace', () => {
  it('builds trace from Finding to Subject', () => {
    const finding = makeFinding();
    const trace = buildEvidenceTrace(finding);
    expect(trace).toHaveLength(4);
    expect(trace[0]).toContain('Finding:');
    expect(trace[1]).toContain('Evaluation:');
    expect(trace[2]).toContain('Metric:');
    expect(trace[3]).toContain('Subject:');
  });

  it('trace includes rule version', () => {
    const finding = makeFinding();
    const trace = buildEvidenceTrace(finding);
    expect(trace[1]).toContain('1.0.0');
  });
});

describe('P9: PanelHelpers — extractDiagnosticSummary', () => {
  it('returns observed from metric and explanation as expected', () => {
    const diagnostic = makeDiagnostic();
    const metric = makeMetric({ metricId: 'COLOR.CONTRAST', value: 3.2, unit: 'ratio' });
    const summary = extractDiagnosticSummary(diagnostic, metric);
    expect(summary.observed).toBe('3.2 ratio');
    expect(summary.expected).toBe('Foreground contrast is below WCAG AA minimum');
    expect(summary.difference).toBe('TOKEN');
  });

  it('returns N/A when no metric provided', () => {
    const diagnostic = makeDiagnostic();
    const summary = extractDiagnosticSummary(diagnostic);
    expect(summary.observed).toBe('N/A');
  });
});
