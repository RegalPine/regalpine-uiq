import type { EnrichedRuleDefinition } from '../../evaluation/engine';

/**
 * 圆角碎片化规则：SURFACE.RADIUS.FRAGMENTATION
 *
 * fragmentationRatio <= 0.3 → PASS（碎片化程度低）
 * fragmentationRatio > 0.3 → FAIL（碎片化程度高）
 *
 * 规范基线：UIQ-VISUAL-QUALITY-11 §3.2
 */
export const SURFACE_RADIUS_FRAGMENTATION_RULE: EnrichedRuleDefinition = {
  id: 'VISUAL_TEXTURE.SURFACE.RADIUS_FRAGMENTATION',
  version: '1.0.0',
  metricId: 'SURFACE.RADIUS.FRAGMENTATION',
  metricVersion: '1.0.0',
  operator: 'LTE',
  threshold: 0.3,
  severity: 'LOW',
  warnThreshold: 0.2,
  valueKey: 'fragmentationRatio',
  applicability: {
    evaluate(): 'APPLICABLE' | 'NOT_APPLICABLE' | 'UNKNOWN' {
      return 'APPLICABLE';
    },
  },
};
