# UIQ-LAYOUT-07
# Layout Quality Runtime Implementation Specification V1.0

**Version:** 1.0.0  
**Status:** Implementation Baseline / Frozen  
**Domain:** Layout Quality Runtime  
**Depends On:** UIQ-LAYOUT-02 / 03 / 04 / 05 / 06  
**Runtime:** TypeScript + pnpm  
**Browser:** Playwright  
**UI:** React + Radix UI Reference Application

---

# 1. 实现目标

本阶段将 Layout Quality 从规范转换为实际运行能力：

```text
Browser DOM
    ↓
@uiq/browser
    ↓
MeasurementSnapshot
    ↓
@uiq/metrics
    ↓
Layout Metrics
    ↓
@uiq/rules
    ↓
Layout Constraints
    ↓
Evaluation
    ↓
Finding
    ↓
@uiq/diagnostic
    ↓
@uiq/reporting
    ↓
Layout Quality Report
```

不新增任何 Core Layer。

---

# 2. 最终实现位置

Layout Runtime 分散在现有模块：

```text
@uiq/measurement
    基础 Measurement

@uiq/geometry
    几何计算

@uiq/metrics
    Layout Metrics

@uiq/rules
    Layout Constraints / Rules

@uiq/browser
    DOM → Layout Measurement

@uiq/diagnostic
    Layout Diagnostic

@uiq/reporting
    Page/Region/Component Layout Report

@uiq/regression
    Layout Regression

@uiq/conformance
    Layout Golden / Contract
```

禁止创建：

```text
@uiq/layout
@uiq/layout-engine
@uiq/layout-quality
```

---

# 3. 模块依赖

最终：

```text
core
  ↑
geometry
  ↑
measurement
  ↑
metrics
  ↑
rules
  ↑
diagnostic
  ↑
reporting
```

Browser：

```text
browser
 ├── core
 ├── measurement
 ├── geometry
 ├── color
 ├── tokens
 └── theme
```

Regression：

```text
regression → core
```

Conformance：

```text
conformance → core
```

---

# 4. Layout Runtime Pipeline

```text
┌───────────────────────┐
│ Browser DOM           │
└──────────┬────────────┘
           ↓
┌───────────────────────┐
│ Layout Measurement    │
└──────────┬────────────┘
           ↓
┌───────────────────────┐
│ Layout Metric Engine  │
└──────────┬────────────┘
           ↓
┌───────────────────────┐
│ Layout Rule Engine    │
└──────────┬────────────┘
           ↓
┌───────────────────────┐
│ Evaluation            │
└──────────┬────────────┘
           ↓
┌───────────────────────┐
│ Finding / Diagnostic  │
└──────────┬────────────┘
           ↓
┌───────────────────────┐
│ Reporting             │
└───────────────────────┘
```

---

# 5. Layout Measurement Contract

扩展现有 Browser Measurement。

```ts
export interface LayoutMeasurement {
  readonly elementId: string;

  readonly componentId?: string;
  readonly regionId?: string;

  readonly rect: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  };

  readonly margin: BoxSpacing;
  readonly padding: BoxSpacing;

  readonly visible: boolean;
}
```

---

# 6. BoxSpacing

```ts
export interface BoxSpacing {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}
```

单位：

```text
px
```

---

# 7. Layout Group

Layout Metrics 不允许猜测元素关系。

因此提供：

```ts
export interface LayoutGroup {
  readonly id: string;

  readonly subjectIds: readonly string[];

  readonly relation:
    | "HORIZONTAL"
    | "VERTICAL"
    | "GRID"
    | "STACK";

  readonly referenceId?: string;
}
```

例如：

```json
{
  "id": "main-card-grid",
  "subjectIds": [
    "card-001",
    "card-002",
    "card-003"
  ],
  "relation": "GRID"
}
```

---

# 8. Layout Metric Input

```ts
export interface LayoutMetricInput {
  readonly subjectId: string;

  readonly elements:
    readonly LayoutElementMeasurement[];

  readonly relationships?:
    readonly LayoutRelationship[];

  readonly groups?:
    readonly LayoutGroup[];

  readonly configuration?:
    LayoutMetricConfiguration;
}
```

---

# 9. Alignment Metric

Metric ID：

```text
LAYOUT.ALIGNMENT@1.0.0
```

输入：

```text
elements
axis
reference
```

算法：

```text
coordinate(element)
    ↓
reference coordinate
    ↓
deviation
```

Group Reference：

```text
median(coordinates)
```

而不是：

```text
mean(coordinates)
```

---

# 10. Alignment Result

```ts
export interface AlignmentMetricResult {
  readonly axis:
    | "LEFT"
    | "RIGHT"
    | "TOP"
    | "BOTTOM"
    | "CENTER_X"
    | "CENTER_Y";

  readonly reference: number;

  readonly deviations:
    readonly number[];

  readonly maxDeviation: number;

  readonly meanAbsoluteDeviation: number;
}
```

Metric Status：

```text
AVAILABLE
UNKNOWN
ERROR
```

---

# 11. Grid Metric

Metric ID：

```text
LAYOUT.GRID_ALIGNMENT@1.0.0
```

计算：

```text
nearest =
origin +
round((coordinate - origin) / gridSize)
× gridSize
```

然后：

```text
deviation =
coordinate - nearest
```

---

# 12. Grid Result

```ts
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

# 13. Grid Validation

必须保证：

```text
gridSize > 0
```

否则：

```text
ERROR
```

坐标无法确定：

```text
UNKNOWN
```

理论约束：

```text
abs(deviation) <= gridSize / 2
```

---

# 14. Spacing Metric

Metric ID：

```text
LAYOUT.SPACING_VARIANCE@1.0.0
```

注意：

这里区分：

```text
SPACING
```

和：

```text
SPACING_VARIANCE
```

实际 Gap / Margin / Padding 的基础值继续复用：

```text
@uiq/metrics
SPACING.GAP
SPACING.MARGIN
SPACING.PADDING
```

布局质量中的：

```text
LAYOUT.SPACING_VARIANCE
```

只描述一组间距的一致性。

---

# 15. Spacing Variance

对于：

```text
g1
g2
...
gn
```

计算：

```text
μ = Σgi / n

variance =
Σ(gi - μ)² / n
```

输出：

```ts
export interface SpacingVarianceResult {
  readonly count: number;

  readonly mean: number;

  readonly variance: number;

  readonly standardDeviation: number;

  readonly values: readonly number[];
}
```

---

# 16. Density Metric

Metric ID：

```text
LAYOUT.DENSITY@1.0.0
```

支持：

```text
RAW_AREA
UNION_AREA
```

默认：

```text
UNION_AREA
```

但必须由 Configuration 明确指定。

---

# 17. Density Result

```ts
export interface DensityResult {
  readonly mode:
    | "RAW_AREA"
    | "UNION_AREA";

  readonly context:
    | "VIEWPORT"
    | "REGION"
    | "CONTAINER";

  readonly occupiedArea: number;

  readonly availableArea: number;

  readonly density: number;
}
```

---

# 18. Union Area

V1.0 要求使用确定性矩形 Union 算法。

对于：

```text
Rect[]
```

计算：

```text
Union(Rect[])
```

不能简单：

```text
Σ area
```

否则重叠元素会重复计算。

---

# 19. Symmetry Metric

Metric ID：

```text
LAYOUT.SYMMETRY@1.0.0
```

V1.0：

```text
HORIZONTAL
VERTICAL
```

不实现：

```text
RADIAL
```

---

# 20. Symmetry Input

必须提供：

```text
axis
pairMapping
```

例如：

```json
{
  "axis": "VERTICAL",
  "pairs": [
    ["left-1", "right-1"],
    ["left-2", "right-2"]
  ]
}
```

如果没有可靠 Pair Mapping：

```text
UNKNOWN
```

---

# 21. Overflow Metric

Metric ID：

```text
LAYOUT.OVERFLOW@1.0.0
```

结果：

```ts
export interface OverflowResult {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;

  readonly maxOverflow: number;
}
```

Overflow 是事实。

不是：

```text
FAIL
```

---

# 22. Responsive Size Delta

Metric：

```text
LAYOUT.RESPONSIVE_SIZE_DELTA@1.0.0
```

输入：

```text
Baseline Snapshot
Current Snapshot
Same Entity ID
```

输出：

```ts
export interface ResponsiveSizeDelta {
  readonly widthDelta: number;
  readonly heightDelta: number;

  readonly widthRelativeDelta?: number;
  readonly heightRelativeDelta?: number;
}
```

---

# 23. Responsive Position Delta

```text
LAYOUT.RESPONSIVE_POSITION_DELTA@1.0.0
```

输出：

```ts
export interface ResponsivePositionDelta {
  readonly deltaX: number;
  readonly deltaY: number;

  readonly distance: number;
}
```

---

# 24. Zero-Division Handling

如果：

```text
baselineWidth = 0
```

则：

```text
relativeDelta = UNKNOWN
```

不能：

```text
Infinity
```

也不能：

```text
0
```

---

# 25. Component Size Variance

Metric：

```text
LAYOUT.COMPONENT_SIZE_VARIANCE@1.0.0
```

按：

```text
componentType
```

聚合。

计算：

```text
σ² = Σ(xᵢ - μ)² / n
```

Width / Height 分开统计。

---

# 26. Layout Metric Registry

注册：

```ts
registerLayoutMetrics(registry);
```

包含：

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

版本：

```text
@1.0.0
```

---

# 27. Rule Registry

注册：

```ts
registerLayoutRules(registry);
```

包含：

```text
LAYOUT.ALIGNMENT.CONFORMANCE
LAYOUT.GRID.CONFORMANCE
LAYOUT.SPACING.CONFORMANCE
LAYOUT.CONTAINER.CONSTRAINT
LAYOUT.OVERFLOW.CONSTRAINT
LAYOUT.DENSITY.RANGE
LAYOUT.SYMMETRY.CONFORMANCE
LAYOUT.COMPONENT.SIZE_CONSISTENCY
LAYOUT.RESPONSIVE.CONSTRAINT
LAYOUT.RESPONSIVE.NO_OVERFLOW
LAYOUT.ORDER.CONFORMANCE
```

---

# 28. Constraint Resolution

执行顺序：

```text
Design System
     ↓
Component Contract
     ↓
Page Specification
     ↓
Project Policy
```

实际优先级以既有：

```text
PROJECT_POLICY
PAGE_SPECIFICATION
COMPONENT_CONTRACT
DESIGN_SYSTEM
DEFAULT_RULE
```

为准。

如果冲突：

```text
CONSTRAINT_CONFLICT
```

---

# 29. Token Resolution

例如：

```text
Card
 ↓
padding
 ↓
card.padding
 ↓
layout.card.padding
 ↓
space.6
 ↓
24px
```

Runtime 必须使用：

```text
@uiq/tokens
```

已有 Token Resolver。

不得在 Layout Runtime 中重新实现 Token Graph。

---

# 30. Component Contract Resolution

Browser：

```text
DOM
 ↓
data-uiq-component
 ↓
Design System Adapter
 ↓
Component Contract
```

例如：

```html
<div
  data-uiq-component="Card"
  data-uiq-id="card-001">
```

---

# 31. Constraint Materialization

Contract：

```json
{
  "gap": {
    "token": "space.6"
  }
}
```

解析：

```text
space.6
 ↓
24px
 ↓
LayoutConstraint
```

形成：

```ts
LayoutConstraint
```

再进入 Rule Engine。

---

# 32. Browser Layout Adapter

增加：

```text
packages/browser/src/layout/
```

结构：

```text
packages/browser/src/layout/
├── measureLayout.ts
├── measureRect.ts
├── measureSpacing.ts
├── measureOverflow.ts
├── measureGroups.ts
├── measureResponsive.ts
└── index.ts
```

---

# 33. measureLayout

```ts
export function measureLayout(
  element: Element,
  context: BrowserMeasurementContext
): Measurement[] {
  // DOM → Measurement
}
```

必须：

```text
Pure relative to supplied browser state
```

不得执行 Rule。

---

# 34. Geometry Source

统一：

```ts
element.getBoundingClientRect()
```

获取：

```text
x
y
width
height
top
right
bottom
left
```

---

# 35. Spacing Source

使用：

```ts
getComputedStyle(element)
```

获取：

```text
margin*
padding*
gap
rowGap
columnGap
```

统一转换：

```text
CSS computed value
→ px
```

---

# 36. Overflow Source

计算：

```text
element rect
vs
container rect
```

例如：

```text
overflowRight =
max(
  0,
  element.right - container.right
)
```

---

# 37. Visibility

必须区分：

```text
DISPLAY_NONE
VISIBILITY_HIDDEN
ZERO_SIZE
OFFSCREEN
CLIPPED
VISIBLE
```

不要简单：

```text
if rect.width === 0
```

就认定：

```text
NOT_RENDERED
```

---

# 38. Layout Snapshot

Browser Adapter 产生：

```text
MeasurementSnapshot
```

其中：

```text
measurements[]
```

至少包括：

```text
GEOMETRY
SPACING
LAYOUT_RELATIONSHIP
ENVIRONMENT
```

---

# 39. Metric Execution

使用已有：

```text
MetricExecutionEngine
```

流程：

```text
Snapshot
 ↓
Metric Registry
 ↓
Dependency Plan
 ↓
Execution
 ↓
MetricResult
```

Layout Metric 不允许自己调用：

```text
Rule Engine
```

---

# 40. Rule Execution

使用：

```text
RuleEvaluationEngine
```

流程：

```text
MetricResult
+
LayoutConstraint
+
RuleConfiguration
 ↓
EvaluationResult
```

---

# 41. Finding Generation

使用已有 Finding Factory。

Layout Rule：

```text
FAIL
```

可以产生：

```text
LAYOUT_ALIGNMENT
LAYOUT_GRID
LAYOUT_SPACING
LAYOUT_CONTAINER
LAYOUT_OVERFLOW
LAYOUT_DENSITY
LAYOUT_SYMMETRY
LAYOUT_COMPONENT_CONSISTENCY
LAYOUT_RESPONSIVE
LAYOUT_ORDER
```

---

# 42. Diagnostic

Diagnostic 从：

```text
Finding
```

建立：

```text
Evidence Graph
```

例如：

```text
Finding
 ↓
Evaluation
 ↓
Layout Metric
 ↓
Measurement
 ↓
DOM
```

如果 Token 存在：

```text
DOM
 ↓
CSS
 ↓
Token
 ↓
Component Contract
 ↓
Constraint
```

---

# 43. Recommendation

Reporting 层调用：

```text
RecommendationEngine
```

例如：

```text
LAYOUT.SPACING.FAIL
+
Token Trace
```

生成：

```text
REC-LAYOUT-001
```

内容：

```text
Review component spacing token binding.
```

---

# 44. 禁止自动修改

Runtime 不得：

```text
修改 DOM
修改 CSS
修改 Token
修改 Component Contract
修改 Theme
提交 Git
创建 PR
```

V1.0：

```text
Analysis Only
```

---

# 45. Page Aggregation

Reporting 调用：

```ts
aggregatePageLayout(...)
```

顺序：

```text
Element
 ↓
Component
 ↓
Region
 ↓
Page
```

---

# 46. Finding Group

调用：

```ts
groupLayoutFindings(...)
```

依据：

```text
Finding Type
Rule
Constraint
Component
Token
Diagnostic Cause
```

生成：

```text
LOCAL
COMPONENT
REGION
PAGE
SYSTEMIC
```

---

# 47. Systemic Detection

系统性问题必须满足：

```text
same rule
+
same constraint/source
+
multiple affected subjects
```

阈值来自：

```text
Reporting Configuration
```

不是硬编码。

---

# 48. Report Generator

```ts
generateLayoutReport({
  page,
  metrics,
  evaluations,
  findings,
  diagnostics,
  conformance,
  regression
});
```

输出：

```text
UIQualityReport
```

不创建新的 Report Core。

---

# 49. JSON Output

CLI：

```bash
uiq analyze \
  --url http://localhost:5173/reference/layout \
  --dimension layout \
  --format json
```

输出包含：

```json
{
  "scope": {},
  "snapshot": {},
  "metrics": [],
  "evaluations": [],
  "findings": [],
  "diagnostics": [],
  "recommendations": [],
  "layout": {},
  "conformance": {},
  "regression": null
}
```

---

# 50. Layout CLI Shortcut

可以提供：

```bash
uiq layout <url>
```

但它必须只是：

```text
CLI Application Alias
```

内部仍然调用：

```text
analyze
```

不能创建独立 Layout Engine。

例如：

```bash
uiq layout https://example.com
```

等价于：

```bash
uiq analyze \
  --url https://example.com \
  --dimension layout
```

---

# 51. Playwright Runtime

Playwright 负责：

```text
Browser
Viewport
Theme
Navigation
Font Ready
Animation Stabilization
DOM Selection
Snapshot Capture
```

UIQ 负责：

```text
Metric
Rule
Finding
Diagnostic
Report
```

---

# 52. Browser Matrix

布局 Golden：

```text
Chromium
Firefox
WebKit
```

执行：

```text
1440 × 900
1024 × 768
768 × 1024
390 × 844
```

具体场景只使用其定义的 viewport。

---

# 53. Reference Application Routes

实现：

```text
/reference/layout
/reference/layout/alignment
/reference/layout/grid
/reference/layout/spacing
/reference/layout/container
/reference/layout/density
/reference/layout/symmetry
/reference/layout/overflow
/reference/layout/responsive
/reference/layout/component
/reference/layout/design-system
/reference/layout/unknown
```

---

# 54. Reference Component

使用：

```text
React
Radix UI
CSS Variables
```

但：

```text
@uiq/core
@uiq/metrics
@uiq/rules
```

不得依赖这些技术。

---

# 55. Test Fixture

例如：

```html
<div
  data-uiq-id="spacing-card-001"
  data-uiq-component="Card"
  class="card">
</div>
```

CSS：

```css
.card {
  padding: var(--space-6);
  gap: var(--space-6);
}
```

---

# 56. Intentional Failure Fixture

```css
.card-fail {
  padding: 20px;
  gap: 20px;
}
```

Contract：

```text
24px ± 1px
```

预期：

```text
FAIL
```

---

# 57. Unknown Fixture

使用：

```css
.layout-unknown {
  display: grid;
  grid-template-columns:
    repeat(auto-fit, minmax(200px, 1fr));
}
```

注意：

这里并不因为使用 Grid/auto-fit 就产生 UNKNOWN。

UNKNOWN 只能来自：

```text
measurement evidence unavailable
```

例如：

```text
unsupported dynamic layout state
```

不能把：

```text
CSS implementation mechanism
```

本身当作质量问题。

---

# 58. Layout Golden Runner

新增：

```text
tests/golden/layout/
```

Runner：

```ts
export async function runLayoutGoldenSuite(): Promise<GoldenReport>;
```

流程：

```text
Load Reference Page
 ↓
Playwright
 ↓
Capture Snapshot
 ↓
Execute Metrics
 ↓
Evaluate Rules
 ↓
Compare Expected
 ↓
Generate Golden Report
```

---

# 59. Golden Assertions

每一个 Golden 至少验证：

```text
Metric ID
Metric Version
Metric Status
Expected Value
Rule ID
Rule Version
Evaluation State
```

如果有 Finding：

```text
Finding Type
Finding Group
```

也必须验证。

---

# 60. Diagnostic Golden

例如：

```text
Card gap
20px

Expected
24px ±1px
```

Expected Diagnostic：

```text
cause = COMPONENT/TOKEN
```

但只有 Evidence Graph 真正支持时才允许固定：

```text
TOKEN
```

---

# 61. Recommendation Golden

Expected：

```text
REC-LAYOUT-001
```

同时：

```text
affectedFindingIds
```

必须稳定。

---

# 62. Full E2E Test

测试：

```text
LAYOUT-E2E-001
```

流程：

```text
Open Reference Page
 ↓
Select Card
 ↓
Capture Measurement
 ↓
Calculate Spacing
 ↓
Evaluate Contract
 ↓
FAIL
 ↓
Finding
 ↓
Diagnostic
 ↓
Recommendation
 ↓
Fix Fixture
 ↓
Remeasure
 ↓
PASS
 ↓
Regression
 ↓
FIXED_FAILURE
 ↓
Verification
```

---

# 63. Architecture Tests

增加：

```text
LAYOUT-ARCH-001
metrics must not import rules

LAYOUT-ARCH-002
metrics must not import browser

LAYOUT-ARCH-003
rules must not import browser

LAYOUT-ARCH-004
reporting must not import browser

LAYOUT-ARCH-005
layout runtime must not import React

LAYOUT-ARCH-006
layout runtime must not import Radix

LAYOUT-ARCH-007
no layout-engine package

LAYOUT-ARCH-008
no quality-engine package
```

---

# 64. Performance Baseline

Reference Page：

```text
500 elements
100 components
10 regions
```

目标：

```text
Browser Measurement
< 100ms
```

不包括：

```text
Browser startup
Navigation
Network
```

Metric calculation：

```text
< 50ms
```

在固定测试环境中。

这些是工程性能目标，不是质量规则。

---

# 65. Large Page Test

构造：

```text
5000 elements
500 components
50 regions
```

测试：

```text
memory
execution time
determinism
```

不得改变：

```text
Evaluation State
```

---

# 66. Cache

Metric Engine 使用已有：

```text
snapshotId
+
subjectId
+
metricId
+
metricVersion
```

作为 Cache Key。

禁止跨 Snapshot 复用 Layout Measurement。

---

# 67. Incremental Analysis

后续可以利用：

```text
Git Diff
+
Impact Trace
```

缩小分析范围。

但 V1.0：

```text
Full Page Analysis
```

仍然是默认模式。

---

# 68. Changed Scope

如果用户只修改：

```text
Card
```

可以分析：

```text
Card instances
+
Affected Regions
+
Affected Pages
```

但 Release Policy 可以要求：

```text
Full Page
```

重新验证。

---

# 69. Configuration

`uiq.config.json`：

```json
{
  "layout": {
    "enabled": true,

    "systemicFindingThreshold": 3,

    "browser": {
      "viewports": [
        {
          "width": 1440,
          "height": 900
        },
        {
          "width": 390,
          "height": 844
        }
      ]
    }
  }
}
```

---

# 70. Layout Policy

例如：

```json
{
  "profile": "enterprise-web-ui",
  "rules": [
    {
      "ruleId": "LAYOUT.GRID.CONFORMANCE",
      "ruleVersion": "1.0.0",
      "configuration": {
        "gridSize": 8,
        "tolerance": 1
      }
    },
    {
      "ruleId": "LAYOUT.RESPONSIVE.NO_OVERFLOW",
      "ruleVersion": "1.0.0",
      "configuration": {
        "maxOverflow": 0
      }
    }
  ]
}
```

---

# 71. Acceptance Criteria

```text
AC-LAYOUT-RUNTIME-01
Layout Measurement 可执行

AC-LAYOUT-RUNTIME-02
Alignment Metric 可执行

AC-LAYOUT-RUNTIME-03
Grid Metric 可执行

AC-LAYOUT-RUNTIME-04
Spacing Metric 可执行

AC-LAYOUT-RUNTIME-05
Density Metric 可执行

AC-LAYOUT-RUNTIME-06
Symmetry Metric 可执行

AC-LAYOUT-RUNTIME-07
Overflow Metric 可执行

AC-LAYOUT-RUNTIME-08
Responsive Metrics 可执行

AC-LAYOUT-RUNTIME-09
Component Consistency 可执行

AC-LAYOUT-RUNTIME-10
Layout Constraints 可解析

AC-LAYOUT-RUNTIME-11
Layout Rules 可执行

AC-LAYOUT-RUNTIME-12
Finding 可生成

AC-LAYOUT-RUNTIME-13
Diagnostic 可追踪

AC-LAYOUT-RUNTIME-14
Recommendation 可生成

AC-LAYOUT-RUNTIME-15
Page Aggregation 可执行

AC-LAYOUT-RUNTIME-16
Golden Dataset 全部通过

AC-LAYOUT-RUNTIME-17
Chromium/Firefox/WebKit 通过

AC-LAYOUT-RUNTIME-18
Responsive Golden 通过

AC-LAYOUT-RUNTIME-19
Regression 可执行

AC-LAYOUT-RUNTIME-20
E2E 闭环通过
```

---

# 72. Implementation Order

具体开发顺序固定为：

```text
L01 Layout Measurement Types
        ↓
L02 Browser Layout Measurement
        ↓
L03 Layout Metrics
        ↓
L04 Layout Metric Registry
        ↓
L05 Layout Constraints
        ↓
L06 Layout Rules
        ↓
L07 Finding / Diagnostic
        ↓
L08 Page Aggregation
        ↓
L09 Recommendation
        ↓
L10 Layout Report
        ↓
L11 Golden Dataset
        ↓
L12 Playwright Conformance
        ↓
L13 Regression
        ↓
L14 Inspector
        ↓
L15 Skill
```

---

# 73. First Development Slice

第一条真正可运行的 Slice：

```text
Reference Card
      ↓
Browser Measurement
      ↓
GAP = 20px
      ↓
LAYOUT.SPACING
      ↓
Contract = 24px ±1px
      ↓
LAYOUT.SPACING.CONFORMANCE
      ↓
FAIL
      ↓
Finding
      ↓
Diagnostic
      ↓
REC-LAYOUT-001
```

然后修改：

```text
20px → 24px
```

重新执行：

```text
Remeasure
 ↓
PASS
 ↓
Regression
 ↓
FIXED_FAILURE
 ↓
Verified
```

---

# 74. V1.0 Implementation Freeze

完成本规范后，不再修改 Layout Quality 的核心模型。

冻结：

```text
Metric
Constraint
Rule
Evaluation
Finding
Diagnostic
Recommendation
Verification
Page Aggregation
Golden
```

以后新增需求只能通过：

```text
Metric Registry
Rule Registry
Constraint Registry
Design System Adapter
Browser Adapter
Report Renderer
```

实现。

---

# 75. 最终工程闭环

```text
                 Design System
                       │
            Token / Component Contract
                       │
                       ▼
                Layout Constraint
                       │
                       ▼
Real Browser ──→ Browser Measurement
                       │
                       ▼
                 Metric Engine
                       │
                       ▼
                  Rule Engine
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
                       │
                       ▼
                 Developer Fix
                       │
                       ▼
                    Remeasure
                       │
                       ▼
                  Regression
                       │
                       ▼
                 Verification
                       │
                       ▼
                Page-Level Report
```

---

# 76. Definition of Done

当以下命令能够执行：

```bash
pnpm test
pnpm test:golden
pnpm test:browser
pnpm test:conformance
pnpm test:regression
pnpm test:e2e
```

并且：

```text
Layout Metrics          ✓
Layout Rules            ✓
Design System Binding   ✓
Browser Measurement    ✓
Finding                 ✓
Diagnostic              ✓
Recommendation          ✓
Page Report             ✓
Golden                  ✓
Responsive              ✓
Regression              ✓
Verification            ✓
```

则：

> **UIQ Layout Quality Runtime V1.0 实现完成。**

---

# 77. 最终架构判断

至此 UIQ Layout 已经从：

```text
“能不能评价布局？”
```

演进为：

```text
真实页面
→ 可测量
→ 可计算
→ 可约束
→ 可评价
→ 可解释
→ 可提出改进建议
→ 可重新验证
→ 可回归
→ 可形成页面级报告
```

同时仍然保持 UIQ 最重要的架构边界：

```text
Playwright ≠ UIQ

Design System ≠ UIQ

Metric ≠ Rule

Rule ≠ Finding

Diagnostic ≠ Recommendation

Impact ≠ Regression

PASS/FAIL ≠ Quality Score

Token Deviation ≠ Layout Failure
```

因此 **Layout Quality V1.0 已经具备直接进入代码实现的条件，不需要继续增加架构层。**