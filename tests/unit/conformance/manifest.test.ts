import { describe, expect, it } from 'vitest';
import {
  assertLevelExecutable,
  resolveLevel,
  type GoldenReport,
  type ManifestEntry,
} from '@uiq/conformance';

const ENTRIES: readonly ManifestEntry[] = [
  { caseId: 'CORE-SCHEMA-001', domain: 'schema', status: 'COVERED' },
  { caseId: 'COLOR-CONTRAST-001', domain: 'color', status: 'COVERED' },
  { caseId: 'TOKEN-GOLDEN-001', domain: 'token', status: 'COVERED' },
  { caseId: 'BROWSER-CHROMIUM-001', domain: 'browser', status: 'PENDING' },
  { caseId: 'THEME-ISOLATION-001', domain: 'theme', status: 'PENDING' },
];

const ALL_PASS: GoldenReport = {
  total: 3,
  passed: 3,
  failed: 0,
  cases: [
    { id: 'CORE-SCHEMA-001', version: '1.0.0', status: 'PASS' },
    { id: 'COLOR-CONTRAST-001', version: '1.0.0', status: 'PASS' },
    { id: 'TOKEN-GOLDEN-001', version: '1.0.0', status: 'PASS' },
  ],
};

describe('resolveLevel：四级展开（UIQ-IMPL-11 §5-9）', () => {
  it('CORE 仅含 CORE 域条目', () => {
    const level = resolveLevel(ENTRIES, 'CORE');
    expect(level.map((e) => e.caseId)).toEqual(['CORE-SCHEMA-001']);
  });

  it('STANDARD 包含 CORE + Metric/Rule/Token/Diagnostic Golden', () => {
    const level = resolveLevel(ENTRIES, 'STANDARD');
    expect(level.map((e) => e.caseId)).toEqual([
      'CORE-SCHEMA-001',
      'COLOR-CONTRAST-001',
      'TOKEN-GOLDEN-001',
    ]);
  });

  it('BROWSER 追加 browser 域（含 PENDING，不隐藏未完成范围）', () => {
    const level = resolveLevel(ENTRIES, 'BROWSER');
    expect(level.some((e) => e.caseId === 'BROWSER-CHROMIUM-001')).toBe(true);
  });

  it('FULL 追加 Theme/Component/Regression/E2E 域', () => {
    const level = resolveLevel(ENTRIES, 'FULL');
    expect(level).toHaveLength(5);
  });

  it('未知域抛错（等级归属必须显式登记）', () => {
    const entries: ManifestEntry[] = [
      ...ENTRIES,
      { caseId: 'X', domain: 'mystery', status: 'COVERED' },
    ];
    expect(() => resolveLevel(entries, 'FULL')).toThrow(/mystery/);
  });
});

describe('assertLevelExecutable：缺少用例不能报全等级通过（PLAN §9.2）', () => {
  it('COVERED + 全 PASS → executable', () => {
    const level = resolveLevel(ENTRIES, 'STANDARD');
    const result = assertLevelExecutable(level, ALL_PASS);
    expect(result.executable).toBe(true);
    expect(result.pendingCases).toEqual([]);
  });

  it('存在 PENDING → 不可宣称通过，且列出缺失用例', () => {
    const level = resolveLevel(ENTRIES, 'FULL');
    const result = assertLevelExecutable(level, ALL_PASS);
    expect(result.executable).toBe(false);
    expect(result.pendingCases).toEqual(['BROWSER-CHROMIUM-001', 'THEME-ISOLATION-001']);
    expect(result.message).toContain('PENDING 2');
  });

  it('report 中失败用例 → 不可宣称通过', () => {
    const failedReport: GoldenReport = {
      ...ALL_PASS,
      passed: 2,
      failed: 1,
      cases: [
        { id: 'CORE-SCHEMA-001', version: '1.0.0', status: 'PASS' },
        { id: 'COLOR-CONTRAST-001', version: '1.0.0', status: 'FAIL' },
        { id: 'TOKEN-GOLDEN-001', version: '1.0.0', status: 'PASS' },
      ],
    };
    const result = assertLevelExecutable(resolveLevel(ENTRIES, 'STANDARD'), failedReport);
    expect(result.executable).toBe(false);
    expect(result.failedCases).toEqual(['COLOR-CONTRAST-001']);
  });

  it('report 多出的用例不在清单中时不阻断（清单是覆盖下限）', () => {
    const extraReport: GoldenReport = {
      ...ALL_PASS,
      cases: [...ALL_PASS.cases, { id: 'EXTRA-001', version: '1.0.0', status: 'FAIL' }],
    };
    const result = assertLevelExecutable(resolveLevel(ENTRIES, 'STANDARD'), extraReport);
    expect(result.executable).toBe(true);
  });
});
