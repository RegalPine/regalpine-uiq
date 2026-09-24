# UIQ-LAYOUT-04
# Layout Constraint Schema & Design System Binding Specification V1.0

**Version:** 1.0.0  
**Status:** Implementation Baseline / Frozen  
**Domain:** Layout Quality / Design System Conformance  
**Package:** `@uiq/tokens` / `@uiq/theme` / `@uiq/rules`  
**Integration:** React / Radix UI / CSS Variables / Browser DOM

---

# 1. 目标

本规范解决四个问题：

1. 如何定义布局约束；
2. 如何将布局约束绑定到 Design Token；
3. 如何将布局约束绑定到 Component Contract；
4. 如何从实际 DOM 追踪到这些约束。

最终形成：

```text
Design System
    │
    ├── Spacing Tokens
    ├── Size Tokens
    ├── Grid Tokens
    ├── Container Tokens
    └── Component Contracts
            │
            ▼
      Layout Constraints
            │
            ▼
       UIQ Rule Engine
            │
            ▼
      Actual Rendered UI
```

---

# 2. 核心原则

布局系统必须区分：

```text
Token Value
    ↓
CSS Value
    ↓
Computed Value
    ↓
Rendered Geometry
    ↓
UIQ Measurement
```

因此：

```text
Token Value ≠ Actual Layout
```

只有实际渲染结果才是 UIQ Layout Measurement 的事实来源。

---

# 3. Layout Conformance Model

定义：

```text
LCS = (T, C, R, E, V)
```

其中：

```text
T = Token Binding
C = Component Contract
R = Layout Rule
E = Rendered Evidence
V = Evaluation
```

形成：

```text
Token / Contract
      ↓
Constraint
      ↓
Rule
      ↓
Rendered Measurement
      ↓
Evaluation
```

---

# 4. Layout Token Categories

V1.0 支持：

```text
SPACING
SIZE
GRID
CONTAINER
RADIUS
BREAKPOINT
```

其中：

```text
RADIUS
```

虽然属于几何属性，但在 V1.0 中仅作为 Layout/Component Conformance 的 Token 属性，不建立独立 Radius Metric。

---

# 5. Spacing Tokens

推荐：

```text
space.1
space.2
space.3
space.4
space.5
space.6
space.8
space.10
```

例如：

```json
{
  "space.1": "4px",
  "space.2": "8px",
  "space.3": "12px",
  "space.4": "16px",
  "space.5": "20px",
  "space.6": "24px",
  "space.8": "32px",
  "space.10": "40px"
}
```

这些是 Design System 的示例值，不是 UIQ 的强制标准。

---

# 6. Spacing Token Semantics

Primitive Token：

```text
space.6 = 24px
```

Semantic Token：

```text
layout.card.gap = {space.6}
```

Component Token：

```text
card.content.gap = {layout.card.gap}
```

最终：

```text
Card
 ↓
card.content.gap
 ↓
layout.card.gap
 ↓
space.6
 ↓
24px
```

---

# 7. Token Graph

必须保持：

```text
Primitive
   ↓
Semantic
   ↓
Component
```

禁止循环：

```text
A → B → A
```

Token Cycle：

```text
ERROR
```

Orphan Token：

```text
ORPHAN
```

但：

```text
ORPHAN ≠ INVALID
```

---

# 8. Layout Token Binding

定义：

```ts
export interface LayoutTokenBinding {
  readonly tokenId: string;
  readonly tokenVersion: string;

  readonly property:
    | "MARGIN"
    | "PADDING"
    | "GAP"
    | "WIDTH"
    | "HEIGHT"
    | "MIN_WIDTH"
    | "MAX_WIDTH"
    | "MIN_HEIGHT"
    | "MAX_HEIGHT"
    | "GRID"
    | "BREAKPOINT"
    | "RADIUS";

  readonly expectedValue: unknown;
}
```

---

# 9. Component Layout Contract

组件 Contract 定义组件的布局要求。

```ts
export interface ComponentLayoutContract {
  readonly componentId: string;
  readonly version: string;

  readonly dimensions?: DimensionContract;
  readonly spacing?: SpacingContract;
  readonly alignment?: AlignmentContract;
  readonly container?: ContainerContract;
  readonly grid?: GridContract;
  readonly responsive?: ResponsiveContract;
}
```

---

# 10. Dimension Contract

```ts
export interface DimensionContract {
  readonly width?: NumericConstraint;
  readonly height?: NumericConstraint;

  readonly minWidth?: NumericConstraint;
  readonly maxWidth?: NumericConstraint;

  readonly minHeight?: NumericConstraint;
  readonly maxHeight?: NumericConstraint;

  readonly aspectRatio?: NumericConstraint;
}
```

例如：

```json
{
  "width": {
    "operator": "EQ",
    "value": 120
  },
  "height": {
    "operator": "EQ",
    "value": 40
  }
}
```

---

# 11. Spacing Contract

```ts
export interface SpacingContract {
  readonly margin?: BoxSpacingConstraint;
  readonly padding?: BoxSpacingConstraint;
  readonly gap?: NumericConstraint;
}
```

Box：

```ts
export interface BoxSpacingConstraint {
  readonly top?: NumericConstraint;
  readonly right?: NumericConstraint;
  readonly bottom?: NumericConstraint;
  readonly left?: NumericConstraint;
}
```

---

# 12. Alignment Contract

```ts
export interface AlignmentContract {
  readonly axis:
    | "LEFT"
    | "RIGHT"
    | "TOP"
    | "BOTTOM"
    | "CENTER_X"
    | "CENTER_Y";

  readonly reference:
    | "PARENT"
    | "CONTAINER"
    | "GROUP"
    | "ELEMENT";

  readonly tolerance: number;
}
```

例如：

```json
{
  "axis": "LEFT",
  "reference": "CONTAINER",
  "tolerance": 1
}
```

---

# 13. Container Contract

```ts
export interface ContainerContract {
  readonly minWidth?: number;
  readonly maxWidth?: number;

  readonly horizontalPadding?: number;

  readonly overflow:
    | "FORBID"
    | "ALLOW"
    | "ALLOW_X"
    | "ALLOW_Y";
}
```

例如：

```json
{
  "maxWidth": 1200,
  "horizontalPadding": 24,
  "overflow": "FORBID"
}
```

---

# 14. Grid Contract

```ts
export interface GridContract {
  readonly gridSize?: number;
  readonly originX?: number;
  readonly originY?: number;

  readonly xTolerance?: number;
  readonly yTolerance?: number;
}
```

例如：

```json
{
  "gridSize": 8,
  "originX": 0,
  "originY": 0,
  "xTolerance": 1,
  "yTolerance": 1
}
```

---

# 15. Responsive Contract

```ts
export interface ResponsiveContract {
  readonly states: readonly ResponsiveStateContract[];
}
```

```ts
export interface ResponsiveStateContract {
  readonly id: string;

  readonly minViewportWidth?: number;
  readonly maxViewportWidth?: number;

  readonly visibility?: "VISIBLE" | "HIDDEN";

  readonly width?: NumericConstraint;
  readonly height?: NumericConstraint;

  readonly overflow?: "FORBID" | "ALLOW";
}
```

---

# 16. Breakpoint

Breakpoint 不应该硬编码到 Metric。

例如 Design System：

```text
mobile
tablet
desktop
wide
```

对应：

```json
{
  "mobile": {
    "maxWidth": 767
  },
  "tablet": {
    "minWidth": 768,
    "maxWidth": 1023
  },
  "desktop": {
    "minWidth": 1024
  }
}
```

这是 Design System Configuration。

---

# 17. Breakpoint 与实际 Viewport

UIQ 使用：

```text
Actual Viewport
        ↓
Breakpoint Resolution
        ↓
Responsive State
        ↓
Responsive Contract
```

例如：

```text
Viewport = 390px
```

解析为：

```text
mobile
```

然后执行 Mobile Contract。

---

# 18. Component Identity

布局 Contract 必须绑定稳定 Component ID。

优先：

```text
Component ID
```

其次：

```text
data-uiq-component
```

例如：

```html
<div
  data-uiq-id="card-001"
  data-uiq-component="Card"
>
```

禁止使用：

```text
DOM array index
```

作为长期身份。

---

# 19. Element Identity

推荐：

```html
<button
  data-uiq-id="checkout-submit"
  data-uiq-component="Button"
>
  Checkout
</button>
```

形成：

```text
Element
 ↓
Component
 ↓
Component Contract
```

---

# 20. CSS Variable Binding

例如：

```css
:root {
  --space-6: 24px;
}

.card {
  gap: var(--space-6);
}
```

UIQ 可以建立：

```text
CSS Variable
 ↓
Token
```

但：

```text
CSS Variable ≠ Token
```

只有通过 Design System Adapter 声明绑定后，才建立 Token 关系。

---

# 21. Computed Value Binding

例如：

```text
Token
  24px
    ↓
CSS Variable
  --space-6
    ↓
CSS
  gap: var(--space-6)
    ↓
Computed Style
  24px
    ↓
Rendered Geometry
```

UIQ 应记录每一层证据。

---

# 22. Layout Trace

完整 Trace：

```text
Element
 ↓
Component
 ↓
Component Token
 ↓
Semantic Token
 ↓
Primitive Token
 ↓
CSS Variable
 ↓
CSS Property
 ↓
Computed Value
 ↓
Rendered Geometry
```

---

# 23. Token Match

例如：

```text
Token = 24px
Computed gap = 24px
```

结果：

```text
TOKEN_MATCH = PASS
```

---

# 24. Token Deviation

例如：

```text
Token = 24px
Computed gap = 20px
```

结果：

```text
TOKEN_DEVIATION
```

但是：

```text
TOKEN_DEVIATION
```

本身不等于：

```text
LAYOUT.FAIL
```

---

# 25. Layout Constraint Evaluation

例如 Component Contract：

```text
Card gap = 24px ± 1px
```

Actual：

```text
20px
```

Evaluation：

```text
Metric:
LAYOUT.SPACING = 20px

Rule:
LAYOUT.SPACING.CONFORMANCE

Expected:
24px ± 1px

Result:
FAIL
```

---

# 26. Token Deviation + Layout Failure

如果：

```text
Token = 24px
Actual = 20px
Contract = 24px ±1px
```

则可能同时产生：

```text
TOKEN_DEVIATION
+
LAYOUT_SPACING
```

并通过 Evidence Graph 建立：

```text
Layout Finding
      ↑
Component Contract
      ↑
Token
      ↑
Actual CSS
```

---

# 27. Token Deviation + Layout Pass

另一种情况：

```text
Token = 24px
Actual = 20px
Contract = 20px ±1px
```

结果：

```text
TOKEN_DEVIATION
LAYOUT_SPACING = PASS
```

这证明：

> Design System Conformance 与 Layout Quality 是两个独立维度。

---

# 28. Theme Binding

Layout Token 可以随 Theme 改变。

例如：

```text
Light
  card.padding = 24px

Dark
  card.padding = 24px
```

或者：

```text
Light
  card.padding = 24px

Compact
  card.padding = 16px
```

每个 Theme 必须独立解析。

---

# 29. Theme Evaluation

禁止：

```text
Light + Dark
      ↓
Combined Result
```

直接判定。

必须：

```text
Light
 ↓
Measurement
 ↓
Metric
 ↓
Rule
 ↓
Evaluation

Dark
 ↓
Measurement
 ↓
Metric
 ↓
Rule
 ↓
Evaluation
```

---

# 30. Theme Comparison

可以输出：

```text
Light:
Spacing PASS 42
Spacing FAIL 3

Dark:
Spacing PASS 40
Spacing FAIL 5
```

但不输出：

```text
Dark is better
```

或：

```text
Light score = 90
Dark score = 85
```

---

# 31. Radix UI Binding

Radix UI 只作为 Adapter。

```text
Radix Component
      ↓
Design System Wrapper
      ↓
Component Contract
      ↓
CSS Variables
      ↓
Rendered DOM
      ↓
@uiq/browser
      ↓
UIQ
```

UIQ Core 不依赖 Radix。

---

# 32. Radix Component Mapping

例如：

```text
Radix Dialog
 ↓
DesignSystem Dialog
 ↓
dialog.content
 ↓
ComponentLayoutContract
```

可以声明：

```json
{
  "componentId": "Dialog",
  "version": "1.0.0",
  "container": {
    "maxWidth": 640,
    "overflow": "FORBID"
  }
}
```

---

# 33. Adapter Contract

沿用：

```ts
export interface UIQDesignSystemAdapter {
  resolveToken(element: Element): TokenBinding[];

  resolveComponent(
    element: Element
  ): ComponentBinding | undefined;

  resolveTheme(
    element: Element
  ): ThemeContext | undefined;
}
```

布局扩展：

```ts
export interface UIQLayoutAdapter
  extends UIQDesignSystemAdapter {

  resolveLayoutContract(
    element: Element
  ): ComponentLayoutContract | undefined;

  resolveLayoutConstraints(
    element: Element
  ): readonly LayoutConstraint[];
}
```

---

# 34. Adapter 的责任

Adapter：

```text
External Design System
        ↓
UIQ Model
```

负责：

```text
Token Mapping
Component Mapping
Theme Mapping
Layout Contract Mapping
```

不负责：

```text
Metric Calculation
Rule Evaluation
Finding Creation
Diagnostic
Recommendation
```

---

# 35. CSS Framework Independence

UIQ 不绑定：

```text
Tailwind
Bootstrap
CSS Modules
Styled Components
Emotion
Radix
Material UI
```

只要能够提供：

```text
Rendered DOM
Computed Style
Design System Binding
```

即可接入。

---

# 36. Layout Schema

建议 Schema：

```text
specs/schema/
├── layout-token.schema.json
├── layout-contract.schema.json
├── layout-constraint.schema.json
├── responsive-contract.schema.json
└── component-layout-contract.schema.json
```

---

# 37. Layout Contract Example

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "id": "Card",
  "version": "1.0.0",

  "spacing": {
    "padding": {
      "top": {
        "operator": "EQ",
        "value": 24
      },
      "right": {
        "operator": "EQ",
        "value": 24
      },
      "bottom": {
        "operator": "EQ",
        "value": 24
      },
      "left": {
        "operator": "EQ",
        "value": 24
      }
    }
  },

  "container": {
    "overflow": "FORBID"
  }
}
```

---

# 38. Token-Based Contract

更推荐：

```json
{
  "spacing": {
    "padding": {
      "top": {
        "token": "space.6"
      },
      "right": {
        "token": "space.6"
      },
      "bottom": {
        "token": "space.6"
      },
      "left": {
        "token": "space.6"
      }
    }
  }
}
```

解析：

```text
space.6
 ↓
24px
 ↓
Constraint
```

---

# 39. Explicit Value vs Token

支持两种：

```text
TOKEN_REFERENCE
EXPLICIT_VALUE
```

优先：

```text
TOKEN_REFERENCE
```

因为它可以提供：

```text
Governance
Traceability
Impact Analysis
Theme Variation
```

---

# 40. Constraint Provenance

每个 Constraint 必须记录：

```ts
export interface ConstraintProvenance {
  readonly sourceType:
    | "TOKEN"
    | "COMPONENT_CONTRACT"
    | "PAGE_SPECIFICATION"
    | "POLICY";

  readonly sourceId: string;
  readonly sourceVersion: string;
}
```

---

# 41. Constraint Fingerprint

建议：

```text
SHA-256(
  canonical(
    constraintId
    + constraintVersion
    + source
    + subject
    + expectation
    + tolerance
  )
)
```

用于：

```text
Reproducibility
Regression
Audit
```

---

# 42. Constraint Conflict Detection

如果两个有效 Constraint：

```text
C1 = gap 24px
C2 = gap 16px
```

同时适用于：

```text
same subject
same property
same context
```

则：

```text
CONSTRAINT_CONFLICT
```

必须生成结构化结果。

---

# 43. Conflict 不应该静默解决

禁止：

```text
C1 wins
```

或：

```text
C2 wins
```

除非 Policy 明确声明优先级。

即使存在优先级，也建议记录：

```text
Overridden Constraint
Override Source
Override Reason
```

---

# 44. Layout Conformance Result

```ts
export interface LayoutConformanceResult {
  readonly subjectId: string;

  readonly metricId: string;
  readonly metricVersion: string;

  readonly ruleId: string;
  readonly ruleVersion: string;

  readonly constraintId: string;
  readonly constraintVersion: string;

  readonly observedValue: unknown;
  readonly expectedValue: unknown;

  readonly state:
    | "PASS"
    | "FAIL"
    | "WARN"
    | "NOT_APPLICABLE"
    | "UNKNOWN"
    | "ERROR";

  readonly provenance: ConstraintProvenance;
}
```

---

# 45. Layout Conformance Report

报告增加：

```text
Design System Layout Conformance
```

内容：

```text
Component
Contract
Token
Observed
Expected
Deviation
Rule
State
```

例如：

```text
Card
--------------------------------
Property: padding
Token: space.6
Expected: 24px
Observed: 20px
Deviation: -4px
Rule: LAYOUT.SPACING.CONFORMANCE
Result: FAIL
```

---

# 46. Layout Impact Trace

如果修改：

```text
space.6
```

可以追踪：

```text
space.6
 ↓
layout.card.gap
 ↓
Card
 ↓
Card instances
 ↓
Affected Elements
 ↓
Affected Pages
 ↓
Affected Themes
```

这是：

```text
Impact Trace
```

不是：

```text
Regression
```

---

# 47. Impact 与 Regression

修改 Token 后：

```text
Impact Trace
```

表示：

> 哪些对象理论上可能受到影响。

实际重新渲染后：

```text
Regression
```

表示：

> 哪些实际结果发生了变化。

二者必须保持独立。

---

# 48. Multi-Theme Impact

例如：

```text
space.6
 ↓
Light Card
Dark Card
Compact Card
```

影响范围可以不同。

因此 Impact Trace 应记录：

```text
themeId
```

---

# 49. Responsive Impact

修改：

```text
container.maxWidth
```

可能影响：

```text
Desktop
Tablet
Mobile
```

因此：

```text
Impact Trace
```

应包含：

```text
affectedSnapshots
affectedBreakpoints
affectedComponents
affectedPages
```

---

# 50. Verification

Layout Contract 修改后：

```text
Change
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
Card gap = 20px
FAIL

After:
Card gap = 24px
PASS
```

最终：

```text
VERIFIED
```

---

# 51. Inspector Layout Trace

Inspector：

```text
Layout
  ├── Geometry
  ├── Alignment
  ├── Spacing
  ├── Grid
  ├── Container
  ├── Responsive
  └── Design System
        ├── Component Contract
        ├── Token
        ├── Constraint
        └── Trace
```

---

# 52. Skill Integration

用户：

> 检查这个页面是否遵循设计系统的布局规范。

Skill：

```text
Intent:
DESIGN_SYSTEM_CONFORMANCE
```

执行：

```bash
uiq conformance --format json
```

然后读取：

```text
Layout Conformance
Token Conformance
Component Conformance
Theme Conformance
```

最后输出：

```text
Fact
→ Evidence
→ Finding
→ Diagnostic
→ Recommendation
→ Verification
```

---

# 53. 推荐报告结构

```text
# Layout Quality Assessment

## 1. Scope

## 2. Measurement Coverage

## 3. Geometry

## 4. Alignment

## 5. Spacing

## 6. Grid

## 7. Container

## 8. Responsive

## 9. Component Consistency

## 10. Design System Conformance

## 11. Findings

## 12. Diagnostics

## 13. Recommendations

## 14. Verification

## 15. Reproducibility
```

---

# 54. V1.0 Acceptance Tests

至少：

```text
LAYOUT-DS-001
Token → Constraint

LAYOUT-DS-002
Component → Constraint

LAYOUT-DS-003
CSS Variable → Token

LAYOUT-DS-004
Token Deviation

LAYOUT-DS-005
Token Deviation + Layout PASS

LAYOUT-DS-006
Token Deviation + Layout FAIL

LAYOUT-DS-007
Theme-specific Constraint

LAYOUT-DS-008
Responsive Constraint

LAYOUT-DS-009
Constraint Conflict

LAYOUT-DS-010
Constraint Provenance

LAYOUT-DS-011
Impact Trace

LAYOUT-DS-012
Regression after Token Change

LAYOUT-DS-013
Radix Component Mapping

LAYOUT-DS-014
Unknown Contract

LAYOUT-DS-015
Missing Token

LAYOUT-DS-016
Full Evidence Trace
```

---

# 55. Architecture Boundary

保持现有 UIQ：

```text
core
 ↓
metrics
 ↓
rules
 ↓
diagnostic
 ↓
reporting
```

Design System：

```text
tokens
 ↓
theme
 ↓
adapter
```

Browser：

```text
browser
```

Integration：

```text
radix
```

不新增：

```text
Layout Engine
Design System Engine
Constraint Engine
Quality Engine
```

---

# 56. 最终架构

```text
                   DESIGN SYSTEM
                         │
            ┌────────────┼────────────┐
            ▼            ▼            ▼
          Token       Component      Theme
            │          Contract        │
            └────────────┬─────────────┘
                         ▼
                  Layout Constraint
                         │
                         ▼
REAL UI ──→ Browser Measurement
                         │
                         ▼
                  Layout Metrics
                         │
                         ▼
                   Layout Rules
                         │
                         ▼
                    Evaluation
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
           Conformance           Quality
              │                     │
              └──────────┬──────────┘
                         ▼
                      Finding
                         │
                      Diagnostic
                         │
                   Recommendation
                         │
                     Verification
```

---

# 57. 最终冻结原则

至此，UIQ Layout Quality 的语义边界正式固定：

```text
Metric
= 实际布局是什么

Constraint
= 设计系统/组件/页面要求是什么

Rule
= 如何比较实际值与要求

Evaluation
= 是否满足

Conformance
= 是否遵循 Design System

Diagnostic
= 为什么出现问题

Recommendation
= 应该检查什么

Impact
= 修改后可能影响什么

Regression
= 修改后实际改变了什么

Verification
= 修改后的结果是否重新证明满足要求
```

因此：

> **UIQ 已经具备从“页面布局测量”走向“设计系统约束下的布局质量评估”的完整技术路径。**

尤其是这一点已经闭合：

```text
Design Token
    ↓
Component Contract
    ↓
Layout Constraint
    ↓
Rendered UI
    ↓
Layout Metric
    ↓
Rule
    ↓
Finding
    ↓
Recommendation
    ↓
Remeasure
    ↓
Regression
    ↓
Verification
```

这条链路可以直接支撑企业级 UI Governance，而无需再引入一个新的“Layout Quality Engine”。