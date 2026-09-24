import { describe, expect, it } from 'vitest';

import {
  generateQualityReport,
  ReportInputError,
  renderHtml,
  renderJson,
  renderMarkdown,
  type QualityReportInput,
} from '@uiq/reporting';
import { canonicalJson } from '@uiq/core';

import { makeDiagnostic, makeEvaluation, makeFinding, makeFacts } from './helpers';

const ENGINE = { name: '@uiq/metrics', version: '1.0.0' } as const;

function reportInput(parts?: {
  projectId?: string;
  findings?: ReturnType<typeof makeFinding>[];
  evaluations?: ReturnType<typeof makeEvaluation>[];
  diagnostics?: ReturnType<typeof makeDiagnostic>[];
  themeId?: string;
}): QualityReportInput {
  const facts = makeFacts({
    evaluations: parts?.evaluations ?? [makeEvaluation()],
    findings: parts?.findings ?? [],
    diagnostics: parts?.diagnostics ?? [],
  });
  return {
    projectId: parts?.projectId ?? 'proj-1',
    snapshot: facts.snapshot,
    metricResults: facts.metricResults,
    evaluations: facts.evaluations,
    findings: facts.findings,
    diagnostics: facts.diagnostics,
    engine: ENGINE,
    ...(parts?.themeId !== undefined ? { themeId: parts.themeId } : {}),
  };
}

const OPTIONS = { generatedAt: '2026-09-24T00:00:00.000Z' } as const;

describe('generateQualityReport（IMPL-17 §33-34）', () => {
  it('完整管线：summary/dimensions/findings/diagnostics/recommendations/reproducibility', () => {
    const failing = makeEvaluation({ state: 'FAIL', severity: 'HIGH' });
    const finding = makeFinding({ id: 'f1', evaluation: failing });
    const report = generateQualityReport(
      reportInput({
        evaluations: [failing],
        findings: [finding],
        diagnostics: [makeDiagnostic({ id: 'd1', findingId: 'f1' })],
      }),
      OPTIONS,
    );
    expect(report.version).toBe('1.0.0');
    expect(report.summary).toMatchObject({
      evaluations: 1,
      fail: 1,
      findings: 1,
      measuredElements: 1,
    });
    expect(report.dimensions.map((d) => d.dimension)).toEqual(['ACCESSIBILITY']);
    expect(report.findings).toHaveLength(1);
    expect(report.findings[0]?.diagnosticIds).toEqual(['d1']);
    expect(report.recommendations).toHaveLength(1);
    expect(report.reproducibility.deterministic).toBe(true);
    expect(report.reproducibility.metricVersions).toEqual(['COLOR.CONTRAST@1.0.0']);
    expect(report.reproducibility.ruleVersions).toEqual(['ACCESSIBILITY.CONTRAST.WCAG_AA@1.0.0']);
    expect(report.scope).toMatchObject({
      snapshotIds: ['snap-001'],
      themes: [],
      generatedFrom: 'ANALYSIS',
    });
  });

  it('同输入两次生成 deep-equal（AC-RPT-18）；ID 稳定', () => {
    const input = reportInput({ findings: [makeFinding({ id: 'f1' })] });
    const a = generateQualityReport(input, OPTIONS);
    const b = generateQualityReport(input, OPTIONS);
    expect(b).toEqual(a);
    expect(a.id).toMatch(/^[0-9a-f]{64}$/);
  });

  it('仅测量快照（无指标结果与评价）被拒绝，不暗中扩展', () => {
    const bare = reportInput();
    const input: QualityReportInput = {
      ...bare,
      metricResults: [],
      evaluations: [],
      findings: [],
      diagnostics: [],
    };
    expect(() => generateQualityReport(input, OPTIONS)).toThrow(ReportInputError);
  });

  it('generatedAt/reportId 显式注入（AD-04）', () => {
    const report = generateQualityReport(reportInput(), {
      generatedAt: '2026-01-01T00:00:00.000Z',
      reportId: 'custom-id',
    });
    expect(report.generatedAt).toBe('2026-01-01T00:00:00.000Z');
    expect(report.id).toBe('custom-id');
  });

  it('themeId 进入 scope.themes；主题独立呈现', () => {
    const report = generateQualityReport(reportInput({ themeId: 'theme.light' }), OPTIONS);
    expect(report.scope.themes).toEqual(['theme.light']);
  });
});

describe('renderJson（IMPL-17 §35）', () => {
  it('canonical JSON：稳定键序，可解析回等价对象', () => {
    const input = reportInput({ findings: [makeFinding({ id: 'f1' })] });
    const report = generateQualityReport(input, OPTIONS);
    const json = renderJson(report);
    expect(json).toBe(canonicalJson(report));
    expect(JSON.parse(json)).toEqual(report);
  });
});

describe('renderMarkdown（IMPL-17 §36）', () => {
  it('十二章节固定模板且输出稳定', () => {
    const report = generateQualityReport(
      reportInput({
        findings: [
          makeFinding({
            id: 'f1',
            evaluation: makeEvaluation({ state: 'FAIL', severity: 'HIGH' }),
          }),
        ],
      }),
      OPTIONS,
    );
    const md1 = renderMarkdown(report);
    const md2 = renderMarkdown(report);
    expect(md2).toBe(md1);
    for (const heading of [
      '## 1. Executive Summary',
      '## 2. Scope',
      '## 3. Quality Dimensions',
      '## 4. Findings',
      '## 5. Diagnostic Analysis',
      '## 6. Design System Conformance',
      '## 7. Theme Analysis',
      '## 8. Improvement Recommendations',
      '## 9. Verification Criteria',
      '## 10. Regression',
      '## 11. Release Gate',
      '## 12. Reproducibility',
    ]) {
      expect(md1).toContain(heading);
    }
    expect(md1).toContain('Not available in this report.'); // conformance/regression 缺省诚实呈现
  });
});

describe('renderHtml（IMPL-17 §37）', () => {
  it('注入文本被上下文转义（<script> 不出现）', () => {
    const hostile = '<script>alert(1)</script>';
    const finding = makeFinding({
      id: 'f1',
      subjectId: hostile,
      evaluation: makeEvaluation({ subjectId: hostile, state: 'FAIL', severity: 'HIGH' }),
    });
    const report = generateQualityReport(reportInput({ findings: [finding] }), OPTIONS);
    const html = renderHtml(report);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('<!DOCTYPE html>');
  });

  it('输出稳定', () => {
    const report = generateQualityReport(reportInput(), OPTIONS);
    expect(renderHtml(report)).toBe(renderHtml(report));
  });
});
