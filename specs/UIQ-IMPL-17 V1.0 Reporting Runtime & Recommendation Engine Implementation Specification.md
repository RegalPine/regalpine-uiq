# UIQ-IMPL-17
## Reporting Runtime & Recommendation Engine Implementation Specification V1.0

**Status:** Implementation Baseline  
**Phase:** M13  
**Package:** `@uiq/reporting`  
**Version:** 1.0.0  
**Depends On:** Core / Metrics / Rules / Diagnostic / Conformance / Regression  
**Architecture:** Frozen  
**New Core Layer:** No

---

# 1. Purpose

实现：

```text
UIQ Runtime Result
        ↓
@uiq/reporting
        ↓
Quality Assessment
        ↓
Finding Aggregation
        ↓
Diagnostic Linking
        ↓
Recommendation
        ↓
Verification Criteria
        ↓
JSON / Markdown / HTML
```

本阶段重点解决：

1. UI 设计质量报告
2. Finding 聚合
3. Quality Dimension 统计
4. Diagnostic 关联
5. Recommendation 生成
6. Impact Analysis
7. Verification Criteria
8. JSON 序列化
9. Markdown 输出
10. HTML 输出

---

# 2. Package Position

```text
@uiq/core
     ↑
     │
UIQ Runtime
     │
     ├── metrics
     ├── rules
     ├── diagnostic
     ├── conformance
     └── regression
             │
             ↓
       @uiq/reporting
             │
       ┌─────┼─────┐
       ↓     ↓     ↓
     JSON Markdown HTML
```

Reporting 不允许反向依赖：

```text
browser
react
vue
radix
```

---

# 3. Package Structure

```text
packages/reporting/
├── package.json
├── tsconfig.json
│
└── src/
    ├── model/
    │   ├── ReportScope.ts
    │   ├── QualityDimension.ts
    │   ├── QualitySummary.ts
    │   ├── QualityDimensionReport.ts
    │   ├── FindingSummary.ts
    │   ├── DiagnosticSummary.ts
    │   ├── Recommendation.ts
    │   ├── VerificationCriterion.ts
    │   ├── ImpactAssessment.ts
    │   ├── ReproducibilityMetadata.ts
    │   └── UIQualityReport.ts
    │
    ├── aggregation/
    │   ├── aggregateSummary.ts
    │   ├── aggregateDimensions.ts
    │   └── groupFindings.ts
    │
    ├── diagnostic/
    │   ├── linkDiagnostics.ts
    │   └── rootCause.ts
    │
    ├── recommendation/
    │   ├── RecommendationRule.ts
    │   ├── RecommendationContext.ts
    │   ├── RecommendationEngine.ts
    │   ├── RecommendationRuleRegistry.ts
    │   └── rules/
    │
    ├── impact/
    │   └── calculateImpact.ts
    │
    ├── verification/
    │   └── createVerificationCriteria.ts
    │
    ├── generator/
    │   └── generateQualityReport.ts
    │
    ├── renderer/
    │   ├── JsonRenderer.ts
    │   ├── MarkdownRenderer.ts
    │   └── HtmlRenderer.ts
    │
    └── index.ts
```

---

# 4. Report Model

```ts
export interface UIQualityReport {
  readonly id: string;
  readonly version: string;

  readonly projectId: string;
  readonly generatedAt: string;

  readonly scope: ReportScope;

  readonly summary: QualitySummary;

  readonly dimensions:
    readonly QualityDimensionReport[];

  readonly findings:
    readonly FindingSummary[];

  readonly diagnostics:
    readonly DiagnosticSummary[];

  readonly recommendations:
    readonly ImprovementRecommendation[];

  readonly conformance?: ConformanceSummary;

  readonly regression?: RegressionSummary;

  readonly reproducibility:
    ReproducibilityMetadata;
}
```

---

# 5. Quality Summary

```ts
export interface QualitySummary {
  readonly measuredElements: number;

  readonly metricResults: number;

  readonly evaluations: number;

  readonly pass: number;
  readonly fail: number;
  readonly warn: number;
  readonly unknown: number;
  readonly notApplicable: number;
  readonly error: number;

  readonly findings: number;
}
```

---

# 6. Dimension Aggregation

```ts
export interface QualityDimensionReport {
  readonly dimension: QualityDimension;

  readonly evaluations: number;

  readonly pass: number;
  readonly fail: number;
  readonly warn: number;
  readonly unknown: number;
  readonly notApplicable: number;
  readonly error: number;

  readonly findings: number;
}
```

聚合必须是确定性的。

输入顺序改变：

```text
A,B,C
```

或：

```text
C,A,B
```

输出统计必须完全一致。

---

# 7. Finding Summary

```ts
export interface FindingSummary {
  readonly id: string;

  readonly findingType: FindingType;

  readonly severity: Severity;

  readonly subjectId: string;

  readonly ruleId: string;
  readonly ruleVersion: string;

  readonly state: FindingState;

  readonly fingerprint: string;

  readonly diagnosticIds: readonly string[];
}
```

原始 Finding 永远保留。

Report 只生成 Summary。

---

# 8. Finding Group

```ts
export interface FindingGroup {
  readonly id: string;

  readonly findingType: FindingType;

  readonly ruleId: string;
  readonly ruleVersion: string;

  readonly severity: Severity;

  readonly affectedSubjects:
    readonly string[];

  readonly count: number;

  readonly representativeFindingId: string;
}
```

Grouping Key：

```text
findingType
+
ruleId
+
ruleVersion
+
severity
+
diagnostic cause
+
token/component/theme context
```

不能仅仅按照文本 Message 分组。

---

# 9. Recommendation Model

```ts
export interface ImprovementRecommendation {
  readonly id: string;

  readonly type: RecommendationType;

  readonly title: string;

  readonly dimension: QualityDimension;

  readonly targetType: RecommendationTargetType;

  readonly targetIds: readonly string[];

  readonly rationale: string;

  readonly evidence:
    readonly EvidenceReference[];

  readonly impact: ImpactAssessment;

  readonly verification:
    readonly VerificationCriterion[];
}
```

---

# 10. Recommendation Types

```ts
export enum RecommendationType {
  REVIEW_MEASUREMENT =
    "REVIEW_MEASUREMENT",

  REVIEW_METRIC =
    "REVIEW_METRIC",

  REVIEW_RULE_CONFIGURATION =
    "REVIEW_RULE_CONFIGURATION",

  REVIEW_TOKEN =
    "REVIEW_TOKEN",

  REVIEW_COMPONENT =
    "REVIEW_COMPONENT",

  REVIEW_THEME =
    "REVIEW_THEME",

  REVIEW_LAYOUT =
    "REVIEW_LAYOUT",

  REVIEW_TYPOGRAPHY =
    "REVIEW_TYPOGRAPHY",

  REVIEW_COLOR =
    "REVIEW_COLOR",

  REVIEW_ACCESSIBILITY =
    "REVIEW_ACCESSIBILITY"
}
```

---

# 11. Recommendation Target

```ts
export type RecommendationTargetType =
  | "ELEMENT"
  | "COMPONENT"
  | "TOKEN"
  | "THEME"
  | "LAYOUT"
  | "TYPOGRAPHY"
  | "COLOR";
```

---

# 12. Recommendation Engine

核心接口：

```ts
export interface RecommendationEngine {
  recommend(
    context: RecommendationContext
  ): readonly ImprovementRecommendation[];
}
```

---

# 13. Recommendation Context

```ts
export interface RecommendationContext {
  readonly findings: readonly Finding[];
  readonly diagnostics: readonly Diagnostic[];

  readonly evaluations:
    readonly EvaluationResult[];

  readonly metrics:
    readonly MetricResult<unknown>[];

  readonly tokenBindings?:
    readonly TokenBinding[];

  readonly components?:
    readonly ComponentBinding[];

  readonly themes?:
    readonly ThemeContext[];

  readonly impactTrace?:
    readonly ImpactTrace[];
}
```

---

# 14. Recommendation Rule

```ts
export interface RecommendationRule {
  readonly id: string;
  readonly version: string;

  matches(
    context: RecommendationContext
  ): boolean;

  generate(
    context: RecommendationContext
  ): readonly ImprovementRecommendation[];
}
```

Recommendation Rule 本身不计算 Metric。

---

# 15. Rule Registry

```ts
export interface RecommendationRuleRegistry {
  register(
    rule: RecommendationRule
  ): void;

  get(
    id: string,
    version: string
  ): RecommendationRule;

  list(): readonly RecommendationRule[];
}
```

同样采用：

```text
id + version
```

精确版本。

禁止：

```text
latest
```

---

# 16. Initial Recommendation Rules

V1.0 定义：

```text
REC-ACCESSIBILITY-001
REC-COLOR-001
REC-TYPOGRAPHY-001
REC-SPACING-001
REC-TOKEN-001
REC-COMPONENT-001
REC-THEME-001
REC-UNKNOWN-001
```

---

# 17. Accessibility Recommendation

触发：

```text
Rule:
ACCESSIBILITY.CONTRAST.WCAG_AA

Evaluation:
FAIL
```

输出：

```text
Review accessibility color relationship.
```

如果 Token Trace 存在，则升级为：

```text
Review semantic/component color token mapping.
```

---

# 18. Color Recommendation

触发：

```text
COLOR.GAMUT
```

输出：

```text
Review color gamut compatibility for the target rendering space.
```

不得直接：

```text
Change color to #xxxxxx
```

---

# 19. Typography Recommendation

触发：

```text
TYPOGRAPHY.FONT_SIZE
```

输出：

```text
Review typography token or component typography contract.
```

如果存在 Token Trace：

```text
Review typography semantic token mapping.
```

---

# 20. Spacing Recommendation

触发：

```text
SPACING.SCALE_CONFORMANCE
```

输出：

```text
Review component spacing token mapping.
```

---

# 21. Token Recommendation

触发：

```text
TOKEN.TOKEN_MATCH
```

输出：

```text
Review component token binding.
```

触发：

```text
TOKEN.TOKEN_DEVIATION
```

输出：

```text
Review deviation between rendered value
and declared design token.
```

不能直接说：

```text
Design is wrong.
```

---

# 22. Component Recommendation

触发：

```text
TOKEN.COMPONENT_CONFORMANCE
```

输出：

```text
Review component contract conformance.
```

目标：

```text
COMPONENT
```

而不是默认定位到某个具体 DOM Element。

---

# 23. Theme Recommendation

如果：

```text
Light Theme
```

存在问题：

```text
Review Light Theme semantic token mapping.
```

如果：

```text
Dark Theme
```

存在问题：

```text
Review Dark Theme semantic token mapping.
```

Theme 不允许被平均。

---

# 24. UNKNOWN Recommendation

例如：

```text
background:
linear-gradient(...)
```

而 V1.0 无法可靠计算背景。

Evaluation：

```text
UNKNOWN
```

推荐：

```text
Review measurement coverage or provide
a supported background representation.
```

而不是：

```text
FAIL
```

---

# 25. Recommendation Deduplication

多个 Finding 可能产生同一 Recommendation。

例如：

```text
37 Buttons
   ↓
same token
   ↓
same contrast problem
```

最终：

```text
1 Recommendation
```

而不是：

```text
37 identical recommendations
```

Recommendation 必须保留：

```text
affectedFindingIds
```

以便追溯。

---

# 26. Recommendation Identity

推荐 ID：

```text
Recommendation ID
```

不是随机 UUID 优先。

建议：

```text
SHA-256(
  type
  +
  dimension
  +
  targetType
  +
  targetIds
  +
  evidence
)
```

这样可以稳定识别相同建议。

---

# 27. Impact Calculation

```ts
export interface ImpactAssessment {
  readonly affectedElements: number;

  readonly affectedComponents: number;

  readonly affectedTokens: readonly string[];

  readonly affectedThemes: readonly string[];

  readonly potentialRegressionAreas:
    readonly string[];
}
```

---

# 28. Impact Rules

如果目标：

```text
Primitive Token
```

则沿 Token Graph：

```text
Primitive
 ↓
Semantic
 ↓
Component
 ↓
Element
```

计算潜在影响。

如果：

```text
Component Token
```

则：

```text
Component Token
 ↓
Component Instances
 ↓
Elements
```

---

# 29. Theme Impact

修改一个 Semantic Token：

```text
semantic.color.primary
```

如果被：

```text
Light
Dark
High Contrast
```

共同引用，则：

```text
affectedThemes =
[
  "light",
  "dark",
  "high-contrast"
]
```

---

# 30. Impact ≠ Regression

严格区分：

```text
Impact Trace
```

表示：

> 修改某对象可能影响什么。

而：

```text
Regression
```

表示：

> 修改前后实际测量结果发生了什么变化。

---

# 31. Verification Criteria

每个 Recommendation 至少包含一个验证条件。

例如：

```ts
{
  metricId: "COLOR.CONTRAST",
  metricVersion: "1.0.0",

  ruleId:
    "ACCESSIBILITY.CONTRAST.WCAG_AA",

  ruleVersion: "1.0.0",

  expectedState: "PASS"
}
```

---

# 32. Verification Workflow

```text
Recommendation
      ↓
Human Implementation
      ↓
New Snapshot
      ↓
Metric
      ↓
Rule
      ↓
Evaluation
      ↓
Regression
      ↓
Verification
```

Report 不得直接假设：

```text
Recommendation = Fixed
```

---

# 33. Report Generator

```ts
export interface QualityReportGenerator {
  generate(
    input: QualityReportInput
  ): UIQualityReport;
}
```

实现：

```text
validate
 ↓
aggregate
 ↓
group
 ↓
diagnostic link
 ↓
recommend
 ↓
impact
 ↓
verification
 ↓
reproducibility
```

---

# 34. Report Generation Determinism

以下输入：

```text
same snapshot
same metrics
same evaluations
same findings
same diagnostics
same configuration
same engine
```

必须得到：

```text
equivalent report
```

Recommendation 顺序必须稳定：

```text
dimension
→ severity
→ target
→ recommendation id
```

---

# 35. JSON Renderer

```ts
export interface JsonRenderer {
  render(
    report: UIQualityReport
  ): string;
}
```

要求：

- UTF-8
- stable property order
- no runtime object serialization
- no circular reference
- no implementation-specific fields

---

# 36. Markdown Renderer

标准：

```text
# UI Design Quality Assessment Report

## 1. Executive Summary

## 2. Scope

## 3. Quality Dimensions

## 4. Findings

## 5. Diagnostic Analysis

## 6. Design System Conformance

## 7. Theme Analysis

## 8. Improvement Recommendations

## 9. Verification Criteria

## 10. Regression

## 11. Release Gate

## 12. Reproducibility
```

---

# 37. HTML Renderer

HTML 输出允许：

```text
summary cards
tables
finding details
evidence trace
token trace
theme comparison
recommendation sections
```

但 HTML 只是表现层。

事实源仍然：

```text
UIQualityReport
```

---

# 38. Example Report

输入：

```text
Button
Foreground = #777777
Background = #ffffff
Contrast = 4.48

Rule:
WCAG AA >= 4.50

Result:
FAIL
```

报告：

```text
Accessibility
────────────────────────

Contrast
Observed: 4.48
Expected: >= 4.50
State: FAIL
Severity: HIGH
```

Diagnostic：

```text
Foreground/background contrast
does not satisfy the configured criterion.
```

Recommendation：

```text
Review semantic/component color token mapping.
```

Verification：

```text
COLOR.CONTRAST >= 4.50
WCAG_AA = PASS
No new contrast failures
```

---

# 39. Example Token Deviation

```text
Component:
Button

Expected Token:
button.padding.inline = 16px

Rendered:
13px

Token Match:
FAIL
```

报告：

```text
Design System Conformance

Component:
Button

Token:
button.padding.inline

Expected:
16px

Observed:
13px

Conformance:
FAIL
```

Recommendation：

```text
Review component token binding.
```

注意：

如果：

```text
SPACING.SCALE_CONFORMANCE
```

没有失败，则不能写：

```text
UI spacing quality failed.
```

---

# 40. Example Theme Report

```text
Theme: Light

PASS: 821
FAIL: 12
WARN: 8


Theme: Dark

PASS: 804
FAIL: 19
WARN: 11
```

同时可以：

```text
Theme Comparison
```

展示：

```text
Light → Dark
```

的事实变化。

禁止输出：

```text
Dark Theme is better.
```

---

# 41. Quality Report JSON Schema

建议：

```text
specs/schema/
└── ui-quality-report.schema.json
```

核心：

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://uiq.dev/schema/ui-quality-report-1.0.json",
  "title": "UIQ Quality Report",
  "type": "object",
  "required": [
    "id",
    "version",
    "projectId",
    "summary",
    "dimensions",
    "findings",
    "recommendations",
    "reproducibility"
  ]
}
```

---

# 42. Report Golden Tests

目录：

```text
tests/
└── golden/
    └── reporting/
        ├── quality-summary/
        ├── dimension/
        ├── finding-group/
        ├── diagnostic/
        ├── recommendation/
        ├── impact/
        ├── verification/
        └── full-report/
```

---

# 43. Golden Scenario RPT-001

```text
Button
Contrast = 5.17
Rule = PASS
```

预期：

```text
FAIL = 0
Recommendations = 0
```

---

# 44. Golden Scenario RPT-002

```text
Button
Contrast = 4.48
Rule = FAIL
```

预期：

```text
Findings = 1
Recommendation = 1
Verification = 1
```

---

# 45. Golden Scenario RPT-003

```text
37 Buttons
same component token
same failure
```

预期：

```text
Findings = 37
Finding Groups = 1
Recommendations = 1
Affected Elements = 37
```

---

# 46. Golden Scenario RPT-004

```text
Gradient Background
```

预期：

```text
Evaluation = UNKNOWN

Recommendation:
REVIEW_MEASUREMENT
```

不得：

```text
UNKNOWN → FAIL
```

---

# 47. Golden Scenario RPT-005

```text
Token Deviation
Accessibility PASS
```

预期：

```text
Design System Finding = 1

Accessibility Finding = 0
```

---

# 48. Golden Scenario RPT-006

```text
Light Theme
Dark Theme
```

预期：

```text
2 independent reports
```

不得计算：

```text
average theme quality
```

---

# 49. Golden Scenario RPT-007

Before：

```text
Contrast = 4.48
FAIL
```

After：

```text
Contrast = 5.17
PASS
```

预期：

```text
Regression:
FIXED_FAILURE = 1
```

---

# 50. Report Acceptance Criteria

## AC-RPT-01

能够生成完整 Quality Report。

## AC-RPT-02

Summary 统计正确。

## AC-RPT-03

Dimension 聚合正确。

## AC-RPT-04

Finding Group 聚合正确。

## AC-RPT-05

Diagnostic 可追溯。

## AC-RPT-06

Recommendation 确定性生成。

## AC-RPT-07

Recommendation 具有 Evidence。

## AC-RPT-08

Recommendation 具有 Verification Criteria。

## AC-RPT-09

Impact Trace 正确。

## AC-RPT-10

Theme 独立处理。

## AC-RPT-11

UNKNOWN 不转换成 FAIL。

## AC-RPT-12

Token Deviation 不自动转换成质量失败。

## AC-RPT-13

JSON Schema 验证通过。

## AC-RPT-14

Markdown 输出稳定。

## AC-RPT-15

HTML 输出稳定。

## AC-RPT-16

Report Golden 全部通过。

## AC-RPT-17

Recommendation Golden 全部通过。

## AC-RPT-18

同输入生成等价报告。

---

# 51. CI Integration

新增：

```text
pnpm test:reporting
```

CI：

```text
Core
 ↓
Color
 ↓
Geometry
 ↓
Measurement
 ↓
Metrics
 ↓
Rules
 ↓
Finding
 ↓
Diagnostic
 ↓
Conformance
 ↓
Regression
 ↓
Reporting
```

Reporting 不允许成为底层依赖。

---

# 52. Final M13 Runtime

完成后：

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
REPORTING
   ├── Quality Assessment
   ├── Finding Aggregation
   ├── Impact Analysis
   └── Recommendation
            ↓
       Verification
            ↓
        Regression
            ↓
       Release Gate
```

---

# 53. M13 Definition of Done

```text
[ ] @uiq/reporting
[ ] Quality Report Model
[ ] Dimension Aggregation
[ ] Finding Grouping
[ ] Diagnostic Linking
[ ] Recommendation Engine
[ ] Recommendation Rules
[ ] Impact Analysis
[ ] Verification Criteria
[ ] JSON Renderer
[ ] Markdown Renderer
[ ] HTML Renderer
[ ] JSON Schema
[ ] Golden Tests
[ ] Architecture Tests
[ ] CI Integration
```

---

# 54. Architecture Freeze

M13 不新增：

```text
Quality Engine
Aesthetic Engine
AI Scoring Engine
Recommendation Core Layer
Report Core Layer
```

保持：

```text
Core
 ↓
Runtime
 ↓
Application / Reporting
```

Recommendation 只是：

```text
Finding
+
Diagnostic
+
Evidence
+
Impact
+
Verification
```

的确定性应用输出。

---

# 55. UIQ V1.0 Product Capability

至此 UIQ 已经不是单纯的 UI Checker，而形成：

```text
             UIQ
              │
      ┌───────┴────────┐
      ↓                ↓
 Quantification     Governance
      │                │
      ↓                ↓
 Measurement       Conformance
 Metric            Regression
 Rule              Release Gate
 Evaluation
 Finding
 Diagnostic
      │
      ↓
 Reporting
      │
 ┌────┴────────┐
 ↓             ↓
Quality      Improvement
Assessment   Recommendation
      │             │
      └──────┬──────┘
             ↓
       Verification
```

最终闭环：

```text
REAL UI
→ MEASURE
→ QUANTIFY
→ EVALUATE
→ DIAGNOSE
→ RECOMMEND
→ MODIFY
→ REMEASURE
→ REGRESSION
→ VERIFY
→ RELEASE
```

这就是 UIQ V1.0 的完整产品闭环。