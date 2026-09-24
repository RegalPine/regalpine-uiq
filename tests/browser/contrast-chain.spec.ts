import { expect, test } from '@playwright/test';
import type { AnalysisArtifact } from '../../apps/cli/src/artifact';
import { runAnalysis } from '../../apps/cli/src/artifact';
import { injectAndCapture, referenceUrl } from './helpers';

/** IMPL-07 §4/AC-BROWSER-12：真实页面 → 采集 → Metric → Rule → Finding → Diagnostic 完整链。 */
test.describe('对比度完整链（真实 Chromium → WCAG 评价）', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(referenceUrl('button.html'));
  });

  function contrastRatioOf(artifact: AnalysisArtifact, subjectId: string): number | undefined {
    const metric = artifact.metricResults.find(
      (r) => r.subjectId === subjectId && r.metricId === 'COLOR.CONTRAST',
    );
    const value = metric?.value as { ratio?: number } | undefined;
    return value?.ratio;
  }

  function wcagStateOf(artifact: AnalysisArtifact, subjectId: string): string | undefined {
    return artifact.evaluations.find(
      (e) => e.subjectId === subjectId && e.ruleId === 'ACCESSIBILITY.CONTRAST.WCAG_AA',
    )?.state;
  }

  test('白字蓝底 ≈5.17 → WCAG PASS', async ({ page }) => {
    const snapshot = await injectAndCapture(page);
    const artifact = runAnalysis(snapshot);
    const ratio = contrastRatioOf(artifact, 'btn-primary');
    expect(ratio).toBeGreaterThan(5.0);
    expect(ratio).toBeLessThan(5.4);
    expect(wcagStateOf(artifact, 'btn-primary')).toBe('PASS');
  });

  test('灰白 ≈4.48 → FAIL → Finding + Diagnostic + Evidence（ER-01 Golden）', async ({ page }) => {
    const snapshot = await injectAndCapture(page);
    const artifact = runAnalysis(snapshot);
    const ratio = contrastRatioOf(artifact, 'btn-gray');
    expect(ratio).toBeGreaterThan(4.3);
    expect(ratio).toBeLessThan(4.6);
    expect(wcagStateOf(artifact, 'btn-gray')).toBe('FAIL');

    const finding = artifact.findings.find((f) => f.subjectId === 'btn-gray');
    expect(finding).toBeDefined();
    expect(finding?.severity).toBe('HIGH');
    expect(finding?.state).toBe('DETECTED');
    expect(finding?.evidence.length).toBeGreaterThan(0);

    const diagnostic = artifact.diagnostics.find((d) => d.findingId === finding?.id);
    expect(diagnostic).toBeDefined();
    expect(diagnostic?.explanation.length ?? '').toBeGreaterThan(0);
  });

  test('渐变背景 → CONTRAST UNKNOWN → 不生成 Finding（不伪造结论）', async ({ page }) => {
    const snapshot = await injectAndCapture(page);
    const artifact = runAnalysis(snapshot);
    const metric = artifact.metricResults.find(
      (r) => r.subjectId === 'btn-gradient' && r.metricId === 'COLOR.CONTRAST',
    );
    expect(metric?.status).toBe('UNKNOWN');
    expect(wcagStateOf(artifact, 'btn-gradient')).toBe('UNKNOWN');
    expect(artifact.findings.some((f) => f.subjectId === 'btn-gradient')).toBe(false);
  });

  test('灰白改为白字蓝底 → 重新采集 + 重新评价 PASS', async ({ page }) => {
    // 同特异性下后注入的 style 获胜 → 无需 !important
    await page.addStyleTag({
      content: '.btn-gray { color: #ffffff; background-color: #2563eb; }',
    });
    const snapshot = await injectAndCapture(page);
    const artifact = runAnalysis(snapshot);
    const ratio = contrastRatioOf(artifact, 'btn-gray');
    expect(ratio).toBeGreaterThan(5.0);
    expect(ratio).toBeLessThan(5.4);
    expect(wcagStateOf(artifact, 'btn-gray')).toBe('PASS');
  });
});
