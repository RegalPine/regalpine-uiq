import { fingerprint } from '@uiq/core';

/** 从 Finding ID 生成确定性 Diagnostic ID。 */
export function createDiagnosticId(findingId: string): string {
  return `DX-${fingerprint(findingId).slice(0, 8)}`;
}
