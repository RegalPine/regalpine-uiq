# UIQ-IMPL-11
# Conformance & Regression Runtime Specification V1.0

**Status:** Frozen  
**Version:** 1.0.0  
**Phase:** Phase 9  
**Previous:** UIQ-IMPL-10 Inspector Runtime & Analysis Application Specification V1.0  
**Next:** UIQ-IMPL-12 CLI & CI/CD Integration Specification V1.0

---

# 1. 文档目的

本规范定义 UIQ Conformance 与 Regression Runtime。

前面已经建立：

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
 ↓
Finding
 ↓
Diagnostic
```

以及：

```text
Token
 ↓
Theme
 ↓
Component
 ↓
Rendered UI
```

本阶段解决两个工程问题：

> **实现是否符合 UIQ 规范？**

以及：

> **一次代码/主题修改是否导致已有 UI 行为发生非预期变化？**

因此形成：

```text
Specification
      ↓
Implementation
      ↓
Conformance
      ↓
Baseline
      ↓
New Snapshot
      ↓
Regression Analysis
      ↓
Release Gate
```

---

# 2. Conformance 与 Regression 的区别

## 2.1 Conformance

Conformance 回答：

> 当前实现是否符合 UIQ 规定的契约？

例如：

```text
COLOR.CONTRAST@1.0.0
```

实现结果是否符合 Golden Test。

---

## 2.2 Regression

Regression 回答：

> 当前版本与基准版本相比发生了什么变化？

例如：

```text
Before:
Contrast = 5.17 PASS

After:
Contrast = 3.21 FAIL
```

则：

```text
NEW_FAILURE
```

---

# 3. 不允许混淆

```text
Conformance
≠
Regression
```

Conformance 可以在没有历史版本时执行。

Regression 必须存在：

```text
Baseline
```

---

# 4. 完整验证链

```text id="s7s8v8"
Metric Implementation
        ↓
Metric Golden
        ↓
Rule Implementation
        ↓
Rule Golden
        ↓
Browser Measurement
        ↓
Token/Theme Conformance
        ↓
Snapshot
        ↓
Regression
        ↓
Release Gate
```

---

# 5. Conformance Levels

沿用四级：

```text id="29h3v8"
CORE
STANDARD
BROWSER
FULL
```

---

# 6. CORE

验证：

```text id="h7u0a9"
Core Contracts
Metric Math
Rule Evaluation
Schemas
Fingerprints
```

不需要真实浏览器。

---

# 7. STANDARD

包括：

```text id="w2g4gr"
CORE
+
Metric Golden
+
Rule Golden
+
Token Golden
+
Diagnostic Golden
```

---

# 8. BROWSER

包括：

```text id="1n4t3m"
STANDARD
+
Chromium
+
Firefox
+
WebKit
```

---

# 9. FULL

包括：

```text id="c4b2fw"
BROWSER
+
Theme
+
Component
+
Regression
+
E2E
```

---

# 10. Golden Test

Golden Test 固定：

```text id="u4m9b4"
Input
Metric Version
Expected Output
Tolerance
Test ID
```

例如：

```text id="3gqkz5"
Test:
COLOR-CONTRAST-001

Foreground:
#FFFFFF

Background:
#000000

Expected:
21

Tolerance:
0.0001
```

---

# 11. Golden Test 原则

Golden Test 必须：

```text id="f52h1x"
deterministic
versioned
reviewable
repeatable
```

---

# 12. 禁止自动更新 Golden

如果：

```text id="9jst2b"
Golden Test FAIL
```

不能自动：

```text id="33y9uw"
Expected = Actual
```

必须：

```text id="89m6wr"
human review
```

确认规范是否真的发生变化。

---

# 13. Golden Test 数据结构

```ts id="q8cv82"
export interface GoldenCase<TInput, TOutput> {
  id: string;

  version: string;

  input: TInput;

  expected: TOutput;

  tolerance?: Tolerance;

  metadata?: Record<string, unknown>;
}
```

---

# 14. Golden Runner

```ts id="o2qqgi"
export interface GoldenRunner {
  run(
    cases: GoldenCase<unknown, unknown>[]
  ): GoldenReport;
}
```

---

# 15. Golden Report

```ts id="5r4v8w"
export interface GoldenReport {
  total: number;

  passed: number;

  failed: number;

  cases: GoldenCaseResult[];
}
```

---

# 16. Metric Conformance

Metric Conformance 验证：

```text id="up16tu"
Metric Definition
+
Metric Version
+
Input
+
Expected Result
```

---

# 17. Metric Golden

例如：

```text id="1q5v4q"
COLOR.OKLAB
```

至少：

```text
black
white
red
green
blue
gray
neutral
low-chroma
```

---

# 18. Color Golden

必须验证：

```text id="20ig4a"
HEX Parsing
sRGB Transfer
XYZ D65
OKLab
OKLCH
Luminance
Contrast
Hue
Alpha
Gamut
```

---

# 19. Neutral Color

例如：

```text id="w3p4d9"
#808080
```

要求：

```text id="kjjmg6"
C ≈ 0
H = UNDEFINED
```

不能：

```text id="1m7xg0"
H = 0°
```

---

# 20. Contrast Golden

至少：

```text id="5zv1a0"
#FFFFFF / #000000
→ 21

#FFFFFF / #2563EB
→ ≈ 5.17

#777777 / #FFFFFF
→ ≈ 4.48
```

---

# 21. Geometry Golden

验证：

```text id="8hx1kn"
WIDTH
HEIGHT
AREA
ASPECT_RATIO
CENTER_DISTANCE
EDGE_DISTANCE
OVERLAP
```

---

# 22. Typography Golden

验证：

```text id="9x8qkg"
FONT_SIZE
FONT_WEIGHT
LINE_HEIGHT
LETTER_SPACING
TEXT_MEASURE
SCALE_RATIO
```

特别验证：

```text id="v3ghyq"
font-weight = 437
```

必须保留：

```text id="gcvj5q"
437
```

不能变成：

```text id="n7u4pm"
400
```

---

# 23. Rule Conformance

Rule Conformance 验证：

```text id="8x1tpf"
MetricResult
+
RuleDefinition
+
Configuration
+
Expected Evaluation
```

---

# 24. Boundary Testing

每一个 Threshold Rule 至少：

```text id="q6c8v8"
below
exact
above
```

例如：

```text id="e9x6mj"
4.49 → FAIL
4.50 → PASS
4.51 → PASS
```

---

# 25. Evaluation State Tests

必须覆盖：

```text id="cm31is"
PASS
FAIL
WARN
NOT_APPLICABLE
UNKNOWN
ERROR
```

---

# 26. NOT_APPLICABLE

测试：

```text id="j5n0ez"
Rule not applicable
```

必须得到：

```text id="c9ymmv"
NOT_APPLICABLE
```

而不是：

```text id="f55s6h"
PASS
```

---

# 27. UNKNOWN

测试：

```text id="j8l4m7"
Missing reliable measurement
```

必须：

```text id="c0km3h"
UNKNOWN
```

---

# 28. ERROR

测试：

```text id="y9f6p7"
invalid configuration
```

必须：

```text id="1z7gys"
ERROR
```

---

# 29. Token Conformance

验证：

```text id="b98b76"
Token Graph
Resolution
Binding
Match
Deviation
Component Contract
Theme
```

---

# 30. Token Cycle Golden

输入：

```text id="z2y3y7"
A → B
B → C
C → A
```

Expected：

```text id="jjq1ri"
TOKEN_GRAPH_ERROR
```

并要求报告：

```text id="w2v3g9"
A → B → C → A
```

---

# 31. Token Resolution Golden

输入：

```text id="9cm8dd"
button.primary.background
```

Expected Chain：

```text id="5vuw8y"
button.primary.background
→ color.action.primary
→ color.blue.600
```

---

# 32. Theme Golden

至少验证：

```text id="yk3e8f"
Light
Dark
High Contrast
Custom
```

每个 Theme 独立执行。

---

# 33. Theme Isolation Test

禁止：

```text id="j4t9u8"
Dark Theme
```

读取：

```text id="g8j5i4"
Light Theme Evaluation
```

中的结果。

---

# 34. Diagnostic Golden

例如：

```text id="t8x6g4"
Contrast FAIL
```

Expected：

```text id="u1h4f2"
Finding
+
Evidence
+
Diagnostic
+
Cause
+
Confidence
```

---

# 35. Evidence Golden

要求能够追溯：

```text id="f7r1c5"
Finding
 ↓
Evaluation
 ↓
Rule
 ↓
Metric
 ↓
Measurement
 ↓
DOM
```

---

# 36. Browser Conformance

浏览器 Conformance 分两部分：

```text id="e6n7pu"
Calculation Conformance
```

和：

```text id="c9l0w5"
Browser Measurement Conformance
```

---

# 37. Calculation Conformance

验证：

```text id="k6l3n8"
Pure Math
```

例如：

```text id="p9v4j6"
OKLab
Contrast
Geometry
```

不依赖具体浏览器。

---

# 38. Browser Measurement Conformance

验证：

```text id="v4z1q6"
getComputedStyle
getBoundingClientRect
document.fonts
viewport
devicePixelRatio
```

---

# 39. Browser Matrix

推荐：

```text id="w8l4f9"
Chromium
Firefox
WebKit
```

---

# 40. Browser Tolerance

不同浏览器可能存在：

```text id="x5z7q1"
sub-pixel
font rendering
layout rounding
```

因此 Browser tolerance 必须显式定义。

不能：

```text id="c4m8tw"
if browser !== chromium
then ignore
```

---

# 41. Snapshot

Regression 的核心对象：

```text id="p2e8s6"
MeasurementSnapshot
```

必须保存：

```text id="c1r4o9"
snapshotId
capturedAt
environment
measurements
```

---

# 42. Baseline

定义：

```ts id="3k5wq0"
export interface Baseline {
  id: string;

  createdAt: string;

  engine: EngineInfo;

  snapshot: MeasurementSnapshot;

  metrics: MetricResult<unknown>[];

  evaluations: EvaluationResult[];

  findings: Finding[];

  themeId?: string;
}
```

---

# 43. Regression Request

```ts id="v8b3x4"
export interface RegressionRequest {
  baseline: Baseline;

  current: AnalysisSnapshot;
}
```

---

# 44. Regression Pipeline

```text id="j2k6p8"
Baseline
   ↓
Current Snapshot
   ↓
Identity Matching
   ↓
Metric Diff
   ↓
Evaluation Diff
   ↓
Finding Diff
   ↓
Classification
```

---

# 45. Identity Matching

优先：

```text id="4t1m8n"
UIQ Entity ID
```

其次：

```text id="q3d7v9"
stable DOM identity
```

不能简单使用：

```text id="p8x5c1"
array index
```

作为长期身份。

---

# 46. Regression Categories

沿用：

```text id="p4z8y2"
NEW_FAILURE
FIXED_FAILURE
PERSISTING_FAILURE
CHANGED_RESULT
NEW_UNKNOWN
RESOLVED_UNKNOWN
```

---

# 47. NEW_FAILURE

Baseline：

```text id="2n8c7r"
PASS
```

Current：

```text id="6v4m2a"
FAIL
```

结果：

```text id="5b0y8x"
NEW_FAILURE
```

---

# 48. FIXED_FAILURE

Baseline：

```text id="a6r4q8"
FAIL
```

Current：

```text id="z2j7w9"
PASS
```

结果：

```text id="8d5k1p"
FIXED_FAILURE
```

---

# 49. PERSISTING_FAILURE

```text id="f4m8y2"
Baseline = FAIL
Current  = FAIL
```

结果：

```text id="1c7n5v"
PERSISTING_FAILURE
```

---

# 50. CHANGED_RESULT

例如：

```text id="3r8x6k"
Metric:
5.17 → 5.01

Rule:
PASS → PASS
```

这不是 Failure。

但可能：

```text id="x4q9p2"
CHANGED_RESULT
```

用于审查变化。

---

# 51. NEW_UNKNOWN

Baseline：

```text id="s2v8m6"
AVAILABLE
```

Current：

```text id="k4z1n7"
UNKNOWN
```

结果：

```text id="q8m3c5"
NEW_UNKNOWN
```

---

# 52. RESOLVED_UNKNOWN

Baseline：

```text id="r7m2p8"
UNKNOWN
```

Current：

```text id="j5c9x4"
AVAILABLE
```

结果：

```text id="w3v6k1"
RESOLVED_UNKNOWN
```

---

# 53. Metric Diff

定义：

```ts id="b5t1x9"
export interface MetricDiff {
  metricId: string;

  metricVersion: string;

  subjectId: string;

  before?: unknown;

  after?: unknown;

  changed: boolean;

  delta?: unknown;
}
```

---

# 54. Evaluation Diff

```ts id="g8p4n2"
export interface EvaluationDiff {
  ruleId: string;

  ruleVersion: string;

  subjectId: string;

  before?: EvaluationState;

  after?: EvaluationState;

  category?: RegressionCategory;
}
```

---

# 55. Finding Diff

Finding 通过：

```text id="n6w2k8"
Fingerprint
```

进行关联。

---

# 56. Regression 不重新判断规则

Regression Engine 不应该重新执行：

```text id="s3y8p1"
Rule
```

它只比较：

```text id="j9m5v4"
EvaluationResult
```

---

# 57. Regression Fingerprint

Regression Record 必须保留：

```text id="r2k8m6"
baselineSnapshotId
currentSnapshotId
subjectId
metric/rule identity
category
```

---

# 58. Regression Report

```ts id="u5p9x3"
export interface RegressionReport {
  baselineId: string;

  currentSnapshotId: string;

  metricChanges: MetricDiff[];

  evaluationChanges: EvaluationDiff[];

  findingChanges: FindingDiff[];

  summary: RegressionSummary;
}
```

---

# 59. Regression Summary

```ts id="m8q4t2"
export interface RegressionSummary {
  newFailures: number;

  fixedFailures: number;

  persistingFailures: number;

  changedResults: number;

  newUnknowns: number;

  resolvedUnknowns: number;
}
```

---

# 60. Release Gate

Release Gate 消费：

```text id="z6y2w9"
EvaluationResult
+
RegressionReport
```

然后根据：

```text id="v3p8k1"
PolicyProfile
```

决定：

```text id="q4m7x2"
ALLOW
WARN
BLOCK
```

---

# 61. Release Gate 不属于 Metric

也不属于：

```text id="c8n4y5"
Diagnostic
```

它属于：

```text id="w6p2r9"
Application / Governance
```

---

# 62. Release Gate 示例

Policy：

```text id="n2x8m4"
NEW_FAILURE + HIGH
→ BLOCK
```

而：

```text id="y5q1v7"
CHANGED_RESULT
→ WARN
```

---

# 63. Gate 与 Evaluation

必须保持：

```text id="a7k3p5"
Evaluation = FAIL
```

而：

```text id="j8r2m6"
Release Gate = BLOCK
```

二者不是同一个状态。

---

# 64. CI Pipeline

推荐：

```text id="p6w9k3"
Install
 ↓
Lint
 ↓
Typecheck
 ↓
Unit Tests
 ↓
Golden Tests
 ↓
Schema Tests
 ↓
Contract Tests
 ↓
Browser Tests
 ↓
Conformance
 ↓
Regression
 ↓
Release Gate
```

---

# 65. CI 失败分类

CI 必须区分：

```text id="f4v8n2"
Implementation Failure
Specification Failure
Environment Failure
Browser Failure
Configuration Failure
```

不能所有失败都显示：

```text id="s8x2m6"
UIQ FAILED
```

---

# 66. Conformance Report

CLI/CI 输出至少：

```text id="y1k5p9"
Level
Total
Passed
Failed
Skipped
Unknown
Errors
Duration
Engine Version
```

---

# 67. Conformance JSON

```json id="v4p8s2"
{
  "level": "FULL",
  "total": 248,
  "passed": 241,
  "failed": 4,
  "unknown": 2,
  "errors": 1,
  "engine": {
    "name": "UIQ",
    "version": "1.0.0"
  }
}
```

---

# 68. Golden File Versioning

建议：

```text id="q8m2x5"
specs/golden/
├── color/
├── geometry/
├── typography/
├── rules/
├── tokens/
├── themes/
├── diagnostics/
└── browser/
```

---

# 69. Regression Baseline Storage

V1.0 不要求数据库。

可以：

```text id="r5n8c2"
JSON
```

或者：

```text id="x4p7m1"
Artifact
```

保存。

后续如果需要：

```text id="z8k3q6"
Central History
```

再引入后端。

---

# 70. Snapshot Artifact

推荐：

```text id="m2v9k5"
uiq-snapshot.json
```

包含：

```text id="p8x4r1"
MeasurementSnapshot
MetricResults
EvaluationResults
Findings
Diagnostics
TokenBindings
Theme
Environment
Version Metadata
```

---

# 71. 可重复性

一次分析必须能够通过：

```text id="w6q2m8"
Snapshot
+
Metric Version
+
Rule Version
+
Configuration
+
Engine Version
```

重现。

---

# 72. Regression 可重复性

Regression 必须使用：

```text id="n5r8k2"
Baseline Artifact
+
Current Artifact
+
Regression Engine Version
```

重新得到相同分类。

---

# 73. Conformance Runtime Package

```text id="e4m7x1"
packages/conformance/
├── src/
│   ├── golden/
│   │   ├── GoldenCase.ts
│   │   ├── GoldenRunner.ts
│   │   └── GoldenReporter.ts
│   │
│   ├── schema/
│   ├── contract/
│   ├── browser/
│   ├── snapshot/
│   ├── index.ts
│   └── ...
```

---

# 74. Regression Runtime Package

```text id="j8p3v6"
packages/regression/
├── src/
│   ├── baseline/
│   │   └── Baseline.ts
│   ├── diff/
│   │   ├── MetricDiff.ts
│   │   ├── EvaluationDiff.ts
│   │   └── FindingDiff.ts
│   ├── classification/
│   │   └── RegressionClassifier.ts
│   ├── report/
│   │   └── RegressionReport.ts
│   └── index.ts
```

---

# 75. Dependency

```text id="c5m9x2"
@uiq/conformance
    ↓
@uiq/core
```

Regression：

```text id="p7k2v4"
@uiq/regression
    ↓
@uiq/core
```

应用层：

```text id="w3n8q6"
Inspector / CLI
    ↓
Conformance
    ↓
Regression
```

---

# 76. 不允许的依赖

```text id="j2x7m9"
conformance → inspector
conformance → React
conformance → Radix
regression → browser
regression → React
```

---

# 77. Property-Based Testing

纯数学 Metric 推荐：

```text id="m4q8x1"
Property-based testing
```

例如：

```text id="c6p2r9"
Color round trip
Geometry invariants
Contrast symmetry
Hue circularity
```

---

# 78. Color Properties

例如：

```text id="z7n3k5"
convert(
  convert(color)
)
≈
color
```

在明确 tolerance 内成立。

---

# 79. Geometry Properties

例如：

```text id="r2x8m4"
AREA = WIDTH × HEIGHT
```

且：

```text id="v5p1q7"
WIDTH >= 0
HEIGHT >= 0
```

---

# 80. Regression Safety

如果新版本出现：

```text id="n8k4p2"
NEW_FAILURE
```

CI 可以：

```text id="y3m7x9"
BLOCK
```

但是否 BLOCK：

> 由 Policy Profile 决定。

不是 Regression Engine 自己决定。

---

# 81. Acceptance Criteria

## AC-CONF-01

CORE Conformance 可独立执行。

## AC-CONF-02

Golden Test 可重复执行。

## AC-CONF-03

Golden Failure 不自动更新。

## AC-CONF-04

Metric Golden 支持明确 tolerance。

## AC-CONF-05

Rule Boundary 完整测试。

## AC-CONF-06

Evaluation 全状态覆盖。

## AC-CONF-07

Token Graph Conformance 可执行。

## AC-CONF-08

Theme Isolation 可验证。

## AC-CONF-09

Browser Conformance 支持多浏览器。

## AC-REG-01

Baseline 可以持久化。

## AC-REG-02

Current Snapshot 可以与 Baseline 比较。

## AC-REG-03

Regression 可以识别 NEW_FAILURE。

## AC-REG-04

Regression 可以识别 FIXED_FAILURE。

## AC-REG-05

Regression 可以识别 PERSISTING_FAILURE。

## AC-REG-06

Regression 可以识别 CHANGED_RESULT。

## AC-REG-07

Regression 可以识别 UNKNOWN 状态变化。

## AC-REG-08

Regression 不重新执行 Rule。

## AC-REG-09

Release Gate 可以消费 Regression Report。

## AC-REG-10

Regression 分类可重复。

---

# 82. 当前 UIQ 工程闭环

经过 Phase 9：

```text id="h7p3k2"
                    Design System
                         │
                   Token / Theme
                         │
                         ▼
                      Real UI
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
                    ┌────┴────┐
                    ▼         ▼
                 Finding   Regression
                    │         ▲
                    ▼         │
                Diagnostic    │
                    │          │
                    └────┬─────┘
                         │
                    Conformance
                         │
                         ▼
                    Release Gate
```

---

# 83. UIQ V1.0 已具备的能力

```text
✓ 浏览器实际 UI 测量
✓ Color Mathematics
✓ Typography Metrics
✓ Geometry Metrics
✓ Metric Execution
✓ Rule Evaluation
✓ Finding
✓ Diagnostic
✓ Evidence Trace
✓ Token Resolution
✓ Token Conformance
✓ Theme Conformance
✓ Inspector
✓ Golden Tests
✓ Browser Conformance
✓ Snapshot
✓ Regression
✓ Release Gate
```

---

# 84. 架构冻结

Phase 9 仍然不增加核心架构层。

Runtime 主链保持：

```text
Measurement
→ Metric
→ Rule
→ Evaluation
→ Finding
→ Diagnostic
```

外围工程能力：

```text
Token
Theme
Inspector
Conformance
Regression
```

都是已有能力的：

```text
Domain / Adapter / Application / Verification
```

而不是新的核心语义层。

---

# 85. UIQ V1.0 定义

到这里，UIQ V1.0 已经可以正式定义为：

> **UIQ 是一个以真实渲染 UI 为测量对象，以可复现 Metric 为量化基础，以显式 Rule 为评价依据，以 Finding / Diagnostic 为问题解释机制，以 Token / Theme Conformance 验证 Design System 与实际 UI 一致性，并通过 Golden、Browser Conformance 与 Regression 保证长期工程一致性的 UI Design Quantification System。**

核心闭环：

```text id="u5m8q2"
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
 ↓
CONFORMANCE
 ↓
REGRESSION
 ↓
RELEASE GATE
```

---

# 86. 下一阶段

下一阶段：

**UIQ-IMPL-12 CLI & CI/CD Integration Specification V1.0**

目标是把上述能力真正接入开发流程：

```text id="v2q7m4"
Developer
    ↓
pnpm uiq
    ↓
Analyze
    ↓
Conformance
    ↓
Regression
    ↓
Policy
    ↓
PASS / WARN / BLOCK
```

届时 UIQ 将不再只是 Inspector 工具，而可以作为前端项目的 **Design Quality / Design System Conformance Gate** 运行在本地开发、Pull Request 和 CI/CD 中。