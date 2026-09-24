# UIQ-IMPL-08
# Finding & Diagnostic Runtime Implementation Specification V1.0

**Status:** Frozen  
**Version:** 1.0.0  
**Phase:** Phase 6  
**Previous:** UIQ-IMPL-07 Browser Measurement Adapter Implementation Specification V1.0  
**Next:** UIQ-IMPL-09 Token & Theme Conformance Runtime Implementation Specification V1.0

---

# 1. 文档目的

本规范定义 UIQ Finding 与 Diagnostic Runtime 的实际实现。

此前 UIQ 已形成：

```text
REAL UI
    ↓
Measurement
    ↓
Metric
    ↓
Rule
    ↓
Evaluation
```

本阶段继续：

```text
EvaluationResult
       ↓
Finding
       ↓
Evidence
       ↓
Diagnostic
       ↓
Root Cause
       ↓
Impact Trace
```

最终形成：

```text
REAL UI
   ↓
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
```

---

# 2. 核心原则

## 2.1 Finding 是问题记录

Finding 回答：

> **哪里存在需要关注的 Evaluation 结果？**

---

## 2.2 Diagnostic 是解释

Diagnostic 回答：

> **为什么会产生这个 Finding？**

---

## 2.3 Recommendation 不是 Diagnostic

Recommendation 回答：

> **可以采取什么行动？**

因此：

```text
Finding
   ↓
Diagnostic
   ↓
Recommendation
```

三个概念不能合并。

---

# 3. 严格职责边界

```text
Metric
    = 计算

Rule
    = 判断

Evaluation
    = 产生状态

Finding
    = 记录问题

Diagnostic
    = 解释问题

Recommendation
    = 提供行动建议
```

---

# 4. Finding 创建条件

默认情况下：

```text
FAIL → Finding
WARN → Finding
```

而：

```text
PASS
```

不创建 Finding。

---

# 5. UNKNOWN

默认：

```text
UNKNOWN
```

不直接创建普通 Finding。

但可以配置：

```text
UNKNOWN → INFORMATIONAL FINDING
```

例如：

```text
“Contrast could not be evaluated because background is a complex gradient.”
```

此类 Finding 必须明确标记为：

```text
UNKNOWN_CAUSE
```

不能伪装成：

```text
FAIL
```

---

# 6. ERROR

```text
ERROR
```

可以创建：

```text
EXECUTION_ERROR
```

类型的 Finding。

例如：

```text
Metric execution failed
Rule configuration invalid
```

---

# 7. Finding Type

沿用 Core Contract：

```ts
export type FindingType =
  | "VALUE_VIOLATION"
  | "ACCESSIBILITY"
  | "TOKEN_DEVIATION"
  | "COMPONENT_DEVIATION"
  | "THEME_DEVIATION"
  | "LAYOUT_RELATIONSHIP"
  | "TYPOGRAPHY"
  | "COLOR"
  | "UNKNOWN_CAUSE"
  | "EXECUTION_ERROR";
```

---

# 8. Finding State

```text
DETECTED
DIAGNOSED
RESOLVED
VERIFIED
```

状态生命周期：

```text
DETECTED
   ↓
DIAGNOSED
   ↓
RESOLVED
   ↓
VERIFIED
```

---

# 9. Finding State 语义

| State | 含义 |
|---|---|
| DETECTED | 已发现 |
| DIAGNOSED | 已产生诊断 |
| RESOLVED | 问题已被处理 |
| VERIFIED | 重新验证确认解决 |

---

# 10. Finding Identity

Finding 必须具有：

```text
id
fingerprint
```

其中：

```text
id
```

用于对象标识。

```text
fingerprint
```

用于识别：

> 是否为同一个逻辑问题。

---

# 11. Finding Fingerprint

推荐：

```text
SHA-256(
  subjectId
  +
  ruleId
  +
  ruleVersion
  +
  metricId
  +
  metricVersion
  +
  relevant evaluation state
  +
  relevant evidence
)
```

---

# 12. 为什么需要 Fingerprint

假设连续执行：

```text
Run 1
Run 2
Run 3
```

同一个按钮一直违反：

```text
Contrast Rule
```

不能产生三个无法关联的问题：

```text
Finding-001
Finding-002
Finding-003
```

应该识别为：

```text
same logical finding
```

---

# 13. Finding Contract

```ts
export interface Finding {
  id: string;

  fingerprint: string;

  type: FindingType;

  state: FindingState;

  severity: Severity;

  subjectId: string;

  evaluation: EvaluationResult;

  evidence: Evidence[];

  createdAt: string;

  updatedAt: string;
}
```

---

# 14. Finding Factory

建议：

```ts
export interface FindingFactory {
  create(
    evaluation: EvaluationResult
  ): Finding | null;
}
```

默认：

```text
PASS → null
FAIL → Finding
WARN → Finding
UNKNOWN → configurable
ERROR → Finding
```

---

# 15. Finding Type Mapping

默认映射：

| Rule Domain | Finding Type |
|---|---|
| Accessibility | ACCESSIBILITY |
| Color | COLOR |
| Typography | TYPOGRAPHY |
| Layout | LAYOUT_RELATIONSHIP |
| Token | TOKEN_DEVIATION |
| Component | COMPONENT_DEVIATION |
| Theme | THEME_DEVIATION |
| Execution | EXECUTION_ERROR |
| Unknown | UNKNOWN_CAUSE |

---

# 16. Finding 不修改 Evaluation

例如：

```text
Evaluation = FAIL
```

创建：

```text
Finding
```

后：

```text
Evaluation
```

仍然：

```text
FAIL
```

Diagnostic 不能把：

```text
FAIL → PASS
```

也不能：

```text
FAIL → UNKNOWN
```

---

# 17. Evidence

Evidence 是 Finding 与 Diagnostic 的事实基础。

支持：

```text
METRIC
MEASUREMENT
TOKEN
DOM
RULE_CONFIGURATION
```

---

# 18. Evidence Graph

定义：

```text
EvidenceGraph = (N, E)
```

Node：

```text
DOM
MEASUREMENT
METRIC
TOKEN
COMPONENT
THEME
RULE
CONFIGURATION
```

---

# 19. Evidence Relations

支持：

```text
MEASURED_FROM
DERIVED_FROM
EVALUATED_BY
RESOLVED_FROM
DEFINED_BY
USED_BY
OVERRIDES
DEVIATES_FROM
```

---

# 20. Evidence Graph 示例

Contrast Finding：

```text
DOM Element
    │
    ▼
Measurement
    │
    ▼
COLOR.CONTRAST
    │
    ▼
Evaluation
    │
    ▼
Rule
```

更准确地表示为：

```text
Finding
   │
   ├── caused-by → Evaluation
   │                  │
   │                  ├── evaluated-by → Rule
   │                  │
   │                  └── derived-from → Metric
   │                                      │
   │                                      └── derived-from → Measurement
   │                                                          │
   │                                                          └── measured-from → DOM
```

---

# 21. Diagnostic Contract

已有：

```ts
export interface Diagnostic {
  id: string;

  findingId: string;

  type: DiagnosticType;

  cause: DiagnosticCause;

  confidence: DiagnosticConfidence;

  evidence: Evidence[];

  explanation: string;
}
```

---

# 22. Diagnostic Type

```text
VALUE_VIOLATION
TOKEN_DEVIATION
COMPONENT_DEVIATION
THEME_DEVIATION
LAYOUT_RELATIONSHIP
ACCESSIBILITY
TYPOGRAPHY
COLOR
UNKNOWN_CAUSE
EXECUTION_ERROR
```

---

# 23. Diagnostic Cause

```text
MEASUREMENT
METRIC
TOKEN
COMPONENT
THEME
CONFIGURATION
UNKNOWN
```

---

# 24. Confidence

支持：

```text
DIRECT
SUPPORTED
INFERRED
UNKNOWN
```

---

# 25. Confidence 语义

### DIRECT

证据直接支持原因。

例如：

```text
Token value
=
Actual computed value
```

---

### SUPPORTED

存在多个证据共同支持。

例如：

```text
Component Token
↓
Semantic Token
↓
Rendered Element
```

---

### INFERRED

原因通过多个关系推导得到。

必须明确标记：

```text
INFERRED
```

不能当作事实。

---

### UNKNOWN

没有足够证据确定原因。

---

# 26. Diagnostic Engine

定义：

```ts
export interface DiagnosticEngine {
  diagnose(
    finding: Finding,
    context: DiagnosticContext
  ): Diagnostic[];
}
```

---

# 27. Diagnostic Context

```ts
export interface DiagnosticContext {
  measurements: Measurement[];
  metricResults: MetricResult<unknown>[];
  evaluations: EvaluationResult[];
  evidence: Evidence[];
}
```

未来 Token/Theme 阶段还可以增加：

```text
tokens
components
themes
```

---

# 28. Diagnostic Engine 不重新计算 Metric

Diagnostic 不允许：

```text
重新执行 COLOR.CONTRAST
```

也不允许：

```text
重新读取 DOM
```

应该直接使用：

```text
已有 Evidence
```

---

# 29. Diagnostic Pipeline

```text
Finding
   ↓
Collect Evidence
   ↓
Classify Diagnostic Type
   ↓
Identify Cause Candidates
   ↓
Build Evidence Chain
   ↓
Determine Confidence
   ↓
Generate Explanation
   ↓
Diagnostic
```

---

# 30. Cause Candidate

允许一个 Finding 有多个：

```text
CauseCandidate
```

例如：

```text
Token
Component
Theme
```

---

# 31. Root Cause Candidate

定义：

```ts
export interface RootCauseCandidate {
  type:
    | "MEASUREMENT"
    | "METRIC"
    | "TOKEN"
    | "COMPONENT"
    | "THEME"
    | "CONFIGURATION"
    | "UNKNOWN";

  id: string;

  confidence:
    | "DIRECT"
    | "SUPPORTED"
    | "INFERRED"
    | "UNKNOWN";

  evidence: Evidence[];
}
```

---

# 32. 不强制单一 Root Cause

一个 Finding 可以：

```text
Finding
 ├── Cause A
 ├── Cause B
 └── Cause C
```

因为真实 UI 问题可能存在多个贡献因素。

UIQ 不应强行：

```text
一个 Finding = 一个 Root Cause
```

---

# 33. Root Cause 不可凭空推断

如果只有：

```text
contrast = 3.2
```

UIQ 可以确定：

```text
Rule FAIL
```

但不能仅凭这个结果声称：

```text
“设计师选错了 Token”
```

因为没有 Token Evidence。

---

# 34. Diagnostic Evidence Requirement

Diagnostic 必须能够回答：

```text
Why?
Based on what?
Where?
```

如果证据不足：

```text
UNKNOWN
```

---

# 35. Color Diagnostic

例如：

```text
COLOR.CONTRAST = 3.2
```

Diagnostic 可以拆解：

```text
Foreground L
Foreground C
Foreground H

Background L
Background C
Background H

Contrast
```

但不能自动得出：

```text
“应该改成蓝色”
```

---

# 36. Dirty Color Diagnostic

“颜色脏”不是：

```text
DIRTY_COLOR
```

Metric。

Diagnostic 可以描述：

```text
low chroma
+
mid lightness
+
insufficient contrast
```

例如：

```text
Color diagnostic:
- Lightness: 0.62
- Chroma: 0.018
- Contrast: 2.8
- Gamut: in sRGB
```

从而把：

```text
“脏”
```

转换成：

```text
可测量事实组合
```

---

# 37. Typography Diagnostic

例如：

```text
FONT_SIZE = 13px
```

Rule：

```text
>= 16px
```

Diagnostic：

```text
type = TYPOGRAPHY
cause = MEASUREMENT
```

解释：

```text
Computed font size is 13px,
while the configured minimum is 16px.
```

---

# 38. Layout Diagnostic

例如：

```text
two components
```

存在：

```text
alignment deviation
```

Diagnostic 可以引用：

```text
CENTER_DISTANCE
EDGE_DISTANCE
GRID_ALIGNMENT
```

解释：

```text
Element A and Element B
do not share the expected alignment axis.
```

---

# 39. Token Diagnostic

Token 阶段完成后：

```text
Rendered Value
      ↓
Component Token
      ↓
Semantic Token
      ↓
Primitive Token
```

如果：

```text
Rendered Value ≠ Expected Token Value
```

Diagnostic 可以指出：

```text
TOKEN_DEVIATION
```

---

# 40. Token Root Cause

例如：

```text
Button background
       ↓
Component Token
       ↓
Semantic Token
       ↓
Primitive Token
```

如果 Primitive Token 修改会影响：

```text
Button A
Button B
Card
Input
```

Diagnostic 可以生成：

```text
Impact Trace
```

---

# 41. Impact Trace

Impact Trace 不等于 Finding。

定义：

> 描述修改某个 Token、Component 或 Theme 后可能影响哪些对象。

例如：

```text
Primitive Token
   ↓
Semantic Token
   ↓
Component Token
   ↓
Button
Input
Card
```

---

# 42. Impact Trace Contract

```ts
export interface ImpactTrace {
  rootId: string;

  nodes: ImpactNode[];

  edges: ImpactEdge[];
}
```

---

# 43. Impact Node

```ts
export interface ImpactNode {
  id: string;

  type:
    | "TOKEN"
    | "COMPONENT"
    | "THEME"
    | "ELEMENT";
}
```

---

# 44. Impact Edge

```ts
export interface ImpactEdge {
  from: string;

  to: string;

  relation:
    | "REFERENCES"
    | "USED_BY"
    | "OVERRIDES"
    | "RESOLVES_TO";
}
```

---

# 45. Finding Fingerprint 与 Impact Trace

二者必须分开。

```text
Finding Fingerprint
=
问题身份
```

```text
Impact Trace
=
潜在影响关系
```

不能把：

```text
Impact Trace
```

当作：

```text
Finding
```

---

# 46. Finding Lifecycle

默认：

```text
DETECTED
```

产生 Diagnostic：

```text
DETECTED → DIAGNOSED
```

修复后：

```text
DIAGNOSED → RESOLVED
```

重新执行 UIQ：

```text
RESOLVED → VERIFIED
```

---

# 47. Verification

验证必须重新执行：

```text
Measurement
→ Metric
→ Rule
```

不能只修改 Finding 状态：

```text
Finding → VERIFIED
```

必须有新的 Evaluation Evidence。

---

# 48. Revalidation

例如第一次：

```text
Contrast = 4.48
Rule = FAIL
```

修改 UI：

```text
Contrast = 5.20
```

重新执行：

```text
Rule = PASS
```

才能：

```text
Finding = VERIFIED
```

---

# 49. Finding Persistence

V1.0 Runtime 不强制数据库。

可以使用：

```text
InMemoryFindingStore
```

定义：

```ts
export interface FindingStore {
  save(finding: Finding): void;

  getById(id: string): Finding | undefined;

  getByFingerprint(
    fingerprint: string
  ): Finding | undefined;

  list(): Finding[];
}
```

---

# 50. Finding Deduplication

新 Evaluation：

```text
FAIL
```

生成 Fingerprint。

如果已有：

```text
same fingerprint
```

则更新：

```text
updatedAt
```

而不是创建重复 Finding。

---

# 51. Finding Resolution

如果新的 Evaluation：

```text
PASS
```

对应旧 Finding：

```text
FAIL
```

则可以标记：

```text
RESOLVED
```

但：

```text
VERIFIED
```

需要根据 Verification Policy 明确确认。

---

# 52. Finding Regression

如果：

```text
Finding
RESOLVED
```

之后再次：

```text
FAIL
```

可以产生：

```text
REGRESSION
```

或者恢复：

```text
DETECTED
```

具体历史语义由 Regression Engine 管理。

---

# 53. Diagnostic Explanation

Explanation 必须：

```text
事实化
可追溯
不夸大
```

例如：

```text
The computed contrast ratio is 4.48,
while the configured minimum is 4.5.
```

而不是：

```text
The designer chose a bad color.
```

---

# 54. Diagnostic 不做设计推荐

禁止：

```text
Change #777 to #666
```

作为 Diagnostic 的强制输出。

可以由未来：

```text
Recommendation Engine
```

基于明确目标生成候选方案。

---

# 55. AI Diagnostic

未来可以增加：

```text
AI-assisted explanation
```

但：

```text
AI
```

不能覆盖：

```text
Metric
Rule
Evaluation
```

Canonical chain 永远是：

```text
Measurement
→ Metric
→ Rule
→ Evaluation
```

AI 只能：

```text
辅助解释
```

不能：

```text
修改事实
```

---

# 56. Diagnostic Runtime Package

```text
packages/diagnostic/
├── src/
│   ├── finding/
│   │   ├── FindingFactory.ts
│   │   ├── FindingStore.ts
│   │   └── FindingDeduplicator.ts
│   │
│   ├── evidence/
│   │   ├── EvidenceGraph.ts
│   │   ├── EvidenceNode.ts
│   │   └── EvidenceEdge.ts
│   │
│   ├── diagnostic/
│   │   ├── DiagnosticEngine.ts
│   │   ├── DiagnosticContext.ts
│   │   └── DiagnosticBuilder.ts
│   │
│   ├── cause/
│   │   ├── RootCauseCandidate.ts
│   │   └── CauseResolver.ts
│   │
│   ├── impact/
│   │   ├── ImpactTrace.ts
│   │   └── ImpactAnalyzer.ts
│   │
│   ├── fingerprint/
│   │   └── findingFingerprint.ts
│   │
│   └── index.ts
│
└── tests/
    ├── finding/
    ├── evidence/
    ├── diagnostic/
    ├── cause/
    ├── impact/
    └── integration/
```

---

# 57. Package Dependencies

```text
@uiq/diagnostic
        ↓
     @uiq/core
```

V1.0 可以消费：

```text
MetricResult
EvaluationResult
Evidence
```

但不应该依赖：

```text
React
Vue
Radix
Browser
```

---

# 58. Finding Creation Example

输入：

```text
COLOR.CONTRAST = 4.48
```

Rule：

```text
minimum = 4.5
```

Evaluation：

```text
FAIL
```

Finding：

```json
{
  "type": "ACCESSIBILITY",
  "state": "DETECTED",
  "severity": "HIGH"
}
```

---

# 59. Diagnostic Example

```json
{
  "type": "ACCESSIBILITY",
  "cause": "MEASUREMENT",
  "confidence": "DIRECT",
  "explanation":
    "The computed contrast ratio is 4.48, below the configured minimum of 4.5."
}
```

---

# 60. Token Diagnostic Example

假设：

```text
Expected:
semantic.color.primary = #2563EB

Rendered:
#1D4ED8
```

且 Evidence 表明：

```text
Button Token
→ Semantic Token
```

则：

```text
Diagnostic Type:
TOKEN_DEVIATION

Cause:
TOKEN

Confidence:
DIRECT
```

---

# 61. Theme Diagnostic Example

如果：

```text
Light Theme
```

正常：

```text
PASS
```

但：

```text
Dark Theme
```

出现：

```text
FAIL
```

Diagnostic：

```text
THEME_DEVIATION
```

并指出：

```text
Theme = dark
```

不能将：

```text
light PASS
```

用于掩盖：

```text
dark FAIL
```

---

# 62. Evidence Completeness

每个 Diagnostic 至少应该能够回溯：

```text
Diagnostic
   ↓
Finding
   ↓
Evaluation
   ↓
Rule
   ↓
Metric
   ↓
Measurement
```

如果中间节点缺失：

```text
UNKNOWN
```

---

# 63. Explainability Contract

UIQ 必须能够回答：

```text
What?
```

由：

```text
Finding
```

回答。

```text
Which rule?
```

由：

```text
Evaluation
```

回答。

```text
What value?
```

由：

```text
MetricResult
```

回答。

```text
Where did it come from?
```

由：

```text
Measurement
```

回答。

```text
Why?
```

由：

```text
Diagnostic
```

回答。

```text
What else may be affected?
```

由：

```text
ImpactTrace
```

回答。

---

# 64. 测试规范

必须覆盖：

```text
Finding creation
Finding fingerprint
Deduplication
Lifecycle
Evidence graph
Diagnostic cause
Confidence
Unknown cause
Impact trace
Revalidation
Regression
```

---

# 65. Finding Tests

### FINDING-001

PASS 不创建 Finding。

### FINDING-002

FAIL 创建 Finding。

### FINDING-003

WARN 创建 Finding。

### FINDING-004

ERROR 创建 Execution Error Finding。

### FINDING-005

UNKNOWN 按配置处理。

---

# 66. Deduplication Tests

两次：

```text
same Evaluation
```

要求：

```text
same Finding fingerprint
```

不能生成两个独立逻辑问题。

---

# 67. Evidence Tests

必须验证：

```text
Finding
→ Evaluation
→ Metric
→ Measurement
→ DOM
```

链路完整。

---

# 68. Cause Tests

至少覆盖：

```text
MEASUREMENT
METRIC
TOKEN
COMPONENT
THEME
CONFIGURATION
UNKNOWN
```

---

# 69. Confidence Tests

必须覆盖：

```text
DIRECT
SUPPORTED
INFERRED
UNKNOWN
```

并验证：

```text
INFERRED
```

不会被序列化为：

```text
DIRECT
```

---

# 70. Revalidation Test

第一次：

```text
FAIL
```

创建 Finding。

第二次：

```text
PASS
```

要求：

```text
Finding → RESOLVED / VERIFIED
```

必须有新的 Evaluation Evidence。

---

# 71. Acceptance Criteria

## AC-DIAG-01

FAIL/WARN 能够生成 Finding。

## AC-DIAG-02

Finding 具有稳定 Fingerprint。

## AC-DIAG-03

Finding 可以去重。

## AC-DIAG-04

Diagnostic 可以引用 Evidence。

## AC-DIAG-05

Diagnostic 可以追溯到 Measurement。

## AC-DIAG-06

Root Cause 支持多个候选。

## AC-DIAG-07

Evidence 不足时使用 UNKNOWN。

## AC-DIAG-08

INFERRED 原因必须显式标识。

## AC-DIAG-09

Diagnostic 不修改 Evaluation。

## AC-DIAG-10

Diagnostic 不重新计算 Metric。

## AC-DIAG-11

Impact Trace 不等同于 Finding。

## AC-DIAG-12

Verification 必须基于新的 Evaluation Evidence。

---

# 72. Phase 6 完成状态

现在 UIQ 已形成：

```text
REAL UI
   ↓
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
```

UIQ 已经能够从：

> “这个界面违反了什么规则？”

进一步回答：

> “具体哪里违反了？”

> “违反的是哪条规则？”

> “依据是什么？”

> “能追溯到哪个 Measurement？”

> “是否能够确定 Token / Component / Theme 是原因？”

> “如果修改某个 Token，可能影响哪些对象？”

---

# 73. 当前架构冻结状态

到 Phase 6 为止，仍然没有增加新的 Core Architecture Layer。

完整骨架保持：

```text
Browser
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

```text
Color
Typography
Geometry
Token
Theme
```

都是这个骨架上的专业能力，而不是新的架构层。

---

# 74. 下一阶段

进入：

```text
UIQ-IMPL-09
Token & Theme Conformance Runtime Implementation Specification V1.0
```

重点实现：

```text
Design Token
      ↓
Token Reference Graph
      ↓
Token Resolution
      ↓
Semantic Token
      ↓
Component Token
      ↓
Theme
      ↓
Rendered UI
      ↓
TOKEN_MATCH
      ↓
TOKEN_DEVIATION
      ↓
COMPONENT_CONFORMANCE
      ↓
THEME_CONFORMANCE
```

这一阶段会把此前已经定义的 **Token / Theme Conformance** 真正接入执行链，并与本阶段的：

```text
Finding
Diagnostic
Impact Trace
```

打通。

最终形成 UIQ V1.0 最重要的一条治理链：

```text
Theme
   ↓
Token
   ↓
Component
   ↓
Rendered UI
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
Impact Trace
```

这会成为后续 Inspector、Conformance、Regression 实现的主要数据基础。