import type { MetricDefinition } from '@uiq/core';
import { SURFACE_RADIUS_CONSISTENCY } from './radiusConsistency';
import { SURFACE_RADIUS_FRAGMENTATION } from './radiusFragmentation';
import { SURFACE_BORDER_CONSISTENCY } from './borderConsistency';
import { SURFACE_SHADOW_CONSISTENCY } from './shadowConsistency';
import { SURFACE_SHADOW_COMPLEXITY } from './shadowComplexity';
import { SURFACE_LAYER_CONSISTENCY } from './layerConsistency';
import { SURFACE_TRANSPARENCY_CONSISTENCY } from './transparencyConsistency';
import { SURFACE_MATERIAL_CONSISTENCY } from './materialConsistency';

/** Surface 维度全部 8 个 Metrics。 */
export const surfaceMetrics: readonly MetricDefinition[] = [
  SURFACE_RADIUS_CONSISTENCY,
  SURFACE_RADIUS_FRAGMENTATION,
  SURFACE_BORDER_CONSISTENCY,
  SURFACE_SHADOW_CONSISTENCY,
  SURFACE_SHADOW_COMPLEXITY,
  SURFACE_LAYER_CONSISTENCY,
  SURFACE_TRANSPARENCY_CONSISTENCY,
  SURFACE_MATERIAL_CONSISTENCY,
] as const;
