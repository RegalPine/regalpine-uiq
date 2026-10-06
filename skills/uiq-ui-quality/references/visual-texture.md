# Visual Texture 七维度说明

## 概述

Visual Texture 通过 7 个维度量化 UI 的视觉质感一致性。每个维度包含若干 Metric（度量）和 Rule（规则），从测量到诊断形成完整链路。

## 维度详情

### 1. Surface (表面)
衡量圆角、边框、阴影、透明度等表面属性的一致性。
- 8 个 Metric, 8 条 Rule
- 关键指标: `SURFACE.RADIUS.CONSISTENCY`, `SURFACE.RADIUS.FRAGMENTATION`

### 2. Depth (深度)
衡量 elevation 层级、阴影深度结构、视觉分离。
- 6 个 Metric, 6 条 Rule
- 关键指标: `DEPTH.ELEVATION.HIERARCHY`, `DEPTH.SHADOW.DEPTH`

### 3. Color (色彩)
衡量亮度层次、色度分布、色相关系、Token 一致性 (使用 OKLab/OKLCH 色彩空间)。
- 7 个 Metric, 7 条 Rule
- 关键指标: `COLOR.LIGHTNESS.HIERARCHY`, `COLOR.TOKEN.CONSISTENCY`

### 4. Typography (排版)
衡量字体族、字号缩放、字重层次、行高节奏。
- 7 个 Metric, 7 条 Rule
- 关键指标: `TYPOGRAPHY.FONT.CONSISTENCY`, `TYPOGRAPHY.SCALE.CONSISTENCY`

### 5. Spatial (空间)
衡量网格对齐、间距节奏、留白比率、构图平衡。
- 7 个 Metric, 7 条 Rule
- 关键指标: `SPATIAL.GRID.CONSISTENCY`, `SPATIAL.WHITESPACE.QUALITY`

### 6. Motion (动效)
衡量过渡时长、缓动函数一致性、状态变化平滑度。
- 7 个 Metric, 7 条 Rule
- 关键指标: `MOTION.TRANSITION.QUALITY`, `MOTION.EASING.CONSISTENCY`

### 7. Micro Detail (微细节)
衡量交互状态完整性、图标一致性、焦点质量、碎片化。
- 16 个 Metric, 16 条 Rule
- 关键指标: `MICRO_DETAIL.STATE.COMPLETENESS`, `MICRO_DETAIL.FOCUS.QUALITY`

## 总计

- 58 个 Metric (8+6+7+7+7+7+16)
- 58 条 Rule
- 7 个专用诊断器
