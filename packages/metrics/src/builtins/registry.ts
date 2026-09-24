import { DefaultMetricRegistry } from '@uiq/core';
import type { MetricDefinition, MetricRegistry } from '@uiq/core';

// COLOR
import { COLOR_SRGB } from './color/srgb';
import { COLOR_OKLAB } from './color/oklab';
import { COLOR_OKLCH } from './color/oklch';
import { COLOR_LIGHTNESS } from './color/lightness';
import { COLOR_CHROMA } from './color/chroma';
import { COLOR_HUE } from './color/hue';
import { COLOR_CONTRAST } from './color/contrast';

// TYPOGRAPHY
import { TYPOGRAPHY_FONT_SIZE } from './typography/font-size';
import { TYPOGRAPHY_FONT_WEIGHT } from './typography/font-weight';
import { TYPOGRAPHY_LINE_HEIGHT } from './typography/line-height';
import { TYPOGRAPHY_LETTER_SPACING } from './typography/letter-spacing';
import { TYPOGRAPHY_TEXT_MEASURE } from './typography/text-measure';
import { TYPOGRAPHY_SCALE_RATIO } from './typography/scale-ratio';

// GEOMETRY
import { GEOMETRY_WIDTH } from './geometry/width';
import { GEOMETRY_HEIGHT } from './geometry/height';
import { GEOMETRY_AREA } from './geometry/area';
import { GEOMETRY_ASPECT_RATIO } from './geometry/aspect-ratio';
import { GEOMETRY_CENTER_DISTANCE } from './geometry/center-distance';
import { GEOMETRY_EDGE_DISTANCE } from './geometry/edge-distance';
import { GEOMETRY_OVERLAP } from './geometry/overlap';

const ALL_METRICS = [
  COLOR_SRGB,
  COLOR_OKLAB,
  COLOR_OKLCH,
  COLOR_LIGHTNESS,
  COLOR_CHROMA,
  COLOR_HUE,
  COLOR_CONTRAST,
  TYPOGRAPHY_FONT_SIZE,
  TYPOGRAPHY_FONT_WEIGHT,
  TYPOGRAPHY_LINE_HEIGHT,
  TYPOGRAPHY_LETTER_SPACING,
  TYPOGRAPHY_TEXT_MEASURE,
  TYPOGRAPHY_SCALE_RATIO,
  GEOMETRY_WIDTH,
  GEOMETRY_HEIGHT,
  GEOMETRY_AREA,
  GEOMETRY_ASPECT_RATIO,
  GEOMETRY_CENTER_DISTANCE,
  GEOMETRY_EDGE_DISTANCE,
  GEOMETRY_OVERLAP,
] as const satisfies readonly MetricDefinition[];

export function createDefaultMetricRegistry(): MetricRegistry {
  const registry = new DefaultMetricRegistry();
  for (const metric of ALL_METRICS) {
    registry.register(metric as MetricDefinition);
  }
  return registry;
}
