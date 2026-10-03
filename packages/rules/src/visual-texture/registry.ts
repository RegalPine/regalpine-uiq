import type { EnrichedRuleDefinition } from '../evaluation/engine';
import { surfaceRules } from './surface';
import { depthRules } from './depth';
import { colorTextureRules } from './color-texture';
import { typographyTextureRules } from './typography';
import { spatialTextureRules } from './spatial';
import { motionTextureRules } from './motion';
import { microDetailTextureRules } from './micro-detail';

/**
 * Visual Texture 七维统一规则注册表。
 *
 * 聚合全部 52 条纹理评价规则。
 */
export interface VisualTextureRuleRegistry {
  readonly allRules: readonly EnrichedRuleDefinition[];
  readonly surfaceRules: readonly EnrichedRuleDefinition[];
  readonly depthRules: readonly EnrichedRuleDefinition[];
  readonly colorTextureRules: readonly EnrichedRuleDefinition[];
  readonly typographyTextureRules: readonly EnrichedRuleDefinition[];
  readonly spatialTextureRules: readonly EnrichedRuleDefinition[];
  readonly motionTextureRules: readonly EnrichedRuleDefinition[];
  readonly microDetailTextureRules: readonly EnrichedRuleDefinition[];
  findByRuleId(id: string): EnrichedRuleDefinition | undefined;
}

export function createVisualTextureRuleRegistry(): VisualTextureRuleRegistry {
  const allRules: EnrichedRuleDefinition[] = [
    ...surfaceRules,
    ...depthRules,
    ...colorTextureRules,
    ...typographyTextureRules,
    ...spatialTextureRules,
    ...motionTextureRules,
    ...microDetailTextureRules,
  ];

  const index = new Map<string, EnrichedRuleDefinition>();
  for (const r of allRules) {
    index.set(r.id, r);
  }

  return {
    allRules,
    surfaceRules,
    depthRules,
    colorTextureRules,
    typographyTextureRules,
    spatialTextureRules,
    motionTextureRules,
    microDetailTextureRules,
    findByRuleId(id: string) {
      return index.get(id);
    },
  };
}
