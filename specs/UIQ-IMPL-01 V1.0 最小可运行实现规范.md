# UIQ-IMPL-01
# UIQ V1.0 最小可运行实现规范

**Specification ID:** UIQ-IMPL-01  
**Version:** 1.0.0  
**Status:** Implementation Baseline  
**Parent:** UIQ-REF-02  
**Project:** UIQ — UI Design Quantification

---

# 1. 目标

本规范定义 UIQ 第一个真实可运行 Vertical Slice。

目标不是实现全部 UIQ，而是证明以下闭环可以在真实浏览器中运行：

```text
HTML
 ↓
DOM Element
 ↓
Browser Measurement
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
Inspector
```

第一个实现对象固定为：

```text
Button
```

第一个核心 Metric 固定为：

```text
COLOR.CONTRAST
```

第一个 Rule 固定为：

```text
ACCESSIBILITY.CONTRAST.WCAG_AA
```

---

# 2. 实现范围

V1.0 Vertical Slice：

```text
┌─────────────────────────────────────┐
│             HTML Button             │
└──────────────────┬──────────────────┘
                   ↓
             DOM Adapter
                   ↓
             Measurement
                   ↓
          COLOR.CONTRAST
                   ↓
     WCAG Contrast Rule
                   ↓
             Evaluation
                   ↓
              Finding
                   ↓
             Inspector
```

---

# 3. 不实现内容

本阶段明确不实现：

```text
Typography 完整评价
Layout 完整评价
Spacing 完整评价
Theme Governance
Design Recommendation
AI Aesthetic Score
自动设计生成
用户行为预测
后端服务
数据库
多用户治理
```

这些属于后续扩展，不得为了它们改变当前核心 API。

---

# 4. 工程目录

最终最小工程：

```text
uiq/
├── apps/
│   ├── inspector/
│   └── playground/
│
├── packages/
│   ├── core/
│   ├── color/
│   ├── measurement/
│   ├── metrics/
│   ├── rules/
│   ├── diagnostic/
│   └── browser/
│
├── tests/
│   └── golden/
│
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── vitest.config.ts
```

本阶段暂不要求：

```text
geometry
tokens
theme
conformance
```

完整实现。

---

# 5. Package Dependency

最小闭环：

```text
core
 ↑
 ├── color
 │
 ├── measurement
 │
 ├── metrics
 │
 ├── rules
 │
 ├── diagnostic
 │
 └── browser
```

更准确的运行关系：

```text
browser
   ↓
measurement
   ↓
metrics
   ↓
rules
   ↓
diagnostic
```

所有公共类型最终来自：

```text
@uiq/core
```

---

# 6. Core

目录：

```text
packages/core/src/

├── entity.ts
├── measurement.ts
├── metric.ts
├── rule.ts
├── evaluation.ts
├── finding.ts
├── diagnostic.ts
└── index.ts
```

---

# 7. Subject

UIQ 中所有评价对象必须具有稳定 Subject ID。

```ts
export interface UIQSubject {
  id: string;
  type: string;
}
```

Button：

```json
{
  "id": "button.submit",
  "type": "BUTTON"
}
```

---

# 8. Measurement

```ts
export interface Measurement<T = unknown> {
  id: string;
  subjectId: string;

  name: string;

  value: T;

  unit?: string;

  source: MeasurementSource;

  timestamp: string;
}
```

---

# 9. Color Measurement

Browser Adapter 对 Button 提取：

```text
foreground
background
```

得到：

```json
{
  "name": "foreground",
  "value": "#ffffff"
}
```

以及：

```json
{
  "name": "background",
  "value": "#2563eb"
}
```

---

# 10. MeasurementContext

```ts
export interface MeasurementContext {
  subjectId: string;

  measurements: Measurement[];

  get<T>(
    name: string
  ): Measurement<T> | undefined;
}
```

---

# 11. Color API

`@uiq/color` 提供：

```text
parseRGB()
parseHex()
sRGBToXYZ()
XYZToOKLab()
OKLabToOKLCH()
relativeLuminance()
contrastRatio()
```

---

# 12. Color Representation

内部统一：

```ts
export interface RGB {
  r: number;
  g: number;
  b: number;
}
```

约束：

```text
0 ≤ r ≤ 1
0 ≤ g ≤ 1
0 ≤ b ≤ 1
```

HEX 只是输入/输出编码。

---

# 13. sRGB → Linear RGB

计算前必须进行 sRGB transfer function 逆变换。

定义：

```text
if C ≤ 0.04045

Clinear = C / 12.92

otherwise

Clinear =
((C + 0.055) / 1.055) ^ 2.4
```

不得直接对 Gamma 编码后的 RGB 通道进行亮度计算。

---

# 14. Relative Luminance

使用：

```text
Y =
0.2126 R
+
0.7152 G
+
0.0722 B
```

其中：

```text
R G B
```

必须为 Linear RGB。

---

# 15. Contrast Ratio

设：

```text
L1 = max(Lforeground, Lbackground)
L2 = min(Lforeground, Lbackground)
```

则：

```text
Contrast =
(L1 + 0.05)
----------------
(L2 + 0.05)
```

范围：

```text
1 : 1
~
21 : 1
```

---

# 16. Contrast Metric

Metric：

```text
COLOR.CONTRAST
```

版本：

```text
1.0.0
```

类型：

```text
DERIVED
```

依赖：

```text
foreground
background
```

---

# 17. Metric 输入

```ts
export interface ContrastInput {
  foreground: string;
  background: string;
}
```

---

# 18. Metric 输出

```ts
export interface ContrastResult {
  ratio: number;

  foreground: string;
  background: string;
}
```

示例：

```json
{
  "ratio": 5.17,
  "foreground": "#ffffff",
  "background": "#2563eb"
}
```

---

# 19. Metric Definition

```ts
export const contrastMetric: MetricDefinition<
  ContrastResult
> = {
  id: "COLOR.CONTRAST",
  version: "1.0.0",
  name: "Color Contrast",
  domain: "COLOR",
  kind: "DERIVED",

  dependencies: [
    "foreground",
    "background"
  ],

  calculate(context) {
    // resolve measurements
    // calculate contrast
    // return MetricResult
  }
};
```

---

# 20. 数值规范

Metric 输出建议：

```text
内部计算：
IEEE 754 double

结果展示：
最多 2~4 位小数

Golden Test：
使用 tolerance
```

禁止：

```ts
ratio === 4.5
```

作为浮点测试方式。

---

# 21. WCAG Rule

Rule ID：

```text
ACCESSIBILITY.CONTRAST.WCAG_AA
```

版本：

```text
1.0.0
```

Metric：

```text
COLOR.CONTRAST@1.0.0
```

---

# 22. Rule Configuration

默认：

```json
{
  "minimumRatio": 4.5
}
```

因此：

```text
ratio >= 4.5
```

得到：

```text
PASS
```

否则：

```text
FAIL
```

---

# 23. Rule Evaluation

```ts
export interface ContrastRuleConfig {
  minimumRatio: number;
}
```

执行：

```ts
function evaluateContrast(
  ratio: number,
  config: ContrastRuleConfig
): EvaluationResult {
  if (ratio >= config.minimumRatio) {
    return {
      state: "PASS",
      ...
    };
  }

  return {
    state: "FAIL",
    ...
  };
}
```

---

# 24. Rule 不负责计算 Contrast

严格禁止：

```text
Rule
 ├── RGB parsing
 ├── color conversion
 ├── luminance calculation
 └── contrast calculation
```

Rule 只消费：

```text
MetricResult
```

正确：

```text
Color
 ↓
Metric
 ↓
5.17
 ↓
Rule
 ↓
PASS
```

---

# 25. Evaluation Result

PASS：

```json
{
  "ruleId": "ACCESSIBILITY.CONTRAST.WCAG_AA",
  "ruleVersion": "1.0.0",
  "subjectId": "button.submit",
  "state": "PASS",
  "actual": 5.17,
  "expected": 4.5,
  "message": "Contrast ratio satisfies the configured threshold."
}
```

FAIL：

```json
{
  "ruleId": "ACCESSIBILITY.CONTRAST.WCAG_AA",
  "ruleVersion": "1.0.0",
  "subjectId": "button.submit",
  "state": "FAIL",
  "actual": 3.2,
  "expected": 4.5,
  "message": "Contrast ratio does not satisfy the configured threshold."
}
```

---

# 26. Finding

只有产生需要关注的 Evaluation 时才生成 Finding。

因此：

```text
PASS
 ↓
通常不生成 Finding
```

而：

```text
FAIL
 ↓
Finding
```

例如：

```json
{
  "id": "F-000001",
  "subjectId": "button.submit",
  "ruleId": "ACCESSIBILITY.CONTRAST.WCAG_AA",
  "ruleVersion": "1.0.0",
  "state": "FAIL",
  "severity": "HIGH"
}
```

---

# 27. PASS 与 Finding

UIQ 报告仍然必须保存：

```text
Evaluation = PASS
```

但 Finding 集合可以只包含：

```text
FAIL
WARN
ERROR
```

这样：

```text
Evaluation
```

表示完整评价结果，而：

```text
Finding
```

表示需要关注的结果。

---

# 28. Finding Evidence

Contrast Finding 必须能够回溯：

```text
Finding
 ↓
Rule
 ↓
Metric
 ↓
foreground
background
 ↓
DOM Element
```

Evidence：

```json
{
  "type": "METRIC",
  "id": "COLOR.CONTRAST",
  "value": 3.2
}
```

---

# 29. Browser Adapter

Browser Adapter：

```ts
export interface BrowserMeasurementAdapter {
  measure(
    element: Element
  ): Measurement[];
}
```

第一阶段读取：

```text
color
background-color
```

---

# 30. Computed Style

必须使用：

```ts
window.getComputedStyle(element)
```

而不是只读取：

```ts
element.style
```

原因：

```text
element.style
```

只能看到 inline style。

而 UIQ 要评价：

```text
实际生效样式
```

---

# 31. Background Resolution

实际背景可能来自：

```text
Element
 ↓
background-color
```

也可能：

```text
background-color: transparent
```

因此第一阶段必须至少支持：

```text
当前元素背景
祖先背景回溯
```

直到得到有效背景色。

---

# 32. Alpha

如果颜色存在：

```text
rgba(...)
```

必须处理 alpha。

例如：

```text
foreground alpha
background alpha
```

不得简单丢弃 Alpha 通道。

第一阶段允许：

```text
alpha compositing
```

只支持：

```text
solid background
```

复杂：

```text
gradient
image
backdrop-filter
```

暂不纳入第一阶段。

---

# 33. Transparent Background

例如：

```css
button {
  background: transparent;
}
```

则：

```text
button
 ↓
parent
 ↓
grandparent
 ↓
effective background
```

必须继续解析。

---

# 34. Unsupported State

如果最终无法确定有效背景：

```text
Evaluation =
UNKNOWN
```

而不是：

```text
PASS
```

也不是：

```text
FAIL
```

例如：

```json
{
  "state": "UNKNOWN",
  "message": "Effective background color could not be determined."
}
```

---

# 35. Gradient

第一阶段：

```text
gradient → UNKNOWN
```

不得随意取：

```text
gradient.start
```

或者：

```text
gradient.end
```

作为整个元素的背景。

后续可以增加：

```text
COLOR.CONTRAST.SPATIAL
```

但必须作为新的 Metric/Rule 扩展。

---

# 36. 第一条真实 HTML

测试页面：

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

UIQ：

```text
subjectId = button.submit
```

---

# 37. Browser Measurement

读取：

```text
color
background-color
```

得到：

```json
{
  "subjectId": "button.submit",
  "measurements": [
    {
      "name": "foreground",
      "value": "#ffffff"
    },
    {
      "name": "background",
      "value": "#2563eb"
    }
  ]
}
```

---

# 38. Metric Execution

```text
Measurement
    ↓
COLOR.CONTRAST@1.0.0
```

得到：

```text
Contrast ≈ 5.17
```

---

# 39. Rule Execution

```text
5.17
 ↓
minimum = 4.5
 ↓
PASS
```

Evaluation：

```text
PASS
```

Finding：

```text
none
```

---

# 40. Failure Case

测试：

```css
#submit {
  color: #777777;
  background-color: #ffffff;
}
```

得到：

```text
Contrast ≈ 4.48
```

于是：

```text
4.48 < 4.5
```

Evaluation：

```text
FAIL
```

Finding：

```text
F-xxxxxx
```

---

# 41. Diagnostic

第一阶段 Diagnostic 只做解释，不做自动设计生成。

例如：

```json
{
  "category": "ACCESSIBILITY",
  "explanation":
    "The foreground/background contrast ratio is below the configured threshold."
}
```

---

# 42. 不自动给出颜色替换

第一阶段不允许 Diagnostic 直接说：

```text
Change #777777 to #666666
```

因为这已经从：

```text
Evaluation
```

进入：

```text
Design Recommendation
```

应留给后续 Recommendation 系统。

---

# 43. Evaluation Report

最终：

```ts
export interface EvaluationReport {
  subjectId: string;

  measurements: Measurement[];

  metrics: MetricResult[];

  evaluations: EvaluationResult[];

  findings: Finding[];

  diagnostics: Diagnostic[];
}
```

---

# 44. 完整运行

伪代码：

```ts
const measurements =
  browserAdapter.measure(button);

const context =
  createMeasurementContext(
    "button.submit",
    measurements
  );

const metric =
  metricEngine.calculate(
    "COLOR.CONTRAST",
    "button.submit",
    context
  );

const evaluation =
  ruleEngine.evaluate(
    "ACCESSIBILITY.CONTRAST.WCAG_AA",
    "button.submit",
    {
      metrics: [metric]
    }
  );

const finding =
  findingFactory.from(evaluation);
```

最终：

```text
EvaluationReport
```

---

# 45. Inspector

Inspector 第一阶段只需要四个区域：

```text
┌──────────────────────────────┐
│ Selected Element             │
├──────────────────────────────┤
│ Measurements                 │
├──────────────────────────────┤
│ Metrics                      │
├──────────────────────────────┤
│ Evaluation / Findings        │
└──────────────────────────────┘
```

---

# 46. Inspector 数据

例如：

```text
BUTTON
button.submit

Measurements
────────────
Foreground   #ffffff
Background   #2563eb

Metrics
────────────
Contrast     5.17

Rules
────────────
WCAG AA      PASS
```

---

# 47. Failure UI

```text
BUTTON
button.submit

Measurements
────────────
Foreground   #777777
Background   #ffffff

Metrics
────────────
Contrast     4.48

Rules
────────────
WCAG AA      FAIL

Finding
────────────
Contrast below threshold
```

---

# 48. Inspector 的职责边界

Inspector：

```text
展示
定位
追踪
解释
```

不负责：

```text
Metric Calculation
Rule Calculation
Color Calculation
```

所有计算来自 Package API。

---

# 49. Golden Test

至少建立：

```text
tests/golden/
├── contrast-white-blue.json
├── contrast-white-black.json
├── contrast-gray-white.json
└── contrast-invalid.json
```

---

# 50. Golden Case 01

```json
{
  "name": "white-blue",
  "foreground": "#ffffff",
  "background": "#2563eb",
  "expectedRatio": 5.17,
  "tolerance": 0.01
}
```

---

# 51. Golden Case 02

```json
{
  "name": "white-black",
  "foreground": "#ffffff",
  "background": "#000000",
  "expectedRatio": 21,
  "tolerance": 0.0001
}
```

---

# 52. Golden Case 03

```json
{
  "name": "gray-white",
  "foreground": "#777777",
  "background": "#ffffff",
  "expectedRatio": 4.48,
  "tolerance": 0.01
}
```

---

# 53. Invalid Input

例如：

```text
#xyzxyz
```

必须：

```text
INVALID_INPUT
```

不能：

```text
ratio = 0
```

否则会把：

```text
Calculation Error
```

错误地变成：

```text
Design Failure
```

---

# 54. Test Pyramid

```text
             Browser
              Tests
                ▲
                │
          Integration
             Tests
                ▲
                │
          Golden Tests
                ▲
                │
            Unit Tests
```

核心色彩算法：

```text
大量 Unit + Golden
```

浏览器：

```text
少量 Integration + Browser
```

---

# 55. Conformance Baseline

本阶段必须建立：

```text
UIQ-IMPL-01-CONFORMANCE
```

最低检查：

```text
Metric ID
Metric Version
Rule ID
Rule Version
Evaluation State
Finding Trace
```

---

# 56. API Freeze

本阶段冻结：

```text
Measurement
MetricDefinition
MetricResult
RuleDefinition
EvaluationResult
Finding
Diagnostic
EvaluationReport
```

后续实现不得随意修改字段语义。

如果需要扩展：

```text
新增 optional field
```

优先于：

```text
修改已有 field meaning
```

---

# 57. 第一阶段完成标准

必须能够运行：

```text
pnpm test
```

并通过：

```text
Color Unit Tests
Contrast Golden Tests
Rule Tests
Finding Tests
```

同时：

```text
pnpm test:e2e
```

能够验证：

```text
Real Browser
 ↓
Button
 ↓
Measurement
 ↓
Contrast
 ↓
Rule
 ↓
PASS/FAIL
```

---

# 58. 第一阶段真正验证的事情

这一步并不是为了证明：

> UIQ 已经完成。

而是验证：

> UIQ 的核心抽象是否能够承载真实 UI。

如果这条链能够稳定运行：

```text
DOM
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
```

则后续：

```text
Typography
Geometry
Spacing
Layout
Color Difference
Token Conformance
Theme Conformance
```

都可以采用同一模型。

---

# 59. 架构收敛检查

本阶段不得增加：

```text
Evaluation Layer 2
Metric Meta Engine
Universal Design Engine
AI Design Engine
Aesthetic Engine
Semantic Kernel
Decision Kernel
```

当前模型已经足够：

```text
Measurement
Metric
Rule
Evaluation
Finding
Diagnostic
```

---

# 60. 下一阶段

第一条 Vertical Slice 完成后，进入：

# UIQ-METRIC-01
## Core Metric Implementation Specification V1.0

扩展三个维度：

```text
COLOR
TYPOGRAPHY
GEOMETRY
```

形成：

```text
             UI
              │
      ┌───────┼────────┐
      ↓       ↓        ↓
    Color Typography Geometry
      │       │        │
      └───────┼────────┘
              ↓
            Metric
              ↓
             Rule
              ↓
          Evaluation
```

此后才进入：

```text
Spacing
Layout
Hierarchy
Accessibility
Token
Theme
```

并继续保持同一核心模型，不再增加新的核心抽象层。