
# UIQ-REF-01
# Reference Architecture & Runtime Specification
## V1.0

**Status:** Stable  
**Specification ID:** UIQ-REF-01  
**Version:** 1.0  
**Parent Specifications:**

- UIQ-FM-01 — Formal Measurement & Metric Model
- UIQ-MR-01 — Metric Registry
- UIQ-ER-01 — Evaluation Rule & Decision
- UIQ-DX-01 — Diagnostic & Finding Explanation
- UIQ-TK-01 — Design Token & Theme Conformance

---

# 1. Purpose

UIQ 前五个规范已经定义了：

```text
Measurement
Metric
Rule
Evaluation
Finding
Diagnostic
Token
Theme
```

本规范解决剩余的工程问题：

> 如何把这些模型实现成一个真正可运行的 UI 评价引擎？

目标不是设计一个大型后端平台，而是建立一个：

> **Browser-first、TypeScript-first、可嵌入、可离线运行的 UI Quantification Runtime。**

---

# 2. Core Architectural Decision

UIQ V1.0 的核心 Runtime：

```text
TypeScript
+
Browser APIs
+
Pure Calculation
```

即可成立。

不要求：

```text
Java Backend
Database
Microservices
Cloud
LLM
```

---

# 3. Why Browser-first

UIQ 的核心输入最终来自：

```text
Rendered UI
DOM
CSS
Computed Style
Bounding Box
Text
Color
Interaction State
Design Token
Theme
```

这些信息天然存在于浏览器环境。

因此：

```text
Browser
   ↓
DOM Adapter
   ↓
UIQ Runtime
```

比：

```text
Browser
   ↓
Backend
   ↓
Screenshot
   ↓
Backend Analysis
```

更适合作为 V1.0 主路径。

---

# 4. Architecture Overview

```text
┌──────────────────────────────────────────────┐
│                 UIQ Application              │
├──────────────────────────────────────────────┤
│              Presentation / CLI               │
├──────────────────────────────────────────────┤
│              UIQ Runtime API                 │
├──────────────────────────────────────────────┤
│                                              │
│  ┌────────────┐  ┌────────────┐              │
│  │Measurement │→ │   Metric   │              │
│  │   Engine   │  │   Engine   │              │
│  └────────────┘  └─────┬──────┘              │
│                         ↓                    │
│                  ┌────────────┐              │
│                  │Rule Engine │              │
│                  └─────┬──────┘              │
│                        ↓                     │
│                  ┌────────────┐              │
│                  │ Evaluation │              │
│                  └─────┬──────┘              │
│                        ↓                     │
│                  ┌────────────┐              │
│                  │ Diagnostic │              │
│                  └────────────┘              │
│                                              │
├──────────────────────────────────────────────┤
│           Token / Theme Engine               │
├──────────────────────────────────────────────┤
│           Domain Model / Registry             │
├──────────────────────────────────────────────┤
│        Pure Color / Geometry Math             │
└──────────────────────────────────────────────┘
```

---

# 5. Runtime Layers

UIQ Runtime 分为：

```text
L1 Domain Model
L2 Calculation
L3 Measurement
L4 Metric
L5 Evaluation
L6 Diagnostic
L7 Token / Theme
L8 Adapter
L9 Application
```

---

# 6. L1 — Domain Model

负责：

```text
Measurement
MetricResult
Rule
Evaluation
Finding
Diagnostic
Token
Theme
```

该层：

- 不依赖浏览器
- 不依赖 React
- 不依赖 Radix UI
- 不依赖 DOM
- 不依赖网络

---

# 7. L2 — Calculation Engine

负责纯数学计算：

```text
Color
Geometry
Typography
Spacing
```

例如：

```text
sRGB
XYZ
OKLab
OKLCH
ΔE
Contrast
Distance
```

核心原则：

> Calculation Engine 必须是 Pure Function。

例如：

```ts
contrast(foreground, background)
```

不允许读取：

```text
DOM
window
document
```

---

# 8. L3 — Measurement Engine

Measurement Engine 负责：

> 从实际 UI 环境获得事实。

输入：

```text
DOM
CSS
Theme
Component Metadata
```

输出：

```text
MeasurementSnapshot
```

---

# 9. Measurement Adapter

浏览器实现：

```text
DOM
 ↓
BrowserMeasurementAdapter
 ↓
MeasurementSnapshot
```

未来可以支持：

```text
Figma
Sketch
Static HTML
React
Vue
Web Components
```

但这些都是 Adapter。

---

# 10. L4 — Metric Engine

Metric Engine：

```text
MeasurementSnapshot
        ↓
Metric Registry
        ↓
Metric Calculation
        ↓
MetricResult
```

例如：

```ts
const result =
  metricEngine.calculate(
    "COLOR.CONTRAST",
    measurementSnapshot
  );
```

---

# 11. L5 — Evaluation Engine

输入：

```text
MetricResult
RuleSet
Context
```

输出：

```text
EvaluationResult
```

```ts
evaluate(
  metric,
  rule,
  context
)
```

必须是确定性的。

---

# 12. L6 — Diagnostic Engine

输入：

```text
Evaluation
Evidence
DependencyGraph
```

输出：

```text
Diagnostic
```

核心能力：

```text
Factor Identification
Impact Analysis
Root Cause
Explanation
Remediation Hint
```

---

# 13. L7 — Token / Theme Engine

负责：

```text
Token Loading
Reference Resolution
Theme Resolution
Dependency Graph
Impact Analysis
Conformance
```

例如：

```text
button.primary.background
        ↓
color.primary
        ↓
color.blue.500
        ↓
#3B82F6
```

---

# 14. L8 — Adapter Layer

Adapter 将外部系统连接到 UIQ。

包括：

```text
Browser Adapter
CSS Adapter
React Adapter
Vue Adapter
Radix Adapter
Design Token Adapter
Theme Adapter
Figma Adapter
```

注意：

> UIQ Core 不依赖这些系统。

---

# 15. L9 — Application Layer

可以提供：

```text
UI
CLI
DevTools
CI
IDE
```

但这些不是 UIQ 核心。

---

# 16. Recommended Package Structure

建议使用 pnpm Monorepo：

```text
uiq/
├── packages/
│   ├── core/
│   ├── color/
│   ├── geometry/
│   ├── measurement/
│   ├── metrics/
│   ├── rules/
│   ├── diagnostic/
│   ├── tokens/
│   ├── theme/
│   ├── browser/
│   ├── adapters/
│   └── conformance/
│
├── apps/
│   ├── inspector/
│   ├── playground/
│   └── cli/
│
├── specs/
└── tests/
```

---

# 17. Package Responsibilities

## `@uiq/core`

定义：

```text
Domain Types
IDs
Context
Result
Errors
Version
```

---

## `@uiq/color`

负责：

```text
sRGB
XYZ
OKLab
OKLCH
Color Difference
Contrast
Gamut
```

---

## `@uiq/geometry`

负责：

```text
Rect
Distance
Area
Overlap
Alignment
```

---

## `@uiq/measurement`

负责：

```text
MeasurementSnapshot
MeasurementEngine
Measurement Provider
```

---

## `@uiq/metrics`

负责：

```text
Metric Registry
Metric Engine
Metric Calculation
```

---

## `@uiq/rules`

负责：

```text
Rule
RuleSet
Rule Registry
Evaluation Engine
```

---

## `@uiq/diagnostic`

负责：

```text
Finding
Diagnostic
Root Cause
Impact
Explanation
```

---

## `@uiq/tokens`

负责：

```text
Token
Token Graph
Resolution
Conformance
```

---

## `@uiq/theme`

负责：

```text
Theme
Theme Context
Theme Resolution
Theme Validation
```

---

## `@uiq/browser`

负责：

```text
DOM
CSSOM
Computed Style
Viewport
Interaction State
```

---

## `@uiq/conformance`

负责：

```text
TCK
Specification Tests
Reference Cases
```

---

# 18. Dependency Graph

必须保持：

```text
@uiq/core
   ↑
   ├── color
   ├── geometry
   ├── measurement
   ├── metrics
   ├── rules
   ├── diagnostic
   ├── tokens
   └── theme

browser
   ↓
measurement

application
   ↓
all required packages
```

---

# 19. Dependency Restrictions

禁止：

```text
core → browser
core → React
core → Vue
core → Radix
color → browser
color → React
metrics → React
rules → DOM
```

核心计算必须保持平台无关。

---

# 20. Color Engine Architecture

```text
ColorInput
    ↓
Normalization
    ↓
Color Space Conversion
    ↓
Perceptual Representation
    ↓
Metric Calculation
```

推荐：

```text
sRGB
 ↓
XYZ
 ↓
OKLab
 ↓
OKLCH
```

---

# 21. Color Selection vs Evaluation

UIQ 必须区分：

```text
Color Selection
```

和：

```text
Color Evaluation
```

色彩设计工具可以使用：

```text
OKLCH
```

进行交互式选择。

UIQ 则负责：

```text
Measure
Calculate
Evaluate
```

因此：

> UIQ 不规定唯一的拾色器 UI。

---

# 22. Geometry Engine

输入：

```ts
interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}
```

计算：

```text
Area
Aspect Ratio
Center
Distance
Overlap
Edge Distance
Alignment
```

---

# 23. Measurement Model

```ts
interface Measurement {
  id: string;
  subjectId: string;
  type: MeasurementType;
  value: unknown;
  unit?: string;
  source: MeasurementSource;
  timestamp: string;
}
```

---

# 24. MeasurementSnapshot

```ts
interface MeasurementSnapshot {
  id: string;

  projectId?: string;

  context: EvaluationContext;

  measurements: Measurement[];

  capturedAt: string;
}
```

Snapshot 是 UIQ 的：

> 评价输入快照。

---

# 25. Metric Model

```ts
interface MetricDefinition {
  id: string;
  version: string;

  domain: string;

  inputTypes: string[];

  outputType: string;

  calculate(context: MetricContext): MetricResult;
}
```

---

# 26. Metric Registry

```ts
interface MetricRegistry {
  register(metric: MetricDefinition): void;

  get(
    id: string,
    version: string
  ): MetricDefinition;

  list(): MetricDefinition[];
}
```

---

# 27. Rule Engine

```ts
interface RuleDefinition {
  id: string;
  version: string;

  metric: MetricReference;

  applicability: Applicability;

  evaluate(
    metric: MetricResult,
    context: EvaluationContext
  ): EvaluationResult;
}
```

---

# 28. Operator Engine

建议把 Operator 独立：

```text
OperatorEngine
```

支持：

```text
EQ
NEQ
GT
GTE
LT
LTE
BETWEEN
OUTSIDE
IN
NOT_IN
IS_TRUE
IS_FALSE
```

这样 Rule Engine 不需要重复实现比较逻辑。

---

# 29. Evaluation Engine

```ts
interface EvaluationEngine {
  evaluate(
    input: EvaluationInput
  ): EvaluationResult[];
}
```

执行：

```text
Applicability
 ↓
Metric Resolution
 ↓
Operator
 ↓
Threshold
 ↓
Tolerance
 ↓
State
```

---

# 30. Diagnostic Engine

```ts
interface DiagnosticEngine {
  diagnose(
    finding: Finding,
    context: DiagnosticContext
  ): Diagnostic;
}
```

必须能够：

```text
resolveEvidence()
identifyFactors()
analyzeImpact()
resolveRootCause()
generateExplanation()
```

---

# 31. Token Engine

```ts
interface TokenEngine {
  load(tokens: Token[]): void;

  resolve(tokenId: string): ResolvedToken;

  dependencies(tokenId: string): TokenDependency[];

  dependents(tokenId: string): Token[];

  validate(): TokenValidationResult;
}
```

---

# 32. Theme Engine

```ts
interface ThemeEngine {
  load(theme: Theme): void;

  resolve(
    tokenId: string,
    context: ThemeContext
  ): ResolvedToken;

  validate(
    context: ThemeContext
  ): ThemeValidationResult;
}
```

---

# 33. Unified Runtime

建议：

```ts
interface UIQRuntime {
  measurement: MeasurementEngine;

  metrics: MetricEngine;

  rules: EvaluationEngine;

  diagnostics: DiagnosticEngine;

  tokens: TokenEngine;

  themes: ThemeEngine;
}
```

---

# 34. Main Evaluation API

```ts
const result = await uiq.evaluate({
  target: page,
  ruleSet: "UIQ-DESIGN-SYSTEM-01",
  theme: "light"
});
```

结果：

```ts
interface EvaluationReport {
  snapshot: MeasurementSnapshot;

  metrics: MetricResult[];

  evaluations: EvaluationResult[];

  findings: Finding[];

  diagnostics: Diagnostic[];

  decision: Decision;
}
```

---

# 35. Browser Evaluation

最基本的调用：

```ts
const report =
  await uiq.browser.evaluate(
    document.body,
    {
      ruleSet: "UIQ-DESIGN-SYSTEM-01"
    }
  );
```

---

# 36. DOM Measurement

Browser Adapter 获取：

```text
getBoundingClientRect()
getComputedStyle()
element.textContent
element.attributes
document.documentElement
window.getComputedStyle()
```

用于建立 Measurement。

---

# 37. CSS Measurement

CSS Adapter 可以提取：

```text
color
background-color
font-size
font-weight
line-height
letter-spacing
margin
padding
gap
border-radius
opacity
```

---

# 38. CSS Token Detection

UIQ 可以识别：

```css
color: var(--color-text-primary);
```

并建立：

```text
Element
 ↓
CSS Variable
 ↓
Semantic Token
 ↓
Primitive Token
```

---

# 39. Token Detection Limitation

如果 UI 使用：

```css
color: #777;
```

UIQ 可以测量：

```text
Actual Color = #777
```

但无法凭空证明：

```text
Token = color.text.secondary
```

因此：

```text
Token Match = UNKNOWN
```

除非存在 Token Mapping。

---

# 40. Rendered Value vs Declared Value

UIQ 必须区分：

```text
Declared Value
```

与：

```text
Rendered Value
```

例如：

```css
color: var(--text-color);
```

Declared：

```text
var(--text-color)
```

Resolved：

```text
#171717
```

Rendered：

```text
实际计算后的颜色
```

---

# 41. Measurement Priority

当多个来源存在：

```text
Design Token
CSS
Computed Style
Rendered Geometry
```

建议：

```text
Rendered / Computed
        ↓
实际评价
```

而：

```text
Token
```

用于：

```text
Conformance
Trace
Governance
```

原因：

> UIQ 最终评价的是实际 UI，而不是设计意图。

---

# 42. Runtime Modes

UIQ V1.0 支持：

```text
ANALYSIS
VALIDATION
CONFORMANCE
REGRESSION
```

---

# 43. ANALYSIS

用于：

> 查看当前 UI 的量化事实。

输出：

```text
Measurement
Metric
```

---

# 44. VALIDATION

用于：

> 判断是否满足 Rule。

输出：

```text
Evaluation
Finding
```

---

# 45. CONFORMANCE

用于：

> 检查 Token / Theme / Component 是否符合 Design System。

输出：

```text
Conformance Findings
```

---

# 46. REGRESSION

用于：

> 比较修改前后评价结果。

输出：

```text
New Findings
Resolved Findings
Unchanged Findings
Regressed Findings
```

---

# 47. Regression Model

```ts
interface RegressionReport {
  baseline: EvaluationReport;

  current: EvaluationReport;

  resolved: Finding[];

  introduced: Finding[];

  regressed: Finding[];

  unchanged: Finding[];
}
```

---

# 48. Performance Principle

UIQ 不应对所有 DOM 节点进行无限计算。

应采用：

```text
Discovery
 ↓
Target Selection
 ↓
Measurement
 ↓
Metric Selection
 ↓
Evaluation
```

而不是：

```text
Every Node
 ×
Every Metric
 ×
Every Rule
```

---

# 49. Target Selection

可以按：

```text
PAGE
REGION
COMPONENT
ELEMENT
```

选择目标。

例如：

```ts
uiq.evaluate({
  scope: {
    type: "COMPONENT",
    selector: "[data-uiq-component='Button']"
  }
});
```

---

# 50. Incremental Evaluation

当一个元素变化：

```text
Element
 ↓
Affected Measurements
 ↓
Affected Metrics
 ↓
Affected Rules
 ↓
Affected Findings
```

只重新计算受影响部分。

---

# 51. Dependency-based Re-Evaluation

例如：

```text
color.primary
 ↓
button.primary.background
 ↓
Button
 ↓
Dashboard
```

修改：

```text
color.primary
```

不必重新计算整个项目。

---

# 52. Cache

允许缓存：

```text
Measurement
Metric
Token Resolution
Rule Evaluation
```

但缓存 Key 必须包含版本与 Context。

例如：

```text
metricId
+
metricVersion
+
targetId
+
snapshotId
```

---

# 53. Deterministic Cache

相同：

```text
Snapshot
Metric Version
Rule Version
Context
```

必须得到相同结果。

---

# 54. Persistence

UIQ Core 不要求数据库。

持久化可以通过：

```text
JSON
IndexedDB
File
Git
External API
```

实现。

---

# 55. Recommended V1 Storage

本地开发：

```text
JSON
```

浏览器：

```text
IndexedDB
```

CI：

```text
Artifact
```

企业平台：

```text
External API / Database
```

这些都是 Application/Integration 层能力。

---

# 56. CI Integration

UIQ 可以运行：

```bash
uiq validate ./dist
```

输出：

```text
UIQ Validation

PASS  184
WARN   12
FAIL    3

Decision: FAIL
```

---

# 57. CI Exit Code

建议：

```text
0 = PASS
1 = FAIL
2 = CONFIGURATION_ERROR
3 = RUNTIME_ERROR
```

---

# 58. Browser DevTools

未来可以提供：

```text
UIQ Inspector
```

用户点击元素：

```text
Button
```

显示：

```text
Measurements
Metrics
Rules
Findings
Diagnostics
Token Trace
```

例如：

```text
Button.primary

Color
  background: #3B82F6
  foreground: #FFFFFF

Contrast
  5.72

Token
  button.primary.background
      ↓
  color.primary
      ↓
  color.blue.500

Accessibility
  PASS
```

---

# 59. UIQ Playground

建议独立：

```text
apps/playground
```

用于：

```text
Theme Preview
Color Analysis
Rule Testing
Metric Testing
Diagnostic Testing
```

---

# 60. UIQ Inspector

建议独立：

```text
apps/inspector
```

功能：

```text
DOM Selection
Measurement View
Metric View
Rule View
Finding View
Token Trace
Theme Context
```

---

# 61. CLI

CLI 用于：

```text
CI/CD
Static HTML
Theme Validation
Token Validation
Regression
```

例如：

```bash
uiq token validate
uiq theme validate
uiq evaluate
uiq regression
```

---

# 62. No Backend Requirement

V1.0：

```text
Browser
      ↓
UIQ Runtime
```

即可运行。

Backend 只在需要：

```text
Central Governance
History
Multi-user
Organization
Audit
Policy Distribution
```

时引入。

---

# 63. Enterprise Architecture

如果未来需要企业平台：

```text
                   UIQ Runtime
                        │
          ┌─────────────┼─────────────┐
          ↓             ↓             ↓
       Browser         CLI           CI
          │             │             │
          └─────────────┼─────────────┘
                        ↓
                  UIQ Governance
                        │
          ┌─────────────┼─────────────┐
          ↓             ↓             ↓
       Rule Repo     History       Reports
```

但这些不属于 UIQ Core。

---

# 64. Security Boundary

UIQ Runtime 默认：

```text
Read-only
```

它可以读取：

```text
DOM
CSS
Tokens
Theme
```

但不能默认：

```text
修改 DOM
修改 Theme
修改 Token
上传数据
访问外部网络
```

---

# 65. Privacy

UIQ 本地运行时可以：

```text
No Network
No Server
No User Data Upload
```

特别适合企业内部设计系统。

---

# 66. Extension Model

第三方扩展：

```ts
interface UIQPlugin {
  id: string;
  version: string;

  register(runtime: UIQRuntime): void;
}
```

可以注册：

```text
Metric
Rule
Measurement Adapter
Diagnostic Provider
Theme Adapter
Exporter
```

---

# 67. Plugin Boundary

插件不得修改核心语义：

```text
Measurement
Metric
Rule
Evaluation
```

只能：

```text
Register
Extend
Adapt
```

不能：

```text
Override Core Semantics
```

---

# 68. Conformance Testing

`@uiq/conformance` 应包含：

```text
Core Tests
Color Tests
Metric Tests
Rule Tests
Token Tests
Theme Tests
Diagnostic Tests
Browser Tests
```

---

# 69. Golden Cases

必须建立固定测试案例。

例如：

```text
COLOR-CONTRAST-CASE-001
COLOR-DELTAE-CASE-001
SPACING-TOKEN-CASE-001
THEME-DARK-CASE-001
BUTTON-CONFORMANCE-CASE-001
```

每个案例包含：

```text
Input
Expected Measurement
Expected Metric
Expected Evaluation
Expected Finding
```

---

# 70. Numerical Precision

UIQ 必须统一数值精度策略。

例如：

```text
Internal Calculation:
high precision

Presentation:
configured precision
```

禁止：

```text
round first
then calculate
```

应该：

```text
calculate
 ↓
round for presentation
```

---

# 71. Floating Point

对于颜色与几何：

```text
epsilon
```

必须明确。

例如：

```ts
nearlyEqual(a, b, epsilon)
```

不能直接依赖：

```ts
a === b
```

进行所有浮点比较。

---

# 72. Unit Normalization

UIQ 内部应规范：

```text
px
ratio
degree
percentage
normalized [0,1]
```

Metric 必须声明 Unit。

---

# 73. Error Model

定义：

```text
INVALID_INPUT
UNSUPPORTED_METRIC
INVALID_RULE
MISSING_MEASUREMENT
INVALID_UNIT
REFERENCE_ERROR
CYCLE_DETECTED
CALCULATION_ERROR
ADAPTER_ERROR
```

---

# 74. Runtime Error vs Evaluation Failure

必须区分：

```text
Evaluation FAIL
```

和：

```text
Runtime ERROR
```

例如：

```text
Contrast = 3.2
```

属于：

```text
FAIL
```

而：

```text
Background color unavailable
```

属于：

```text
UNKNOWN
```

如果：

```text
Metric implementation crashes
```

属于：

```text
ERROR
```

---

# 75. Observability

Runtime 可以提供：

```text
Evaluation Trace
Metric Trace
Rule Trace
Diagnostic Trace
```

例如：

```text
E-001
 ↓
Metric: COLOR.CONTRAST@1.0
 ↓
Rule: COLOR-CONTRAST-001@1.0
 ↓
Operator: GTE
 ↓
Actual: 3.2
 ↓
Expected: 4.5
 ↓
FAIL
```

---

# 76. Performance Targets

V1.0 不规定绝对性能基准，但实现应遵循：

```text
Pure calculations → synchronous
DOM measurement → batched
Large pages → incremental
Repeated metrics → cached
Repeated rules → cached
```

---

# 77. Architectural Invariants

## REF-INV-001

Core 不依赖 DOM。

## REF-INV-002

Color Engine 不依赖 UI Framework。

## REF-INV-003

Metric 不包含 Rule。

## REF-INV-004

Rule 不修改 Measurement。

## REF-INV-005

Diagnostic 不修改 Evaluation。

## REF-INV-006

Token Engine 不依赖 React/Vue。

## REF-INV-007

Theme Engine 不依赖具体 CSS Framework。

## REF-INV-008

Browser Adapter 不进入 Domain Layer。

---

# 78. Recommended Technology Stack

```text
Language:
TypeScript

Package Manager:
pnpm

Build:
tsup / Vite

Testing:
Vitest

Browser Testing:
Playwright

Lint:
ESLint

Formatting:
Prettier

Schema:
JSON Schema

Documentation:
Markdown
```

V1.0 不要求 React。

---

# 79. UI Framework Integration

如果使用 React：

```text
React
 ↓
Rendered DOM
 ↓
UIQ Browser Adapter
```

如果使用 Vue：

```text
Vue
 ↓
Rendered DOM
 ↓
UIQ Browser Adapter
```

如果使用 Radix UI：

```text
Radix UI
 ↓
Rendered DOM
 ↓
UIQ Browser Adapter
```

因此 UIQ 不需要分别实现：

```text
React Measurement Engine
Vue Measurement Engine
Radix Measurement Engine
```

---

# 80. Why Radix UI Is an Adapter Concern

Radix UI 提供：

```text
Component Behavior
Accessibility Primitives
Interaction
DOM
```

UIQ 提供：

```text
Measurement
Quantification
Evaluation
Conformance
Diagnostic
```

二者职责不同。

因此：

```text
Radix UI
     │
     ↓
   DOM
     │
     ↓
   UIQ
```

是更稳定的架构。

---

# 81. V1.0 MVP

真正开发 MVP 只需要：

```text
@uiq/core
@uiq/color
@uiq/geometry
@uiq/measurement
@uiq/metrics
@uiq/rules
@uiq/tokens
@uiq/browser
@uiq/conformance
```

暂时可以不开发：

```text
diagnostic UI
CLI
Figma Adapter
Enterprise Backend
AI Assistant
```

---

# 82. MVP Capability

第一版可以完成：

```text
DOM Discovery
 ↓
Color Measurement
 ↓
Geometry Measurement
 ↓
Typography Measurement
 ↓
Spacing Measurement
 ↓
Color Metrics
 ↓
Basic Rules
 ↓
Findings
 ↓
Token Trace
 ↓
Theme Validation
```

---

# 83. First Vertical Slice

最建议首先完成：

```text
Button
```

完整链路：

```text
Button
 ↓
DOM Measurement
 ↓
Foreground / Background
 ↓
Contrast
 ↓
Target Size
 ↓
Token Resolution
 ↓
Rules
 ↓
Evaluation
 ↓
Finding
```

如果这一条链跑通：

> UIQ 核心架构就已经被实际验证。

---

# 84. Second Vertical Slice

然后：

```text
Theme
```

完整链路：

```text
Theme
 ↓
Token Graph
 ↓
Semantic Mapping
 ↓
Component Mapping
 ↓
Rendered UI
 ↓
Measurement
 ↓
Evaluation
 ↓
Theme Validation
```

---

# 85. Third Vertical Slice

最后：

```text
Color System
```

链路：

```text
OKLCH Palette
 ↓
Primitive Colors
 ↓
Semantic Colors
 ↓
Component States
 ↓
Theme
 ↓
UI
 ↓
UIQ
 ↓
Contrast / ΔL / ΔC / ΔE
 ↓
Validation
```

这会直接连接你前面设计的**色度学 UI 配色系统**。

---

# 86. Final Runtime Model

UIQ Runtime 最终可以压缩成：

```text
                 UIQ Runtime
                      │
       ┌──────────────┼──────────────┐
       ↓              ↓              ↓
   Measurement     Tokens          Theme
       │              │              │
       └──────────────┼──────────────┘
                      ↓
                    Metrics
                      ↓
                     Rules
                      ↓
                  Evaluation
                      ↓
                   Findings
                      ↓
                  Diagnostics
                      ↓
                 Re-Evaluation
```

---

# 87. Architecture Convergence

UIQ 到这一阶段已经不需要继续增加新的核心抽象。

核心层正式收敛为：

```text
1. Domain
2. Calculation
3. Measurement
4. Metric
5. Evaluation
6. Diagnostic
7. Token/Theme
8. Adapter
9. Application
```

后续新增能力原则：

> **优先作为 Registry、Rule、Metric 或 Adapter 增加，而不是增加新的核心抽象层。**

---

# 88. Specification Set

当前正式规范：

```text
UIQ-FM-01
Formal Measurement & Metric Model

UIQ-MR-01
Metric Registry

UIQ-ER-01
Evaluation Rule & Decision

UIQ-DX-01
Diagnostic & Finding Explanation

UIQ-TK-01
Design Token & Theme Conformance

UIQ-REF-01
Reference Architecture & Runtime
```

---

# 89. Final Architecture Principle

UIQ V1.0 的核心不是一个：

```text
UI Scoring System
```

而是一个：

```text
UI Measurement
+
Quantification
+
Rule Evaluation
+
Design-System Conformance
+
Diagnostic
```

最终形成：

```text
                     UI Design
                         │
                         ↓
                  ┌─────────────┐
                  │ Measurement │
                  └──────┬──────┘
                         ↓
                  ┌─────────────┐
                  │    Metric   │
                  └──────┬──────┘
                         ↓
                  ┌─────────────┐
                  │     Rule    │
                  └──────┬──────┘
                         ↓
                  ┌─────────────┐
                  │  Evaluation │
                  └──────┬──────┘
                         ↓
                  ┌─────────────┐
                  │   Finding   │
                  └──────┬──────┘
                         ↓
                  ┌─────────────┐
                  │ Diagnostic  │
                  └──────┬──────┘
                         ↓
                  ┌─────────────┐
                  │  Correction │
                  └──────┬──────┘
                         ↓
                    Re-Evaluate
```

**至此，UIQ 的核心架构进入实现阶段，而不是继续无限增加规范。**