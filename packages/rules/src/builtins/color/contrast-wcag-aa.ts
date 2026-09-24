import type { EnrichedRuleDefinition } from '../../evaluation/engine';

/** WCAG AA 对比度规则：COLOR.CONTRAST >= 4.5 */
export const CONTRAST_WCAG_AA: EnrichedRuleDefinition = {
  id: 'ACCESSIBILITY.CONTRAST.WCAG_AA',
  version: '1.0.0',
  metricId: 'COLOR.CONTRAST',
  metricVersion: '1.0.0',
  operator: 'GTE',
  threshold: 4.5,
  severity: 'HIGH',
  warnThreshold: 5.0,
  valueKey: 'ratio',
  applicability: {
    evaluate(): 'APPLICABLE' | 'NOT_APPLICABLE' | 'UNKNOWN' {
      return 'APPLICABLE';
    },
  },
};
