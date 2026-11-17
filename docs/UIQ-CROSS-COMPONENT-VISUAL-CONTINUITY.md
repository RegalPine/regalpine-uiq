# 跨组件视觉连续性检测方案

**Status:** Draft  
**Version:** 1.0.0  
**Date:** 2026-10-07  
**Based on:** UIQ V1.0 Visual Texture Framework

---

## 1. 问题背景

### 1.1 现状盲区

UIQ V1.0 的 Visual Texture 七维度框架（Surface / Depth / Color / Typography / Spatial / Motion / Micro Detail）在度量层面是**扁平化的**——所有度量函数将页面上带 `data-uiq-id` 属性的元素视为一个**无差别集合**，做全局统计（均值、方差、一致性分数）。

这导致以下真实场景无法检测：

| 场景 | 示例 | 根因 |
|------|------|------|
| **组件间视觉分离** | TagsView 导航选项卡与 AppMain 内容区缺乏视觉关联 | 度量不感知组件边界，无法识别"两个组件应当连续但实际断裂" |
| **跨组件配色不协调** | 消息组件用蓝色渐变，头像组件用紫色渐变 | `COLOR.HUE.RELATIONSHIP` 算全局平均色相距离，不区分颜色归属哪个组件 |
| **激活状态视觉权重** | 激活态背景色过重、与周围不协调 | 对比度检查只做 WCAG 阈值判断，不做设计偏好级的视觉权重评估 |
| **Token 传播问题** | 组件 A 的 Token 变更导致相邻组件 B 视觉断裂 | `TokenBinding` 只记录单元素→Token 映射，不建模组件间 Token 共享关系 |

### 1.2 根因分析

通过代码审计，确认三个结构性原因：

**原因 1：度量层无组件感知**

```typescript
// packages/metrics/src/color-texture/index.ts
// collectByType 拿到页面上所有元素的颜色，做全局统计
const ms = collectByType(ctx, 'color.srgb');
// → 不知道哪个颜色属于哪个组件
```

所有 58 个度量函数均如此。`SPATIAL.GRID.CONSISTENCY` 看所有宽度、`SURFACE.RADIUS_CONSISTENCY` 看所有圆角——没有"按组件分组 → 组间比较"的逻辑。

**原因 2：跨维度分析停留在维度级事后归因**

```typescript
// packages/reporting/src/visual-texture/crossDimension.ts
// 当 SURFACE 和 DEPTH 同时 FAIL → 输出 CONSTRAINS 关系
// 这是"两个维度都有问题 → 它们之间可能有关联"的事后归因
// 不是"组件 A 的 Surface 与组件 B 的 Depth 是否连续"的结构性分析
```

**原因 3：浏览器采集层缺少组件边界标识**

```typescript
// packages/browser/src/browser-global.ts
// 默认采集所有 [data-uiq-id] 元素，扁平列表
// 没有 [data-uiq-component] 属性来标识"这些元素同属一个组件"
```

---

## 2. 设计目标

### 2.1 核心目标

在不破坏 V1.0 既有合约（`Measurement`、`Finding`、`Diagnostic`、`CrossDimensionRelation`、`SystemicPattern`）的前提下，增加**组件级**和**跨组件级**的分析能力。

### 2.2 设计原则

| 原则 | 说明 |
|------|------|
| **向后兼容** | 不使用 `data-uiq-component` 的页面，新模块优雅降级为"无组件信息"，不影响现有 58 个度量的计算 |
| **采集端最小侵入** | 仅在 `browser-global.ts` 的 `capture()` 中增加组件边界解析，不修改单个测量函数 |
| **度量层不重构** | 现有 58 个度量函数保持不变；新增的跨组件度量作为**独立度量层**叠加 |
| **合约对齐** | 组件边界标识复用 IMPL-13 §28-30 Component Contract 语义；`ComponentBinding` 对齐 IMPL-13 §37 |

### 2.3 能力目标

新增后应能检测：

1. **组件间 Token 一致性** — 两个组件是否共享同一套语义 Token（颜色、圆角、间距）
2. **组件间视觉连续性** — 相邻组件在 Surface/Color/Depth 维度是否存在断裂
3. **组件状态切换连贯性** — 同一组件不同状态（default/hover/active）间的视觉过渡质量
4. **Token 传播链问题** — 共享 Token 在一个组件上变更时，是否导致另一个组件视觉断裂

---

## 3. 组件边界标识机制

### 3.1 DOM 属性设计

新增 `data-uiq-component` 属性，与现有 `data-uiq-id`（元素级）和 `data-uiq-token`（Token 绑定）形成三层标识体系：

```
data-uiq-id          → 元素级唯一标识（V1.0 已有）
data-uiq-token       → Token 绑定标识（V1.0 已有）
data-uiq-component   → 组件边界标识（本方案新增）
```

**属性值规范：**

```html
<!-- 组件根元素：声明组件类型和实例 -->
<div data-uiq-component="TagsView" data-uiq-component-id="tags-view-1">
  <span data-uiq-id="tab-1">Tab 1</span>
  <span data-uiq-id="tab-2">Tab 2</span>
</div>

<!-- 同一组件的多个实例共享 component 名，但 instance id 不同 -->
<div data-uiq-component="AppMain" data-uiq-component-id="app-main-1">
  <iframe data-uiq-id="content-frame"></iframe>
</div>

<!-- 可选：声明组件间关系（用于高级分析） -->
<div data-uiq-component="MessageBubble"
     data-uiq-component-relation="adjacent:AvatarGroup">
</div>
```

**属性规范表：**

| 属性 | 必填 | 值格式 | 说明 |
|------|------|--------|------|
| `data-uiq-component` | 是 | 组件类型名（PascalCase） | 标识元素所属的组件类型 |
| `data-uiq-component-id` | 否 | 组件实例 ID（kebab-case） | 区分同一组件的不同实例 |
| `data-uiq-component-role` | 否 | `root` \| `child` \| `container` | 元素在组件中的角色，默认按 DOM 层级推断 |
| `data-uiq-component-relation` | 否 | 关系声明（见 §3.3） | 显式声明组件间关系 |

### 3.2 无标注降级策略

当页面不使用 `data-uiq-component` 时，系统通过以下启发式规则推断组件边界：

| 策略 | 方法 | 置信度 |
|------|------|--------|
| **DOM 子树聚类** | 以 `data-uiq-id` 元素的最近公共祖先为边界 | `INFERRED` |
| **CSS 类名前缀** | 相同 BEM block 前缀的元素归为同一组件 | `INFERRED` |
| **空间邻近性** | 空间位置连续且样式一致的元素归为同一区域 | `INFERRED` |
| **Token 共享** | 绑定相同 Token 集合的元素归为同一组件 | `SUPPORTED` |

> 启发式推断的置信度不超过 `SUPPORTED`，不升级为 `DIRECT`。

### 3.3 组件间关系声明

支持三种关系声明方式：

**方式 1：DOM 属性显式声明**

```html
<div data-uiq-component="TagsView"
     data-uiq-component-relation="adjacent:AppMain, shares-token:AppMain">
```

关系类型：
- `adjacent:<Component>` — 空间相邻
- `shares-token:<Component>` — 共享 Token
- `parent:<Component>` — 父子嵌套
- `sibling:<Component>` — 同级并列

**方式 2：配置式声明（CLI / JSON）**

```json
{
  "componentRelations": [
    {
      "source": "TagsView",
      "target": "AppMain",
      "relation": "adjacent",
      "sharedDimensions": ["SURFACE", "COLOR", "SPATIAL"]
    },
    {
      "source": "MessageBubble",
      "target": "AvatarGroup",
      "relation": "adjacent",
      "sharedDimensions": ["COLOR", "SURFACE"]
    }
  ]
}
```

**方式 3：自动推断**

当无显式声明时，分析模块根据空间位置、Token 共享、DOM 结构自动推断组件间关系（置信度为 `INFERRED`）。

---

## 4. 类型扩展设计

### 4.1 新增 Core 类型

在 `packages/core/src/visual-texture/types.ts` 中扩展：

```typescript
// ─── 组件边界 ───

/**
 * 组件边界 — 标识一个组件的渲染范围和度量归属。
 * 对齐 IMPL-13 §28 Component Contract。
 */
export interface ComponentBoundary {
  readonly componentId: string;        // 组件类型名，如 "TagsView"
  readonly instanceId?: string;        // 组件实例 ID，如 "tags-view-1"
  readonly rootElementId: string;      // 组件根元素的 subjectId
  readonly memberElementIds: readonly string[];  // 组件内所有元素的 subjectId
  readonly role: 'root' | 'child' | 'container';
  readonly source: 'EXPLICIT' | 'INFERRED';
  readonly confidence: ConfidenceLevel;
}

/**
 * 组件间关系 — 描述两个组件之间的视觉依赖。
 * 对齐 IMPL-13 §37 ComponentBinding。
 */
export interface ComponentRelation {
  readonly sourceComponent: string;    // 源组件类型名
  readonly targetComponent: string;    // 目标组件类型名
  readonly relation: ComponentRelationType;
  readonly sharedDimensions: readonly VisualTextureDimension[];
  readonly sharedTokenIds?: readonly string[];  // 共享的 Token ID 列表
  readonly source: 'EXPLICIT' | 'INFERRED';
  readonly confidence: ConfidenceLevel;
}

export type ComponentRelationType =
  | 'ADJACENT'           // 空间相邻，应视觉连续
  | 'PARENT_CHILD'       // 父子嵌套，应风格继承
  | 'SHARES_TOKEN'       // 共享 Token，应值一致
  | 'STATE_TRANSITION'   // 状态切换，应过渡平滑
  | 'VISUAL_DEPENDENCY'; // 视觉依赖（一方的变化影响另一方感知）

export type ConfidenceLevel = 'DIRECT' | 'SUPPORTED' | 'INFERRED' | 'UNKNOWN';
```

### 4.2 新增跨组件 Finding 类型

```typescript
/**
 * 跨组件 Finding — 描述组件间的视觉连续性问题。
 * 扩展现有 FindingType（contracts.ts §220-230）。
 */
export type CrossComponentFindingType =
  | 'TOKEN_DRIFT'           // Token 漂移：共享 Token 在不同组件上值不一致
  | 'VISUAL_BREAK'          // 视觉断裂：相邻组件在某个维度上突然变化
  | 'STATE_INCOHERENCE'     // 状态不连贯：组件状态切换时视觉跳跃
  | 'COLOR_DISHARMONY'      // 配色不协调：相邻组件的色彩关系违反和谐规则
  | 'WEIGHT_IMBALANCE';     // 视觉权重失衡：某组件的视觉权重与上下文不匹配

/**
 * 跨组件 Finding。
 */
export interface CrossComponentFinding {
  readonly id: string;
  readonly type: CrossComponentFindingType;
  readonly sourceComponent: string;
  readonly targetComponent: string;
  readonly dimension: VisualTextureDimension;
  readonly severity: Severity;
  readonly state: 'PASS' | 'WARN' | 'FAIL';
  readonly metricValue: Record<string, unknown>;
  readonly threshold: Record<string, unknown>;
  readonly evidence: readonly EvidenceReference[];
  readonly explanation: string;
}
```

### 4.3 新增跨组件系统性模式

扩展现有 `SystemicPatternType`（types.ts §171-181）：

```typescript
// 新增两种系统性模式类型
export type ExtendedSystemicPatternType =
  | 'COMPONENT_TOKEN_DRIFT'    // Token 漂移系统性问题
  | 'COMPONENT_CHAIN_BREAK';   // 组件链断裂系统性问题
```

---

## 5. 跨组件度量设计

### 5.1 度量架构：叠加层模式

不修改现有 58 个度量函数。新增一组**跨组件度量**，以现有度量结果为输入，做**组件级二次分析**：

```
                    ┌─────────────────────────┐
                    │  V1.0 度量层 (58 度量)    │  ← 不变
                    │  扁平化、元素级            │
                    └────────────┬────────────┘
                                 │ MetricResult[]
                                 ▼
                    ┌─────────────────────────┐
                    │  组件分组层 (新增)         │  ← 新增
                    │  按 ComponentBoundary     │
                    │  将 MetricResult 分组     │
                    └────────────┬────────────┘
                                 │ Map<ComponentId, MetricResult[]>
                                 ▼
                    ┌─────────────────────────┐
                    │  跨组件度量层 (新增)       │  ← 新增
                    │  组间比较、连续性检测      │
                    └─────────────────────────┘
```

### 5.2 新增跨组件度量清单

| 度量 ID | 维度 | 输入 | 算法 | 输出 |
|---------|------|------|------|------|
| `CROSS_COMPONENT.TOKEN_CONSISTENCY` | 全局 | 两组件的 TokenBinding 集合 | 比较共享 Token 的值偏差 | `{ driftCount, maxDeviation, score }` |
| `CROSS_COMPONENT.SURFACE_CONTINUITY` | Surface | 相邻组件的 radius/border/shadow | 计算组件边界处表面属性跳变幅度 | `{ jumpRatio, dominantMatch, score }` |
| `CROSS_COMPONENT.COLOR_HARMONY` | Color | 相邻组件的主色/背景色集合 | OKLCH 空间计算组件间色相关系 | `{ hueDistance, chromaContrast, score }` |
| `CROSS_COMPONENT.DEPTH_TRANSITION` | Depth | 相邻组件的 elevation/shadow | 计算组件间层级过渡是否自然 | `{ elevationGap, shadowConsistency, score }` |
| `CROSS_COMPONENT.SPACING_ALIGNMENT` | Spatial | 相邻组件的 padding/margin/gap | 检查组件交界处的间距节奏是否一致 | `{ gapVariance, rhythmMatch, score }` |
| `CROSS_COMPONENT.TYPOGRAPHY_CONSISTENCY` | Typography | 相邻组件的字体/字号/字重 | 比较排版属性的一致性 | `{ familyMatch, scaleConsistency, score }` |
| `CROSS_COMPONENT.MOTION_COHERENCE` | Motion | 相邻组件的 transition/animation | 比较动效参数的一致性 | `{ durationVariance, easingMatch, score }` |
| `CROSS_COMPONENT.STATE_TRANSITION` | MicroDetail | 同组件不同状态的度量快照 | 计算状态切换时的视觉变化幅度 | `{ deltaMagnitude, smoothness, score }` |

### 5.3 度量计算示例

**CROSS_COMPONENT.COLOR_HARMONY**

```typescript
// 伪代码 — 非最终实现
function calculateColorHarmony(
  sourceMetrics: MetricResult[],  // 组件 A 的颜色度量
  targetMetrics: MetricResult[],  // 组件 B 的颜色度量
): CrossComponentMetricResult {
  // 1. 提取两组件的主色集合
  const sourceColors = extractColors(sourceMetrics);
  const targetColors = extractColors(targetMetrics);

  // 2. 在 OKLCH 空间计算最近邻色相距离
  const hueDistances = sourceColors.flatMap(sc =>
    targetColors.map(tc => circularHueDistance(sc.hue, tc.hue))
  );
  const avgHueDistance = mean(hueDistances);

  // 3. 判断是否属于和谐色相关系
  //    类似色 (0-30°) → 和谐; 互补色 (150-210°) → 可能不协调
  const harmonyScore = avgHueDistance < 30 ? 1.0
    : avgHueDistance < 60 ? 0.8
    : avgHueDistance < 150 ? 0.4  // 中差色，可能不协调
    : avgHueDistance < 210 ? 0.6  // 互补色，看场景
    : 0.3;

  return { metricId: 'CROSS_COMPONENT.COLOR_HARMONY', value: { avgHueDistance, harmonyScore } };
}
```

**CROSS_COMPONENT.SURFACE_CONTINUITY**

```typescript
function calculateSurfaceContinuity(
  sourceMetrics: MetricResult[],
  targetMetrics: MetricResult[],
): CrossComponentMetricResult {
  // 1. 提取两组件的圆角、边框、阴影主值
  const sourceRadius = dominantValue(sourceMetrics, 'surface.radius');
  const targetRadius = dominantValue(targetMetrics, 'surface.radius');

  // 2. 计算边界处跳变幅度
  const radiusJump = Math.abs(sourceRadius - targetRadius);
  const radiusScore = radiusJump === 0 ? 1.0
    : radiusJump <= 2 ? 0.9    // 微小差异，可接受
    : radiusJump <= 4 ? 0.6    // 可见差异
    : 0.2;                      // 明显断裂

  // 3. 同理计算 border、shadow 的连续性
  // ...

  return { metricId: 'CROSS_COMPONENT.SURFACE_CONTINUITY', value: { jumpRatio, score } };
}
```

---

## 6. 跨组件分析模块设计

### 6.1 模块位置

```
packages/reporting/src/visual-texture/
├── crossDimension.ts       ← V1.0 已有：跨维度关系（维度级事后归因）
├── systemic.ts             ← V1.0 已有：系统性模式检测
├── crossComponent.ts       ← 新增：跨组件关联分析
├── componentGrouping.ts    ← 新增：组件分组逻辑
└── crossComponentRules.ts  ← 新增：跨组件规则定义
```

### 6.2 `componentGrouping.ts` — 组件分组

职责：将扁平的 `Measurement[]` 按 `ComponentBoundary` 分组。

```typescript
/**
 * 将度量快照按组件边界分组。
 *
 * 优先级：
 * 1. 显式 data-uiq-component 标注 → EXPLICIT 分组
 * 2. 无标注时 → 按 DOM 子树 + 空间邻近性启发式分组 → INFERRED
 * 3. 完全无信息时 → 返回空 Map（降级为 V1.0 行为）
 */
export function groupMeasurementsByComponent(
  snapshot: MeasurementSnapshot,
  boundaries: readonly ComponentBoundary[],
): Map<string, Measurement[]> {
  // ...
}
```

### 6.3 `crossComponent.ts` — 核心分析

```typescript
/**
 * 跨组件视觉连续性分析。
 *
 * 输入：
 * - 按组件分组的度量结果
 * - 组件间关系声明（显式或推断）
 * - 各维度的阈值配置
 *
 * 输出：
 * - CrossComponentFinding[] — 跨组件问题列表
 * - ExtendedSystemicPattern[] — 跨组件系统性模式
 * - ComponentRelation[] — 组件间关系（含推断）
 */
export function analyzeCrossComponentContinuity(
  componentGroups: Map<string, ComponentMetricGroup>,
  relations: readonly ComponentRelation[],
  config: CrossComponentConfig,
): CrossComponentAnalysisResult {
  const findings: CrossComponentFinding[] = [];

  for (const relation of relations) {
    const sourceGroup = componentGroups.get(relation.sourceComponent);
    const targetGroup = componentGroups.get(relation.targetComponent);
    if (!sourceGroup || !targetGroup) continue;

    // 按关系类型执行对应检测
    if (relation.relation === 'ADJACENT') {
      findings.push(...detectVisualBreak(sourceGroup, targetGroup, relation));
      findings.push(...detectColorDisharmony(sourceGroup, targetGroup, relation));
    }
    if (relation.relation === 'SHARES_TOKEN') {
      findings.push(...detectTokenDrift(sourceGroup, targetGroup, relation));
    }
    if (relation.relation === 'STATE_TRANSITION') {
      findings.push(...detectStateIncoherence(sourceGroup, targetGroup, relation));
    }
    // ...
  }

  const systemicPatterns = detectCrossComponentSystemic(findings);
  return { findings, systemicPatterns, relations };
}
```

### 6.4 `crossComponentRules.ts` — 规则定义

```typescript
/**
 * 跨组件规则 — 每个规则定义一个跨组件质量约束。
 */
export const CROSS_COMPONENT_RULES = {
  // 相邻组件圆角跳变不超过 2px
  SURFACE_CONTINUITY: {
    id: 'CROSS_COMPONENT.SURFACE.CONTINUITY',
    metricId: 'CROSS_COMPONENT.SURFACE_CONTINUITY',
    operator: 'LTE' as const,
    threshold: 2,        // 最大允许跳变 px
    severity: 'MEDIUM' as const,
    valueKey: 'jumpRatio',
  },

  // 相邻组件色相距离应在和谐范围内
  COLOR_HARMONY: {
    id: 'CROSS_COMPONENT.COLOR.HARMONY',
    metricId: 'CROSS_COMPONENT.COLOR_HARMONY',
    operator: 'LTE' as const,
    threshold: 60,       // 最大色相距离（度）
    severity: 'MEDIUM' as const,
    valueKey: 'avgHueDistance',
  },

  // 共享 Token 的值偏差应为 0
  TOKEN_CONSISTENCY: {
    id: 'CROSS_COMPONENT.TOKEN.CONSISTENCY',
    metricId: 'CROSS_COMPONENT.TOKEN_CONSISTENCY',
    operator: 'EQ' as const,
    threshold: 0,        // 偏差数
    severity: 'HIGH' as const,
    valueKey: 'driftCount',
  },

  // 状态切换平滑度
  STATE_TRANSITION: {
    id: 'CROSS_COMPONENT.STATE.TRANSITION',
    metricId: 'CROSS_COMPONENT.STATE_TRANSITION',
    operator: 'GTE' as const,
    threshold: 0.5,      // 最低平滑度
    severity: 'LOW' as const,
    valueKey: 'smoothness',
  },
} as const;
```

---

## 7. 浏览器采集层扩展

### 7.1 `browser-global.ts` 扩展

在 `capture()` 函数中增加组件边界解析：

```typescript
// 新增：解析组件边界
const boundaries = resolveComponentBoundaries(elements);

// 现有 MeasurementSnapshot 扩展
return {
  // ...V1.0 字段不变
  id, capturedAt, source, environment, measurements, bindings,
  // 新增（可选）
  ...(boundaries.length > 0 ? { componentBoundaries: boundaries } : {}),
};
```

### 7.2 `resolveComponentBoundaries` 实现策略

```typescript
function resolveComponentBoundaries(elements: readonly Element[]): ComponentBoundary[] {
  // 策略 1：显式 data-uiq-component 解析
  const explicit = resolveExplicitBoundaries(elements);
  if (explicit.length > 0) return explicit;

  // 策略 2：启发式推断（DOM 子树聚类）
  return inferBoundariesByDomClustering(elements);
}
```

### 7.3 `MeasurementSnapshot` 类型扩展

```typescript
// packages/core/src/contracts.ts
export interface MeasurementSnapshot {
  // ...V1.0 字段不变
  readonly id: string;
  readonly capturedAt: number;
  readonly source: MeasurementSource;
  readonly environment?: MeasurementEnvironment;
  readonly measurements: readonly Measurement[];
  readonly bindings?: readonly TokenBinding[];

  // 新增（可选，向后兼容）
  readonly componentBoundaries?: readonly ComponentBoundary[];
  readonly componentRelations?: readonly ComponentRelation[];
}
```

---

## 8. 报告层扩展

### 8.1 `VisualTextureEvidence` 扩展

```typescript
export interface VisualTextureEvidence {
  // ...V1.0 字段不变
  readonly id: string;
  readonly version: string;
  readonly projectId: string;
  readonly pageId?: string;
  readonly snapshotId: string;
  readonly dimensions: readonly VisualTextureDimensionEvidence[];
  readonly crossDimensionRelations: readonly CrossDimensionRelation[];
  readonly findings: readonly TextureFinding[];
  readonly diagnostics: readonly TextureDiagnostic[];
  readonly recommendations: readonly TextureRecommendation[];
  readonly verification: readonly TextureVerification[];
  readonly reproducibility: readonly VisualTextureReproducibility[];

  // 新增（可选）
  readonly crossComponentAnalysis?: CrossComponentAnalysisResult;
}
```

### 8.2 `CrossComponentAnalysisResult`

```typescript
export interface CrossComponentAnalysisResult {
  readonly componentBoundaries: readonly ComponentBoundary[];
  readonly componentRelations: readonly ComponentRelation[];
  readonly crossComponentFindings: readonly CrossComponentFinding[];
  readonly systemicPatterns: readonly SystemicPattern[];
  readonly continuityScore: number;   // 0~1，跨组件连续性总分
  readonly componentCount: number;
}
```

### 8.3 报告输出示例

```json
{
  "crossComponentAnalysis": {
    "componentBoundaries": [
      { "componentId": "TagsView", "instanceId": "tags-view-1", "memberCount": 5, "source": "EXPLICIT" },
      { "componentId": "AppMain", "instanceId": "app-main-1", "memberCount": 12, "source": "EXPLICIT" }
    ],
    "componentRelations": [
      { "source": "TagsView", "target": "AppMain", "relation": "ADJACENT", "confidence": "SUPPORTED" }
    ],
    "crossComponentFindings": [
      {
        "id": "xccf-001",
        "type": "VISUAL_BREAK",
        "sourceComponent": "TagsView",
        "targetComponent": "AppMain",
        "dimension": "SURFACE",
        "severity": "MEDIUM",
        "state": "FAIL",
        "explanation": "TagsView 圆角 4px 与 AppMain 圆角 8px 不一致，边界处存在视觉跳变"
      },
      {
        "id": "xccf-002",
        "type": "COLOR_DISHARMONY",
        "sourceComponent": "MessageBubble",
        "targetComponent": "AvatarGroup",
        "dimension": "COLOR",
        "severity": "MEDIUM",
        "state": "FAIL",
        "explanation": "消息气泡蓝色渐变 (H≈210°) 与头像紫色渐变 (H≈280°) 色相距离 70°，属于中差色关系，视觉不协调"
      }
    ],
    "continuityScore": 0.62,
    "componentCount": 4
  }
}
```

---

## 9. CLI 集成

### 9.1 新增命令

```bash
# 跨组件连续性分析
uiq analyze --url <URL> --cross-component

# 指定组件关系配置
uiq analyze --url <URL> --cross-component --component-config ./component-relations.json

# 输出格式
uiq analyze --url <URL> --cross-component --format json
```

### 9.2 `texture-profile.ts` 扩展

在现有 `--dimensions` 参数基础上，新增 `--cross-component` 开关：

```typescript
// apps/cli/src/commands/texture-profile.ts
if (options.crossComponent) {
  // 执行跨组件分析管道
  const boundaries = resolveComponentBoundaries(snapshot);
  const groups = groupMeasurementsByComponent(snapshot, boundaries);
  const relations = resolveComponentRelations(boundaries, options.componentConfig);
  const analysis = analyzeCrossComponentContinuity(groups, relations, config);
  // 注入报告
  report.crossComponentAnalysis = analysis;
}
```

---

## 10. 参考页面设计

### 10.1 `apps/reference/cross-component.html`

以现有 `cross-dimension.html` 为模板，新增以下场景：

```
场景 1: PASS — 组件间视觉连续
  TagsView (8px radius, #f8f9fa bg) ↔ AppMain (8px radius, #ffffff bg)
  → 圆角一致、色彩和谐、间距连续

场景 2: FAIL — 组件间视觉断裂
  TagsView (4px radius, flat) ↔ AppMain (16px radius, heavy shadow)
  → 圆角跳变、深度断裂

场景 3: FAIL — 跨组件配色不协调
  MessageBubble (蓝色渐变) ↔ AvatarGroup (紫色渐变)
  → 色相距离过大

场景 4: FAIL — 激活状态视觉权重失衡
  TabItem.active (高饱和背景 + 粗边框) ↔ TabItem.default (低饱和)
  → 视觉权重差异过大

场景 5: PASS — Token 共享一致
  Button (primary token) ↔ Card (primary token)
  → 共享 Token 值一致

场景 6: FAIL — Token 漂移
  Button (primary=#1a73e8) ↔ Card (primary=#1b74e9)
  → 同一 Token 在不同组件上值不同
```

---

## 11. 测试策略

### 11.1 单元测试

```
tests/unit/reporting/cross-component.test.ts
  ├── 组件分组：显式标注 → 正确分组
  ├── 组件分组：无标注 → 启发式推断
  ├── Token 漂移检测：共享 Token 值一致 → PASS
  ├── Token 漂移检测：共享 Token 值不同 → FAIL
  ├── 视觉断裂检测：圆角一致 → PASS
  ├── 视觉断裂检测：圆角跳变 → FAIL
  ├── 配色协调检测：类似色 → PASS
  ├── 配色协调检测：中差色 → FAIL
  └── 系统性模式检测：多组件 Token 漂移 → COMPONENT_TOKEN_DRIFT

tests/unit/metrics/cross-component-metrics.test.ts
  ├── CROSS_COMPONENT.TOKEN_CONSISTENCY 计算正确性
  ├── CROSS_COMPONENT.SURFACE_CONTINUITY 计算正确性
  ├── CROSS_COMPONENT.COLOR_HARMONY 计算正确性
  └── CROSS_COMPONENT.STATE_TRANSITION 计算正确性
```

### 11.2 E2E 测试

```
tests/e2e/visual-texture/cross-component.spec.ts
  ├── 参考页面 cross-component.html 全场景扫描
  ├── PASS 场景 → continuityScore ≥ 0.8
  ├── FAIL 场景 → 产生对应 CrossComponentFinding
  └── 降级：无 data-uiq-component → 不产生跨组件 Finding
```

### 11.3 Playwright 浏览器验证

```
tests/browser/cross-component.spec.ts
  ├── 加载 cross-component.html
  ├── UIQBrowser.capture() 返回 componentBoundaries
  ├── 跨组件度量结果与预期一致
  └── 报告 JSON 包含 crossComponentAnalysis 字段
```

---

## 12. 实施路线图

### Phase 1：类型与分组（M1）

| 任务 | 涉及文件 | 复杂度 |
|------|---------|--------|
| 新增 `ComponentBoundary`、`ComponentRelation` 等类型 | `packages/core/src/visual-texture/types.ts` | 低 |
| 新增 `CrossComponentFinding` 类型 | `packages/core/src/visual-texture/types.ts` | 低 |
| 扩展 `MeasurementSnapshot` 可选字段 | `packages/core/src/contracts.ts` | 低 |
| 实现 `componentGrouping.ts` | `packages/reporting/src/visual-texture/` | 中 |

### Phase 2：跨组件度量（M2）

| 任务 | 涉及文件 | 复杂度 |
|------|---------|--------|
| 实现 8 个跨组件度量函数 | `packages/metrics/src/cross-component/` | 高 |
| 定义跨组件规则 | `packages/rules/src/cross-component/` | 中 |
| 度量注册表扩展 | `packages/metrics/src/` | 低 |

### Phase 3：分析与报告（M3）

| 任务 | 涉及文件 | 复杂度 |
|------|---------|--------|
| 实现 `crossComponent.ts` 核心分析 | `packages/reporting/src/visual-texture/` | 高 |
| 实现 `crossComponentRules.ts` | `packages/reporting/src/visual-texture/` | 中 |
| 扩展 `report.ts` 输出 | `packages/reporting/src/visual-texture/` | 中 |
| 扩展 `aggregation.ts` | `packages/reporting/src/visual-texture/` | 中 |

### Phase 4：采集与集成（M4）

| 任务 | 涉及文件 | 复杂度 |
|------|---------|--------|
| 浏览器端组件边界解析 | `packages/browser/src/` | 中 |
| CLI `--cross-component` 命令 | `apps/cli/src/commands/` | 中 |
| 参考页面 | `apps/reference/cross-component.html` | 低 |

### Phase 5：测试与验证（M5）

| 任务 | 涉及文件 | 复杂度 |
|------|---------|--------|
| 单元测试 | `tests/unit/` | 中 |
| E2E 测试 | `tests/e2e/` | 中 |
| Playwright 验证 | `tests/browser/` | 中 |

---

## 13. 与 IMPL-13 的对齐说明

| IMPL-13 条款 | 本方案对应 | 对齐方式 |
|--------------|-----------|---------|
| §28 Component Contract | §4.1 `ComponentBoundary` | 复用 ComponentContract 的 id/version 语义 |
| §30 Component Conformance | §5.2 `CROSS_COMPONENT.TOKEN_CONSISTENCY` | Token 一致性检查从单组件扩展到跨组件 |
| §35 Adapter Contract | §7.1 `browser-global.ts` 扩展 | `resolveComponent` 方法在采集端解析组件边界 |
| §37 ComponentBinding | §3.1 `data-uiq-component` | `componentId` + `instanceId` 对齐 §37 定义 |
| AC-DS-08 Component Contract 可验证 | §5.2 跨组件度量 | 验证扩展到组件间关系 |

---

## 14. 风险与约束

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| 启发式分组不准确 | 跨组件分析产生误报 | 置信度标记为 `INFERRED`，建议用户使用显式标注 |
| 跨组件度量增加执行时间 | 分析耗时增加 | 仅在 `--cross-component` 开关开启时执行 |
| 组件关系声明缺失 | 无法确定哪些组件对需要分析 | 自动推断 + 配置兜底 |
| 视觉权重判断主观性 | "过重"无法量化 | 提供可配置的阈值，不做硬编码判断 |

---

## 15. 总结

本方案通过 **四层叠加** 的方式实现跨组件视觉连续性检测：

1. **标识层** — `data-uiq-component` 属性 + 启发式降级
2. **分组层** — 将扁平度量按组件边界分组
3. **度量层** — 8 个跨组件度量函数，做组间比较
4. **分析层** — 跨组件关系检测 + 系统性模式识别

不修改 V1.0 任何既有合约和度量函数，完全向后兼容。
