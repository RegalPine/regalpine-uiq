# UIQ-TST-01
## Conformance & Golden Test Specification V1.0

**Status:** Stable / Architecture Freeze  
**Version:** 1.0.0  
**Module:** UIQ Conformance & Testing  
**Depends On:** UIQ-FM-01 / UIQ-MR-01 / UIQ-TK-01 / UIQ-ER-02 / UIQ-DG-01 / UIQ-REF-02

---

# 1. 文档目标

本规范定义 UIQ V1.0 的一致性验证体系。

目标：

```text
Specification
      ↓
Schema
      ↓
Implementation
      ↓
Golden Test
      ↓
Conformance Test
      ↓
Regression Test
```

核心问题：

> 如何证明一个 UIQ 实现真正遵守 UIQ 规范，而不是“看起来实现了”。

---

# 2. 测试体系定位

UIQ 测试体系不是单纯的 Unit Test。

完整结构：

```text
                    ┌─────────────────┐
                    │ Specification  │
                    └────────┬────────┘
                             ↓
                    ┌─────────────────┐
                    │ Schema Tests    │
                    └────────┬────────┘
                             ↓
        ┌────────────────────┼────────────────────┐
        ↓                    ↓                    ↓
   Unit Tests          Golden Tests       Contract Tests
        ↓                    ↓                    ↓
        └────────────────────┼────────────────────┘
                             ↓
                    Conformance Tests
                             ↓
                    Regression Tests
```

---

# 3. V1.0 测试层级

正式定义：

```text
T1 Unit
T2 Metric Golden
T3 Rule Golden
T4 Diagnostic Golden
T5 Schema
T6 Contract
T7 Browser Conformance
T8 Integration
T9 Regression
T10 End-to-End
```

---

# 4. T1 Unit Test

验证单个纯函数或单个类。

例如：

```text
parseHex()
srgbToLinear()
linearToSrgb()
rgbToOklab()
oklabToOklch()
calculateContrast()
calculateArea()
calculateAspectRatio()
```

要求：

```text
Deterministic
Pure where possible
No DOM dependency
```

---

# 5. T2 Metric Golden Test

Golden Test 是 UIQ 的核心测试机制。

输入固定：

```text
Measurement
```

输出必须落在规定 tolerance 内。

例如：

```json
{
  "metric": "COLOR.CONTRAST",
  "version": "1.0.0",
  "input": {
    "foreground": "#FFFFFF",
    "background": "#2563EB"
  },
  "expected": 5.17,
  "tolerance": 0.01
}
```

---

# 6. Golden Test 原则

Golden Test 必须固定：

```text
Input
Metric Version
Expected Output
Tolerance
Test ID
```

不得只保存：

```text
expected = 5.17
```

必须能够知道：

```text
为什么是 5.17
```

---

# 7. Golden Test Schema

```ts
interface MetricGoldenCase<TInput, TOutput> {
  id: string;

  metricId: string;
  metricVersion: string;

  input: TInput;

  expected: TOutput;

  tolerance?: number;

  notes?: string;
}
```

---

# 8. Color Golden Cases

## 8.1 White / Black

```text
COLOR.CONTRAST@1.0.0

foreground = #FFFFFF
background = #000000

expected = 21
```

Tolerance：

```text
0.0001
```

---

## 8.2 White / Blue

```text
foreground = #FFFFFF
background = #2563EB
```

Expected：

```text
≈ 5.17
```

Tolerance：

```text
0.01
```

---

## 8.3 Gray / White

```text
foreground = #777777
background = #FFFFFF
```

Expected：

```text
≈ 4.48
```

---

# 9. Alpha Golden Cases

必须测试：

```text
#RRGGBBAA
```

例如：

```text
foreground = #FFFFFF80
```

背景：

```text
#000000
```

验证：

```text
alpha compositing
```

不得简单忽略 alpha。

---

# 10. Transparent Background Cases

必须测试：

```text
element background = transparent
parent background = #FFFFFF
```

正确行为：

```text
resolve effective background
```

---

# 11. Unsupported Background Cases

例如：

```text
background:
linear-gradient(...)
```

如果 V1.0 无法可靠确定有效背景：

```text
Metric Result = UNKNOWN
```

不能：

```text
Metric Result = PASS
```

也不能任意选一个颜色近似。

---

# 12. OKLab Golden Tests

至少包括：

```text
black
white
red
green
blue
gray
neutral
low chroma
```

测试：

```text
sRGB → Linear RGB
Linear RGB → XYZ
XYZ → OKLab
OKLab → OKLCH
```

---

# 13. Hue Undefined Test

低 Chroma：

```text
C ≈ 0
```

必须：

```text
H = UNDEFINED
```

禁止：

```text
H = 0°
```

因为：

```text
0°
```

会错误地暗示该颜色存在明确 Hue。

---

# 14. Geometry Golden Tests

测试：

```text
WIDTH
HEIGHT
AREA
ASPECT_RATIO
CENTER_DISTANCE
EDGE_DISTANCE
OVERLAP
```

例如：

```json
{
  "width": 100,
  "height": 50,
  "expectedArea": 5000,
  "expectedAspectRatio": 2
}
```

---

# 15. Geometry Coordinate System

V1.0 默认：

```text
getBoundingClientRect()
```

坐标：

```text
viewport-relative
```

Golden Test 必须明确：

```text
viewport
scroll
devicePixelRatio
zoom
```

避免把不同坐标系统混在一起。

---

# 16. Typography Golden Tests

至少覆盖：

```text
FONT_SIZE
FONT_WEIGHT
LINE_HEIGHT
LETTER_SPACING
TEXT_MEASURE
SCALE_RATIO
```

特别测试：

```text
font-weight: 437
```

Expected：

```text
437
```

不得：

```text
400
```

---

# 17. Line Height Test

测试：

```text
line-height: 1.5
font-size: 16px
```

应得到：

```text
computed line height ≈ 24px
```

同时保留：

```text
source type = UNIT_LESS
ratio = 1.5
```

如果实现只保存 24px，则丢失原始语义。

---

# 18. Rule Golden Test

Rule Golden Test 与 Metric Golden Test 分离。

例如：

```text
Metric:
contrast = 5.17
```

Rule：

```text
contrast >= 4.5
```

Expected：

```text
PASS
```

---

# 19. Rule Boundary Tests

每一个阈值 Rule 至少需要：

```text
below
exact
above
```

例如：

```text
4.49 → FAIL
4.50 → PASS
4.51 → PASS
```

如果存在 tolerance：

```text
boundary behavior
```

必须单独测试。

---

# 20. Evaluation State Tests

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

# 21. NOT_APPLICABLE Test

例如 Rule 只适用于：

```text
interactive element
```

输入：

```text
decorative div
```

Expected：

```text
NOT_APPLICABLE
```

而不是：

```text
PASS
```

---

# 22. UNKNOWN Test

Metric 缺失：

```text
COLOR.CONTRAST unavailable
```

Expected：

```text
UNKNOWN
```

---

# 23. ERROR Test

例如：

```text
Metric type = string
Rule expects number
```

Expected：

```text
ERROR
```

---

# 24. Diagnostic Golden Test

输入：

```text
Finding
+
Evidence
+
Token Graph
```

Expected：

```text
Diagnostic
+
Cause
+
Trace
```

例如：

```text
Button
 ↓
button.primary.background
 ↓
color.primary.600
```

应该能够建立：

```text
RESOLVED_FROM
```

关系。

---

# 25. Diagnostic Confidence Test

直接证据：

```text
Token explicitly resolved to value
```

Expected：

```text
DIRECT
```

推断关系：

```text
shared token may affect multiple findings
```

Expected：

```text
INFERRED
```

没有足够信息：

```text
UNKNOWN
```

---

# 26. Evidence Integrity Test

每一个：

```text
FAIL
```

至少必须能够找到：

```text
Rule
Metric
Actual Value
Expected Constraint
```

否则：

```text
Conformance Failure
```

---

# 27. Finding Integrity

Finding 必须能够回溯：

```text
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

如果链断裂：

```text
INVALID FINDING
```

---

# 28. Token Trace Test

测试：

```text
Primitive Token
 ↓
Semantic Token
 ↓
Component Token
 ↓
Element
```

要求：

```text
No Cycle
Complete Resolution
Traceable Resolution
```

---

# 29. Token Cycle Test

例如：

```text
A → B
B → C
C → A
```

必须：

```text
REJECT
```

不得进入正常 Token Resolution。

---

# 30. Token Orphan Test

例如：

```text
color.primary.500
```

没有任何消费者。

这不是：

```text
INVALID
```

而是：

```text
ORPHAN
```

可产生：

```text
INFO / WARN
```

具体由 Policy 决定。

---

# 31. Theme Conformance Test

至少测试：

```text
light
dark
high-contrast
custom
```

每个 Theme 独立执行：

```text
Token Resolution
Metric Evaluation
Rule Evaluation
```

---

# 32. Theme Isolation Test

要求：

```text
Theme A evaluation
```

不能污染：

```text
Theme B evaluation
```

例如：

```text
Light:
contrast = 5.17

Dark:
contrast = 7.12
```

两个结果必须独立。

---

# 33. Schema Test

所有正式对象必须拥有 JSON Schema。

至少：

```text
Measurement
MetricDefinition
MetricResult
RuleDefinition
RuleConfiguration
EvaluationResult
Finding
Diagnostic
DesignToken
Theme
PolicyProfile
```

---

# 34. Schema Compatibility

Schema 修改必须验证：

```text
Backward Compatibility
Forward Compatibility
Required Fields
Optional Fields
Enum Changes
Type Changes
```

重大不兼容变化必须进入：

```text
MAJOR
```

---

# 35. Contract Test

Package 之间必须通过 Contract Test 验证。

例如：

```text
@uiq/metrics
        ↓
@uiq/rules
```

Contract：

```text
MetricResult
```

必须满足 Rule 所要求的：

```text
metricId
version
value
unit
status
dependencies
```

---

# 36. Package Contract Matrix

| Provider | Consumer | Contract |
|---|---|---|
| core | metrics | Metric API |
| color | metrics | Color Model |
| geometry | metrics | Geometry Model |
| measurement | metrics | Measurement API |
| metrics | rules | MetricResult |
| rules | diagnostic | Evaluation/Finding |
| tokens | diagnostic | Token Graph |
| theme | diagnostic | Theme Resolution |
| browser | measurement | Browser Measurement |
| conformance | all | Schema/API contracts |

---

# 37. Browser Conformance

浏览器测试必须区分：

```text
Calculation Conformance
```

与：

```text
Browser Measurement Conformance
```

纯数学计算：

```text
sRGB
OKLab
Contrast
Geometry
```

应尽可能与浏览器无关。

而：

```text
getComputedStyle()
getBoundingClientRect()
```

属于 Browser Measurement。

---

# 38. Browser Matrix

V1.0 推荐验证：

```text
Chromium
Firefox
WebKit
```

重点不是要求所有浏览器返回完全相同的 DOM 数值，而是：

```text
documented tolerance
```

内一致。

---

# 39. Browser Tolerance

例如 Geometry：

```text
expected = 100px
```

允许：

```text
100 ± configured tolerance
```

但 tolerance 必须：

```text
explicit
versioned
documented
```

不能为了让测试通过而动态扩大 tolerance。

---

# 40. Snapshot Reproducibility Test

同一个：

```text
MeasurementSnapshot
```

重复运行：

```text
Metric Engine
Rule Engine
Diagnostic Engine
```

结果必须一致。

测试：

```text
run #1
run #2
run #3
```

要求：

```text
same fingerprint
```

---

# 41. Fingerprint Test

验证：

```text
snapshotHash
metricVersions
ruleVersions
configurationHash
engineVersion
```

发生变化时：

```text
fingerprint changes
```

否则：

```text
fingerprint remains identical
```

---

# 42. Regression Test

每次发布：

```text
Current
```

与：

```text
Baseline
```

比较：

```text
Metric
Evaluation
Finding
Diagnostic
```

---

# 43. Regression Categories

```text
NEW_FAILURE
FIXED_FAILURE
PERSISTING_FAILURE
CHANGED_RESULT
NEW_UNKNOWN
RESOLVED_UNKNOWN
```

---

# 44. 不允许静默改变结果

例如：

```text
v1.0.0
contrast = 4.48
FAIL
```

升级：

```text
v1.1.0
contrast = 4.48
PASS
```

如果 Rule 语义没有改变：

```text
Regression Test = FAIL
```

必须调查。

不能简单更新 Golden File。

---

# 45. Golden File Update Policy

禁止：

```text
test failed
→ regenerate all expected values
```

必须：

```text
Failure
 ↓
Review
 ↓
Determine intentional change
 ↓
Update specification/version
 ↓
Update golden
```

---

# 46. Property-Based Testing

对于纯数学 Metric，推荐加入 Property Test。

例如 Contrast：

```text
contrast(A, B) == contrast(B, A)
```

对于：

```text
L1 >= L2
```

必须：

```text
contrast >= 1
```

且：

```text
contrast(A, A) = 1
```

---

# 47. Color Properties

必须验证：

```text
RGB normalization
range constraints
NaN prevention
Infinity prevention
round-trip constraints
```

例如：

```text
OKLab → OKLCH → OKLab
```

在允许误差范围内保持一致。

---

# 48. Geometry Properties

例如：

```text
width >= 0
height >= 0
area >= 0
```

如果：

```text
height = 0
```

则：

```text
aspectRatio = UNKNOWN
```

不能产生：

```text
Infinity
```

作为正常 Metric Result。

---

# 49. Numeric Safety

所有 Metric 必须防止：

```text
NaN
Infinity
division by zero
negative dimensions
invalid color channels
```

Numeric error 应明确转化为：

```text
UNKNOWN
```

或：

```text
ERROR
```

而不是污染后续计算。

---

# 50. Test ID Convention

推荐：

```text
T-{DOMAIN}-{NUMBER}
```

例如：

```text
T-COLOR-001
T-COLOR-002

T-GEOMETRY-001

T-RULE-001

T-DIAGNOSTIC-001

T-TOKEN-001
```

---

# 51. Test Fixture Structure

```text
tests/
├── golden/
│   ├── color/
│   ├── geometry/
│   ├── typography/
│   └── spacing/
│
├── rules/
│   ├── accessibility/
│   ├── typography/
│   └── conformance/
│
├── diagnostics/
│
├── tokens/
│
├── themes/
│
├── browser/
│
└── regression/
```

---

# 52. Golden JSON Example

```json
{
  "id": "T-COLOR-001",
  "metricId": "COLOR.CONTRAST",
  "metricVersion": "1.0.0",

  "input": {
    "foreground": "#FFFFFF",
    "background": "#2563EB"
  },

  "expected": {
    "value": 5.17,
    "status": "OK"
  },

  "tolerance": {
    "type": "ABSOLUTE",
    "value": 0.01
  }
}
```

---

# 53. Rule Golden Example

```json
{
  "id": "T-RULE-001",

  "rule": {
    "id": "ACCESSIBILITY.CONTRAST.WCAG_AA",
    "version": "1.0.0"
  },

  "metric": {
    "id": "COLOR.CONTRAST",
    "version": "1.0.0",
    "value": 5.17
  },

  "expected": {
    "state": "PASS"
  }
}
```

---

# 54. Diagnostic Golden Example

```json
{
  "id": "T-DIAGNOSTIC-001",

  "finding": {
    "ruleId": "ACCESSIBILITY.CONTRAST.WCAG_AA",
    "state": "FAIL"
  },

  "expected": {
    "type": "ACCESSIBILITY",
    "confidence": "DIRECT"
  }
}
```

---

# 55. End-to-End Golden Test

UIQ 必须至少有一个完整 Golden Path：

```text
HTML
 ↓
Browser Measurement
 ↓
MeasurementSnapshot
 ↓
COLOR.CONTRAST
 ↓
WCAG Contrast Rule
 ↓
FAIL
 ↓
Finding
 ↓
Diagnostic
```

测试输出必须固定。

---

# 56. MVP E2E Case

HTML：

```html
<button id="submit">
  Submit
</button>
```

CSS：

```css
#submit {
  color: #777777;
  background: #ffffff;
}
```

Expected：

```text
COLOR.CONTRAST ≈ 4.48
```

Rule：

```text
contrast >= 4.5
```

Evaluation：

```text
FAIL
```

Finding：

```text
1
```

Diagnostic：

```text
ACCESSIBILITY
```

---

# 57. Passing E2E Case

```css
#submit {
  color: #ffffff;
  background: #2563eb;
}
```

Expected：

```text
contrast ≈ 5.17
```

Evaluation：

```text
PASS
```

Finding：

```text
0
```

---

# 58. Unknown E2E Case

```css
#submit {
  color: #ffffff;
  background:
    linear-gradient(
      red,
      blue
    );
}
```

如果 V1.0 无法可靠解析有效背景：

```text
Metric = UNKNOWN
Evaluation = UNKNOWN
```

不得：

```text
PASS
```

---

# 59. Test Coverage

Coverage 不应只使用：

```text
line coverage
```

UIQ 更重要的是：

```text
Metric coverage
Rule coverage
State coverage
Schema coverage
Browser coverage
Evidence coverage
```

---

# 60. Minimum V1.0 Conformance Requirements

一个实现要声明：

```text
UIQ V1.0 Conformant
```

至少必须通过：

```text
✓ Core Schema
✓ Color Metrics
✓ Geometry Metrics
✓ Typography Metrics
✓ Contrast Rule
✓ Evaluation States
✓ Finding Traceability
✓ Diagnostic Evidence
✓ Token Resolution
✓ Token Cycle Detection
✓ Theme Isolation
✓ Golden Tests
✓ Regression Tests
```

---

# 61. Conformance Levels

V1.0 定义：

```text
CORE
STANDARD
BROWSER
FULL
```

## CORE

通过：

```text
Core Model
Metric
Rule
Evaluation
```

---

## STANDARD

CORE +

```text
Finding
Diagnostic
Token
Theme
```

---

## BROWSER

STANDARD +

```text
Browser Measurement
```

---

## FULL

BROWSER +

```text
Golden
Schema
Contract
Regression
E2E
```

---

# 62. Conformance Manifest

实现必须提供：

```json
{
  "implementation": "example-uiq",
  "uiqVersion": "1.0.0",

  "conformance": {
    "core": true,
    "standard": true,
    "browser": true,
    "full": true
  },

  "metrics": [
    "COLOR.CONTRAST@1.0.0",
    "COLOR.OKLAB@1.0.0",
    "GEOMETRY.WIDTH@1.0.0"
  ],

  "rules": [
    "ACCESSIBILITY.CONTRAST.WCAG_AA@1.0.0"
  ]
}
```

---

# 63. Conformance Claim

实现不得声称：

```text
UIQ V1.0 Compatible
```

如果只实现：

```text
COLOR.CONTRAST
```

应该声明：

```text
Partial Conformance
```

并列出具体能力。

---

# 64. CI Pipeline

推荐：

```text
Pull Request
     ↓
Lint
     ↓
Type Check
     ↓
Unit Test
     ↓
Golden Test
     ↓
Schema Test
     ↓
Contract Test
     ↓
Browser Test
     ↓
Regression
     ↓
E2E
     ↓
Conformance Manifest
```

---

# 65. Package CI

每个 Package 必须独立验证：

```text
@uiq/core
@uiq/color
@uiq/geometry
@uiq/measurement
@uiq/metrics
@uiq/rules
@uiq/diagnostic
@uiq/tokens
@uiq/theme
@uiq/browser
@uiq/conformance
```

---

# 66. Conformance Package

`@uiq/conformance` 负责：

```text
Schema Validation
Golden Test Runner
Rule Test Runner
Metric Test Runner
Diagnostic Test Runner
Conformance Report
```

它不参与：

```text
Runtime Calculation
```

---

# 67. CLI

提供：

```bash
uiq conformance
```

以及：

```bash
uiq conformance --level core
uiq conformance --level standard
uiq conformance --level browser
uiq conformance --level full
```

输出：

```text
UIQ Conformance Report

Core        PASS
Standard    PASS
Browser     PASS
Full        PASS
```

---

# 68. Machine-Readable Report

CLI 同时支持：

```bash
uiq conformance --format json
```

输出：

```json
{
  "version": "1.0.0",
  "status": "PASS",
  "tests": {
    "total": 248,
    "passed": 248,
    "failed": 0,
    "skipped": 0
  }
}
```

---

# 69. Architecture Freeze

测试体系不增加新的运行时核心层。

```text
@uiq/conformance
```

属于：

```text
Validation Infrastructure
```

不是：

```text
Core Semantic Layer
```

---

# 70. V1.0 收敛原则

从这一阶段开始：

> **新增需求优先通过测试暴露问题，而不是继续增加架构层。**

未来如果发现：

```text
Metric 不足
```

增加 Metric。

如果：

```text
规范不足
```

增加 Rule。

如果：

```text
解释不足
```

增加 Diagnostic Generator。

如果：

```text
浏览器不足
```

增加 Adapter。

如果：

```text
实现错误
```

修复 Implementation。

只有发现：

```text
现有核心模型无法表达需求
```

才允许修改 Core。

---

# 71. UIQ V1.0 验证闭环

最终形成：

```text
             Specification
                   │
                   ↓
              Implementation
                   │
        ┌──────────┼──────────┐
        ↓          ↓          ↓
      Metric      Rule     Diagnostic
      Tests       Tests       Tests
        └──────────┼──────────┘
                   ↓
              Conformance
                   ↓
              Regression
                   ↓
             Release Gate
```

---

# 72. 当前 UIQ 架构状态

至此，UIQ V1.0 已完成：

```text
✓ Formal Model
✓ Metric Registry
✓ Token / Theme
✓ Reference Architecture
✓ Reference Implementation
✓ Metric Implementation
✓ Rule Engine
✓ Finding
✓ Diagnostic
✓ Conformance
✓ Golden Test
✓ Regression
```

主链：

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

验证链：

```text
Specification
 ↓
Implementation
 ↓
Golden
 ↓
Conformance
 ↓
Regression
```

---

# 73. 最终架构冻结声明

UIQ V1.0 **不再继续新增核心架构层**。

允许演进：

```text
Metrics
Rules
Diagnostics
Adapters
Tokens
Themes
Policy Profiles
Conformance Tests
```

不允许无明确必要地增加：

```text
Universal Design Engine
Design Intelligence Layer
Aesthetic Engine
AI Judgment Engine
Meta Evaluation Engine
```

---

# 74. UIQ V1.0 的工程定义

最终可以将 UIQ 定义为：

> **一个以浏览器实际 UI 状态为测量对象，以可复现 Metric 为量化基础，以显式 Rule 为评价依据，以 Finding 与 Diagnostic 为问题解释机制，并通过 Conformance / Golden / Regression Test 保证实现一致性的 UI 设计量化系统。**

正式闭环：

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
  ↓
CONFORMANCE
  ↓
REGRESSION
```

这条链构成 UIQ V1.0 的完整工程闭环。