import type { EnrichedRuleDefinition } from '../../evaluation/engine';

export const TYPO_FONT_CONSISTENCY_RULE: EnrichedRuleDefinition = {
  id: 'VISUAL_TEXTURE.TYPOGRAPHY.FONT_CONSISTENCY', version: '1.0.0',
  metricId: 'TYPOGRAPHY.FONT.CONSISTENCY', metricVersion: '1.0.0',
  operator: 'LTE', threshold: 3, severity: 'MEDIUM', valueKey: 'distinctFamilies',
  applicability: { evaluate() { return 'APPLICABLE'; } },
};
export const TYPO_SCALE_CONSISTENCY_RULE: EnrichedRuleDefinition = {
  id: 'VISUAL_TEXTURE.TYPOGRAPHY.SCALE_CONSISTENCY', version: '1.0.0',
  metricId: 'TYPOGRAPHY.SCALE.CONSISTENCY', metricVersion: '1.0.0',
  operator: 'LTE', threshold: 5, severity: 'LOW', valueKey: 'distinctSizes',
  applicability: { evaluate() { return 'APPLICABLE'; } },
};
export const TYPO_WEIGHT_HIERARCHY_RULE: EnrichedRuleDefinition = {
  id: 'VISUAL_TEXTURE.TYPOGRAPHY.WEIGHT_HIERARCHY', version: '1.0.0',
  metricId: 'TYPOGRAPHY.WEIGHT.HIERARCHY', metricVersion: '1.0.0',
  operator: 'LTE', threshold: 4, severity: 'LOW', valueKey: 'distinctWeights',
  applicability: { evaluate() { return 'APPLICABLE'; } },
};
export const TYPO_LINEHEIGHT_RHYTHM_RULE: EnrichedRuleDefinition = {
  id: 'VISUAL_TEXTURE.TYPOGRAPHY.LINEHEIGHT_RHYTHM', version: '1.0.0',
  metricId: 'TYPOGRAPHY.LINEHEIGHT.RHYTHM', metricVersion: '1.0.0',
  operator: 'LTE', threshold: 3, severity: 'LOW', valueKey: 'distinctRatios',
  applicability: { evaluate() { return 'APPLICABLE'; } },
};
export const TYPO_SPACING_QUALITY_RULE: EnrichedRuleDefinition = {
  id: 'VISUAL_TEXTURE.TYPOGRAPHY.SPACING_QUALITY', version: '1.0.0',
  metricId: 'TYPOGRAPHY.SPACING.QUALITY', metricVersion: '1.0.0',
  operator: 'LTE', threshold: 0, severity: 'LOW', valueKey: 'consistency',
  applicability: { evaluate() { return 'APPLICABLE'; } },
};
export const TYPO_DENSITY_BALANCE_RULE: EnrichedRuleDefinition = {
  id: 'VISUAL_TEXTURE.TYPOGRAPHY.DENSITY_BALANCE', version: '1.0.0',
  metricId: 'TYPOGRAPHY.DENSITY.BALANCE', metricVersion: '1.0.0',
  operator: 'GTE', threshold: 1.2, severity: 'LOW', valueKey: 'densityRatio',
  applicability: { evaluate() { return 'APPLICABLE'; } },
};
export const TYPO_HIERARCHY_RULE: EnrichedRuleDefinition = {
  id: 'VISUAL_TEXTURE.TYPOGRAPHY.HIERARCHY', version: '1.0.0',
  metricId: 'TYPOGRAPHY.HIERARCHY', metricVersion: '1.0.0',
  operator: 'GTE', threshold: 3, severity: 'MEDIUM', valueKey: 'levelCount',
  applicability: { evaluate() { return 'APPLICABLE'; } },
};
