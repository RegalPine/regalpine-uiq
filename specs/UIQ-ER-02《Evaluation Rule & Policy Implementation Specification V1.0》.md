# UIQ-ER-02
## Evaluation Rule & Policy Implementation Specification V1.0

**Status:** Stable Draft / Architecture Freeze  
**Version:** 1.0.0  
**Module:** UIQ Evaluation & Rule System  
**Depends On:** UIQ-FM-01 / UIQ-MR-01 / UIQ-REF-01 / UIQ-REF-02 / UIQ-IMPL-01 / UIQ-METRIC-01

---

# 1. 文档目标

本规范定义 UIQ 中：

```text
Measurement
    ↓
Metric
    ↓
Rule
    ↓
Threshold / Tolerance
    ↓
Applicability
    ↓
Evaluation
    ↓
Finding
```

的正式执行语义。

核心目标是：

> **让 UIQ 能够从“测量到了什么”可靠地转换为“依据什么规则进行判断，以及为什么得到这个结果”。**

本规范不定义新的 Core Layer。

未来 UIQ 的规则能力原则上通过：

- Rule
- Rule Registry
- Policy Profile
- Metric Reference
- Configuration
- Diagnostic
- Conformance Test

进行扩展。

---

# 2. 核心原则

## 2.1 Metric 不做判断

Metric：

> 描述 UI 的可测量事实。

例如：

```text
COLOR.CONTRAST = 5.17
```

Metric 不允许输出：

```text
GOOD
BAD
BEAUTIFUL
UGLY
```

---

## 2.2 Rule 才负责规范判断

Rule：

> 将 Metric Result 与明确的规范、阈值或约束进行比较。

例如：

```text
COLOR.CONTRAST >= 4.5
```

结果：

```text
PASS
```

或者：

```text
COLOR.CONTRAST < 4.5
```

结果：

```text
FAIL
```

---

## 2.3 Rule 不重新计算 Metric

禁止：

```text
Rule
 ├── 读取 DOM
 ├── 重新解析颜色
 ├── 自己计算 luminance
 └── 自己计算 contrast
```

正确结构：

```text
Browser Adapter
      ↓
Measurement
      ↓
Metric Engine
      ↓
MetricResult
      ↓
Rule Engine
```

Rule 只消费已经存在的 MetricResult。

---

# 3. Rule 正式模型

UIQ Rule 定义：

```text
RuleDefinition =
(
  identity,
  applicability,
  inputs,
  condition,
  tolerance,
  outcome,
  evidence,
  configuration,
  metadata
)
```

形式化表示：

```text
R = (I, A, M, C, T, O, E, G, X)
```

其中：

| 符号 | 含义 |
|---|---|
| I | Identity |
| A | Applicability |
| M | Metric Inputs |
| C | Condition |
| T | Tolerance |
| O | Outcome |
| E | Evidence |
| G | Configuration |
| X | Metadata |

---

# 4. Rule Identity

每一个 Rule 必须拥有稳定身份。

```ts
interface RuleIdentity {
  id: string;
  version: string;
  name: string;
  description?: string;
}
```

例如：

```text
ACCESSIBILITY.CONTRAST.WCAG_AA
version = 1.0.0
```

完整引用：

```text
ACCESSIBILITY.CONTRAST.WCAG_AA@1.0.0
```

---

# 5. Rule Version

Rule Version 使用：

```text
MAJOR.MINOR.PATCH
```

## MAJOR

语义发生不兼容变化。

例如：

```text
contrast >= 4.5
```

改成：

```text
contrast >= 5.0
```

如果改变了规则规范含义，应产生新的 Major Version。

---

## MINOR

增加兼容能力。

例如：

- 增加新的 applicability
- 增加可选 configuration
- 增加 evidence metadata

但不改变已有默认判断语义。

---

## PATCH

修复：

- 文档
- schema
- 实现 bug
- 非语义性错误

---

# 6. Metric Reference

Rule 必须明确声明依赖哪些 Metric。

```ts
interface RuleMetricReference {
  metricId: string;
  version: string;
  alias?: string;
  required: boolean;
}
```

例如：

```json
{
  "metricId": "COLOR.CONTRAST",
  "version": "1.0.0",
  "required": true
}
```

---

# 7. Metric Version Constraint

Rule 不允许隐式依赖“当前最新版 Metric”。

错误：

```text
COLOR.CONTRAST
```

正确：

```text
COLOR.CONTRAST@1.0.0
```

这样才能保证历史 Evaluation 可重现。

---

# 8. Rule Input

Rule 的输入来自 MetricResult。

```ts
interface RuleInput {
  alias: string;
  metricId: string;
  metricVersion: string;
  result: MetricResult<unknown>;
}
```

例如：

```text
contrast
  ↓
COLOR.CONTRAST@1.0.0
  ↓
5.17
```

---

# 9. Operator

UIQ V1.0 定义基础比较操作符。

```ts
type ComparisonOperator =
  | "EQ"
  | "NE"
  | "GT"
  | "GTE"
  | "LT"
  | "LTE"
  | "IN"
  | "NOT_IN";
```

例如：

```json
{
  "operator": "GTE",
  "value": 4.5
}
```

表示：

```text
metric >= 4.5
```

---

# 10. Range

对于范围约束：

```ts
interface RangeConstraint {
  min?: number;
  max?: number;
  minInclusive?: boolean;
  maxInclusive?: boolean;
}
```

例如：

```json
{
  "min": 0,
  "max": 1,
  "minInclusive": true,
  "maxInclusive": true
}
```

表示：

```text
0 <= x <= 1
```

---

# 11. Tolerance

Tolerance 与 Threshold 必须严格区分。

## Threshold

规范要求：

```text
contrast >= 4.5
```

## Tolerance

用于处理：

- 浮点误差
- 浏览器计算差异
- 渲染测量误差
- 数值表示误差

例如：

```json
{
  "operator": "GTE",
  "value": 4.5,
  "tolerance": 0.01
}
```

---

# 12. Tolerance 不得改变规范含义

禁止将：

```text
4.5 ± 0.5
```

解释为：

```text
>= 4.0
```

如果业务规范真的允许：

```text
4.0 <= x < 4.5
```

必须显式定义 Rule。

Tolerance 主要用于：

```text
numerical stability
```

而不是：

```text
policy relaxation
```

---

# 13. Tolerance Model

```ts
interface Tolerance {
  type:
    | "ABSOLUTE"
    | "RELATIVE";

  value: number;
}
```

绝对误差：

```text
|actual - expected| <= tolerance
```

相对误差：

```text
|actual - expected| / |expected| <= tolerance
```

---

# 14. Applicability

并不是所有 Rule 都适用于所有元素。

因此：

```ts
type ApplicabilityResult =
  | "APPLICABLE"
  | "NOT_APPLICABLE"
  | "UNKNOWN";
```

Rule：

```ts
interface Applicability {
  evaluate(context: EvaluationContext): ApplicabilityResult;
}
```

---

# 15. Applicability 与 PASS 的区别

例如：

```text
Button
```

需要检查：

```text
TARGET_SIZE
```

而：

```text
DecorativeDivider
```

可能不适用于该规则。

结果：

```text
NOT_APPLICABLE
```

而不是：

```text
PASS
```

这是 UIQ 的强制语义。

---

# 16. UNKNOWN

如果 Rule 理论上适用，但无法获得足够证据：

```text
UNKNOWN
```

例如：

```text
background = gradient
```

而当前 Metric 无法确定有效背景。

则：

```text
COLOR.CONTRAST
    ↓
UNKNOWN
```

Rule：

```text
UNKNOWN
```

不能转换成：

```text
PASS
```

---

# 17. Evaluation State

UIQ V1.0 定义：

```ts
type EvaluationState =
  | "PASS"
  | "FAIL"
  | "WARN"
  | "NOT_APPLICABLE"
  | "UNKNOWN"
  | "ERROR";
```

---

# 18. 状态语义

| State | 含义 |
|---|---|
| PASS | 满足 Rule |
| FAIL | 明确违反 Rule |
| WARN | 满足基础条件但存在明确警告条件 |
| NOT_APPLICABLE | Rule 不适用 |
| UNKNOWN | 无法获得足够证据 |
| ERROR | Rule 执行过程中发生错误 |

---

# 19. PASS

必须满足：

```text
Applicable
AND
Required Metrics Available
AND
Condition = true
```

---

# 20. FAIL

必须满足：

```text
Applicable
AND
Required Metrics Available
AND
Condition = false
```

---

# 21. WARN

WARN 不允许作为“模糊的差不多”。

必须由 Rule 显式定义。

例如：

```text
contrast >= 4.5
```

PASS：

```text
contrast >= 4.5
```

WARN：

```text
4.0 <= contrast < 4.5
```

FAIL：

```text
contrast < 4.0
```

只有 Rule 明确这样定义时才成立。

---

# 22. EvaluationResult

```ts
interface EvaluationResult {
  ruleId: string;
  ruleVersion: string;

  state: EvaluationState;

  inputs: RuleInput[];

  actual?: unknown;

  expected?: unknown;

  operator?: ComparisonOperator;

  severity?: Severity;

  evidence: Evidence[];

  explanation: string;

  timestamp?: string;
}
```

---

# 23. Severity

Severity 描述问题的重要程度。

```ts
type Severity =
  | "INFO"
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";
```

Severity 与 State 分离。

例如：

```text
WARN + MEDIUM
```

或者：

```text
FAIL + HIGH
```

都是合法的。

---

# 24. Severity 不由 Metric 决定

错误：

```text
contrast = 2.1
→ metric says HIGH
```

正确：

```text
Metric
contrast = 2.1

Rule
contrast >= 4.5

Evaluation
FAIL

Rule Severity
HIGH
```

---

# 25. Evidence

Evaluation 必须可以追溯到事实。

```ts
interface Evidence {
  type:
    | "METRIC"
    | "MEASUREMENT"
    | "TOKEN"
    | "DOM"
    | "RULE_CONFIGURATION";

  reference: string;

  value?: unknown;

  source?: string;
}
```

例如：

```json
{
  "type": "METRIC",
  "reference": "COLOR.CONTRAST@1.0.0",
  "value": 4.48
}
```

---

# 26. Explainability

Evaluation 必须能够回答：

1. 检查了什么？
2. 使用了什么 Metric？
3. 实际值是多少？
4. 规范要求是什么？
5. 为什么 PASS/FAIL？
6. 数据来自哪里？

例如：

```text
COLOR.CONTRAST = 4.48

Rule:
ACCESSIBILITY.CONTRAST.WCAG_AA@1.0.0

Requirement:
contrast >= 4.50

Result:
FAIL

Reason:
Measured contrast ratio 4.48 is below the required
minimum ratio of 4.50.
```

---

# 27. Finding

Evaluation 本身是判断结果。

Finding 是面向问题管理的记录。

```ts
interface Finding {
  id: string;

  subjectId: string;

  ruleId: string;
  ruleVersion: string;

  state: EvaluationState;

  severity: Severity;

  title: string;
  description: string;

  evidence: Evidence[];

  metricReferences: string[];

  sourceLocation?: SourceLocation;
}
```

---

# 28. Finding 生成条件

默认：

```text
FAIL → Finding
WARN → Finding
```

默认：

```text
PASS → 不生成 Finding
NOT_APPLICABLE → 不生成 Finding
UNKNOWN → 可配置
ERROR → 系统级 Finding
```

---

# 29. UNKNOWN Finding Policy

Policy Profile 可以决定：

```text
UNKNOWN → IGNORE
UNKNOWN → FINDING
UNKNOWN → BLOCK
```

默认：

```text
UNKNOWN → 不作为 FAIL
```

但 Conformance / Release Gate 场景可以要求：

```text
UNKNOWN → BLOCK
```

---

# 30. Rule Definition

完整 TypeScript 模型：

```ts
interface RuleDefinition {
  id: string;
  version: string;
  name: string;
  description: string;

  applicability: ApplicabilityDefinition;

  inputs: RuleMetricReference[];

  condition: RuleCondition;

  tolerance?: Tolerance;

  outcomes: RuleOutcomeDefinition[];

  evidence: EvidenceDefinition;

  configuration?: RuleConfigurationDefinition;

  metadata?: Record<string, unknown>;
}
```

---

# 31. Rule Condition

```ts
interface RuleCondition {
  type:
    | "COMPARISON"
    | "RANGE"
    | "BOOLEAN"
    | "COMPOSITE";

  expression: RuleExpression;
}
```

---

# 32. Comparison Expression

```json
{
  "type": "COMPARISON",
  "left": {
    "metric": "contrast"
  },
  "operator": "GTE",
  "right": 4.5
}
```

语义：

```text
contrast >= 4.5
```

---

# 33. Composite Rule

允许：

```text
AND
OR
NOT
```

例如：

```json
{
  "type": "COMPOSITE",
  "operator": "AND",
  "conditions": [
    {
      "metric": "fontSize",
      "operator": "GTE",
      "value": 16
    },
    {
      "metric": "lineHeight",
      "operator": "GTE",
      "value": 1.4
    }
  ]
}
```

---

# 34. Composite Rule 的原则

Composite Rule 可以组合 Metric Result。

但是：

> Composite Rule 不得引入新的 Metric 计算逻辑。

例如允许：

```text
A >= 4.5
AND
B >= 16
```

不允许：

```text
sqrt(A² + B²) >= X
```

如果这个计算具有独立语义，应首先成为 Metric。

---

# 35. Rule Dependency

Rule 可以依赖：

```text
Metric
```

也可以依赖：

```text
Rule
```

但 V1.0 默认：

```text
Rule → Metric
```

不开放：

```text
Rule → Rule
```

原因是减少：

- 循环依赖
- 隐式语义
- 调试复杂度
- 执行顺序问题

未来如果需要 Rule Composition，应通过显式 Composite Policy 扩展，而不是修改 Core Rule 语义。

---

# 36. Rule Registry

```ts
interface RuleRegistry {
  register(rule: RuleDefinition): void;

  get(
    id: string,
    version: string
  ): RuleDefinition | undefined;

  list(): RuleDefinition[];

  validate(
    rule: RuleDefinition
  ): RuleValidationResult;
}
```

---

# 37. Rule Registry 唯一性

Registry 中：

```text
id + version
```

必须唯一。

例如：

```text
ACCESSIBILITY.CONTRAST.WCAG_AA@1.0.0
ACCESSIBILITY.CONTRAST.WCAG_AA@1.1.0
```

可以同时存在。

但：

```text
ACCESSIBILITY.CONTRAST.WCAG_AA@1.0.0
```

不得重复注册。

---

# 38. Rule Configuration

必须区分：

```text
Rule Definition
```

与：

```text
Rule Configuration
```

例如：

Rule：

```text
contrast >= threshold
```

Configuration：

```json
{
  "threshold": 4.5
}
```

---

# 39. 为什么需要分离

Rule Definition 是规范。

Configuration 是执行环境。

例如同一个基础规则：

```text
MIN_TARGET_SIZE
```

可以配置：

```text
desktop = 24px
mobile = 44px
```

Rule 本身不需要复制。

---

# 40. Configuration Schema

```ts
interface RuleConfiguration {
  ruleId: string;
  ruleVersion: string;

  values: Record<string, unknown>;

  profileId?: string;
}
```

Configuration 必须经过 Schema Validation。

---

# 41. Policy Profile

多个 Rule 可以组成 Policy Profile。

```ts
interface PolicyProfile {
  id: string;
  version: string;
  name: string;

  rules: PolicyRuleReference[];

  configuration?: Record<string, unknown>;
}
```

例如：

```text
UIQ.ACCESSIBILITY.WCAG_AA@1.0.0
```

包含：

```text
Contrast
Target Size
Focus Visibility
Text Legibility
```

---

# 42. Policy Profile 不产生新的判断语义

Policy Profile 只是：

```text
Rule Set + Configuration
```

不是新的 Engine。

---

# 43. Evaluation Engine

```ts
interface EvaluationEngine {
  evaluate(
    request: EvaluationRequest
  ): EvaluationReport;
}
```

---

# 44. Evaluation Request

```ts
interface EvaluationRequest {
  snapshotId: string;

  subjectIds: string[];

  rules: RuleReference[];

  configuration?: RuleConfiguration[];

  mode:
    | "ANALYSIS"
    | "VALIDATION"
    | "CONFORMANCE"
    | "REGRESSION";
}
```

---

# 45. Evaluation Pipeline

正式执行顺序：

```text
1. Load Rule
        ↓
2. Validate Rule
        ↓
3. Resolve Configuration
        ↓
4. Check Applicability
        ↓
5. Resolve Metric Results
        ↓
6. Validate Metric Availability
        ↓
7. Evaluate Condition
        ↓
8. Determine State
        ↓
9. Determine Severity
        ↓
10. Generate Evidence
        ↓
11. Generate Finding
        ↓
12. Produce EvaluationReport
```

---

# 46. Applicability 优先级

必须先判断 Applicability。

```text
Applicability
     ↓
NOT_APPLICABLE
```

时，不执行：

```text
Condition
```

这样可以避免：

```text
不存在的 Metric
```

导致错误的 FAIL。

---

# 47. Metric Availability

如果 Rule：

```text
required metric = missing
```

则：

```text
UNKNOWN
```

如果是系统内部异常：

```text
ERROR
```

两者必须区分。

---

# 48. ERROR

例如：

```text
Rule schema invalid
Metric type mismatch
Invalid configuration
Rule execution exception
Registry corruption
```

可以产生：

```text
ERROR
```

ERROR 不应该被解释为：

```text
FAIL
```

---

# 49. Type Safety

Rule Metric 输入必须与 Metric 输出类型匹配。

例如：

```text
COLOR.CONTRAST → number
```

因此：

```text
GTE 4.5
```

合法。

但：

```text
IN ["red", "blue"]
```

如果类型不匹配，则：

```text
ERROR
```

---

# 50. Rule Validation

Rule 注册之前必须检查：

```text
Rule ID
Version
Metric references
Metric versions
Operator
Value type
Applicability
Configuration schema
Outcome mapping
Evidence definition
```

---

# 51. Rule Validation Failure

Rule 无法通过 Validation 时：

```text
Registry
    ↓
REJECT
```

不得进入正常 Evaluation。

---

# 52. 第一批官方 Rule

UIQ V1.0 初始 Rule Registry：

```text
ACCESSIBILITY
 ├── CONTRAST
 ├── TARGET_SIZE
 ├── FOCUS_VISIBILITY
 └── TEXT_LEGIBILITY

TYPOGRAPHY
 ├── FONT_SIZE
 ├── LINE_HEIGHT
 └── SCALE

SPACING
 └── SCALE_CONFORMANCE

GEOMETRY
 └── OVERLAP

TOKEN
 ├── TOKEN_MATCH
 └── COMPONENT_CONFORMANCE
```

---

# 53. Contrast Rule

ID：

```text
ACCESSIBILITY.CONTRAST.WCAG_AA@1.0.0
```

Input：

```text
COLOR.CONTRAST@1.0.0
```

Requirement：

```text
contrast >= 4.5
```

示例：

```json
{
  "id": "ACCESSIBILITY.CONTRAST.WCAG_AA",
  "version": "1.0.0",
  "inputs": [
    {
      "metricId": "COLOR.CONTRAST",
      "version": "1.0.0",
      "alias": "contrast",
      "required": true
    }
  ],
  "condition": {
    "type": "COMPARISON",
    "expression": {
      "left": {
        "metric": "contrast"
      },
      "operator": "GTE",
      "right": 4.5
    }
  },
  "severity": "HIGH"
}
```

---

# 54. Contrast Evaluation Example

Metric：

```text
COLOR.CONTRAST = 5.17
```

Rule：

```text
>= 4.5
```

结果：

```text
PASS
```

---

Metric：

```text
COLOR.CONTRAST = 4.48
```

结果：

```text
FAIL
```

Finding：

```text
Contrast ratio 4.48 is below the required minimum 4.50.
```

---

# 55. Target Size Rule

ID：

```text
ACCESSIBILITY.TARGET_SIZE.MINIMUM@1.0.0
```

Input：

```text
GEOMETRY.WIDTH
GEOMETRY.HEIGHT
```

Applicability：

```text
interactive = true
```

Condition：

```text
width >= threshold
AND
height >= threshold
```

具体 threshold 必须由所采用的规范/Policy Profile 配置确定。

UIQ 不把某一个数字永久硬编码为所有平台的唯一答案。

---

# 56. Typography Font Size Rule

```text
TYPOGRAPHY.FONT_SIZE.MINIMUM@1.0.0
```

Input：

```text
TYPOGRAPHY.FONT_SIZE@1.0.0
```

Configuration：

```json
{
  "minimum": 12
}
```

Condition：

```text
fontSize >= minimum
```

---

# 57. Line Height Rule

```text
TYPOGRAPHY.LINE_HEIGHT.MINIMUM@1.0.0
```

Input：

```text
TYPOGRAPHY.LINE_HEIGHT@1.0.0
```

Condition：

```text
lineHeight >= configuredMinimum
```

Rule 不定义“最佳行高”。

它只判断：

```text
是否满足指定约束
```

---

# 58. Scale Conformance Rule

```text
SPACING.SCALE_CONFORMANCE@1.0.0
```

Input：

```text
SPACING.DISTANCE
```

Configuration：

```json
{
  "scale": [
    4,
    8,
    12,
    16,
    24,
    32
  ],
  "tolerance": 0.5
}
```

判断：

```text
distance ∈ scale ± tolerance
```

---

# 59. Token Match Rule

```text
TOKEN.TOKEN_MATCH@1.0.0
```

Input：

```text
TOKEN_MATCH
```

判断：

```text
actualToken == expectedToken
```

注意：

Token Match 与视觉质量不是同一个概念。

例如：

```text
颜色完全一致
```

并不代表：

```text
颜色符合可访问性规范
```

---

# 60. Component Conformance Rule

```text
TOKEN.COMPONENT_CONFORMANCE@1.0.0
```

输入：

```text
Component Token Contract
+
TOKEN_MATCH
+
TOKEN_DEVIATION
```

判断组件是否遵守既定 Token Contract。

---

# 61. 多 Rule 冲突

一个元素可能同时触发：

```text
Contrast Rule
Token Rule
Spacing Rule
Typography Rule
```

UIQ 不允许简单合并为：

```text
BAD
```

必须保留独立结果：

```text
Finding A
Finding B
Finding C
```

---

# 62. Severity Precedence

Severity 不影响事实结果。

例如：

```text
FAIL + HIGH
FAIL + LOW
```

仍然都是：

```text
FAIL
```

Severity 只是风险/处理优先级信息。

---

# 63. Rule Precedence

默认不存在：

```text
Rule A overrides Rule B
```

不同 Rule 独立执行。

如果确实存在规范优先级，必须显式记录：

```ts
priority?: number;
```

但 Priority 只影响：

- 展示
- Finding 排序
- Gate 处理顺序

不改变其他 Rule 的 Evaluation Result。

---

# 64. Release Gate

Policy Profile 可以定义 Gate。

例如：

```text
CRITICAL FAIL → BLOCK
HIGH FAIL → BLOCK
MEDIUM FAIL → WARN
LOW FAIL → INFO
```

Gate 属于：

```text
Conformance / Release Policy
```

而不是 Metric。

---

# 65. Determinism

相同：

```text
MeasurementSnapshot
+
Metric Version
+
Rule Version
+
Rule Configuration
+
UIQ Engine Version
```

必须产生相同 Evaluation。

即：

```text
Evaluate(X) = Evaluate(X)
```

---

# 66. Evaluation Fingerprint

建议：

```ts
interface EvaluationFingerprint {
  snapshotHash: string;
  metricVersions: string[];
  ruleVersions: string[];
  configurationHash: string;
  engineVersion: string;
}
```

用于：

```text
Regression
Audit
Reproducibility
Cache
Comparison
```

---

# 67. Evaluation Report

```ts
interface EvaluationReport {
  snapshotId: string;

  evaluations: EvaluationResult[];

  findings: Finding[];

  summary: EvaluationSummary;

  fingerprint: EvaluationFingerprint;
}
```

---

# 68. Evaluation Summary

```ts
interface EvaluationSummary {
  total: number;

  pass: number;
  fail: number;
  warn: number;

  notApplicable: number;
  unknown: number;
  error: number;
}
```

---

# 69. JSON Schema 示例

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://uiq.dev/schema/rule-definition-1.0.json",

  "type": "object",

  "required": [
    "id",
    "version",
    "name",
    "inputs",
    "condition"
  ],

  "properties": {
    "id": {
      "type": "string"
    },

    "version": {
      "type": "string"
    },

    "name": {
      "type": "string"
    },

    "inputs": {
      "type": "array"
    },

    "condition": {
      "type": "object"
    }
  }
}
```

---

# 70. 规则执行伪代码

```ts
function evaluateRule(
  rule: RuleDefinition,
  context: EvaluationContext
): EvaluationResult {

  validateRule(rule);

  const applicability =
    evaluateApplicability(
      rule.applicability,
      context
    );

  if (applicability === "NOT_APPLICABLE") {
    return notApplicable(rule);
  }

  if (applicability === "UNKNOWN") {
    return unknown(rule);
  }

  const inputs =
    resolveMetricInputs(
      rule.inputs,
      context
    );

  if (!inputs.available) {
    return unknown(rule);
  }

  const condition =
    evaluateCondition(
      rule.condition,
      inputs,
      rule.tolerance
    );

  return resolveOutcome(
    rule,
    condition,
    inputs
  );
}
```

---

# 71. 禁止行为

UIQ Rule Engine 禁止：

### 71.1 在 Rule 中重新计算 Metric

```text
Rule → DOM
```

禁止。

### 71.2 隐藏阈值

```text
some internal magic number
```

禁止。

### 71.3 UNKNOWN → PASS

禁止。

### 71.4 NOT_APPLICABLE → PASS

禁止。

### 71.5 Metric → Good/Bad

禁止。

### 71.6 Rule → Aesthetic Judgment

例如：

```text
MORE BEAUTIFUL
MORE PREMIUM
MORE MODERN
```

V1.0 禁止。

---

# 72. 审美判断边界

UIQ 可以测量：

```text
Lightness Difference
Chroma Difference
Hue Difference
Contrast
Spacing
Alignment
Density
Symmetry
Hierarchy
```

但这些数据不自动推出：

```text
高级
漂亮
现代
品牌感强
```

如果未来增加此类评价，应作为明确的：

```text
Research / Experimental
```

体系，而不是偷偷加入正式 Rule。

---

# 73. Rule → Diagnostic

Rule 输出：

```text
Finding
```

Diagnostic 再回答：

```text
为什么？
```

例如：

```text
Finding
Contrast = 4.48 < 4.5
        ↓
Diagnostic
Foreground and background luminance
difference is insufficient.
```

Diagnostic 可以进一步分析：

```text
Lightness
Chroma
Hue
Background
Opacity
Token
Component State
```

但不改变原始 Evaluation。

---

# 74. Recommendation

Recommendation 位于：

```text
Metric
 ↓
Rule
 ↓
Finding
 ↓
Diagnostic
 ↓
Recommendation
```

因此推荐：

```text
把蓝色改成 #xxxxxx
```

不应该由 Rule 直接产生。

---

# 75. 完整架构

```text
┌──────────────────────────────┐
│        Measurement           │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│            Metric            │
│     quantitative facts       │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│             Rule             │
│ threshold / condition /      │
│ applicability / severity     │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│          Evaluation          │
│ PASS / FAIL / WARN / ...     │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│           Finding            │
│ traceable problem record     │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│          Diagnostic          │
│ cause / evidence analysis    │
└──────────────┬───────────────┘
               ↓
┌──────────────────────────────┐
│       Recommendation         │
│ optional remediation         │
└──────────────────────────────┘
```

---

# 76. Rule Engine 在 UIQ 中的最终定位

UIQ Rule Engine 不是：

```text
AI Design Judge
```

也不是：

```text
Aesthetic Engine
```

而是：

> **Deterministic Design Constraint Evaluation Engine**

即：

> **确定性的设计约束评估引擎。**

---

# 77. V1.0 Architecture Freeze

UIQ V1.0 至此形成：

```text
Measurement
Metric
Rule
Evaluation
Finding
Diagnostic
```

六个核心语义阶段。

不再增加：

```text
Universal Design Intelligence Layer
Design Quality Engine
Aesthetic Intelligence Layer
AI Judgment Layer
```

等新的核心层。

---

# 78. 后续扩展方式

未来能力只能优先通过以下机制增加：

```text
Metric Registry
Rule Registry
Policy Profile
Diagnostic Registry
Adapter Registry
Token Registry
Theme Registry
Conformance Tests
```

而不是不断修改 Core Model。

---

# 79. V1.0 完整数据流

```text
DOM
 ↓
Browser Measurement Adapter
 ↓
MeasurementSnapshot
 ↓
Metric Engine
 ↓
MetricResult
 ↓
Rule Registry
 ↓
Rule Resolution
 ↓
Applicability
 ↓
Condition
 ↓
Evaluation
 ↓
Finding
 ↓
Diagnostic
 ↓
Inspector / CLI / Report
```

---

# 80. 最终冻结结论

UIQ 的核心判断链正式冻结为：

```text
事实
 ↓
Metric
 ↓
规则
 ↓
判断
 ↓
问题
 ↓
解释
```

对应：

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

其中：

```text
Measurement = 看到了什么
Metric      = 它是多少
Rule        = 应满足什么
Evaluation  = 是否满足
Finding     = 哪里存在问题
Diagnostic  = 为什么存在问题
```

这条语义链是 UIQ 后续所有实现的稳定基础。

**V1.0 不再继续增加核心语义层。**