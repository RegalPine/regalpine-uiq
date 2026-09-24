/** UIQ-IMPL-11 §46：六类回归分类（AD-23：新分类只能在正式协议修订后增加）。 */
export type RegressionCategory =
  | 'NEW_FAILURE'
  | 'FIXED_FAILURE'
  | 'PERSISTING_FAILURE'
  | 'CHANGED_RESULT'
  | 'NEW_UNKNOWN'
  | 'RESOLVED_UNKNOWN';

export const REGRESSION_CATEGORIES: readonly RegressionCategory[] = [
  'NEW_FAILURE',
  'FIXED_FAILURE',
  'PERSISTING_FAILURE',
  'CHANGED_RESULT',
  'NEW_UNKNOWN',
  'RESOLVED_UNKNOWN',
];
