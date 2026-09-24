import type { RuleDefinition } from '@uiq/core';

/** 最小字号规则：TYPOGRAPHY.FONT_SIZE >= 12 */
export const FONT_SIZE_MINIMUM: RuleDefinition = {
  id: 'TYPOGRAPHY.FONT_SIZE.MINIMUM',
  version: '1.0.0',
  metricId: 'TYPOGRAPHY.FONT_SIZE',
  metricVersion: '1.0.0',
  operator: 'GTE',
  threshold: 12,
  severity: 'MEDIUM',
  applicability: {
    evaluate(): 'APPLICABLE' | 'NOT_APPLICABLE' | 'UNKNOWN' {
      return 'APPLICABLE';
    },
  },
};
