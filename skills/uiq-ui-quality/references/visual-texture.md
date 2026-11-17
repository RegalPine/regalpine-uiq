# Visual Texture 七维度说明

## 概述

Visual Texture 通过 7 个维度量化 UI 的视觉质感一致性。每个维度包含若干 Metric（度量）和 Rule（规则），从测量到诊断形成完整链路。

## 维度详情

### 1. Surface (表面)
衡量圆角、边框、阴影、透明度等表面属性的一致性。
- 8 个 Metric, 8 条 Rule
- 关键指标: `SURFACE.RADIUS.CONSISTENCY`, `SURFACE.RADIUS.FRAGMENTATION`, `SURFACE.BORDER.CONSISTENCY`, `SURFACE.SHADOW.CONSISTENCY`, `SURFACE.SHADOW.COMPLEXITY`, `SURFACE.LAYER.CONSISTENCY`, `SURFACE.TRANSPARENCY.CONSISTENCY`, `SURFACE.MATERIAL.CONSISTENCY`

### 2. Depth (深度)
衡量 elevation 层级、阴影深度结构、视觉分离。
- 6 个 Metric, 6 条 Rule
- 关键指标: `DEPTH.ELEVATION.HIERARCHY`, `DEPTH.SHADOW.DEPTH`, `DEPTH.LAYER.CONSISTENCY`, `DEPTH.VISUAL.SEPARATION`, `DEPTH.OVERLAY.QUALITY`, `DEPTH.SPATIAL.PRIORITY`

### 3. Color (色彩)
衡量亮度层次、色度分布、色相关系、色彩和谐、Token 一致性、噪声比、对比度质量 (使用 OKLab/OKLCH 色彩空间)。
- 7 个 Metric, 7 条 Rule
- 关键指标: `COLOR.LIGHTNESS.HIERARCHY`, `COLOR.CHROMA.DISTRIBUTION`, `COLOR.HUE.RELATIONSHIP`, `COLOR.HARMONY`, `COLOR.TOKEN.CONSISTENCY`, `COLOR.NOISE`, `COLOR.CONTRAST.QUALITY`

### 4. Typography (排版)
衡量字体族、字号缩放、字重层次、行高节奏、间距质量、密度平衡、层级结构。
- 7 个 Metric, 7 条 Rule
- 关键指标: `TYPOGRAPHY.FONT.CONSISTENCY`, `TYPOGRAPHY.SCALE.CONSISTENCY`, `TYPOGRAPHY.WEIGHT.HIERARCHY`, `TYPOGRAPHY.LINEHEIGHT.RHYTHM`, `TYPOGRAPHY.SPACING.QUALITY`, `TYPOGRAPHY.DENSITY.BALANCE`, `TYPOGRAPHY.HIERARCHY`

### 5. Spatial (空间)
衡量网格对齐、间距节奏、留白比率、构图平衡、对齐一致性、密度平衡、比例质量。
- 7 个 Metric, 7 条 Rule
- 关键指标: `SPATIAL.GRID.CONSISTENCY`, `SPATIAL.ALIGNMENT.CONSISTENCY`, `SPATIAL.SPACING.RHYTHM`, `SPATIAL.WHITESPACE.QUALITY`, `SPATIAL.DENSITY.BALANCE`, `SPATIAL.PROPORTION.QUALITY`, `SPATIAL.COMPOSITION.BALANCE`

### 6. Motion (动效)
衡量过渡时长、动画时序、缓动函数质量、状态变化平滑度、时长一致性、加载质量。
- 7 个 Metric, 7 条 Rule
- 关键指标: `MOTION.TRANSITION.QUALITY`, `MOTION.ANIMATION.TIMING`, `MOTION.EASING.QUALITY`, `MOTION.STATE.SMOOTHNESS`, `MOTION.CONSISTENCY`, `MOTION.LOADING.QUALITY`, `MOTION.DURATION.CONSISTENCY`

### 7. Micro Detail (微细节)
衡量交互状态完整性、组件状态一致性、图标一致性、焦点质量、禁用状态、空状态、边框/圆角细节、加载/错误状态、hover/active/selected 反馈、图标对齐、组件密度、碎片化。
- 16 个 Metric, 16 条 Rule
- 关键指标: `MICRO_DETAIL.STATE.COMPLETENESS`, `MICRO_DETAIL.COMPONENT.CONSISTENCY`, `MICRO_DETAIL.ICON.CONSISTENCY`, `MICRO_DETAIL.FOCUS.QUALITY`, `MICRO_DETAIL.DISABLED.QUALITY`, `MICRO_DETAIL.EMPTY.QUALITY`, `MICRO_DETAIL.BORDER.DETAIL`, `MICRO_DETAIL.RADIUS.DETAIL`, `MICRO_DETAIL.LOADING.QUALITY`, `MICRO_DETAIL.ERROR.QUALITY`, `MICRO_DETAIL.HOVER.COMPLETENESS`, `MICRO_DETAIL.ACTIVE.FEEDBACK`, `MICRO_DETAIL.SELECTED.DIFFERENTIATION`, `MICRO_DETAIL.ICON.ALIGNMENT`, `MICRO_DETAIL.COMPONENT.DENSITY`, `MICRO_DETAIL.FRAGMENTATION`

## 总计

- 58 个 Metric (8+6+7+7+7+7+16)
- 58 条 Rule
- 7 个专用诊断器

## 跨组件视觉连续性 (Cross-Component Visual Continuity)

在 7 维度基础上，UIQ 支持跨组件视觉连续性检测。当页面使用 `data-uiq-component` 属性标注组件边界时，UIQ 会自动分析组件间的视觉关系。

### 组件边界标识

```html
<div data-uiq-component="TagsView" data-uiq-component-id="tags-view">
  <!-- TagsView 内容 -->
</div>
<div data-uiq-component="AppMain" data-uiq-component-id="app-main">
  <!-- AppMain 内容 -->
</div>
```

### 检测能力

| 检测类型 | 说明 |
|----------|------|
| TOKEN_DRIFT | 组件间共享 Token 的值漂移 |
| VISUAL_BREAK | 组件间表面/视觉属性断裂（圆角、边框、阴影不一致） |
| STATE_INCOHERENCE | 组件间状态切换视觉不连贯 |
| COLOR_DISHARMONY | 组件间配色不协调（色相差过大） |
| WEIGHT_IMBALANCE | 组件间视觉权重失衡 |

### 组件关系类型

- ADJACENT — 相邻组件
- PARENT_CHILD — 父子组件
- SHARES_TOKEN — 共享 Token
- STATE_TRANSITION — 状态转换
- VISUAL_DEPENDENCY — 视觉依赖

### 系统性模式

- COMPONENT_SYSTEMIC — 多组件 Token 漂移
- LAYOUT_SYSTEMIC — 多组件视觉断裂
- COLOR_SYSTEMIC — 多组件配色不协调

### 降级行为

无 `data-uiq-component` 标注时，跨组件分析自动跳过，返回空结果。
