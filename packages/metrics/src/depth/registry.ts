import type { MetricDefinition } from '@uiq/core';
import { DEPTH_ELEVATION_HIERARCHY } from './elevationHierarchy';
import { DEPTH_SHADOW_DEPTH } from './shadowDepth';
import { DEPTH_LAYER_CONSISTENCY } from './layerConsistency';
import { DEPTH_VISUAL_SEPARATION } from './visualSeparation';
import { DEPTH_OVERLAY_QUALITY } from './overlayQuality';
import { DEPTH_SPATIAL_PRIORITY } from './spatialPriority';

export const depthMetrics: readonly MetricDefinition[] = [
  DEPTH_ELEVATION_HIERARCHY,
  DEPTH_SHADOW_DEPTH,
  DEPTH_LAYER_CONSISTENCY,
  DEPTH_VISUAL_SEPARATION,
  DEPTH_OVERLAY_QUALITY,
  DEPTH_SPATIAL_PRIORITY,
] as const;
