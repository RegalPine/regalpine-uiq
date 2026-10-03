import type { EnrichedRuleDefinition } from '../../evaluation/engine';

export const MOTION_TRANSITION_RULE: EnrichedRuleDefinition = {
  id: 'VISUAL_TEXTURE.MOTION.TRANSITION_QUALITY', version: '1.0.0',
  metricId: 'MOTION.TRANSITION.QUALITY', metricVersion: '1.0.0',
  operator: 'LTE', threshold: 500, severity: 'LOW', valueKey: 'avgDuration',
  applicability: { evaluate() { return 'APPLICABLE'; } },
};
export const MOTION_ANIMATION_TIMING_RULE: EnrichedRuleDefinition = {
  id: 'VISUAL_TEXTURE.MOTION.ANIMATION_TIMING', version: '1.0.0',
  metricId: 'MOTION.ANIMATION.TIMING', metricVersion: '1.0.0',
  operator: 'LTE', threshold: 1000, severity: 'LOW', valueKey: 'avgDuration',
  applicability: { evaluate() { return 'APPLICABLE'; } },
};
export const MOTION_EASING_RULE: EnrichedRuleDefinition = {
  id: 'VISUAL_TEXTURE.MOTION.EASING_QUALITY', version: '1.0.0',
  metricId: 'MOTION.EASING.QUALITY', metricVersion: '1.0.0',
  operator: 'LTE', threshold: 3, severity: 'LOW', valueKey: 'distinctEasings',
  applicability: { evaluate() { return 'APPLICABLE'; } },
};
export const MOTION_STATE_CHANGE_RULE: EnrichedRuleDefinition = {
  id: 'VISUAL_TEXTURE.MOTION.STATE_SMOOTHNESS', version: '1.0.0',
  metricId: 'MOTION.STATE.SMOOTHNESS', metricVersion: '1.0.0',
  operator: 'GTE', threshold: 1, severity: 'LOW', valueKey: 'stateCount',
  applicability: { evaluate() { return 'APPLICABLE'; } },
};
export const MOTION_CONSISTENCY_RULE: EnrichedRuleDefinition = {
  id: 'VISUAL_TEXTURE.MOTION.CONSISTENCY', version: '1.0.0',
  metricId: 'MOTION.CONSISTENCY', metricVersion: '1.0.0',
  operator: 'LTE', threshold: 5000, severity: 'LOW', valueKey: 'durationVariance',
  applicability: { evaluate() { return 'APPLICABLE'; } },
};
export const MOTION_LOADING_RULE: EnrichedRuleDefinition = {
  id: 'VISUAL_TEXTURE.MOTION.LOADING_QUALITY', version: '1.0.0',
  metricId: 'MOTION.LOADING.QUALITY', metricVersion: '1.0.0',
  operator: 'GTE', threshold: 0, severity: 'INFO', valueKey: 'populationSize',
  applicability: { evaluate() { return 'APPLICABLE'; } },
};
export const MOTION_DURATION_CONSISTENCY_RULE: EnrichedRuleDefinition = {
  id: 'VISUAL_TEXTURE.MOTION.DURATION_CONSISTENCY', version: '1.0.0',
  metricId: 'MOTION.DURATION.CONSISTENCY', metricVersion: '1.0.0',
  operator: 'GTE', threshold: 0.5, severity: 'LOW', valueKey: 'consistency',
  applicability: { evaluate() { return 'APPLICABLE'; } },
};
