import type { EnrichedRuleDefinition } from '../../evaluation/engine';

export const DEPTH_ELEVATION_RULE: EnrichedRuleDefinition = {
  id: 'VISUAL_TEXTURE.DEPTH.ELEVATION_HIERARCHY', version: '1.0.0',
  metricId: 'DEPTH.ELEVATION.HIERARCHY', metricVersion: '1.0.0',
  operator: 'GTE', threshold: 2, severity: 'LOW', valueKey: 'levelCount',
  applicability: { evaluate() { return 'APPLICABLE'; } },
};
export const DEPTH_SHADOW_DEPTH_RULE: EnrichedRuleDefinition = {
  id: 'VISUAL_TEXTURE.DEPTH.SHADOW_DEPTH', version: '1.0.0',
  metricId: 'DEPTH.SHADOW.DEPTH', metricVersion: '1.0.0',
  operator: 'LTE', threshold: 5, severity: 'LOW', valueKey: 'distinctDepths',
  applicability: { evaluate() { return 'APPLICABLE'; } },
};
export const DEPTH_LAYER_RULE: EnrichedRuleDefinition = {
  id: 'VISUAL_TEXTURE.DEPTH.LAYER_CONSISTENCY', version: '1.0.0',
  metricId: 'DEPTH.LAYER.CONSISTENCY', metricVersion: '1.0.0',
  operator: 'LTE', threshold: 5, severity: 'LOW', valueKey: 'distinctLayers',
  applicability: { evaluate() { return 'APPLICABLE'; } },
};
export const DEPTH_SEPARATION_RULE: EnrichedRuleDefinition = {
  id: 'VISUAL_TEXTURE.DEPTH.VISUAL_SEPARATION', version: '1.0.0',
  metricId: 'DEPTH.VISUAL.SEPARATION', metricVersion: '1.0.0',
  operator: 'GTE', threshold: 0.5, severity: 'LOW', valueKey: 'separationRatio',
  applicability: { evaluate() { return 'APPLICABLE'; } },
};
export const DEPTH_OVERLAY_RULE: EnrichedRuleDefinition = {
  id: 'VISUAL_TEXTURE.DEPTH.OVERLAY_QUALITY', version: '1.0.0',
  metricId: 'DEPTH.OVERLAY.QUALITY', metricVersion: '1.0.0',
  operator: 'GTE', threshold: 0.5, severity: 'LOW', valueKey: 'avgOpacity',
  applicability: { evaluate() { return 'APPLICABLE'; } },
};
export const DEPTH_SPATIAL_PRIORITY_RULE: EnrichedRuleDefinition = {
  id: 'VISUAL_TEXTURE.DEPTH.SPATIAL_PRIORITY', version: '1.0.0',
  metricId: 'DEPTH.SPATIAL.PRIORITY', metricVersion: '1.0.0',
  operator: 'GTE', threshold: 1, severity: 'INFO', valueKey: 'priorityLevels',
  applicability: { evaluate() { return 'APPLICABLE'; } },
};
