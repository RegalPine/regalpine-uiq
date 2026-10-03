import type { EnrichedRuleDefinition } from '../../evaluation/engine';

export const SURFACE_LAYER_CONSISTENCY_RULE: EnrichedRuleDefinition = {
  id: 'VISUAL_TEXTURE.SURFACE.LAYER_CONSISTENCY',
  version: '1.0.0',
  metricId: 'SURFACE.LAYER.CONSISTENCY',
  metricVersion: '1.0.0',
  operator: 'LTE',
  threshold: 5,
  severity: 'LOW',
  valueKey: 'distinctZIndices',
  applicability: { evaluate() { return 'APPLICABLE'; } },
};
