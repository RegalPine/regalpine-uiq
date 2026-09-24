# UIQ-LAYOUT-02
# Layout Metric Registry & Algorithm Specification V1.0

**Version:** 1.0.0  
**Status:** Implementation Baseline / Frozen  
**Domain:** Layout Quality  
**Package:** `@uiq/metrics`  
**Related:** `@uiq/geometry` / `@uiq/measurement` / `@uiq/rules`

---

# 1. 目标

本规范将 Layout Quality 中的 Metric 转化为：

```text
Metric ID
→ Input
→ Algorithm
→ Output
→ Unit
→ Status
→ Dependency
→ Tolerance
→ Golden Test
```

原则：

> Metric 负责计算“观察到什么”，Rule 负责判断“是否符合要求”。

---

# 2. Layout Metric Registry

V1.0 正式冻结：

```text
LAYOUT.ALIGNMENT
LAYOUT.GRID_ALIGNMENT
LAYOUT.DENSITY
LAYOUT.SYMMETRY
LAYOUT.OVERFLOW
LAYOUT.RESPONSIVE_SIZE_DELTA
LAYOUT.RESPONSIVE_POSITION_DELTA
LAYOUT.COMPONENT_SIZE_VARIANCE
LAYOUT.SPACING_VARIANCE
```

同时复用已有：

```text
GEOMETRY.WIDTH
GEOMETRY.HEIGHT
GEOMETRY.AREA
GEOMETRY.CENTER_DISTANCE
GEOMETRY.EDGE_DISTANCE
GEOMETRY.OVERLAP

SPACING.MARGIN
SPACING.PADDING
SPACING.GAP
SPACING.DISTANCE
SPACING.SCALE_CONFORMANCE

HIERARCHY.SEMANTIC_IMPORTANCE
HIERARCHY.VISUAL_SALIENCE
HIERARCHY.SALIENCE_DIFFERENCE
```

---

# 3. Metric Dependency Model

```text
LAYOUT.ALIGNMENT
    ↓
GEOMETRY
    ↓
Measurement
```

```text
LAYOUT.GRID_ALIGNMENT
    ↓
GEOMETRY
    ↓
Grid Configuration
```

```text
LAYOUT.DENSITY
    ↓
GEOMETRY.AREA
```

```text
LAYOUT.SYMMETRY
    ↓
GEOMETRY.CENTER_DISTANCE
```

```text
LAYOUT.COMPONENT_SIZE_VARIANCE
    ↓
GEOMETRY.WIDTH
GEOMETRY.HEIGHT
```

---

# 4. Common Layout Input

```ts id="x2r6q8"
export interface LayoutMetricInput {
  readonly subjectId: string;
  readonly elements: readonly LayoutElementMeasurement[];
  readonly relationships?: readonly LayoutRelationship[];
  readonly configuration?: LayoutMetricConfiguration;
}
```

---

# 5. Element Measurement

```ts id="h7m3p9"
export interface LayoutElementMeasurement {
  readonly id: string;

  readonly rect: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  };

  readonly parentId?: string;
  readonly componentId?: string;
  readonly regionId?: string;

  readonly visible: boolean;
}
```

---

# 6. Alignment Metric

## ID

```text
LAYOUT.ALIGNMENT@1.0.0
```

## Purpose

计算两个或多个元素在指定轴和边界上的对齐偏差。

---

# 7. Alignment Axis

```ts id="q3f7w1"
export type AlignmentAxis =
  | "LEFT"
  | "RIGHT"
  | "TOP"
  | "BOTTOM"
  | "CENTER_X"
  | "CENTER_Y";
```

---

# 8. Alignment Coordinate

对于 Rect：

```text id="7r9k2c"
LEFT   = x
RIGHT  = x + width
TOP    = y
BOTTOM = y + height

CENTER_X = x + width / 2
CENTER_Y = y + height / 2
```

---

# 9. Alignment Deviation

给定参考元素 A 与目标元素 B：

```text id="w4m8n2"
D = coordinate(B) - coordinate(A)
```

例如：

```text id="7h3p5q"
A.left = 120
B.left = 124

D = +4px
```

Metric：

```json id="x5q8m1"
{
  "axis": "LEFT",
  "deviation": 4,
  "unit": "px"
}
```

---

# 10. Alignment Group

对于：

```text id="m2c7v9"
A
B
C
D
```

可以建立共同参考线：

```text id="g8n4x1"
Reference =
median(coordinates)
```

使用 Median 而不是 Mean，可以减少单个异常元素对参考线的影响。

---

# 11. Alignment Group Deviation

定义：

```text id="f7k3p8"
deviation_i =
coordinate_i - median(coordinates)
```

输出：

```ts id="r5w9z2"
export interface AlignmentMetricResult {
  readonly axis: AlignmentAxis;
  readonly reference: number;
  readonly deviations: Readonly<Record<string, number>>;
  readonly maxDeviation: number;
  readonly meanAbsoluteDeviation: number;
}
```

---

# 12. 为什么使用 Median

例如：

```text id="2k6m8q"
120
120
120
140
```

Mean：

```text id="5x3n7p"
125
```

Median：

```text id="8v1c4m"
120
```

对于布局一致性分析：

```text
Median
```

更适合识别异常元素。

---

# 13. Alignment Reference Types

V1.0 支持：

```text id="k4q8m2"
ELEMENT
PARENT
CONTAINER
GROUP
GRID
```

Reference 必须显式声明。

禁止：

```text id="y7w2n5"
自动猜测设计意图
```

---

# 14. Grid Alignment Metric

## ID

```text
LAYOUT.GRID_ALIGNMENT@1.0.0
```

---

# 15. Grid Formula

给定：

```text id="r8m3k6"
coordinate
origin
gridSize
```

计算最近网格线：

```text id="n5q7x2"
nearest =
origin +
round((coordinate - origin) / gridSize) * gridSize
```

偏差：

```text id="j9c4w8"
deviation = coordinate - nearest
```

---

# 16. Grid Example

```text id="x3m7p1"
origin = 0
gridSize = 8
coordinate = 137
```

最近网格：

```text id="g5k2v9"
136
```

偏差：

```text id="m8q4r7"
+1px
```

---

# 17. Grid Output

```ts id="t6y2p8"
export interface GridAlignmentMetricResult {
  readonly axis: "X" | "Y";
  readonly gridSize: number;
  readonly origin: number;
  readonly coordinate: number;
  readonly nearestGridLine: number;
  readonly deviation: number;
}
```

---

# 18. Grid Boundary

如果：

```text
gridSize <= 0
```

结果：

```text
ERROR
```

如果坐标无法确定：

```text
UNKNOWN
```

不得返回：

```text
0
```

---

# 19. Density Metric

## ID

```text
LAYOUT.DENSITY@1.0.0
```

---

# 20. Area Density

定义：

```text id="v5m8q2"
Density =
Σ visible element area / container area
```

但是必须注意元素可能重叠。

因此 V1.0 定义两种模式：

```text
RAW_AREA
UNION_AREA
```

---

# 21. Raw Area Density

```text id="h3q7m1"
RawDensity =
Σ Area(elements) / Area(container)
```

可以超过：

```text
1.0
```

这不代表 Metric 错误。

例如大量重叠元素可能：

```text
RawDensity = 1.42
```

---

# 22. Union Density

```text id="n8w4p6"
UnionDensity =
Area(Union(elements)) / Area(container)
```

理论范围：

```text
0 ≤ Density ≤ 1
```

V1.0 推荐 Layout Rule 默认使用：

```text
UNION_AREA
```

---

# 23. Density Context

必须记录：

```ts id="c7m2x9"
export interface DensityMetricResult {
  readonly context: "VIEWPORT" | "REGION" | "CONTAINER";
  readonly mode: "RAW_AREA" | "UNION_AREA";
  readonly occupiedArea: number;
  readonly availableArea: number;
  readonly density: number;
}
```

---

# 24. Symmetry Metric

## ID

```text
LAYOUT.SYMMETRY@1.0.0
```

---

# 25. Symmetry Types

V1.0：

```text
HORIZONTAL
VERTICAL
```

`RADIAL` 保留为扩展，不进入 V1.0 Core Metric Registry。

---

# 26. Vertical Symmetry

关于垂直轴：

```text id="f6n2k8"
axisX
```

元素中心：

```text id="j4w7m3"
cx = x + width / 2
```

镜像位置：

```text id="z9q1p5"
mirrorX = 2 * axisX - cx
```

---

# 27. Symmetry Deviation

找到匹配元素 A/B：

```text id="r3k8v6"
D =
abs(
  centerA +
  centerB -
  2 * axis
)
```

最终输出：

```ts id="w5m2q7"
export interface SymmetryMetricResult {
  readonly axis: "HORIZONTAL" | "VERTICAL";
  readonly referenceAxis: number;
  readonly pairs: readonly SymmetryPair[];
  readonly maxDeviation: number;
}
```

---

# 28. Symmetry Matching

V1.0 不允许通过 AI 猜测匹配关系。

支持：

```text id="y7x3m8"
explicit pair mapping
stable DOM order
component identity
```

如果无法可靠建立 Pair：

```text
UNKNOWN
```

---

# 29. Overflow Metric

## ID

```text
LAYOUT.OVERFLOW@1.0.0
```

---

# 30. Overflow Calculation

对于元素 Rect：

```text id="k8p4n2"
left < container.left
right > container.right
top < container.top
bottom > container.bottom
```

分别计算：

```text id="q3m7x9"
overflowLeft
overflowRight
overflowTop
overflowBottom
```

---

# 31. Overflow Output

```ts id="v6w2r8"
export interface OverflowMetricResult {
  readonly overflowLeft: number;
  readonly overflowRight: number;
  readonly overflowTop: number;
  readonly overflowBottom: number;
  readonly maxOverflow: number;
}
```

---

# 32. Overflow ≠ Failure

例如：

```text id="m9x4q1"
Carousel
```

允许内容超出容器。

因此：

```text
OVERFLOW Metric
```

只报告事实。

Rule 决定：

```text
NO_OVERFLOW
```

是否成立。

---

# 33. Responsive Size Delta

## ID

```text
LAYOUT.RESPONSIVE_SIZE_DELTA@1.0.0
```

---

# 34. Responsive Input

需要至少两个 Snapshot：

```text id="r5m8c3"
Snapshot A
Snapshot B
```

同一：

```text
UIQ Entity ID
```

进行匹配。

---

# 35. Size Delta

```text id="j7q2w9"
Δwidth =
width_B - width_A

Δheight =
height_B - height_A
```

同时提供：

```text id="n4k6x8"
relativeWidthDelta =
(width_B - width_A) / width_A
```

当：

```text
width_A = 0
```

相对值：

```text
UNKNOWN
```

---

# 36. Responsive Position Delta

## ID

```text
LAYOUT.RESPONSIVE_POSITION_DELTA@1.0.0
```

定义：

```text id="p8m3r6"
Δx = x_B - x_A
Δy = y_B - y_A
```

以及：

```text id="c5q7w1"
distance =
sqrt(Δx² + Δy²)
```

---

# 37. Component Size Variance

## ID

```text
LAYOUT.COMPONENT_SIZE_VARIANCE@1.0.0
```

针对：

```text id="x9m2v7"
same component type
```

计算：

```text id="w6q4p8"
Mean Width
Variance Width
Mean Height
Variance Height
```

---

# 38. Variance

给定：

```text id="t3k7m1"
x₁ ... xₙ
```

总体方差：

```text id="r8v2q5"
σ² =
Σ(xᵢ - μ)² / n
```

V1.0 使用 Population Variance。

如果需要样本统计：

```text
STDEV_SAMPLE
```

属于后续统计扩展。

---

# 39. Size Consistency

Metric 输出：

```ts id="h5q8m3"
export interface ComponentSizeVariance {
  readonly componentType: string;
  readonly count: number;

  readonly widthMean: number;
  readonly widthVariance: number;

  readonly heightMean: number;
  readonly heightVariance: number;
}
```

Rule 决定是否允许。

---

# 40. Spacing Variance

## ID

```text
LAYOUT.SPACING_VARIANCE@1.0.0
```

用于：

```text id="m7x2p9"
spacing sequence
```

例如：

```text id="f4q8n1"
8
8
8
12
8
```

输出：

```text id="w3k6v5"
mean = 8.8
variance = ...
```

---

# 41. Spacing Sequence

Metric 不自行决定：

```text id="p9m4x7"
哪些元素应该形成一个 sequence
```

必须由：

```text id="0xq2s6"
Layout Group
```

提供。

---

# 42. Layout Group

```ts id="a7m3k8"
export interface LayoutGroup {
  readonly id: string;

  readonly elementIds: readonly string[];

  readonly relation:
    | "HORIZONTAL"
    | "VERTICAL"
    | "GRID"
    | "STACK";
}
```

---

# 43. Distance Metric

已有：

```text
SPACING.DISTANCE
```

Layout 直接复用。

二维距离：

```text id="r2w6p9"
D =
sqrt(
  Δx² + Δy²
)
```

但如果分析的是：

```text
horizontal gap
vertical gap
```

应分别输出，不使用 Euclidean Distance 替代。

---

# 44. Gap Calculation

两个矩形：

```text id="m7q1x5"
A
B
```

如果：

```text
A.right <= B.left
```

则：

```text id="v8k3n2"
horizontalGap = B.left - A.right
```

垂直方向同理。

---

# 45. Overlap

已有：

```text
GEOMETRY.OVERLAP
```

Layout 不重新实现。

交集：

```text id="f3m8q2"
intersectionWidth =
max(0, min(A.right,B.right)-max(A.left,B.left))

intersectionHeight =
max(0, min(A.bottom,B.bottom)-max(A.top,B.top))
```

---

# 46. Layout Metric Status

统一：

```text id="q8w5m1"
AVAILABLE
UNKNOWN
ERROR
```

---

# 47. UNKNOWN Conditions

例如：

```text id="x4m7p2"
无法确定参考元素
无法确定 Layout Group
无法匹配 Responsive Entity
元素不可测量
Geometry 不可用
```

返回：

```text
UNKNOWN
```

---

# 48. ERROR Conditions

例如：

```text id="j6q3v8"
gridSize < 0
invalid configuration
invalid subject
invalid metric dependency
```

返回：

```text
ERROR
```

---

# 49. Tolerance

Metric 不决定容差。

例如：

```text id="p8m2x6"
Alignment deviation = 1px
```

Rule 可以：

```text id="y4q7n1"
ABSOLUTE tolerance = 1px
```

或者：

```text id="m3w8k5"
threshold = 0px
tolerance = 0.5px
```

---

# 50. Device Pixel Ratio

布局 Metric 使用：

```text id="c6v2m9"
CSS px
```

而不是：

```text
physical device pixel
```

因此：

```text id="k8r4x1"
dPR = 2
```

不应该导致：

```text
40 CSS px → 80 layout px
```

---

# 51. Zoom

Browser Zoom 会影响：

```text id="w5m7q2"
getBoundingClientRect()
```

因此 Snapshot 必须记录：

```text
zoom
viewport
devicePixelRatio
```

Metric 本身仍然处理实际获得的 CSS-coordinate geometry。

---

# 52. Transforms

`getBoundingClientRect()` 反映视觉 Bounding Box。

因此：

```text id="n3q8x5"
transform: scale()
transform: rotate()
```

可能改变 Rect。

V1.0：

```text
Rendered Geometry
```

是 Layout Measurement 的事实源。

---

# 53. Scrolling

Rect 为：

```text id="f7m2c9"
viewport-relative
```

因此 Snapshot 必须记录：

```text
scrollX
scrollY
```

跨 Snapshot 比较时必须考虑滚动状态。

---

# 54. Hidden Elements

默认：

```text id="x9w3p7"
display:none
```

以及无法形成有效 Rect 的元素：

```text
UNKNOWN
```

不应该被简单视为：

```text
0 × 0
```

因为：

```text
不存在布局
```

与：

```text
布局尺寸为 0
```

语义不同。

---

# 55. Visibility

建议：

```ts id="m5q8v2"
export type VisibilityState =
  | "VISIBLE"
  | "HIDDEN"
  | "COLLAPSED"
  | "NOT_RENDERED"
  | "UNKNOWN";
```

---

# 56. Responsive Matching

优先级：

```text id="r7x2k5"
UIQ Entity ID
 ↓
Component ID
 ↓
explicit mapping
```

禁止：

```text id="n8m4p1"
array index
```

作为跨 viewport 身份。

---

# 57. Layout Metric Versioning

每个 Metric：

```text id="g3q7v9"
LAYOUT.ALIGNMENT@1.0.0
LAYOUT.GRID_ALIGNMENT@1.0.0
LAYOUT.DENSITY@1.0.0
LAYOUT.SYMMETRY@1.0.0
...
```

必须精确引用。

禁止：

```text id="k6m2x8"
LAYOUT.ALIGNMENT@latest
```

---

# 58. Numeric Precision

内部：

```text id="p4w8n3"
IEEE-754 double
```

不提前 round。

例如：

```text id="z7q2m5"
1.9999999997
```

仍保留原始值。

Display Layer 可以：

```text id="c8x4v1"
2px
```

Calculation Layer 不得使用展示值。

---

# 59. Determinism

相同：

```text id="w3m7q9"
MeasurementSnapshot
Metric Version
Configuration
Engine Version
```

必须得到相同：

```text id="k5p2x8"
MetricResult
Fingerprint
```

禁止：

```text id="r8m4v6"
random
current time
global mutable state
browser DOM
network
```

进入 Metric Calculation。

---

# 60. Metric Registry

注册：

```ts id="y7q3m1"
registry.register({
  id: "LAYOUT.ALIGNMENT",
  version: "1.0.0",
  kind: "DERIVED",
  dependencies: [
    {
      metricId: "GEOMETRY.WIDTH",
      version: "1.0.0",
      required: true
    }
  ],
  calculate
});
```

实际依赖由算法决定，不允许为了示例强行声明不使用的 Metric。

---

# 61. Layout Metric Package

建议：

```text id="v6m2q8"
packages/metrics/
└── src/
    ├── layout/
    │   ├── alignment/
    │   │   ├── calculateAlignment.ts
    │   │   └── AlignmentMetric.ts
    │   ├── grid/
    │   │   ├── calculateGridAlignment.ts
    │   │   └── GridAlignmentMetric.ts
    │   ├── density/
    │   │   ├── calculateDensity.ts
    │   │   └── DensityMetric.ts
    │   ├── symmetry/
    │   │   ├── calculateSymmetry.ts
    │   │   └── SymmetryMetric.ts
    │   ├── overflow/
    │   │   └── calculateOverflow.ts
    │   ├── responsive/
    │   │   ├── calculateSizeDelta.ts
    │   │   └── calculatePositionDelta.ts
    │   ├── consistency/
    │   │   ├── calculateSizeVariance.ts
    │   │   └── calculateSpacingVariance.ts
    │   └── index.ts
```

---

# 62. Architecture Boundary

Layout Metric 可以依赖：

```text
@uiq/core
@uiq/geometry
@uiq/measurement
```

不得依赖：

```text
@uiq/rules
@uiq/browser
@uiq/diagnostic
@uiq/reporting
React
Vue
Radix
```

---

# 63. Browser Boundary

Browser 负责：

```text id="n5x7q2"
DOM
 ↓
Rect
 ↓
Computed Style
 ↓
Measurement
```

Metrics 负责：

```text id="c8m3v6"
Measurement
 ↓
Mathematical Metric
```

因此：

```text id="x7p4k9"
Playwright
```

不进入 Layout Metric。

---

# 64. Golden Test Matrix

必须至少覆盖：

```text id="w2q6m8"
Alignment:
  exact
  +1px
  +4px
  negative deviation

Grid:
  exact
  half-grid
  arbitrary origin

Density:
  empty
  full
  overlap
  union

Symmetry:
  exact
  deviation
  missing pair

Overflow:
  none
  left
  right
  top
  bottom

Responsive:
  same
  resized
  moved
  missing entity

Component:
  identical sizes
  one outlier
  all different
```

---

# 65. Property-Based Tests

适合：

```text id="f9m3x7"
Grid Alignment
Symmetry
Distance
Overlap
Variance
Responsive Delta
```

例如：

```text
gridSize > 0
→ |deviation| <= gridSize / 2
```

---

# 66. Important Invariants

### Grid

```text id="q7m2v5"
abs(deviation) <= gridSize / 2
```

---

### Width

```text id="x4n8p1"
width >= 0
```

---

### Height

```text id="m6q3w9"
height >= 0
```

---

### Area

```text id="r2k7v4"
area >= 0
```

---

### Density Union

```text id="p8x5m1"
0 <= density <= 1
```

---

### Variance

```text id="z3q6w8"
variance >= 0
```

---

# 67. 不允许的算法行为

Metric 不得：

```text id="j4m8p2"
自动修改布局
自动选择最佳布局
自动修改 CSS
自动修改 Token
自动判断美观
自动生成设计
自动给页面打总体分数
```

---

# 68. 与 Rule 的边界

例如：

```text id="v6x2q9"
Metric:
LAYOUT.ALIGNMENT
Deviation = 2px
```

Rule：

```text id="m3p7w1"
Expected deviation <= 1px
```

最终：

```text
Metric
2px
 ↓
Rule
2px > 1px
 ↓
FAIL
```

---

# 69. Layout Rule Example

```json id="c8n4q6"
{
  "id": "LAYOUT.ALIGNMENT.CONFORMANCE",
  "version": "1.0.0",
  "metricId": "LAYOUT.ALIGNMENT",
  "metricVersion": "1.0.0",
  "operator": "LTE",
  "threshold": 1,
  "severity": "MEDIUM"
}
```

---

# 70. Report Consumption

Reporting 不重新计算布局。

```text id="q7m3x8"
Layout MetricResult
        ↓
Layout Evaluation
        ↓
Layout Finding
        ↓
Layout Diagnostic
        ↓
Layout Recommendation
        ↓
Layout Report
```

---

# 71. Inspector Consumption

Inspector 可以直接展示：

```text id="w4p8m2"
Alignment
Reference: 120px
Observed: 124px
Deviation: +4px
Rule: ≤ 1px
Result: FAIL
```

这是一条完整证据链。

---

# 72. Skill Consumption

用户：

> 检查这个页面的布局。

Skill：

```bash id="n5x2q7"
uiq analyze \
  --dimension layout \
  --format json
```

Skill 不重新计算：

```text
alignment
density
spacing
symmetry
```

只解释 UIQ Artifact。

---

# 73. Layout Report Example

```text id="k8m3v5"
Layout Quality Assessment

Geometry
--------
Elements measured: 126

Alignment
---------
PASS: 32
FAIL: 4

Grid
----
PASS: 41
FAIL: 2

Spacing
-------
PASS: 27
FAIL: 5

Responsive
----------
PASS: 18
FAIL: 1
UNKNOWN: 2
```

然后：

```text id="p4q7x1"
Findings
--------
Card Group spacing deviation
Content alignment deviation
Mobile overflow
```

---

# 74. V1.0 Explicit Non-Goals

不支持：

```text id="m6x2q8"
AI layout aesthetic scoring
automatic optimal layout generation
Figma design intent inference
eye tracking
user preference prediction
conversion prediction
automatic CSS correction
automatic DOM restructuring
```

---

# 75. Architecture Freeze

本规范冻结：

```text id="y8m3q6"
Layout Quality
     ↓
Existing Metric Architecture
```

不新增：

```text id="f5x7p2"
Layout Engine
Layout Quality Engine
Visual Intelligence Engine
Aesthetic Engine
```

---

# 76. Final Layout Metric Model

```text id="r7m2k9"
                 Layout Measurement
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
       Geometry       Spatial       Context
          │          Relations         │
          │             │              │
          ▼             ▼              ▼
      Alignment       Spacing       Responsive
      Grid            Overlap       Component
      Overflow        Symmetry      Density
                                     │
                                     ▼
                                    Metric
                                     │
                                     ▼
                                    Rule
                                     │
                                     ▼
                                 Evaluation
                                     │
                                     ▼
                                  Finding
                                     │
                                     ▼
                                 Diagnostic
                                     │
                                     ▼
                               Recommendation
```

---

# 77. 最终结论

UIQ 的 Layout Quality 在 V1.0 已经可以从“概念上的布局检查”落到**确定性的数学计算**。

核心冻结为：

```text
ALIGNMENT
GRID_ALIGNMENT
DENSITY
SYMMETRY
OVERFLOW
RESPONSIVE_SIZE_DELTA
RESPONSIVE_POSITION_DELTA
COMPONENT_SIZE_VARIANCE
SPACING_VARIANCE
```

并复用已有：

```text
GEOMETRY
SPACING
HIERARCHY
```

最重要的边界仍然是：

> **Metric 计算布局事实；Rule 定义布局要求；Evaluation 判断是否满足要求；Diagnostic 解释原因；Recommendation 提供可验证的改进方向。**

因此以后再增加诸如 **Flex/Grid 布局、容器约束、响应式断点、页面栅格、Design Token 间距体系**，原则上都应该通过现有 Metric、Rule、Adapter、Diagnostic、Reporting 扩展，而不是继续增加新的核心架构层。