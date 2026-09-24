# UIQ-IMPL-02
## V1.0 Monorepo Implementation & First Vertical Slice Specification

**文档编号：** UIQ-IMPL-02  
**版本：** V1.0.0  
**状态：** Implementation Baseline / Frozen  
**适用范围：** UIQ V1.0  
**技术基线：** TypeScript + pnpm + Browser  
**核心原则：** Implementation follows Specification

---

# 1. 文档目的

本规范定义 UIQ V1.0 从形式规范进入工程实现阶段的具体方式。

本规范不重新定义 UIQ 的领域模型、Metric、Rule、Evaluation、Finding 或 Diagnostic。

其目标是：

> 将已经冻结的 UIQ V1.0 规范转化为一个可以安装、构建、测试、运行和扩展的工程。

核心闭环：

```text
Real UI
   │
   ▼
Browser Measurement
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
   ▼
Finding
   │
   ▼
Diagnostic
   │
   ▼
Conformance
   │
   ▼
Regression
```

---

# 2. Implementation Freeze

从 UIQ-IMPL-02 开始：

**不再增加新的 Core Architecture Layer。**

后续能力只允许通过以下方式扩展：

```text
Metric
Rule
Registry
Adapter
Diagnostic
Conformance Test
```

禁止：

```text
新增 Universal Engine
新增 Design Intelligence Layer
新增 AI Design Layer
新增 Aesthetic Engine
新增 Semantic Engine
新增 Meta Evaluation Layer
新增 DSL Runtime
```

UIQ V1.0 的实现工作重点由：

```text
Architecture Design
```

切换为：

```text
Implementation
Testing
Conformance
Performance
Usability
```

---

# 3. 工程总体结构

采用 pnpm Workspace。

```text
uiq/
│
├── package.json
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── tsconfig.json
├── tsconfig.base.json
├── vitest.config.ts
├── playwright.config.ts
│
├── packages/
│   │
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
├── apps/
│   │
│   ├── inspector/
│   ├── playground/
│   └── cli/
│
├── specs/
│   ├── UIQ-FM-01.md
│   ├── UIQ-MR-01.md
│   ├── UIQ-TK-01.md
│   ├── UIQ-ER-02.md
│   ├── UIQ-DG-01.md
│   ├── UIQ-TST-01.md
│   └── UIQ-IMPL-02.md
│
├── tests/
│   ├── golden/
│   ├── fixtures/
│   ├── browser/
│   └── regression/
│
└── examples/
    ├── basic/
    ├── radix/
    └── themes/
```

---

# 4. Package Dependency

依赖关系严格保持：

```text
                    ┌─────────────┐
                    │  @uiq/core  │
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
     @uiq/color      @uiq/geometry   @uiq/measurement
          │                │                │
          └────────────────┼────────────────┘
                           ▼
                    @uiq/metrics
                           │
                           ▼
                     @uiq/rules
                           │
                           ▼
                  @uiq/diagnostic
                           
     @uiq/tokens ──────────┐
                           ▼
                       @uiq/theme
                           │
                           ▼
                     @uiq/browser

                 @uiq/conformance
                       │
                       ▼
                 all test contracts

Apps consume required packages.
```

核心依赖：

```text
core
  ↓
color
geometry
measurement
  ↓
metrics
  ↓
rules
  ↓
diagnostic
```

Token/Theme：

```text
core
 ↓
tokens
 ↓
theme
 ↓
browser
```

---

# 5. Workspace Package Naming

正式 package name：

| Package | npm Name |
|---|---|
| core | `@uiq/core` |
| color | `@uiq/color` |
| geometry | `@uiq/geometry` |
| measurement | `@uiq/measurement` |
| metrics | `@uiq/metrics` |
| rules | `@uiq/rules` |
| diagnostic | `@uiq/diagnostic` |
| tokens | `@uiq/tokens` |
| theme | `@uiq/theme` |
| browser | `@uiq/browser` |
| conformance | `@uiq/conformance` |

Applications：

```text
@uiq/inspector
@uiq/playground
@uiq/cli
```

---

# 6. TypeScript 基线

推荐：

```text
TypeScript >= 5.x
Node.js >= 20 LTS
pnpm >= 10
```

Browser：

```text
ES2022+
DOM
```

模块：

```text
ESM
```

不允许在 Core 中依赖 Node.js API。

因此：

```text
@uiq/core
@uiq/color
@uiq/geometry
@uiq/measurement
@uiq/metrics
@uiq/rules
@uiq/diagnostic
```

均保持平台无关。

---

# 7. Root package.json

```json
{
  "name": "uiq",
  "private": true,
  "packageManager": "pnpm@10",
  "scripts": {
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "test:unit": "vitest run",
    "test:watch": "vitest",
    "test:browser": "playwright test",
    "lint": "eslint .",
    "format": "prettier --write .",
    "typecheck": "tsc --noEmit",
    "conformance": "pnpm --filter @uiq/conformance conformance",
    "dev:inspector": "pnpm --filter @uiq/inspector dev",
    "dev:playground": "pnpm --filter @uiq/playground dev"
  }
}
```

---

# 8. pnpm Workspace

```yaml
packages:
  - "packages/*"
  - "apps/*"
```

---

# 9. @uiq/core

Core 只保存稳定的领域契约。

```text
packages/core/src/

├── entity/
│   ├── UIQEntity.ts
│   └── EntityId.ts
│
├── measurement/
│   ├── Measurement.ts
│   └── MeasurementSource.ts
│
├── metric/
│   ├── MetricDefinition.ts
│   ├── MetricResult.ts
│   ├── MetricDependency.ts
│   └── MetricRegistry.ts
│
├── rule/
│   ├── RuleDefinition.ts
│   ├── RuleConfiguration.ts
│   ├── EvaluationResult.ts
│   └── EvaluationState.ts
│
├── finding/
│   └── Finding.ts
│
├── diagnostic/
│   └── Diagnostic.ts
│
├── token/
│   └── DesignToken.ts
│
├── theme/
│   └── Theme.ts
│
└── index.ts
```

---

# 10. Measurement

```ts
export interface Measurement<T> {
  readonly id: string;
  readonly subjectId: string;
  readonly type: string;
  readonly value: T;
  readonly unit?: string;
  readonly source: MeasurementSource;
  readonly timestamp: number;
}
```

Measurement 是：

> 对实际 UI 状态的观察结果。

不包含：

```text
PASS
FAIL
GOOD
BAD
```

---

# 11. MetricDefinition

```ts
export type MetricKind =
  | "BASE"
  | "DERIVED"
  | "COMPOSITE"
  | "EXPERIMENTAL";

export interface MetricDefinition<T = unknown> {
  readonly id: string;
  readonly version: string;
  readonly kind: MetricKind;

  readonly dependencies: MetricDependency[];

  calculate(context: MetricContext): MetricResult<T>;
}
```

Metric 永远不负责：

```text
政策判断
设计评价
PASS/FAIL
Severity
Recommendation
```

---

# 12. MetricResult

```ts
export interface MetricResult<T = unknown> {
  readonly metricId: string;
  readonly metricVersion: string;

  readonly subjectId: string;

  readonly value?: T;
  readonly unit?: string;

  readonly status:
    | "AVAILABLE"
    | "UNKNOWN"
    | "ERROR";

  readonly dependencies: MetricDependency[];

  readonly fingerprint: string;
}
```

---

# 13. EvaluationState

```ts
export type EvaluationState =
  | "PASS"
  | "FAIL"
  | "WARN"
  | "NOT_APPLICABLE"
  | "UNKNOWN"
  | "ERROR";
```

严格禁止：

```text
UNKNOWN → PASS
NOT_APPLICABLE → PASS
ERROR → PASS
```

---

# 14. RuleDefinition

```ts
export interface RuleDefinition {
  readonly id: string;
  readonly version: string;

  readonly metricId: string;
  readonly metricVersion: string;

  readonly operator: ComparisonOperator;

  readonly threshold?: number;
  readonly range?: NumericRange;

  readonly tolerance?: Tolerance;

  readonly applicability: ApplicabilityDefinition;

  readonly severity: Severity;
}
```

Rule 只消费 MetricResult。

```text
MetricResult
      ↓
RuleEvaluator
      ↓
EvaluationResult
```

Rule 不重新计算 Metric。

---

# 15. First Metric

V1.0 第一条正式可运行 Metric：

```text
COLOR.CONTRAST@1.0.0
```

输入：

```text
foreground
background
```

输出：

```text
contrast ratio
```

---

# 16. Color Package

目录：

```text
packages/color/src/

├── srgb/
│   ├── parseSrgb.ts
│   └── srgbToLinear.ts
│
├── xyz/
│   └── srgbToXyz.ts
│
├── oklab/
│   ├── xyzToOklab.ts
│   └── oklabToOklch.ts
│
├── contrast/
│   └── contrastRatio.ts
│
├── gamut/
│   └── gamutDistance.ts
│
└── index.ts
```

---

# 17. sRGB Parsing

必须支持：

```text
#RGB
#RGBA
#RRGGBB
#RRGGBBAA
```

内部统一：

```ts
interface SRGB {
  r: number;
  g: number;
  b: number;
  alpha: number;
}
```

范围：

```text
0 ≤ r,g,b ≤ 1
0 ≤ alpha ≤ 1
```

---

# 18. sRGB Linearization

```ts
function srgbToLinear(value: number): number {
  if (value <= 0.04045) {
    return value / 12.92;
  }

  return Math.pow(
    (value + 0.055) / 1.055,
    2.4
  );
}
```

相对亮度：

```text
Y =
0.2126 R +
0.7152 G +
0.0722 B
```

其中：

```text
R G B = linear RGB
```

---

# 19. Contrast Metric

```ts
export function contrastRatio(
  foreground: SRGB,
  background: SRGB
): number {
  const l1 = relativeLuminance(foreground);
  const l2 = relativeLuminance(background);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}
```

结果：

```text
1 ≤ Contrast ≤ 21
```

---

# 20. OKLab / OKLCH

UIQ Color Package 正式提供：

```text
sRGB
 ↓
Linear RGB
 ↓
XYZ
 ↓
OKLab
 ↓
OKLCH
```

OKLCH：

```text
L = Lightness
C = Chroma
H = Hue
```

其中：

```text
C = sqrt(a² + b²)
H = atan2(b, a)
```

当：

```text
C < epsilon
```

则：

```text
H = UNDEFINED
```

不得强制设置：

```text
H = 0
```

---

# 21. @uiq/metrics

目录：

```text
packages/metrics/src/

├── color/
│   ├── colorSrgbMetric.ts
│   ├── colorOklabMetric.ts
│   ├── colorOklchMetric.ts
│   ├── colorLightnessMetric.ts
│   ├── colorChromaMetric.ts
│   └── colorContrastMetric.ts
│
├── typography/
│   ├── fontSizeMetric.ts
│   ├── fontWeightMetric.ts
│   ├── lineHeightMetric.ts
│   ├── letterSpacingMetric.ts
│   ├── textMeasureMetric.ts
│   └── scaleRatioMetric.ts
│
├── geometry/
│   ├── widthMetric.ts
│   ├── heightMetric.ts
│   ├── areaMetric.ts
│   ├── aspectRatioMetric.ts
│   ├── centerDistanceMetric.ts
│   ├── edgeDistanceMetric.ts
│   └── overlapMetric.ts
│
└── registry.ts
```

---

# 22. Metric Registry

统一注册：

```ts
metricRegistry.register(
  colorContrastMetric
);
```

查询：

```ts
const metric =
  metricRegistry.get(
    "COLOR.CONTRAST",
    "1.0.0"
  );
```

禁止：

```ts
metricRegistry.get("COLOR.CONTRAST")
```

在需要历史可重现的场景中省略版本。

---

# 23. Rule Registry

目录：

```text
packages/rules/src/

├── accessibility/
│   ├── contrastWcagAa.ts
│   └── targetSizeMinimum.ts
│
├── typography/
│   ├── fontSizeMinimum.ts
│   └── lineHeightMinimum.ts
│
├── spacing/
│   └── scaleConformance.ts
│
├── token/
│   ├── tokenMatch.ts
│   └── componentConformance.ts
│
├── evaluator/
│   └── ruleEvaluator.ts
│
└── registry.ts
```

---

# 24. First Rule

```text
ACCESSIBILITY.CONTRAST.WCAG_AA@1.0.0
```

默认：

```text
text:
minimum = 4.5

large text:
minimum = 3
```

规则配置：

```ts
interface ContrastRuleConfiguration {
  minimumRatio: number;
}
```

Rule 本身：

```text
Metric:
5.17

Rule:
minimum = 4.5

Evaluation:
PASS
```

---

# 25. Evaluation Engine

核心执行过程：

```ts
const metricResult =
  metric.calculate(context);

const evaluation =
  ruleEvaluator.evaluate(
    rule,
    metricResult,
    configuration
  );
```

逻辑：

```text
Metric unavailable
        ↓
     UNKNOWN

Metric error
        ↓
      ERROR

Applicable + condition true
        ↓
      PASS

Applicable + condition false
        ↓
      FAIL
```

---

# 26. Finding Generator

Evaluation：

```text
FAIL
```

生成：

```ts
Finding
```

示例：

```json
{
  "id": "F-000001",
  "type": "ACCESSIBILITY",
  "state": "OPEN",
  "severity": "HIGH",
  "subjectId": "button.submit",
  "ruleId": "ACCESSIBILITY.CONTRAST.WCAG_AA",
  "ruleVersion": "1.0.0"
}
```

Finding 必须能够追溯：

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
 ↓
DOM
```

---

# 27. Diagnostic Package

第一阶段只实现确定性 Diagnostic。

```text
packages/diagnostic/src/

├── diagnosticEngine.ts
├── diagnosticRegistry.ts
├── types.ts
└── diagnostics/
    ├── contrastDiagnostic.ts
    ├── tokenDeviationDiagnostic.ts
    └── typographyDiagnostic.ts
```

示例：

```text
Finding
  ↓
Contrast Diagnostic
  ↓
foreground = #777777
background = #FFFFFF
contrast = 4.48
required = 4.50
```

Diagnostic 说明：

```text
实际对比度低于规则要求。
```

而不是：

```text
请改成 #0066FF。
```

后者属于 Recommendation。

---

# 28. Browser Measurement

`@uiq/browser` 是 UIQ 与浏览器之间的 Adapter。

```text
packages/browser/src/

├── dom/
│   ├── getComputedStyleValue.ts
│   ├── resolveBackground.ts
│   └── elementIdentity.ts
│
├── measurement/
│   ├── measureColor.ts
│   ├── measureTypography.ts
│   └── measureGeometry.ts
│
└── index.ts
```

---

# 29. DOM Measurement 原则

禁止：

```ts
element.style.color
```

作为唯一数据源。

必须优先：

```ts
getComputedStyle(element)
```

原因：

```text
inline CSS
+
stylesheet
+
cascade
+
inheritance
+
CSS variables
+
browser computation
```

最终真正影响 UI 的是：

```text
Computed Style
```

---

# 30. Background Resolution

计算前景/背景时：

```text
Element
 ↓
background-color
 ↓
alpha?
 ↓
transparent
 ↓
parent
 ↓
parent...
```

如果最终无法确定：

```text
Evaluation = UNKNOWN
```

不得任意假设：

```text
background = white
```

---

# 31. Unsupported Background

V1.0 对以下情况默认：

```text
linear-gradient
radial-gradient
image
backdrop-filter
complex compositing
```

不进行未经定义的近似。

结果：

```text
UNKNOWN
```

而不是：

```text
PASS
```

或：

```text
FAIL
```

---

# 32. Geometry Adapter

使用：

```ts
element.getBoundingClientRect()
```

获得：

```ts
interface DOMRectMeasurement {
  x: number;
  y: number;
  width: number;
  height: number;
}
```

坐标系统：

```text
Viewport-relative
```

因此 MeasurementSnapshot 必须保存：

```text
viewport
devicePixelRatio
zoom
scroll context
```

---

# 33. Typography Adapter

使用：

```ts
getComputedStyle(element)
```

采集：

```text
font-size
font-weight
line-height
letter-spacing
```

例如：

```text
font-weight: 437
```

必须保持：

```text
437
```

不能自动转换：

```text
437 → 400
```

---

# 34. Token Package

目录：

```text
packages/tokens/src/

├── model/
│   ├── DesignToken.ts
│   ├── TokenReference.ts
│   └── TokenType.ts
│
├── graph/
│   ├── TokenGraph.ts
│   ├── cycleDetection.ts
│   └── dependencyResolver.ts
│
├── resolution/
│   └── tokenResolver.ts
│
├── conformance/
│   ├── tokenMatch.ts
│   ├── tokenDeviation.ts
│   └── tokenFragmentation.ts
│
└── index.ts
```

---

# 35. Token Graph

正式模型：

```text
Primitive Token
      ↓
Semantic Token
      ↓
Component Token
```

例如：

```text
blue-600
   ↓
color-primary
   ↓
button-background
```

必须禁止：

```text
A → B
B → C
C → A
```

检测结果：

```text
TOKEN_GRAPH_CYCLE
```

---

# 36. Orphan Token

孤立 Token：

```text
unused token
```

不是自动判定为：

```text
INVALID
```

应分类：

```text
ORPHAN
```

最终是否允许由 Conformance Rule 决定。

---

# 37. Theme Package

Theme 是 Token Resolution Context。

```text
packages/theme/src/

├── Theme.ts
├── ThemeContext.ts
├── ThemeResolver.ts
├── ThemeValidator.ts
└── ThemeImpact.ts
```

Theme：

```text
Light
Dark
High Contrast
Custom
```

每个 Theme：

```text
独立解析
独立测量
独立评估
独立 Conformance
```

不能因为：

```text
Light PASS
```

就推断：

```text
Dark PASS
```

---

# 38. First Vertical Slice

V1.0 首个完整闭环：

```text
<button>
    │
    ▼
DOM Measurement
    │
    ▼
COLOR.CONTRAST
    │
    ▼
ACCESSIBILITY.CONTRAST.WCAG_AA
    │
    ▼
EvaluationResult
    │
    ▼
Finding
    │
    ▼
Diagnostic
    │
    ▼
Inspector
```

---

# 39. Example

HTML：

```html
<button id="submit">
  Submit
</button>
```

CSS：

```css
#submit {
  color: #ffffff;
  background-color: #2563eb;
}
```

Measurement：

```text
foreground = #FFFFFF
background = #2563EB
```

Metric：

```text
COLOR.CONTRAST
≈ 5.17
```

Rule：

```text
minimum = 4.5
```

Evaluation：

```text
PASS
```

因此：

```text
Finding = none
```

---

# 40. Failure Example

```css
#submit {
  color: #777777;
  background-color: #ffffff;
}
```

Metric：

```text
contrast ≈ 4.48
```

Rule：

```text
minimum = 4.50
```

Evaluation：

```text
FAIL
```

Finding：

```text
ACCESSIBILITY
HIGH
```

Diagnostic：

```text
Foreground/background contrast
does not satisfy the configured minimum.
```

---

# 41. UNKNOWN Example

```css
button {
  color: white;
  background: linear-gradient(
    red,
    blue
  );
}
```

V1.0：

```text
Background = UNKNOWN
```

因此：

```text
COLOR.CONTRAST
    ↓
UNKNOWN
    ↓
Evaluation = UNKNOWN
```

绝不：

```text
UNKNOWN → PASS
```

---

# 42. Inspector

Inspector 是 V1.0 第一用户界面。

结构：

```text
Inspector
│
├── Element
│
├── Measurements
│
├── Metrics
│
├── Rules
│
├── Findings
│
└── Diagnostics
```

示例：

```text
Button#submit

Measurements
────────────────
Color       #FFFFFF
Background  #2563EB
Width       120px
Height      40px

Metrics
────────────────
Contrast    5.17

Rules
────────────────
WCAG AA     PASS
```

失败时：

```text
Rules
────────────────
WCAG AA     FAIL

Finding
────────────────
Contrast ratio 4.48
Required       4.50

Diagnostic
────────────────
Foreground/background
contrast is below threshold.
```

---

# 43. Inspector 与 UI Framework

Inspector 本身可以使用：

```text
React
```

或其他 UI Framework。

但是：

```text
@uiq/core
@uiq/color
@uiq/metrics
@uiq/rules
```

不能依赖 React。

因此：

```text
UIQ Core
    ↑
Inspector Adapter
    ↑
React
```

而不是：

```text
React
 ↓
UIQ Core
```

---

# 44. Radix UI Integration

Radix UI 属于：

```text
Adapter / Example
```

不是 UIQ Core。

可以建立：

```text
examples/radix/
```

用于：

```text
Radix Component
 ↓
DOM
 ↓
Browser Measurement
 ↓
UIQ
```

UIQ 不依赖 Radix。

---

# 45. Conformance Runner

`@uiq/conformance`：

```text
packages/conformance/

├── runner/
│   ├── ConformanceRunner.ts
│   └── ConformanceReport.ts
│
├── golden/
│   ├── color/
│   ├── geometry/
│   ├── typography/
│   └── rules/
│
├── schema/
│   └── schemas/
│
└── index.ts
```

执行：

```bash
pnpm conformance
```

支持：

```bash
uiq conformance --level core
uiq conformance --level standard
uiq conformance --level browser
uiq conformance --level full
```

---

# 46. Golden Test

示例：

```json
{
  "id": "COLOR-CONTRAST-001",
  "metric": "COLOR.CONTRAST",
  "version": "1.0.0",
  "input": {
    "foreground": "#FFFFFF",
    "background": "#000000"
  },
  "expected": {
    "value": 21
  },
  "tolerance": 0.0001
}
```

测试：

```text
actual = 21
expected = 21
difference = 0
```

结果：

```text
PASS
```

---

# 47. Rule Boundary Tests

必须测试：

```text
threshold - epsilon
threshold
threshold + epsilon
```

例如：

```text
4.49 → FAIL
4.50 → PASS
4.51 → PASS
```

具体边界必须由 Rule Configuration 明确。

---

# 48. Snapshot Fingerprint

为了保证历史结果可重现：

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

生成：

```text
Evaluation Fingerprint
```

例如：

```text
sha256(...)
```

同样输入必须产生：

```text
same fingerprint
```

---

# 49. Regression

回归结果分类：

```text
NEW_FAILURE
FIXED_FAILURE
PERSISTING_FAILURE
CHANGED_RESULT
NEW_UNKNOWN
RESOLVED_UNKNOWN
```

禁止自动覆盖 Golden。

错误结果：

```text
test failed
→ automatically regenerate golden
```

必须禁止。

正确流程：

```text
Test Failure
     ↓
Review
     ↓
Determine:
  implementation bug?
  specification change?
  expected change?
     ↓
Explicit Approval
     ↓
Golden Update
```

---

# 50. CLI

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

JSON：

```bash
uiq evaluate ./page.html \
  --format json
```

---

# 51. JSON Evaluation Output

```json
{
  "engineVersion": "1.0.0",
  "subject": "button#submit",
  "metrics": [
    {
      "id": "COLOR.CONTRAST",
      "version": "1.0.0",
      "value": 5.17,
      "status": "AVAILABLE"
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

# 52. Error Handling

错误必须与 UNKNOWN 区分。

## UNKNOWN

表示：

```text
证据不足
```

例如：

```text
复杂背景无法解析
```

## ERROR

表示：

```text
执行过程发生异常
```

例如：

```text
Metric implementation exception
```

两者不可混淆。

---

# 53. Precision Policy

UIQ 使用四级精度：

```text
Calculation Precision
Storage Precision
Display Precision
Comparison Tolerance
```

例如：

```text
Calculation:
IEEE 754 double

Storage:
JSON number

Display:
5.17

Comparison:
±0.01
```

Display precision：

```text
不改变 Metric Result
```

---

# 54. Determinism

纯数学 Metric 必须满足：

```text
same input
+
same version
→
same output
```

浏览器 Measurement 则必须记录：

```text
browser
browser version
viewport
devicePixelRatio
zoom
OS/environment when relevant
```

因此：

```text
Calculation Determinism
```

和：

```text
Browser Measurement Reproducibility
```

分开处理。

---

# 55. CI Pipeline

推荐：

```text
Install
  ↓
Lint
  ↓
TypeCheck
  ↓
Unit Test
  ↓
Golden Test
  ↓
Schema Test
  ↓
Contract Test
  ↓
Build
  ↓
Browser Test
  ↓
Conformance
```

命令：

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:browser
pnpm conformance
```

---

# 56. MVP Definition of Done

UIQ V1.0 MVP 至少必须完成：

### Core

```text
Measurement
Metric
Rule
Evaluation
Finding
Diagnostic
```

### Color

```text
sRGB
XYZ
OKLab
OKLCH
Contrast
```

### Geometry

```text
Width
Height
Area
Aspect Ratio
Center Distance
Edge Distance
Overlap
```

### Typography

```text
Font Size
Font Weight
Line Height
Letter Spacing
Text Measure
Scale Ratio
```

### Browser

```text
Computed Style
DOMRect
Background Resolution
```

### Token

```text
Token Graph
Cycle Detection
Resolution
Token Match
Token Deviation
```

### Theme

```text
Theme Resolution
Theme Isolation
Theme Validation
```

### Testing

```text
Unit
Golden
Rule Boundary
Schema
Contract
Browser
Regression
Conformance
```

---

# 57. V1.0 不做

以下全部明确排除：

```text
AI Aesthetic Score
AI Design Critic
Automatic Color Recommendation
Automatic Layout Recommendation
Eye Tracking
Emotion Prediction
Purchase Prediction
Brand Personality Score
Universal Beauty Score
Automatic Design Generation
```

同时：

```text
不增加 DSL
不增加后端
不增加数据库
不增加消息系统
不增加微服务
```

UIQ V1.0 浏览器端即可完整运行。

---

# 58. Backend Boundary

V1.0：

```text
Browser
   ↓
UIQ
   ↓
Evaluation
```

暂不要求 Backend。

未来如果出现：

```text
Central Governance
Historical Analysis
Multi-user
Organization Policy
Audit
Design Repository
CI Governance
```

再增加：

```text
UIQ Governance Service
```

但它不属于 V1.0 Core。

---

# 59. First Implementation Milestone

第一个可运行版本只要求：

```text
@uiq/core
@uiq/color
@uiq/measurement
@uiq/metrics
@uiq/rules
@uiq/diagnostic
@uiq/browser
@uiq/conformance
@uiq/inspector
```

实现：

```text
Button
 ↓
Computed Style
 ↓
Contrast
 ↓
WCAG AA
 ↓
PASS / FAIL / UNKNOWN
 ↓
Finding
 ↓
Diagnostic
 ↓
Inspector
```

完成后再扩展：

```text
Typography
Geometry
Token
Theme
```

---

# 60. Engineering Acceptance Criteria

UIQ V1.0 实现必须满足：

| 编号 | 条件 |
|---|---|
| AC-01 | Core 不依赖 UI Framework |
| AC-02 | Metric 不包含评价逻辑 |
| AC-03 | Rule 不重新计算 Metric |
| AC-04 | UNKNOWN 不自动转换 PASS |
| AC-05 | NOT_APPLICABLE 不自动转换 PASS |
| AC-06 | Finding 可追溯到 Rule |
| AC-07 | Diagnostic 可追溯到 Evidence |
| AC-08 | Token Graph 不允许循环 |
| AC-09 | Theme 独立验证 |
| AC-10 | Metric Version 可追踪 |
| AC-11 | Rule Version 可追踪 |
| AC-12 | Golden Test 可重复执行 |
| AC-13 | Browser Measurement 与 Calculation 分离 |
| AC-14 | Radix UI 不成为 Core 依赖 |
| AC-15 | V1.0 不增加新的 Core Layer |

---

# 61. 最终工程闭环

最终实现应稳定收敛为：

```text
                   ┌──────────────┐
                   │   Real UI    │
                   └──────┬───────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │   Measurement   │
                 └────────┬────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │     Metric      │
                 └────────┬────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │      Rule       │
                 └────────┬────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │   Evaluation    │
                 └────────┬────────┘
                          │
                    FAIL / WARN
                          │
                          ▼
                 ┌─────────────────┐
                 │    Finding      │
                 └────────┬────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │   Diagnostic    │
                 └────────┬────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │  Conformance    │
                 └────────┬────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │   Regression    │
                 └─────────────────┘
```

---

# 62. UIQ V1.0 收敛定义

UIQ V1.0 的核心架构到此冻结。

最终核心语义：

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

最终工程能力：

```text
Metric Registry
Rule Registry
Token Registry
Theme Registry
Diagnostic Registry
Conformance Registry
```

最终扩展机制：

```text
Metric
Rule
Adapter
Diagnostic
Conformance
```

因此，后续不再通过增加架构层解决新需求。

---

# 63. V1.0 后续工作顺序

工程实现顺序固定为：

```text
Phase 1
Core Contracts
        ↓
Phase 2
Color Mathematics
        ↓
Phase 3
Metric Registry
        ↓
Phase 4
Rule Engine
        ↓
Phase 5
Browser Measurement
        ↓
Phase 6
Finding / Diagnostic
        ↓
Phase 7
Token / Theme
        ↓
Phase 8
Inspector
        ↓
Phase 9
Conformance
        ↓
Phase 10
Regression / CI
```

其中：

```text
Phase 1–6
```

形成最小完整 UIQ。

```text
Phase 7–10
```

形成工程级 UIQ。

---

# 64. V1.0 最终状态

UIQ 不定义：

> 什么设计一定好看。

UIQ 定义：

> **一个 UI 状态是什么、它可以被测量成什么、这些测量可以派生出什么 Metric、Metric 是否满足明确 Rule、如果不满足发生在哪里以及为什么发生，并且这些结果是否可以被重复验证。**

因此 UIQ 的最终核心不是：

```text
AI → Judge Design
```

而是：

```text
UI
 ↓
Observe
 ↓
Measure
 ↓
Quantify
 ↓
Evaluate
 ↓
Explain
 ↓
Verify
```

这构成 UIQ V1.0 的工程实现基线。