import type { MetricDefinition } from '@uiq/core';
import type { OKLCH, OKLab } from '@uiq/color';
import { oklabToOklch } from '@uiq/color';
import { depResult } from '../helpers';

export const COLOR_OKLCH: MetricDefinition<OKLCH> = {
  id: 'COLOR.OKLCH',
  version: '1.0.0',
  kind: 'DERIVED',
  dependencies: [{ metricId: 'COLOR.OKLAB', version: '1.0.0', required: true }],
  calculate(ctx) {
    return depResult<OKLCH>(ctx, this.id, this.version, 'COLOR.OKLAB@1.0.0', true, (val) => {
      return { value: oklabToOklch(val as OKLab) };
    });
  },
};
