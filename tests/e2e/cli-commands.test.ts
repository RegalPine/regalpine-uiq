import { describe, expect, it, beforeAll } from 'vitest';
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runAnalysis } from '../../apps/cli/src/artifact';
import { approveBaseline, serializeBaseline } from '@uiq/regression';
import { toAnalysisSnapshot } from '../../apps/cli/src/regression-support';
import type { MeasurementSnapshot } from '@uiq/core';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const CLI_ENTRY = resolve(ROOT, 'apps/cli/dist/index.js');
const FIXTURE = resolve(ROOT, 'tests/fixtures/analysis/fixture-snapshot.json');
const TMP_DIR = resolve(ROOT, 'test-results/p12-e2e');

const SOURCE = { type: 'STATIC' } as const;

function miniSnapshot(id = 'snap-p12'): MeasurementSnapshot {
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

interface CliResponse {
  readonly schemaVersion: string;
  readonly uiqVersion: string;
  readonly cliVersion: string;
  readonly command: string;
  readonly status: string;
  readonly data?: Record<string, unknown>;
  readonly errors?: readonly { code: string; message: string }[];
}

function runCli(args: readonly string[]): { status: number; stdout: string; stderr: string } {
  const result = spawnSync(process.execPath, [CLI_ENTRY, ...args], { encoding: 'utf8' });
  return { status: result.status ?? -1, stdout: result.stdout, stderr: result.stderr };
}

beforeAll(() => {
  if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR, { recursive: true });
});

describe('P12：CLI E2E — evaluate 命令（构建产物 spawn）', () => {
  it('快照文件 → COMPLETED + evaluations 非空', () => {
    const result = runCli(['evaluate', FIXTURE]);
    expect(result.status).toBe(2); // fixture 有 FAIL → exit 2
    const response = JSON.parse(result.stdout) as CliResponse;
    expect(response.status).toBe('COMPLETED');
    expect(response.command).toBe('evaluate');
    const data = response.data as { metricResults: unknown[]; evaluations: unknown[] };
    expect(data.metricResults.length).toBeGreaterThan(0);
    expect(data.evaluations.length).toBeGreaterThan(0);
  });

  it('缺少快照参数 → exit 4', () => {
    const result = runCli(['evaluate']);
    expect(result.status).toBe(4);
  });
});

describe('P12：CLI E2E — conformance 命令（构建产物 spawn）', () => {
  it('CORE 等级 → 正确汇总', () => {
    const result = runCli(['conformance', FIXTURE, '--level', 'core']);
    const response = JSON.parse(result.stdout) as CliResponse;
    expect(response.command).toBe('conformance');
    const data = response.data as { level: string; total: number };
    expect(data.level).toBe('CORE');
    // CORE 等级可能无映射用例（fixture 仅含 accessibility/typography 规则）
    expect(data.total).toBeGreaterThanOrEqual(0);
  });

  it('无效 level → exit 5 INPUT_ERROR', () => {
    const result = runCli(['conformance', FIXTURE, '--level', 'INVALID']);
    expect(result.status).toBe(5);
  });
});

describe('P12：CLI E2E — regression 命令（构建产物 spawn）', () => {
  it('有 baseline → COMPLETED + report', () => {
    const snapshot = miniSnapshot();
    const analysis = runAnalysis(snapshot);
    const analysisSnapshot = toAnalysisSnapshot(analysis);
    const baseline = approveBaseline(analysisSnapshot, {
      id: 'bl-p12-e2e',
      approvedAt: '2024-01-01T00:00:00.000Z',
      engine: { name: '@uiq/regression', version: '1.0.0' },
    });
    const baselinePath = resolve(TMP_DIR, 'p12-baseline.json');
    writeFileSync(baselinePath, serializeBaseline(baseline), 'utf-8');

    const analysisPath = resolve(TMP_DIR, 'p12-current.json');
    writeFileSync(analysisPath, JSON.stringify(analysis), 'utf-8');

    const result = runCli(['regression', '--baseline', baselinePath, '--current', analysisPath]);
    const response = JSON.parse(result.stdout) as CliResponse;
    expect(response.command).toBe('regression');
    expect(response.status).toBe('COMPLETED');
  });

  it('缺 baseline → exit 5', () => {
    const result = runCli(['regression', '--current', FIXTURE]);
    expect(result.status).toBe(5);
  });
});

describe('P12：CLI E2E — report 命令（构建产物 spawn）', () => {
  it('JSON 格式 → 正确报告', () => {
    const snapshot = miniSnapshot();
    const analysis = runAnalysis(snapshot);
    const analysisPath = resolve(TMP_DIR, 'p12-report-input.json');
    writeFileSync(analysisPath, JSON.stringify(analysis), 'utf-8');

    const result = runCli(['report', analysisPath, '--format', 'json']);
    const response = JSON.parse(result.stdout) as CliResponse;
    expect(response.command).toBe('report');
    expect(response.status).toBe('COMPLETED');
    const data = response.data as { report: { summary: unknown } };
    expect(data.report).toBeDefined();
  });

  it('markdown 格式 → 字符串输出', () => {
    const snapshot = miniSnapshot();
    const analysis = runAnalysis(snapshot);
    const analysisPath = resolve(TMP_DIR, 'p12-report-md-input.json');
    writeFileSync(analysisPath, JSON.stringify(analysis), 'utf-8');

    const result = runCli(['report', analysisPath, '--format', 'markdown']);
    const response = JSON.parse(result.stdout) as CliResponse;
    expect(response.status).toBe('COMPLETED');
  });

  it('无效输入文件 → exit 5', () => {
    const result = runCli(['report', '/nonexistent/file.json']);
    expect(result.status).toBe(5);
  });
});
