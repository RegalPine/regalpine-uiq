import type { MetricDefinition } from '@uiq/core';
import { baseResult } from '../helpers';

export const GEOMETRY_WIDTH: MetricDefinition<number> = {
  id: 'GEOMETRY.WIDTH',
  version: '1.0.0',
  kind: 'BASE',
  dependencies: [],
  calculate(ctx) {
    return baseResult<number>(ctx, this.id, this.version, 'geometry.width', 'px');
  },
};
