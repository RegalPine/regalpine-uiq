import { describe, expect, it } from 'vitest';
import type { Measurement, MeasurementSnapshot } from '@uiq/core';
import { approveBaseline, runRegression } from '@uiq/regression';
import { groupFindings } from '@uiq/reporting';
import {
  generateQualityReport,
  renderJson,
  renderMarkdown,
  type GenerateQualityReportOptions,
  type QualityReportInput,
} from '@uiq/reporting';
import { runAnalysis, type TokenAnalysisContext } from '../../apps/cli/src/artifact';

const SOURCE = { type: 'STATIC' } as const;
const OPTIONS: GenerateQualityReportOptions = { generatedAt: '2026-09-24T00:00:00.000Z' };

/** 前景灰度（on 白背景）：0=黑(21:1 PASS)、0.35≈6.98 PASS、0.5≈3.98 FAIL（0.45 落 WARN 区间，不用于 FAIL）。 */
const TS = 1700000000000;

/**
 * 单 subject 完整健康测量集：颜色（前景灰度 + 白背景）、字号 14px、行高比 1.4、
 * 矩形 (x, y, 120, 40) 与 refId 矩形分离（overlap=0）。
 * 除 gray/bgStatus 外全部指标 PASS——金标场景聚焦对比度，其余维度不产生测量缺失噪音。
 */
function subjectFacts(
  subjectId: string,
  gray: number,
  refId: string,
  at: { x: number; y: number },
  bgStatus: 'AVAILABLE' | 'UNKNOWN' = 'AVAILABLE',
): Measurement[] {
  return [
    {
      id: `${subjectId}-fg`,
      subjectId,
      type: 'color.srgb',
      value: { r: gray, g: gray, b: gray, alpha: 1 },
      status: 'AVAILABLE',
      source: SOURCE,
      timestamp: TS,
    },
    {
      id: `${subjectId}-bg`,
      subjectId,
      type: 'color.srgb.background',
      value: { r: 1, g: 1, b: 1, alpha: 1 },
      status: bgStatus,
      source: SOURCE,
      timestamp: TS,
    },
    {
      id: `${subjectId}-fs`,
      subjectId,
      type: 'typography.font-size',
      value: 14,
      status: 'AVAILABLE',
      source: SOURCE,
      timestamp: TS,
    },
    {
      id: `${subjectId}-lh`,
      subjectId,
      type: 'typography.line-height',
      value: { px: 20, ratio: 1.4 },
      status: 'AVAILABLE',
      source: SOURCE,
      timestamp: TS,
    },
    {
      id: `${subjectId}-x`,
      subjectId,
      type: 'geometry.x',
      value: at.x,
      status: 'AVAILABLE',
      source: SOURCE,
      timestamp: TS,
    },
    {
      id: `${subjectId}-y`,
      subjectId,
      type: 'geometry.y',
      value: at.y,
      status: 'AVAILABLE',
      source: SOURCE,
      timestamp: TS,
    },
    {
      id: `${subjectId}-w`,
      subjectId,
      type: 'geometry.width',
      value: 120,
      status: 'AVAILABLE',
      source: SOURCE,
      timestamp: TS,
    },
    {
      id: `${subjectId}-h`,
      subjectId,
      type: 'geometry.height',
      value: 40,
      status: 'AVAILABLE',
      source: SOURCE,
      timestamp: TS,
    },
    {
      id: `${subjectId}-ref`,
      subjectId,
      type: 'geometry.overlap.reference',
      value: refId,
      status: 'AVAILABLE',
      source: SOURCE,
      timestamp: TS,
    },
  ];
}

/** 单按钮快照：btn（聚焦前景灰度）+ panel（健康参照 0 灰），互为分离 overlap reference；bindings 时 btn→primary、panel→surface。 */
function buttonSnapshot(
  id: string,
  gray: number,
  extra?: { bindings?: boolean; backgroundStatus?: 'AVAILABLE' | 'UNKNOWN' },
): MeasurementSnapshot {
  return {
    id,
    capturedAt: TS,
    source: SOURCE,
    measurements: [
      ...subjectFacts('btn', gray, 'panel', { x: 0, y: 0 }, extra?.backgroundStatus),
      ...subjectFacts('panel', 0, 'btn', { x: 200, y: 0 }),
    ],
    ...(extra?.bindings === true
      ? {
          bindings: [
            {
              subjectId: 'btn',
              tokenId: 'token.semantic.color.primary',
              bindingType: 'EXPLICIT',
              confidence: 'DIRECT',
            },
            {
              subjectId: 'panel',
              tokenId: 'token.semantic.color.surface',
              bindingType: 'EXPLICIT',
              confidence: 'DIRECT',
            },
          ],
        }
      : {}),
  };
}

/** 37 个同 token 按钮（RPT-003）：前景 0.5 灰全部 FAIL，绑定同一 semantic token；网格坐标互不重叠，环形互为 overlap reference。 */
function thirtySevenButtonsSnapshot(id: string): MeasurementSnapshot {
  const subject = (i: number): string => `btn-${String(i).padStart(2, '0')}`;
  const at = (i: number) => ({ x: (i % 10) * 150, y: Math.floor(i / 10) * 60 });
  const measurements = Array.from({ length: 37 }, (_, i) =>
    subjectFacts(subject(i), 0.5, subject((i + 1) % 37), at(i)),
  ).flat();
  return {
    id,
    capturedAt: TS,
    source: SOURCE,
    measurements,
    bindings: Array.from({ length: 37 }, (_, i) => ({
      subjectId: subject(i),
      tokenId: 'token.semantic.color.primary',
      bindingType: 'EXPLICIT' as const,
      confidence: 'DIRECT' as const,
    })),
  };
}

const BLUE_TOKEN_CONTEXT: TokenAnalysisContext = {
  assetId: 'token-asset',
  assetVersion: '1.0.0',
  resolveToken: (tokenId: string) =>
    tokenId === 'token.semantic.color.primary'
      ? { status: 'RESOLVED' as const, resolvedValue: '#0000ff' }
      : tokenId === 'token.semantic.color.surface'
        ? { status: 'RESOLVED' as const, resolvedValue: '#ffffff' }
        : { status: 'UNKNOWN' as const },
};

function toReportInput(
  artifact: ReturnType<typeof runAnalysis>,
  themeId?: string,
): QualityReportInput {
  return {
    projectId: 'proj-golden',
    snapshot: artifact.snapshot,
    metricResults: artifact.metricResults,
    evaluations: artifact.evaluations,
    findings: artifact.findings,
    diagnostics: artifact.diagnostics,
    engine: artifact.engine.metrics,
    ...(artifact.snapshot.bindings !== undefined
      ? { tokenBindings: artifact.snapshot.bindings }
      : {}),
    ...(themeId !== undefined ? { themeId } : {}),
  };
}

describe('Report Golden（IMPL-17 §43-49）', () => {
  it('RPT-001：Contrast 5.17 PASS → FAIL=0、Recommendations=0', () => {
    const artifact = runAnalysis(buttonSnapshot('snap-rpt1', 0.35));
    const report = generateQualityReport(toReportInput(artifact), OPTIONS);
    expect(report.summary.fail).toBe(0);
    expect(report.recommendations).toHaveLength(0);
  });

  it('RPT-002：Contrast 3.98 FAIL → Findings=1、Recommendation=1、Verification=1', () => {
    const artifact = runAnalysis(buttonSnapshot('snap-rpt2', 0.5));
    const report = generateQualityReport(toReportInput(artifact), OPTIONS);
    expect(report.summary.fail).toBe(1);
    expect(report.findings).toHaveLength(1);
    expect(report.recommendations).toHaveLength(1);
    expect(report.recommendations[0]?.verification).toHaveLength(1);
    expect(report.recommendations[0]?.rationale).toBe('Review accessibility color relationship.');
    expect(report.recommendations[0]?.affectedFindingIds).toHaveLength(1);
  });

  it('RPT-003：37 buttons 同 token 同失败 → Findings=37、Groups=1、Recommendations=1、Affected=37', () => {
    const artifact = runAnalysis(thirtySevenButtonsSnapshot('snap-rpt3'));
    const report = generateQualityReport(toReportInput(artifact), OPTIONS);
    expect(report.findings).toHaveLength(37);
    // 分组断言：同 type/rule@version/severity 的 37 条 → 1 组
    const groups = groupFindings(artifact.findings, artifact.diagnostics);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.count).toBe(37);
    expect(report.recommendations).toHaveLength(1);
    expect(report.recommendations[0]?.targetType).toBe('TOKEN');
    expect(report.recommendations[0]?.targetIds).toEqual(['token.semantic.color.primary']);
    expect(report.recommendations[0]?.impact.affectedElements).toBe(37);
    expect(report.recommendations[0]?.affectedFindingIds).toHaveLength(37);
  });

  it('RPT-004：背景不可测（UNKNOWN）→ 评价 UNKNOWN → REVIEW_MEASUREMENT，不转 FAIL', () => {
    const artifact = runAnalysis(buttonSnapshot('snap-rpt4', 0, { backgroundStatus: 'UNKNOWN' }));
    const unknownEvaluation = artifact.evaluations.find((e) => e.state === 'UNKNOWN');
    expect(unknownEvaluation).toBeDefined();
    const report = generateQualityReport(toReportInput(artifact), OPTIONS);
    expect(report.summary.unknown).toBeGreaterThan(0);
    expect(report.summary.fail).toBe(0);
    expect(report.recommendations.map((r) => r.type)).toContain('REVIEW_MEASUREMENT');
  });

  it('RPT-005：Token Deviation（声明蓝 vs 实测白）FAIL + Accessibility PASS → Design System Finding=1、Accessibility Finding=0', () => {
    const artifact = runAnalysis(
      buttonSnapshot('snap-rpt5', 0, { bindings: true }),
      BLUE_TOKEN_CONTEXT,
    );
    const accessibilityFindings = artifact.findings.filter(
      (f) => f.evaluation.ruleId === 'ACCESSIBILITY.CONTRAST.WCAG_AA',
    );
    const tokenFindings = artifact.findings.filter(
      (f) => f.evaluation.ruleId === 'TOKEN.TOKEN_MATCH',
    );
    expect(accessibilityFindings).toHaveLength(0); // 黑 on 白 = 21:1 PASS
    expect(tokenFindings).toHaveLength(1);
    expect(tokenFindings[0]?.evaluation.state).toBe('FAIL');
    const report = generateQualityReport(toReportInput(artifact), OPTIONS);
    expect(report.recommendations.map((r) => r.dimension)).toEqual(['DESIGN_SYSTEM']);
    expect(report.recommendations[0]?.rationale).toBe('Review component token binding.');
  });

  it('RPT-006：Light/Dark 主题 → 两份独立报告，不计算主题平均', () => {
    const artifact = runAnalysis(buttonSnapshot('snap-rpt6', 0.5));
    const light = generateQualityReport(toReportInput(artifact, 'theme.light'), OPTIONS);
    const dark = generateQualityReport(toReportInput(artifact, 'theme.dark'), OPTIONS);
    expect(light.id).not.toBe(dark.id);
    expect(light.scope.themes).toEqual(['theme.light']);
    expect(dark.scope.themes).toEqual(['theme.dark']);
    // 事实相同 → 统计相同（独立呈现，无主题平均字段）。
    expect(dark.summary).toEqual(light.summary);
    expect(renderJson(light)).not.toBe(renderJson(dark));
  });

  it('RPT-007：before 3.98 FAIL → after 21 PASS → Regression FIXED_FAILURE=1 进入报告', () => {
    const beforeArtifact = runAnalysis(buttonSnapshot('snap-rpt7-before', 0.5));
    const afterArtifact = runAnalysis(buttonSnapshot('snap-rpt7-after', 0));
    const baseline = approveBaseline(
      {
        schemaVersion: '1.0.0',
        snapshot: beforeArtifact.snapshot,
        metricResults: beforeArtifact.metricResults,
        evaluations: beforeArtifact.evaluations,
        findings: beforeArtifact.findings,
        engine: beforeArtifact.engine,
      },
      { id: 'bl-rpt7', approvedAt: '2026-09-24T00:00:00.000Z' },
    );
    const outcome = runRegression({
      baseline,
      current: {
        schemaVersion: '1.0.0',
        snapshot: afterArtifact.snapshot,
        metricResults: afterArtifact.metricResults,
        evaluations: afterArtifact.evaluations,
        findings: afterArtifact.findings,
        engine: afterArtifact.engine,
      },
    });
    expect(outcome.status).toBe('COMPLETED');
    if (outcome.status !== 'COMPLETED') return;
    expect(outcome.report.summary.fixedFailures).toBe(1);
    const report = generateQualityReport(
      { ...toReportInput(beforeArtifact), regression: outcome.report },
      OPTIONS,
    );
    expect(report.regression?.summary.fixedFailures).toBe(1);
    // 回归结论进入 Markdown 报告固定章节（§36 十二章节）。
    expect(renderMarkdown(report)).toContain('## 10. Regression');
  });
});
