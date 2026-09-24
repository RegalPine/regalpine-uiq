import type { MetricDefinition } from '@uiq/core';
import type { OKLab } from '@uiq/color';
import { depResult } from '../helpers';

export const COLOR_LIGHTNESS: MetricDefinition<number> = {
  id: 'COLOR.LIGHTNESS',
  version: '1.0.0',
  kind: 'DERIVED',
  dependencies: [{ metricId: 'COLOR.OKLAB', version: '1.0.0', required: true }],
  calculate(ctx) {
    return depResult<number>(ctx, this.id, this.version, 'COLOR.OKLAB@1.0.0', true, (val) => {
      const lab = val as OKLab;
      return { value: lab.L };
    });
  },
};
