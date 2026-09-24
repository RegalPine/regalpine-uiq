import { describe, expect, it } from 'vitest';
import type {
  MetricResult,
  EvaluationResult,
  Finding,
  Diagnostic,
  Evidence,
  MeasurementSnapshot,
} from '@uiq/core';
import { exportJson, exportMarkdown, exportHtml, importJson } from '@uiq/inspector';
import type { InspectionResult, ExportMetadata } from '@uiq/inspector';

function makeEvidence(): Evidence {
  return { id: 'ev-001', type: 'MEASUREMENT', referenceId: 'm-001', relation: 'MEASURED_FROM' };
}

function makeMetric(): MetricResult {
  return {
    metricId: 'COLOR.CONTRAST',
    metricVersion: '1.0.0',
    subjectId: 'btn-1',
    value: 4.5,
    unit: 'ratio',
    status: 'AVAILABLE',
    dependencies: [],
    fingerprint: 'fp-metric-001',
  };
}

function makeEvaluation(): EvaluationResult {
  return {
    ruleId: 'ACCESSIBILITY.CONTRAST.WCAG_AA',
    ruleVersion: '1.0.0',
    subjectId: 'btn-1',
    state: 'PASS',
    severity: 'HIGH',
    metricResult: makeMetric(),
    evidence: [makeEvidence()],
    fingerprint: 'fp-eval-001',
    message: 'Contrast ratio satisfies WCAG AA',
  };
}

function makeFinding(): Finding {
  return {
    id: 'F-001',
    fingerprint: 'fp-finding-001',
    type: 'ACCESSIBILITY',
    state: 'DETECTED',
    severity: 'HIGH',
    subjectId: 'btn-1',
    evaluation: makeEvaluation(),
    evidence: [makeEvidence()],
    createdAt: 1000,
    updatedAt: 1000,
  };
}

function makeDiagnostic(): Diagnostic {
  return {
    id: 'D-001',
    findingId: 'F-001',
    type: 'ACCESSIBILITY',
    cause: 'MEASUREMENT',
    confidence: 'DIRECT',
    evidence: [makeEvidence()],
    explanation: 'Contrast is sufficient',
  };
}

function makeSnapshot(): MeasurementSnapshot {
  return {
    id: 'snap-001',
    capturedAt: 1000,
    source: { type: 'BROWSER', adapter: '@uiq/browser', version: '1.0.0' },
    measurements: [],
  };
}

function makeResult(): InspectionResult {
  return {
    subjectId: 'btn-1',
    snapshot: makeSnapshot(),
    metrics: [makeMetric()],
    evaluations: [makeEvaluation()],
    findings: [makeFinding()],
    diagnostics: [makeDiagnostic()],
    engine: {
      metrics: { name: '@uiq/metrics', version: '1.0.0' },
      rules: { name: '@uiq/rules', version: '1.0.0' },
      diagnostics: { name: '@uiq/diagnostic', version: '1.0.0' },
    },
  };
}

const METADATA: ExportMetadata = {
  uiqEngineVersion: '1.0.0',
  exportedAt: '2024-01-01T00:00:00Z',
  browser: 'Chrome 120',
  viewport: { width: 1920, height: 1080 },
  themeId: 'light',
};

describe('P9: exportJson — 完整结构化导出', () => {
  it('includes __uiq marker', () => {
    const json = exportJson(makeResult(), METADATA);
    const parsed = JSON.parse(json);
    expect(parsed.__uiq).toBe('INSPECTION_REPORT');
  });

  it('includes engine version', () => {
    const parsed = JSON.parse(exportJson(makeResult(), METADATA));
    expect(parsed.metadata.uiqEngineVersion).toBe('1.0.0');
  });

  it('includes snapshot ID', () => {
    const parsed = JSON.parse(exportJson(makeResult(), METADATA));
    expect(parsed.snapshot.id).toBe('snap-001');
  });

  it('includes theme', () => {
    const parsed = JSON.parse(exportJson(makeResult(), METADATA));
    expect(parsed.metadata.themeId).toBe('light');
  });

  it('includes browser and viewport', () => {
    const parsed = JSON.parse(exportJson(makeResult(), METADATA));
    expect(parsed.metadata.browser).toBe('Chrome 120');
    expect(parsed.metadata.viewport.width).toBe(1920);
  });

  it('includes metric versions', () => {
    const parsed = JSON.parse(exportJson(makeResult(), METADATA));
    expect(parsed.metrics[0].metricVersion).toBe('1.0.0');
  });
});

describe('P9: exportMarkdown — 人类可读', () => {
  it('starts with report title', () => {
    const md = exportMarkdown(makeResult(), METADATA);
    expect(md).toContain('# UIQ Inspection Report');
  });

  it('includes engine version', () => {
    expect(exportMarkdown(makeResult(), METADATA)).toContain('1.0.0');
  });

  it('includes metrics section', () => {
    expect(exportMarkdown(makeResult(), METADATA)).toContain('## Metrics');
    expect(exportMarkdown(makeResult(), METADATA)).toContain('COLOR.CONTRAST');
  });

  it('includes findings when present', () => {
    expect(exportMarkdown(makeResult(), METADATA)).toContain('## Findings');
    expect(exportMarkdown(makeResult(), METADATA)).toContain('F-001');
  });
});

describe('P9: exportHtml — 自包含页面', () => {
  it('is valid HTML', () => {
    const html = exportHtml(makeResult(), METADATA);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('</html>');
  });

  it('contains report content', () => {
    const html = exportHtml(makeResult(), METADATA);
    expect(html).toContain('UIQ Inspection Report');
  });
});

describe('P9: importJson — 导入恢复', () => {
  it('round-trip: export → import preserves data', () => {
    const exported = exportJson(makeResult(), METADATA);
    const imported = importJson(exported);
    expect(imported.success).toBe(true);
    expect(imported.data).not.toBeNull();
    expect(imported.data!.subjectId).toBe('btn-1');
    expect(imported.data!.snapshot.id).toBe('snap-001');
  });

  it('preserves metadata', () => {
    const exported = exportJson(makeResult(), METADATA);
    const imported = importJson(exported);
    expect(imported.metadata).not.toBeNull();
    expect(imported.metadata!.uiqEngineVersion).toBe('1.0.0');
    expect(imported.metadata!.themeId).toBe('light');
  });

  it('rejects invalid JSON', () => {
    const result = importJson('not json');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid JSON');
  });

  it('rejects non-UIQ JSON', () => {
    const result = importJson(JSON.stringify({ type: 'other' }));
    expect(result.success).toBe(false);
    expect(result.error).toContain('Not a UIQ Inspection Report');
  });

  it('rejects JSON without metadata', () => {
    const result = importJson(JSON.stringify({ __uiq: 'INSPECTION_REPORT' }));
    expect(result.success).toBe(false);
    expect(result.error).toContain('Missing metadata');
  });
});
