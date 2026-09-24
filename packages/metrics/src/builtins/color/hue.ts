import type { MetricDefinition } from '@uiq/core';
import type { OKLCH, Hue } from '@uiq/color';
import { depResult } from '../helpers';

export const COLOR_HUE: MetricDefinition<Hue> = {
  id: 'COLOR.HUE',
  version: '1.0.0',
  kind: 'DERIVED',
  dependencies: [{ metricId: 'COLOR.OKLCH', version: '1.0.0', required: true }],
  calculate(ctx) {
    return depResult<Hue>(ctx, this.id, this.version, 'COLOR.OKLCH@1.0.0', true, (val) => {
      const lch = val as OKLCH;
      return { value: lch.H };
    });
  },
};
