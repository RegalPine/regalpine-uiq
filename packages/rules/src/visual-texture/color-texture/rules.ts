import type { EnrichedRuleDefinition } from '../../evaluation/engine';

export const COLOR_LIGHTNESS_HIERARCHY_RULE: EnrichedRuleDefinition = {
  id: 'VISUAL_TEXTURE.COLOR.LIGHTNESS_HIERARCHY', version: '1.0.0',
  metricId: 'COLOR.LIGHTNESS.HIERARCHY', metricVersion: '1.0.0',
  operator: 'GTE', threshold: 2, severity: 'MEDIUM', valueKey: 'hierarchyDepth',
  applicability: { evaluate() { return 'APPLICABLE'; } },
};
export const COLOR_CHROMA_DISTRIBUTION_RULE: EnrichedRuleDefinition = {
  id: 'VISUAL_TEXTURE.COLOR.CHROMA_DISTRIBUTION', version: '1.0.0',
  metricId: 'COLOR.CHROMA.DISTRIBUTION', metricVersion: '1.0.0',
  operator: 'LTE', threshold: 0.8, severity: 'LOW', valueKey: 'stdDev',
  applicability: { evaluate() { return 'APPLICABLE'; } },
};
export const COLOR_HUE_RELATIONSHIP_RULE: EnrichedRuleDefinition = {
  id: 'VISUAL_TEXTURE.COLOR.HUE_RELATIONSHIP', version: '1.0.0',
  metricId: 'COLOR.HUE.RELATIONSHIP', metricVersion: '1.0.0',
  operator: 'LTE', threshold: 120, severity: 'LOW', valueKey: 'distinctHues',
  applicability: { evaluate() { return 'APPLICABLE'; } },
};
export const COLOR_HARMONY_RULE: EnrichedRuleDefinition = {
  id: 'VISUAL_TEXTURE.COLOR.HARMONY', version: '1.0.0',
  metricId: 'COLOR.HARMONY', metricVersion: '1.0.0',
  operator: 'LTE', threshold: 5, severity: 'LOW', valueKey: 'chromaVariance',
  applicability: { evaluate() { return 'APPLICABLE'; } },
};
export const COLOR_TOKEN_CONSISTENCY_RULE: EnrichedRuleDefinition = {
  id: 'VISUAL_TEXTURE.COLOR.TOKEN_CONSISTENCY', version: '1.0.0',
  metricId: 'COLOR.TOKEN.CONSISTENCY', metricVersion: '1.0.0',
  operator: 'LTE', threshold: 0, severity: 'MEDIUM', valueKey: 'deviationCount',
  applicability: { evaluate() { return 'APPLICABLE'; } },
};
export const COLOR_NOISE_RULE: EnrichedRuleDefinition = {
  id: 'VISUAL_TEXTURE.COLOR.NOISE', version: '1.0.0',
  metricId: 'COLOR.NOISE', metricVersion: '1.0.0',
  operator: 'LTE', threshold: 0.5, severity: 'LOW', valueKey: 'noiseRatio',
  applicability: { evaluate() { return 'APPLICABLE'; } },
};
export const COLOR_CONTRAST_QUALITY_RULE: EnrichedRuleDefinition = {
  id: 'VISUAL_TEXTURE.COLOR.CONTRAST_QUALITY', version: '1.0.0',
  metricId: 'COLOR.CONTRAST.QUALITY', metricVersion: '1.0.0',
  operator: 'LTE', threshold: 0, severity: 'HIGH', valueKey: 'failCount',
  applicability: { evaluate() { return 'APPLICABLE'; } },
};
