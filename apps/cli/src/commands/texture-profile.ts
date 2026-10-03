import type { VisualTextureDimension, VisualTextureProfile } from '@uiq/core';

/**
 * 维度名称 → VisualTextureDimension 映射。
 */
const DIMENSION_ALIAS: Record<string, VisualTextureDimension> = {
  surface: 'SURFACE',
  depth: 'DEPTH',
  color: 'COLOR',
  typography: 'TYPOGRAPHY',
  typo: 'TYPOGRAPHY',
  spatial: 'SPATIAL',
  motion: 'MOTION',
  micro: 'MICRO_DETAIL',
  micro_detail: 'MICRO_DETAIL',
  microdetail: 'MICRO_DETAIL',
};

/**
 * Visual Texture 默认 Profile — 启用全部 7 个维度。
 */
export const DEFAULT_TEXTURE_PROFILE: VisualTextureProfile = {
  id: 'visual-texture-full',
  version: '1.0.0',
  name: 'Visual Texture Full Profile',
  dimensions: [
    'SURFACE',
    'DEPTH',
    'COLOR',
    'TYPOGRAPHY',
    'SPATIAL',
    'MOTION',
    'MICRO_DETAIL',
  ],
};

/**
 * Visual Texture 核心 Profile — 仅 Surface + Depth + Color。
 */
export const CORE_TEXTURE_PROFILE: VisualTextureProfile = {
  id: 'visual-texture-core',
  version: '1.0.0',
  name: 'Visual Texture Core Profile',
  dimensions: ['SURFACE', 'DEPTH', 'COLOR'],
};

/**
 * 根据 profile 名称返回对应的维度列表。
 */
export function resolveTextureProfile(name: string): VisualTextureProfile {
  switch (name) {
    case 'full':
      return DEFAULT_TEXTURE_PROFILE;
    case 'core':
      return CORE_TEXTURE_PROFILE;
    default:
      return DEFAULT_TEXTURE_PROFILE;
  }
}

/**
 * 解析 `--dimensions surface,color,typography` 为维度列表。
 * 无效名称会被忽略。
 */
export function parseDimensions(input: string): VisualTextureDimension[] {
  const result: VisualTextureDimension[] = [];
  const seen = new Set<VisualTextureDimension>();
  for (const raw of input.split(',')) {
    const key = raw.trim().toLowerCase();
    const dim = DIMENSION_ALIAS[key];
    if (dim && !seen.has(dim)) {
      seen.add(dim);
      result.push(dim);
    }
  }
  return result;
}

/**
 * 根据维度列表构建自定义 Profile。
 */
export function buildCustomProfile(dimensions: readonly VisualTextureDimension[]): VisualTextureProfile {
  return {
    id: `visual-texture-custom-${dimensions.join('-').toLowerCase()}`,
    version: '1.0.0',
    name: `Visual Texture Custom Profile (${dimensions.join(', ')})`,
    dimensions,
  };
}

/**
 * 获取指定维度的 Metric ID 列表。
 */
export function getTextureMetricIds(dimensions: readonly VisualTextureDimension[]): string[] {
  const ids: string[] = [];
  for (const dim of dimensions) {
    switch (dim) {
      case 'SURFACE':
        ids.push(
          'SURFACE.RADIUS.CONSISTENCY',
          'SURFACE.RADIUS.FRAGMENTATION',
          'SURFACE.BORDER.CONSISTENCY',
          'SURFACE.SHADOW.CONSISTENCY',
          'SURFACE.SHADOW.COMPLEXITY',
          'SURFACE.LAYER.CONSISTENCY',
          'SURFACE.TRANSPARENCY.CONSISTENCY',
          'SURFACE.MATERIAL.CONSISTENCY',
        );
        break;
      case 'DEPTH':
        ids.push(
          'DEPTH.ELEVATION.HIERARCHY',
          'DEPTH.SHADOW.DEPTH',
          'DEPTH.LAYER.CONSISTENCY',
          'DEPTH.VISUAL.SEPARATION',
          'DEPTH.OVERLAY.QUALITY',
          'DEPTH.SPATIAL.PRIORITY',
        );
        break;
      case 'COLOR':
        ids.push(
          'COLOR.LIGHTNESS.HIERARCHY',
          'COLOR.CHROMA.DISTRIBUTION',
          'COLOR.HUE.RELATIONSHIP',
          'COLOR.HARMONY',
          'COLOR.TOKEN.CONSISTENCY',
          'COLOR.NOISE',
          'COLOR.CONTRAST.QUALITY',
        );
        break;
      case 'TYPOGRAPHY':
        ids.push(
          'TYPOGRAPHY.FONT.CONSISTENCY',
          'TYPOGRAPHY.SCALE.CONSISTENCY',
          'TYPOGRAPHY.WEIGHT.HIERARCHY',
          'TYPOGRAPHY.LINEHEIGHT.RHYTHM',
          'TYPOGRAPHY.SPACING.QUALITY',
          'TYPOGRAPHY.DENSITY.BALANCE',
          'TYPOGRAPHY.HIERARCHY',
        );
        break;
      case 'SPATIAL':
        ids.push(
          'SPATIAL.GRID.CONSISTENCY',
          'SPATIAL.ALIGNMENT.CONSISTENCY',
          'SPATIAL.SPACING.RHYTHM',
          'SPATIAL.WHITESPACE.QUALITY',
          'SPATIAL.DENSITY.BALANCE',
          'SPATIAL.PROPORTION.QUALITY',
          'SPATIAL.COMPOSITION.BALANCE',
        );
        break;
      case 'MOTION':
        ids.push(
          'MOTION.TRANSITION.QUALITY',
          'MOTION.ANIMATION.TIMING',
          'MOTION.EASING.QUALITY',
          'MOTION.STATE.SMOOTHNESS',
          'MOTION.CONSISTENCY',
          'MOTION.LOADING.QUALITY',
          'MOTION.DURATION.CONSISTENCY',
        );
        break;
      case 'MICRO_DETAIL':
        ids.push(
          'MICRO_DETAIL.STATE.COMPLETENESS',
          'MICRO_DETAIL.COMPONENT.CONSISTENCY',
          'MICRO_DETAIL.ICON.CONSISTENCY',
          'MICRO_DETAIL.FOCUS.QUALITY',
          'MICRO_DETAIL.DISABLED.QUALITY',
          'MICRO_DETAIL.EMPTY.QUALITY',
          'MICRO_DETAIL.BORDER.DETAIL',
          'MICRO_DETAIL.RADIUS.DETAIL',
          'MICRO_DETAIL.LOADING.QUALITY',
          'MICRO_DETAIL.ERROR.QUALITY',
          'MICRO_DETAIL.HOVER.COMPLETENESS',
          'MICRO_DETAIL.ACTIVE.FEEDBACK',
          'MICRO_DETAIL.SELECTED.DIFFERENTIATION',
          'MICRO_DETAIL.ICON.ALIGNMENT',
          'MICRO_DETAIL.COMPONENT.DENSITY',
          'MICRO_DETAIL.FRAGMENTATION',
        );
        break;
    }
  }
  return ids;
}

/**
 * 获取指定维度的 Rule ID 列表。
 */
export function getTextureRuleIds(dimensions: readonly VisualTextureDimension[]): string[] {
  const ids: string[] = [];
  for (const dim of dimensions) {
    switch (dim) {
      case 'SURFACE':
        ids.push(
          'VISUAL_TEXTURE.SURFACE.RADIUS_CONSISTENCY',
          'VISUAL_TEXTURE.SURFACE.RADIUS_FRAGMENTATION',
          'VISUAL_TEXTURE.SURFACE.BORDER_CONSISTENCY',
          'VISUAL_TEXTURE.SURFACE.SHADOW_CONSISTENCY',
          'VISUAL_TEXTURE.SURFACE.SHADOW_COMPLEXITY',
          'VISUAL_TEXTURE.SURFACE.LAYER_CONSISTENCY',
          'VISUAL_TEXTURE.SURFACE.TRANSPARENCY_CONSISTENCY',
          'VISUAL_TEXTURE.SURFACE.MATERIAL_CONSISTENCY',
        );
        break;
      case 'DEPTH':
        ids.push(
          'VISUAL_TEXTURE.DEPTH.ELEVATION_HIERARCHY',
          'VISUAL_TEXTURE.DEPTH.SHADOW_DEPTH',
          'VISUAL_TEXTURE.DEPTH.LAYER_CONSISTENCY',
          'VISUAL_TEXTURE.DEPTH.VISUAL_SEPARATION',
          'VISUAL_TEXTURE.DEPTH.OVERLAY_QUALITY',
          'VISUAL_TEXTURE.DEPTH.SPATIAL_PRIORITY',
        );
        break;
      case 'COLOR':
        ids.push(
          'VISUAL_TEXTURE.COLOR.LIGHTNESS_HIERARCHY',
          'VISUAL_TEXTURE.COLOR.CHROMA_DISTRIBUTION',
          'VISUAL_TEXTURE.COLOR.HUE_RELATIONSHIP',
          'VISUAL_TEXTURE.COLOR.HARMONY',
          'VISUAL_TEXTURE.COLOR.TOKEN_CONSISTENCY',
          'VISUAL_TEXTURE.COLOR.NOISE',
          'VISUAL_TEXTURE.COLOR.CONTRAST_QUALITY',
        );
        break;
      case 'TYPOGRAPHY':
        ids.push(
          'VISUAL_TEXTURE.TYPOGRAPHY.FONT_CONSISTENCY',
          'VISUAL_TEXTURE.TYPOGRAPHY.SCALE_CONSISTENCY',
          'VISUAL_TEXTURE.TYPOGRAPHY.WEIGHT_HIERARCHY',
          'VISUAL_TEXTURE.TYPOGRAPHY.LINEHEIGHT_RHYTHM',
          'VISUAL_TEXTURE.TYPOGRAPHY.SPACING_QUALITY',
          'VISUAL_TEXTURE.TYPOGRAPHY.DENSITY_BALANCE',
          'VISUAL_TEXTURE.TYPOGRAPHY.HIERARCHY',
        );
        break;
      case 'SPATIAL':
        ids.push(
          'VISUAL_TEXTURE.SPATIAL.GRID_CONSISTENCY',
          'VISUAL_TEXTURE.SPATIAL.ALIGNMENT_CONSISTENCY',
          'VISUAL_TEXTURE.SPATIAL.SPACING_RHYTHM',
          'VISUAL_TEXTURE.SPATIAL.WHITESPACE_QUALITY',
          'VISUAL_TEXTURE.SPATIAL.DENSITY_BALANCE',
          'VISUAL_TEXTURE.SPATIAL.PROPORTION_QUALITY',
          'VISUAL_TEXTURE.SPATIAL.COMPOSITION_BALANCE',
        );
        break;
      case 'MOTION':
        ids.push(
          'VISUAL_TEXTURE.MOTION.TRANSITION_QUALITY',
          'VISUAL_TEXTURE.MOTION.ANIMATION_TIMING',
          'VISUAL_TEXTURE.MOTION.EASING_QUALITY',
          'VISUAL_TEXTURE.MOTION.STATE_CHANGE',
          'VISUAL_TEXTURE.MOTION.CONSISTENCY',
          'VISUAL_TEXTURE.MOTION.LOADING_QUALITY',
          'VISUAL_TEXTURE.MOTION.DURATION_CONSISTENCY',
        );
        break;
      case 'MICRO_DETAIL':
        ids.push(
          'VISUAL_TEXTURE.MICRO.STATE_COMPLETENESS',
          'VISUAL_TEXTURE.MICRO.COMPONENT_CONSISTENCY',
          'VISUAL_TEXTURE.MICRO.ICON_CONSISTENCY',
          'VISUAL_TEXTURE.MICRO.FOCUS_QUALITY',
          'VISUAL_TEXTURE.MICRO.DISABLED_QUALITY',
          'VISUAL_TEXTURE.MICRO.EMPTY_QUALITY',
          'VISUAL_TEXTURE.MICRO.BORDER_DETAIL',
          'VISUAL_TEXTURE.MICRO.RADIUS_DETAIL',
          'VISUAL_TEXTURE.MICRO.LOADING_QUALITY',
          'VISUAL_TEXTURE.MICRO.ERROR_QUALITY',
          'VISUAL_TEXTURE.MICRO.HOVER_COMPLETENESS',
          'VISUAL_TEXTURE.MICRO.ACTIVE_FEEDBACK',
          'VISUAL_TEXTURE.MICRO.SELECTED_DIFFERENTIATION',
          'VISUAL_TEXTURE.MICRO.ICON_ALIGNMENT',
          'VISUAL_TEXTURE.MICRO.COMPONENT_DENSITY',
          'VISUAL_TEXTURE.MICRO.FRAGMENTATION',
        );
        break;
    }
  }
  return ids;
}
