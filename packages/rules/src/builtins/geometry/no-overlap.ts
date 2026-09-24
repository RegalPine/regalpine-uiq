import type { EnrichedRuleDefinition } from '../../evaluation/engine';

/** 无重叠规则：GEOMETRY.OVERLAP 面积 == 0 */
export const NO_OVERLAP: EnrichedRuleDefinition = {
  id: 'GEOMETRY.OVERLAP.NONE',
  version: '1.0.0',
  metricId: 'GEOMETRY.OVERLAP',
  metricVersion: '1.0.0',
  operator: 'EQ',
  threshold: 0,
  severity: 'MEDIUM',
  valueKey: 'area',
  applicability: {
    evaluate(): 'APPLICABLE' | 'NOT_APPLICABLE' | 'UNKNOWN' {
      return 'APPLICABLE';
    },
  },
};
