# UIQ-REF-02
# UIQ Reference Implementation Project Specification
## 参考实现工程规范 V1.0

**Specification ID:** UIQ-REF-02  
**Version:** 1.0.0  
**Status:** Draft for Implementation  
**Parent Specification:** UIQ-REF-01 Reference Architecture & Runtime Specification V1.0  
**Project:** UIQ — UI Design Quantification

---

# 1. 文档目的

本规范将：

> UIQ-REF-01 参考架构

转换为：

> 可直接创建、构建、测试和运行的 TypeScript Monorepo 工程。

本规范不新增 UIQ 核心概念。

工程实现必须遵循：

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
```

同时保证：

```text
Color / Geometry / Typography / Spacing
                 ↓
              Metric
                 ↓
               Rule
                 ↓
             Evaluation
```

---

# 2. 实现原则

## 2.1 Browser-first

UIQ V1.0 默认运行环境：

```text
Browser
Node.js
CI
CLI
```

核心计算不得依赖浏览器 DOM。

---

## 2.2 TypeScript-first

统一使用：

```text
TypeScript
ES2022+
ESM
```

推荐：

```text
Node.js >= 20
pnpm >= 10
```

---

## 2.3 Core 独立

`@uiq/core` 不得依赖：

- React
- Vue
- Radix UI
- Browser DOM
- CSSOM
- Node.js
- Playwright

---

# 3. Monorepo

推荐最终工程：

```text
uiq/
│
├── apps/
│   ├── inspector/
│   ├── playground/
│   └── cli/
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
│   └── conformance/
│
├── specs/
│   ├── UIQ-CORE/
│   ├── UIQ-FM/
│   ├── UIQ-MR/
│   ├── UIQ-ER/
│   ├── UIQ-TK/
│   └── UIQ-REF/
│
├── tests/
│   ├── fixtures/
│   ├── golden/
│   └── integration/
│
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

---

# 4. Package Responsibility

| Package | Responsibility |
|---|---|
| `core` | UIQ 基础领域模型 |
| `color` | 色彩空间及色度学计算 |
| `geometry` | 几何计算 |
| `measurement` | Measurement 创建与处理 |
| `metrics` | Metric 实现 |
| `rules` | Rule 与 Evaluation |
| `diagnostic` | Finding 与诊断 |
| `tokens` | Design Token |
| `theme` | Theme |
| `browser` | DOM/CSSOM Adapter |
| `conformance` | 标准符合性测试 |

---

# 5. Package Dependency Graph

依赖关系必须保持单向。

```text
                       ┌──────────────┐
                       │    core      │
                       └──────┬───────┘
                              │
             ┌────────────────┼────────────────┐
             ↓                ↓                ↓
          color           geometry         measurement
             │                │                │
             └────────────────┼────────────────┘
                              ↓
                           metrics
                              ↓
                            rules
                              ↓
                         diagnostic

tokens ───────────────→ theme
   │                      │
   └──────────────────────┘
              │
              ↓
         conformance

browser
   │
   ├──→ measurement
   ├──→ tokens
   └──→ theme

apps
   ↓
所有需要的 packages
```

---

# 6. 严格依赖规则

## 6.1 Core

```text
core → nothing
```

---

## 6.2 Color

```text
color → core
```

---

## 6.3 Geometry

```text
geometry → core
```

---

## 6.4 Measurement

```text
measurement → core
```

---

## 6.5 Metrics

```text
metrics → core
metrics → color
metrics → geometry
metrics → measurement
```

---

## 6.6 Rules

```text
rules → core
metrics → rules
```

其中：

```text
rules
```

可以读取 MetricResult，但不得反向修改 Metric。

---

## 6.7 Diagnostic

```text
diagnostic → core
diagnostic → rules
```

---

## 6.8 Browser

```text
browser → core
browser → measurement
browser → tokens
browser → theme
```

---

# 7. Package Naming

统一使用：

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

应用：

```text
@uiq/inspector
@uiq/playground
@uiq/cli
```

---

# 8. Core Domain Model

`@uiq/core` 只保存稳定概念。

---

## 8.1 Entity

```ts
export interface UIQEntity {
  id: string;
  type: string;
  version: string;
}
```

---

# 9. Measurement

Measurement 表示：

> 系统观察到的事实。

```ts
export interface Measurement<T = unknown> {
  id: string;
  subjectId: string;
  metricSource: string;
  value: T;
  unit?: string;
  timestamp: string;
  source: MeasurementSource;
}
```

---

## 9.1 MeasurementSource

```ts
export type MeasurementSource =
  | "DOM"
  | "CSSOM"
  | "TOKEN"
  | "STATIC"
  | "IMPORT"
  | "TEST";
```

---

# 10. Metric

Metric 表示：

> 从一个或多个 Measurement 推导出来的量化属性。

```ts
export interface MetricDefinition<T = unknown> {
  id: string;
  version: string;
  name: string;
  domain: MetricDomain;
  kind: MetricKind;
  dependencies: string[];
  calculate(context: MetricContext): MetricResult<T>;
}
```

---

## 10.1 MetricKind

```ts
export type MetricKind =
  | "BASE"
  | "DERIVED"
  | "COMPOSITE";
```

---

# 11. MetricResult

```ts
export interface MetricResult<T = unknown> {
  metricId: string;
  metricVersion: string;
  subjectId: string;
  value: T;
  unit?: string;
  dependencies: MetricDependency[];
}
```

---

## 11.1 Dependency

```ts
export interface MetricDependency {
  metricId: string;
  metricVersion: string;
  value: unknown;
}
```

这样可以保证：

```text
MetricResult
    ↓
Dependency Trace
    ↓
Reproducibility
```

---

# 12. Metric Registry

所有 Metric 必须注册。

```ts
export interface MetricRegistry {
  register(metric: MetricDefinition): void;

  get(
    metricId: string,
    version?: string
  ): MetricDefinition | undefined;

  list(): MetricDefinition[];

  has(
    metricId: string,
    version?: string
  ): boolean;
}
```

---

# 13. Rule

Rule 表示：

> 对 MetricResult 进行判定的显式规则。

```ts
export interface RuleDefinition {
  id: string;
  version: string;
  name: string;

  metricIds: string[];

  applicability: Applicability;

  evaluate(
    context: RuleContext
  ): EvaluationResult;
}
```

---

# 14. Rule 不得嵌入 Metric

禁止：

```ts
function contrastMetric() {
  if (contrast < 4.5) {
    return "BAD";
  }
}
```

正确：

```text
Contrast Metric
       ↓
4.2
       ↓
Contrast Rule
       ↓
FAIL
```

Metric 只回答：

> 测量值是多少？

Rule 才回答：

> 是否满足要求？

---

# 15. Applicability

```ts
export type Applicability =
  | "REQUIRED"
  | "OPTIONAL"
  | "CONDITIONAL";
```

---

# 16. Evaluation

```ts
export type EvaluationState =
  | "PASS"
  | "FAIL"
  | "WARN"
  | "NOT_APPLICABLE"
  | "UNKNOWN"
  | "ERROR";
```

---

# 17. EvaluationResult

```ts
export interface EvaluationResult {
  ruleId: string;
  ruleVersion: string;
  subjectId: string;

  state: EvaluationState;

  severity?: Severity;

  actual?: unknown;
  expected?: unknown;

  message: string;

  evidence: Evidence[];
}
```

---

# 18. Severity

```ts
export type Severity =
  | "INFO"
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";
```

Severity 不代表审美等级。

它表示：

> 当前 Rule Finding 的治理/风险严重程度。

---

# 19. Evidence

```ts
export interface Evidence {
  type:
    | "MEASUREMENT"
    | "METRIC"
    | "TOKEN"
    | "ELEMENT"
    | "RULE";

  id: string;

  value?: unknown;
}
```

---

# 20. Finding

Finding 是 Evaluation 产生的可追踪问题记录。

```ts
export interface Finding {
  id: string;

  subjectId: string;

  ruleId: string;
  ruleVersion: string;

  state: EvaluationState;
  severity?: Severity;

  message: string;

  evidence: Evidence[];

  createdAt: string;
}
```

---

# 21. Diagnostic

Diagnostic 不直接重新计算 Metric。

它读取：

```text
Finding
+
MetricResult
+
Evidence
```

生成诊断信息。

```ts
export interface Diagnostic {
  findingId: string;

  category: string;

  cause?: string;

  explanation: string;

  suggestions?: Suggestion[];
}
```

---

# 22. 第一条完整执行链

V1.0 必须首先实现：

```text
DOM Button
   ↓
Measurement
   ↓
COLOR.CONTRAST
   ↓
Rule
   ↓
Evaluation
   ↓
Finding
```

例如：

```text
Button
foreground = #ffffff
background = #2563eb

        ↓

Contrast = 5.17

        ↓

WCAG Contrast Rule

        ↓

PASS
```

---

# 23. Color Package

`@uiq/color` 实现：

```text
sRGB
XYZ
Lab
LCH
OKLab
OKLCH
```

核心对象：

```ts
export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface XYZ {
  x: number;
  y: number;
  z: number;
}

export interface OKLab {
  l: number;
  a: number;
  b: number;
}

export interface OKLCH {
  l: number;
  c: number;
  h: number | "UNDEFINED";
}
```

---

# 24. 色彩计算边界

必须区分：

```text
Color Encoding
Color Conversion
Color Measurement
Color Difference
Color Contrast
Color Selection
Color Gamut
```

禁止将：

```text
ΔE
```

实现为简单的：

```text
OKLCH Euclidean Distance
```

并称其为通用 ΔE。

---

# 25. Geometry Package

基础对象：

```ts
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}
```

基础计算：

```text
WIDTH
HEIGHT
AREA
ASPECT_RATIO
CENTER_DISTANCE
EDGE_DISTANCE
OVERLAP
```

---

# 26. Browser Measurement Adapter

Browser Adapter 负责：

```text
DOM
 ↓
Computed Style
 ↓
Bounding Rect
 ↓
Measurement
```

例如：

```ts
export interface ElementMeasurementAdapter {
  measureElement(
    element: Element
  ): Promise<Measurement[]>;
}
```

Browser 层不得直接产生：

```text
PASS
FAIL
GOOD
BAD
```

---

# 27. CSS Measurement

Browser Adapter 可以读取：

```ts
getComputedStyle(element)
```

并提取：

```text
color
background-color
font-size
font-weight
line-height
letter-spacing
margin
padding
gap
width
height
```

---

# 28. Metric Registry V1.0

第一阶段只实现最小可用 Metric。

### Color

```text
COLOR.SRGB
COLOR.OKLAB
COLOR.OKLCH
COLOR.CONTRAST
COLOR.DELTA_E
```

### Geometry

```text
GEOMETRY.WIDTH
GEOMETRY.HEIGHT
GEOMETRY.AREA
```

### Typography

```text
TYPOGRAPHY.FONT_SIZE
TYPOGRAPHY.FONT_WEIGHT
TYPOGRAPHY.LINE_HEIGHT
```

### Spacing

```text
SPACING.PADDING
SPACING.MARGIN
SPACING.GAP
```

---

# 29. Rule Registry

```ts
export interface RuleRegistry {
  register(rule: RuleDefinition): void;

  get(
    ruleId: string,
    version?: string
  ): RuleDefinition | undefined;

  list(): RuleDefinition[];
}
```

---

# 30. 第一批 Rule

V1.0 只建立少量基准 Rule。

```text
ACCESSIBILITY.CONTRAST.WCAG_AA
TYPOGRAPHY.MIN_FONT_SIZE
GEOMETRY.MIN_TARGET_SIZE
SPACING.SCALE_CONFORMANCE
TOKEN.COMPONENT_CONFORMANCE
```

避免一开始创建大量 Rule。

---

# 31. WCAG Contrast Rule

Rule：

```text
ACCESSIBILITY.CONTRAST.WCAG_AA
```

输入：

```text
COLOR.CONTRAST
```

输出：

```text
PASS
FAIL
```

规则参数：

```ts
interface ContrastRuleConfig {
  minimumRatio: number;
}
```

例如：

```json
{
  "minimumRatio": 4.5
}
```

---

# 32. Rule Parameterization

Rule 与具体阈值分离。

例如：

```text
Rule:
ACCESSIBILITY.CONTRAST

Configuration:
minimumRatio = 4.5
```

这样可以支持：

```text
Normal Text
Large Text
UI Component
Custom Policy
```

而无需复制 Metric。

---

# 33. Rule Evaluation Pipeline

```ts
const metricResult =
  metric.calculate(context);

const evaluation =
  rule.evaluate({
    metrics: [metricResult]
  });

const finding =
  findingFactory.create(evaluation);
```

完整链：

```text
MeasurementContext
      ↓
MetricEngine
      ↓
MetricResult
      ↓
RuleEngine
      ↓
EvaluationResult
      ↓
FindingFactory
      ↓
Finding
```

---

# 34. Metric Engine

```ts
export interface MetricEngine {
  calculate(
    metricId: string,
    subjectId: string,
    context: MetricContext
  ): MetricResult;
}
```

必须支持：

```text
dependency resolution
version resolution
result caching
trace
```

---

# 35. Rule Engine

```ts
export interface RuleEngine {
  evaluate(
    ruleId: string,
    subjectId: string,
    context: RuleContext
  ): EvaluationResult;
}
```

---

# 36. Evaluation Pipeline

统一入口：

```ts
export interface EvaluationEngine {
  evaluate(
    request: EvaluationRequest
  ): EvaluationReport;
}
```

---

## 36.1 EvaluationRequest

```ts
export interface EvaluationRequest {
  subjectId: string;

  metrics: string[];

  rules: string[];

  context: EvaluationContext;
}
```

---

# 37. EvaluationReport

```ts
export interface EvaluationReport {
  subjectId: string;

  metrics: MetricResult[];

  evaluations: EvaluationResult[];

  findings: Finding[];

  diagnostics: Diagnostic[];
}
```

---

# 38. Token Package

Token 模型：

```ts
export interface DesignToken {
  id: string;

  name: string;

  type: TokenType;

  value: unknown;

  reference?: string;

  description?: string;
}
```

Token 类型：

```text
COLOR
SIZE
SPACING
TYPOGRAPHY
RADIUS
SHADOW
MOTION
OTHER
```

---

# 39. Token Graph

Token Reference：

```text
component.button.background
             ↓
color.primary.600
             ↓
color.blue.600
```

必须支持：

```text
resolve
dependency
cycle detection
orphan detection
trace
```

---

# 40. Theme

```ts
export interface Theme {
  id: string;

  version: string;

  tokens: DesignToken[];

  metadata?: Record<string, unknown>;
}
```

Theme 必须可以独立验证：

```text
Theme
 ↓
Token Graph
 ↓
Token Resolution
 ↓
Theme Conformance
```

---

# 41. Browser 与 Token 的关系

最终关系：

```text
Token
 ↓
CSS Variable
 ↓
Computed Style
 ↓
Rendered UI
 ↓
Measurement
```

因此 UIQ 不仅能够检查：

```text
Token 是否正确
```

还可以检查：

```text
Token → CSS → Rendered UI
```

是否发生偏差。

---

# 42. Conformance Package

`@uiq/conformance` 不实现新的领域模型。

它负责：

```text
Specification
+
Registry
+
Golden Test
```

验证实现是否符合 UIQ。

---

# 43. Golden Test

例如：

```json
{
  "metric": "COLOR.CONTRAST",
  "version": "1.0.0",

  "foreground": "#ffffff",
  "background": "#2563eb",

  "expected": {
    "ratio": 5.17
  }
}
```

测试：

```text
Input
 ↓
Implementation
 ↓
Actual
 ↓
Expected
```

---

# 44. 浮点计算策略

色彩计算不能简单使用：

```text
=== 
```

必须使用：

```ts
approxEqual(
  actual,
  expected,
  tolerance
)
```

例如：

```text
absolute tolerance
relative tolerance
```

具体 tolerance 必须由 Metric/测试规范定义。

---

# 45. Metric Version

所有 Metric 必须拥有版本：

```text
COLOR.CONTRAST@1.0.0
COLOR.OKLAB@1.0.0
GEOMETRY.AREA@1.0.0
```

历史结果：

```text
metricId
metricVersion
```

不得只保存：

```text
metricId
```

---

# 46. Deterministic Evaluation

同样输入：

```text
Measurement Snapshot
+
Metric Version
+
Rule Version
+
Rule Configuration
```

必须得到相同结果。

即：

```text
same input
     ↓
same metric
     ↓
same evaluation
```

---

# 47. Measurement Snapshot

为保证历史可重现：

```ts
export interface MeasurementSnapshot {
  id: string;

  createdAt: string;

  measurements: Measurement[];

  source: MeasurementSource;

  environment?: Record<string, unknown>;
}
```

---

# 48. Evaluation Reproducibility

完整可重现条件：

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

形成：

```text
Reproducibility Context
```

---

# 49. CLI

V1.0 CLI：

```bash
uiq inspect ./page.html
```

```bash
uiq measure ./page.html
```

```bash
uiq evaluate ./page.html
```

```bash
uiq conformance
```

---

# 50. CLI 输出

机器可读：

```bash
uiq evaluate --format json
```

人类可读：

```bash
uiq evaluate --format table
```

---

# 51. JSON Report

例如：

```json
{
  "subjectId": "button.submit",

  "metrics": [
    {
      "metricId": "COLOR.CONTRAST",
      "metricVersion": "1.0.0",
      "value": 5.17
    }
  ],

  "evaluations": [
    {
      "ruleId": "ACCESSIBILITY.CONTRAST.WCAG_AA",
      "ruleVersion": "1.0.0",
      "state": "PASS"
    }
  ],

  "findings": []
}
```

---

# 52. Inspector

Inspector 是 UIQ 的主要交互应用。

第一阶段功能：

```text
Inspect Element
      ↓
Element Information
      ↓
Measurements
      ↓
Metrics
      ↓
Rules
      ↓
Findings
```

---

# 53. Inspector UI

推荐结构：

```text
┌───────────────────────────────────────┐
│ UIQ Inspector                         │
├───────────────────┬───────────────────┤
│ Element Tree      │ Element           │
│                   │                   │
│ Button            │ Measurements      │
│ Card              │ Metrics           │
│ Input             │ Rules             │
│                   │ Findings           │
└───────────────────┴───────────────────┘
```

---

# 54. Playground

Playground 用于：

```text
Color
Token
Theme
Component
Metric
Rule
```

实验。

例如：

```text
OKLCH Color
      ↓
Semantic Token
      ↓
Button
      ↓
Contrast
      ↓
Evaluation
```

---

# 55. 测试体系

测试分为：

```text
Unit Test
Golden Test
Integration Test
Browser Test
Conformance Test
Regression Test
```

---

# 56. Unit Test

主要测试：

```text
Color Conversion
Geometry
Metric
Rule
Token Resolution
```

---

# 57. Golden Test

主要测试：

```text
标准输入
→
标准输出
```

特别用于：

```text
色彩计算
ΔE
Contrast
Geometry
```

---

# 58. Integration Test

第一条集成测试：

```text
Button
 ↓
Browser Measurement
 ↓
Contrast Metric
 ↓
WCAG Rule
 ↓
Finding
```

---

# 59. Browser Test

使用：

```text
Playwright
```

验证：

```text
真实 DOM
+
CSS
+
Computed Style
+
Geometry
```

---

# 60. Conformance Test

测试 UIQ 实现是否符合：

```text
UIQ-FM
UIQ-MR
UIQ-ER
UIQ-TK
UIQ-REF
```

---

# 61. 第一阶段 MVP

只实现以下闭环：

```text
Browser
   ↓
Element
   ↓
Measurement
   ↓
Contrast Metric
   ↓
WCAG Rule
   ↓
Evaluation
   ↓
Finding
```

同时实现：

```text
Token
 ↓
Theme
 ↓
Token Resolution
```

---

# 62. MVP 暂不实现

以下内容不进入第一阶段核心：

```text
AI aesthetic scoring
Emotion prediction
Eye tracking
User preference prediction
Purchase prediction
Overall beauty score
Brand personality score
Automatic design generation
```

---

# 63. 第二阶段

增加：

```text
Typography Metrics
Geometry Metrics
Spacing Metrics
Layout Metrics
Accessibility Metrics
```

形成：

```text
Color
Typography
Geometry
Spacing
Layout
Accessibility
```

---

# 64. 第三阶段

增加：

```text
Theme Conformance
Component Conformance
Token Trace
Impact Analysis
Regression
```

形成：

```text
Design System
       ↓
UIQ
       ↓
Conformance
```

---

# 65. 第四阶段

形成：

```text
Inspector
+
CLI
+
CI
+
Playground
```

最终形成：

```text
Design
  ↓
Implementation
  ↓
Measurement
  ↓
Quantification
  ↓
Evaluation
  ↓
Diagnostics
  ↓
Conformance
```

---

# 66. CI

CI 最低要求：

```text
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm conformance
```

---

# 67. Quality Gate

发布必须满足：

```text
TypeScript compile = PASS
Lint = PASS
Unit Test = PASS
Golden Test = PASS
Integration Test = PASS
Conformance Test = PASS
```

---

# 68. Package API 原则

每个 package：

```text
src/
├── index.ts
├── domain/
├── services/
└── internal/
```

公开 API：

```text
index.ts
```

内部实现：

```text
internal/
```

禁止应用直接依赖 internal API。

---

# 69. API Stability

分为：

```text
PUBLIC
EXPERIMENTAL
INTERNAL
```

V1.0：

```text
core PUBLIC API
metric registry PUBLIC API
rule registry PUBLIC API
evaluation API PUBLIC
```

内部：

```text
算法优化
缓存
执行器
DOM 实现细节
```

---

# 70. 错误模型

不得大量使用：

```ts
throw new Error(...)
```

作为业务评价机制。

区分：

```text
Evaluation Failure
Calculation Error
Invalid Input
Unsupported Feature
Environment Error
```

例如：

```ts
export type UIQErrorCode =
  | "INVALID_INPUT"
  | "UNSUPPORTED"
  | "CALCULATION_ERROR"
  | "INVALID_CONFIGURATION"
  | "ENVIRONMENT_ERROR";
```

---

# 71. 缓存

允许缓存：

```text
Measurement
MetricResult
Token Resolution
```

缓存 Key 必须包含版本：

```text
subjectId
+
metricId
+
metricVersion
+
inputHash
```

禁止仅：

```text
metricId
```

作为缓存 Key。

---

# 72. Incremental Evaluation

当：

```text
padding
```

发生变化时，不应重新计算：

```text
unrelated color metrics
```

依赖图：

```text
Measurement
    ↓
Metric
    ↓
Rule
    ↓
Finding
```

只重新计算受影响节点。

---

# 73. Trace

每个 Evaluation 必须可以追踪：

```text
Finding
 ↓
Rule
 ↓
Metric
 ↓
Measurement
 ↓
DOM Element
```

例如：

```text
Finding F-001
   ↓
WCAG-AA
   ↓
Contrast = 3.82
   ↓
foreground = #777
background = #fff
   ↓
button.submit
```

---

# 74. UIQ Trace ID

运行时允许：

```text
traceId
```

贯穿：

```text
Measurement
Metric
Evaluation
Finding
Diagnostic
```

用于调试和审计。

---

# 75. 工程初始化

推荐：

```bash
mkdir uiq
cd uiq

pnpm init
```

创建：

```text
pnpm-workspace.yaml
```

内容：

```yaml
packages:
  - "packages/*"
  - "apps/*"
```

---

# 76. TypeScript

统一：

```text
tsconfig.base.json
```

推荐：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "declaration": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true
  }
}
```

---

# 77. Build

推荐：

```text
tsup
```

Library：

```text
ESM
```

Application：

```text
Vite
```

CLI：

```text
Node ESM
```

---

# 78. Test

统一：

```text
Vitest
```

Browser：

```text
Playwright
```

---

# 79. V1.0 不引入后端

UIQ 核心：

```text
Client-side
```

即可运行。

后端只有在出现：

```text
中央规则管理
组织级设计治理
历史报告
多用户
审计
策略分发
项目管理
```

等需求后再增加。

这不是 UIQ Core 的一部分。

---

# 80. 与色彩设计系统的关系

UIQ 与此前建立的色彩系统形成明确上下游：

```text
                 Color Science
                      │
                      ↓
              Perceptual Color Space
                      │
                      ↓
                   Palette
                      │
                      ↓
              Semantic Tokens
                      │
                      ↓
                   Theme
                      │
                      ↓
                 Components
                      │
                      ↓
                     UI
                      │
                      ↓
                  UIQ Measure
                      │
                      ↓
                   Metrics
                      │
                      ↓
                    Rules
                      │
                      ↓
                  Findings
```

UIQ 不负责替代：

```text
Color Selection System
```

而负责验证其：

```text
Color
 ↓
Token
 ↓
Theme
 ↓
Rendered UI
```

是否符合定义。

---

# 81. 与 Radix UI 的关系

Radix UI 只能作为：

```text
Component Adapter
```

例如：

```text
Radix Button
     ↓
Browser Adapter
     ↓
Measurement
     ↓
UIQ
```

UIQ Core 不得出现：

```ts
import "@radix-ui/..."
```

---

# 82. React/Vue 边界

UIQ Core：

```text
Framework Agnostic
```

可以被：

```text
React
Vue
Svelte
Web Components
Vanilla JS
```

使用。

---

# 83. Architecture Freeze

从本规范开始，UIQ V1.0 **冻结核心架构**。

禁止为了新增功能而继续增加：

```text
新的 Core Layer
新的 Domain Kernel
新的 Abstract Engine
新的 Meta Engine
新的 Universal Model
```

---

# 84. 扩展机制

以后新增能力只能优先采用：

```text
Metric
Rule
Registry
Adapter
Diagnostic
Conformance Test
```

例如新增：

```text
COLOR.APCA
```

只能增加：

```text
Metric/Rule
```

而不是：

```text
New Color Evaluation Layer
```

---

# 85. 最终架构

UIQ V1.0 最终冻结为：

```text
                 ┌──────────────────┐
                 │      Apps        │
                 │ Inspector/CLI    │
                 └────────┬─────────┘
                          │
                 ┌────────▼─────────┐
                 │   Application    │
                 └────────┬─────────┘
                          │
          ┌───────────────┼────────────────┐
          ↓               ↓                ↓
       Browser         Token/Theme      Conformance
          │               │
          └───────┬───────┘
                  ↓
             Measurement
                  ↓
               Metrics
                  ↓
                Rules
                  ↓
              Evaluation
                  ↓
               Findings
                  ↓
              Diagnostic

                  │
                  ↓

                 Core
```

---

# 86. 最终核心闭环

UIQ V1.0 的核心不是：

```text
UI → Score
```

而是：

```text
UI
 ↓
Observed Facts
 ↓
Measurements
 ↓
Quantitative Metrics
 ↓
Explicit Rules
 ↓
Deterministic Evaluation
 ↓
Traceable Findings
 ↓
Explainable Diagnostics
```

这条链是 UIQ 的核心技术闭环。

---

# 87. V1.0 完成判定

满足以下条件即可认为 UIQ V1.0 Reference Implementation 成立：

- [ ] Monorepo 建立
- [ ] Package dependency graph 固定
- [ ] Core API 固定
- [ ] Measurement API 固定
- [ ] Metric Registry 可运行
- [ ] Rule Registry 可运行
- [ ] Evaluation Engine 可运行
- [ ] Finding 可生成
- [ ] Browser Adapter 可读取真实 DOM
- [ ] Contrast Metric 可运行
- [ ] WCAG Contrast Rule 可运行
- [ ] Token Graph 可解析
- [ ] Theme 可解析
- [ ] Golden Test 可运行
- [ ] Conformance Test 可运行
- [ ] CLI 可运行
- [ ] Inspector 可运行
- [ ] CI 可运行

---

# 88. 架构收敛声明

UIQ 至此不再继续通过增加抽象层进行“演进”。

未来版本主要表现为：

```text
V1.x
 ├── 增加 Metric
 ├── 增加 Rule
 ├── 增加 Adapter
 ├── 增加 Diagnostic
 └── 增加 Conformance Test

V2.x
 ├── Governance
 ├── Project
 ├── Historical Analysis
 └── Organization

而不是：

V1
 ↓
V2
 ↓
V3
 ↓
V4
 ↓
V5
 ↓
无限增加架构层
```

UIQ 的核心模型因此保持稳定：

```text
Entity
Measurement
Metric
Rule
Evaluation
Finding
Diagnostic
Token
Theme
```

这些对象构成 UIQ 的稳定基础。

---

# 89. 下一阶段实施边界

下一阶段不再做新的理论模型。

直接进入：

> **UIQ-IMPL-01《V1.0 最小可运行实现规范》**

实现第一条真实闭环：

```text
HTML Button
      ↓
Browser Adapter
      ↓
Computed Style
      ↓
Measurement
      ↓
COLOR.CONTRAST
      ↓
ACCESSIBILITY.CONTRAST.WCAG_AA
      ↓
EvaluationResult
      ↓
Finding
      ↓
Inspector
```

同时以一个真实 Button 为 Golden Case，验证整个 UIQ 架构是否真正闭环。