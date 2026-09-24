/**
 * P7 退出条件③：程序化闭环——"建议 → 外部修改 → 新采集 → 评价 → 回归 → 验证"。
 * RPT-002 场景（0.5 灰 3.98 FAIL）→ Review 建议 → 外部改 0 灰 → 新采集 →
 * runRegression FIXED_FAILURE → verify VERIFIED。
 * 全程纯函数链：不启动浏览器/引擎；采集由 fixture 模拟（重测编排是应用层职责，IMPL-17 §33/§39）。
 */
import { describe, expect, it } from 'vitest';
import type { Measurement, MeasurementSnapshot } from '@uiq/core';
import { approveBaseline, runRegression } from '@uiq/regression';
import {
  generateQualityReport,
  verify,
  type GenerateQualityReportOptions,
  type QualityReportInput,
} from '@uiq/reporting';
import { runAnalysis } from '../../apps/cli/src/artifact';

const SOURCE = { type: 'STATIC' } as const;
const TS = 1700000000000;
const OPTIONS: GenerateQualityReportOptions = { generatedAt: '2026-09-24T00:00:00.000Z' };

/**
 * 单 subject 完整健康测量集（与 golden 同构）：颜色、字号 14px、行高比 1.4、
 * 矩形 (x, y, 120, 40) 与 refId 分离——除 gray 外全部指标 PASS，闭环聚焦对比度。
 */
function subjectFacts(
  subjectId: string,
  gray: number,
  refId: string,
  at: { x: number; y: number },
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
      status: 'AVAILABLE',
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

function buttonSnapshot(id: string, gray: number): MeasurementSnapshot {
  return {
    id,
    capturedAt: TS,
    source: SOURCE,
    measurements: [
      ...subjectFacts('btn', gray, 'panel', { x: 0, y: 0 }),
      ...subjectFacts('panel', 0, 'btn', { x: 200, y: 0 }),
    ],
  };
}

function toReportInput(artifact: ReturnType<typeof runAnalysis>): QualityReportInput {
  return {
    projectId: 'proj-flow',
    snapshot: artifact.snapshot,
    metricResults: artifact.metricResults,
    evaluations: artifact.evaluations,
    findings: artifact.findings,
    diagnostics: artifact.diagnostics,
    engine: artifact.engine.metrics,
  };
}

function toVerificationInput(artifact: ReturnType<typeof runAnalysis>) {
  return {
    snapshotId: artifact.snapshot.id,
    evaluations: artifact.evaluations,
    findings: artifact.findings,
  };
}

describe('P7 退出条件③：建议→外部修改→新采集→评价→回归→验证 闭环', () => {
  it('RPT-002 闭环：0.5 灰 FAIL → 建议 → 改 0 灰 → 新采集 → FIXED → VERIFIED', () => {
    // 1. 基线采集与报告：对比度 3.98 FAIL → 1 条 Review 建议（含可验证条件）。
    const beforeArtifact = runAnalysis(buttonSnapshot('snap-flow-before', 0.5));
    const beforeReport = generateQualityReport(toReportInput(beforeArtifact), OPTIONS);
    expect(beforeReport.summary.fail).toBe(1);
    expect(beforeReport.recommendations).toHaveLength(1);
    const recommendation = beforeReport.recommendations[0]!;
    expect(recommendation.type).toBe('REVIEW_ACCESSIBILITY');
    expect(recommendation.verification).toHaveLength(1);
    expect(recommendation.verification[0]?.ruleId).toBe('ACCESSIBILITY.CONTRAST.WCAG_AA');
    expect(recommendation.verification[0]?.expectedState).toBe('PASS');

    // 2. 未重新采集：同快照验证必须拒绝（IMPLEMENTED ≠ VERIFIED）。
    const beforeFacts = toVerificationInput(beforeArtifact);
    const sameSnapshot = verify([recommendation], beforeFacts, beforeFacts);
    expect(sameSnapshot.status).toBe('NOT_VERIFIED');
    expect(sameSnapshot.reasons[0]?.code).toBe('NEW_COLLECTION_REQUIRED');

    // 3. 外部修改（0.5 灰 → 0 灰）+ 新采集：新快照、新评价（21:1 PASS）。
    const afterArtifact = runAnalysis(buttonSnapshot('snap-flow-after', 0));
    expect(afterArtifact.snapshot.id).not.toBe(beforeArtifact.snapshot.id);
    const afterContrast = afterArtifact.evaluations.find(
      (e) => e.ruleId === 'ACCESSIBILITY.CONTRAST.WCAG_AA' && e.subjectId === 'btn',
    );
    expect(afterContrast?.state).toBe('PASS');

    // 4. 回归：显式批准基线 → 与新采集对比 → FIXED_FAILURE=1，无新失败。
    const baseline = approveBaseline(
      {
        schemaVersion: beforeArtifact.schemaVersion,
        snapshot: beforeArtifact.snapshot,
        metricResults: beforeArtifact.metricResults,
        evaluations: beforeArtifact.evaluations,
        findings: beforeArtifact.findings,
        engine: beforeArtifact.engine,
      },
      { id: 'bl-flow', approvedAt: '2026-09-24T00:00:00.000Z' },
    );
    const outcome = runRegression({
      baseline,
      current: {
        schemaVersion: afterArtifact.schemaVersion,
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
    expect(outcome.report.summary.newFailures).toBe(0);

    // 5. 新采集验证：全部条件满足 → VERIFIED（reasons 为空）。
    const result = verify([recommendation], beforeFacts, toVerificationInput(afterArtifact));
    expect(result.status).toBe('VERIFIED');
    expect(result.reasons).toEqual([]);

    // 6. 修复后报告：无 FAIL、无建议，回归结论进入报告（§36 固定章节）。
    const afterReport = generateQualityReport(
      { ...toReportInput(afterArtifact), regression: outcome.report },
      OPTIONS,
    );
    expect(afterReport.summary.fail).toBe(0);
    expect(afterReport.recommendations).toHaveLength(0);
    expect(afterReport.regression?.summary.fixedFailures).toBe(1);
  });
});
