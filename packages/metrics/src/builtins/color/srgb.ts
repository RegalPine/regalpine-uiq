import type { MetricDefinition } from '@uiq/core';
import type { SRGB } from '@uiq/color';
import { baseResult } from '../helpers';

export const COLOR_SRGB: MetricDefinition<SRGB> = {
  id: 'COLOR.SRGB',
  version: '1.0.0',
  kind: 'BASE',
  dependencies: [],
  calculate(ctx) {
    return baseResult<SRGB>(ctx, this.id, this.version, 'color.srgb');
  },
};
