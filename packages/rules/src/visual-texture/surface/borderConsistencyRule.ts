import type { EnrichedRuleDefinition } from '../../evaluation/engine';

export const SURFACE_BORDER_CONSISTENCY_RULE: EnrichedRuleDefinition = {
  id: 'VISUAL_TEXTURE.SURFACE.BORDER_CONSISTENCY',
  version: '1.0.0',
  metricId: 'SURFACE.BORDER.CONSISTENCY',
  metricVersion: '1.0.0',
  operator: 'LTE',
  threshold: 0,
  severity: 'MEDIUM',
  valueKey: 'deviationCount',
  applicability: { evaluate() { return 'APPLICABLE'; } },
};
