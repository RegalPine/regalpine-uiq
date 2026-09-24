import type { MetricDefinition } from '@uiq/core';
import { baseResult } from '../helpers';

export const TYPOGRAPHY_TEXT_MEASURE: MetricDefinition<number> = {
  id: 'TYPOGRAPHY.TEXT_MEASURE',
  version: '1.0.0',
  kind: 'DERIVED',
  dependencies: [],
  calculate(ctx) {
    return baseResult<number>(ctx, this.id, this.version, 'typography.text-measure', 'px');
  },
};
