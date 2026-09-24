/**
 * P9：分析结果导入（IMPL-10 §33）。
 *
 * 加载已保存 JSON 快照/分析结果，恢复 Inspector 状态。
 */
import type {
  MetricResult,
  EvaluationResult,
  Finding,
  Diagnostic,
  MeasurementSnapshot,
} from '@uiq/core';
import type { InspectionResult } from '../runtime/InspectorController';

export interface ImportResult {
  readonly success: boolean;
  readonly data: InspectionResult | null;
  readonly error: string | null;
  readonly metadata: ImportMetadata | null;
}

export interface ImportMetadata {
  readonly uiqEngineVersion: string;
  readonly exportedAt: string;
  readonly browser: string;
  readonly viewport: { width: number; height: number } | null;
  readonly themeId: string | null;
}

/** 从 JSON 字符串导入分析结果。 */
export function importJson(jsonString: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    return { success: false, data: null, error: 'Invalid JSON', metadata: null };
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('__uiq' in parsed) ||
    (parsed as { __uiq: unknown }).__uiq !== 'INSPECTION_REPORT'
  ) {
    return { success: false, data: null, error: 'Not a UIQ Inspection Report', metadata: null };
  }

  const report = parsed as Record<string, unknown>;
  const metadata = report['metadata'] as Record<string, unknown> | undefined;

  if (metadata === undefined) {
    return { success: false, data: null, error: 'Missing metadata', metadata: null };
  }

  // Reconstruct minimal InspectionResult
  const snapshotData = report['snapshot'] as Record<string, unknown> | undefined;
  if (snapshotData === undefined) {
    return { success: false, data: null, error: 'Missing snapshot data', metadata: null };
  }

  const snapshot: MeasurementSnapshot = {
    id: snapshotData['id'] as string,
    capturedAt: snapshotData['capturedAt'] as number,
    source: snapshotData['source'] as MeasurementSnapshot['source'],
    measurements: [],
  };

  const engineData = report['engine'] as Record<string, unknown> | undefined;

  const importResult: InspectionResult = {
    subjectId: (report['subjectId'] as string | null) ?? null,
    snapshot,
    metrics: (report['metrics'] as MetricResult[]) ?? [],
    evaluations: (report['evaluations'] as EvaluationResult[]) ?? [],
    findings: (report['findings'] as Finding[]) ?? [],
    diagnostics: (report['diagnostics'] as Diagnostic[]) ?? [],
    engine: {
      metrics: {
        name: (((engineData?.['metrics'] as Record<string, unknown>)?.['name'] as string) ??
          '@uiq/metrics') as '@uiq/metrics',
        version: (((engineData?.['metrics'] as Record<string, unknown>)?.['version'] as string) ??
          '1.0.0') as '1.0.0',
      },
      rules: {
        name: (((engineData?.['rules'] as Record<string, unknown>)?.['name'] as string) ??
          '@uiq/rules') as '@uiq/rules',
        version: (((engineData?.['rules'] as Record<string, unknown>)?.['version'] as string) ??
          '1.0.0') as '1.0.0',
      },
      diagnostics: {
        name: (((engineData?.['diagnostics'] as Record<string, unknown>)?.['name'] as string) ??
          '@uiq/diagnostic') as '@uiq/diagnostic',
        version: (((engineData?.['diagnostics'] as Record<string, unknown>)?.[
          'version'
        ] as string) ?? '1.0.0') as '1.0.0',
      },
    },
  };

  const importMetadata: ImportMetadata = {
    uiqEngineVersion: metadata['uiqEngineVersion'] as string,
    exportedAt: metadata['exportedAt'] as string,
    browser: metadata['browser'] as string,
    viewport: (metadata['viewport'] as { width: number; height: number } | null) ?? null,
    themeId: (metadata['themeId'] as string | null) ?? null,
  };

  return { success: true, data: importResult, error: null, metadata: importMetadata };
}
