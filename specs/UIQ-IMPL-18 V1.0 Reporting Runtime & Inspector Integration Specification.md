# UIQ-IMPL-18
# Reporting Runtime & Inspector Integration Specification
## V1.0

**状态：Implementation Baseline / Architecture Frozen**  
**阶段：M14**  
**依赖：UIQ-IMPL-01 ～ UIQ-IMPL-17**  
**目标：将 UIQ Reporting Runtime 接入 Inspector，实现从实际 UI 元素到质量评估、问题诊断、改进建议与验证条件的完整闭环。**

---

# 1. 目标

M14 的目标不是增加新的 UIQ 核心能力，而是将已有能力组合为可使用的应用体验：

```text
实际 UI
  ↓
Element Selection
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
Recommendation
  ↓
Verification
  ↓
Remeasure
  ↓
Regression
```

最终用户可以针对一个实际 UI 元素：

> 发现问题 → 理解问题 → 查看证据 → 查看影响范围 → 获得改进建议 → 实施修改 → 重新测量 → 验证结果

---

# 2. 架构定位

Reporting 仍然属于 Application 层。

```text
                    ┌─────────────────────┐
                    │      Inspector      │
                    │    React + Radix    │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │     @uiq/reporting  │
                    └──────────┬──────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        ▼                      ▼                      ▼
     Findings             Diagnostics            Regression
        │                      │                      │
        └──────────────────────┼──────────────────────┘
                               ▼
                      Existing UIQ Runtime
                               │
             ┌─────────────────┼─────────────────┐
             ▼                 ▼                 ▼
        Measurement          Metric             Rule
```

Reporting：

- 不计算 Color
- 不计算 Metric
- 不执行 Rule
- 不重新测量 DOM
- 不修改 Token
- 不修改 Theme
- 不修改 CSS
- 不修改组件
- 不生成新的 Core Layer

---

# 3. Inspector 最终用户闭环

Inspector 中形成以下主流程：

```text
Select
  ↓
Inspect
  ↓
Quality Overview
  ↓
Dimension
  ↓
Finding
  ↓
Diagnostic
  ↓
Recommendation
  ↓
Verification
  ↓
Remeasure
  ↓
Regression
```

例如：

```text
Button
│
├── Measurement
│   ├── foreground = #777777
│   └── background = #FFFFFF
│
├── Metric
│   └── Contrast = 4.48
│
├── Rule
│   └── WCAG AA ≥ 4.5
│
├── Evaluation
│   └── FAIL
│
├── Finding
│   └── Insufficient text contrast
│
├── Diagnostic
│   └── foreground color differs from expected semantic mapping
│
├── Recommendation
│   └── Review semantic/component color token mapping
│
└── Verification
    └── Contrast ≥ 4.5
```

---

# 4. Inspector 页面结构

Inspector 采用三栏结构：

```text
┌──────────────────────────────────────────────────────────┐
│ UIQ Inspector                                            │
├───────────────┬───────────────────────┬──────────────────┤
│ Element Tree  │ Rendered UI           │ Analysis         │
│               │                       │                  │
│ Button        │       Button          │ Quality          │
│ Input         │                       │ Metrics          │
│ Card          │                       │ Rules            │
│ Dialog        │                       │ Findings         │
│               │                       │ Diagnostic       │
│               │                       │ Recommendations  │
│               │                       │ Verification     │
└───────────────┴───────────────────────┴──────────────────┘
```

---

# 5. Analysis Panel

Analysis Panel 增加以下页面：

```text
Overview
Measurement
Metrics
Rules
Findings
Diagnostics
Recommendations
Verification
Tokens
Theme
Trace
Regression
```

其中：

## Overview

展示：

- measured elements
- metric results
- evaluations
- PASS
- FAIL
- WARN
- UNKNOWN
- NOT_APPLICABLE
- ERROR
- findings
- recommendations

禁止：

```text
Overall Beauty Score
Overall Design Score
AI Score
Aesthetic Score
```

---

# 6. Quality Overview

Overview 使用事实型摘要：

```text
UI QUALITY ASSESSMENT

Elements measured       42
Metrics evaluated       138
Rules evaluated         96

PASS                    81
FAIL                    7
WARN                    3
UNKNOWN                 5
NOT APPLICABLE          0
ERROR                   0

Findings                7
Recommendations         5
```

这些数字直接来自：

```text
QualitySummary
```

不得重新计算。

---

# 7. Quality Dimensions

Inspector 展示：

```text
Accessibility
Color
Typography
Geometry
Spacing
Layout
Hierarchy
Design System
Conformance
```

例如：

```text
Accessibility

PASS      32
FAIL       3
WARN       1
UNKNOWN    2
```

Dimension 仅用于分类和聚合。

不能根据这些数字生成：

```text
Accessibility = 82%
```

除非未来显式定义对应 Quality Model。

---

# 8. Finding 页面

Finding 页面必须保留完整追踪关系：

```text
Finding
│
├── State
├── Severity
├── Subject
├── Rule
├── Metric
├── Evidence
└── Diagnostic
```

例如：

```text
Finding: F-001

Type:
ACCESSIBILITY

State:
DETECTED

Severity:
HIGH

Subject:
button.submit

Rule:
ACCESSIBILITY.CONTRAST.WCAG_AA@1.0.0

Metric:
COLOR.CONTRAST@1.0.0

Observed:
4.48

Required:
≥ 4.5
```

---

# 9. Finding Group

多个元素产生相同问题时，Inspector 不应显示大量重复信息。

例如：

```text
Contrast failures

12 elements
1 component
2 semantic tokens
```

展开：

```text
Affected Elements

button.primary
button.secondary
button.submit
...
```

同时保留原始 Finding。

因此：

```text
Finding Group ≠ Finding
```

Group 是展示聚合。

---

# 10. Diagnostic 页面

Diagnostic 回答：

> 为什么出现这个问题？

例如：

```text
Finding
  ↓
Metric
  ↓
Measurement
  ↓
Token Binding
  ↓
Component Token
  ↓
Semantic Token
  ↓
Primitive Token
```

显示：

```text
Cause:
TOKEN

Confidence:
DIRECT

Explanation:
The rendered foreground value does not match the
resolved component token value.
```

---

# 11. Recommendation 页面

Recommendation 回答：

> 下一步应该检查什么？

例如：

```text
Recommendation

Review semantic color token mapping

Target:
Button / Primary

Evidence:
- Contrast = 4.48
- WCAG AA = FAIL
- Token Match = FAIL

Potential impact:
- 12 elements
- 1 component
- 1 semantic token
- Light theme

Verification:
COLOR.CONTRAST ≥ 4.5
```

---

# 12. Recommendation UX 原则

Recommendation 必须展示：

```text
Why
What
Where
Evidence
Impact
Verification
```

即：

```text
为什么建议
建议检查什么
影响哪里
依据是什么
可能影响什么
如何验证
```

禁止仅显示：

```text
Fix this
Improve contrast
Use a better color
```

这种无法追溯的建议。

---

# 13. Recommendation 与自动修改严格分离

Inspector 不提供：

```text
Auto Fix
Auto Replace Color
Auto Modify Token
Auto Modify CSS
Auto Commit
```

M14 的操作仅包括：

```text
Inspect
Trace
Review
Export
Remeasure
Compare
Verify
```

如果未来提供 Auto Fix，应作为独立应用能力，并经过明确的 Change Plan / Preview / Approval / Verification 流程。

---

# 14. Verification 页面

Verification 根据 Recommendation 中的：

```text
VerificationCriterion[]
```

生成验证任务。

例如：

```text
Verification Criteria

✓ Contrast
  COLOR.CONTRAST@1.0.0
  WCAG_AA@1.0.0
  expected >= 4.5

✓ Token Match
  TOKEN.TOKEN_MATCH@1.0.0
  expected = MATCH
```

状态：

```text
NOT_VERIFIED
PASS
FAIL
UNKNOWN
ERROR
```

---

# 15. Remeasure

用户修改 UI 后：

```text
Remeasure
```

重新产生：

```text
MeasurementSnapshot
```

然后执行：

```text
Metrics
  ↓
Rules
  ↓
Evaluation
```

Reporting 不直接执行这些过程，而是调用已有 Runtime。

---

# 16. Verification 闭环

完整过程：

```text
Finding
   ↓
Recommendation
   ↓
Implementation
   ↓
Remeasure
   ↓
Metric
   ↓
Rule
   ↓
Evaluation
   ↓
Verification
```

特别规定：

```text
IMPLEMENTED ≠ VERIFIED
```

只有重新测量并满足 Verification Criterion 后：

```text
VERIFIED
```

---

# 17. Regression 页面

修改前后：

```text
Baseline
    ↓
Current
    ↓
Regression Engine
    ↓
RegressionReport
```

Inspector 展示：

```text
NEW_FAILURE
FIXED_FAILURE
PERSISTING_FAILURE
CHANGED_RESULT
NEW_UNKNOWN
RESOLVED_UNKNOWN
```

例如：

```text
Before:
Contrast = 4.48
FAIL

After:
Contrast = 5.17
PASS

Regression:
FIXED_FAILURE
```

---

# 18. Recommendation → Regression

Recommendation 页面可以显示：

```text
Potential Impact
```

例如：

```text
Potential Impact

12 elements
1 component
2 themes
1 semantic token
```

但修改后必须使用实际 Regression 结果验证。

因此：

```text
Impact Trace
     ≠
Regression
```

前者是：

> 如果修改该对象，可能影响什么？

后者是：

> 实际修改以后发生了什么？

---

# 19. Token Trace

Inspector 提供：

```text
Element
  ↓
Component Token
  ↓
Semantic Token
  ↓
Primitive Token
  ↓
Resolved CSS Value
  ↓
Computed Value
  ↓
Rendered Value
```

例如：

```text
button.primary
      │
      ▼
button.primary.foreground
      │
      ▼
color.action.primary
      │
      ▼
blue.600
      │
      ▼
--color-action-primary
      │
      ▼
#2563EB
      │
      ▼
rgb(37, 99, 235)
```

必须区分：

```text
Token Value
CSS Value
Computed Value
Rendered Value
```

---

# 20. Theme Analysis

Light / Dark 分别生成独立结果：

```text
Theme: Light

PASS  ...
FAIL  ...

Theme: Dark

PASS  ...
FAIL  ...
```

禁止：

```text
Dark is better
Light is better
Dark = 92
Light = 84
```

Theme Comparison 仅展示事实差异。

---

# 21. Radix UI 集成

Reference Application：

```text
React
  ↓
Radix UI
  ↓
Design System Wrapper
  ↓
CSS Variables
  ↓
Rendered DOM
  ↓
@uiq/browser
  ↓
UIQ Runtime
```

Radix 只是 Adapter/Application Integration。

UIQ Core 不依赖 Radix。

---

# 22. Reference Component

M14 使用：

```text
Button
Input
Card
Dialog
```

Button 示例：

```text
Button
├── Default
├── Hover
├── Active
├── Focus
└── Disabled
```

Inspector 可以切换状态并生成独立 Snapshot。

---

# 23. State Analysis

组件状态：

```text
DEFAULT
HOVER
ACTIVE
FOCUS
DISABLED
INVALID
```

状态之间不能默认认为：

```text
Hover > Default
Active > Hover
```

UIQ 只记录实际 Measurement 和 Rule Evaluation。

---

# 24. Reporting API

Inspector 对 Reporting Runtime 暴露：

```ts
export interface InspectorReportingService {
  generateReport(
    input: QualityReportInput
  ): Promise<UIQualityReport>;

  generateRecommendations(
    input: RecommendationContext
  ): Promise<readonly ImprovementRecommendation[]>;

  verify(
    report: UIQualityReport,
    current: QualityReportInput
  ): Promise<VerificationResult>;
}
```

Reporting Service 不承担底层 Metric / Rule 计算。

---

# 25. Inspector Runtime API

```ts
export interface InspectorRuntime {
  inspect(target: Element): Promise<InspectionResult>;

  measure(target: Element): Promise<MeasurementSnapshot>;

  evaluate(target: Element): Promise<EvaluationReport>;

  diagnose(target: Element): Promise<Diagnostic[]>;

  report(target: Element): Promise<UIQualityReport>;

  remeasure(target: Element): Promise<MeasurementSnapshot>;
}
```

其中：

```ts
report()
```

只是 orchestration。

不是新的计算引擎。

---

# 26. Report State

Inspector Report State：

```ts
export interface ReportState {
  readonly reportId?: string;
  readonly projectId: string;
  readonly snapshotId?: string;
  readonly themeId?: string;
  readonly selectedSubjectId?: string;
  readonly activeDimension?: QualityDimension;
  readonly activeFindingId?: string;
  readonly activeRecommendationId?: string;
  readonly activePanel: ReportPanel;
}
```

---

# 27. ReportPanel

```ts
export type ReportPanel =
  | "overview"
  | "measurement"
  | "metrics"
  | "rules"
  | "findings"
  | "diagnostics"
  | "recommendations"
  | "verification"
  | "tokens"
  | "theme"
  | "trace"
  | "regression";
```

---

# 28. Export

Inspector 支持：

```text
JSON
Markdown
HTML
```

其中：

```text
JSON = Source of Truth
Markdown = Human Review
HTML = Interactive Report
```

JSON 必须包含：

```text
Report Version
Project
Scope
Summary
Dimensions
Findings
Diagnostics
Recommendations
Verification
Conformance
Regression
Reproducibility
```

---

# 29. HTML Report

HTML Report 可以提供：

```text
Executive Summary
    ↓
Dimensions
    ↓
Findings
    ↓
Diagnostics
    ↓
Recommendations
    ↓
Verification
    ↓
Regression
```

但 HTML 只是 Renderer。

不能在 HTML 中重新计算 UIQ 结果。

---

# 30. Report Renderer 原则

统一：

```ts
interface ReportRenderer<T> {
  render(report: UIQualityReport): T;
}
```

实现：

```text
JsonRenderer
MarkdownRenderer
HtmlRenderer
```

Renderer：

- 不修改 Report
- 不重新计算 Metric
- 不重新执行 Rule
- 不改变 Evaluation
- 不生成新的 Finding

---

# 31. M14 Package Structure

```text
packages/
├── reporting/
│   └── src/
│
apps/
├── inspector/
│   └── src/
│       ├── runtime/
│       │   ├── InspectorRuntime.ts
│       │   └── InspectorReportingService.ts
│       │
│       ├── state/
│       │   └── ReportState.ts
│       │
│       ├── panels/
│       │   ├── OverviewPanel.tsx
│       │   ├── MeasurementPanel.tsx
│       │   ├── MetricsPanel.tsx
│       │   ├── RulesPanel.tsx
│       │   ├── FindingsPanel.tsx
│       │   ├── DiagnosticsPanel.tsx
│       │   ├── RecommendationsPanel.tsx
│       │   ├── VerificationPanel.tsx
│       │   ├── TokenPanel.tsx
│       │   ├── ThemePanel.tsx
│       │   ├── TracePanel.tsx
│       │   └── RegressionPanel.tsx
│       │
│       ├── components/
│       │   ├── FindingCard.tsx
│       │   ├── DiagnosticCard.tsx
│       │   ├── RecommendationCard.tsx
│       │   ├── VerificationCard.tsx
│       │   └── EvidenceTrace.tsx
│       │
│       └── export/
│           └── ReportExport.ts
│
integrations/
└── radix/
```

---

# 32. Radix UI 使用边界

允许：

```text
Inspector
Reference Application
Radix Adapter
```

例如：

```text
Tabs
Card
Dialog
Popover
Tooltip
ScrollArea
Badge
Accordion
```

不允许：

```text
@uiq/core → @radix-ui/*
@uiq/color → React
@uiq/metrics → Radix
@uiq/rules → React
@uiq/reporting → Radix
```

---

# 33. M14 第一条完整 Vertical Slice

必须首先实现：

```text
Radix Button
      ↓
DOM Selection
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
Recommendation
      ↓
Verification
```

测试场景：

```css
button {
  color: #777;
  background: #fff;
}
```

得到：

```text
Contrast ≈ 4.48
Rule = FAIL
Finding = Created
Diagnostic = Generated
Recommendation = Generated
Verification Criterion = Contrast ≥ 4.5
```

---

# 34. 修复后的第二条 Vertical Slice

修改：

```css
button {
  color: #ffffff;
  background: #2563eb;
}
```

得到：

```text
Contrast ≈ 5.17
Rule = PASS
```

然后：

```text
Baseline
   ↓
Current
   ↓
Regression
   ↓
FIXED_FAILURE
```

最后：

```text
Recommendation
    ↓
REMEASURED
    ↓
VERIFIED
```

---

# 35. UNKNOWN 场景

例如：

```css
button {
  color: white;
  background:
    linear-gradient(...);
}
```

如果 V1.0 Browser Adapter 无法可靠解析最终背景：

```text
Measurement = UNKNOWN
Metric = UNKNOWN
Evaluation = UNKNOWN
```

不得：

```text
UNKNOWN → PASS
UNKNOWN → FAIL
```

Recommendation：

```text
REVIEW_MEASUREMENT
```

而不是猜测颜色。

---

# 36. Token Deviation 场景

例如：

```text
Token Match = FAIL
Contrast Rule = PASS
```

Inspector 必须同时显示：

```text
Design System Conformance
  Token Match: FAIL

Accessibility
  Contrast: PASS
```

不能将 Token Deviation 解释成：

```text
UI is inaccessible
```

---

# 37. Recommendation Deduplication

如果：

```text
100 Buttons
↓
同一个 Token
↓
产生 100 Findings
```

Recommendation 不应该生成 100 条。

应该：

```text
100 Findings
     ↓
1 Finding Group
     ↓
1 Recommendation
```

同时保留：

```text
affectedFindingIds[]
affectedSubjects[]
affectedTokens[]
```

---

# 38. 推荐排序

M14 可以提供展示顺序，但不能产生 opaque score。

排序依据：

```text
Severity
Finding Count
Affected Elements
Affected Components
Affected Themes
Release Gate Impact
```

展示：

```text
High
Medium
Low
```

如果需要数值排序，必须来自明确的 Policy Configuration，而不是 AI 推断。

---

# 39. Report Reproducibility

报告必须保存：

```text
UIQ Engine Version
Report Version
Metric Versions
Rule Versions
Rule Configuration
Measurement Snapshot
Browser
Viewport
Device Pixel Ratio
Theme
Token Version
Component Version
```

因此：

```text
Same Snapshot
+
Same Metric Version
+
Same Rule Version
+
Same Configuration
+
Same Engine
=
Reproducible Report
```

---

# 40. 测试策略

## T1

Report Model Unit Test

## T2

Aggregation Test

## T3

Recommendation Rule Test

## T4

Verification Test

## T5

JSON Schema Test

## T6

Renderer Test

## T7

Inspector Component Test

## T8

Browser Test

## T9

End-to-End Test

## T10

Regression Test

---

# 41. M14 Golden Cases

至少：

```text
RPT-M14-001
PASS Button

RPT-M14-002
Contrast Failure

RPT-M14-003
Failure → Recommendation

RPT-M14-004
Recommendation → Verification

RPT-M14-005
Failure → Fixed Failure

RPT-M14-006
Unsupported Gradient → UNKNOWN

RPT-M14-007
Token Deviation + Accessibility PASS

RPT-M14-008
Repeated Findings → Deduplicated Recommendation

RPT-M14-009
Light/Dark Independent Reports

RPT-M14-010
HTML/Markdown/JSON Consistency
```

---

# 42. Architecture Tests

必须保证：

```text
core
  ✗ React
  ✗ Radix
  ✗ Browser
  ✗ Reporting

metrics
  ✗ rules

rules
  ✗ browser

reporting
  ✗ DOM measurement
  ✗ color calculation
  ✗ metric calculation
  ✗ rule calculation

regression
  ✗ rule execution

diagnostic
  ✗ evaluation modification
```

---

# 43. Acceptance Criteria

### AC-M14-01

Inspector 可以选择 DOM Element。

### AC-M14-02

Inspector 可以产生 MeasurementSnapshot。

### AC-M14-03

Inspector 可以显示 Metric。

### AC-M14-04

Inspector 可以显示 Evaluation。

### AC-M14-05

FAIL 可以产生 Finding。

### AC-M14-06

Finding 可以显示 Diagnostic。

### AC-M14-07

Diagnostic 可以显示 Evidence Trace。

### AC-M14-08

Finding 可以产生 Recommendation。

### AC-M14-09

Recommendation 必须包含 Evidence。

### AC-M14-10

Recommendation 必须包含 Verification Criterion。

### AC-M14-11

用户修改 UI 后可以 Remeasure。

### AC-M14-12

Remeasure 可以产生新的 Evaluation。

### AC-M14-13

Regression 可以识别 FIXED_FAILURE。

### AC-M14-14

Verification 可以从 NOT_VERIFIED 转为 VERIFIED。

### AC-M14-15

Token Deviation 与 Accessibility Evaluation 独立。

### AC-M14-16

UNKNOWN 不得自动转为 PASS/FAIL。

### AC-M14-17

Light/Dark Theme 独立评估。

### AC-M14-18

JSON/Markdown/HTML 报告结果一致。

### AC-M14-19

Report 具有完整 Reproducibility Metadata。

### AC-M14-20

Inspector 不自动修改 UI。

---

# 44. M14 Definition of Done

M14 完成必须满足：

```text
Radix Button
     ↓
Inspector
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
Recommendation
     ↓
Verification
     ↓
Remeasure
     ↓
Regression
```

并且：

```text
JSON
Markdown
HTML
```

三种报告均可生成。

---

# 45. V1.0 产品闭环

至此 UIQ V1.0 不再只是一个：

> UI 指标计算库

而形成：

```text
                ┌─────────────────────┐
                │      Real UI        │
                └──────────┬──────────┘
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
                  Recommendation
                           ↓
                    Implementation
                           ↓
                       Remeasure
                           ↓
                      Verification
                           ↓
                      Regression
                           ↓
                     Release Gate
```

---

# 46. 最终产品边界

UIQ V1.0 是：

> **一个面向真实渲染 UI 的、可测量、可验证、可解释、可追踪、可回归的 UI 设计质量评估与改进建议系统。**

它回答：

```text
UI 现在是什么状态？
        ↓
有哪些可量化问题？
        ↓
问题依据是什么？
        ↓
问题可能来自哪里？
        ↓
应该检查什么？
        ↓
修改后如何验证？
        ↓
修改是否产生新的问题？
```

它不回答：

```text
这个设计是否“好看”？
哪个设计更高级？
什么颜色最漂亮？
AI 认为哪个方案最好？
```

这些仍然属于 UIQ V1.0 的明确边界之外。

---

# 47. 架构冻结声明

M14 完成后，UIQ V1.0 不再增加新的核心架构层。

最终扩展机制仅允许：

```text
Metric
Rule
Registry
Adapter
Diagnostic
Conformance
Regression
Reporting
Recommendation
```

不再增加：

```text
Quality Engine
Aesthetic Engine
AI Design Engine
Universal Design Engine
Recommendation Core
Report Core
```

---

# 48. UIQ V1.0 完整架构

```text
┌───────────────────────────────────────────────────────────┐
│                    Application                            │
│                                                           │
│ Inspector │ CLI │ Reference App │ Reporting │ Export      │
└──────────────────────────┬────────────────────────────────┘
                           │
┌──────────────────────────▼────────────────────────────────┐
│                     Integration                           │
│                                                           │
│ Browser Adapter │ Radix Adapter │ Design System Adapter   │
└──────────────────────────┬────────────────────────────────┘
                           │
┌──────────────────────────▼────────────────────────────────┐
│                    UIQ Runtime                            │
│                                                           │
│ Measurement → Metric → Rule → Evaluation                  │
│                    ↓                                      │
│              Finding → Diagnostic                         │
│                    ↓                                      │
│          Conformance / Regression                         │
└──────────────────────────┬────────────────────────────────┘
                           │
┌──────────────────────────▼────────────────────────────────┐
│                       Core                                │
│                                                           │
│ Entity │ Measurement │ Metric Contract │ Rule Contract    │
│ Evaluation │ Finding │ Diagnostic │ Registry │ Fingerprint│
└───────────────────────────────────────────────────────────┘
```

**M14 的意义不是继续“发明架构”，而是把此前已经定义的架构真正闭环。**

最终用户面对的是一个非常清晰的产品流程：

> **选中 UI → 看质量事实 → 看问题 → 看原因 → 看建议 → 修改 → 重新测量 → 验证 → 看回归结果。**

这也使 UIQ 从“设计量化规范”真正落地为“UI 设计质量工程系统”。