import type { MetricDefinition } from '@uiq/core';
import { baseResult } from '../helpers';

export const GEOMETRY_HEIGHT: MetricDefinition<number> = {
  id: 'GEOMETRY.HEIGHT',
  version: '1.0.0',
  kind: 'BASE',
  dependencies: [],
  calculate(ctx) {
    return baseResult<number>(ctx, this.id, this.version, 'geometry.height', 'px');
  },
};
