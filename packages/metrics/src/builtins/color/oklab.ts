import type { MetricDefinition } from '@uiq/core';
import type { OKLab, SRGB } from '@uiq/color';
import { toLinearRGB, linearRgbToXyz, xyzToOklab } from '@uiq/color';
import { depResult } from '../helpers';

export const COLOR_OKLAB: MetricDefinition<OKLab> = {
  id: 'COLOR.OKLAB',
  version: '1.0.0',
  kind: 'DERIVED',
  dependencies: [{ metricId: 'COLOR.SRGB', version: '1.0.0', required: true }],
  calculate(ctx) {
    return depResult<OKLab>(ctx, this.id, this.version, 'COLOR.SRGB@1.0.0', true, (val) => {
      const srgb = val as SRGB;
      const linear = toLinearRGB(srgb);
      const xyz = linearRgbToXyz(linear);
      return { value: xyzToOklab(xyz) };
    });
  },
};
