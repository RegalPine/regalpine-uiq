import type { EnrichedRuleDefinition } from '../../evaluation/engine';

export const SURFACE_SHADOW_CONSISTENCY_RULE: EnrichedRuleDefinition = {
  id: 'VISUAL_TEXTURE.SURFACE.SHADOW_CONSISTENCY',
  version: '1.0.0',
  metricId: 'SURFACE.SHADOW.CONSISTENCY',
  metricVersion: '1.0.0',
  operator: 'LTE',
  threshold: 0,
  severity: 'MEDIUM',
  valueKey: 'deviationCount',
  applicability: { evaluate() { return 'APPLICABLE'; } },
};
