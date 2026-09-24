# UIQ-IMPL-14
# V1.0 Reference Application & End-to-End Acceptance Specification V1.0

**Status:** Frozen  
**Version:** 1.0.0  
**Phase:** Phase 12  
**Previous:** UIQ-IMPL-13 Design System Integration & Theme Validation Specification V1.0

---

# 1. 文档目的

本规范定义 UIQ V1.0 Reference Application，以及最终 End-to-End Acceptance。

目标不是继续扩展 UIQ，而是证明已有规范能够真正闭环运行：

```text
Design System
      ↓
Theme
      ↓
Tokens
      ↓
React Components
      ↓
Rendered UI
      ↓
Browser Measurement
      ↓
Metrics
      ↓
Rules
      ↓
Evaluation
      ↓
Finding
      ↓
Diagnostic
      ↓
Conformance
      ↓
Regression
      ↓
CLI
      ↓
Release Gate
```

---

# 2. Reference Application 定位

Reference Application 是：

> UIQ V1.0 的可执行规范样本。

它不是：

```text
❌ UIQ 产品本身
❌ Design System 产品
❌ Theme Editor
❌ Color Generator
❌ UI Builder
```

而是用于：

- 演示
- Golden Test
- Browser Test
- E2E Test
- Conformance Test
- Regression Test
- API 示例

---

# 3. Reference Application 技术栈

```text
React
TypeScript
Vite
pnpm
Radix UI
CSS Variables
Playwright
Vitest
```

其中：

```text
React / Radix UI
```

只存在于：

```text
apps/reference/
```

或：

```text
integrations/radix/
```

不得进入 UIQ Core。

---

# 4. 工程结构

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
│   ├── conformance/
│   └── regression/
│
├── integrations/
│   └── radix/
│
├── apps/
│   ├── inspector/
│   ├── playground/
│   ├── cli/
│   └── reference/
│
├── specs/
├── tests/
└── examples/
```

---

# 5. Reference Application 页面

V1.0 只需要一个主页面：

```text
/uiq-reference
```

包含：

```text
Header
 ↓
Theme Switcher
 ↓
Buttons
 ↓
Inputs
 ↓
Cards
 ↓
Dialogs
 ↓
Typography
 ↓
Color Samples
 ↓
Spacing Samples
```

---

# 6. 为什么只选择少量组件

V1.0 不追求：

```text
100+ Components
```

而追求：

```text
Component Diversity
+
State Diversity
+
Measurement Diversity
```

因此选择：

```text
Button
Input
Card
Dialog
```

已经足以覆盖：

- Color
- Typography
- Geometry
- Spacing
- State
- Overlay
- Focus
- Theme
- Token
- Component Contract

---

# 7. Reference Design System

Reference Design System 定义：

```text
Primitive Tokens
Semantic Tokens
Component Tokens
Theme
Component Contracts
```

---

# 8. Primitive Color Tokens

示例：

```css
:root {
  --blue-600: #2563eb;
  --blue-700: #1d4ed8;

  --gray-0: #ffffff;
  --gray-50: #f8fafc;
  --gray-100: #f1f5f9;
  --gray-700: #334155;
  --gray-900: #0f172a;
}
```

---

# 9. Semantic Tokens

```css
:root {
  --color-primary: var(--blue-600);
  --color-primary-hover: var(--blue-700);

  --color-background: var(--gray-0);
  --color-surface: var(--gray-50);

  --color-text: var(--gray-900);
  --color-text-muted: var(--gray-700);
}
```

---

# 10. Component Tokens

Button：

```css
:root {
  --button-background: var(--color-primary);
  --button-background-hover: var(--color-primary-hover);
  --button-foreground: #ffffff;

  --button-padding-x: 16px;
  --button-padding-y: 8px;
  --button-radius: 6px;
}
```

---

# 11. Theme

至少实现：

```text
Light
Dark
```

例如：

```css
[data-theme="dark"] {
  --color-background: #0f172a;
  --color-surface: #1e293b;
  --color-text: #f8fafc;
}
```

---

# 12. Theme Variant

Theme Context：

```text
light
dark
```

分别建立 Snapshot：

```text
snapshot-light.json
snapshot-dark.json
```

不能共享 Evaluation。

---

# 13. Button

Button 必须包含：

```text
Default
Hover
Active
Focus
Disabled
```

状态：

```text
DEFAULT
HOVER
ACTIVE
FOCUS
DISABLED
```

---

# 14. Input

Input：

```text
Default
Focus
Disabled
Invalid
```

重点验证：

```text
Border
Text
Placeholder
Focus Indicator
Error State
```

---

# 15. Card

Card：

```text
Background
Border
Padding
Radius
Typography
Spacing
```

用于验证：

```text
Geometry
Spacing
Typography
Token Conformance
```

---

# 16. Dialog

Dialog 用于验证：

```text
Overlay
Surface
Geometry
Contrast
Focus
Component State
```

并验证：

```text
position
bounding box
```

---

# 17. Reference Token Graph

完整关系：

```text
Primitive
   ↓
Semantic
   ↓
Component
   ↓
CSS Variable
   ↓
Rendered UI
```

例如：

```text
blue-600
   ↓
color-primary
   ↓
button-background
   ↓
--button-background
   ↓
Button
```

---

# 18. Token Graph Golden

必须验证：

```text
No Cycle
All References Resolvable
Duplicate ID Rejected
Missing Reference Rejected
Orphan Token Identified
```

注意：

```text
ORPHAN ≠ INVALID
```

---

# 19. Reference Color Pipeline

Reference Theme 中颜色必须可以映射到：

```text
sRGB
 ↓
Linear RGB
 ↓
XYZ D65
 ↓
OKLab
 ↓
OKLCH
```

---

# 20. Color Golden

至少：

```text
Black
White
Blue 600
Blue 700
Gray 700
Gray 900
```

测试：

```text
OKLab
OKLCH
Contrast
ΔL
ΔC
ΔH
Gamut
```

---

# 21. Primary Color

Reference Application 不把 RGB Picker 当作 UIQ 功能。

如果 Design System 有颜色选择器：

```text
Color Design System
```

可以使用：

```text
OKLCH
```

或其他感知空间。

UIQ 只接受最终 Theme 并验证。

---

# 22. Contrast Golden

```text
#000000 / #FFFFFF
≈ 21
```

```text
#2563EB / #FFFFFF
≈ 5.17
```

```text
#777777 / #FFFFFF
≈ 4.48
```

---

# 23. Rule Golden

规则：

```text
ACCESSIBILITY.CONTRAST.WCAG_AA@1.0.0
```

阈值：

```text
4.5
```

测试：

```text
4.49 → FAIL
4.50 → PASS
4.51 → PASS
```

实际数值应以 Metric 计算结果及规定 tolerance 为准。

---

# 24. Typography Golden

至少验证：

```text
font-size
font-weight
line-height
letter-spacing
text-measure
```

例如：

```text
body:
16px / 24px

heading:
32px / 40px
```

---

# 25. Geometry Golden

至少验证：

```text
width
height
area
aspect ratio
center distance
edge distance
overlap
```

---

# 26. Spacing Golden

Button：

```text
padding-x = 16px
padding-y = 8px
```

Card：

```text
padding = 24px
```

验证：

```text
SPACING.PADDING
SPACING.GAP
SPACING.SCALE_CONFORMANCE
```

---

# 27. Browser Measurement

Reference Application 必须通过真实 Browser：

```text
Chromium
Firefox
WebKit
```

执行：

```text
getComputedStyle()
getBoundingClientRect()
```

---

# 28. 不允许模拟 Browser

以下方式不能作为 Browser Conformance：

```text
❌ 手工写入 expected geometry
❌ 从 React props 推断 geometry
❌ 从 CSS source 直接读取 computed result
❌ Mock DOM 代替真实浏览器
```

Mock 只允许用于 Unit Test。

---

# 29. Stable Entity ID

所有主要组件：

```html
<button data-uiq-id="reference.button.primary">
```

Input：

```html
<input data-uiq-id="reference.input.default">
```

Card：

```html
<section data-uiq-id="reference.card.default">
```

Dialog：

```html
<div data-uiq-id="reference.dialog.default">
```

---

# 30. Measurement Snapshot

一次完整分析：

```text
Snapshot
├── Environment
├── Theme
├── Elements
├── Measurements
└── Provenance
```

---

# 31. Metric Execution

例如 Button：

```text
Measurement
      ↓
COLOR.CONTRAST
      ↓
TYPOGRAPHY.FONT_SIZE
      ↓
GEOMETRY.WIDTH
      ↓
GEOMETRY.HEIGHT
```

Metric Engine 只执行 Metric。

---

# 32. Rule Execution

例如：

```text
COLOR.CONTRAST
       ↓
WCAG_AA
```

以及：

```text
FONT_SIZE
       ↓
FONT_SIZE.MINIMUM
```

---

# 33. Finding

例如 Button 对比度不足：

```text
Finding:
ACCESSIBILITY
```

Evidence：

```text
DOM
Measurement
Metric
Rule
```

---

# 34. Diagnostic

Diagnostic：

```text
Finding
 ↓
Metric
 ↓
Measurement
 ↓
DOM
```

解释：

```text
Foreground:
#777777

Background:
#FFFFFF

Contrast:
≈ 4.48

Required:
4.5
```

---

# 35. Diagnostic 不自动修复

UIQ 可以：

```text
Explain
```

不能自动：

```text
Replace #777
```

---

# 36. Token Trace

例如：

```text
Button
 ↓
button-foreground
 ↓
color-text
 ↓
gray-700
```

必须可以追踪。

---

# 37. Theme Trace

例如：

```text
Theme: Dark
 ↓
color-background
 ↓
surface
 ↓
Card
```

必须可以追踪。

---

# 38. Inspector

Reference Application 可以嵌入：

```text
UIQ Inspector
```

点击：

```text
Button
```

显示：

```text
Measurement
Metrics
Rules
Findings
Diagnostics
Tokens
Theme
Trace
```

---

# 39. Inspector 不成为编辑器

禁止：

```text
修改 CSS
修改 Token
修改 Theme
自动修复
```

Reference Inspector 是：

> Evidence Viewer

---

# 40. Conformance Test

Reference Application 必须通过：

```bash
pnpm uiq conformance --level full
```

预期：

```text
CORE        PASS
STANDARD    PASS
BROWSER     PASS
FULL        PASS
```

---

# 41. Baseline

建立：

```text
reference-baseline.json
```

包含：

```text
Snapshot
Metrics
Evaluations
Findings
Theme
Environment
Engine
```

---

# 42. Regression Scenario 1

修改：

```css
--button-background: #777777;
```

如果前景保持：

```text
#FFFFFF
```

Contrast 降低。

Regression：

```text
PASS → FAIL
```

分类：

```text
NEW_FAILURE
```

---

# 43. Regression Scenario 2

恢复：

```css
--button-background: #2563eb;
```

得到：

```text
FAIL → PASS
```

分类：

```text
FIXED_FAILURE
```

---

# 44. Regression Scenario 3

修改颜色但仍满足 Rule：

```text
PASS → PASS
```

如果 Metric 发生变化：

```text
CHANGED_RESULT
```

如果 Metric 没有变化，则：

```text
NO_REGRESSION
```

---

# 45. Regression Scenario 4

使背景变成：

```text
gradient
```

如果 V1.0 无法精确计算：

```text
AVAILABLE → UNKNOWN
```

分类：

```text
NEW_UNKNOWN
```

而不是：

```text
FAIL
```

---

# 46. Environment Regression

改变：

```text
Viewport
Browser
DPR
Zoom
```

必须能够识别：

```text
ENVIRONMENT_MISMATCH
```

---

# 47. CLI E2E

执行：

```bash
pnpm uiq analyze ./apps/reference
```

然后：

```bash
pnpm uiq snapshot ./apps/reference \
  --output current.json
```

再：

```bash
pnpm uiq regression \
  --baseline reference-baseline.json \
  --current current.json
```

---

# 48. Release Gate

完整流程：

```text
pnpm uiq conformance --level full
        ↓
pnpm uiq analyze
        ↓
pnpm uiq regression
        ↓
Policy
        ↓
Release Gate
```

---

# 49. CI E2E

CI：

```text
Install
 ↓
Build
 ↓
Start Reference App
 ↓
Browser
 ↓
Measurement
 ↓
Metric
 ↓
Rule
 ↓
Conformance
 ↓
Regression
 ↓
Policy
```

---

# 50. Git Pull Request

PR 修改：

```text
Component
Token
Theme
CSS
```

触发：

```text
UIQ Analysis
```

产生：

```text
uiq-report.json
uiq-report.html
uiq-regression.json
```

---

# 51. PR Gate

Policy：

```text
NEW_FAILURE + HIGH
→ BLOCK
```

而：

```text
FIXED_FAILURE
→ INFORMATION
```

最终行为由 Policy 决定。

---

# 52. Golden Repository

建议：

```text
tests/
├── golden/
│   ├── color/
│   ├── typography/
│   ├── geometry/
│   ├── rules/
│   ├── token/
│   ├── theme/
│   └── diagnostic/
│
├── browser/
├── regression/
└── e2e/
```

---

# 53. Golden 不自动更新

失败后：

```text
FAIL
 ↓
Review
 ↓
Root Cause
 ↓
Explicit Approval
 ↓
Golden Update
```

不能：

```text
FAIL
 ↓
Auto Update
 ↓
PASS
```

---

# 54. V1.0 Acceptance Matrix

| Domain | Acceptance |
|---|---|
| Core | PASS |
| Color | PASS |
| Typography | PASS |
| Geometry | PASS |
| Spacing | PASS |
| Metrics | PASS |
| Rules | PASS |
| Finding | PASS |
| Diagnostic | PASS |
| Tokens | PASS |
| Theme | PASS |
| Browser | PASS |
| Conformance | PASS |
| Regression | PASS |
| CLI | PASS |
| CI | PASS |

---

# 55. End-to-End Acceptance

必须至少验证：

```text
AC-E2E-01
Theme → UI

AC-E2E-02
UI → Measurement

AC-E2E-03
Measurement → Metric

AC-E2E-04
Metric → Rule

AC-E2E-05
Rule → Evaluation

AC-E2E-06
Evaluation → Finding

AC-E2E-07
Finding → Diagnostic

AC-E2E-08
Token → Trace

AC-E2E-09
Theme → Conformance

AC-E2E-10
Baseline → Regression

AC-E2E-11
Regression → Policy

AC-E2E-12
Policy → Release Gate
```

---

# 56. Architecture Acceptance

必须验证：

```text
AC-ARCH-01
@uiq/core 无浏览器依赖

AC-ARCH-02
@uiq/core 无 React 依赖

AC-ARCH-03
@uiq/core 无 Radix 依赖

AC-ARCH-04
Metric 不执行 Rule

AC-ARCH-05
Rule 不重新计算 Metric

AC-ARCH-06
Finding 不改变 Evaluation

AC-ARCH-07
Diagnostic 不改变 Finding

AC-ARCH-08
Regression 不重新执行 Rule

AC-ARCH-09
UIQ 不自动修改 Design System

AC-ARCH-10
不存在新的 Core Architecture Layer
```

---

# 57. Determinism Acceptance

相同：

```text
Snapshot
Metric Version
Rule Version
Configuration
Engine
```

必须产生：

```text
相同 MetricResult
相同 EvaluationResult
相同 Finding Fingerprint
```

---

# 58. UNKNOWN Acceptance

以下情况：

```text
Unsupported Background
Unavailable Measurement
Insufficient Evidence
```

必须返回：

```text
UNKNOWN
```

不能偷偷转换为：

```text
PASS
```

也不能默认转换为：

```text
FAIL
```

---

# 59. Error Acceptance

以下情况：

```text
Missing Metric
Version Mismatch
Invalid Configuration
Runtime Exception
```

必须明确返回：

```text
ERROR
```

---

# 60. Token Acceptance

必须区分：

```text
TOKEN_MATCH
TOKEN_DEVIATION
ORPHAN_TOKEN
TOKEN_CYCLE
```

其中：

```text
ORPHAN_TOKEN
```

不是自动判定为 Invalid。

---

# 61. Theme Acceptance

必须分别测试：

```text
Light
Dark
```

不能：

```text
Light PASS
 ↓
推断
 ↓
Dark PASS
```

---

# 62. Browser Acceptance

至少：

```text
Chromium
Firefox
WebKit
```

并记录：

```text
Browser Version
Viewport
DPR
Zoom
```

---

# 63. CLI Acceptance

必须支持：

```bash
uiq measure
uiq analyze
uiq evaluate
uiq conformance
uiq regression
uiq snapshot
uiq report
```

---

# 64. CI Acceptance

必须能够：

```text
exit 0
```

表示允许继续。

```text
exit 1
```

表示 Policy Block。

其他错误必须拥有独立 Exit Code。

---

# 65. Reference Application 不承担生产 UI

Reference Application 的目标是：

```text
Specification
 ↓
Executable Example
 ↓
Conformance
```

不是：

```text
Production Design System
```

---

# 66. V1.0 Definition of Done

UIQ V1.0 只有同时满足以下条件才算完成：

```text
1. Core Contracts Frozen
2. Color Mathematics Frozen
3. Metric Engine Runnable
4. Rule Engine Runnable
5. Browser Measurement Runnable
6. Finding/Diagnostic Runnable
7. Token/Theme Conformance Runnable
8. Inspector Runnable
9. Conformance Runnable
10. Regression Runnable
11. CLI Runnable
12. CI Runnable
13. Reference Application Runnable
14. Full E2E Passing
```

---

# 67. 最终工程闭环

```text
                 DESIGN INTENT
                      │
                Color / Tokens
                      │
                    Theme
                      │
                Design System
                      │
                      ▼
                  REAL UI
                      │
                      ▼
                Measurement
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
              ┌───────┴───────┐
              ▼               ▼
           Finding         Regression
              │               │
              ▼               │
         Diagnostic            │
              │               │
              └───────┬───────┘
                      ▼
                 Conformance
                      │
                      ▼
                    Policy
                      │
                      ▼
                Release Gate
```

---

# 68. V1.0 冻结原则

从本规范开始，以下内容视为 V1.0 Frozen：

```text
Core Model
Metric Model
Rule Model
Evaluation Model
Finding Model
Diagnostic Model
Token Model
Theme Model
Browser Measurement Model
Conformance Model
Regression Model
CLI Model
```

后续不得通过增加新层解决问题。

---

# 69. V1.0 Extension Point

V1.0 之后允许扩展：

```text
Metric Registry
Rule Registry
Diagnostic Registry
Token Adapter
Theme Adapter
Component Adapter
Browser Adapter
Conformance Profile
Policy Profile
CLI Adapter
```

不允许扩展：

```text
UIQ Core Layer
```

---

# 70. V1.0 产品边界

UIQ V1.0：

> **Measure the UI. Quantify the UI. Evaluate the UI. Explain the UI. Verify the UI. Regress the UI. Gate the UI.**

中文定义：

> **UIQ 是一套以真实渲染 UI 为测量对象，以可复现 Metric 为量化基础，以显式 Rule 为评价依据，以 Finding/Diagnostic 为问题解释机制，以 Token/Theme Conformance 验证设计系统实现，并通过 Regression 与 Release Gate 保证 UI 工程一致性的 UI 设计量化系统。**

---

# 71. V1.0 不再继续扩张

以下方向明确留到未来独立产品或扩展：

```text
AI Aesthetic Evaluation
AI Design Generation
Automatic Color Recommendation
Eye Tracking
Emotion Prediction
User Behavior Prediction
Design DSL
Visual Editor
Automatic Design Repair
```

这些都不是 UIQ V1.0 的必要条件。

---

# 72. 最终架构结论

UIQ V1.0 已形成一个完整的工程闭环：

```text
DESIGN
   ↓
RENDER
   ↓
MEASURE
   ↓
QUANTIFY
   ↓
EVALUATE
   ↓
EXPLAIN
   ↓
CONFORM
   ↓
REGRESS
   ↓
GATE
```

这标志着 UIQ 从“概念体系”进入：

> **可实现、可测试、可集成、可持续运行的 V1.0 工程规范阶段。**