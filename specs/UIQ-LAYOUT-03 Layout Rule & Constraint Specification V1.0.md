# UIQ-LAYOUT-03
# Layout Rule & Constraint Specification V1.0

**Version:** 1.0.0  
**Status:** Implementation Baseline / Frozen  
**Domain:** Layout Quality  
**Package:** `@uiq/rules`  
**Dependencies:** `@uiq/core`, `@uiq/metrics`, `@uiq/tokens`, `@uiq/theme`

---

# 1. 目标

本规范定义 UIQ 如何判断布局是否符合明确的设计约束。

完整链路：

```text
Layout Measurement
       ↓
Layout Metric
       ↓
Layout Constraint
       ↓
Layout Rule
       ↓
Evaluation
       ↓
Finding
       ↓
Diagnostic
       ↓
Recommendation
```

核心原则：

> **布局 Metric 描述实际状态；Layout Constraint 描述期望状态；Rule 比较二者。**

---

# 2. Layout Constraint Model

定义：

```text
LC = (S, R, O, V, T)
```

其中：

```text
S = Subject
R = Relationship
O = Expected Outcome
V = Validity / Applicability
T = Tolerance
```

例如：

```text
ButtonGroup
  Gap
  Expected = 8px
  Tolerance = 0px
```

---

# 3. Constraint Sources

布局约束可以来自：

```text
DESIGN_SYSTEM
COMPONENT_CONTRACT
PAGE_SPECIFICATION
LAYOUT_CONFIGURATION
ACCESSIBILITY_REQUIREMENT
PROJECT_POLICY
EXPLICIT_RULE
```

来源必须可追溯。

---

# 4. Constraint Priority

多个约束同时存在时：

```text
PROJECT_POLICY
      ↓
PAGE_SPECIFICATION
      ↓
COMPONENT_CONTRACT
      ↓
DESIGN_SYSTEM
      ↓
DEFAULT_RULE
```

这里的优先级仅用于**约束解析**，不是质量评分。

如果发生冲突：

```text
CONSTRAINT_CONFLICT
```

应显式报告，而不是静默覆盖。

---

# 5. Constraint Contract

```ts
export interface LayoutConstraint {
  readonly id: string;
  readonly version: string;

  readonly source:
    | "DESIGN_SYSTEM"
    | "COMPONENT_CONTRACT"
    | "PAGE_SPECIFICATION"
    | "LAYOUT_CONFIGURATION"
    | "ACCESSIBILITY_REQUIREMENT"
    | "PROJECT_POLICY"
    | "EXPLICIT_RULE";

  readonly subjectType:
    | "ELEMENT"
    | "COMPONENT"
    | "REGION"
    | "PAGE"
    | "GROUP";

  readonly relation:
    | LayoutRelation;

  readonly expectation:
    | LayoutExpectation;

  readonly tolerance?: Tolerance;

  readonly applicability?: LayoutApplicability;
}
```

---

# 6. Layout Relation

```ts
export type LayoutRelation =
  | "ALIGNMENT"
  | "GRID_ALIGNMENT"
  | "GAP"
  | "DISTANCE"
  | "SIZE"
  | "CONTAINMENT"
  | "OVERFLOW"
  | "DENSITY"
  | "SYMMETRY"
  | "ORDER"
  | "RESPONSIVE"
  | "CONSISTENCY";
```

---

# 7. Layout Expectation

```ts
export interface LayoutExpectation {
  readonly operator:
    | "EQ"
    | "NE"
    | "GT"
    | "GTE"
    | "LT"
    | "LTE";

  readonly value?: number;

  readonly min?: number;
  readonly max?: number;

  readonly reference?: string;

  readonly configuration?: Readonly<Record<string, unknown>>;
}
```

---

# 8. Rule Registry

V1.0 正式 Rule：

```text
LAYOUT.ALIGNMENT.CONFORMANCE@1.0.0
LAYOUT.GRID.CONFORMANCE@1.0.0
LAYOUT.SPACING.CONFORMANCE@1.0.0
LAYOUT.CONTAINER.CONSTRAINT@1.0.0
LAYOUT.OVERFLOW.CONSTRAINT@1.0.0
LAYOUT.DENSITY.RANGE@1.0.0
LAYOUT.SYMMETRY.CONFORMANCE@1.0.0
LAYOUT.COMPONENT.SIZE_CONSISTENCY@1.0.0
LAYOUT.RESPONSIVE.CONSTRAINT@1.0.0
LAYOUT.RESPONSIVE.NO_OVERFLOW@1.0.0
LAYOUT.ORDER.CONFORMANCE@1.0.0
```

---

# 9. Alignment Rule

## ID

```text
LAYOUT.ALIGNMENT.CONFORMANCE@1.0.0
```

输入：

```text
LAYOUT.ALIGNMENT
```

约束：

```text
maxDeviation <= tolerance
```

例如：

```text
Observed = 2px
Tolerance = 1px
```

结果：

```text
FAIL
```

---

# 10. Alignment Reference

Rule 必须明确：

```text
referenceType
referenceId
axis
```

例如：

```json
{
  "referenceType": "CONTAINER",
  "referenceId": "content-container",
  "axis": "LEFT",
  "tolerance": 1
}
```

禁止 Rule 自己猜测参考对象。

---

# 11. Grid Rule

## ID

```text
LAYOUT.GRID.CONFORMANCE@1.0.0
```

例如：

```text
gridSize = 8
tolerance = 1
```

Metric：

```text
deviation = 1
```

结果：

```text
PASS
```

Metric：

```text
deviation = 2
```

结果：

```text
FAIL
```

---

# 12. Grid Origin

Grid Rule 必须明确：

```text
originX
originY
```

例如：

```json
{
  "originX": 0,
  "originY": 0,
  "gridSize": 8
}
```

不能假定：

```text
origin = 0
```

适用于所有设计。

---

# 13. Spacing Rule

## ID

```text
LAYOUT.SPACING.CONFORMANCE@1.0.0
```

可检查：

```text
GAP
MARGIN
PADDING
DISTANCE
```

例如：

```text
Expected Gap = 24px
Tolerance = 1px
```

实际：

```text
23px → PASS
24px → PASS
25px → PASS
26px → FAIL
```

---

# 14. Spacing Token Rule

如果设计系统提供：

```text
spacing.card.gap = 24px
```

可以建立：

```text
Token
 ↓
Component Contract
 ↓
Spacing Constraint
 ↓
Rule
```

此时应同时记录：

```text
TOKEN_MATCH
```

和：

```text
LAYOUT.SPACING.CONFORMANCE
```

两者不能混为一谈。

---

# 15. Token Deviation 与 Layout Failure

例如：

```text
Token = 24px
Actual = 20px
```

可能产生：

```text
TOKEN_DEVIATION
```

但只有当存在：

```text
LAYOUT.SPACING.CONFORMANCE
```

且规则失败时：

```text
LAYOUT_SPACING Finding
```

才成立。

因此：

```text
TOKEN_DEVIATION ≠ LAYOUT_FAILURE
```

---

# 16. Container Constraint Rule

## ID

```text
LAYOUT.CONTAINER.CONSTRAINT@1.0.0
```

支持：

```text
MIN_WIDTH
MAX_WIDTH
MIN_HEIGHT
MAX_HEIGHT
ASPECT_RATIO
```

例如：

```json
{
  "maxWidth": 1200,
  "minWidth": 320
}
```

---

# 17. Container Containment

子元素必须满足：

```text
left >= parent.left
right <= parent.right
top >= parent.top
bottom <= parent.bottom
```

如果允许溢出：

```text
overflowPolicy = ALLOW
```

则不产生失败。

---

# 18. Overflow Rule

## ID

```text
LAYOUT.OVERFLOW.CONSTRAINT@1.0.0
```

默认：

```text
maxOverflow = 0
```

但是必须明确：

```text
overflowPolicy
```

支持：

```text
FORBID
ALLOW
ALLOW_AXIS
```

例如：

```json
{
  "overflowPolicy": "ALLOW_AXIS",
  "axis": "X"
}
```

可用于横向 Carousel。

---

# 19. No Overflow Rule

## ID

```text
LAYOUT.RESPONSIVE.NO_OVERFLOW@1.0.0
```

用于：

```text
viewport
page
responsive region
```

例如：

```text
Viewport width = 375px
Content right = 382px
Overflow = 7px
```

结果：

```text
FAIL
```

---

# 20. Density Rule

## ID

```text
LAYOUT.DENSITY.RANGE@1.0.0
```

例如：

```json
{
  "min": 0.10,
  "max": 0.70
}
```

注意：

这只是项目配置示例。

UIQ 不定义：

```text
0.70 = universally good
```

不同页面类型可以拥有不同 Policy Profile。

---

# 21. Density Context

Rule 必须指定：

```text
VIEWPORT
REGION
CONTAINER
```

例如：

```text
Dashboard
Density Policy = 0.15–0.75

Reading Page
Density Policy = 0.05–0.45
```

UIQ 不把两个上下文直接比较。

---

# 22. Symmetry Rule

## ID

```text
LAYOUT.SYMMETRY.CONFORMANCE@1.0.0
```

例如：

```text
maximum symmetry deviation <= 2px
```

如果：

```text
deviation = 1.5px
```

则：

```text
PASS
```

如果：

```text
deviation = 3px
```

则：

```text
FAIL
```

---

# 23. Symmetry Applicability

只有明确要求对称时：

```text
Symmetry Rule
```

才适用。

例如：

```text
Marketing Hero
symmetry = REQUIRED
```

而：

```text
Dashboard
symmetry = NOT_REQUIRED
```

第二种：

```text
NOT_APPLICABLE
```

而不是：

```text
PASS
```

---

# 24. Component Size Consistency Rule

## ID

```text
LAYOUT.COMPONENT.SIZE_CONSISTENCY@1.0.0
```

例如：

```text
Button:
width = 96px
height = 40px
```

实例：

```text
96×40
96×40
104×40
```

如果：

```text
maxDeviation = 8px
tolerance = 2px
```

则：

```text
FAIL
```

---

# 25. Component Contract

推荐 Component Contract：

```ts
export interface ComponentLayoutContract {
  readonly componentId: string;
  readonly version: string;

  readonly width?: NumericConstraint;
  readonly height?: NumericConstraint;

  readonly padding?: SpacingConstraint;
  readonly gap?: SpacingConstraint;

  readonly alignment?: AlignmentConstraint;

  readonly grid?: GridConstraint;
}
```

---

# 26. Responsive Rule

## ID

```text
LAYOUT.RESPONSIVE.CONSTRAINT@1.0.0
```

输入：

```text
Snapshot A
Snapshot B
...
Snapshot N
```

可以约束：

```text
SIZE
POSITION
VISIBILITY
ORDER
OVERFLOW
CONTAINMENT
```

---

# 27. Responsive State

例如：

```text
MOBILE
TABLET
DESKTOP
```

但 State 本身必须由：

```text
Breakpoint Configuration
```

定义。

UIQ 不自动猜：

```text
375 = mobile
768 = tablet
```

---

# 28. Responsive Visibility

例如：

```text
Sidebar
Desktop = VISIBLE
Mobile = HIDDEN
```

如果 Mobile：

```text
VISIBLE
```

可以：

```text
FAIL
```

前提是存在明确的 Responsive Constraint。

---

# 29. Responsive Width Constraint

例如：

```text
Card width <= Container width
```

每个 Snapshot：

```text
Card width = 420
Container width = 390
```

则：

```text
FAIL
```

---

# 30. Responsive Overflow

多个 Snapshot：

```text
375
768
1440
```

分别执行：

```text
NO_OVERFLOW
```

结果必须独立记录：

```text
375 → FAIL
768 → PASS
1440 → PASS
```

不能合并成：

```text
Responsive = FAIL
```

而丢失 viewport 证据。

---

# 31. Responsive Aggregate

可以额外提供：

```text
Responsive Summary
```

例如：

```text
PASS = 2
FAIL = 1
UNKNOWN = 0
```

但原始 Snapshot Evaluation 必须保留。

---

# 32. Order Rule

## ID

```text
LAYOUT.ORDER.CONFORMANCE@1.0.0
```

用于：

```text
A before B
A after B
ascending order
semantic order
```

例如：

```text
Label
Input
Hint
Error
```

可以定义：

```text
Label < Input < Hint < Error
```

这里的 `<` 是布局顺序，不是 DOM 数值比较。

---

# 33. Visual Order vs DOM Order

必须区分：

```text
DOM Order
Visual Order
Semantic Order
```

例如 CSS：

```text
order
grid-area
position
```

可能导致：

```text
DOM Order != Visual Order
```

UIQ 不自动认定这就是错误。

只有存在：

```text
ORDER.CONFORMANCE
```

才进行评价。

---

# 34. Flex Layout Constraints

V1.0 不直接把 Flexbox 所有 CSS 属性变成 Metric。

支持通过实际 Geometry 验证：

```text
alignment
gap
distribution
overflow
size
```

例如：

```text
display:flex
gap:24px
align-items:center
```

最终验证的是：

```text
实际渲染结果
```

而不是：

```text
CSS 写法是否漂亮
```

---

# 35. Grid Layout Constraints

同样：

```text
CSS Grid
```

不是 UIQ 的质量对象。

UIQ 测量：

```text
实际 Grid Geometry
```

例如：

```text
column alignment
row alignment
gap
track consistency
overflow
```

---

# 36. CSS Implementation vs Layout Result

这是 UIQ 的重要边界：

```text
CSS
 ↓
Browser Layout Engine
 ↓
Rendered Geometry
 ↓
UIQ
```

UIQ 不评价：

```text
margin vs gap
flex vs grid
px vs rem
```

除非：

```text
Design System Conformance
```

明确规定实现方式。

---

# 37. Constraint Conflict

例如：

```text
Design System:
Gap = 24px

Component Contract:
Gap = 16px
```

两个约束同时适用。

UIQ 不自动选择：

```text
24
```

或：

```text
16
```

而输出：

```text
CONSTRAINT_CONFLICT
```

建议：

```text
ERROR
```

或者项目 Policy 指定冲突处理方式。

---

# 38. Constraint Applicability

支持：

```text
APPLICABLE
NOT_APPLICABLE
UNKNOWN
```

例如：

```text
Symmetry Rule
```

没有对称要求：

```text
NOT_APPLICABLE
```

无法判断页面结构：

```text
UNKNOWN
```

---

# 39. Rule Evaluation

统一沿用：

```text
MetricResult
 ↓
Applicability
 ↓
Constraint
 ↓
Operator
 ↓
Tolerance
 ↓
EvaluationResult
```

---

# 40. Tolerance

布局 Rule 支持：

```text
ABSOLUTE
RELATIVE
```

例如：

```text
Alignment tolerance = 1px
```

或者：

```text
Width tolerance = 2%
```

Tolerance 不是隐藏质量标准。

必须出现在：

```text
Rule Configuration
```

中。

---

# 41. Tolerance and Numeric Stability

必须区分：

```text
Numeric Stability
```

与：

```text
Policy Tolerance
```

例如：

```text
24.0000000001
```

由于浮点误差，可以使用计算稳定性。

但：

```text
24 → 26
```

不能因为“容差”被自动视为正确。

---

# 42. Severity

推荐初始 Severity：

```text
Alignment = MEDIUM
Grid = LOW
Spacing = MEDIUM
Overflow = HIGH
Responsive Overflow = HIGH
Component Consistency = MEDIUM
Density = LOW
Symmetry = LOW
Order = HIGH
```

但这些是**默认 Rule 配置**，不是 UIQ 的普遍质量结论。

项目可以配置。

---

# 43. Finding Mapping

```text
Rule
 ↓
Evaluation
 ↓
Finding Type
```

映射：

```text
ALIGNMENT
→ LAYOUT_ALIGNMENT

GRID
→ LAYOUT_GRID

SPACING
→ LAYOUT_SPACING

CONTAINER
→ LAYOUT_CONTAINER

OVERFLOW
→ LAYOUT_OVERFLOW

DENSITY
→ LAYOUT_DENSITY

SYMMETRY
→ LAYOUT_SYMMETRY

COMPONENT
→ LAYOUT_COMPONENT_CONSISTENCY

RESPONSIVE
→ LAYOUT_RESPONSIVE

ORDER
→ LAYOUT_ORDER
```

---

# 44. Diagnostic Mapping

Finding：

```text
LAYOUT_SPACING
```

Diagnostic 可以分析：

```text
TOKEN
COMPONENT
CONTAINER
CSS
LAYOUT_CONFIGURATION
UNKNOWN
```

例如：

```text
Actual = 20px
Token = 24px
Component Contract = 24px
```

可能得到：

```text
TOKEN_DEVIATION
COMPONENT_DEVIATION
```

最终 Root Cause Candidate 必须有 Evidence。

---

# 45. Recommendation Mapping

规则：

```text
REC-LAYOUT-001
```

触发：

```text
LAYOUT_SPACING
```

建议：

> 检查该组件的 Gap 配置以及对应 Spacing Token。

---

```text
REC-LAYOUT-002
```

触发：

```text
LAYOUT_ALIGNMENT
```

建议：

> 检查元素所在 Container 的对齐约束和布局参考线。

---

```text
REC-LAYOUT-003
```

触发：

```text
LAYOUT_RESPONSIVE
```

建议：

> 检查该 viewport 下的响应式约束，并重新验证其他 viewport。

---

# 46. Recommendation 不修改代码

V1.0：

```text
Finding
 ↓
Recommendation
```

不：

```text
Recommendation
 ↓
Automatic CSS Modification
```

也不：

```text
Recommendation
 ↓
Token Modification
```

---

# 47. Verification

每个 Layout Recommendation 应包含：

```text
Metric
Rule
Expected State
```

例如：

```text
Verification:

Metric:
LAYOUT.GRID_ALIGNMENT@1.0.0

Rule:
LAYOUT.GRID.CONFORMANCE@1.0.0

Expected:
PASS
```

---

# 48. Verification Workflow

```text
Implement
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

---

# 49. Release Gate

布局 Rule 可以进入 Release Gate：

```text
LAYOUT.OVERFLOW
LAYOUT.RESPONSIVE.NO_OVERFLOW
LAYOUT.ORDER
```

例如 Policy：

```text
HIGH FAIL
→ BLOCK
```

而：

```text
LOW FAIL
→ WARN
```

最终：

```text
Evaluation
≠
Release Gate
```

---

# 50. Policy Profile

例如：

```json
{
  "id": "enterprise-web-ui",
  "version": "1.0.0",
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

# 51. Rule Configuration Separation

Rule Definition：

```text
是什么规则
```

Rule Configuration：

```text
这个项目怎么使用规则
```

例如：

```text
Rule:
LAYOUT.SPACING.CONFORMANCE
```

配置：

```text
Gap = 8px
```

另一个项目：

```text
Gap = 12px
```

仍然可以使用同一个 Rule。

---

# 52. Design System Profile

Design System 可以提供：

```text
Grid
Spacing
Container
Component
Responsive
```

例如：

```text
Grid = 8
Spacing = 4/8/12/16/24/32
Container Max = 1200
Button Height = 40
Card Padding = 24
```

这些进入 Constraint，而不是 Metric。

---

# 53. Layout Constraint Graph

可以形成：

```text
Page
 ↓
Region
 ↓
Container
 ↓
Component
 ↓
Element
```

约束沿层级传播：

```text
Page Constraint
 ↓
Region Constraint
 ↓
Container Constraint
 ↓
Component Contract
 ↓
Element Constraint
```

---

# 54. Constraint Trace

每次失败必须能追踪：

```text
Finding
 ↓
Rule
 ↓
Constraint
 ↓
Constraint Source
 ↓
Design System / Component Contract
```

例如：

```text
Finding:
Card Gap FAIL

Rule:
LAYOUT.SPACING.CONFORMANCE@1.0.0

Constraint:
24px

Source:
ComponentContract/Card@2.1.0

Actual:
20px
```

---

# 55. Layout Quality Report

报告中增加：

```text
## Layout Constraints

### Alignment
PASS / FAIL / UNKNOWN

### Grid
PASS / FAIL / UNKNOWN

### Spacing
PASS / FAIL / UNKNOWN

### Container
PASS / FAIL / UNKNOWN

### Responsive
PASS / FAIL / UNKNOWN

### Component Consistency
PASS / FAIL / UNKNOWN
```

同时展示：

```text
Constraint Source
Rule Version
Metric Version
Observed Value
Expected Value
Deviation
```

---

# 56. Inspector

Inspector Layout 面板：

```text
Layout
 ├── Geometry
 ├── Alignment
 ├── Grid
 ├── Spacing
 ├── Container
 ├── Responsive
 ├── Hierarchy
 └── Constraints
```

Constraints：

```text
┌──────────────────────────────┐
│ Card Gap                     │
│                              │
│ Expected: 24px               │
│ Actual:   20px               │
│ Deviation: -4px              │
│ Tolerance: ±1px              │
│                              │
│ Rule: SPACING.CONFORMANCE    │
│ Result: FAIL                 │
└──────────────────────────────┘
```

---

# 57. Layout Quality Categories

最终分类：

```text
FACT
 └── Measurement / Metric

CONSTRAINT
 └── Design System / Contract / Policy

EVALUATION
 └── PASS / FAIL / WARN / UNKNOWN

PROBLEM
 └── Finding

EXPLANATION
 └── Diagnostic

ACTION
 └── Recommendation

VERIFICATION
 └── Remeasure / Regression
```

这个分类非常重要。

---

# 58. V1.0 Non-Goals

不做：

```text
自动判断最佳布局
AI 视觉审美评分
自动重新排列组件
自动选择 Grid/Flex
自动生成页面
自动修改 CSS
自动修改 Design Token
自动推断设计师意图
```

---

# 59. Architecture Freeze

不增加：

```text
Layout Engine
Constraint Engine
Quality Engine
Visual Intelligence Engine
```

Constraint 只是：

```text
@uiq/rules
```

中的 Rule Configuration / Policy 数据。

---

# 60. 最终闭环

```text
                    DESIGN SYSTEM
                          │
                    COMPONENT CONTRACT
                          │
                     PAGE POLICY
                          │
                          ▼
                    CONSTRAINT
                          │
                          ▼
REAL UI → MEASUREMENT → METRIC
                          │
                          ▼
                         RULE
                          │
                          ▼
                     EVALUATION
                          │
                 ┌────────┴────────┐
                 ▼                 ▼
              PASS              FAIL
                                   │
                                   ▼
                                FINDING
                                   │
                                   ▼
                               DIAGNOSTIC
                                   │
                                   ▼
                             RECOMMENDATION
                                   │
                                   ▼
                              IMPLEMENT
                                   │
                                   ▼
                               REMEASURE
                                   │
                                   ▼
                              REGRESSION
                                   │
                                   ▼
                              VERIFIED
```

---

# 61. 最终冻结结论

UIQ Layout Quality 至此形成完整的三层语义：

### 第一层：事实

```text
Geometry
Alignment
Spacing
Grid
Density
Overflow
Symmetry
Responsive Delta
Component Variance
```

### 第二层：约束

```text
Design System
Component Contract
Page Specification
Project Policy
Accessibility Requirement
```

### 第三层：判断

```text
PASS
FAIL
WARN
NOT_APPLICABLE
UNKNOWN
ERROR
```

然后进入：

```text
Finding
→ Diagnostic
→ Recommendation
→ Verification
```

因此 UIQ 现在已经能够对布局进行**工程化质量评估**，而不是停留在“测量页面尺寸”的层面。

尤其重要的是：

> **UIQ 不需要知道“最佳布局是什么”。它只需要知道实际布局是什么，以及项目明确规定的布局约束是什么。**

这使 Layout Quality 可以真正进入 CI/CD、Design System Conformance、AI Coding Agent 和企业 UI Governance，而不会引入不可验证的“审美判断”。