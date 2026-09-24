import type { MetricDefinition } from '@uiq/core';
import { baseResult } from '../helpers';

export const TYPOGRAPHY_FONT_SIZE: MetricDefinition<number> = {
  id: 'TYPOGRAPHY.FONT_SIZE',
  version: '1.0.0',
  kind: 'BASE',
  dependencies: [],
  calculate(ctx) {
    return baseResult<number>(ctx, this.id, this.version, 'typography.font-size', 'px');
  },
};
