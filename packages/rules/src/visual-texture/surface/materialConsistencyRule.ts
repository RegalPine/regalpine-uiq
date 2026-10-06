import type { EnrichedRuleDefinition } from '../../evaluation/engine';

export const SURFACE_MATERIAL_CONSISTENCY_RULE: EnrichedRuleDefinition = {
  id: 'VISUAL_TEXTURE.SURFACE.MATERIAL_CONSISTENCY',
  version: '1.0.0',
  metricId: 'SURFACE.MATERIAL.CONSISTENCY',
  metricVersion: '1.0.0',
  operator: 'LTE',
  threshold: 0,
  severity: 'MEDIUM',
  valueKey: 'deviationCount',
  applicability: { evaluate() { return 'APPLICABLE'; } },
};
