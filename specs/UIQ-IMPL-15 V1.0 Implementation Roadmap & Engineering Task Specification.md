# UIQ-IMPL-15
# V1.0 Implementation Roadmap & Engineering Task Specification

**Status:** Frozen  
**Version:** 1.0.0  
**Phase:** Implementation Phase  
**Previous:** UIQ-IMPL-14 V1.0 Reference Application & End-to-End Acceptance Specification

---

# 1. 文档目的

本规范不再定义新的 UIQ 能力。

其目的只有三个：

1. 将 UIQ V1.0 规范转换为工程任务；
2. 明确开发顺序与依赖；
3. 定义 V1.0 的最终交付基线。

核心原则：

> **规范已经收敛，接下来只实现，不继续扩张架构。**

---

# 2. Implementation Target

最终工程：

```text
uiq/
├── packages/
│   ├── core
│   ├── color
│   ├── geometry
│   ├── measurement
│   ├── metrics
│   ├── rules
│   ├── diagnostic
│   ├── tokens
│   ├── theme
│   ├── browser
│   ├── conformance
│   └── regression
│
├── integrations/
│   └── radix
│
├── apps/
│   ├── inspector
│   ├── playground
│   ├── cli
│   └── reference
│
├── tests/
├── examples/
└── specs/
```

---

# 3. Development Order

严格按照依赖关系实现：

```text
P01 Core
 ↓
P02 Color
 ↓
P03 Geometry
 ↓
P04 Measurement
 ↓
P05 Metrics
 ↓
P06 Rules
 ↓
P07 Finding / Diagnostic
 ↓
P08 Token / Theme
 ↓
P09 Browser
 ↓
P10 Conformance
 ↓
P11 Regression
 ↓
P12 CLI
 ↓
P13 Inspector
 ↓
P14 Radix Adapter
 ↓
P15 Reference Application
 ↓
P16 E2E / CI
```

---

# 4. Phase P01 — Core

目录：

```text
packages/core/
```

实现：

```text
Entity
Measurement
Metric Contract
Metric Result
Rule Contract
Evaluation
Finding
Diagnostic
Registry
Execution Context
Fingerprint
```

---

# 5. P01 验收

必须通过：

```text
TypeScript
Typecheck
Unit Test
Schema Test
Contract Test
Architecture Test
```

特别验证：

```text
core
 ├── no DOM
 ├── no React
 ├── no Radix
 ├── no Browser API
 └── no Color dependency
```

---

# 6. Phase P02 — Color

目录：

```text
packages/color/
```

实现：

```text
HEX
sRGB
Linear RGB
XYZ D65
OKLab
OKLCH
Luminance
Contrast
ΔL
ΔC
ΔH
Gamut
```

---

# 7. P02 第一 Golden

必须首先通过：

```text
black → OKLab
white → OKLab
red → OKLab
green → OKLab
blue → OKLab
gray → OKLab
```

然后：

```text
black / white
→ contrast = 21
```

---

# 8. Phase P03 — Geometry

实现：

```text
WIDTH
HEIGHT
AREA
ASPECT_RATIO
CENTER_DISTANCE
EDGE_DISTANCE
OVERLAP
```

纯计算优先。

Browser measurement 后续接入。

---

# 9. Phase P04 — Measurement

定义：

```text
Measurement
MeasurementSnapshot
MeasurementSource
MeasurementStatus
```

Measurement 本身不能进行评价。

---

# 10. Phase P05 — Metrics

建立：

```text
MetricRegistry
MetricExecutionEngine
```

第一批：

```text
COLOR.SRGB
COLOR.OKLAB
COLOR.OKLCH
COLOR.LIGHTNESS
COLOR.CHROMA
COLOR.HUE
COLOR.CONTRAST

TYPOGRAPHY.FONT_SIZE
TYPOGRAPHY.FONT_WEIGHT
TYPOGRAPHY.LINE_HEIGHT

GEOMETRY.WIDTH
GEOMETRY.HEIGHT
GEOMETRY.AREA
GEOMETRY.ASPECT_RATIO
```

---

# 11. Metric Engine

执行：

```text
Snapshot
 ↓
Metric Registry
 ↓
Dependency Plan
 ↓
Metric Calculation
 ↓
MetricResult
```

不得：

```text
Metric
 ↓
Rule
```

---

# 12. Phase P06 — Rules

建立：

```text
RuleRegistry
RuleEvaluationEngine
```

第一批：

```text
ACCESSIBILITY.CONTRAST.WCAG_AA

ACCESSIBILITY.TARGET_SIZE.MINIMUM

TYPOGRAPHY.FONT_SIZE.MINIMUM

TYPOGRAPHY.LINE_HEIGHT.MINIMUM

SPACING.SCALE_CONFORMANCE

TOKEN.TOKEN_MATCH

TOKEN.COMPONENT_CONFORMANCE
```

---

# 13. Rule Engine

必须保证：

```text
MetricResult
 ↓
Rule
 ↓
EvaluationResult
```

Rule 不允许再次读取 DOM。

---

# 14. Phase P07 — Finding / Diagnostic

实现：

```text
Finding
FindingLifecycle
Diagnostic
Evidence
EvidenceTrace
```

链路：

```text
Evaluation
 ↓
Finding
 ↓
Diagnostic
```

---

# 15. Finding Golden

至少测试：

```text
PASS → no Finding
FAIL → Finding
WARN → Finding
UNKNOWN → configurable
ERROR → System Finding
```

---

# 16. Phase P08 — Token / Theme

实现：

```text
Token Graph
Token Resolution
Token Match
Token Deviation
Component Contract
Theme
Theme Variant
Theme Resolution
Theme Trace
Impact Trace
```

---

# 17. Token Graph

必须检测：

```text
A → B
B → C
C → A
```

结果：

```text
TOKEN_CYCLE
```

并返回完整路径。

---

# 18. Theme Golden

至少：

```text
Light
Dark
```

独立生成：

```text
Snapshot-Light
Snapshot-Dark
```

不能共享 Evaluation。

---

# 19. Phase P09 — Browser

实现：

```text
BrowserMeasurementAdapter
```

使用：

```ts
getComputedStyle()
getBoundingClientRect()
```

---

# 20. Browser Measurement

第一批：

```text
Color
Typography
Geometry
Spacing
```

复杂背景：

```text
gradient
image
video
backdrop-filter
```

如果 V1.0 无法精确计算：

```text
UNKNOWN
```

---

# 21. Browser Test

必须运行：

```text
Chromium
Firefox
WebKit
```

---

# 22. Phase P10 — Conformance

实现：

```text
GoldenRunner
SchemaRunner
ContractRunner
BrowserRunner
ConformanceRunner
```

支持：

```bash
pnpm uiq conformance --level core
pnpm uiq conformance --level standard
pnpm uiq conformance --level browser
pnpm uiq conformance --level full
```

---

# 23. Phase P11 — Regression

实现：

```text
Baseline
MetricDiff
EvaluationDiff
FindingDiff
RegressionClassification
RegressionReport
```

分类：

```text
NEW_FAILURE
FIXED_FAILURE
PERSISTING_FAILURE
CHANGED_RESULT
NEW_UNKNOWN
RESOLVED_UNKNOWN
```

---

# 24. Regression 核心原则

Regression：

> 比较已有结果。

不是：

> 再执行一次 Rule。

因此：

```text
Regression
 └── consume EvaluationResult
```

---

# 25. Phase P12 — CLI

实现：

```text
uiq inspect
uiq measure
uiq analyze
uiq evaluate
uiq conformance
uiq regression
uiq snapshot
uiq report
```

---

# 26. CLI 输出

必须支持：

```text
terminal
json
markdown
html
```

---

# 27. CLI Exit Code

```text
0 SUCCESS
1 POLICY_BLOCK
2 CONFORMANCE_FAILURE
3 EXECUTION_ERROR
4 INVALID_CONFIGURATION
5 INPUT_ERROR
```

---

# 28. Phase P13 — Inspector

Inspector：

```text
Element Tree
Rendered UI
Analysis Panel
```

Analysis：

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

# 29. Inspector 交互

第一版只实现：

```text
Hover
Select
Measure
Analyze
Trace
Export
```

不实现：

```text
Edit
Generate
Auto Fix
```

---

# 30. Phase P14 — Radix Adapter

只实现：

```text
Component Identity
State Identity
Token Binding
DOM Mapping
```

例如：

```text
Radix Button
      ↓
Design System Button
      ↓
data-uiq-id
      ↓
UIQ
```

---

# 31. Radix Adapter 不进入 Core

架构测试必须保证：

```text
@uiq/core
    X
@radix-ui/*
```

---

# 32. Phase P15 — Reference Application

实现：

```text
Button
Input
Card
Dialog
```

---

# 33. Button States

```text
Default
Hover
Active
Focus
Disabled
```

---

# 34. Input States

```text
Default
Focus
Disabled
Invalid
```

---

# 35. Card

验证：

```text
Padding
Gap
Radius
Geometry
Typography
Token
```

---

# 36. Dialog

验证：

```text
Overlay
Surface
Geometry
Focus
Contrast
```

---

# 37. Theme

Reference Application：

```text
Light
Dark
```

---

# 38. Reference Token Architecture

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

---

# 39. Phase P16 — E2E

完整测试：

```text
Theme
 ↓
Component
 ↓
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
 ↓
Conformance
 ↓
Regression
 ↓
Policy
```

---

# 40. E2E Scenario A — PASS

颜色：

```text
foreground = #FFFFFF
background = #2563EB
```

结果：

```text
Contrast ≈ 5.17
WCAG AA = PASS
Finding = 0
```

---

# 41. E2E Scenario B — FAIL

颜色：

```text
foreground = #777777
background = #FFFFFF
```

结果：

```text
Contrast ≈ 4.48
WCAG AA = FAIL
```

如果 Policy 配置为阻断：

```text
Gate = BLOCK
Exit Code = 1
```

---

# 42. E2E Scenario C — FIX

恢复：

```text
#2563EB
```

结果：

```text
FAIL → PASS
```

Regression：

```text
FIXED_FAILURE
```

---

# 43. E2E Scenario D — UNKNOWN

设置：

```css
background:
linear-gradient(...);
```

如果 V1.0 Adapter 无法精确解析：

```text
Metric = UNKNOWN
Evaluation = UNKNOWN
```

不能：

```text
UNKNOWN → FAIL
```

---

# 44. E2E Scenario E — Token Deviation

设计 Token：

```text
button.background
→ #2563EB
```

实际：

```text
#245FDB
```

结果：

```text
TOKEN_DEVIATION
```

但如果 Contrast 仍满足：

```text
ACCESSIBILITY.CONTRAST = PASS
```

两个结果必须同时存在。

---

# 45. E2E Scenario F — Theme

Light：

```text
Theme Validation
```

Dark：

```text
Theme Validation
```

分别输出结果。

不能：

```text
Light Result
 ↓
Dark Result
```

---

# 46. E2E Scenario G — Regression

Baseline：

```text
Button Contrast = 5.17
PASS
```

Current：

```text
Button Contrast = 4.48
FAIL
```

得到：

```text
NEW_FAILURE
```

---

# 47. CI Pipeline

最终：

```text
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm test:golden
pnpm test:schema
pnpm test:contract
pnpm test:browser
pnpm uiq conformance --level full
pnpm uiq regression
```

---

# 48. CI Artifact

保存：

```text
uiq/
├── snapshot.json
├── regression.json
├── conformance.json
└── report.html
```

---

# 49. Definition of Done

V1.0 实现必须满足：

```text
✓ npm/pnpm install
✓ TypeScript compile
✓ Unit tests
✓ Golden tests
✓ Schema tests
✓ Contract tests
✓ Browser tests
✓ Conformance tests
✓ Regression tests
✓ E2E tests
✓ CLI tests
```

---

# 50. Architecture Freeze Test

CI 中加入：

```text
architecture.test.ts
```

验证：

```text
core → no browser
core → no react
core → no radix

metrics → no rules
rules → no browser

regression → no rule execution

conformance → no browser dependency except browser runner
```

---

# 51. Dependency Rule

最终依赖：

```text
core
 ↑
color
geometry
measurement
 ↑
metrics
 ↑
rules
 ↑
diagnostic

tokens
theme
 ↑
browser

conformance
regression

apps
 ↓
all required packages
```

实际工程中依赖方向以此前冻结的 package contract 为准，不允许形成循环。

---

# 52. Version Policy

所有核心对象：

```text
Metric
Rule
Theme
Component
Token
Engine
```

必须具备明确 Version。

禁止：

```text
latest
```

作为可复现分析的隐式依赖。

---

# 53. Commit Strategy

建议按照能力提交：

```text
feat(core)
feat(color)
feat(geometry)
feat(metrics)
feat(rules)
feat(diagnostic)
feat(tokens)
feat(browser)
feat(conformance)
feat(regression)
feat(cli)
feat(inspector)
feat(reference)
test(e2e)
```

---

# 54. Implementation Milestones

## M1

Core + Color

## M2

Geometry + Measurement

## M3

Metric Engine

## M4

Rule Engine

## M5

Finding + Diagnostic

## M6

Token + Theme

## M7

Browser Adapter

## M8

Conformance + Regression

## M9

CLI

## M10

Inspector + Radix

## M11

Reference Application

## M12

E2E + CI

---

# 55. MVP 最小闭环

如果需要最快获得可运行成果，只实现：

```text
Button
 ↓
Browser Measurement
 ↓
COLOR.CONTRAST
 ↓
WCAG_AA
 ↓
Evaluation
 ↓
Finding
 ↓
Diagnostic
 ↓
CLI
```

然后逐步加入：

```text
Token
Theme
Regression
Inspector
```

---

# 56. 不允许为了 MVP 创建临时架构

禁止：

```text
TemporaryMetricEngine
TemporaryRuleEngine
TemporaryQualityEngine
TemporaryUIAnalyzer
```

MVP 必须直接实现正式接口。

---

# 57. 测试数据原则

Golden 数据必须：

```text
可读
可复现
可审查
可版本化
```

推荐：

```text
tests/golden/*.json
```

---

# 58. 生产代码与测试代码分离

生产：

```text
packages/
```

测试：

```text
tests/
```

Reference：

```text
apps/reference/
```

不得将测试逻辑反向引入生产 Package。

---

# 59. Performance Baseline

V1.0 不设极端性能指标。

优先保证：

```text
Correctness
Determinism
Traceability
Reproducibility
```

性能优化必须不能破坏这些性质。

---

# 60. Error Handling

所有 Runtime Error 必须分类：

```text
INPUT_ERROR
CONFIGURATION_ERROR
MEASUREMENT_ERROR
METRIC_ERROR
RULE_ERROR
BROWSER_ERROR
CONFORMANCE_ERROR
```

然后转换成统一 Runtime Result。

---

# 61. Logging

CLI 支持：

```bash
uiq analyze --verbose
```

默认输出简洁。

Verbose 可以显示：

```text
Snapshot
Metric
Rule
Finding
Diagnostic
Trace
```

---

# 62. Debug Trace

开发环境允许：

```text
--trace
```

输出：

```text
Element
 ↓
Measurement
 ↓
Metric
 ↓
Rule
 ↓
Evaluation
```

便于定位问题。

---

# 63. V1.0 不实现

以下全部明确排除：

```text
❌ AI aesthetic score
❌ Automatic color correction
❌ Automatic UI repair
❌ Design generation
❌ Visual editor
❌ Design DSL
❌ User behavior prediction
❌ Eye tracking
❌ Emotion recognition
❌ Backend service
❌ Database
❌ Message broker
```

---

# 64. Backend Decision

V1.0：

```text
Browser
+
TypeScript
+
CLI
```

即可运行。

不需要：

```text
Java Backend
Node Backend
Microservices
Database
```

---

# 65. Future Backend Trigger

只有出现以下需求才考虑后端：

```text
Centralized Governance
Multi-user History
Organization-wide Policy
Central Snapshot Repository
Long-term Trend
Audit
Distributed CI Governance
```

即：

> 后端是规模化治理需求驱动，而不是 UIQ V1.0 的架构前提。

---

# 66. V1.0 最终工程形态

```text
             Design System
                   │
                   ▼
                Real UI
                   │
                   ▼
             Browser Adapter
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
              │
              ▼
         Diagnostic
              │
              └────┬────┘
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

# 67. 最终完成标准

UIQ V1.0 不以：

```text
代码行数
Package 数量
Metric 数量
Rule 数量
```

作为完成标准。

而以：

```text
Reference Application
        ↓
Full Conformance
        ↓
E2E
        ↓
Regression
        ↓
CI
        ↓
Release Gate
```

能够稳定运行作为完成标准。

---

# 68. 收敛结论

UIQ 的设计阶段在：

**UIQ-IMPL-14**

已经结束。

UIQ-IMPL-15 开始进入：

> **Implementation Only**

后续工作原则：

```text
发现问题
 ↓
优先修正已有规范
 ↓
实现
 ↓
测试
 ↓
验证
```

而不是：

```text
发现问题
 ↓
增加一个新 Layer
 ↓
增加一个新 Engine
 ↓
增加一个新 Model
```

---

# 69. V1.0 最终目标

```text
             UIQ V1.0
                 │
       ┌─────────┴─────────┐
       │                   │
   Design System       Real UI
       │                   │
       └─────────┬─────────┘
                 ▼
             Measurement
                 ↓
               Metric
                 ↓
                Rule
                 ↓
             Evaluation
                 ↓
        Finding / Diagnostic
                 ↓
       Conformance / Regression
                 ↓
               Policy
                 ↓
            Release Gate
```

**这就是 UIQ V1.0 的最终工程闭环。**

后续优先级不再是“继续设计更多规范”，而是按照 M1 → M12 实现并用 Golden/E2E 将规范锁死。