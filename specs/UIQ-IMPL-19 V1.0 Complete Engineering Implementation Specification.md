# UIQ-IMPL-19
# UIQ V1.0 Complete Engineering Implementation Specification
## M15 — Complete Project Skeleton & Implementation Baseline

**状态：Implementation Baseline**  
**版本：V1.0**  
**目标：将 UIQ 已冻结的规范统一落实为可直接开发、测试、构建和发布的 TypeScript/pnpm 工程。**

---

# 1. M15 目标

M15 不再设计新的 UIQ 能力。

目标是把：

```text
UIQ Specification
        ↓
Package Architecture
        ↓
Source Code
        ↓
Tests
        ↓
Reference Application
        ↓
CLI
        ↓
CI
        ↓
Release
```

形成一个完整工程。

---

# 2. 最终工程结构

```text
uiq/
├── package.json
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── tsconfig.base.json
├── vitest.config.ts
├── playwright.config.ts
├── eslint.config.js
├── prettier.config.js
├── uiq.config.json
│
├── packages/
│   ├── core/
│   ├── color/
│   ├── geometry/
│   ├── measurement/
│   ├── metrics/
│   ├── rules/
│   ├── diagnostic/
│   ├── tokens/
│   ├── theme/
│   ├── browser/
│   ├── conformance/
│   ├── regression/
│   └── reporting/
│
├── integrations/
│   └── radix/
│
├── apps/
│   ├── inspector/
│   ├── playground/
│   ├── reference/
│   └── cli/
│
├── tests/
│   ├── architecture/
│   ├── golden/
│   ├── integration/
│   ├── browser/
│   └── e2e/
│
├── specs/
│   ├── UIQ-01.md
│   ├── UIQ-FM-01.md
│   ├── UIQ-MR-01.md
│   ├── UIQ-TK-01.md
│   ├── UIQ-ER-02.md
│   ├── UIQ-DG-01.md
│   ├── UIQ-TST-01.md
│   ├── UIQ-REF-01.md
│   ├── UIQ-IMPL-01.md
│   ├── ...
│   └── UIQ-IMPL-19.md
│
└── .github/
    └── workflows/
        └── ci.yml
```

---

# 3. Package Dependency Graph

最终依赖固定为：

```text
                         ┌──────────────┐
                         │    core      │
                         └──────┬───────┘
                                │
              ┌─────────────────┼──────────────────┐
              ▼                 ▼                  ▼
           color            geometry          measurement
              │                 │                  │
              └────────────┬────┴──────────────────┘
                           ▼
                        metrics
                           │
                           ▼
                         rules
                           │
                           ▼
                       diagnostic

tokens ───────────────┐
theme  ───────────────┤
                      ▼
                    browser
                      │
                      ▼
                  integration
                      │
                      ▼
                   Inspector

conformance ────────┐
regression ─────────┤
                    ▼
                 reporting
                    │
                    ▼
                Inspector / CLI
```

更严格的依赖：

```text
core
  → nothing

color
  → core

geometry
  → core

measurement
  → core

metrics
  → core
  → color
  → geometry
  → measurement

rules
  → core

diagnostic
  → core

tokens
  → core

theme
  → core
  → tokens

browser
  → core
  → measurement
  → color
  → geometry
  → tokens
  → theme

conformance
  → core

regression
  → core

reporting
  → core
  → diagnostic
  → conformance
  → regression
```

---

# 4. 严格禁止的依赖

以下依赖必须通过 Architecture Test 阻止：

```text
core → React
core → Vue
core → Radix
core → Browser

color → React
metrics → React
metrics → rules

rules → browser
rules → DOM

diagnostic → React

conformance → browser

regression → rules
regression → browser

reporting → browser
reporting → React
```

特别是：

```text
@uiq/reporting
```

不得因为 HTML Renderer 而引入浏览器 API。

---

# 5. Root package.json

```json
{
  "name": "uiq",
  "private": true,
  "packageManager": "pnpm@10",
  "scripts": {
    "build": "pnpm -r build",
    "dev": "pnpm --parallel --filter './apps/*' dev",
    "test": "pnpm -r test",
    "test:unit": "vitest run",
    "test:watch": "vitest",
    "test:golden": "pnpm --filter @uiq/conformance test",
    "typecheck": "pnpm -r typecheck",
    "lint": "pnpm -r lint",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test:browser": "playwright test",
    "conformance": "pnpm --filter @uiq/cli uiq conformance",
    "regression": "pnpm --filter @uiq/cli uiq regression",
    "ci": "pnpm lint && pnpm typecheck && pnpm test && pnpm build"
  }
}
```

---

# 6. Workspace

```yaml
packages:
  - "packages/*"
  - "integrations/*"
  - "apps/*"
  - "tests/*"
```

---

# 7. TypeScript Baseline

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noImplicitOverride": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true
  }
}
```

---

# 8. Package Naming

统一：

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
@uiq/regression
@uiq/reporting
```

Application：

```text
@uiq/inspector
@uiq/playground
@uiq/reference
@uiq/cli
```

---

# 9. Package Public API

每个 Package 只允许通过：

```text
src/index.ts
```

暴露公共 API。

禁止：

```text
import { X } from "@uiq/core/src/internal/X"
```

必须：

```text
import { X } from "@uiq/core"
```

---

# 10. Core Implementation

`@uiq/core` 是整个系统的契约基础。

目录：

```text
packages/core/src/

entity/
measurement/
metric/
rule/
evaluation/
finding/
diagnostic/
execution/
fingerprint/
index.ts
```

Core 只提供：

```text
Entity
Measurement
Metric Contract
Rule Contract
Evaluation Contract
Finding Contract
Diagnostic Contract
Registry Contract
Execution Context
Fingerprint
```

---

# 11. Color Implementation

```text
packages/color/src/

types/
parsing/
srgb/
xyz/
oklab/
oklch/
luminance/
contrast/
difference/
gamut/
index.ts
```

严格计算链：

```text
CSS Color
 ↓
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

所有数学函数必须：

- pure
- deterministic
- 无 DOM
- 无网络
- 无随机数
- 不修改输入

---

# 12. Geometry

```text
packages/geometry/src/

types/
distance/
overlap/
ratio/
index.ts
```

Geometry package 不负责：

```text
DOM
getBoundingClientRect()
CSS
Browser
```

这些属于：

```text
@uiq/browser
```

---

# 13. Measurement

Measurement package 定义统一测量模型。

```text
packages/measurement/src/

MeasurementCollector
MeasurementSnapshotBuilder
MeasurementNormalizer
MeasurementValidator
index.ts
```

Measurement 本身不判断：

```text
PASS
FAIL
WARN
```

---

# 14. Metric Runtime

```text
packages/metrics/src/

definitions/
engine/
registry/
execution/
builtins/
index.ts
```

执行：

```text
Snapshot
 ↓
Metric Registry
 ↓
Dependency Plan
 ↓
Metric Execution
 ↓
MetricResult
```

禁止：

```text
Metric → Rule
Metric → Finding
Metric → Recommendation
```

---

# 15. Rule Runtime

```text
packages/rules/src/

definitions/
engine/
registry/
operators/
ranges/
tolerance/
policy/
release/
index.ts
```

执行：

```text
MetricResult
 ↓
Rule
 ↓
Applicability
 ↓
Condition
 ↓
EvaluationResult
```

Rule 不重新计算 Metric。

---

# 16. Diagnostic Runtime

```text
packages/diagnostic/src/

diagnostic/
evidence/
trace/
root-cause/
index.ts
```

职责：

```text
Finding
 ↓
Evidence
 ↓
Cause
 ↓
Explanation
```

Diagnostic 不改变：

```text
Evaluation
Finding
Rule
Metric
```

---

# 17. Token Runtime

```text
packages/tokens/src/

model/
graph/
resolution/
conformance/
trace/
impact/
index.ts
```

核心链：

```text
Primitive
 ↓
Semantic
 ↓
Component
 ↓
CSS Variable
 ↓
Computed Value
```

Cycle：

```text
A → B → A
```

必须报错。

Orphan：

```text
Token exists
but is unused
```

属于：

```text
ORPHAN
```

而不是：

```text
INVALID
```

---

# 18. Theme Runtime

```text
packages/theme/src/

model/
resolution/
validation/
comparison/
impact/
index.ts
```

Theme：

```text
Light
Dark
High Contrast
Custom
```

必须独立计算。

---

# 19. Browser Adapter

```text
packages/browser/src/

adapter/
entity/
color/
typography/
geometry/
spacing/
environment/
index.ts
```

唯一职责：

```text
DOM
 ↓
Computed Style / Geometry
 ↓
Measurement
```

禁止：

```text
DOM
 ↓
PASS/FAIL
```

---

# 20. Reporting Runtime

```text
packages/reporting/src/

model/
aggregation/
diagnostic/
recommendation/
impact/
verification/
generator/
renderer/
index.ts
```

Reporting：

```text
Existing Results
 ↓
Aggregation
 ↓
Report
```

Recommendation：

```text
Finding
+
Diagnostic
+
Evidence
+
Impact
 ↓
Recommendation
```

---

# 21. Reporting 不重新计算

例如已有：

```text
contrast = 4.48
```

Reporting 不能再次执行：

```text
contrast(colorA,colorB)
```

Reporting 只读取：

```ts
MetricResult
```

---

# 22. Conformance Runtime

```text
packages/conformance/src/

golden/
schema/
contract/
browser/
snapshot/
index.ts
```

负责：

```text
Contract
Golden
Schema
Browser
Conformance
```

---

# 23. Regression Runtime

```text
packages/regression/src/

baseline/
diff/
classification/
report/
index.ts
```

负责：

```text
Baseline
 ↓
Current
 ↓
Diff
 ↓
Classification
 ↓
RegressionReport
```

Regression 不重新执行 Rule。

---

# 24. Inspector

Inspector 是 UIQ 的主要交互应用。

技术：

```text
React
TypeScript
Vite
Radix UI
CSS
```

Inspector 不实现 UIQ 核心计算。

---

# 25. Inspector Application State

```ts
interface InspectorState {
  selectedSubjectId?: string;
  snapshotId?: string;
  themeId?: string;
  mode: InspectorMode;
  activePanel: ReportPanel;
  report?: UIQualityReport;
}
```

---

# 26. Inspector Mode

```ts
type InspectorMode =
  | "ANALYSIS"
  | "VALIDATION"
  | "CONFORMANCE"
  | "REGRESSION";
```

---

# 27. Inspector UI

```text
┌────────────────────────────────────────────────────────────┐
│ UIQ Inspector                                               │
├──────────────┬──────────────────────────┬──────────────────┤
│ Element Tree │ Rendered UI              │ Analysis         │
│              │                          │                  │
│ Button       │                          │ Overview         │
│ Input        │        UI                │ Measurement      │
│ Card         │                          │ Metrics          │
│ Dialog       │                          │ Rules            │
│              │                          │ Findings         │
│              │                          │ Diagnostics      │
│              │                          │ Recommendations  │
│              │                          │ Verification     │
│              │                          │ Tokens           │
│              │                          │ Theme            │
│              │                          │ Trace            │
│              │                          │ Regression       │
└──────────────┴──────────────────────────┴──────────────────┘
```

---

# 28. Quality Overview

Overview 不显示单一质量分数。

显示：

```text
Elements measured
Metrics
Evaluations

PASS
FAIL
WARN
UNKNOWN
NOT_APPLICABLE
ERROR

Findings
Recommendations
```

---

# 29. Finding → Recommendation UI

推荐卡：

```text
┌─────────────────────────────────────────────┐
│ Review semantic color token mapping         │
├─────────────────────────────────────────────┤
│ Dimension     Accessibility                 │
│ Severity      HIGH                          │
│ Targets       Button / Primary              │
│                                             │
│ Evidence                                     │
│ Contrast      4.48                         │
│ Required      ≥ 4.5                        │
│ Rule          WCAG_AA@1.0.0                │
│                                             │
│ Potential Impact                            │
│ 12 Elements                                 │
│ 1 Component                                 │
│ 1 Token                                     │
│                                             │
│ Verification                               │
│ Contrast ≥ 4.5                              │
└─────────────────────────────────────────────┘
```

---

# 30. Remeasure Interaction

按钮：

```text
Remeasure
```

行为：

```text
Current DOM
 ↓
Browser Adapter
 ↓
New Snapshot
 ↓
Metric Engine
 ↓
Rule Engine
 ↓
Finding
 ↓
Diagnostic
 ↓
Verification
```

不得：

```text
Recommendation
 ↓
Auto Fix
```

---

# 31. Reference Application

Reference App 是 UIQ 的验收环境。

组件：

```text
Button
Input
Card
Dialog
```

技术：

```text
React
Vite
Radix UI
CSS Variables
```

---

# 32. Reference Token Example

```text
Primitive
  ↓
blue.600
  ↓
color.action.primary
  ↓
button.primary.background
  ↓
--button-primary-background
  ↓
Button
```

Foreground：

```text
white
```

最终：

```text
Button
background = #2563EB
foreground = #FFFFFF
```

---

# 33. Reference Failure Scenario

```css
.button {
  color: #777;
  background: #fff;
}
```

Expected：

```text
COLOR.CONTRAST
≈ 4.48

WCAG_AA
FAIL
```

生成：

```text
Finding
Diagnostic
Recommendation
Verification Criterion
```

---

# 34. Reference Fix Scenario

修改：

```css
.button {
  color: #fff;
  background: #2563eb;
}
```

Expected：

```text
Contrast ≈ 5.17
WCAG_AA = PASS
```

Regression：

```text
FIXED_FAILURE
```

Verification：

```text
VERIFIED
```

---

# 35. CLI

CLI：

```text
@uiq/cli
```

命令：

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

# 36. Report CLI

例如：

```bash
uiq report ./snapshot.json
```

默认：

```text
quality-report.json
quality-report.md
quality-report.html
```

---

# 37. CI Pipeline

```text
Install
  ↓
Lint
  ↓
Typecheck
  ↓
Unit
  ↓
Golden
  ↓
Schema
  ↓
Contract
  ↓
Browser
  ↓
Conformance
  ↓
Regression
  ↓
Report
  ↓
Release Gate
```

---

# 38. CI Failure Classification

统一：

```text
INPUT_ERROR
CONFIGURATION_ERROR
MEASUREMENT_ERROR
METRIC_ERROR
RULE_ERROR
BROWSER_ERROR
CONFORMANCE_ERROR
REGRESSION_ERROR
BUILD_ERROR
ENVIRONMENT_ERROR
```

---

# 39. Release Gate

Release Gate 输入：

```text
EvaluationResult
RegressionReport
ConformanceReport
PolicyProfile
```

输出：

```text
ALLOW
WARN
BLOCK
```

注意：

```text
Evaluation FAIL
    ≠
Release BLOCK
```

最终是否 BLOCK 由 Policy 决定。

---

# 40. uiq.config.json

```json
{
  "version": "1.0.0",
  "metrics": [
    {
      "id": "COLOR.CONTRAST",
      "version": "1.0.0"
    }
  ],
  "rules": [
    {
      "id": "ACCESSIBILITY.CONTRAST.WCAG_AA",
      "version": "1.0.0"
    }
  ],
  "policy": {
    "onFail": "WARN",
    "onError": "BLOCK",
    "onUnknown": "WARN"
  }
}
```

禁止：

```json
{
  "rules": ["latest"]
}
```

---

# 41. JSON Schema

以下对象必须提供 Schema：

```text
Measurement
MeasurementSnapshot
MetricDefinition
MetricResult
RuleDefinition
RuleConfiguration
EvaluationResult
Finding
Diagnostic
Recommendation
UIQualityReport
ConformanceReport
RegressionReport
```

---

# 42. Determinism

UIQ V1.0 所有核心计算必须满足：

```text
same input
+
same version
+
same configuration
=
same output
```

禁止核心计算使用：

```text
Date.now()
Math.random()
global mutable state
network
DOM
```

---

# 43. Browser Determinism

Browser Test：

```text
animations disabled
fonts ready
stable viewport
stable theme
stable browser
stable DPR
```

Snapshot 记录：

```text
browser
viewport
devicePixelRatio
zoom
theme
timestamp
```

---

# 44. Test Pyramid

```text
                E2E
                 ▲
            Browser Test
                 ▲
          Integration Test
                 ▲
             Golden Test
                 ▲
              Unit Test
```

重点投入：

```text
Color Mathematics
Metric
Rule
Snapshot
Conformance
Regression
Reporting
```

---

# 45. End-to-End Acceptance

完整 E2E：

```text
Open Reference App
       ↓
Select Button
       ↓
Measure
       ↓
Calculate Contrast
       ↓
Evaluate WCAG
       ↓
Generate Finding
       ↓
Generate Diagnostic
       ↓
Generate Recommendation
       ↓
Display Verification
       ↓
Modify CSS
       ↓
Remeasure
       ↓
Regression
       ↓
Verification
       ↓
Report
```

---

# 46. V1.0 最小验收矩阵

| 场景 | Metric | Rule | Finding | Diagnostic | Recommendation | Verification |
|---|---|---|---|---|---|---|
| PASS | PASS | PASS | - | - | - | - |
| FAIL | AVAILABLE | FAIL | ✓ | ✓ | ✓ | ✓ |
| UNKNOWN | UNKNOWN | UNKNOWN | 可配置 | ✓ | Review Measurement | ✓ |
| FIX | PASS | PASS | - | - | - | VERIFIED |
| Token Deviation | AVAILABLE | PASS | Token Finding | ✓ | ✓ | ✓ |
| Theme Failure | AVAILABLE | FAIL | ✓ | ✓ | ✓ | ✓ |
| Regression | Changed | Changed | Regression | - | - | ✓ |

---

# 47. M15 Acceptance Criteria

### AC-M15-01

完整 pnpm workspace 可以安装。

### AC-M15-02

所有 Package 可以 TypeScript 编译。

### AC-M15-03

Core Architecture Test 通过。

### AC-M15-04

Color Golden Test 通过。

### AC-M15-05

Metric Golden Test 通过。

### AC-M15-06

Rule Golden Test 通过。

### AC-M15-07

Browser Measurement Test 通过。

### AC-M15-08

Token Conformance Test 通过。

### AC-M15-09

Theme Test 通过。

### AC-M15-10

Diagnostic Test 通过。

### AC-M15-11

Regression Test 通过。

### AC-M15-12

Reporting Test 通过。

### AC-M15-13

Inspector 可以显示完整分析链。

### AC-M15-14

Reference App 可以运行。

### AC-M15-15

CLI 可以生成 JSON/Markdown/HTML。

### AC-M15-16

Chromium/Firefox/WebKit 测试通过。

### AC-M15-17

完整 E2E 通过。

### AC-M15-18

CI Pipeline 全部通过。

### AC-M15-19

Release Gate 可以运行。

### AC-M15-20

同一 Snapshot 可以生成可重复报告。

---

# 48. Definition of Done

M15 完成的判定不是：

> “代码写完了”。

而是：

```text
Specification
      ↓
Implementation
      ↓
Golden
      ↓
Conformance
      ↓
Browser
      ↓
Inspector
      ↓
Reporting
      ↓
Regression
      ↓
CI
      ↓
Release Gate
```

全部形成闭环。

---

# 49. UIQ V1.0 最终产品模型

UIQ 最终不是：

```text
Color Picker
```

不是：

```text
Design Editor
```

不是：

```text
AI Aesthetic Evaluator
```

也不是：

```text
Design Generator
```

而是：

```text
UI Design Quality Engineering System
```

其核心价值是：

```text
MEASURE
   ↓
QUANTIFY
   ↓
EVALUATE
   ↓
EXPLAIN
   ↓
RECOMMEND
   ↓
VERIFY
   ↓
REGRESS
```

---

# 50. V1.0 Architecture Freeze

M15 后架构冻结：

```text
┌─────────────────────────────────────────┐
│ Application                             │
│ Inspector / CLI / Reporting / Reference │
├─────────────────────────────────────────┤
│ Integration                             │
│ Browser / Radix / Design System         │
├─────────────────────────────────────────┤
│ Runtime                                 │
│ Measurement / Metric / Rule / Diagnostic│
│ Conformance / Regression                │
├─────────────────────────────────────────┤
│ Domain Core                             │
│ Entity / Contract / Registry / Evidence │
└─────────────────────────────────────────┘
```

不再增加：

```text
Quality Engine
Aesthetic Engine
AI Engine
Design Intelligence Engine
Universal Design Engine
```

---

# 51. V1.0 完整闭环

最终：

```text
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
                            ▼
                         FINDING
                            │
                            ▼
                       DIAGNOSTIC
                            │
                            ▼
                    RECOMMENDATION
                            │
                            ▼
                     IMPLEMENTATION
                            │
                            ▼
                        REMEASURE
                            │
                            ▼
                      VERIFICATION
                            │
                            ▼
                       REGRESSION
                            │
                            ▼
                       RELEASE GATE
                            │
                            ▼
                          REPORT
```

这就是 UIQ V1.0 的完整工程闭环。

---

# 52. 下一阶段原则

M15 之后不再进行架构扩张。

后续工作只允许进入：

```text
Implementation
Testing
Conformance
Performance
Browser Compatibility
Documentation
Release
```

也就是说：

> **UIQ 到这里应当从“规范设计阶段”正式切换到“工程实现阶段”。**

任何新需求都必须首先判断它属于：

```text
Metric
Rule
Adapter
Registry
Diagnostic
Conformance
Regression
Reporting
```

如果无法归入这些扩展点，则原则上不得直接修改 V1.0 Core。

---

# 53. V1.0 Success Definition

UIQ V1.0 成功的标志只有一个：

> **开发者能够把一个真实的 React/Radix UI 页面交给 UIQ，得到可重复的测量结果、明确的规则评价、可追踪的问题、基于证据的改进建议，以及修改后的验证和回归报告。**

即：

```text
Real UI
  ↓
Facts
  ↓
Evidence
  ↓
Decision Criteria
  ↓
Problems
  ↓
Explanation
  ↓
Improvement Guidance
  ↓
Verification
```

而不是一个无法解释的：

```text
92/100
```

这构成 UIQ V1.0 的最终工程边界。