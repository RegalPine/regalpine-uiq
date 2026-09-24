import { describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { runEvaluate } from '../../../apps/cli/src/commands/evaluate';
import { runConformance } from '../../../apps/cli/src/commands/conformance';
import { runRegression } from '../../../apps/cli/src/commands/regression';
import { runReport } from '../../../apps/cli/src/commands/report';
import { runAnalysis } from '../../../apps/cli/src/artifact';
import { CliError } from '../../../apps/cli/src/errors';
import { approveBaseline, serializeBaseline } from '@uiq/regression';
import { toAnalysisSnapshot } from '../../../apps/cli/src/regression-support';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import type { MeasurementSnapshot } from '@uiq/core';

const ROOT = resolve(__dirname, '../..');
const FIXTURE = resolve(ROOT, 'fixtures/analysis/fixture-snapshot.json');

const SOURCE = { type: 'STATIC' } as const;

function miniSnapshot(id = 'snap-mini'): MeasurementSnapshot {
  return {
    id,
    capturedAt: 1700000000000,
    source: SOURCE,
    measurements: [
      {
        id: 'm1',
        subjectId: 'btn',
        type: 'color.srgb',
        value: { r: 0, g: 0, b: 0, alpha: 1 },
        status: 'AVAILABLE',
        source: SOURCE,
        timestamp: 1700000000000,
      },
      {
        id: 'm2',
        subjectId: 'btn',
        type: 'color.srgb.background',
        value: { r: 1, g: 1, b: 1, alpha: 1 },
        status: 'AVAILABLE',
        source: SOURCE,
        timestamp: 1700000000000,
      },
    ],
  };
}

// ─── evaluate ────────────────────────────────────────────────────────────────

describe('evaluate 命令：Metric → Rule（不生成 Finding/Diagnostic）', () => {
  it('快照文件 → COMPLETED + evaluations 非空', async () => {
    const response = await runEvaluate({ target: FIXTURE });
    expect(response.status).toBe('COMPLETED');
    expect(response.command).toBe('evaluate');
    expect(response.data).toBeDefined();
    expect(response.data!.metricResults.length).toBeGreaterThan(0);
    expect(response.data!.evaluations.length).toBeGreaterThan(0);
    expect(typeof response.data!.hasFailures).toBe('boolean');
  });

  it('确定性：相同快照产出相同评价', async () => {
    const r1 = await runEvaluate({ target: FIXTURE });
    const r2 = await runEvaluate({ target: FIXTURE });
    expect(r1.data!.evaluations.length).toBe(r2.data!.evaluations.length);
    expect(r1.data!.hasFailures).toBe(r2.data!.hasFailures);
  });

  it('浏览器目标 → CliError(INPUT_ERROR)', async () => {
    await expect(runEvaluate({ target: 'https://example.com' })).rejects.toThrow(CliError);
  });

  it('不存在的文件 → CliError(INPUT_ERROR)', async () => {
    await expect(runEvaluate({ target: '/nonexistent/path.json' })).rejects.toThrow(CliError);
  });
});

// ─── conformance ─────────────────────────────────────────────────────────────

describe('conformance 命令：等级检查', () => {
  it('CORE 等级 → COMPLETED + 汇总数据', async () => {
    const response = await runConformance({ target: FIXTURE, level: 'core' });
    expect(response.status).toBe('COMPLETED');
    expect(response.command).toBe('conformance');
    expect(response.data).toBeDefined();
    expect(response.data!.level).toBe('CORE');
    expect(typeof response.data!.executable).toBe('boolean');
    expect(typeof response.data!.total).toBe('number');
  });

  it('大小写不敏感：standard → STANDARD', async () => {
    const response = await runConformance({ target: FIXTURE, level: 'standard' });
    expect(response.data!.level).toBe('STANDARD');
  });

  it('无效 level → CliError(INPUT_ERROR)', async () => {
    await expect(runConformance({ target: FIXTURE, level: 'invalid' })).rejects.toThrow(CliError);
  });

  it('浏览器目标 → CliError(INPUT_ERROR)', async () => {
    await expect(runConformance({ target: 'https://example.com', level: 'core' })).rejects.toThrow(
      CliError,
    );
  });
});

// ─── regression ──────────────────────────────────────────────────────────────

describe('regression 命令：基线比较', () => {
  const tmpDir = resolve(ROOT, 'tmp-regression-test');

  function setupTmpFiles(): { baselinePath: string; currentPath: string } {
    mkdirSync(tmpDir, { recursive: true });
    const snap = miniSnapshot('snap-reg');
    const artifact = runAnalysis(snap);
    const analysisSnapshot = toAnalysisSnapshot(artifact);
    const baseline = approveBaseline(analysisSnapshot, {
      id: 'bl-test',
      approvedAt: '2026-09-24T00:00:00.000Z',
    });
    const baselinePath = resolve(tmpDir, 'baseline.json');
    writeFileSync(baselinePath, serializeBaseline(baseline), 'utf-8');

    // 当前分析产物（与基线相同快照 → 无回归变化）
    const currentPath = resolve(tmpDir, 'current.json');
    writeFileSync(currentPath, JSON.stringify(artifact), 'utf-8');
    return { baselinePath, currentPath };
  }

  it('有 baseline + 当前 → COMPLETED + report', async () => {
    const { baselinePath, currentPath } = setupTmpFiles();
    try {
      const response = await runRegression({ baselinePath, currentPath });
      expect(response.status).toBe('COMPLETED');
      expect(response.data!.status).toBe('COMPLETED');
      expect(response.data!.report).toBeDefined();
      expect(response.data!.hasNewFailures).toBe(false);
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('缺 baseline 文件 → CliError(INPUT_ERROR)', async () => {
    await expect(
      runRegression({ baselinePath: '/nonexistent.json', currentPath: '/other.json' }),
    ).rejects.toThrow(CliError);
  });

  it('无效 baseline JSON → CliError(INPUT_ERROR)', async () => {
    mkdirSync(tmpDir, { recursive: true });
    const badPath = resolve(tmpDir, 'bad-baseline.json');
    writeFileSync(badPath, '{"not":"valid"}', 'utf-8');
    try {
      await expect(
        runRegression({ baselinePath: badPath, currentPath: '/other.json' }),
      ).rejects.toThrow(CliError);
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

// ─── report ──────────────────────────────────────────────────────────────────

describe('report 命令：从分析产物生成报告', () => {
  const tmpDir = resolve(ROOT, 'tmp-report-test');

  function setupArtifactFile(): string {
    mkdirSync(tmpDir, { recursive: true });
    const snap = miniSnapshot('snap-rpt');
    const artifact = runAnalysis(snap);
    const artifactPath = resolve(tmpDir, 'artifact.json');
    writeFileSync(artifactPath, JSON.stringify(artifact), 'utf-8');
    return artifactPath;
  }

  it('JSON 格式 → COMPLETED + UIQualityReport', async () => {
    const artifactPath = setupArtifactFile();
    try {
      const response = await runReport({ target: artifactPath, format: 'json' });
      expect(response.status).toBe('COMPLETED');
      expect(response.data!.report).toBeDefined();
      expect(response.data!.report.id).toBeDefined();
      expect(response.data!.renderedFormat).toBe('json');
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('Markdown 格式 → 渲染字符串', async () => {
    const artifactPath = setupArtifactFile();
    try {
      const response = await runReport({ target: artifactPath, format: 'markdown' });
      expect(response.status).toBe('COMPLETED');
      expect(response.data!.renderedFormat).toBe('markdown');
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('HTML 格式 → 渲染字符串', async () => {
    const artifactPath = setupArtifactFile();
    try {
      const response = await runReport({ target: artifactPath, format: 'html' });
      expect(response.status).toBe('COMPLETED');
      expect(response.data!.renderedFormat).toBe('html');
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('无效格式 → CliError(INPUT_ERROR)', async () => {
    const artifactPath = setupArtifactFile();
    try {
      await expect(runReport({ target: artifactPath, format: 'xml' as 'json' })).rejects.toThrow(
        CliError,
      );
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('非分析产物文件（仅快照）→ CliError(INPUT_ERROR)', async () => {
    mkdirSync(tmpDir, { recursive: true });
    const snapOnlyPath = resolve(tmpDir, 'snapshot-only.json');
    writeFileSync(snapOnlyPath, JSON.stringify(miniSnapshot()), 'utf-8');
    try {
      await expect(runReport({ target: snapOnlyPath, format: 'json' })).rejects.toThrow(CliError);
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
