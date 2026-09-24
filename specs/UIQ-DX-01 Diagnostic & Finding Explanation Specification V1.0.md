
# UIQ-DX-01
# Diagnostic & Finding Explanation Specification
## V1.0

**Status:** Stable  
**Specification ID:** UIQ-DX-01  
**Parent Specifications:** UIQ-FM-01 / UIQ-MR-01 / UIQ-ER-01  
**Domain:** Diagnostic / Explanation / Remediation  
**Version:** 1.0

---

# 1. Purpose

UIQ-ER-01 已经解决：

> 某个设计规则是否通过？

UIQ-DX-01 进一步解决：

> 为什么没有通过？  
> 问题来自哪里？  
> 哪些设计变量影响了结果？  
> 哪些对象可能受到同一问题影响？  
> 哪些修改方向可以降低问题？

因此 UIQ 的完整链路扩展为：

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
 ↓
Remediation
 ↓
Re-Evaluation
```

---

# 2. Core Principle

UIQ 的 Diagnostic 不负责创造新的“审美判断”。

它只负责：

```text
Evidence
 ↓
Causal Relationship
 ↓
Impact Analysis
 ↓
Explainable Finding
```

因此：

> Diagnostic 是证据驱动的解释层，而不是 AI 审美层。

---

# 3. Diagnostic Model

形式化定义：

```text
Diagnostic =
(
    Finding,
    Evidence,
    Factors,
    Dependencies,
    Impact,
    Explanation,
    RemediationHints
)
```

其中：

| Element | Meaning |
|---|---|
| Finding | 已发现的问题 |
| Evidence | 支持问题的证据 |
| Factors | 影响结果的因素 |
| Dependencies | 相关设计依赖 |
| Impact | 影响范围 |
| Explanation | 可解释原因 |
| RemediationHints | 修复方向 |

---

# 4. Diagnostic Pipeline

```text
Finding
   ↓
Evidence Resolution
   ↓
Factor Identification
   ↓
Dependency Analysis
   ↓
Impact Analysis
   ↓
Cause Classification
   ↓
Explanation
   ↓
Remediation Hint
```

---

# 5. Finding vs Diagnostic

必须严格区分。

## Finding

回答：

> What happened?

例如：

```text
Contrast = 3.2
Required >= 4.5
FAIL
```

## Diagnostic

回答：

> Why did it happen?

例如：

```text
Foreground:
#777777

Background:
#FFFFFF

The foreground luminance is insufficient
for the selected background.
```

---

# 6. Evidence

Diagnostic 必须基于 Evidence。

Evidence 可以来自：

```text
Measurement
Metric
Rule
Token
Component
Theme
Layout
Dependency
```

---

# 7. Evidence Model

```json
{
  "evidenceId": "EV-001",
  "type": "METRIC",
  "sourceId": "ACCESSIBILITY.CONTRAST",
  "value": 3.2,
  "unit": "ratio"
}
```

---

# 8. Evidence Types

UIQ V1.0：

```text
MEASUREMENT
METRIC
RULE
TOKEN
COMPONENT
LAYOUT
THEME
DEPENDENCY
```

---

# 9. Factor

Factor 表示：

> 对 Finding 结果产生可解释影响的设计变量。

例如 Contrast Finding：

```text
Foreground Color
Background Color
```

都是 Factor。

---

# 10. Factor Model

```text
Factor =
(
    id,
    type,
    source,
    value,
    influence
)
```

示例：

```json
{
  "id": "factor-001",
  "type": "COLOR",
  "source": "color.text.secondary",
  "value": "#777777",
  "influence": "PRIMARY"
}
```

---

# 11. Factor Types

V1.0 定义：

```text
COLOR
GEOMETRY
TYPOGRAPHY
SPACING
LAYOUT
TOKEN
COMPONENT
CONTENT
CONTEXT
```

---

# 12. Influence

Factor Influence：

```text
PRIMARY
SECONDARY
CONTRIBUTORY
UNKNOWN
```

例如：

```text
Contrast Finding

Foreground → PRIMARY
Background → PRIMARY
Font Size   → CONTRIBUTORY
Component   → SECONDARY
```

---

# 13. Causal Relationship

UIQ Diagnostic 支持有限因果关系：

```text
CAUSES
CONTRIBUTES_TO
DEPENDS_ON
AFFECTS
DERIVED_FROM
```

例如：

```text
Foreground Color
      ↓
COLOR.CONTRAST
      ↓
Accessibility Rule
      ↓
FAIL
```

---

# 14. 不允许无限因果推理

UIQ V1.0 禁止：

```text
Color → User Emotion
Emotion → Brand Perception
Brand Perception → Business Success
```

因为这些关系通常不是 UIQ Measurement 可以直接证明的。

允许：

```text
Color
 ↓
Contrast
 ↓
Rule
 ↓
Finding
```

---

# 15. Diagnostic Confidence

Diagnostic 可以具有 Confidence。

但 Confidence 表示：

> 对“诊断解释”的证据完整程度。

而不是：

> 对 UI 好坏的信心。

定义：

```text
HIGH
MEDIUM
LOW
UNKNOWN
```

---

# 16. Confidence Rules

### HIGH

直接存在完整证据链：

```text
Measurement
 ↓
Metric
 ↓
Rule
 ↓
Finding
```

并且 Factor 明确。

### MEDIUM

存在合理依赖，但缺少部分直接证据。

### LOW

只能识别潜在因素。

### UNKNOWN

无法建立可靠解释。

---

# 17. Diagnostic Explanation

Explanation 必须能够由 Evidence 生成。

推荐结构：

```text
Observed
Expected
Difference
Affected Factors
Reason
Impact
```

例如：

```text
Observed:
Contrast ratio = 3.2

Expected:
>= 4.5

Difference:
1.3 below threshold

Affected:
Foreground color

Reason:
Foreground luminance is too close
to the background luminance.

Impact:
Text readability requirement is not satisfied.
```

---

# 18. Explanation 不得加入无证据结论

禁止：

```text
The design looks ugly.
```

禁止：

```text
Users will dislike this interface.
```

禁止：

```text
This color feels cheap.
```

允许：

```text
The measured contrast ratio is below
the configured threshold.
```

---

# 19. Diagnostic Categories

UIQ V1.0：

```text
VALUE
RELATIONSHIP
TOKEN
STRUCTURE
CONSISTENCY
ACCESSIBILITY
LAYOUT
TYPOGRAPHY
COLOR
```

---

# 20. VALUE Diagnostic

表示单个值异常。

例如：

```text
Font Size = 11px
Required >= 14px
```

Diagnostic：

```text
Typography value is below the configured minimum.
```

---

# 21. RELATIONSHIP Diagnostic

表示两个或多个对象之间的关系异常。

例如：

```text
Foreground
vs
Background
```

Contrast 不足属于：

```text
RELATIONSHIP
```

---

# 22. TOKEN Diagnostic

表示设计值偏离 Design Token。

例如：

```text
Token:
spacing.md = 16px

Actual:
18px
```

Diagnostic：

```text
Element spacing deviates from the referenced design token.
```

---

# 23. STRUCTURE Diagnostic

表示组件结构违反约束。

例如：

```text
Button
 ├── Icon
 └── Label
```

缺失：

```text
Accessible Label
```

可以形成：

```text
STRUCTURE
```

---

# 24. CONSISTENCY Diagnostic

用于识别重复对象之间的不一致。

例如：

```text
Button A → radius = 8px
Button B → radius = 10px
Button C → radius = 8px
```

如果规范要求统一：

```text
CONSISTENCY
```

---

# 25. Accessibility Diagnostic

用于：

```text
Contrast
Target Size
Focus Visibility
Text Legibility
```

但 Diagnostic 本身不重新定义 Accessibility Rule。

---

# 26. Impact

Finding 不仅需要知道：

> 哪个元素有问题。

还应知道：

> 哪些对象可能被这个问题共同影响。

---

# 27. Impact Model

```text
Impact =
(
    target,
    scope,
    affectedObjects,
    propagation
)
```

---

# 28. Impact Scope

```text
ELEMENT
COMPONENT
REGION
PAGE
THEME
PROJECT
```

例如：

一个错误的 Semantic Token：

```text
color.text.secondary
```

可能影响：

```text
Button
Card
Table
Form
Tooltip
```

最终 Impact：

```text
THEME
```

---

# 29. Dependency Graph

UIQ 可以建立设计依赖图：

```text
Primitive Token
      ↓
Semantic Token
      ↓
Component Token
      ↓
Component
      ↓
Page
      ↓
Theme
```

例如：

```text
color.blue.500
      ↓
color.primary
      ↓
button.primary.background
      ↓
Button
      ↓
Dashboard
```

---

# 30. Root Cause

Root Cause 在 UIQ 中必须谨慎定义。

UIQ V1.0 将 Root Cause 定义为：

> 在当前证据范围内，能够直接解释 Finding 的最底层可观测设计变量。

例如：

```text
Finding:
Contrast FAIL

Root Cause:
Foreground token value
```

而不是：

```text
Root Cause:
Designer selected wrong color.
```

---

# 31. Root Cause Types

```text
TOKEN_VALUE
ELEMENT_VALUE
COMPONENT_CONFIGURATION
THEME_CONFIGURATION
LAYOUT_CONFIGURATION
MISSING_VALUE
INVALID_REFERENCE
INCONSISTENT_VALUE
UNKNOWN
```

---

# 32. Root Cause Example

```text
Finding:
button.primary.text contrast < 4.5

Dependency:
button.primary.text
    ↓
color.text.onPrimary
    ↓
color.neutral.900
```

如果最终发现：

```text
color.neutral.900
```

是导致问题的最底层可观测变量：

```text
Root Cause:
TOKEN_VALUE
```

---

# 33. Shared Root Cause

UIQ 必须支持：

> 一个根因产生多个 Finding。

例如：

```text
color.text.secondary
       ↓
 ┌─────┼─────┐
 ↓     ↓     ↓
Card  Table  Form
 ↓     ↓     ↓
FAIL  FAIL  FAIL
```

系统应该将其识别为：

```text
Shared Root Cause
```

而不是产生三个完全独立的问题。

---

# 34. Finding Deduplication

相同 Root Cause 可以聚合：

```text
Finding F001
Finding F002
Finding F003
```

聚合：

```text
RootCause RC001
```

最终报告：

```text
1 Root Cause
3 Affected Components
```

---

# 35. Diagnostic Graph

UIQ 可以建立：

```text
Design Dependency Graph
```

与：

```text
Evaluation Graph
```

两个图。

---

# 36. Design Dependency Graph

```text
Token
 ↓
Semantic Token
 ↓
Component Token
 ↓
Component
 ↓
Page
```

---

# 37. Evaluation Graph

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
Diagnostic
```

---

# 38. Combined Graph

最终：

```text
             Design Graph
                  │
                  ↓
Token → Component → Element
                  │
                  ↓
             Measurement
                  │
                  ↓
               Metric
                  │
                  ↓
                Rule
                  │
                  ↓
             Evaluation
                  │
                  ↓
               Finding
                  │
                  ↓
             Diagnostic
```

这使 UIQ 能够将：

> “哪个设计变量导致了哪个评价问题”

连接起来。

---

# 39. Remediation Hint

Diagnostic 可以产生：

```text
RemediationHint
```

但不是自动修改。

定义：

```text
RemediationHint =
(
    target,
    action,
    rationale,
    constraints
)
```

---

# 40. Remediation Actions

V1.0：

```text
INCREASE
DECREASE
REPLACE
ALIGN
NORMALIZE
REFERENCE_TOKEN
REMOVE
ADD
ADJUST
```

---

# 41. Example

```json
{
  "target": "color.text.secondary",
  "action": "ADJUST",
  "rationale":
    "Increase contrast against the configured background.",
  "constraints": {
    "minimumContrast": 4.5
  }
}
```

---

# 42. Recommendation 不得直接替代 Decision

错误：

```text
AI recommends darker gray
→ therefore design is fixed
```

正确：

```text
Finding
 ↓
Diagnostic
 ↓
Remediation Hint
 ↓
Human / Tool Modification
 ↓
Re-measure
 ↓
Re-evaluate
```

---

# 43. Remediation Loop

完整闭环：

```text
Evaluate
   ↓
Finding
   ↓
Diagnose
   ↓
Suggest
   ↓
Modify
   ↓
Measure
   ↓
Evaluate
```

这形成：

```text
UIQ Quality Loop
```

---

# 44. Before / After

UIQ 应支持修复前后比较。

例如：

```text
Before:
Contrast = 3.2
FAIL

After:
Contrast = 5.1
PASS
```

记录：

```text
Evaluation Delta
```

---

# 45. Diagnostic Delta

可以进一步记录：

```text
Metric Before
Metric After
Rule Before
Rule After
Finding Before
Finding After
```

例如：

```json
{
  "metric": "ACCESSIBILITY.CONTRAST",
  "before": 3.2,
  "after": 5.1,
  "delta": 1.9
}
```

---

# 46. Regression Detection

修复一个问题可能产生另一个问题。

例如：

```text
Contrast
   ↓
PASS
```

但修改颜色后：

```text
Brand Palette Relationship
   ↓
FAIL
```

因此每次修改后必须允许：

```text
Re-Evaluation
```

而不是只重新执行原来的 Rule。

---

# 47. Diagnostic Report

标准报告：

```text
Finding
 ├── Severity
 ├── Rule
 ├── Actual
 ├── Expected
 │
 ├── Evidence
 │
 ├── Factors
 │
 ├── Root Cause
 │
 ├── Impact
 │
 ├── Explanation
 │
 └── Remediation Hints
```

---

# 48. Example Diagnostic

```text
Finding
--------------------------------
ID:
F-000123

Rule:
COLOR-CONTRAST-001@1.0

Actual:
3.2

Expected:
>= 4.5

Severity:
ERROR

Category:
ACCESSIBILITY


Evidence
--------------------------------
Foreground:
#777777

Background:
#FFFFFF

Contrast:
3.2


Factors
--------------------------------
Foreground Color: PRIMARY
Background Color: PRIMARY


Root Cause
--------------------------------
TOKEN_VALUE

Source:
color.text.secondary


Impact
--------------------------------
Button
Card
Table


Explanation
--------------------------------
The configured secondary text color
does not provide sufficient contrast
against the selected background.


Remediation
--------------------------------
Adjust the semantic text color while
maintaining the configured contrast threshold.
```

---

# 49. Explainability Requirements

每个 Diagnostic 至少必须回答：

```text
WHAT
WHY
WHERE
EVIDENCE
IMPACT
```

如果可以确定：

```text
ROOT CAUSE
```

则必须提供。

如果无法确定：

```text
ROOT CAUSE = UNKNOWN
```

禁止猜测。

---

# 50. Diagnostic Quality Levels

UIQ 不对设计质量打分，但可以描述诊断完整程度：

```text
DIRECT
TRACEABLE
PARTIAL
UNRESOLVED
```

### DIRECT

Finding 可以直接由 Measurement 解释。

### TRACEABLE

需要沿依赖图追踪。

### PARTIAL

只能确定部分原因。

### UNRESOLVED

无法建立可靠原因。

---

# 51. AI Integration Boundary

UIQ 未来可以使用 AI。

但是 AI 默认位于：

```text
Diagnostic Assistance
```

而不是：

```text
Measurement
Metric
Rule
Decision
```

允许：

```text
LLM
 ↓
Explanation Draft
```

但最终解释必须引用：

```text
Evidence
```

---

# 52. AI Diagnostic Constraint

AI 不得生成：

```text
unsupported root cause
```

例如：

```text
"Designer chose this color because..."
```

除非存在明确证据。

AI 可以生成：

```text
"The measured contrast is below the configured threshold,
primarily due to the luminance relationship between the
foreground and background colors."
```

因为这是由 Metric 与 Rule 可验证的。

---

# 53. Automated Remediation Boundary

UIQ V1.0 不定义自动修改。

只定义：

```text
RemediationHint
```

未来工具可以实现：

```text
Suggestion
 ↓
Preview
 ↓
Apply
 ↓
Re-Evaluate
```

而不是：

```text
FAIL
 ↓
Automatic Rewrite
```

---

# 54. API Concept

建议接口：

```text
POST /uiq/evaluate
POST /uiq/diagnostics
GET  /uiq/findings/{id}
GET  /uiq/findings/{id}/evidence
GET  /uiq/findings/{id}/impact
GET  /uiq/findings/{id}/diagnostic
POST /uiq/re-evaluate
```

UIQ 本身不要求后端。

这些 API 是：

> 可选的 Runtime Integration Layer。

---

# 55. TypeScript Domain Model

```ts
interface Diagnostic {
  findingId: string;

  category: DiagnosticCategory;

  evidence: Evidence[];

  factors: Factor[];

  rootCause?: RootCause;

  impact?: Impact;

  explanation: Explanation;

  remediationHints?: RemediationHint[];

  confidence: DiagnosticConfidence;
}
```

---

# 56. Root Cause Model

```ts
interface RootCause {
  type: RootCauseType;

  targetId: string;

  evidenceIds: string[];

  confidence: DiagnosticConfidence;
}
```

---

# 57. Diagnostic Graph Model

```ts
interface DiagnosticRelation {
  sourceId: string;

  targetId: string;

  relation:
    | "CAUSES"
    | "CONTRIBUTES_TO"
    | "DEPENDS_ON"
    | "AFFECTS"
    | "DERIVED_FROM";
}
```

---

# 58. Diagnostic Invariants

## DX-INV-001

Diagnostic 必须引用 Finding。

```text
Diagnostic.findingId != null
```

## DX-INV-002

Diagnostic 必须具有 Evidence。

```text
evidence.length >= 1
```

## DX-INV-003

Root Cause 不得没有 Evidence。

## DX-INV-004

UNKNOWN 不得被转换为确定性 Root Cause。

## DX-INV-005

Recommendation 不得修改 Evaluation Result。

## DX-INV-006

Diagnostic 不得覆盖原始 Measurement。

---

# 59. Conformance

声明：

```text
UIQ-DX-01 V1.0 Conformant
```

至少必须支持：

1. Finding → Diagnostic。
2. Evidence Trace。
3. Factor。
4. Impact。
5. Explanation。
6. Root Cause。
7. Confidence。
8. Remediation Hint。
9. Shared Root Cause。
10. Re-Evaluation。
11. Regression Detection。
12. Diagnostic 不得覆盖原始 Evaluation。

---

# 60. V1.0 Stable Boundary

UIQ-DX-01 V1.0 正式冻结：

```text
Diagnostic
Evidence
Factor
Influence
Causal Relationship
Root Cause
Impact
Explanation
Confidence
Remediation Hint
Diagnostic Graph
Re-Evaluation
Regression Detection
```

不引入：

```text
Aesthetic AI Score
Emotion Prediction
User Preference Prediction
Purchase Prediction
Automatic Design Judgment
Automatic UI Rewrite
```

---

# 61. UIQ Architecture After DX-01

至此 UIQ 已形成：

```text
┌───────────────────────────────┐
│          UI / Theme            │
└───────────────┬───────────────┘
                ↓
┌───────────────────────────────┐
│        Measurement Layer       │
└───────────────┬───────────────┘
                ↓
┌───────────────────────────────┐
│          Metric Layer          │
└───────────────┬───────────────┘
                ↓
┌───────────────────────────────┐
│           Rule Layer           │
└───────────────┬───────────────┘
                ↓
┌───────────────────────────────┐
│        Evaluation Layer        │
└───────────────┬───────────────┘
                ↓
┌───────────────────────────────┐
│         Finding Layer          │
└───────────────┬───────────────┘
                ↓
┌───────────────────────────────┐
│        Diagnostic Layer        │
└───────────────┬───────────────┘
                ↓
┌───────────────────────────────┐
│      Remediation Guidance      │
└───────────────┬───────────────┘
                ↓
           Re-Evaluation
```

---

# 62. Core Semantic Boundary

UIQ 到此形成六个稳定语义层：

```text
Measurement
    =
事实

Metric
    =
量化属性

Rule
    =
要求

Evaluation
    =
判断

Finding
    =
问题

Diagnostic
    =
原因解释
```

再往下一层：

```text
Remediation
    =
修改方向
```

但 Remediation 不属于“评价真值”。

---

# 63. Final Principle

UIQ 不试图回答：

> “这个 UI 好不好看？”

而是逐步回答：

```text
它是什么？
    ↓
它的颜色/尺寸/间距/结构是多少？
    ↓
这些属性之间是什么关系？
    ↓
是否满足明确规则？
    ↓
哪里存在问题？
    ↓
问题影响哪些对象？
    ↓
哪些可观测变量造成问题？
    ↓
如何修改后再次验证？
```

因此 UIQ 的核心价值不是：

```text
AI Judge UI
```

而是：

```text
Quantifiable
+
Traceable
+
Explainable
+
Reproducible
+
Verifiable
```

最终形成：

> **UI Design Quality Engineering**

而不是传统意义上的：

> **UI Aesthetic Scoring**

---

# 64. Specification Status

```text
UIQ-FM-01   Formal Measurement & Metric Model       Stable
UIQ-MR-01   Metric Registry                        Stable
UIQ-ER-01   Evaluation Rule & Decision             Stable
UIQ-DX-01   Diagnostic & Finding Explanation       Stable
```

下一层不再继续扩张 Metric，而应进入 **UIQ-TK-01 Design Token & Theme Conformance Specification**，把前面建立的 Color / Typography / Spacing / Component 评价体系真正连接到 Design Token、Semantic Token、Theme 和主题导出体系。