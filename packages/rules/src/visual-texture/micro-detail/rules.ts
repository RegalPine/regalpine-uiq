import type { EnrichedRuleDefinition } from '../../evaluation/engine';

// === 原有 10 条规则 (Phase 3: metricId 对齐架构文档 §7.1) ===

export const MICRO_STATE_COMPLETENESS_RULE: EnrichedRuleDefinition = {
  id: 'VISUAL_TEXTURE.MICRO_DETAIL.STATE_COMPLETENESS', version: '1.0.0',
  metricId: 'MICRO_DETAIL.STATE.COMPLETENESS', metricVersion: '1.0.0',
  operator: 'GTE', threshold: 1, severity: 'MEDIUM', valueKey: 'populationSize',
  applicability: { evaluate() { return 'APPLICABLE'; } },
};
export const MICRO_COMPONENT_CONSISTENCY_RULE: EnrichedRuleDefinition = {
  id: 'VISUAL_TEXTURE.MICRO_DETAIL.COMPONENT_CONSISTENCY', version: '1.0.0',
  metricId: 'MICRO_DETAIL.COMPONENT.CONSISTENCY', metricVersion: '1.0.0',
  operator: 'GTE', threshold: 0.5, severity: 'LOW', valueKey: 'stateCoverage',
  applicability: { evaluate() { return 'APPLICABLE'; } },
};
export const MICRO_ICON_CONSISTENCY_RULE: EnrichedRuleDefinition = {
  id: 'VISUAL_TEXTURE.MICRO_DETAIL.ICON_CONSISTENCY', version: '1.0.0',
  metricId: 'MICRO_DETAIL.ICON.CONSISTENCY', metricVersion: '1.0.0',
  operator: 'LTE', threshold: 2, severity: 'LOW', valueKey: 'distinctSizes',
  applicability: { evaluate() { return 'APPLICABLE'; } },
};
export const MICRO_FOCUS_QUALITY_RULE: EnrichedRuleDefinition = {
  id: 'VISUAL_TEXTURE.MICRO_DETAIL.FOCUS_QUALITY', version: '1.0.0',
  metricId: 'MICRO_DETAIL.FOCUS.QUALITY', metricVersion: '1.0.0',
  operator: 'GTE', threshold: 1, severity: 'MEDIUM', valueKey: 'hasOutline',
  applicability: { evaluate() { return 'APPLICABLE'; } },
};
export const MICRO_DISABLED_QUALITY_RULE: EnrichedRuleDefinition = {
  id: 'VISUAL_TEXTURE.MICRO_DETAIL.DISABLED_QUALITY', version: '1.0.0',
  metricId: 'MICRO_DETAIL.DISABLED.QUALITY', metricVersion: '1.0.0',
  operator: 'GTE', threshold: 0, severity: 'INFO', valueKey: 'populationSize',
  applicability: { evaluate() { return 'APPLICABLE'; } },
};
export const MICRO_EMPTY_QUALITY_RULE: EnrichedRuleDefinition = {
  id: 'VISUAL_TEXTURE.MICRO_DETAIL.EMPTY_QUALITY', version: '1.0.0',
  metricId: 'MICRO_DETAIL.EMPTY.QUALITY', metricVersion: '1.0.0',
  operator: 'GTE', threshold: 0, severity: 'INFO', valueKey: 'populationSize',
  applicability: { evaluate() { return 'APPLICABLE'; } },
};
export const MICRO_BORDER_DETAIL_RULE: EnrichedRuleDefinition = {
  id: 'VISUAL_TEXTURE.MICRO_DETAIL.BORDER_DETAIL', version: '1.0.0',
  metricId: 'MICRO_DETAIL.BORDER.DETAIL', metricVersion: '1.0.0',
  operator: 'GTE', threshold: 0.5, severity: 'LOW', valueKey: 'consistency',
  applicability: { evaluate() { return 'APPLICABLE'; } },
};
export const MICRO_RADIUS_DETAIL_RULE: EnrichedRuleDefinition = {
  id: 'VISUAL_TEXTURE.MICRO_DETAIL.RADIUS_DETAIL', version: '1.0.0',
  metricId: 'MICRO_DETAIL.RADIUS.DETAIL', metricVersion: '1.0.0',
  operator: 'GTE', threshold: 0.5, severity: 'LOW', valueKey: 'consistency',
  applicability: { evaluate() { return 'APPLICABLE'; } },
};
export const MICRO_LOADING_QUALITY_RULE: EnrichedRuleDefinition = {
  id: 'VISUAL_TEXTURE.MICRO_DETAIL.LOADING_QUALITY', version: '1.0.0',
  metricId: 'MICRO_DETAIL.LOADING.QUALITY', metricVersion: '1.0.0',
  operator: 'GTE', threshold: 0, severity: 'INFO', valueKey: 'populationSize',
  applicability: { evaluate() { return 'APPLICABLE'; } },
};
export const MICRO_ERROR_QUALITY_RULE: EnrichedRuleDefinition = {
  id: 'VISUAL_TEXTURE.MICRO_DETAIL.ERROR_QUALITY', version: '1.0.0',
  metricId: 'MICRO_DETAIL.ERROR.QUALITY', metricVersion: '1.0.0',
  operator: 'GTE', threshold: 0, severity: 'MEDIUM', valueKey: 'populationSize',
  applicability: { evaluate() { return 'APPLICABLE'; } },
};

// === Phase 2: 6 条新增规则 ===

export const MICRO_HOVER_COMPLETENESS_RULE: EnrichedRuleDefinition = {
  id: 'VISUAL_TEXTURE.MICRO_DETAIL.HOVER_COMPLETENESS', version: '1.0.0',
  metricId: 'MICRO_DETAIL.HOVER.COMPLETENESS', metricVersion: '1.0.0',
  operator: 'GTE', threshold: 1, severity: 'MEDIUM', valueKey: 'withHoverFeedback',
  applicability: { evaluate() { return 'APPLICABLE'; } },
};
export const MICRO_ACTIVE_FEEDBACK_RULE: EnrichedRuleDefinition = {
  id: 'VISUAL_TEXTURE.MICRO_DETAIL.ACTIVE_FEEDBACK', version: '1.0.0',
  metricId: 'MICRO_DETAIL.ACTIVE.FEEDBACK', metricVersion: '1.0.0',
  operator: 'GTE', threshold: 1, severity: 'LOW', valueKey: 'withActiveFeedback',
  applicability: { evaluate() { return 'APPLICABLE'; } },
};
export const MICRO_SELECTED_DIFFERENTIATION_RULE: EnrichedRuleDefinition = {
  id: 'VISUAL_TEXTURE.MICRO_DETAIL.SELECTED_DIFFERENTIATION', version: '1.0.0',
  metricId: 'MICRO_DETAIL.SELECTED.DIFFERENTIATION', metricVersion: '1.0.0',
  operator: 'GTE', threshold: 0.5, severity: 'LOW', valueKey: 'differentiationScore',
  applicability: { evaluate() { return 'APPLICABLE'; } },
};
export const MICRO_ICON_ALIGNMENT_RULE: EnrichedRuleDefinition = {
  id: 'VISUAL_TEXTURE.MICRO_DETAIL.ICON_ALIGNMENT', version: '1.0.0',
  metricId: 'MICRO_DETAIL.ICON.ALIGNMENT', metricVersion: '1.0.0',
  operator: 'LTE', threshold: 2, severity: 'LOW', valueKey: 'avgVerticalOffset',
  applicability: { evaluate() { return 'APPLICABLE'; } },
};
export const MICRO_COMPONENT_DENSITY_RULE: EnrichedRuleDefinition = {
  id: 'VISUAL_TEXTURE.MICRO_DETAIL.COMPONENT_DENSITY', version: '1.0.0',
  metricId: 'MICRO_DETAIL.COMPONENT.DENSITY', metricVersion: '1.0.0',
  operator: 'LTE', threshold: 10, severity: 'INFO', valueKey: 'avgDensity',
  applicability: { evaluate() { return 'APPLICABLE'; } },
};
export const MICRO_FRAGMENTATION_RULE: EnrichedRuleDefinition = {
  id: 'VISUAL_TEXTURE.MICRO_DETAIL.FRAGMENTATION', version: '1.0.0',
  metricId: 'MICRO_DETAIL.FRAGMENTATION', metricVersion: '1.0.0',
  operator: 'LTE', threshold: 0.5, severity: 'MEDIUM', valueKey: 'overallFragmentation',
  applicability: { evaluate() { return 'APPLICABLE'; } },
};
