
# UIQ-TK-01
# Design Token & Theme Conformance Specification
## V1.0

**Status:** Stable  
**Specification ID:** UIQ-TK-01  
**Parent Specifications:** UIQ-FM-01 / UIQ-MR-01 / UIQ-ER-01 / UIQ-DX-01  
**Domain:** Design Token / Theme / Conformance  
**Version:** 1.0

---

# 1. Purpose

UIQ-TK-01 定义 UIQ 对以下设计资产的量化与验证模型：

```text
Primitive Token
Semantic Token
Component Token
Theme
Palette
Component
UI
```

核心目标：

> 确保设计系统中的 Token、Theme 与最终 UI 之间保持可追踪、可计算、可验证的一致关系。

完整链路：

```text
Color Space
      ↓
Palette
      ↓
Primitive Token
      ↓
Semantic Token
      ↓
Component Token
      ↓
Component
      ↓
UI
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

# 2. Design Principle

UIQ 不把 Design Token 视为简单的 CSS 变量。

Token 是：

> **设计系统中的可治理设计参数。**

因此 Token 同时具有：

```text
Value
Meaning
Reference
Constraint
Version
Usage
```

---

# 3. Token Model

形式化定义：

```text
Token =
(
    id,
    name,
    type,
    value,
    unit,
    role,
    references,
    constraints,
    metadata
)
```

---

# 4. Token Types

UIQ-TK-01 定义：

```text
COLOR
TYPOGRAPHY
SPACING
SIZE
RADIUS
BORDER
SHADOW
OPACITY
MOTION
Z_INDEX
OTHER
```

V1.0 不要求所有类型都必须支持完整计算。

---

# 5. Token Layers

UIQ 定义三个主要层级：

```text
Primitive
   ↓
Semantic
   ↓
Component
```

---

# 6. Primitive Token

Primitive Token 表示基础设计值。

例如：

```json
{
  "id": "color.blue.500",
  "type": "COLOR",
  "value": "#3B82F6"
}
```

Primitive Token 不直接表达 UI 语义。

例如：

```text
color.blue.500
```

而不是：

```text
button.primary.background
```

---

# 7. Semantic Token

Semantic Token 表示设计语义。

例如：

```text
color.primary
color.text.primary
color.text.secondary
color.surface
color.border
color.error
```

示例：

```json
{
  "id": "color.text.primary",
  "type": "COLOR",
  "reference": "color.neutral.900"
}
```

---

# 8. Component Token

Component Token 表示组件上下文。

例如：

```text
button.primary.background
button.primary.foreground
button.primary.border
button.primary.focus
```

示例：

```json
{
  "id": "button.primary.background",
  "type": "COLOR",
  "reference": "color.primary"
}
```

---

# 9. Token Reference Graph

Token 必须能够形成引用图：

```text
color.blue.500
       ↓
color.primary
       ↓
button.primary.background
       ↓
Button
```

UIQ 必须能够解析该关系。

---

# 10. Token Dependency

定义：

```text
TokenDependency =
(
    source,
    target,
    relation
)
```

关系：

```text
REFERENCES
DERIVES_FROM
OVERRIDES
ALIASES
```

---

# 11. Token Graph Constraints

禁止：

```text
A → B
B → C
C → A
```

即：

> Token Reference Graph 不得存在循环依赖。

---

# 12. Token Value Resolution

最终组件使用的值必须能够解析：

```text
Component Token
       ↓
Semantic Token
       ↓
Primitive Token
       ↓
Concrete Value
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

# 13. Resolution Failure

如果无法解析：

```text
button.primary.background
        ↓
color.primary
        ↓
???
```

Evaluation：

```text
UNKNOWN
```

如果 Token Schema 本身非法：

```text
ERROR
```

---

# 14. Token Conformance

UIQ 定义：

```text
Token Conformance =
Actual Usage
vs
Declared Token System
```

核心问题：

> UI 是否真正使用设计系统定义的 Token？

---

# 15. TOKEN_MATCH

Metric：

```text
CONFORMANCE.TOKEN_MATCH
```

表示：

```text
Actual Value
==
Resolved Token Value
```

例如：

```text
Token:
spacing.md = 16px

Actual:
16px
```

结果：

```text
TOKEN_MATCH = true
```

---

# 16. TOKEN_DEVIATION

Metric：

```text
CONFORMANCE.TOKEN_DEVIATION
```

表示：

```text
distance(actual, token)
```

例如：

```text
Token = 16px
Actual = 18px

Deviation = 2px
```

---

# 17. Token Deviation by Type

不同 Token 类型使用不同距离函数。

### Numeric

```text
|actual - expected|
```

### Color

优先使用感知色彩空间计算：

```text
ΔE
```

或明确指定的：

```text
OKLab / OKLCH distance
```

### Typography

可以分别比较：

```text
font-size
font-weight
line-height
letter-spacing
```

---

# 18. Color Token Evaluation

颜色评价不得默认使用 RGB 欧氏距离。

UIQ 推荐：

```text
RGB
 ↓
XYZ
 ↓
Perceptual Color Space
 ↓
Color Metric
```

主要分析空间：

```text
OKLab
OKLCH
```

---

# 19. Color Token Relationship

例如：

```text
color.primary
color.primary.hover
color.primary.active
color.primary.disabled
```

不应只评价：

```text
每个颜色是否合法
```

还应该能够评价：

```text
状态之间的关系
```

---

# 20. State Relationship

例如：

```text
Primary
 ↓
Hover
 ↓
Active
 ↓
Disabled
```

UIQ 可以记录：

```text
ΔL
ΔC
ΔH
ΔE
```

从而回答：

> 状态颜色之间实际发生了什么变化？

---

# 21. Semantic Color Validation

Semantic Color 应同时检查：

```text
Primitive Reference
+
Perceptual Relationship
+
Accessibility
+
Component Usage
```

例如：

```text
color.text.primary
        ↓
color.neutral.900
```

同时检查：

```text
contrast(surface, text.primary)
```

---

# 22. Theme

Theme 定义：

```text
Theme =
(
    id,
    version,
    tokens,
    semanticMappings,
    componentMappings,
    contexts
)
```

---

# 23. Theme Context

Theme 可以具有 Context：

```text
LIGHT
DARK
HIGH_CONTRAST
BRAND_A
BRAND_B
```

V1.0 不限制具体命名。

---

# 24. Theme Resolution

最终 UI 值必须可以从 Theme 解析：

```text
Theme
 ↓
Semantic Token
 ↓
Component Token
 ↓
UI Value
```

---

# 25. Theme Integrity

Theme Integrity 至少检查：

```text
Token Reference Integrity
Token Type Integrity
Value Validity
Reference Cycle
Missing Token
Unused Token
Orphan Token
```

---

# 26. Missing Token

例如：

```text
button.primary.focus
```

在 Theme 中不存在。

结果：

```text
Theme Integrity = FAIL
```

Finding：

```text
Missing required component token.
```

---

# 27. Orphan Token

定义：

> 已定义但没有任何有效引用的 Token。

例如：

```text
color.blue.700
```

没有任何：

```text
Semantic Token
Component Token
```

引用。

可以产生：

```text
INFO
```

而不是自动判定为错误。

---

# 28. Unused Token ≠ Invalid Token

必须区分：

```text
Unused
```

和：

```text
Invalid
```

Unused：

> 当前没有使用。

Invalid：

> 本身不符合 Schema / Type / Constraint。

---

# 29. Token Fragmentation

Metric：

```text
CONFORMANCE.TOKEN_FRAGMENTATION
```

用于识别：

> 相同或高度相似的设计值是否被重复定义为多个 Token。

例如：

```text
color.gray.900
color.text.dark
color.text.primary-dark
```

三个 Token：

```text
#171717
#171717
#171717
```

可能形成：

```text
Token Fragmentation
```

---

# 30. Fragmentation 不等于错误

重复 Token 可能是：

```text
Intentional Alias
```

也可能是：

```text
Accidental Duplication
```

因此 Metric 只能报告事实。

最终由 Rule 决定是否需要治理。

---

# 31. Token Alias

如果两个 Token 表达同一语义：

```text
A → B
```

可以定义：

```text
ALIAS
```

而不是复制 Value。

例如：

```text
color.brand.primary
    ↓
color.primary
```

---

# 32. Theme Override

Theme 可以覆盖 Primitive Value。

例如：

```text
Base:
color.primary = blue

Dark:
color.primary = lighter-blue
```

Override 必须保持：

```text
same semantic role
```

---

# 33. Theme Override Validation

切换 Theme 后重新执行：

```text
Measurement
Metric
Rule
Evaluation
```

即：

```text
Light Theme
     ↓
Evaluate

Dark Theme
     ↓
Evaluate
```

不能假设：

> Light Theme 通过，因此 Dark Theme 自动通过。

---

# 34. Cross-Theme Consistency

对于多个 Theme：

```text
Light
Dark
High Contrast
```

UIQ 可以比较：

```text
Token Availability
Semantic Coverage
Component Coverage
Accessibility
```

---

# 35. Theme Coverage

定义：

```text
Theme Coverage =
Resolvable Required Tokens
/
Total Required Tokens
```

例如：

```text
100 required tokens
98 resolvable
```

则：

```text
Coverage = 98%
```

Coverage 是 Metric。

它不是 Compliance Decision。

---

# 36. Theme Accessibility

每一个 Theme 都必须独立评价。

例如：

```text
LIGHT:
contrast = 7.1 → PASS

DARK:
contrast = 3.8 → FAIL
```

不得用 Light Theme 的结果覆盖 Dark Theme。

---

# 37. Component Conformance

Component Conformance 检查：

```text
Component
 ↓
Expected Token Contract
 ↓
Actual Token Usage
```

例如 Button Contract：

```text
button.primary.background
button.primary.foreground
button.primary.hover
button.primary.active
button.primary.focus
```

缺失任意 Mandatory Token：

```text
FAIL
```

---

# 38. Component Token Contract

定义：

```json
{
  "component": "Button",
  "variant": "primary",
  "requiredTokens": [
    "button.primary.background",
    "button.primary.foreground",
    "button.primary.hover",
    "button.primary.active",
    "button.primary.focus"
  ]
}
```

---

# 39. Component Contract Version

Component Contract 必须版本化：

```text
Button@1.0
Button@1.1
```

历史评价必须记录具体 Contract Version。

---

# 40. Token Usage Trace

UIQ 必须能够回答：

> 一个 UI 颜色来自哪个 Token？

例如：

```text
Button background
      ↓
button.primary.background
      ↓
color.primary
      ↓
color.blue.500
      ↓
#3B82F6
```

这条链称为：

```text
Token Resolution Trace
```

---

# 41. Reverse Trace

也必须支持反向追踪：

> 一个 Token 被哪些 UI 使用？

例如：

```text
color.primary
      ↓
button.primary.background
      ↓
Button
      ↓
Dashboard
      ↓
Login Page
```

称为：

```text
Token Impact Trace
```

---

# 42. Theme Impact Analysis

当修改：

```text
color.primary
```

系统应能够找到：

```text
Affected Semantic Tokens
Affected Component Tokens
Affected Components
Affected Pages
Affected Evaluations
```

---

# 43. Change Impact Graph

```text
color.primary
      │
      ├── button.primary.background
      │          ↓
      │       Button
      │          ↓
      │       Dashboard
      │
      └── link.primary
                 ↓
               Link
                 ↓
               Page
```

这使主题修改成为：

> 可分析的工程变更。

---

# 44. Theme Validation Pipeline

标准流程：

```text
Load Theme
    ↓
Validate Schema
    ↓
Resolve References
    ↓
Build Token Graph
    ↓
Detect Cycles
    ↓
Resolve Values
    ↓
Generate Measurements
    ↓
Calculate Metrics
    ↓
Apply Rules
    ↓
Generate Findings
    ↓
Generate Diagnostic
    ↓
Theme Decision
```

---

# 45. Theme Decision

Theme Decision 不等于：

```text
Theme Beauty Score
```

而是：

```text
Theme Conformance Decision
```

例如：

```text
Token Integrity       PASS
Accessibility         FAIL
Component Coverage    PASS
Color Relationships   WARN
```

最终：

```text
Theme Decision = FAIL
```

---

# 46. Theme Validation Report

```text
Theme
│
├── Token Integrity
│
├── Token Coverage
│
├── Token Conformance
│
├── Color Relationships
│
├── Typography
│
├── Spacing
│
├── Component Contracts
│
├── Accessibility
│
└── Findings
```

---

# 47. Theme Export

Theme Export 不只是导出：

```text
CSS Variables
```

UIQ-TK-01 建议 Theme Package 包含：

```text
tokens
semantic mappings
component mappings
themes
metadata
constraints
validation metadata
```

---

# 48. Theme Package

建议结构：

```text
theme/
├── primitives/
├── semantic/
├── components/
├── themes/
├── metadata/
├── constraints/
└── validation/
```

---

# 49. Validation Metadata

例如：

```json
{
  "validation": {
    "specification": "UIQ-TK-01",
    "version": "1.0",
    "evaluatedAt": "2026-09-23T00:00:00Z",
    "ruleSet": "UIQ-DESIGN-SYSTEM-01",
    "decision": "PASS"
  }
}
```

这样导出的 Theme 自带：

> 可验证性元数据。

---

# 50. Theme Export Formats

UIQ 本身不限制具体输出格式。

实现层可以导出：

```text
JSON
CSS
SCSS
TypeScript
JavaScript
Tailwind
Radix-compatible variables
Design Token formats
```

但：

> Export Format ≠ UIQ Specification。

UIQ 负责语义，Adapter 负责输出。

---

# 51. Radix UI Integration

以 Radix UI 为例：

```text
UIQ Theme
    ↓
Semantic Tokens
    ↓
Component Tokens
    ↓
CSS Variables
    ↓
Radix UI Components
```

Radix UI 不需要成为 UIQ 的标准组成部分。

UIQ 只验证最终：

```text
Token
Component
Rendered UI
```

---

# 52. Token → CSS

例如：

```css
:root {
  --color-primary: #3b82f6;
  --color-text-primary: #171717;
  --color-surface: #ffffff;

  --button-primary-background:
    var(--color-primary);

  --button-primary-foreground:
    var(--color-text-primary);
}
```

UIQ 关注：

```text
Semantic correctness
Reference correctness
Resolved value
Rendered result
```

而不是 CSS 写法本身。

---

# 53. Color Theme Integration

结合前面的感知色彩系统：

```text
OKLCH Space
      ↓
Palette Generation
      ↓
Primitive Colors
      ↓
Semantic Colors
      ↓
Component States
      ↓
Theme
      ↓
UIQ Validation
```

因此颜色设计与 UIQ 不再是两个孤立系统。

---

# 54. Color Relationship Validation

例如 Primary Palette：

```text
Primary 500
Primary 600
Primary 700
```

可以计算：

```text
ΔL
ΔC
ΔH
ΔE
```

然后由 Rule 判断：

```text
Hover Relationship
Active Relationship
Disabled Relationship
```

是否满足设计约束。

---

# 55. Perceptual Constraint

例如某状态转换要求：

```text
ΔL >= 0.04
```

则：

```text
Primary → Hover
```

实际：

```text
ΔL = 0.015
```

Metric：

```text
COLOR.DELTA_L = 0.015
```

Rule：

```text
DELTA_L >= 0.04
```

Evaluation：

```text
FAIL
```

Diagnostic：

```text
State colors differ insufficiently
in perceptual lightness.
```

---

# 56. Avoiding “Dirty Color”

UIQ 不直接定义：

```text
“脏”
```

因为“脏”是主观描述。

但是可以检测其可能对应的可量化因素：

```text
Low Chroma
Unexpected Lightness
Hue Shift
Large ΔE
Small ΔL
Gamut Compression
```

例如：

```text
OKLCH:
L = 0.62
C = 0.035
```

系统可以报告：

```text
Low Chroma
```

而不是：

```text
Color is dirty
```

---

# 57. Color Gamut

Theme Export 前可以检查：

```text
sRGB
Display-P3
Other Target Color Space
```

并计算：

```text
COLOR.GAMUT_DISTANCE
```

如果超出目标色域：

```text
WARN
```

或根据规则：

```text
FAIL
```

但必须明确：

```text
Target Color Space
Gamut Mapping Method
```

---

# 58. Theme Validation Across Color Spaces

设计阶段可以：

```text
OKLCH
```

进行选择和分析。

输出阶段：

```text
sRGB
Display-P3
```

进行编码与验证。

因此：

```text
Selection Space
≠
Encoding Space
```

这与 UIQ 的 Metric 模型保持一致。

---

# 59. Token Conformance Rules

建议基础 Rule：

```text
CONFORMANCE-TOKEN-001
CONFORMANCE-TOKEN-002
CONFORMANCE-TOKEN-003
CONFORMANCE-TOKEN-004
```

分别用于：

```text
Token Match
Token Deviation
Token Fragmentation
Component Contract
```

---

# 60. Example Rule

```yaml
id: CONFORMANCE-TOKEN-001
version: "1.0"

metric: CONFORMANCE.TOKEN_MATCH

operator: IS_TRUE

threshold: true

severity: ERROR

applicability:
  target.type:
    - COMPONENT
    - ELEMENT
```

---

# 61. Example Finding

```text
Finding:
F-001

Target:
Button.primary.background

Rule:
CONFORMANCE-TOKEN-001@1.0

Expected:
Token-resolved value

Actual:
#2563EB

Resolved:
#3B82F6

State:
FAIL
```

Diagnostic：

```text
The component background value does not
match the resolved component token value.
```

Root Cause：

```text
ELEMENT_VALUE
```

---

# 62. Theme Governance

Theme 的治理对象包括：

```text
Token
Reference
Semantic Mapping
Component Mapping
Theme Variant
Constraint
Usage
```

而不是只管理：

```text
CSS
```

---

# 63. Theme Versioning

Theme 必须版本化：

```text
BrandTheme@1.0
BrandTheme@1.1
BrandTheme@2.0
```

Evaluation 必须保存：

```text
themeId
themeVersion
ruleSetVersion
metricVersion
```

---

# 64. Reproducibility

历史评价：

```text
Theme@1.2
RuleSet@1.0
Metric@1.0
```

必须能够重新计算得到同样结果。

---

# 65. Token Change Workflow

标准流程：

```text
Create Change
     ↓
Resolve Impact
     ↓
Modify Token
     ↓
Build Theme
     ↓
Validate Token Graph
     ↓
Evaluate Components
     ↓
Evaluate Pages
     ↓
Compare Before/After
     ↓
Approve
     ↓
Export
```

---

# 66. Theme Release Gate

Theme 可以定义 Release Gate：

```text
Token Integrity = PASS
AND
Mandatory Accessibility = PASS
AND
Component Contract = PASS
```

才能：

```text
RELEASE
```

否则：

```text
BLOCKED
```

---

# 67. Release Gate ≠ Quality Score

Release Gate 是：

```text
Boolean / State Decision
```

不是：

```text
87.5 / 100
```

---

# 68. Theme Validation Architecture

```text
                ┌──────────────┐
                │ Color System │
                └──────┬───────┘
                       ↓
                ┌──────────────┐
                │    Tokens    │
                └──────┬───────┘
                       ↓
                ┌──────────────┐
                │    Theme     │
                └──────┬───────┘
                       ↓
                ┌──────────────┐
                │  Components  │
                └──────┬───────┘
                       ↓
                ┌──────────────┐
                │   UI Render  │
                └──────┬───────┘
                       ↓
                 UIQ Measurement
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
```

---

# 69. Stable Boundary

UIQ-TK-01 V1.0 冻结：

```text
Primitive Token
Semantic Token
Component Token
Token Reference
Token Graph
Theme
Theme Context
Theme Resolution
Token Conformance
Token Deviation
Token Fragmentation
Component Contract
Token Impact
Theme Impact
Theme Validation
Theme Export Metadata
```

不引入：

```text
Complex Token DSL
AI Token Generation
AI Theme Judgment
Automatic Theme Approval
Brand Personality Score
Aesthetic Score
```

---

# 70. Specification Relationship

当前 UIQ 规范体系：

```text
UIQ-FM-01
Formal Measurement & Metric Model
             │
             ↓
UIQ-MR-01
Metric Registry
             │
             ↓
UIQ-ER-01
Evaluation Rule & Decision
             │
             ↓
UIQ-DX-01
Diagnostic & Finding
             │
             ↓
UIQ-TK-01
Token & Theme Conformance
```

这五个规范已经形成一条完整技术链。

---

# 71. Overall Architecture

```text
                    UIQ
                     │
       ┌─────────────┴─────────────┐
       ↓                           ↓
 Design Assets                  UI Runtime
       │                           │
 Token / Theme                  Rendered UI
       │                           │
       └─────────────┬─────────────┘
                     ↓
               Measurement
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

# 72. Core Value

UIQ 现在已经能够连接：

```text
Color Science
Design Tokens
Theme System
Component System
Accessibility
UI Measurement
Design Governance
```

从而形成：

```text
Design
   ↓
Tokenize
   ↓
Generate Theme
   ↓
Render
   ↓
Measure
   ↓
Evaluate
   ↓
Diagnose
   ↓
Correct
   ↓
Verify
   ↓
Release
```

---

# 73. Conformance Requirement

实现如果声明：

```text
UIQ-TK-01 V1.0 Conformant
```

至少必须支持：

1. Primitive Token。
2. Semantic Token。
3. Component Token。
4. Token Reference Graph。
5. Reference Cycle Detection。
6. Token Resolution。
7. Token Match。
8. Token Deviation。
9. Token Fragmentation。
10. Component Contract。
11. Theme Version。
12. Theme Context。
13. Theme Validation。
14. Token Impact Trace。
15. Theme Impact Analysis。
16. Re-Evaluation。
17. Validation Metadata。
18. Deterministic Evaluation。

---

# 74. Final Semantic Model

UIQ 至此已经可以用一个统一模型描述：

```text
Design Asset
     │
     ├── Token
     │     ├── Primitive
     │     ├── Semantic
     │     └── Component
     │
     └── Theme
           ↓
       Resolved Value
           ↓
      Rendered Interface
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
     Remediation
           ↓
     Re-Evaluation
```

---

# 75. Specification Status

```text
UIQ-FM-01   Formal Measurement & Metric Model       Stable
UIQ-MR-01   Metric Registry                        Stable
UIQ-ER-01   Evaluation Rule & Decision             Stable
UIQ-DX-01   Diagnostic & Finding Explanation       Stable
UIQ-TK-01   Design Token & Theme Conformance       Stable
```

---

# 76. Convergence Boundary

从现在开始，UIQ **不应该继续通过增加大量规范来“演进”**。

核心模型已经足够形成 MVP。

下一阶段的工作重点应从：

```text
Specification Expansion
```

切换到：

```text
Reference Implementation
+
Rule Registry
+
Color/Theme Integration
+
Conformance Tests
```

也就是说，下一阶段不是再创造新的抽象，而是验证：

> **UIQ 这些定义是否真的能够运行。**