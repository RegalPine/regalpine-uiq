import type { MetricDefinition } from '@uiq/core';
import { surfaceMetrics } from '../surface/registry';
import { depthMetrics } from '../depth/registry';
import { colorTextureMetrics } from '../color-texture';
import { typographyTextureMetrics } from '../typography-texture';
import { spatialTextureMetrics } from '../spatial-texture';
import { motionTextureMetrics } from '../motion-texture';
import { microDetailTextureMetrics } from '../micro-detail-texture';

/**
 * Visual Texture 七维统一度量注册表。
 *
 * 聚合 Surface / Depth / Color / Typography / Spatial / Motion / Micro Detail
 * 全部 58 个纹理度量。
 *
 * 规范基线：UIQ-VISUAL-TEXTURE-ARCHITECTURE §3
 */
export interface VisualTextureMetricRegistry {
  readonly allMetrics: readonly MetricDefinition[];
  readonly surfaceMetrics: readonly MetricDefinition[];
  readonly depthMetrics: readonly MetricDefinition[];
  readonly colorTextureMetrics: readonly MetricDefinition[];
  readonly typographyTextureMetrics: readonly MetricDefinition[];
  readonly spatialTextureMetrics: readonly MetricDefinition[];
  readonly motionTextureMetrics: readonly MetricDefinition[];
  readonly microDetailTextureMetrics: readonly MetricDefinition[];
  findByMetricId(id: string): MetricDefinition | undefined;
}

export function createVisualTextureMetricRegistry(): VisualTextureMetricRegistry {
  const allMetrics: MetricDefinition[] = [
    ...surfaceMetrics,
    ...depthMetrics,
    ...colorTextureMetrics,
    ...typographyTextureMetrics,
    ...spatialTextureMetrics,
    ...motionTextureMetrics,
    ...microDetailTextureMetrics,
  ];

  const index = new Map<string, MetricDefinition>();
  for (const m of allMetrics) {
    index.set(m.id, m);
  }

  return {
    allMetrics,
    surfaceMetrics,
    depthMetrics,
    colorTextureMetrics,
    typographyTextureMetrics,
    spatialTextureMetrics,
    motionTextureMetrics,
    microDetailTextureMetrics,
    findByMetricId(id: string) {
      return index.get(id);
    },
  };
}
