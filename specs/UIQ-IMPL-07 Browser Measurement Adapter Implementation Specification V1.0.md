# UIQ-IMPL-07
# Browser Measurement Adapter Implementation Specification V1.0

**Status:** Frozen  
**Version:** 1.0.0  
**Phase:** Phase 5  
**Previous:** UIQ-IMPL-06 Rule Evaluation Engine Implementation Specification V1.0  
**Next:** UIQ-IMPL-08 Finding & Diagnostic Runtime Implementation Specification V1.0

---

# 1. 文档目的

本规范定义 UIQ Browser Measurement Adapter 的实现。

此前 UIQ 已经完成：

```text
UIQ Core
    ↓
Color Mathematics
    ↓
Metric Runtime
    ↓
Rule Evaluation
```

但这些运行时仍然需要一个现实世界的数据入口。

本阶段建立：

```text
Browser DOM
    ↓
Computed Style
    ↓
DOM Geometry
    ↓
BrowserMeasurementAdapter
    ↓
Measurement[]
    ↓
MeasurementSnapshot
```

最终形成：

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
```

---

# 2. 核心原则

## 2.1 测量真实渲染状态

UIQ 测量对象是：

> 浏览器最终计算并渲染的 UI 状态。

而不是：

```text
设计稿
CSS Source
Design Token Definition
React Props
Vue Props
Component Metadata
```

---

# 3. Source of Truth

浏览器环境下：

```text
getComputedStyle()
getBoundingClientRect()
```

是第一阶段主要数据来源。

因此：

```text
CSS source
     ↓
Browser CSS Cascade
     ↓
Computed Style
     ↓
UIQ Measurement
```

---

# 4. Adapter 边界

Browser Adapter 负责：

```text
DOM → Measurement
```

不负责：

```text
Measurement → Metric
```

也不负责：

```text
Metric → Rule
```

因此：

```text
@uiq/browser
```

不得执行：

```text
@uiq/metrics
@uiq/rules
```

---

# 5. Architecture

```text
┌─────────────────────────────┐
│          Browser            │
│                             │
│ DOM + CSSOM + Layout Engine │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ BrowserMeasurementAdapter   │
├─────────────────────────────┤
│ Style Measurement           │
│ Color Measurement           │
│ Typography Measurement      │
│ Geometry Measurement        │
│ Entity Mapping              │
└──────────────┬──────────────┘
               │
               ▼
       MeasurementSnapshot
               │
               ▼
        Metric Engine
```

---

# 6. Browser Adapter Interface

```ts
export interface BrowserMeasurementAdapter {
  measure(
    element: Element,
    context?: BrowserMeasurementContext
  ): MeasurementSnapshot;
}
```

---

# 7. Browser Measurement Context

```ts
export interface BrowserMeasurementContext {
  snapshotId?: string;

  viewport?: {
    width: number;
    height: number;
  };

  includeStyles?: boolean;

  includeColor?: boolean;

  includeTypography?: boolean;

  includeGeometry?: boolean;
}
```

---

# 8. Measurement Categories

V1.0 Browser Adapter 支持：

```text
COLOR
TYPOGRAPHY
GEOMETRY
SPACING
```

其中：

```text
COLOR
TYPOGRAPHY
GEOMETRY
```

为第一优先级。

---

# 9. Measurement Source

Browser Measurement：

```ts
{
  type: "BROWSER",
  adapter: "@uiq/browser",
  version: "1.0.0"
}
```

必须记录 Adapter Version。

---

# 10. Provenance

每个 Measurement 必须知道：

```text
测量对象
测量类型
来源
Adapter
Adapter Version
Snapshot
```

例如：

```json
{
  "id": "measurement-001",
  "subjectId": "button#submit",
  "type": "GEOMETRY.WIDTH",
  "value": 120,
  "unit": "px",
  "source": {
    "type": "BROWSER",
    "adapter": "@uiq/browser",
    "version": "1.0.0"
  },
  "status": "AVAILABLE"
}
```

---

# 11. DOM Entity Mapping

UIQ Entity：

```text
ELEMENT
```

必须映射到 DOM Element。

优先使用：

```text
data-uiq-id
```

例如：

```html
<button data-uiq-id="submit-button">
  Submit
</button>
```

对应：

```text
UIQ Entity ID
=
submit-button
```

---

# 12. Fallback Entity ID

如果不存在：

```text
data-uiq-id
```

可以生成运行时 ID。

例如：

```text
browser:element:001
```

但此类 ID 不保证跨页面执行稳定。

因此：

> Regression 与 Conformance 应优先使用稳定 `data-uiq-id`。

---

# 13. DOM Identity 不应使用 XPath 作为唯一标准

XPath 可以作为辅助定位信息：

```text
metadata.xpath
```

但不推荐作为：

```text
EntityId
```

因为 DOM 结构变化会导致 XPath 不稳定。

---

# 14. Computed Style

必须使用：

```ts
window.getComputedStyle(element)
```

而不是：

```ts
element.style
```

原因：

`element.style` 只能表示 inline style。

而 UIQ 需要实际 CSS Cascade 后的值。

---

# 15. Color Measurement

读取：

```text
color
background-color
border-color
outline-color
```

第一阶段至少支持：

```text
color
background-color
```

---

# 16. CSS Color Parsing

Browser Adapter 获取：

```text
computedStyle.color
```

例如：

```text
rgb(255, 255, 255)
```

交给：

```text
@uiq/color
```

进行解析。

Browser Adapter 不实现颜色数学。

---

# 17. Color Dependency

架构：

```text
Browser
  ↓
computedStyle.color
  ↓
Browser Adapter
  ↓
Measurement
  ↓
@uiq/color
  ↓
Color Metrics
```

---

# 18. Alpha

Browser Adapter 必须保留 Alpha。

例如：

```text
rgba(255, 255, 255, 0.5)
```

不能转换成：

```text
white
```

然后丢弃：

```text
alpha = 0.5
```

---

# 19. Transparent Background

如果：

```text
background-color: transparent
```

不能简单认为：

```text
background = white
```

必须继续向祖先元素寻找有效背景。

---

# 20. Background Resolution

示例：

```text
button
  background: transparent
        ↓
div
  background: transparent
        ↓
main
  background: #ffffff
```

有效背景：

```text
#ffffff
```

---

# 21. Background Chain

定义：

```ts
export interface BackgroundLayer {
  elementId: string;

  color?: string;

  alpha?: number;

  source: "SELF" | "ANCESTOR";
}
```

Measurement metadata 可以保留：

```text
backgroundChain
```

用于 Diagnostic。

---

# 22. Alpha Compositing

透明颜色必须在：

```text
Linear RGB
```

中进行合成。

不能直接在：

```text
sRGB
```

数值上做简单 Alpha 插值。

计算：

```text
C = αCf + (1-α)Cb
```

其中：

```text
Cf
Cb
```

为 Linear RGB。

---

# 23. Nested Transparency

如果：

```text
Foreground
  α = 0.5

Background A
  α = 0.5

Background B
  α = 1
```

必须逐层进行 Compositing。

不能只使用最底层背景。

---

# 24. Complex Background

V1.0 对以下背景：

```text
linear-gradient()
radial-gradient()
image
video
backdrop-filter
multiple background layers
```

不要求进行精确视觉取样。

结果：

```text
UNKNOWN
```

而不是：

```text
假设为某个纯色
```

---

# 25. 为什么不近似

因为 UIQ 是：

```text
Quantification
```

而不是：

```text
Visual Guessing
```

如果无法获得可靠输入：

```text
UNKNOWN
```

比伪造一个数值更符合 UIQ 的确定性原则。

---

# 26. Typography Measurement

读取：

```text
font-family
font-size
font-weight
line-height
letter-spacing
```

使用：

```text
getComputedStyle()
```

---

# 27. Font Size

例如：

```text
font-size: 16px
```

Measurement：

```json
{
  "type": "TYPOGRAPHY.FONT_SIZE",
  "value": 16,
  "unit": "px"
}
```

---

# 28. Font Weight

例如：

```text
font-weight: 437
```

必须保存：

```text
437
```

不得：

```text
437 → 400
```

---

# 29. Line Height

如果：

```text
line-height: normal
```

Browser 可能无法直接提供精确的字体度量语义。

V1.0 可以：

```text
UNKNOWN
```

或者根据明确的 Browser Measurement Strategy 产生计算值。

但不得伪造精确值。

---

# 30. Unitless Line Height

例如：

```css
line-height: 1.5;
```

Metric 层需要：

```text
ratio = 1.5
```

Browser Adapter 可以同时记录：

```text
computed line-height
font-size
```

从而支持：

```text
ratio = lineHeight / fontSize
```

---

# 31. Letter Spacing

例如：

```text
letter-spacing: 0.02em
```

必须使用 computed value 转换到：

```text
px
```

---

# 32. Font Family

V1.0 记录：

```text
font-family
```

作为 Measurement metadata。

字体实际渲染成功与否属于后续：

```text
Font Availability / Rendering Conformance
```

不在基础 Metric 中假设。

---

# 33. Text Measure

V1.0：

```text
TYPOGRAPHY.TEXT_MEASURE
```

使用实际 Text Layout Box。

例如：

```ts
element.getBoundingClientRect().width
```

但必须明确：

> 该值不是实际 Glyph Width。

---

# 34. Geometry Measurement

使用：

```ts
element.getBoundingClientRect()
```

获取：

```text
x
y
width
height
top
right
bottom
left
```

---

# 35. Geometry Coordinate System

V1.0：

```text
Viewport-relative
```

即：

```text
getBoundingClientRect()
```

的坐标系统。

---

# 36. Geometry Metrics

Browser Adapter 提供：

```text
GEOMETRY.WIDTH
GEOMETRY.HEIGHT
```

并可以提供基础：

```text
x
y
top
right
bottom
left
```

Metric 层再计算：

```text
AREA
ASPECT_RATIO
CENTER_DISTANCE
EDGE_DISTANCE
OVERLAP
```

---

# 37. 不重复计算

Browser Adapter 不应该计算：

```text
AREA
ASPECT_RATIO
CENTER_DISTANCE
```

除非它们本身就是 Browser-specific Measurement。

基础职责：

```text
观察
```

而不是：

```text
派生
```

---

# 38. Visibility

Adapter 应记录：

```text
visibility
display
opacity
```

例如：

```json
{
  "metadata": {
    "display": "block",
    "visibility": "visible",
    "opacity": 1
  }
}
```

但：

```text
visibility
```

是否构成问题由 Rule 决定。

---

# 39. Display None

如果：

```css
display: none;
```

则：

```text
getBoundingClientRect()
```

可能得到：

```text
0 × 0
```

Adapter 必须记录：

```text
display = none
```

避免将：

```text
0 width
```

误认为真实视觉尺寸。

---

# 40. Hidden State

类似：

```text
visibility: hidden
opacity: 0
```

不能自动转换成：

```text
FAIL
```

它们只是：

```text
Measurement
```

---

# 41. Spacing Measurement

V1.0 可以读取：

```text
margin-top
margin-right
margin-bottom
margin-left

padding-top
padding-right
padding-bottom
padding-left

gap
row-gap
column-gap
```

全部标准化为：

```text
px
```

---

# 42. CSS Unit Normalization

例如：

```css
padding: 1rem;
```

Browser computed style：

```text
16px
```

UIQ Measurement：

```text
16px
```

不保留：

```text
1rem
```

作为主要数值。

原始 CSS 可以放入：

```text
metadata.raw
```

---

# 43. Viewport Context

Snapshot 必须记录：

```text
viewport.width
viewport.height
devicePixelRatio
zoom
browser
```

例如：

```json
{
  "viewport": {
    "width": 1440,
    "height": 900
  },
  "devicePixelRatio": 2
}
```

---

# 44. Responsive Measurement

不同 viewport：

```text
1440 × 900
768 × 1024
390 × 844
```

必须产生不同：

```text
MeasurementSnapshot
```

不能把它们合并为一个 Snapshot。

---

# 45. Snapshot Identity

Snapshot：

```ts
MeasurementSnapshot
```

必须具有：

```text
id
capturedAt
source
environment
measurements
```

---

# 46. Snapshot Atomicity

一个 Snapshot 表示：

> 某一时刻、某一环境下的测量状态。

因此一次采集尽量在同一个：

```text
rendered state
```

中完成。

---

# 47. Layout Stability

测量前应确保页面处于稳定状态。

推荐：

```text
wait for DOM ready
wait for fonts where applicable
wait for layout stabilization
```

再执行：

```text
getComputedStyle
getBoundingClientRect
```

---

# 48. Font Loading

如果页面存在：

```text
document.fonts
```

建议等待：

```ts
await document.fonts.ready;
```

避免字体加载前后：

```text
font metrics
layout
```

发生变化。

---

# 49. Animation

动画会导致：

```text
Geometry
Opacity
Transform
```

不断变化。

V1.0 Inspector 默认应支持：

```text
pause / disable animation
```

或者在明确时间点捕获。

---

# 50. Measurement Consistency

同一 Snapshot 内：

```text
color
typography
geometry
spacing
```

应尽可能来自相同浏览器状态。

---

# 51. Transform

`getBoundingClientRect()` 已经包含视觉布局后的：

```text
transform
```

因此 Geometry Measurement 应明确：

```text
visual bounding geometry
```

不是：

```text
CSS layout box
```

两者不可混淆。

---

# 52. Scroll

因为坐标是 viewport-relative：

```text
scroll
```

会影响：

```text
x
y
top
bottom
```

因此 Snapshot 必须记录：

```text
scrollX
scrollY
```

或者至少记录环境上下文。

---

# 53. Measurement Status

Browser Adapter 支持：

```text
AVAILABLE
UNKNOWN
ERROR
```

---

# 54. UNKNOWN 示例

```text
complex background
font metric unavailable
element state unavailable
unsupported CSS feature
```

---

# 55. ERROR 示例

```text
DOM exception
invalid element
adapter runtime exception
serialization failure
```

---

# 56. Measurement Error Isolation

单个属性无法测量：

```text
COLOR
```

不应导致：

```text
GEOMETRY
TYPOGRAPHY
```

全部失败。

例如：

```text
COLOR = UNKNOWN
GEOMETRY = AVAILABLE
TYPOGRAPHY = AVAILABLE
```

是合法结果。

---

# 57. Adapter Package Structure

```text
packages/browser/
├── src/
│   ├── adapter/
│   │   ├── BrowserMeasurementAdapter.ts
│   │   └── BrowserMeasurementAdapterImpl.ts
│   │
│   ├── entity/
│   │   ├── resolveEntityId.ts
│   │   └── domPath.ts
│   │
│   ├── color/
│   │   ├── measureColor.ts
│   │   └── resolveBackground.ts
│   │
│   ├── typography/
│   │   ├── measureTypography.ts
│   │   └── normalizeTypography.ts
│   │
│   ├── geometry/
│   │   ├── measureGeometry.ts
│   │   └── measureRect.ts
│   │
│   ├── spacing/
│   │   └── measureSpacing.ts
│   │
│   ├── environment/
│   │   ├── measureViewport.ts
│   │   └── measureBrowser.ts
│   │
│   └── index.ts
│
└── tests/
    ├── color/
    ├── typography/
    ├── geometry/
    ├── spacing/
    ├── entity/
    ├── environment/
    └── integration/
```

---

# 58. Adapter Dependencies

允许：

```text
@uiq/browser
      ↓
@uiq/core
@uiq/measurement
@uiq/color
@uiq/theme
```

其中：

```text
@uiq/color
```

仅用于解析/颜色相关 Measurement。

不得：

```text
browser → rules
browser → diagnostic
```

---

# 59. Measurement Factory

推荐统一：

```ts
function createMeasurement<T>(
  subjectId: string,
  type: string,
  value: T,
  unit?: string
): Measurement<T>
```

保证：

```text
source
status
timestamp
```

结构一致。

---

# 60. Browser Measurement Example

HTML：

```html
<button
  data-uiq-id="submit-button"
  class="primary-button">
  Submit
</button>
```

CSS：

```css
.primary-button {
  color: #ffffff;
  background: #2563eb;
  font-size: 16px;
  line-height: 24px;
  padding: 8px 16px;
}
```

得到：

```text
COLOR
foreground = #ffffff
background = #2563eb

TYPOGRAPHY
font-size = 16px
line-height = 24px

SPACING
padding-top = 8px
padding-right = 16px
padding-bottom = 8px
padding-left = 16px

GEOMETRY
width = ...
height = ...
```

---

# 61. 完整 Runtime

现在：

```text
Browser DOM
    ↓
BrowserMeasurementAdapter
    ↓
MeasurementSnapshot
    ↓
MetricExecutionEngine
    ↓
MetricResult
    ↓
RuleEvaluationEngine
    ↓
EvaluationResult
```

已经形成真正端到端执行链。

---

# 62. 第一条 E2E 链

```text
<button>
   ↓
getComputedStyle()
   ↓
color/background
   ↓
COLOR.CONTRAST
   ↓
WCAG Contrast Rule
   ↓
PASS / FAIL
```

---

# 63. Browser E2E Example

```text
Foreground:
#FFFFFF

Background:
#2563EB
```

↓

```text
COLOR.CONTRAST
≈ 5.17
```

↓

```text
ACCESSIBILITY.CONTRAST.WCAG_AA
threshold = 4.5
```

↓

```text
PASS
```

---

# 64. Failure Example

```text
Foreground:
#777777

Background:
#FFFFFF
```

↓

```text
COLOR.CONTRAST
≈ 4.48
```

↓

```text
Rule:
>= 4.5
```

↓

```text
FAIL
```

---

# 65. UNKNOWN Example

```text
background:
linear-gradient(...)
```

如果 V1.0 无法可靠计算有效背景：

```text
Measurement
    ↓
UNKNOWN
```

↓

```text
Metric
    ↓
UNKNOWN
```

↓

```text
Rule
    ↓
UNKNOWN
```

完整保持信息不足语义。

---

# 66. Browser Test Environment

推荐：

```text
Playwright
```

覆盖：

```text
Chromium
Firefox
WebKit
```

---

# 67. Calculation Conformance 与 Browser Conformance

必须区分：

```text
Calculation Conformance
```

和：

```text
Browser Measurement Conformance
```

前者验证：

```text
Color / Geometry / Metric mathematics
```

后者验证：

```text
Browser API → Measurement
```

---

# 68. Browser Golden Tests

至少包含：

```text
BROWSER-GOLDEN-001
BROWSER-GOLDEN-002
BROWSER-GOLDEN-003
```

测试：

- computed color
- transparent background
- geometry
- typography
- spacing
- viewport
- hidden element
- alpha
- unsupported background

---

# 69. Cross Browser Tolerance

不同浏览器可能存在细微差异。

因此：

```text
Browser Measurement
```

可以存在：

```text
Browser-specific tolerance
```

但：

```text
Tolerance
```

必须显式配置。

不能在代码中偷偷放宽。

---

# 70. Browser Adapter 不改变 Metric 语义

例如：

```text
Chromium
Firefox
WebKit
```

都产生：

```text
GEOMETRY.WIDTH
```

Metric 语义不因为 Browser 改变。

差异只体现在：

```text
Measurement
```

层。

---

# 71. Test Matrix

建议：

| Browser | Viewport | DPR |
|---|---:|---:|
| Chromium | 1440×900 | 1 |
| Chromium | 390×844 | 2 |
| Firefox | 1440×900 | 1 |
| WebKit | 1440×900 | 1 |

---

# 72. Acceptance Criteria

## AC-BROWSER-01

Adapter 可以从 DOM 创建 MeasurementSnapshot。

## AC-BROWSER-02

Color 使用 computed style。

## AC-BROWSER-03

Alpha 不被静默丢弃。

## AC-BROWSER-04

Transparent background 支持祖先解析。

## AC-BROWSER-05

复杂背景无法可靠计算时返回 UNKNOWN。

## AC-BROWSER-06

Typography 使用 computed values。

## AC-BROWSER-07

Variable Font Weight 不被四舍五入。

## AC-BROWSER-08

Geometry 使用 getBoundingClientRect。

## AC-BROWSER-09

CSS 长度统一为 computed px。

## AC-BROWSER-10

Viewport / DPR 等环境信息进入 Snapshot。

## AC-BROWSER-11

单个 Measurement 错误不影响其他 Measurement。

## AC-BROWSER-12

Browser Adapter 不执行 Metric / Rule。

---

# 73. Phase 5 完成状态

当前 UIQ 已经形成：

```text
              REAL UI
                 │
                 ▼
        Browser Measurement
                 │
                 ▼
      MeasurementSnapshot
                 │
                 ▼
          Metric Runtime
                 │
                 ▼
           MetricResult
                 │
                 ▼
           Rule Runtime
                 │
                 ▼
        EvaluationResult
```

因此 UIQ 已经不再只是：

```text
数学模型
```

而已经具备：

> **从浏览器真实 UI 到可验证量化结果的端到端执行基础。**

---

# 74. 下一阶段

下一阶段进入：

```text
UIQ-IMPL-08
Finding & Diagnostic Runtime Implementation Specification V1.0
```

核心链路：

```text
EvaluationResult
       ↓
Finding
       ↓
Evidence Graph
       ↓
Diagnostic
       ↓
Root Cause
       ↓
Impact Trace
```

届时 UIQ 将从：

```text
“这个规则是否通过？”
```

进一步进入：

```text
“哪里有问题？”
“问题来自什么？”
“证据是什么？”
“影响范围是什么？”
```

同时仍然严格保持：

```text
Metric ≠ Rule
Rule ≠ Finding
Finding ≠ Diagnostic
Diagnostic ≠ Recommendation
```

不新增新的核心架构层。