import type { VisualTextureDimension } from './types';

/**
 * 七维常量定义。
 * 规范基线：UIQ-VISUAL-QUALITY-08 §2.2-2.3
 */
export interface VisualTextureDimensionDef {
  readonly id: VisualTextureDimension;
  readonly name: string;
  readonly description: string;
  readonly symbol: string;
}

export const VISUAL_TEXTURE_DIMENSIONS: readonly VisualTextureDimensionDef[] = [
  {
    id: 'SURFACE',
    name: 'Surface Texture',
    description: '表面质感：圆角、边界、阴影、透明、模糊、层叠、材质表达',
    symbol: 'S',
  },
  {
    id: 'DEPTH',
    name: 'Depth Texture',
    description: '深度质感：Elevation、Shadow Depth、Layer、Contrast、Opacity、Z-index',
    symbol: 'D',
  },
  {
    id: 'COLOR',
    name: 'Color Texture',
    description: '色彩质感：Hue、Lightness、Chroma、Contrast、Color Harmony、Semantic Color',
    symbol: 'C',
  },
  {
    id: 'TYPOGRAPHY',
    name: 'Typography Texture',
    description: '字体质感：Font Family、Scale、Weight、Line Height、Letter Spacing、Hierarchy',
    symbol: 'T',
  },
  {
    id: 'SPATIAL',
    name: 'Spatial Texture',
    description: '空间质感：Layout、Spacing、Alignment、Grid、Whitespace、Density、Proportion',
    symbol: 'P',
  },
  {
    id: 'MOTION',
    name: 'Motion Texture',
    description: '动态质感：Animation、Transition、Timing、Easing、Feedback、State Change',
    symbol: 'M',
  },
  {
    id: 'MICRO_DETAIL',
    name: 'Micro Detail Texture',
    description: '微细节质感：Hover、Focus、Active、Selected、Disabled、Loading、Empty、Error、Icon',
    symbol: 'Δ',
  },
] as const;

/** 维度 ID → 定义 的快速查找 Map。 */
export const VISUAL_TEXTURE_DIMENSION_MAP: ReadonlyMap<
  VisualTextureDimension,
  VisualTextureDimensionDef
> = new Map(VISUAL_TEXTURE_DIMENSIONS.map((d) => [d.id, d]));
