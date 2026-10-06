import type { EnrichedRuleDefinition } from '../../evaluation/engine';

export const SPATIAL_GRID_RULE: EnrichedRuleDefinition = {
  id: 'VISUAL_TEXTURE.SPATIAL.GRID_CONSISTENCY', version: '1.0.0',
  metricId: 'SPATIAL.GRID.CONSISTENCY', metricVersion: '1.0.0',
  operator: 'GTE', threshold: 0.7, severity: 'MEDIUM', valueKey: 'alignmentScore',
  applicability: { evaluate() { return 'APPLICABLE'; } },
};
export const SPATIAL_ALIGNMENT_RULE: EnrichedRuleDefinition = {
  id: 'VISUAL_TEXTURE.SPATIAL.ALIGNMENT_CONSISTENCY', version: '1.0.0',
  metricId: 'SPATIAL.ALIGNMENT.CONSISTENCY', metricVersion: '1.0.0',
  operator: 'LTE', threshold: 0, severity: 'MEDIUM', valueKey: 'deviationCount',
  applicability: { evaluate() { return 'APPLICABLE'; } },
};
export const SPATIAL_SPACING_RULE: EnrichedRuleDefinition = {
  id: 'VISUAL_TEXTURE.SPATIAL.SPACING_RHYTHM', version: '1.0.0',
  metricId: 'SPATIAL.SPACING.RHYTHM', metricVersion: '1.0.0',
  operator: 'LTE', threshold: 3, severity: 'LOW', valueKey: 'distinctGaps',
  applicability: { evaluate() { return 'APPLICABLE'; } },
};
export const SPATIAL_WHITESPACE_RULE: EnrichedRuleDefinition = {
  id: 'VISUAL_TEXTURE.SPATIAL.WHITESPACE_QUALITY', version: '1.0.0',
  metricId: 'SPATIAL.WHITESPACE.QUALITY', metricVersion: '1.0.0',
  operator: 'GTE', threshold: 0.15, severity: 'LOW', valueKey: 'whitespaceRatio',
  applicability: { evaluate() { return 'APPLICABLE'; } },
};
export const SPATIAL_DENSITY_RULE: EnrichedRuleDefinition = {
  id: 'VISUAL_TEXTURE.SPATIAL.DENSITY_BALANCE', version: '1.0.0',
  metricId: 'SPATIAL.DENSITY.BALANCE', metricVersion: '1.0.0',
  operator: 'LTE', threshold: 10000, severity: 'LOW', valueKey: 'densityVariance',
  applicability: { evaluate() { return 'APPLICABLE'; } },
};
export const SPATIAL_PROPORTION_RULE: EnrichedRuleDefinition = {
  id: 'VISUAL_TEXTURE.SPATIAL.PROPORTION_QUALITY', version: '1.0.0',
  metricId: 'SPATIAL.PROPORTION.QUALITY', metricVersion: '1.0.0',
  operator: 'LTE', threshold: 5, severity: 'LOW', valueKey: 'ratioVariance',
  applicability: { evaluate() { return 'APPLICABLE'; } },
};
export const SPATIAL_COMPOSITION_RULE: EnrichedRuleDefinition = {
  id: 'VISUAL_TEXTURE.SPATIAL.COMPOSITION_BALANCE', version: '1.0.0',
  metricId: 'SPATIAL.COMPOSITION.BALANCE', metricVersion: '1.0.0',
  operator: 'GTE', threshold: 0.3, severity: 'LOW', valueKey: 'symmetryScore',
  applicability: { evaluate() { return 'APPLICABLE'; } },
};
