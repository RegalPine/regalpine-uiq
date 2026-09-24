# UIQ-IMPL-06
# Rule Evaluation Engine Implementation Specification V1.0

**Status:** Frozen  
**Version:** 1.0.0  
**Phase:** Phase 4  
**Previous:** UIQ-IMPL-05 Metric Registry & Metric Execution Engine Implementation Specification V1.0  
**Next:** UIQ-IMPL-07 Browser Measurement Adapter Implementation Specification V1.0

---

# 1. 文档目的

本规范定义 UIQ Rule Evaluation Engine 的实现。

Phase 3 已经解决：

```text
MeasurementSnapshot
        ↓
MetricRegistry
        ↓
MetricExecutionEngine
        ↓
MetricResult
```

Phase 4 将实现：

```text
MetricResult
        ↓
RuleRegistry
        ↓
RuleConfiguration
        ↓
Applicability
        ↓
Condition Evaluation
        ↓
EvaluationResult
```

形成 UIQ 第一个完整的验证闭环：

```text
Measurement
    ↓
Metric
    ↓
Rule
    ↓
Evaluation
```

---

# 2. 核心原则

## 2.1 Rule 不计算 Metric

Rule 只能消费：

```text
MetricResult
```

不能重新执行：

```text
Color calculation
Geometry calculation
Typography calculation
```

---

## 2.2 Rule 不产生 Metric

Rule 的职责是：

> 判断已经计算出的 Metric 是否满足明确条件。

---

## 2.3 Rule 不进行审美判断

禁止：

```text
"这个颜色不好看"
"这个按钮不高级"
"这个页面不够现代"
```

Rule 必须具有明确、可计算、可追溯的条件。

---

# 3. Evaluation 模型

正式模型：

```text
Evaluation
=
MetricResult
+
RuleDefinition
+
RuleConfiguration
+
Applicability
+
Condition
```

输出：

```text
EvaluationResult
```

---

# 4. Evaluation State

V1.0 支持：

```text
PASS
FAIL
WARN
NOT_APPLICABLE
UNKNOWN
ERROR
```

---

# 5. State 语义

| State | 含义 |
|---|---|
| PASS | 条件满足 |
| FAIL | 条件不满足 |
| WARN | Rule 明确定义的警告状态 |
| NOT_APPLICABLE | Rule 对当前对象不适用 |
| UNKNOWN | 无法获得足够证据 |
| ERROR | Rule 执行错误 |

---

# 6. 状态之间不可隐式转换

禁止：

```text
UNKNOWN → PASS
```

禁止：

```text
NOT_APPLICABLE → PASS
```

禁止：

```text
ERROR → PASS
```

除非上层 Policy 明确进行状态解释。

即：

```text
Evaluation Engine
```

不能偷偷改变状态语义。

---

# 7. Rule Identity

Rule 唯一身份：

```text
RuleId + RuleVersion
```

例如：

```text
ACCESSIBILITY.CONTRAST.WCAG_AA@1.0.0
TYPOGRAPHY.FONT_SIZE.MINIMUM@1.0.0
SPACING.SCALE_CONFORMANCE@1.0.0
TOKEN.TOKEN_MATCH@1.0.0
```

---

# 8. Rule Definition

Core 中已经定义：

```ts
export interface RuleDefinition {
  id: string;
  version: string;

  metricId: string;
  metricVersion: string;

  operator?: ComparisonOperator;

  threshold?: number;

  range?: NumericRange;

  tolerance?: Tolerance;

  severity: Severity;

  applicability?: ApplicabilityDefinition;
}
```

Phase 4 不修改该 Contract。

---

# 9. Rule Registry

实现：

```ts
export interface RuleRegistry {
  register(rule: RuleDefinition): void;

  get(
    ruleId: string,
    version: string
  ): RuleDefinition | undefined;

  has(
    ruleId: string,
    version: string
  ): boolean;

  list(): RuleDefinition[];
}
```

---

# 10. Rule Registry 精确版本

请求：

```text
ACCESSIBILITY.CONTRAST.WCAG_AA@1.0.0
```

Registry 中只有：

```text
@1.1.0
```

不得自动升级。

必须报告：

```text
RULE_NOT_FOUND
```

---

# 11. Rule Configuration

Rule Definition 与运行参数分离。

例如 Definition：

```json
{
  "id": "TYPOGRAPHY.FONT_SIZE.MINIMUM",
  "version": "1.0.0",
  "metricId": "TYPOGRAPHY.FONT_SIZE",
  "metricVersion": "1.0.0"
}
```

Configuration：

```json
{
  "ruleId": "TYPOGRAPHY.FONT_SIZE.MINIMUM",
  "ruleVersion": "1.0.0",
  "values": {
    "minimum": 16
  }
}
```

这样可以支持：

```text
同一个 Rule
+
不同 Policy Profile
```

---

# 12. Configuration 不得覆盖 Rule Identity

Configuration 可以提供：

```text
threshold
minimum
maximum
tolerance
```

但不得修改：

```text
ruleId
ruleVersion
metricId
metricVersion
```

---

# 13. Evaluation Request

定义：

```ts
export interface EvaluationRequest {
  snapshotId: string;

  subjects: string[];

  rules: RuleReference[];

  metricResults: MetricResult<unknown>[];

  configurations?: RuleConfiguration[];
}
```

---

# 14. Rule Reference

```ts
export interface RuleReference {
  id: string;
  version: string;
}
```

必须精确引用：

```text
Rule ID
+
Rule Version
```

---

# 15. Evaluation Pipeline

标准流程：

```text
1. Validate Request
       ↓
2. Resolve Rule
       ↓
3. Resolve Metric Result
       ↓
4. Resolve Configuration
       ↓
5. Evaluate Applicability
       ↓
6. Evaluate Condition
       ↓
7. Determine State
       ↓
8. Build Evidence
       ↓
9. Generate Fingerprint
       ↓
10. Return EvaluationResult
```

---

# 16. Metric Result Resolution

Rule：

```text
ACCESSIBILITY.CONTRAST.WCAG_AA
```

引用：

```text
COLOR.CONTRAST@1.0.0
```

Engine 必须寻找：

```text
subjectId
+
COLOR.CONTRAST
+
1.0.0
```

对应 MetricResult。

---

# 17. Metric Version 必须匹配

如果 Rule 定义：

```text
COLOR.CONTRAST@1.0.0
```

而输入：

```text
COLOR.CONTRAST@2.0.0
```

不得直接评价。

结果：

```text
ERROR
```

或者在请求验证阶段报告：

```text
METRIC_VERSION_MISMATCH
```

---

# 18. Applicability

Rule 首先判断：

```text
是否适用于当前 Subject？
```

例如：

```text
TEXT_LEGIBILITY
```

对于：

```text
纯图形 Icon
```

可能：

```text
NOT_APPLICABLE
```

而不是：

```text
PASS
```

---

# 19. Applicability 三态

```text
APPLICABLE
NOT_APPLICABLE
UNKNOWN
```

---

# 20. Applicability 优先级

执行：

```text
Applicability
```

优先于：

```text
Condition
```

即：

```text
Applicability
      ↓
Condition
```

而不是：

```text
Condition
      ↓
Applicability
```

---

# 21. Applicability 结果

如果：

```text
NOT_APPLICABLE
```

直接：

```text
EvaluationState = NOT_APPLICABLE
```

无需继续执行 Threshold。

---

# 22. Applicability UNKNOWN

如果无法判断 Rule 是否适用：

```text
Applicability = UNKNOWN
```

则：

```text
EvaluationState = UNKNOWN
```

不能：

```text
UNKNOWN → FAIL
```

---

# 23. Numeric Comparison

支持：

```text
EQ
NE
GT
GTE
LT
LTE
```

例如：

```text
contrast >= 4.5
```

---

# 24. Range Comparison

支持：

```text
min
max
minInclusive
maxInclusive
```

例如：

```json
{
  "min": 4.5,
  "max": 7,
  "minInclusive": true,
  "maxInclusive": false
}
```

表示：

```text
4.5 ≤ x < 7
```

---

# 25. IN / NOT_IN

支持：

```text
IN
NOT_IN
```

主要用于：

```text
enumeration
categorical metric
```

例如：

```text
FONT_WEIGHT IN [400, 500, 600]
```

---

# 26. Tolerance

Tolerance 用于：

```text
numeric stability
```

而不是：

```text
policy relaxation
```

例如：

```text
expected = 4.5
tolerance = 0.0001
```

用于处理浮点误差。

不能把：

```text
4.48
```

人为当成：

```text
4.5
```

从而绕过 Rule。

---

# 27. Absolute Tolerance

定义：

```text
|actual - expected| ≤ tolerance
```

适用于：

```text
exact numeric comparison
```

---

# 28. Relative Tolerance

定义：

```text
|actual - expected|
/
max(|expected|, ε)
≤ tolerance
```

用于跨数量级比较。

---

# 29. Threshold 示例

Rule：

```text
ACCESSIBILITY.CONTRAST.WCAG_AA
```

配置：

```text
operator = GTE
threshold = 4.5
```

如果：

```text
metric = 5.17
```

结果：

```text
PASS
```

如果：

```text
metric = 4.48
```

结果：

```text
FAIL
```

---

# 30. Rule 不知道颜色如何计算

Rule 只看到：

```text
MetricResult
```

例如：

```json
{
  "metricId": "COLOR.CONTRAST",
  "metricVersion": "1.0.0",
  "value": 5.17,
  "status": "AVAILABLE"
}
```

Rule 不需要知道：

```text
sRGB
Linear RGB
XYZ
```

这些属于 Color Mathematics。

---

# 31. Metric Result UNKNOWN

如果：

```text
COLOR.CONTRAST = UNKNOWN
```

Rule：

```text
ACCESSIBILITY.CONTRAST.WCAG_AA
```

结果：

```text
UNKNOWN
```

不是：

```text
FAIL
```

---

# 32. Metric Result ERROR

如果：

```text
COLOR.CONTRAST = ERROR
```

Rule 不应该继续比较。

结果：

```text
ERROR
```

并建立执行错误 Evidence。

---

# 33. WARN

WARN 必须显式定义。

例如：

```text
recommended minimum
```

可能定义：

```text
PASS >= 4.5
WARN 3.0–4.49
FAIL < 3.0
```

但不能由 Engine 自动把：

```text
FAIL
```

改成：

```text
WARN
```

---

# 34. Rule Condition

定义：

```ts
export interface RuleCondition {
  evaluate(
    value: unknown,
    configuration: RuleConfiguration
  ): ConditionResult;
}
```

其中：

```ts
export interface ConditionResult {
  matched: boolean;
  evidence?: Record<string, unknown>;
}
```

---

# 35. Condition 与 Evaluation State

Condition 只回答：

```text
true / false
```

最终状态由 Evaluation Engine 根据：

```text
Applicability
+
Metric Status
+
Condition
+
Rule Policy
```

决定。

---

# 36. Evaluation Decision Table

| Applicability | Metric | Condition | State |
|---|---|---|---|
| APPLICABLE | AVAILABLE | true | PASS |
| APPLICABLE | AVAILABLE | false | FAIL |
| APPLICABLE | UNKNOWN | — | UNKNOWN |
| APPLICABLE | ERROR | — | ERROR |
| NOT_APPLICABLE | any | — | NOT_APPLICABLE |
| UNKNOWN | any | — | UNKNOWN |

---

# 37. Evidence

Evaluation 必须记录 Evidence。

至少包含：

```text
MetricResult
Rule
RuleConfiguration
Subject
```

例如：

```json
{
  "type": "METRIC",
  "metricId": "COLOR.CONTRAST",
  "metricVersion": "1.0.0",
  "value": 4.48
}
```

---

# 38. Evidence Relationship

使用已有关系：

```text
EVALUATED_BY
DEFINED_BY
USED_BY
DERIVED_FROM
```

例如：

```text
Evaluation
   │
   ├── EVALUATED_BY → Rule
   │
   └── DERIVED_FROM → MetricResult
```

---

# 39. Evaluation Fingerprint

Fingerprint 输入：

```text
snapshotId
subjectId
ruleId
ruleVersion
metricId
metricVersion
configuration
metricResult
evaluationState
```

推荐：

```text
SHA-256(
  canonical JSON
)
```

---

# 40. Determinism

同一：

```text
Snapshot
+
MetricResult
+
Rule Version
+
Configuration
```

必须产生相同：

```text
EvaluationState
Evidence
Fingerprint
```

---

# 41. Evaluation Result

```ts
export interface EvaluationResult {
  ruleId: string;

  ruleVersion: string;

  subjectId: string;

  state: EvaluationState;

  severity: Severity;

  metricResult?: MetricResult<unknown>;

  evidence: Evidence[];

  fingerprint: string;

  message?: string;
}
```

---

# 42. Message

Message 可以用于人类可读解释。

例如：

```text
Contrast ratio 4.48 is below the required minimum of 4.5.
```

但：

```text
message
```

不能成为机器判断依据。

机器判断必须来自：

```text
state
```

---

# 43. Rule Engine 不创建 Finding

Phase 4：

```text
Rule
 ↓
Evaluation
```

而不是：

```text
Rule
 ↓
Finding
```

Finding 创建属于后续阶段。

---

# 44. Evaluation 与 Finding

关系：

```text
Evaluation
      ↓
if FAIL/WARN
      ↓
Finding
```

后续：

```text
Evaluation
      ↓
Finding Engine
```

负责生成 Finding。

---

# 45. Rule Registry Implementation

建议：

```text
packages/rules/
├── src/
│   ├── registry/
│   │   ├── RuleRegistryImpl.ts
│   │   └── createDefaultRuleRegistry.ts
│   │
│   ├── evaluator/
│   │   ├── RuleEvaluationEngine.ts
│   │   ├── EvaluationRequest.ts
│   │   ├── EvaluationReport.ts
│   │   └── evaluateRule.ts
│   │
│   ├── condition/
│   │   ├── NumericCondition.ts
│   │   ├── RangeCondition.ts
│   │   └── SetCondition.ts
│   │
│   ├── applicability/
│   │   └── evaluateApplicability.ts
│   │
│   ├── fingerprint/
│   │   └── evaluationFingerprint.ts
│   │
│   └── index.ts
│
└── tests/
    ├── registry/
    ├── condition/
    ├── applicability/
    ├── evaluator/
    └── integration/
```

---

# 46. Rule Evaluation Engine

```ts
export interface RuleEvaluationEngine {
  evaluate(
    request: EvaluationRequest
  ): EvaluationReport;
}
```

---

# 47. Evaluation Report

```ts
export interface EvaluationReport {
  snapshotId: string;

  results: EvaluationResult[];

  metadata: EvaluationMetadata;
}
```

---

# 48. Evaluation Metadata

```ts
export interface EvaluationMetadata {
  engine: EngineInfo;

  startedAt: string;

  completedAt: string;

  durationMs: number;

  requestedRules: number;

  evaluatedRules: number;

  passCount: number;

  failCount: number;

  warnCount: number;

  notApplicableCount: number;

  unknownCount: number;

  errorCount: number;
}
```

---

# 49. Batch Evaluation

支持：

```text
100 Components
×
10 Rules
```

结果：

```text
1000 EvaluationResults
```

每一个 EvaluationResult 必须保持：

```text
subject
+
rule
+
metric
```

的明确关联。

---

# 50. Stable Ordering

最终输出按照：

```text
subjectId
ruleId
ruleVersion
```

排序。

不得依赖：

```text
Promise completion order
```

---

# 51. Composite Rules

V1.0 可以支持：

```text
AND
OR
NOT
```

例如：

```text
A AND B
```

但是 Composite Rule：

```text
只能组合已有 Evaluation/Metric 结果
```

不能在 Composite Rule 中隐藏新的计算逻辑。

---

# 52. Composite Rule 边界

错误：

```text
Rule A
+
Rule B
+
重新计算某个复杂视觉指标
```

如果这个计算具有独立语义，应成为：

```text
New Metric
```

---

# 53. Rule → Rule Dependency

V1.0 默认：

```text
Rule → Rule
```

不作为运行时依赖。

推荐：

```text
Metric
 ↓
Rule A
Metric
 ↓
Rule B
```

Composite Rule 可以在应用层组合 Evaluation。

---

# 54. Severity 与 State 分离

例如：

```text
FAIL + LOW
FAIL + CRITICAL
WARN + MEDIUM
```

都是合法的。

不能：

```text
FAIL automatically means CRITICAL
```

Severity 属于 Rule。

State 属于 Evaluation。

---

# 55. 第一批正式 Rules

默认 Registry：

```text
ACCESSIBILITY.CONTRAST.WCAG_AA@1.0.0

ACCESSIBILITY.TARGET_SIZE.MINIMUM@1.0.0

TYPOGRAPHY.FONT_SIZE.MINIMUM@1.0.0

TYPOGRAPHY.LINE_HEIGHT.MINIMUM@1.0.0

SPACING.SCALE_CONFORMANCE@1.0.0

TOKEN.TOKEN_MATCH@1.0.0

TOKEN.COMPONENT_CONFORMANCE@1.0.0
```

---

# 56. WCAG Contrast Rule

Metric：

```text
COLOR.CONTRAST@1.0.0
```

Condition：

```text
>= 4.5
```

Applicability：

```text
text
```

Result：

```text
PASS / FAIL / UNKNOWN / NOT_APPLICABLE
```

---

# 57. Target Size Rule

Metric：

```text
GEOMETRY.WIDTH
GEOMETRY.HEIGHT
```

如果 Rule 需要同时判断：

```text
width
height
```

可以通过 Composite Evaluation。

如果形成独立数学 Metric：

```text
TARGET_SIZE
```

则应该定义为新的 Metric。

---

# 58. Font Size Rule

Metric：

```text
TYPOGRAPHY.FONT_SIZE
```

例如：

```text
>= 16px
```

Evaluation：

```text
PASS
```

或：

```text
FAIL
```

---

# 59. Line Height Rule

Metric：

```text
TYPOGRAPHY.LINE_HEIGHT
```

例如：

```text
>= 1.5
```

如果输入是：

```text
unitless ratio
```

必须使用统一 Metric Contract。

---

# 60. Rule Configuration Example

```json
{
  "ruleId": "TYPOGRAPHY.FONT_SIZE.MINIMUM",
  "ruleVersion": "1.0.0",
  "values": {
    "minimum": 16
  }
}
```

---

# 61. Policy Profile

Rule Configuration 可以进一步组成：

```text
PolicyProfile
```

例如：

```json
{
  "id": "enterprise-accessibility",
  "version": "1.0.0",
  "rules": [
    {
      "ruleId": "ACCESSIBILITY.CONTRAST.WCAG_AA",
      "ruleVersion": "1.0.0",
      "configuration": {
        "minimum": 4.5
      }
    }
  ]
}
```

Policy Profile 只组织 Rule。

不能改变 Rule 的语义。

---

# 62. Release Gate

Release Gate 可以消费：

```text
EvaluationResult[]
```

例如：

```text
FAIL + CRITICAL
        ↓
BLOCK
```

或者：

```text
WARN
        ↓
WARNING
```

这是：

```text
Policy / Application
```

职责。

不是 Metric，也不是 Rule Evaluation 本身。

---

# 63. Test Strategy

必须覆盖：

```text
Registry
Condition
Tolerance
Applicability
State
Fingerprint
Batch
Version
Configuration
```

---

# 64. Registry Tests

### TEST-RULE-001

注册 Rule。

### TEST-RULE-002

重复注册失败。

### TEST-RULE-003

精确版本查询。

### TEST-RULE-004

不存在 Rule。

### TEST-RULE-005

多版本并存。

---

# 65. Condition Tests

必须测试：

```text
EQ
NE
GT
GTE
LT
LTE
IN
NOT_IN
```

以及：

```text
min
max
inclusive
exclusive
```

---

# 66. Boundary Tests

对于：

```text
threshold = 4.5
```

至少：

```text
4.49
4.50
4.51
```

必须分别测试。

---

# 67. State Tests

必须覆盖：

```text
PASS
FAIL
WARN
NOT_APPLICABLE
UNKNOWN
ERROR
```

---

# 68. UNKNOWN Tests

测试：

```text
Metric = UNKNOWN
```

要求：

```text
Evaluation = UNKNOWN
```

---

# 69. NOT_APPLICABLE Tests

测试：

```text
Applicability = NOT_APPLICABLE
```

要求：

```text
Evaluation = NOT_APPLICABLE
```

不是：

```text
PASS
```

---

# 70. Version Tests

Rule：

```text
RULE@1.0.0
```

只能消费：

```text
Metric@指定版本
```

必须测试：

```text
Metric version mismatch
```

---

# 71. Configuration Tests

必须验证：

```text
same Rule
+
different Configuration
```

能够产生不同 Evaluation。

但：

```text
Rule ID
Rule Version
Metric ID
Metric Version
```

保持不变。

---

# 72. Fingerprint Tests

同输入：

```text
A
A
```

必须：

```text
fingerprint(A) = fingerprint(A)
```

修改：

```text
threshold
```

必须：

```text
fingerprint(A) ≠ fingerprint(B)
```

---

# 73. Batch Isolation

如果：

```text
Subject A → FAIL
Subject B → PASS
```

不能相互污染。

---

# 74. Error Isolation

如果：

```text
Rule A → ERROR
Rule B → PASS
```

要求：

```text
A = ERROR
B = PASS
```

---

# 75. Architecture Dependency

保持：

```text
@uiq/rules
    ↓
@uiq/core
```

Rules 不得依赖：

```text
@uiq/browser
@uiq/color
@uiq/geometry
@uiq/tokens
@uiq/theme
@uiq/diagnostic
```

Rule 只消费 Core Contract。

---

# 76. 完整执行链

Phase 4 完成后：

```text
REAL UI
   ↓
Measurement
   ↓
MeasurementSnapshot
   ↓
MetricRegistry
   ↓
MetricExecutionEngine
   ↓
MetricResult
   ↓
RuleRegistry
   ↓
RuleEvaluationEngine
   ↓
EvaluationResult
```

UIQ 已经具备：

> **从真实 UI 状态到明确验证结论的完整确定性执行链。**

---

# 77. 第一条完整 Vertical Slice

例如：

```text
<button>
```

浏览器 Measurement：

```text
foreground = #FFFFFF
background = #2563EB
```

↓

Metric：

```text
COLOR.CONTRAST@1.0.0
```

↓

Result：

```text
5.17
```

↓

Rule：

```text
ACCESSIBILITY.CONTRAST.WCAG_AA@1.0.0
```

↓

Condition：

```text
5.17 >= 4.5
```

↓

Evaluation：

```text
PASS
```

---

# 78. Failure Vertical Slice

输入：

```text
#777777
```

背景：

```text
#FFFFFF
```

Metric：

```text
COLOR.CONTRAST = 4.48
```

Rule：

```text
>= 4.5
```

Evaluation：

```text
FAIL
```

注意：

```text
Metric = 4.48
```

是事实。

```text
FAIL
```

是 Rule 对该事实的评价。

两者不可混淆。

---

# 79. UNKNOWN Vertical Slice

复杂背景：

```text
linear-gradient(...)
```

Browser Measurement 无法可靠得到有效背景。

↓

Metric：

```text
COLOR.CONTRAST
status = UNKNOWN
```

↓

Rule：

```text
ACCESSIBILITY.CONTRAST.WCAG_AA
```

↓

Evaluation：

```text
UNKNOWN
```

这条链是合法结果。

---

# 80. Phase 4 Acceptance Criteria

## AC-RULE-01

Rule 可以通过：

```text
id + version
```

唯一解析。

## AC-RULE-02

Rule 精确绑定 Metric Version。

## AC-RULE-03

Rule 不重新计算 Metric。

## AC-RULE-04

Applicability 在 Condition 前执行。

## AC-RULE-05

UNKNOWN 不得转换成 PASS。

## AC-RULE-06

NOT_APPLICABLE 不得转换成 PASS。

## AC-RULE-07

ERROR 不得静默吞掉。

## AC-RULE-08

Tolerance 只用于数值稳定性。

## AC-RULE-09

Evaluation 具有确定性 Fingerprint。

## AC-RULE-10

Batch Evaluation 相互隔离。

## AC-RULE-11

Rule Engine 不依赖 Browser API。

## AC-RULE-12

Rule Engine 不创建 Finding。

---

# 81. Phase 4 完成状态

目前 UIQ 已完成四个核心执行阶段：

```text
Phase 1
Core Contracts
        ↓
Phase 2
Color Mathematics
        ↓
Phase 3
Metric Runtime
        ↓
Phase 4
Rule Evaluation
```

因此：

```text
Measurement
      ↓
Metric
      ↓
Rule
      ↓
Evaluation
```

已经成为真正可以运行、测试、复现的执行链。

---

# 82. 下一阶段

下一阶段进入：

```text
UIQ-IMPL-07
Browser Measurement Adapter Implementation Specification V1.0
```

重点实现：

```text
DOM
 ↓
Computed Style
 ↓
Geometry
 ↓
Typography
 ↓
Color
 ↓
MeasurementSnapshot
```

尤其解决 UIQ 最关键的现实问题：

> **UIQ 不能评价设计文件里“应该是什么”，而必须测量浏览器最终实际渲染出来的 UI 状态。**

Phase 7 将正式建立：

```text
HTMLElement
      ↓
BrowserMeasurementAdapter
      ↓
Measurement[]
      ↓
MeasurementSnapshot
      ↓
Metric Engine
```

并处理：

- `getComputedStyle`
- `getBoundingClientRect`
- CSS color
- Alpha
- Transparent background
- Background inheritance
- Typography computed values
- Responsive viewport
- Device pixel ratio
- Zoom
- Unsupported backgrounds
- Measurement UNKNOWN / ERROR
- DOM → UIQ Entity 映射
- Measurement provenance

从而把此前的数学与规则运行时真正连接到**真实浏览器 UI**。