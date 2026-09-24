import { describe, expect, it } from 'vitest';
import { runCli, type CliIO } from '../../../apps/cli/src/index';
import { resolve } from 'node:path';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { runAnalysis } from '../../../apps/cli/src/artifact';
import { approveBaseline, serializeBaseline } from '@uiq/regression';
import { toAnalysisSnapshot } from '../../../apps/cli/src/regression-support';
import type { MeasurementSnapshot } from '@uiq/core';

const ROOT = resolve(__dirname, '../..');
const FIXTURE = resolve(ROOT, 'fixtures/analysis/fixture-snapshot.json');

const SOURCE = { type: 'STATIC' } as const;

function miniSnapshot(id = 'snap-cli'): MeasurementSnapshot {
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

function captureIO(): CliIO & { readonly outLines: string[]; readonly errLines: string[] } {
  const outLines: string[] = [];
  const errLines: string[] = [];
  return {
    outLines,
    errLines,
    out: (line) => outLines.push(line),
    err: (line) => errLines.push(line),
  };
}

// ─── inspect 显式拒绝 ────────────────────────────────────────────────────────

describe('CLI 路由：inspect 显式拒绝', () => {
  it('inspect → exit 4 + INVALID_CONFIGURATION', async () => {
    const io = captureIO();
    const result = await runCli(['inspect'], io);
    expect(result.code).toBe(4);
    const response = JSON.parse(io.outLines[0]!) as {
      status: string;
      errors: { code: string; message: string }[];
    };
    expect(response.status).toBe('ERROR');
    expect(response.errors[0]!.code).toBe('INVALID_CONFIGURATION');
    expect(response.errors[0]!.message).toContain('Inspector');
  });
});

// ─── evaluate 路由 ───────────────────────────────────────────────────────────

describe('CLI 路由：evaluate', () => {
  it('快照文件 → COMPLETED（fixture 有 FAIL → exit 2 CONFORMANCE_FAILURE）', async () => {
    const io = captureIO();
    const result = await runCli(['evaluate', FIXTURE], io);
    // fixture 含灰白按钮对比度 FAIL → hasFailures=true → exit 2
    expect(result.code).toBe(2);
    const response = JSON.parse(io.outLines[0]!) as { status: string; command: string };
    expect(response.status).toBe('COMPLETED');
    expect(response.command).toBe('evaluate');
  });

  it('缺少目标 → exit 4', async () => {
    const io = captureIO();
    const result = await runCli(['evaluate'], io);
    expect(result.code).toBe(4);
  });
});

// ─── conformance 路由 ────────────────────────────────────────────────────────

describe('CLI 路由：conformance', () => {
  it('--level core → exit 0 + COMPLETED', async () => {
    const io = captureIO();
    const result = await runCli(['conformance', FIXTURE, '--level', 'core'], io);
    expect(result.code).toBe(0);
    const response = JSON.parse(io.outLines[0]!) as { status: string; command: string };
    expect(response.status).toBe('COMPLETED');
    expect(response.command).toBe('conformance');
  });

  it('缺少 --level → exit 4', async () => {
    const io = captureIO();
    const result = await runCli(['conformance', FIXTURE], io);
    expect(result.code).toBe(4);
  });

  it('无效 level → exit 5 (INPUT_ERROR)', async () => {
    const io = captureIO();
    const result = await runCli(['conformance', FIXTURE, '--level', 'bogus'], io);
    expect(result.code).toBe(5);
  });
});

// ─── regression 路由 ─────────────────────────────────────────────────────────

describe('CLI 路由：regression', () => {
  const tmpDir = resolve(ROOT, 'tmp-cli-regression');

  function setupFiles(): { baselinePath: string; currentPath: string } {
    mkdirSync(tmpDir, { recursive: true });
    const snap = miniSnapshot('snap-cli-reg');
    const artifact = runAnalysis(snap);
    const analysisSnapshot = toAnalysisSnapshot(artifact);
    const baseline = approveBaseline(analysisSnapshot, {
      id: 'bl-cli-test',
      approvedAt: '2026-09-24T00:00:00.000Z',
    });
    const baselinePath = resolve(tmpDir, 'baseline.json');
    writeFileSync(baselinePath, serializeBaseline(baseline), 'utf-8');
    const currentPath = resolve(tmpDir, 'current.json');
    writeFileSync(currentPath, JSON.stringify(artifact), 'utf-8');
    return { baselinePath, currentPath };
  }

  it('--baseline + --current → exit 0 + COMPLETED', async () => {
    const { baselinePath, currentPath } = setupFiles();
    try {
      const io = captureIO();
      const result = await runCli(
        ['regression', '--baseline', baselinePath, '--current', currentPath],
        io,
      );
      expect(result.code).toBe(0);
      const response = JSON.parse(io.outLines[0]!) as { status: string };
      expect(response.status).toBe('COMPLETED');
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('缺 --baseline → exit 5 (INPUT_ERROR)', async () => {
    const io = captureIO();
    const result = await runCli(['regression', '--current', '/some/file.json'], io);
    expect(result.code).toBe(5);
  });
});

// ─── report 路由 ─────────────────────────────────────────────────────────────

describe('CLI 路由：report', () => {
  const tmpDir = resolve(ROOT, 'tmp-cli-report');

  function setupArtifact(): string {
    mkdirSync(tmpDir, { recursive: true });
    const snap = miniSnapshot('snap-cli-rpt');
    const artifact = runAnalysis(snap);
    const path = resolve(tmpDir, 'artifact.json');
    writeFileSync(path, JSON.stringify(artifact), 'utf-8');
    return path;
  }

  it('分析产物 + --format json → exit 0', async () => {
    const artifactPath = setupArtifact();
    try {
      const io = captureIO();
      const result = await runCli(['report', artifactPath, '--format', 'json'], io);
      expect(result.code).toBe(0);
      const response = JSON.parse(io.outLines[0]!) as { status: string; command: string };
      expect(response.status).toBe('COMPLETED');
      expect(response.command).toBe('report');
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('分析产物 + --format markdown → exit 0', async () => {
    const artifactPath = setupArtifact();
    try {
      const io = captureIO();
      const result = await runCli(['report', artifactPath, '--format', 'markdown'], io);
      expect(result.code).toBe(0);
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('缺少目标 → exit 4', async () => {
    const io = captureIO();
    const result = await runCli(['report'], io);
    expect(result.code).toBe(4);
  });
});

// ─── snapshot 路由 ────────────────────────────────────────────────────────────

describe('CLI 路由：snapshot', () => {
  it('缺少 --output → exit 4', async () => {
    const io = captureIO();
    const result = await runCli(['snapshot', 'file:///some/file.html'], io);
    expect(result.code).toBe(4);
  });

  it('缺少目标 → exit 4', async () => {
    const io = captureIO();
    const result = await runCli(['snapshot', '--output', '/tmp/out.json'], io);
    expect(result.code).toBe(4);
  });
});

// ─── 未知命令 ────────────────────────────────────────────────────────────────

describe('CLI 路由：未知命令', () => {
  it('完全未知的命令 → exit 4', async () => {
    const io = captureIO();
    const result = await runCli(['foobar'], io);
    expect(result.code).toBe(4);
  });
});
