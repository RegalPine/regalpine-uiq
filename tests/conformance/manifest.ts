import type { ConformanceLevel, ManifestEntry } from '@uiq/conformance';

/**
 * 工程 Conformance 清单数据（P6-05：清单由调用方维护，conformance 包只提供类型与纯函数）。
 * 状态语义：COVERED = 已有可执行 Golden 且纳入 conformance 驱动；PENDING = 计划中未达成。
 */
export const CONFORMANCE_MANIFEST: readonly ManifestEntry[] = [
  // STANDARD 域（对应 tests/golden 六文件；GoldenRunner 驱动样例见 conformance-runner.test.ts）
  { caseId: 'GOLDEN-COLOR-001', domain: 'color', status: 'COVERED' },
  { caseId: 'METRIC-GOLDEN-GEOMETRY', domain: 'geometry', status: 'COVERED' },
  { caseId: 'METRIC-GOLDEN-TYPOGRAPHY', domain: 'typography', status: 'COVERED' },
  { caseId: 'RULE-GOLDEN-CONTRAST', domain: 'rule', status: 'COVERED' },
  { caseId: 'DIAGNOSTIC-GOLDEN-CONTRAST', domain: 'diagnostic', status: 'COVERED' },
  { caseId: 'TOKEN-GOLDEN-001', domain: 'token', status: 'COVERED' },
  // BROWSER 域（IMPL-11 §8：要求三浏览器一致；当前仅 Chromium → PENDING）
  { caseId: 'BROWSER-GOLDEN-CROSS-BROWSER', domain: 'browser', status: 'PENDING' },
  // FULL 域
  { caseId: 'THEME-GOLDEN-PER-THEME', domain: 'theme', status: 'PENDING' },
  { caseId: 'COMPONENT-GOLDEN-LAYOUT', domain: 'component', status: 'PENDING' },
  { caseId: 'REGRESSION-GOLDEN-END-TO-END', domain: 'regression', status: 'PENDING' },
  { caseId: 'E2E-GOLDEN-FULL-PIPELINE', domain: 'e2e', status: 'PENDING' },
  // P7-05：报告 Golden RPT-001~007 落地（tests/golden/reporting.test.ts）。
  { caseId: 'REPORTING-GOLDEN-001', domain: 'reporting', status: 'COVERED' },
];

/** 可宣称的等级：存在 PENDING 或 failed 时对应等级不可宣称（assertLevelExecutable）。 */
export const TARGET_LEVEL: ConformanceLevel = 'FULL';
