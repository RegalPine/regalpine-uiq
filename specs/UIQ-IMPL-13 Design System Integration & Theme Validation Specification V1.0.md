# UIQ-IMPL-13
# Design System Integration & Theme Validation Specification V1.0

**Status:** Frozen  
**Version:** 1.0.0  
**Phase:** Phase 11  
**Previous:** UIQ-IMPL-12 CLI & CI/CD Integration Specification V1.0

---

# 1. 文档目的

本规范定义 UIQ 与 Design System、Token、Theme、感知色彩系统以及前端组件框架之间的集成边界。

核心目标：

```text
Design Intent
     ↓
Color / Token / Theme System
     ↓
Design System
     ↓
Rendered UI
     ↓
UIQ Measurement
     ↓
UIQ Metrics
     ↓
UIQ Rules
     ↓
UIQ Conformance
```

UIQ 不负责产生设计。

UIQ 负责验证设计系统最终是否被正确实现。

---

# 2. 两个系统必须分离

整体架构：

```text
┌───────────────────────────────┐
│ Color / Design System         │
│                               │
│ Color Space                   │
│ Palette                       │
│ Semantic Mapping              │
│ Component Tokens              │
│ Theme                         │
│ Theme Export                  │
└───────────────┬───────────────┘
                │
                ▼
        ┌───────────────┐
        │   Real UI     │
        └───────┬───────┘
                │
                ▼
┌───────────────────────────────┐
│ UIQ                           │
│                               │
│ Measurement                   │
│ Metric                        │
│ Rule                          │
│ Evaluation                    │
│ Finding                       │
│ Diagnostic                    │
│ Conformance                   │
│ Regression                    │
└───────────────────────────────┘
```

---

# 3. Design System 的职责

Design System 负责：

- Color Space
- Palette
- Semantic Color
- Design Token
- Component Token
- Theme
- Component States
- Theme Export

例如：

```text
OKLCH
 ↓
Palette
 ↓
Primary
Secondary
Neutral
Success
Warning
Danger
 ↓
Semantic Tokens
 ↓
Button Tokens
 ↓
Theme
```

---

# 4. UIQ 的职责

UIQ 负责：

```text
Actual Rendered UI
 ↓
Measurement
 ↓
Metric
 ↓
Rule
 ↓
Evaluation
```

并进一步：

```text
Evaluation
 ↓
Finding
 ↓
Diagnostic
```

---

# 5. 不允许的职责反转

UIQ 不应该执行：

```text
❌ 选择品牌色
❌ 生成 Palette
❌ 自动调整 OKLCH
❌ 自动替换颜色
❌ 自动设计 Theme
❌ 自动生成 Component
```

即使未来提供 Recommendation，也必须保持：

```text
Recommendation ≠ Evaluation
```

---

# 6. Design System → UIQ

Design System 可以向 UIQ 提供：

```text
Token
Theme
Component Contract
Color Metadata
Semantic Relationships
```

UIQ 对其进行：

```text
Conformance Validation
```

---

# 7. UIQ → Design System

UIQ 可以返回：

```text
Metric Results
Evaluation Results
Findings
Diagnostics
Regression Results
```

Design System 可以使用这些结果进行人工修改。

形成：

```text
Design System
      ↓
      UI
      ↓
     UIQ
      ↓
Validation Feedback
      ↓
Design System
```

这是一种反馈闭环，而不是职责合并。

---

# 8. Integration Contract

定义：

```ts
export interface DesignSystemSource {
  tokens: DesignToken[];
  themes: Theme[];
  components?: ComponentContract[];
}
```

---

# 9. DesignToken

UIQ 使用既有 Token 模型。

核心：

```ts
export interface DesignToken {
  id: string;
  name: string;
  type: string;
  value?: unknown;
  reference?: string;
  metadata?: Record<string, unknown>;
}
```

Token 的具体设计语义由 Design System 定义。

---

# 10. Token Value 与 Rendered Value

必须区分：

```text
Token Value
     ↓
CSS Value
     ↓
Computed Value
     ↓
Rendered Value
```

例如：

```text
--color-primary
        ↓
#2563EB
        ↓
rgb(...)
        ↓
Actual rendered color
```

UIQ 最终以：

```text
Computed / Rendered State
```

作为 UI 测量依据。

---

# 11. Token Conformance

Token Conformance 回答：

> UI 是否使用了规定的 Token？

例如：

```text
Button background
      ↓
--color-primary
```

结果：

```text
TOKEN_MATCH
```

---

# 12. Token Deviation

例如：

```text
Expected:
--color-primary = #2563EB

Actual:
#245FDB
```

可以产生：

```text
TOKEN_DEVIATION
```

但：

```text
TOKEN_DEVIATION ≠ ACCESSIBILITY_FAILURE
```

---

# 13. 双轨验证

因此 UIQ 同时验证：

```text
轨道 A：Design System Conformance

Token
 ↓
Component Contract
 ↓
Theme
 ↓
UI

轨道 B：Rendered UI Quality

UI
 ↓
Measurement
 ↓
Metric
 ↓
Rule
```

二者不能合并。

---

# 14. Theme 模型

Theme：

```ts
export interface Theme {
  id: string;
  version: string;
  name: string;
  tokens: string[];
  metadata?: Record<string, unknown>;
}
```

---

# 15. Theme Variant

例如：

```text
Theme
├── Light
├── Dark
├── High Contrast
└── Custom
```

每个 Variant 必须独立验证。

---

# 16. Theme Validation

验证：

```text
Theme
 ↓
Token Resolution
 ↓
Component Contract
 ↓
Rendered UI
 ↓
UIQ
```

不能因为：

```text
Light = PASS
```

就推断：

```text
Dark = PASS
```

---

# 17. Theme Context

Theme Context：

```ts
export interface ThemeContext {
  themeId: string;
  variantId: string;
  resolvedTokens: Record<string, unknown>;
}
```

---

# 18. Theme Resolution

解析：

```text
Primitive Token
 ↓
Semantic Token
 ↓
Component Token
 ↓
CSS Variable
 ↓
Computed Style
```

UIQ 可以追踪：

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

# 19. Theme → UIQ Trace

例如：

```text
Button
 ↓
button.background
 ↓
color.primary
 ↓
palette.blue.600
 ↓
OKLCH
```

然后：

```text
Button
 ↓
background-color
 ↓
COLOR.OKLAB
 ↓
COLOR.CONTRAST
 ↓
WCAG Rule
```

这样形成完整证据链。

---

# 20. 感知色彩系统

UIQ 的颜色分析空间默认：

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

其中：

- sRGB 用于输入/浏览器表示
- OKLab 用于感知分析
- OKLCH 用于 L/C/H 表达
- Relative Luminance 用于 Contrast

---

# 21. 为什么不是直接使用 RGB

RGB 是设备/编码相关表示。

因此：

```text
RGB distance
```

不能直接作为：

```text
Perceptual Difference
```

UIQ 不把 RGB 欧氏距离作为默认颜色差异 Metric。

---

# 22. OKLCH 的职责边界

OKLCH 可以用于：

```text
L
C
H
ΔL
ΔC
ΔH
```

并辅助：

```text
Theme Relationship Analysis
```

但 UIQ 不利用 OKLCH 自动决定：

```text
哪个颜色更漂亮
哪个颜色更高级
哪个颜色更有品牌感
```

---

# 23. “脏色”问题

UIQ 不定义：

```text
DIRTY_COLOR = true
```

因为“脏”不是一个基础测量事实。

应该拆成：

```text
Lightness
Chroma
Hue
Contrast
Gamut
Alpha
Context
```

例如：

```text
颜色看起来灰脏
```

只能进一步分析：

```text
C 是否过低
L 是否偏离
H 是否产生偏移
是否超出目标 Gamut
是否与邻近颜色形成不期望关系
```

最终是否接受由 Rule 决定。

---

# 24. Gamut

UIQ 支持：

```text
isInSrgbGamut()
```

以及：

```text
gamutDistance()
```

但：

```text
Out of Gamut ≠ Design Failure
```

是否失败必须由 Rule 定义。

---

# 25. Color Relationship

Design System 可以定义：

```text
Primary
Primary Hover
Primary Active
Primary Disabled
```

UIQ 可以测量：

```text
ΔL
ΔC
ΔH
ΔE
Contrast
```

例如：

```text
Primary
   ↓
Hover
```

得到：

```text
ΔL = ...
ΔC = ...
ΔH = ...
```

---

# 26. State Relationship

组件状态：

```text
DEFAULT
HOVER
ACTIVE
FOCUS
DISABLED
SELECTED
```

可以形成：

```text
Component State Graph
```

例如：

```text
DEFAULT
  ↓
HOVER
  ↓
ACTIVE

DEFAULT
  ↓
FOCUS

DEFAULT
  ↓
DISABLED
```

UIQ 可以对每个状态分别测量。

---

# 27. State 不应直接排序

例如：

```text
Hover
```

并不必然：

```text
lighter
```

或者：

```text
darker
```

Design System 可以定义策略：

```text
ΔL < 0
```

也可以：

```text
ΔL > 0
```

UIQ 只验证实际状态是否符合规则。

---

# 28. Component Contract

定义：

```ts
export interface ComponentContract {
  id: string;
  version: string;
  tokens: ComponentTokenRequirement[];
  states?: ComponentStateRequirement[];
  rules?: string[];
}
```

---

# 29. Button Contract 示例

```json
{
  "id": "button",
  "version": "1.0.0",
  "tokens": [
    "button.background",
    "button.foreground",
    "button.radius",
    "button.padding"
  ],
  "states": [
    "default",
    "hover",
    "focus",
    "disabled"
  ]
}
```

---

# 30. Component Conformance

验证：

```text
Component Contract
       ↓
Actual Component
```

检查：

```text
Token Match
Token Deviation
State Coverage
Required Metrics
Required Rules
```

---

# 31. Radix UI Adapter

Radix UI 只能位于：

```text
Adapter / Application
```

例如：

```text
@uiq/radix-adapter
```

而不能进入：

```text
@uiq/core
@uiq/color
@uiq/metrics
```

---

# 32. Radix Integration

结构：

```text
Radix Component
       ↓
Design System Wrapper
       ↓
CSS / Tokens
       ↓
Rendered DOM
       ↓
@uiq/browser
       ↓
UIQ
```

UIQ 不需要理解 Radix 的内部实现。

---

# 33. React Integration

React 同样属于 Adapter/Application：

```text
React
 ↓
DOM
 ↓
Browser Measurement
 ↓
UIQ
```

UIQ Core 不依赖 React。

---

# 34. 推荐 Integration Package

如果需要：

```text
packages/integrations/
└── radix/
```

或者：

```text
packages/radix-adapter/
```

职责只包括：

```text
Component Identity
State Mapping
Token Mapping
DOM Mapping
```

---

# 35. Adapter Contract

```ts
export interface UIQDesignSystemAdapter {
  resolveToken(element: Element): TokenBinding[];

  resolveComponent(element: Element): ComponentBinding | undefined;

  resolveTheme(element: Element): ThemeContext | undefined;
}
```

---

# 36. Token Binding

```ts
export interface TokenBinding {
  elementId: string;
  tokenId: string;
  source: "CSS_VARIABLE" | "INLINE" | "COMPUTED" | "OTHER";
  value?: unknown;
}
```

---

# 37. Component Binding

```ts
export interface ComponentBinding {
  componentId: string;
  componentVersion: string;
  elementId: string;
  state?: string;
}
```

---

# 38. CSS Variable Mapping

例如：

```css
.button {
  color: var(--button-foreground);
  background: var(--button-background);
}
```

Adapter 可以解析：

```text
button-background
        ↓
semantic.primary
        ↓
palette.blue.600
```

---

# 39. CSS Variable 不等于 Token

必须区分：

```text
CSS Variable
```

和：

```text
Design Token
```

CSS Variable 是实现机制。

Token 是设计系统语义。

---

# 40. Theme Export

Design System 可以输出：

```text
theme.json
theme.css
tokens.json
```

UIQ 可以验证：

```text
Export
 ↓
Schema
 ↓
Token Graph
 ↓
Theme Integrity
 ↓
Conformance
```

---

# 41. Theme Export 不应只有 CSS

推荐 Export Package：

```text
theme/
├── theme.json
├── tokens.json
├── semantic.json
├── components.json
├── themes/
│   ├── light.json
│   └── dark.json
├── css/
│   └── variables.css
└── uiq/
    ├── contract.json
    └── validation.json
```

---

# 42. UIQ Validation Artifact

```json
{
  "engine": {
    "name": "UIQ",
    "version": "1.0.0"
  },
  "theme": {
    "id": "brand-theme",
    "version": "1.2.0"
  },
  "result": {
    "state": "PASS"
  }
}
```

---

# 43. Export Validation

建议 Theme Export 流程：

```text
Generate Theme
      ↓
Resolve Tokens
      ↓
Validate Token Graph
      ↓
Validate Theme
      ↓
Run UIQ Rules
      ↓
Generate Validation Artifact
      ↓
Export
```

---

# 44. Validation Artifact 的价值

它使 Theme Export 不再只是：

```text
CSS Variables
```

而成为：

```text
Design Asset
+
Semantic Metadata
+
Validation Evidence
```

---

# 45. 可复现性

Validation Artifact 必须包含：

```text
Theme Version
Token Version
Component Version
UIQ Engine Version
Metric Versions
Rule Versions
Environment
Snapshot
```

---

# 46. Theme Certification

UIQ 可以生成：

```text
Theme Validation Report
```

例如：

```text
Theme: Brand Light 1.2.0

Token Graph       PASS
Theme Integrity   PASS
Accessibility     PASS
Component         PASS
Browser           PASS
Regression        PASS
```

注意：

这只是各项 Evaluation 的结果汇总，不能转换成：

```text
“主题质量 = 97”
```

---

# 47. Theme Quality Score 禁止

V1.0 明确禁止：

```text
ThemeScore = 97
DesignQuality = 91
Beauty = 95
```

原因：

这些数字容易掩盖不同维度之间不可直接交换的问题。

UIQ 应返回：

```text
事实
指标
规则结果
问题
证据
```

---

# 48. Theme Comparison

允许：

```text
Light vs Dark
```

比较：

```text
Contrast
Token Match
Token Deviation
Gamut
Component Conformance
Finding Count
Regression
```

但必须逐项展示。

---

# 49. 不输出整体 Winner

例如：

```text
Light better than Dark
```

不属于 UIQ Conformance 的职责。

应输出：

```text
Light:
Contrast PASS
Token Match PASS

Dark:
Contrast PASS
Token Match WARN
```

---

# 50. Theme Impact Trace

当：

```text
Primary Token
```

发生变化：

```text
Primary
 ↓
Button
 ↓
Link
 ↓
Focus Ring
 ↓
Theme
 ↓
Affected UI
```

UIQ 可以提供：

```text
Impact Trace
```

---

# 51. Impact Trace 不等于 Regression

Impact Trace：

> 可能影响什么？

Regression：

> 实际发生了什么变化？

必须保持：

```text
Potential Impact
≠
Observed Change
```

---

# 52. Theme Regression

例如：

```text
Theme 1.1
 ↓
Theme 1.2
```

UIQ 比较：

```text
Metric Diff
Evaluation Diff
Finding Diff
```

可能得到：

```text
PASS → FAIL
```

然后：

```text
NEW_FAILURE
```

---

# 53. Theme Release Gate

Theme 发布：

```text
Theme
 ↓
UIQ Validation
 ↓
Regression
 ↓
Policy
 ↓
ALLOW / WARN / BLOCK
```

因此 Design System 可以拥有真正的：

> **Theme Release Gate**

---

# 54. 完整 Design System Pipeline

```text
Color Space
      ↓
Palette
      ↓
Semantic Mapping
      ↓
Component Mapping
      ↓
Theme
      ↓
Theme Export
      ↓
Application
      ↓
Rendered UI
      ↓
UIQ
      ↓
Measurement
      ↓
Metric
      ↓
Rule
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
Release Gate
```

---

# 55. 与色彩系统的最终边界

```text
┌─────────────────────────────┐
│ Color Design System         │
│                             │
│ 选择 / 构造 / 组织颜色       │
│                             │
│ OKLCH                       │
│ Palette                     │
│ Semantic Token              │
│ Theme                       │
└──────────────┬──────────────┘
               │
               ▼
          Rendered UI
               │
               ▼
┌─────────────────────────────┐
│ UIQ                         │
│                             │
│ 测量 / 计算 / 验证 / 追踪     │
│                             │
│ Measurement                 │
│ Metric                      │
│ Rule                        │
│ Evaluation                  │
│ Finding                     │
│ Diagnostic                  │
│ Conformance                 │
│ Regression                  │
└─────────────────────────────┘
```

---

# 56. 工程依赖原则

允许：

```text
Design System
      ↓
UIQ Adapter
```

允许：

```text
UIQ Validation Result
      ↓
Design System Tooling
```

不允许：

```text
@uiq/core
      ↓
Design System
```

也不允许：

```text
@uiq/core
      ↓
Radix UI
```

---

# 57. Package Architecture

最终：

```text
packages/
├── core
├── color
├── geometry
├── measurement
├── metrics
├── rules
├── diagnostic
├── tokens
├── theme
├── browser
├── conformance
└── regression

integrations/
└── radix
```

Application：

```text
apps/
├── inspector
├── playground
└── cli
```

---

# 58. Acceptance Criteria

## AC-DS-01

Design Token 可以被 UIQ 导入。

## AC-DS-02

Theme 可以被 UIQ 验证。

## AC-DS-03

Token Match 与 Token Deviation 分离。

## AC-DS-04

Rendered UI 是最终 Measurement Source。

## AC-DS-05

Theme Variant 独立验证。

## AC-DS-06

OKLab/OKLCH 可用于颜色分析。

## AC-DS-07

Contrast 与 Color Difference 独立。

## AC-DS-08

Component Contract 可以验证。

## AC-DS-09

Radix UI 通过 Adapter 接入。

## AC-DS-10

React 不进入 UIQ Core。

## AC-DS-11

Theme Export 可以携带 Validation Artifact。

## AC-DS-12

Theme Regression 可以进入 Release Gate。

## AC-DS-13

UIQ 不自动生成或修改 Theme。

## AC-DS-14

UIQ 不产生整体 Design Quality Score。

## AC-DS-15

UIQ Core 不增加新的架构层。

---

# 59. Phase 11 完成后的能力

UIQ 已经能够连接：

```text
Design System
       ↓
Theme
       ↓
Component
       ↓
Real UI
       ↓
UIQ
       ↓
CI/CD
```

形成完整工程链。

---

# 60. UIQ V1.0 最终闭环

```text
             DESIGN SYSTEM
                   │
          ┌────────┴────────┐
          │                 │
       Tokens            Themes
          │                 │
          └────────┬────────┘
                   ▼
              COMPONENTS
                   │
                   ▼
                REAL UI
                   │
                   ▼
             MEASUREMENT
                   │
                   ▼
                METRIC
                   │
                   ▼
                 RULE
                   │
                   ▼
              EVALUATION
                   │
             ┌─────┴─────┐
             ▼           ▼
          FINDING     REGRESSION
             │           │
             ▼           │
        DIAGNOSTIC       │
             │           │
             └─────┬─────┘
                   ▼
              CONFORMANCE
                   │
                   ▼
                 POLICY
                   │
                   ▼
             RELEASE GATE
```

---

# 61. 架构收敛声明

至此，UIQ V1.0 的主要能力已经形成闭环。

**不再增加新的 Core Layer。**

后续版本只能主要通过：

```text
Metric Registry
Rule Registry
Diagnostic Registry
Token/Theme Adapter
Component Adapter
Browser Adapter
Conformance Profile
Policy Profile
```

扩展。

UIQ 不继续向：

```text
AI Design Generator
Automatic Designer
Color Generator
Design DSL
Design Editor
```

演进。

---

# 62. 下一阶段

下一阶段不再扩展 UIQ Core，而进入：

# UIQ-IMPL-14
# V1.0 Reference Application & End-to-End Acceptance Specification

目标是把目前所有规范压缩成一个真正可以运行的参考实现：

```text
OKLCH Theme
     ↓
Design Tokens
     ↓
Radix UI Component
     ↓
React Application
     ↓
Browser Measurement
     ↓
UIQ Metrics
     ↓
UIQ Rules
     ↓
Finding / Diagnostic
     ↓
Theme Conformance
     ↓
Regression
     ↓
CLI
     ↓
CI Release Gate
```

并以 **Button / Input / Card / Dialog** 等少量典型组件建立完整 Golden Case，作为 UIQ V1.0 的最终验收基线。