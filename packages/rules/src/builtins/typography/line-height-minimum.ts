import type { EnrichedRuleDefinition } from '../../evaluation/engine';

/** 最小行高规则：TYPOGRAPHY.LINE_HEIGHT 比例 >= 1.2 */
export const LINE_HEIGHT_MINIMUM: EnrichedRuleDefinition = {
  id: 'TYPOGRAPHY.LINE_HEIGHT.MINIMUM',
  version: '1.0.0',
  metricId: 'TYPOGRAPHY.LINE_HEIGHT',
  metricVersion: '1.0.0',
  operator: 'GTE',
  threshold: 1.2,
  severity: 'LOW',
  valueKey: 'ratio',
  applicability: {
    evaluate(): 'APPLICABLE' | 'NOT_APPLICABLE' | 'UNKNOWN' {
      return 'APPLICABLE';
    },
  },
};
