import type { EnrichedRuleDefinition } from '../../evaluation/engine';

/** Shadow Complexity 是纯事实度量，默认 PASS（不判断好坏）。 */
export const SURFACE_SHADOW_COMPLEXITY_RULE: EnrichedRuleDefinition = {
  id: 'VISUAL_TEXTURE.SURFACE.SHADOW_COMPLEXITY',
  version: '1.0.0',
  metricId: 'SURFACE.SHADOW.COMPLEXITY',
  metricVersion: '1.0.0',
  operator: 'LTE',
  threshold: 100,
  severity: 'INFO',
  valueKey: 'totalLayers',
  applicability: { evaluate() { return 'APPLICABLE'; } },
};
