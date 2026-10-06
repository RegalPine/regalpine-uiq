import type { EnrichedRuleDefinition } from '../../evaluation/engine';
import { SURFACE_RADIUS_CONSISTENCY_RULE } from './radiusConsistencyRule';
import { SURFACE_RADIUS_FRAGMENTATION_RULE } from './radiusFragmentationRule';
import { SURFACE_BORDER_CONSISTENCY_RULE } from './borderConsistencyRule';
import { SURFACE_SHADOW_CONSISTENCY_RULE } from './shadowConsistencyRule';
import { SURFACE_SHADOW_COMPLEXITY_RULE } from './shadowComplexityRule';
import { SURFACE_LAYER_CONSISTENCY_RULE } from './layerConsistencyRule';
import { SURFACE_TRANSPARENCY_CONSISTENCY_RULE } from './transparencyConsistencyRule';
import { SURFACE_MATERIAL_CONSISTENCY_RULE } from './materialConsistencyRule';

/** Surface 维度全部 8 个 Rules。 */
export const surfaceRules: readonly EnrichedRuleDefinition[] = [
  SURFACE_RADIUS_CONSISTENCY_RULE,
  SURFACE_RADIUS_FRAGMENTATION_RULE,
  SURFACE_BORDER_CONSISTENCY_RULE,
  SURFACE_SHADOW_CONSISTENCY_RULE,
  SURFACE_SHADOW_COMPLEXITY_RULE,
  SURFACE_LAYER_CONSISTENCY_RULE,
  SURFACE_TRANSPARENCY_CONSISTENCY_RULE,
  SURFACE_MATERIAL_CONSISTENCY_RULE,
] as const;
