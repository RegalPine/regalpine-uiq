
# UIQ-ER-01
# Evaluation Rule & Decision Specification
## V1.0

**Status:** Stable Draft  
**Specification ID:** UIQ-ER-01  
**Parent Specification:** UIQ-FM-01 / UIQ-MR-01  
**Domain:** Evaluation / Decision / Conformance  
**Primary Language:** English identifiers + implementation-neutral semantics

---

# 1. Purpose

UIQ-ER-01 定义 UIQ 的**规则评价与决策模型**。

本规范解决的问题是：

> 已经获得 UI 的 Measurement 和 Metric 之后，如何确定某项设计是否符合指定设计规则？

UIQ 将评价过程严格定义为：

```text
UI
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
```

其中：

- Measurement：观察事实
- Metric：从事实计算出的量化指标
- Rule：规定什么条件可以接受
- Evaluation：根据 Rule 对 Metric 做确定性判断
- Finding：记录违反规则的具体问题
- Diagnostic：解释问题及其可能原因
- Recommendation：提出修改建议

---

# 2. Design Principles

## 2.1 Metric 不负责判断好坏

例如：

```text
COLOR.LIGHTNESS = 0.62
```

Metric 只表示：

> 该颜色的感知明度为 0.62。

它不能直接产生：

```text
GOOD
BAD
```

判断由 Rule 完成：

```text
Rule:
COLOR.LIGHTNESS >= 0.60
```

---

# 3. Formal Evaluation Model

UIQ Evaluation 定义为：

```text
Evaluation =
    Evaluate(
        MetricResult,
        Rule,
        Context
    )
```

形式化表示：

```text
E = (m, r, c, s, f)
```

其中：

| Symbol | Meaning |
|---|---|
| `m` | Metric Result |
| `r` | Evaluation Rule |
| `c` | Evaluation Context |
| `s` | Evaluation State |
| `f` | Finding |

---

# 4. Rule Model

Rule 定义为：

```text
Rule =
(
    id,
    version,
    name,
    metric,
    operator,
    threshold,
    tolerance,
    applicability,
    severity,
    evidence
)
```

示例：

```json
{
  "id": "COLOR-CONTRAST-001",
  "version": "1.0",
  "metric": "COLOR.CONTRAST",
  "operator": "GTE",
  "threshold": 4.5,
  "tolerance": 0,
  "severity": "ERROR"
}
```

---

# 5. Rule Identity

每个 Rule 必须具有稳定 ID。

格式：

```text
<DOMAIN>-<SUBJECT>-<NUMBER>
```

例如：

```text
COLOR-CONTRAST-001
COLOR-DELTAC-001
SPACING-SCALE-001
LAYOUT-ALIGNMENT-001
TYPOGRAPHY-SIZE-001
ACCESSIBILITY-TARGET-001
```

Rule ID 不得因为阈值修改而改变。

阈值变化必须增加 Rule Version。

---

# 6. Rule Version

规则必须版本化。

```text
COLOR-CONTRAST-001@1.0
COLOR-CONTRAST-001@1.1
COLOR-CONTRAST-001@2.0
```

历史 Evaluation 必须保存：

```text
ruleId
ruleVersion
```

从而保证历史评价可重现。

---

# 7. Operator

UIQ V1.0 定义以下基础 Operator。

## 7.1 Numeric Operators

| Operator | Meaning |
|---|---|
| `EQ` | equal |
| `NEQ` | not equal |
| `GT` | greater than |
| `GTE` | greater than or equal |
| `LT` | less than |
| `LTE` | less than or equal |
| `BETWEEN` | within interval |
| `OUTSIDE` | outside interval |

---

# 8. Set Operators

用于枚举型 Metric。

```text
IN
NOT_IN
```

例如：

```text
FONT_WEIGHT IN [400, 500, 600, 700]
```

---

# 9. Boolean Operators

用于逻辑规则组合。

```text
IS_TRUE
IS_FALSE
```

---

# 10. Composite Operators

规则可以通过逻辑组合形成复合规则：

```text
AND
OR
NOT
```

例如：

```text
ACCESSIBILITY.CONTRAST >= 4.5
AND
TYPOGRAPHY.FONT_SIZE >= 16
```

---

# 11. Threshold

Threshold 定义规则的目标边界。

例如：

```text
threshold = 4.5
operator = GTE
```

表示：

```text
metric >= 4.5
```

---

# 12. Threshold Types

UIQ V1.0 支持：

### 12.1 Scalar

```json
{
  "threshold": 4.5
}
```

### 12.2 Range

```json
{
  "threshold": {
    "min": 0.4,
    "max": 0.7
  }
}
```

### 12.3 Set

```json
{
  "threshold": [400, 500, 600, 700]
}
```

### 12.4 Reference

阈值可以来自 Design Token 或 Context。

例如：

```text
spacing <= spacing.scale.max
```

---

# 13. Tolerance

Tolerance 用于表达测量或计算允许的边界误差。

定义：

```text
effectiveThreshold =
    threshold ± tolerance
```

但必须根据 Operator 明确定义方向。

例如：

```text
Rule:

metric >= 4.5
tolerance = 0.1
```

有效判断边界为：

```text
metric >= 4.4
```

---

# 14. Tolerance 不等于 Design Margin

必须区分：

```text
Tolerance
```

与：

```text
Design Margin
```

Tolerance：

> 允许的测量/计算误差。

Design Margin：

> 设计者主动保留的安全余量。

例如：

```text
Minimum contrast = 4.5
Design target = 5.0
```

其中：

```text
4.5 = compliance threshold
5.0 = design target
```

不能把 5.0 称为 tolerance。

---

# 15. Severity

UIQ V1.0 定义：

```text
INFO
WARNING
ERROR
CRITICAL
```

## 15.1 INFO

表示：

> 存在值得关注的设计事实，但不构成违规。

例如：

```text
COLOR.GAMUT_DISTANCE = high
```

---

## 15.2 WARNING

表示：

> 存在潜在设计风险。

---

## 15.3 ERROR

表示：

> 明确违反设计规则。

---

## 15.4 CRITICAL

表示：

> 可能导致严重可访问性、交互或系统一致性问题。

Severity 是规则属性，而不是 Metric 属性。

---

# 16. Applicability

并非所有 Rule 都适用于所有 UI Element。

因此 UIQ 定义：

```text
Applicability
```

用于判断：

> Rule 是否适用于当前 Evaluation Target。

---

# 17. Applicability Model

```text
Applicability =
    condition(Context)
```

例如：

```text
Rule:
ACCESSIBILITY.TARGET_SIZE >= 24

Applicable When:
element.interactive == true
```

非交互元素：

```text
NOT_APPLICABLE
```

---

# 18. Applicability Conditions

V1.0 支持：

```text
ELEMENT_TYPE
COMPONENT_TYPE
INTERACTION_TYPE
CONTENT_TYPE
PLATFORM
VIEWPORT
THEME
ACCESSIBILITY_MODE
```

例如：

```text
component.type == "Button"
```

或者：

```text
interaction.enabled == true
```

---

# 19. Evaluation State

UIQ V1.0 定义：

```text
PASS
FAIL
WARN
NOT_APPLICABLE
UNKNOWN
ERROR
```

---

# 20. PASS

表示：

```text
Rule condition = true
```

例如：

```text
contrast = 7.1
required = 4.5
```

结果：

```text
PASS
```

---

# 21. FAIL

表示明确违反 Rule。

例如：

```text
contrast = 3.2
required = 4.5
```

结果：

```text
FAIL
```

---

# 22. WARN

用于：

> 规则本身允许，但结果接近风险边界，或者属于设计质量警告。

例如：

```text
contrast = 4.6
recommended = 5.0
minimum = 4.5
```

可以得到：

```text
WARN
```

---

# 23. NOT_APPLICABLE

表示：

> Rule 不适用于当前对象。

例如：

```text
TARGET_SIZE
```

应用于：

```text
Button
Link
Input
```

但不应用于：

```text
Heading
Paragraph
```

结果：

```text
NOT_APPLICABLE
```

---

# 24. NOT_APPLICABLE ≠ PASS

这是 UIQ 的重要语义约束。

不得将：

```text
NOT_APPLICABLE
```

统计为：

```text
PASS
```

否则会产生虚假的合规率。

例如：

```text
10 elements

6 PASS
2 FAIL
2 NOT_APPLICABLE
```

合规率应基于：

```text
6 / 8
```

而不是：

```text
8 / 10
```

---

# 25. UNKNOWN

UNKNOWN 表示：

> 当前信息不足以进行可靠评价。

例如：

```text
foreground color = known
background color = unknown
```

则：

```text
COLOR.CONTRAST
```

无法计算。

Evaluation：

```text
UNKNOWN
```

而不是：

```text
PASS
```

也不是：

```text
FAIL
```

---

# 26. ERROR

ERROR 表示：

> Evaluation Engine 本身无法正常执行规则。

例如：

```text
metric schema invalid
rule schema invalid
unsupported operator
invalid unit
```

---

# 27. Evaluation Result

标准结果结构：

```json
{
  "targetId": "button.primary",
  "metricId": "COLOR.CONTRAST",
  "metricVersion": "1.0",
  "ruleId": "COLOR-CONTRAST-001",
  "ruleVersion": "1.0",
  "state": "PASS",
  "value": 7.12,
  "threshold": 4.5,
  "severity": "ERROR"
}
```

---

# 28. Evidence

每一次 Evaluation 必须能够追溯到证据。

Evidence 至少包括：

```text
target
measurement
metric
metricVersion
rule
ruleVersion
input values
calculation context
result
```

---

# 29. Evaluation Evidence Model

```json
{
  "targetId": "button.primary.label",
  "measurementIds": [
    "m-001",
    "m-002"
  ],
  "metric": {
    "id": "COLOR.CONTRAST",
    "version": "1.0",
    "value": 7.12
  },
  "rule": {
    "id": "COLOR-CONTRAST-001",
    "version": "1.0"
  },
  "evaluation": {
    "state": "PASS"
  }
}
```

---

# 30. Finding

Finding 是 Evaluation 层产生的问题记录。

定义：

```text
Finding =
(
    id,
    target,
    rule,
    state,
    severity,
    evidence,
    message
)
```

---

# 31. Finding 生成规则

只有以下情况可以产生 Finding：

```text
FAIL
WARN
ERROR
UNKNOWN
```

其中：

```text
PASS
```

默认不产生 Finding。

```text
NOT_APPLICABLE
```

也不产生 Finding。

---

# 32. Finding Example

```json
{
  "id": "F-000123",
  "targetId": "button.primary",
  "ruleId": "COLOR-CONTRAST-001",
  "severity": "ERROR",
  "state": "FAIL",
  "message": "Text contrast does not satisfy the required threshold."
}
```

---

# 33. Finding 不等于 Recommendation

UIQ 严格区分：

```text
Finding
```

和：

```text
Recommendation
```

Finding：

> 发生了什么问题。

Recommendation：

> 可以如何处理。

例如：

```text
Finding:
Contrast = 3.2 < 4.5
```

Recommendation：

```text
Increase text/background contrast.
```

---

# 34. Decision

Decision 是对一个 Evaluation Context 的汇总结果。

定义：

```text
Decision =
Aggregate(Evaluation[])
```

例如：

```text
Page
 ├── Rule A → PASS
 ├── Rule B → PASS
 ├── Rule C → FAIL
 └── Rule D → NOT_APPLICABLE
```

最终：

```text
Decision = FAIL
```

---

# 35. Decision Aggregation

UIQ V1.0 不允许使用：

```text
平均分
```

替代 Decision。

例如：

```text
90% PASS
```

不能自动解释为：

```text
COMPLIANT
```

因为关键规则可能仍然 FAIL。

---

# 36. Decision Policy

默认 Decision Policy：

```text
CRITICAL FAIL
    ↓
FAIL

ERROR FAIL
    ↓
FAIL

WARNING
    ↓
WARN

ALL PASS
    ↓
PASS

NO APPLICABLE RULE
    ↓
NOT_APPLICABLE

INSUFFICIENT EVIDENCE
    ↓
UNKNOWN
```

---

# 37. Priority

Decision 的优先级：

```text
ERROR
  >
FAIL
  >
WARN
  >
PASS
```

但：

```text
NOT_APPLICABLE
UNKNOWN
```

必须独立处理。

不能简单参与数值排序。

---

# 38. Deterministic Evaluation

同样输入必须得到相同输出：

```text
same Measurement
+
same Metric Version
+
same Rule Version
+
same Context
=
same Evaluation
```

即：

```text
Deterministic Evaluation
```

---

# 39. Evaluation Context

Context 定义：

```json
{
  "projectId": "P001",
  "pageId": "dashboard",
  "componentId": "button.primary",
  "viewport": {
    "width": 1440,
    "height": 900
  },
  "theme": "light",
  "platform": "web"
}
```

Context 不得被隐式修改。

---

# 40. Rule Scope

Rule 必须定义 Scope。

支持：

```text
PROJECT
PAGE
REGION
COMPONENT
ELEMENT
TOKEN
THEME
```

例如：

```text
TOKEN_MATCH
```

通常 Scope：

```text
TOKEN
```

而：

```text
TARGET_SIZE
```

通常 Scope：

```text
ELEMENT
```

---

# 41. Rule Example — Contrast

```yaml
id: COLOR-CONTRAST-001
version: "1.0"

metric: ACCESSIBILITY.CONTRAST

operator: GTE

threshold:
  value: 4.5

severity: ERROR

applicability:
  element.interactive: false
  element.text: true
```

---

# 42. Rule Example — Target Size

```yaml
id: ACCESSIBILITY-TARGET-001
version: "1.0"

metric: ACCESSIBILITY.TARGET_SIZE

operator: GTE

threshold:
  value: 24
  unit: px

severity: ERROR

applicability:
  element.interactive: true
```

---

# 43. Rule Example — Spacing

```yaml
id: SPACING-SCALE-001
version: "1.0"

metric: SPACING.SCALE_CONFORMANCE

operator: GTE

threshold: 0.95

severity: WARNING
```

---

# 44. Rule Example — Token Conformance

```yaml
id: CONFORMANCE-TOKEN-001
version: "1.0"

metric: CONFORMANCE.TOKEN_MATCH

operator: IS_TRUE

threshold: true

severity: ERROR
```

---

# 45. Composite Rule

例如：

```text
ReadableText =
    Contrast >= 4.5
    AND
    FontSize >= 14
    AND
    LineHeight >= 1.4
```

形式化：

```json
{
  "operator": "AND",
  "rules": [
    {
      "metric": "ACCESSIBILITY.CONTRAST",
      "operator": "GTE",
      "threshold": 4.5
    },
    {
      "metric": "TYPOGRAPHY.FONT_SIZE",
      "operator": "GTE",
      "threshold": 14
    },
    {
      "metric": "TYPOGRAPHY.LINE_HEIGHT",
      "operator": "GTE",
      "threshold": 1.4
    }
  ]
}
```

---

# 46. Rule Dependency

Rule 可以依赖 Metric。

例如：

```text
COLOR-CONTRAST-001
        ↓
ACCESSIBILITY.CONTRAST
        ↓
COLOR.XYZ
        ↓
COLOR.SRGB
```

UIQ 必须能够建立：

```text
Rule Dependency Graph
```

---

# 47. Evaluation Pipeline

标准执行流程：

```text
Load UI
    ↓
Create MeasurementSnapshot
    ↓
Resolve Metrics
    ↓
Load Rule Set
    ↓
Resolve Applicability
    ↓
Evaluate Operators
    ↓
Generate Evaluation
    ↓
Generate Findings
    ↓
Aggregate Decision
```

---

# 48. Rule Set

多个 Rule 可以组成：

```text
RuleSet
```

例如：

```text
UIQ-ACCESSIBILITY-WEB-01
UIQ-DESIGN-SYSTEM-01
UIQ-COLOR-SYSTEM-01
UIQ-TYPOGRAPHY-01
```

---

# 49. Rule Set Structure

```json
{
  "id": "UIQ-DESIGN-SYSTEM-01",
  "version": "1.0",
  "rules": [
    "COLOR-CONTRAST-001",
    "SPACING-SCALE-001",
    "CONFORMANCE-TOKEN-001",
    "LAYOUT-ALIGNMENT-001"
  ]
}
```

---

# 50. Rule Profile

Rule Set 可以根据目标场景形成 Profile：

```text
WEB
MOBILE
DESKTOP
ACCESSIBILITY
DESIGN_SYSTEM
ENTERPRISE
```

但 Profile 不改变 Metric 定义。

---

# 51. Metric 与 Rule 的职责边界

| Layer | Responsibility |
|---|---|
| Measurement | Observe |
| Metric | Calculate |
| Rule | Specify |
| Evaluation | Judge compliance |
| Finding | Record problem |
| Diagnostic | Explain cause |
| Recommendation | Suggest action |

这是 UIQ 的核心架构边界。

---

# 52. 禁止规则

以下设计在 UIQ 中禁止：

### 52.1 Metric 直接返回 GOOD/BAD

错误：

```text
COLOR.LIGHTNESS → GOOD
```

正确：

```text
COLOR.LIGHTNESS → 0.62
```

然后：

```text
Rule → PASS
```

---

### 52.2 Rule 隐藏在 Metric 中

错误：

```text
ACCESSIBILITY.CONTRAST
内部自动判断 >= 4.5
```

正确：

```text
Metric:
contrast = 3.8

Rule:
contrast >= 4.5

Evaluation:
FAIL
```

---

### 52.3 NOT_APPLICABLE 算 PASS

禁止。

---

### 52.4 UNKNOWN 算 PASS

禁止。

---

### 52.5 使用单一总分代替 Decision

禁止。

---

# 53. Evaluation Result Schema

建议实现统一结构：

```json
{
  "evaluationId": "E-001",

  "target": {
    "type": "ELEMENT",
    "id": "button.primary.label"
  },

  "metric": {
    "id": "ACCESSIBILITY.CONTRAST",
    "version": "1.0",
    "value": 3.2,
    "unit": "ratio"
  },

  "rule": {
    "id": "COLOR-CONTRAST-001",
    "version": "1.0",
    "operator": "GTE",
    "threshold": 4.5,
    "tolerance": 0
  },

  "state": "FAIL",

  "severity": "ERROR",

  "evidence": [
    "measurement:m001",
    "measurement:m002"
  ]
}
```

---

# 54. Finding Schema

```json
{
  "findingId": "F-001",

  "targetId": "button.primary.label",

  "ruleId": "COLOR-CONTRAST-001",
  "ruleVersion": "1.0",

  "state": "FAIL",
  "severity": "ERROR",

  "metric": {
    "id": "ACCESSIBILITY.CONTRAST",
    "value": 3.2
  },

  "expected": {
    "operator": "GTE",
    "value": 4.5
  },

  "message":
    "Text contrast is below the required threshold.",

  "evidence": [
    "measurement:m001",
    "measurement:m002"
  ]
}
```

---

# 55. Evaluation Trace

每一次评价必须能够追踪：

```text
Finding
 ↓
Evaluation
 ↓
Rule
 ↓
Metric Result
 ↓
Measurement
 ↓
UI Element
```

因此 UIQ 能够回答：

> 为什么这个组件被判定为 FAIL？

最终必须能够追溯到具体颜色、尺寸、位置或排版事实。

---

# 56. Example

假设：

```text
Text color:
#777777

Background:
#FFFFFF
```

计算：

```text
ACCESSIBILITY.CONTRAST = 4.48
```

规则：

```text
contrast >= 4.5
```

则：

```text
4.48 < 4.5
```

Evaluation：

```text
FAIL
```

Finding：

```text
COLOR-CONTRAST-001
```

而不是：

```text
COLOR.CONTRAST = BAD
```

---

# 57. Near Boundary Evaluation

为了避免设计系统长期贴着边界运行，可以定义：

```text
Minimum
Target
Preferred
```

例如：

```text
Minimum = 4.5
Target = 5.0
Preferred = 7.0
```

对应：

```text
< 4.5
    FAIL

4.5–<5.0
    PASS / WARN

5.0–<7.0
    PASS

>= 7.0
    PASS
```

这允许 UIQ 表达：

> 合规不等于设计目标。

---

# 58. Compliance 与 Quality

UIQ 明确区分：

```text
Compliance
```

与：

```text
Design Quality
```

例如：

```text
Contrast = 4.6
```

可能：

```text
Compliance = PASS
```

但：

```text
Design Target = 5.0
```

因此：

```text
Quality Guidance = WARN
```

二者不能混为一谈。

---

# 59. Rule Categories

UIQ V1.0 Rule 分类：

```text
MANDATORY
RECOMMENDED
ADVISORY
```

### MANDATORY

必须满足。

### RECOMMENDED

推荐满足。

### ADVISORY

提供设计指导。

---

# 60. Rule Classification

例如：

```text
ACCESSIBILITY.CONTRAST
```

可以：

```text
MANDATORY
```

而：

```text
SPACING.SCALE_CONFORMANCE
```

可以：

```text
RECOMMENDED
```

---

# 61. Evaluation Output

最终评价可以表达为：

```text
PASS
├── mandatory: 12
├── recommended: 8
└── advisory: 5

FAIL
├── mandatory: 2
└── recommended: 1

WARN
└── advisory: 3
```

但 UIQ 不将其压缩为：

```text
87/100
```

---

# 62. Decision Report

标准报告结构：

```text
UIQ Evaluation Report
│
├── Scope
├── Rule Set
├── Evaluation Summary
│
├── PASS
├── FAIL
├── WARN
├── NOT_APPLICABLE
└── UNKNOWN
│
├── Findings
│
└── Evidence
```

---

# 63. Rule Engine Requirements

UIQ Rule Engine 必须支持：

```text
Rule loading
Rule versioning
Applicability resolution
Operator evaluation
Threshold evaluation
Tolerance evaluation
Composite rules
Finding generation
Decision aggregation
Evaluation trace
```

---

# 64. Determinism Requirements

Rule Engine 不得依赖：

```text
AI model
LLM
randomness
subjective aesthetic judgment
```

作为 V1.0 基础评价机制。

相同输入必须产生相同结果。

---

# 65. Explainability

任何 FAIL 必须能够回答：

```text
What?
Why?
Expected?
Actual?
Rule?
Evidence?
```

例如：

```text
What:
Text contrast violation.

Actual:
3.2

Expected:
>= 4.5

Rule:
COLOR-CONTRAST-001@1.0

Evidence:
foreground + background measurements
```

---

# 66. Relationship with UIQ-MR-01

UIQ-MR-01：

```text
Metric Registry
```

负责：

```text
What can be measured?
```

UIQ-ER-01：

```text
Evaluation Rule
```

负责：

```text
What is acceptable?
```

两者关系：

```text
Metric Registry
      ↓
Metric Result
      ↓
Evaluation Rule
      ↓
Evaluation
```

---

# 67. Relationship with Design Tokens

Design Token 可以同时成为：

```text
Measurement Input
```

和：

```text
Rule Reference
```

例如：

```text
spacing.md = 16px
```

实际值：

```text
17px
```

Metric：

```text
SPACING.TOKEN_DEVIATION = 1px
```

Rule：

```text
TOKEN_DEVIATION <= 0px
```

Evaluation：

```text
FAIL
```

---

# 68. Relationship with Color System

UIQ 可以直接评价：

```text
Color Space
 ↓
Palette
 ↓
Semantic Color
 ↓
Component Color
 ↓
Contrast
 ↓
Rule
 ↓
Evaluation
```

因此 UIQ 不仅能够评价最终 UI，还能够评价：

```text
Theme
Design Token
Semantic Color Mapping
Component Mapping
```

---

# 69. Relationship with Theme Validation

Theme Validation 可以定义为：

```text
Theme
 ↓
Generate MeasurementSnapshot
 ↓
Calculate Metrics
 ↓
Apply RuleSet
 ↓
Evaluation
 ↓
Findings
```

从而实现：

```text
Theme → Validate → Export
```

而不是：

```text
Theme → Export → Manually Check
```

---

# 70. V1.0 Stable Boundary

UIQ-ER-01 V1.0 至此冻结以下核心概念：

```text
Rule
RuleVersion
Operator
Threshold
Tolerance
Applicability
Severity
Evaluation
EvaluationState
Finding
Decision
Evidence
RuleSet
RuleProfile
```

V1.0 不引入：

```text
AI aesthetic judgment
subjective scoring
LLM-based evaluation
automatic design taste
single overall score
complex rule DSL
```

---

# 71. Complete UIQ Evaluation Model

UIQ 至此形成完整的第一条闭环：

```text
                 ┌──────────────┐
                 │      UI      │
                 └──────┬───────┘
                        ↓
                 ┌──────────────┐
                 │ Measurement  │
                 └──────┬───────┘
                        ↓
                 ┌──────────────┐
                 │    Metric    │
                 └──────┬───────┘
                        ↓
                 ┌──────────────┐
                 │     Rule     │
                 └──────┬───────┘
                        ↓
                 ┌──────────────┐
                 │  Evaluation  │
                 └──────┬───────┘
                        ↓
                 ┌──────────────┐
                 │   Finding    │
                 └──────┬───────┘
                        ↓
                 ┌──────────────┐
                 │  Diagnostic  │
                 └──────┬───────┘
                        ↓
                 ┌──────────────┐
                 │Recommendation│
                 └──────────────┘
```

---

# 72. Architectural Principle

UIQ 的核心不是：

> 给 UI 打分。

而是建立：

> **可测量、可计算、可验证、可追溯的 UI 设计评价体系。**

最终形成：

```text
Design
   ↓
Measure
   ↓
Quantify
   ↓
Evaluate
   ↓
Explain
   ↓
Correct
   ↓
Verify
```

这也是 UIQ 后续能够与：

```text
Design Token
Color System
Theme Generator
Radix UI
Component Library
Accessibility
Design Governance
CI/CD
```

进行集成的基础。

---

# 73. Conformance Requirement

UIQ 实现如果声明：

```text
UIQ-ER-01 V1.0 Conformant
```

至少必须：

1. 支持 Rule ID 与 Version。
2. 支持 Numeric Operator。
3. 支持 Threshold。
4. 支持 Tolerance。
5. 支持 Applicability。
6. 支持 PASS / FAIL / WARN / NOT_APPLICABLE / UNKNOWN。
7. 支持 Finding。
8. 支持 Evidence Trace。
9. 支持 RuleSet。
10. 支持 Deterministic Evaluation。
11. 不将 Metric 与 Rule 混合。
12. 不使用单一审美分数作为 V1.0 的核心 Decision。

---

# 74. Versioning

```text
UIQ-ER-01
Version: 1.0
Status: Stable
```

后续版本只有在以下情况下才允许升级：

```text
Semantic defect
Missing mandatory capability
Interoperability requirement
Formal inconsistency
```

不因增加普通 Rule 而升级规范。

新增 Rule 应进入：

```text
Rule Registry
```

而不是不断修改：

```text
Evaluation Model
```

---

# 75. Conclusion

UIQ-ER-01 将 UIQ 的评价层正式冻结为：

```text
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
Decision
```

其中最重要的边界是：

```text
Metric = What is measured

Rule = What is required

Evaluation = Whether requirement is satisfied

Finding = What went wrong

Diagnostic = Why it happened

Recommendation = What may be changed
```

这使 UIQ 从一个“UI 指标集合”真正成为一个：

> **可执行的 UI 设计评价框架。**