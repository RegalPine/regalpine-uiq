# UIQ-LAYOUT-01
# Layout Quality Assessment Specification V1.0

**Version:** 1.0.0  
**Status:** Baseline / Frozen  
**System:** UIQ  
**Domain:** Layout Quality  
**Depends On:** UIQ-FM-01 / UIQ-MR-01 / UIQ-ER-02 / UIQ-DG-01 / UIQ-REPORT-01

---

# 1. 目标

UIQ Layout Quality 用于对实际渲染 UI 的布局进行：

- 几何测量
- 空间关系计算
- 对齐分析
- 网格一致性分析
- 间距分析
- 密度分析
- 对称性分析
- 层级关系分析
- 响应式状态分析
- 组件布局一致性分析

最终形成：

```text
Real UI
   ↓
Measurement
   ↓
Layout Metrics
   ↓
Layout Rules
   ↓
Evaluation
   ↓
Finding
   ↓
Diagnostic
   ↓
Recommendation
   ↓
Remeasure
   ↓
Regression
```

---

# 2. 核心原则

## 2.1 不评价“美观”

UIQ 不定义：

```text
漂亮
高级
现代
舒服
有设计感
```

这些不是 V1.0 的确定性布局指标。

---

## 2.2 评价可验证的布局约束

例如：

```text
元素是否对齐
元素之间距离是多少
是否遵循网格
间距是否符合 Token
组件尺寸是否一致
是否发生重叠
视觉层级是否与结构关系一致
响应式状态是否违反布局约束
```

---

# 3. Layout Quality Model

布局质量模型：

```text
Layout Quality
│
├── Geometry
├── Alignment
├── Grid
├── Spacing
├── Density
├── Symmetry
├── Hierarchy
├── Responsive
└── Component Consistency
```

注意：

> Layout Quality 是一个**分析领域集合**，不是一个单一 Quality Score。

---

# 4. Layout Domain Model

定义：

```text
LQ = (E, G, R, C, V)
```

其中：

```text
E = Layout Elements
G = Geometry
R = Spatial Relationships
C = Constraints
V = Viewport States
```

---

# 5. Layout Element

Layout Element 是参与布局关系分析的 UI Element。

```ts
export interface LayoutElement {
  readonly id: string;
  readonly parentId?: string;

  readonly rect: Rect;

  readonly role?: string;

  readonly componentId?: string;

  readonly layoutContainerId?: string;

  readonly visibility: VisibilityState;
}
```

---

# 6. Rect

```ts
export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}
```

坐标系必须明确。

V1.0 默认：

```text
Viewport Coordinate System
```

来源：

```ts
Element.getBoundingClientRect()
```

---

# 7. Layout Relationship

定义：

```ts
export interface LayoutRelationship {
  readonly sourceId: string;
  readonly targetId: string;

  readonly type:
    | "ALIGNMENT"
    | "DISTANCE"
    | "OVERLAP"
    | "CONTAINMENT"
    | "CENTER"
    | "ORDER"
    | "SYMMETRY";
}
```

关系本身不是错误。

例如：

```text
OVERLAP
```

可能是：

- Dialog Overlay
- Badge
- Floating Button
- Tooltip

因此：

```text
Relationship ≠ Finding
```

---

# 8. Metric Domains

Layout V1.0 正式使用：

```text
GEOMETRY
SPACING
LAYOUT
HIERARCHY
```

---

# 9. Geometry Metrics

已有：

```text
GEOMETRY.WIDTH
GEOMETRY.HEIGHT
GEOMETRY.AREA
GEOMETRY.ASPECT_RATIO
GEOMETRY.CENTER_DISTANCE
GEOMETRY.EDGE_DISTANCE
GEOMETRY.OVERLAP
```

Layout 不重复实现这些 Metric。

---

# 10. Alignment Metrics

正式 Metric：

```text
LAYOUT.ALIGNMENT@1.0.0
LAYOUT.GRID_ALIGNMENT@1.0.0
```

---

# 11. Alignment Model

支持：

```text
LEFT
RIGHT
TOP
BOTTOM
CENTER_X
CENTER_Y
BASELINE
```

例如：

```text
A.left = 120px
B.left = 120px
```

则：

```text
Δ = 0px
```

---

# 12. Alignment Deviation

定义：

```text
AlignmentDeviation =
ObservedAlignment - ReferenceAlignment
```

例如：

```text
Reference = 120px
Observed  = 124px

Deviation = +4px
```

Metric 只返回：

```text
4px
```

是否允许由 Rule 决定。

---

# 13. Alignment Reference

Alignment 必须明确参考对象：

```text
ELEMENT
PARENT
CONTAINER
GRID
SIBLING
GROUP
```

禁止 Metric 隐式猜测“应该对齐谁”。

---

# 14. Grid Alignment

定义：

```text
GRID_ALIGNMENT =
distance(element edge, nearest grid line)
```

例如：

```text
Grid = 8px

Observed X = 136px

136 % 8 = 0

Deviation = 0
```

---

# 15. Grid Configuration

```ts
export interface GridConfiguration {
  readonly originX: number;
  readonly originY: number;

  readonly columnSize?: number;
  readonly rowSize?: number;

  readonly columnGap?: number;
  readonly rowGap?: number;
}
```

Metric 不得硬编码：

```text
8px
4px
12px
```

这些属于配置或 Rule。

---

# 16. Spacing Metrics

已有：

```text
SPACING.MARGIN
SPACING.PADDING
SPACING.GAP
SPACING.DISTANCE
SPACING.TOKEN_DEVIATION
SPACING.SCALE_CONFORMANCE
```

Layout 系统直接消费这些 Metric。

---

# 17. Spacing Relationships

支持：

```text
ELEMENT → ELEMENT
ELEMENT → CONTAINER
CONTAINER → CONTAINER
COMPONENT → COMPONENT
```

例如：

```text
Card A
 ↓ 24px
Card B
```

产生：

```text
SPACING.DISTANCE = 24px
```

---

# 18. Vertical Rhythm

V1.0 将 Vertical Rhythm 定义为：

```text
相邻垂直布局对象之间的距离序列
```

例如：

```text
24
24
32
24
24
```

Metric 可以输出：

```ts
export interface SpacingSequence {
  readonly values: readonly number[];
}
```

Metric 不判断：

```text
好
坏
漂亮
```

---

# 19. Density

已有：

```text
LAYOUT.DENSITY@1.0.0
```

V1.0：

```text
Density =
occupied area / available area
```

或在特定上下文中：

```text
Element Count / Area
```

必须记录计算方法。

---

# 20. Density Context

Density 必须声明：

```text
VIEWPORT
REGION
CONTAINER
COMPONENT
```

不能把不同上下文的 Density 直接比较。

---

# 21. Density Rule

例如：

```text
LAYOUT.DENSITY.REGION@1.0.0
```

配置：

```json
{
  "min": 0.15,
  "max": 0.65
}
```

最终：

```text
Metric → Rule
```

而不是：

```text
Density Metric → GOOD/BAD
```

---

# 22. Symmetry

已有：

```text
LAYOUT.SYMMETRY@1.0.0
```

V1.0 支持：

```text
HORIZONTAL
VERTICAL
RADIAL
```

但：

```text
SYMMETRY ≠ QUALITY
```

不对称页面完全可能是设计意图。

---

# 23. Symmetry Reference

必须指定：

```text
axis
reference
tolerance
```

例如：

```text
Container center = 720px

Left element center = 480px
Right element center = 960px

Distances:
240px
240px
```

则几何上对称。

---

# 24. Hierarchy

已有：

```text
HIERARCHY.SEMANTIC_IMPORTANCE
HIERARCHY.VISUAL_SALIENCE
HIERARCHY.SALIENCE_DIFFERENCE
```

布局层级不能仅由 DOM 深度决定。

需要区分：

```text
DOM Structure
Visual Geometry
Typography
Color
Position
```

---

# 25. Visual Salience

V1.0 不建立复杂的 AI Salience Model。

允许使用已定义的确定性输入：

```text
area
contrast
font size
font weight
position
color
```

但具体 Salience Metric 必须明确公式和版本。

---

# 26. Hierarchy Relationship

例如：

```text
Heading
 ↓
Subtitle
 ↓
Body
```

可以建立：

```text
SEMANTIC_IMPORTANCE
```

与：

```text
VISUAL_SALIENCE
```

之间的差异：

```text
SALIENCE_DIFFERENCE
```

然后由 Rule 判断。

---

# 27. Layout Constraint

布局质量评估的关键对象：

```ts
export interface LayoutConstraint {
  readonly id: string;
  readonly version: string;

  readonly subjectType:
    | "ELEMENT"
    | "COMPONENT"
    | "REGION"
    | "PAGE";

  readonly relationType:
    | "ALIGNMENT"
    | "DISTANCE"
    | "SIZE"
    | "GRID"
    | "SYMMETRY"
    | "DENSITY"
    | "ORDER";
}
```

---

# 28. Constraint Examples

```text
ButtonGroup:
  gap = 8px

CardGrid:
  column-gap = 24px

Content:
  left alignment = container grid

Toolbar:
  vertical alignment = CENTER_Y

Form:
  label/control alignment = LEFT
```

---

# 29. Rule Examples

初始 Layout Rules：

```text
LAYOUT.ALIGNMENT.CONFORMANCE@1.0.0

LAYOUT.GRID.CONFORMANCE@1.0.0

LAYOUT.SPACING.CONFORMANCE@1.0.0

LAYOUT.DENSITY.RANGE@1.0.0

LAYOUT.SYMMETRY.CONFORMANCE@1.0.0

LAYOUT.COMPONENT.SIZE_CONSISTENCY@1.0.0

LAYOUT.OVERLAP.UNEXPECTED@1.0.0

LAYOUT.HIERARCHY.CONFORMANCE@1.0.0
```

---

# 30. Unexpected Overlap

不能定义：

```text
OVERLAP > 0 → FAIL
```

必须有适用性上下文。

例如：

```text
Badge → Button
```

允许。

而：

```text
Card A → Card B
```

如果设计约束要求不重叠，则：

```text
OVERLAP > 0
→ Rule FAIL
```

---

# 31. Component Size Consistency

对于同一 Component Type：

```text
Button
Button
Button
Button
```

可以计算：

```text
width distribution
height distribution
```

例如：

```text
Button A = 96 × 40
Button B = 96 × 40
Button C = 104 × 40
```

Metric 可以产生：

```text
size deviation
```

Rule 决定是否违反 Component Contract。

---

# 32. Responsive Layout

响应式不是一个 Snapshot。

定义：

```text
ResponsiveEvaluation =
{ Snapshot_1, Snapshot_2, ..., Snapshot_n }
```

例如：

```text
375 × 812
768 × 1024
1440 × 900
```

---

# 33. Responsive Invariants

可以定义跨 viewport 约束：

```text
Sidebar:
  desktop = visible
  mobile = collapsed
```

或者：

```text
Content:
  left/right margin >= minimum
```

或者：

```text
Card:
  width <= container width
```

---

# 34. Responsive Rule

例如：

```text
LAYOUT.RESPONSIVE.NO_OVERFLOW@1.0.0
```

输入：

```text
multiple MeasurementSnapshots
```

输出：

```text
PASS
FAIL
UNKNOWN
```

注意：

Responsive Rule 可以依赖多个已有 Metric Result。

---

# 35. Responsive Metric

如果需要计算：

```text
layout change
position change
size change
```

应建立 Metric。

例如：

```text
LAYOUT.RESPONSIVE.SIZE_DELTA@1.0.0
```

然后：

```text
Metric → Rule
```

不能在 Rule 内偷偷计算。

---

# 36. Layout Consistency

同类组件：

```text
Button
Input
Card
Table
```

可以建立 Component Layout Contract：

```text
Component
├── width
├── height
├── padding
├── gap
├── alignment
├── radius
└── typography
```

UIQ 检查实际实例与 Contract 的偏差。

---

# 37. Design System Integration

完整路径：

```text
Design Token
 ↓
Component Contract
 ↓
Rendered Component
 ↓
Measurement
 ↓
Layout Metric
 ↓
Rule
```

因此可以发现：

```text
设计系统规定 24px
        ↓
实际组件 20px
```

这属于：

```text
TOKEN_DEVIATION
```

而不是直接把它称为：

```text
LAYOUT_FAILURE
```

除非存在对应 Layout Rule。

---

# 38. Finding 分类

Layout Finding：

```text
LAYOUT_ALIGNMENT
LAYOUT_GRID
LAYOUT_SPACING
LAYOUT_DENSITY
LAYOUT_SYMMETRY
LAYOUT_OVERLAP
LAYOUT_HIERARCHY
LAYOUT_RESPONSIVE
LAYOUT_COMPONENT_CONSISTENCY
```

Finding 必须关联：

```text
Evaluation
Metric
Measurement
Subject
```

---

# 39. Diagnostic

典型诊断：

```text
Finding
 ↓
Diagnostic
 ↓
Evidence
```

例如：

```text
Finding:
Card spacing violates rule

Diagnostic:
Observed gap = 20px
Expected = 24px
Token = spacing.card.gap
Resolved CSS = 20px
```

因此可能原因：

```text
TOKEN
COMPONENT
CSS
LAYOUT_CONFIGURATION
UNKNOWN
```

不得凭空指定 Root Cause。

---

# 40. Recommendation

推荐输出：

```text
REVIEW_SPACING_TOKEN
REVIEW_COMPONENT_LAYOUT
REVIEW_CONTAINER_LAYOUT
REVIEW_GRID_CONFIGURATION
REVIEW_RESPONSIVE_CONSTRAINT
REVIEW_HIERARCHY
```

例如：

> 检查 Card Group 的间距配置。当前实际 Gap 为 20px，而 Component Contract 要求 24px。该偏差影响 12 个实例。

而不是：

> 把 Gap 改成 24px。

后者属于自动修改建议，V1.0 不执行。

---

# 41. Layout Recommendation Evidence

必须：

```text
Recommendation
 ↓
Finding
 ↓
Evaluation
 ↓
Metric
 ↓
Measurement
 ↓
Element
```

如果 Token 存在：

```text
Element
 ↓
Component Token
 ↓
Semantic Token
 ↓
Primitive Token
```

---

# 42. Layout Report

报告增加：

```text
## Layout Quality

### Geometry
...

### Alignment
...

### Grid
...

### Spacing
...

### Density
...

### Symmetry
...

### Hierarchy
...

### Responsive
...

### Component Consistency
...
```

但不产生：

```text
Layout Score = 87
```

---

# 43. Layout Summary

可以统计：

```ts
export interface LayoutSummary {
  readonly elementsMeasured: number;
  readonly relationshipsMeasured: number;

  readonly alignmentEvaluations: number;
  readonly spacingEvaluations: number;
  readonly gridEvaluations: number;
  readonly densityEvaluations: number;

  readonly pass: number;
  readonly fail: number;
  readonly warn: number;
  readonly unknown: number;

  readonly findings: number;
}
```

---

# 44. Inspector Layout View

Inspector 增加：

```text
Layout
├── Geometry
├── Alignment
├── Grid
├── Spacing
├── Density
├── Symmetry
├── Hierarchy
├── Responsive
└── Component Consistency
```

选择元素：

```text
Button
```

可以看到：

```text
Position
X: 120px
Y: 240px

Size
96 × 40

Parent Gap
8px

Grid Deviation
0px

Alignment
LEFT = 0px deviation
CENTER_Y = 1px deviation
```

---

# 45. Layout Relationship Visualization

Inspector 可以显示：

```text
┌─────────────────────────────┐
│                             │
│  A                          │
│  ────────────────           │
│              ↓ 24px         │
│  B                          │
│  ────────────────           │
│                             │
└─────────────────────────────┘
```

可视化只展示证据。

不把可视化本身作为判断。

---

# 46. Layout Heatmap

V1.0 可以提供：

```text
Alignment Overlay
Spacing Overlay
Grid Overlay
Overflow Overlay
```

但：

```text
Heatmap ≠ Quality Score
```

---

# 47. Layout Evaluation Matrix

推荐：

| Domain | Metric | Rule | Finding |
|---|---|---|---|
| Alignment | ALIGNMENT | ALIGNMENT.CONFORMANCE | LAYOUT_ALIGNMENT |
| Grid | GRID_ALIGNMENT | GRID.CONFORMANCE | LAYOUT_GRID |
| Spacing | GAP | SPACING.CONFORMANCE | LAYOUT_SPACING |
| Density | DENSITY | DENSITY.RANGE | LAYOUT_DENSITY |
| Symmetry | SYMMETRY | SYMMETRY.CONFORMANCE | LAYOUT_SYMMETRY |
| Overlap | OVERLAP | OVERLAP.UNEXPECTED | LAYOUT_OVERLAP |
| Hierarchy | SALIENCE_DIFFERENCE | HIERARCHY.CONFORMANCE | LAYOUT_HIERARCHY |
| Responsive | SIZE_DELTA | RESPONSIVE.* | LAYOUT_RESPONSIVE |
| Component | SIZE / SPACING | COMPONENT.CONFORMANCE | LAYOUT_COMPONENT_CONSISTENCY |

---

# 48. Unknown Handling

以下情况不能强行判断：

```text
Dynamic Layout
Canvas
SVG Internal Geometry
Virtualized List
Animation
Unresolved Container
Unknown Font
Complex Transform
Unsupported CSS
```

结果：

```text
UNKNOWN
```

而不是：

```text
FAIL
```

---

# 49. Layout Measurement Limitations

V1.0 不保证推断：

```text
设计意图
视觉美感
用户感受
最佳布局
商业转化
品牌高级感
```

只保证：

```text
Observed Layout
+
Explicit Constraint
+
Deterministic Evaluation
```

---

# 50. Golden Cases

必须增加：

```text
LAYOUT-GOLDEN-001
Perfect Alignment

LAYOUT-GOLDEN-002
Alignment Deviation

LAYOUT-GOLDEN-003
Grid Alignment

LAYOUT-GOLDEN-004
Spacing Conformance

LAYOUT-GOLDEN-005
Unexpected Overlap

LAYOUT-GOLDEN-006
Component Size Consistency

LAYOUT-GOLDEN-007
Responsive Width

LAYOUT-GOLDEN-008
Responsive Overflow

LAYOUT-GOLDEN-009
Symmetry

LAYOUT-GOLDEN-010
Density
```

---

# 51. E2E Example

Reference App：

```text
Page
 ├── Header
 ├── Sidebar
 └── Content
      ├── Card
      ├── Card
      └── Card
```

设置：

```text
Grid = 8px
Card Gap = 24px
Card Padding = 16px
```

实际：

```text
Card Gap = 20px
Card Padding = 16px
Card Alignment = +2px
```

UIQ：

```text
SPACING.GAP
20px

SPACING.SCALE_CONFORMANCE
FAIL

LAYOUT.ALIGNMENT
+2px
```

最终：

```text
Finding
  ↓
Card Group spacing deviation
  ↓
Diagnostic
  ↓
Component/Layout configuration
  ↓
Recommendation
  ↓
Remeasure
```

---

# 52. Architecture Integration

布局能力不增加新的 Runtime Core Layer。

仍然：

```text
@uiq/core
      ↓
@uiq/geometry
      ↓
@uiq/measurement
      ↓
@uiq/metrics
      ↓
@uiq/rules
      ↓
@uiq/diagnostic
      ↓
@uiq/reporting
```

Browser：

```text
@uiq/browser
```

负责获取真实布局数据。

---

# 53. Package Changes

不新增：

```text
@uiq/layout-engine
```

布局属于现有：

```text
@uiq/metrics
@uiq/rules
```

如果需要领域组织，可以：

```text
packages/metrics/src/layout/
packages/rules/src/layout/
packages/diagnostic/src/layout/
packages/reporting/src/layout/
```

---

# 54. Skill Integration

已有：

```text
uiq-ui-quality
```

增加：

```text
layout
```

Intent：

```text
"检查布局"
"分析页面布局"
"检查间距"
"检查对齐"
"检查响应式布局"
"检查页面是否遵循网格"
"检查组件布局一致性"
```

统一进入：

```bash
uiq analyze --dimension layout --format json
```

---

# 55. Skill Workflow

```text
User
 ↓
"检查这个页面的布局"
 ↓
uiq-ui-quality
 ↓
uiq analyze
   --dimension layout
 ↓
Playwright
 ↓
Measurement
 ↓
Layout Metrics
 ↓
Layout Rules
 ↓
Findings
 ↓
Diagnostics
 ↓
Recommendations
 ↓
Agent Explanation
```

---

# 56. Recommendation Report Example

```text
Layout Assessment

Measurement Coverage
--------------------
Elements: 126
Relationships: 84

Evaluation
----------
PASS: 71
FAIL: 9
WARN: 3
UNKNOWN: 1

Findings
--------
1. Card Group spacing deviation
   Observed: 20px
   Expected: 24px
   Affected: 12 elements

2. Content left alignment deviation
   Observed deviation: 2px
   Affected: 8 elements

3. Mobile layout overflow
   Viewport: 375px
   Affected: 1 region
```

Recommendation：

```text
1. Review Card Group spacing configuration
2. Review Content container alignment
3. Review mobile responsive constraint
```

---

# 57. Verification

修改后不能直接标记：

```text
VERIFIED
```

必须：

```text
Implementation
 ↓
Remeasure
 ↓
Metric
 ↓
Rule
 ↓
Regression
 ↓
Verification
```

例如：

```text
Before:
GAP = 20px
FAIL

After:
GAP = 24px
PASS
```

Regression：

```text
FAIL → PASS
FIXED_FAILURE
```

---

# 58. Definition of Done

Layout V1.0 完成条件：

- [ ] Geometry integration
- [ ] Alignment Metric
- [ ] Grid Alignment Metric
- [ ] Spacing integration
- [ ] Density Metric
- [ ] Symmetry Metric
- [ ] Hierarchy integration
- [ ] Component consistency
- [ ] Responsive analysis
- [ ] Layout Rules
- [ ] Layout Findings
- [ ] Layout Diagnostics
- [ ] Layout Recommendations
- [ ] Layout Inspector
- [ ] Layout Report
- [ ] Layout Golden Tests
- [ ] Browser E2E
- [ ] Regression
- [ ] Skill workflow

---

# 59. Architecture Freeze

本规范不增加：

```text
Layout Quality Engine
Layout AI Engine
Aesthetic Engine
Visual Intelligence Engine
```

布局质量仍然遵循：

```text
MEASUREMENT
    ↓
METRIC
    ↓
RULE
    ↓
EVALUATION
    ↓
FINDING
    ↓
DIAGNOSTIC
    ↓
RECOMMENDATION
```

---

# 60. Final Model

UIQ 的布局质量能力最终定义为：

```text
                 LAYOUT QUALITY
                       │
       ┌───────────────┼────────────────┐
       │               │                │
   GEOMETRY        SPATIAL           HIERARCHY
       │           RELATIONSHIP          │
       │               │                │
       ├──── Alignment ├──── Spacing     │
       ├──── Grid      ├──── Distance    │
       ├──── Size      ├──── Overlap     │
       ├──── Symmetry  └──── Density     │
       │                                │
       └──────────────┬─────────────────┘
                      ↓
                    METRIC
                      ↓
                     RULE
                      ↓
                  EVALUATION
                      ↓
                   FINDING
                      ↓
                  DIAGNOSTIC
                      ↓
                RECOMMENDATION
                      ↓
                  REMEASURE
                      ↓
                  REGRESSION
```

## 结论

UIQ V1.0 现在不仅能够评估：

```text
颜色
字体
可访问性
Design Token
Theme
```

还能够系统化评估：

```text
布局
```

而且布局评估不是一个“布局分数”，而是可以回答：

> **哪里偏离了布局约束？偏离多少？影响哪些元素？与哪个 Token / Component / Container 有关系？为什么发生？修改后如何验证？**

这使 UIQ 从单纯的 **UI 检查工具**进一步成为一个完整的 **UI Design Quality Measurement & Verification System**。