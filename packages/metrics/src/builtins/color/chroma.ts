import type { MetricDefinition } from '@uiq/core';
import type { OKLCH } from '@uiq/color';
import { depResult } from '../helpers';

export const COLOR_CHROMA: MetricDefinition<number> = {
  id: 'COLOR.CHROMA',
  version: '1.0.0',
  kind: 'DERIVED',
  dependencies: [{ metricId: 'COLOR.OKLCH', version: '1.0.0', required: true }],
  calculate(ctx) {
    return depResult<number>(ctx, this.id, this.version, 'COLOR.OKLCH@1.0.0', true, (val) => {
      const lch = val as OKLCH;
      return { value: lch.C };
    });
  },
};
