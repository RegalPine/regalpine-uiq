import type { MetricDefinition } from '@uiq/core';
import { baseResult } from '../helpers';

export const TYPOGRAPHY_LETTER_SPACING: MetricDefinition<number> = {
  id: 'TYPOGRAPHY.LETTER_SPACING',
  version: '1.0.0',
  kind: 'BASE',
  dependencies: [],
  calculate(ctx) {
    return baseResult<number>(ctx, this.id, this.version, 'typography.letter-spacing', 'px');
  },
};
