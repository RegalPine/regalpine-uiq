import type { EnrichedRuleDefinition } from '../../evaluation/engine';

/**
 * 圆角一致性规则：SURFACE.RADIUS.CONSISTENCY
 *
 * deviationCount <= 0 → PASS（所有元素 radius 一致）
 * deviationCount > 0 → FAIL（存在不一致的 radius）
 *
 * 规范基线：UIQ-VISUAL-QUALITY-11 §3.1
 */
export const SURFACE_RADIUS_CONSISTENCY_RULE: EnrichedRuleDefinition = {
  id: 'VISUAL_TEXTURE.SURFACE.RADIUS_CONSISTENCY',
  version: '1.0.0',
  metricId: 'SURFACE.RADIUS.CONSISTENCY',
  metricVersion: '1.0.0',
  operator: 'LTE',
  threshold: 0,
  severity: 'MEDIUM',
  warnThreshold: 1,
  valueKey: 'deviationCount',
  applicability: {
    evaluate(): 'APPLICABLE' | 'NOT_APPLICABLE' | 'UNKNOWN' {
      return 'APPLICABLE';
    },
  },
};
