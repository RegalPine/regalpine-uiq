# UIQ-METRIC-01
# Core Metric Implementation Specification
## 核心度量实现规范 V1.0

**Specification ID:** UIQ-METRIC-01  
**Version:** 1.0.0  
**Status:** Implementation Baseline  
**Parent:** UIQ-IMPL-01  
**Project:** UIQ — UI Design Quantification

---

# 1. 目的

本规范正式冻结 UIQ 第一批核心 Metric 的：

- 输入
- 输出
- 单位
- 数值范围
- 计算方法
- 精度
- 异常处理
- 依赖关系
- 测试要求
- Version

第一批实现：

```text
COLOR
TYPOGRAPHY
GEOMETRY
```

---

# 2. 核心原则

UIQ Metric 只回答：

> “这个 UI 对象具有什么可量化属性？”

Metric 不回答：

> “这个设计好不好？”

因此：

```text
Metric
    =
Quantification
```

而：

```text
Rule
    =
Evaluation
```

---

# 3. Metric 分类

```text
BASE
DERIVED
COMPOSITE
```

本规范中的 Metric：

| Domain | Metric | Type |
|---|---|---|
| COLOR | COLOR.SRGB | BASE |
| COLOR | COLOR.OKLAB | DERIVED |
| COLOR | COLOR.OKLCH | DERIVED |
| COLOR | COLOR.LIGHTNESS | DERIVED |
| COLOR | COLOR.CHROMA | DERIVED |
| COLOR | COLOR.HUE | DERIVED |
| COLOR | COLOR.CONTRAST | DERIVED |
| TYPOGRAPHY | TYPOGRAPHY.FONT_SIZE | BASE |
| TYPOGRAPHY | TYPOGRAPHY.FONT_WEIGHT | BASE |
| TYPOGRAPHY | TYPOGRAPHY.LINE_HEIGHT | BASE |
| TYPOGRAPHY | TYPOGRAPHY.LETTER_SPACING | BASE |
| TYPOGRAPHY | TYPOGRAPHY.TEXT_MEASURE | DERIVED |
| TYPOGRAPHY | TYPOGRAPHY.SCALE_RATIO | DERIVED |
| TYPOGRAPHY | TYPOGRAPHY.DENSITY | DERIVED |
| GEOMETRY | GEOMETRY.WIDTH | BASE |
| GEOMETRY | GEOMETRY.HEIGHT | BASE |
| GEOMETRY | GEOMETRY.AREA | DERIVED |
| GEOMETRY | GEOMETRY.ASPECT_RATIO | DERIVED |
| GEOMETRY | GEOMETRY.CENTER_DISTANCE | DERIVED |
| GEOMETRY | GEOMETRY.EDGE_DISTANCE | DERIVED |
| GEOMETRY | GEOMETRY.OVERLAP | DERIVED |

---

# 4. 数值规范

UIQ 内部计算：

```text
IEEE 754 Double
```

长度：

```text
CSS px
```

角度：

```text
degree
```

颜色：

```text
sRGB
XYZ
OKLab
OKLCH
```

比例：

```text
dimensionless
```

---

# 5. 精度原则

UIQ 区分：

```text
Calculation Precision
Storage Precision
Display Precision
Comparison Tolerance
```

不能混为一谈。

例如：

```text
内部：
5.172423...

存储：
5.172423

显示：
5.17

比较：
±0.01
```

---

# 6. COLOR.SRGB

## 6.1 Definition

表示 UI 元素实际使用的 sRGB 颜色。

```text
COLOR.SRGB@1.0.0
```

---

## 6.2 Input

```ts
interface RGB {
  r: number;
  g: number;
  b: number;
}
```

内部范围：

```text
0 ≤ r,g,b ≤ 1
```

---

## 6.3 Alpha

颜色可以附带：

```ts
interface RGBA extends RGB {
  alpha: number;
}
```

范围：

```text
0 ≤ alpha ≤ 1
```

---

# 7. HEX Parser

支持：

```text
#RGB
#RGBA
#RRGGBB
#RRGGBBAA
```

例如：

```text
#fff
#ffffff
#ffffff80
```

转换到：

```text
normalized sRGB
```

---

# 8. COLOR.OKLAB

定义：

```text
COLOR.OKLAB@1.0.0
```

输出：

```ts
interface OKLab {
  l: number;
  a: number;
  b: number;
}
```

其中：

```text
L
```

表示感知亮度维度。

```text
a
b
```

表示 opponent color dimensions。

---

# 9. OKLab 计算

处理流程：

```text
sRGB
 ↓
Linear RGB
 ↓
LMS-like transform
 ↓
cube root
 ↓
OKLab
```

实现必须遵循固定的转换矩阵和非线性变换定义。

所有转换常数必须集中在：

```text
@uiq/color/constants
```

不得散落在 Metric 实现中。

---

# 10. COLOR.OKLCH

定义：

```text
COLOR.OKLCH@1.0.0
```

输出：

```ts
interface OKLCH {
  l: number;
  c: number;
  h: number | "UNDEFINED";
}
```

转换：

```text
L = L
C = sqrt(a²+b²)
H = atan2(b,a)
```

---

# 11. Hue Undefined

当：

```text
C ≈ 0
```

则：

```text
H = UNDEFINED
```

不得：

```text
H = 0°
```

因为：

```text
0°
```

会错误地暗示：

> 该颜色具有明确的红色方向。

---

# 12. COLOR.LIGHTNESS

定义：

```text
COLOR.LIGHTNESS@1.0.0
```

V1.0 默认采用：

```text
OKLab L
```

作为 UIQ 的感知亮度度量。

输出：

```text
dimensionless
```

通常：

```text
0 ≤ L ≤ 1
```

---

# 13. COLOR.CHROMA

定义：

```text
COLOR.CHROMA@1.0.0
```

采用：

```text
C = sqrt(a²+b²)
```

即：

```text
OKLCH.C
```

---

# 14. COLOR.HUE

定义：

```text
COLOR.HUE@1.0.0
```

范围：

```text
0° ≤ H < 360°
```

低 Chroma：

```text
H = UNDEFINED
```

---

# 15. COLOR.CONTRAST

定义：

```text
COLOR.CONTRAST@1.0.0
```

输入：

```text
foreground
background
```

输出：

```ts
interface ContrastResult {
  ratio: number;
}
```

计算：

```text
Contrast =
(L1 + 0.05)
/
(L2 + 0.05)
```

其中：

```text
L1 = max(relative luminance)
L2 = min(relative luminance)
```

---

# 16. Contrast ≠ Color Difference

UIQ 明确区分：

```text
Contrast
```

与：

```text
Color Difference
```

Contrast 衡量：

```text
foreground/background
```

之间的明暗可分辨关系。

Color Difference 衡量：

```text
Color A
Color B
```

之间的颜色距离。

二者不能互换。

---

# 17. COLOR.DELTA_E

本阶段只定义接口，不要求成为 MVP 强制 Metric。

```text
COLOR.DELTA_E@1.0.0
```

必须显式指定：

```text
method
version
```

例如未来：

```text
CIE76
CIEDE2000
```

不得出现：

```text
DELTA_E = OKLCH Euclidean Distance
```

这种未定义算法。

---

# 18. Gamut

Color Metric 可以附带：

```text
gamutStatus
```

例如：

```text
IN_GAMUT
OUT_OF_GAMUT
```

但：

```text
Gamut
```

不是：

```text
Color Quality
```

---

# 19. TYPOGRAPHY.FONT_SIZE

定义：

```text
TYPOGRAPHY.FONT_SIZE@1.0.0
```

来源：

```text
CSS computed font-size
```

单位：

```text
px
```

输出：

```ts
interface FontSizeResult {
  value: number;
  unit: "px";
}
```

---

# 20. FONT_WEIGHT

定义：

```text
TYPOGRAPHY.FONT_WEIGHT@1.0.0
```

标准化为：

```text
100
200
300
400
500
600
700
800
900
```

如果 CSS 使用：

```text
normal
bold
```

必须先转换到数值语义。

---

# 21. Variable Font

如果浏览器返回：

```text
font-weight: 437
```

UIQ 不得强制映射为：

```text
400
```

必须保留：

```text
437
```

因为它是实际计算值。

---

# 22. LINE_HEIGHT

定义：

```text
TYPOGRAPHY.LINE_HEIGHT@1.0.0
```

必须区分：

```text
specified line-height
computed line-height
```

UIQ Measurement 默认采用：

```text
computed value
```

---

# 23. Unitless Line Height

例如：

```css
line-height: 1.5;
```

实际计算值取决于：

```text
font-size
```

因此最终 Metric 应记录：

```text
lineHeightPx
```

同时可以保留：

```text
lineHeightRatio
```

---

# 24. LETTER_SPACING

定义：

```text
TYPOGRAPHY.LETTER_SPACING@1.0.0
```

单位：

```text
px
```

例如：

```text
0px
0.02em
-0.01em
```

必须在 computed style 层转换为：

```text
px
```

---

# 25. TEXT_MEASURE

定义：

```text
TYPOGRAPHY.TEXT_MEASURE@1.0.0
```

表示文本行的有效长度。

输入：

```text
text box geometry
```

输出：

```text
width
```

单位：

```text
px
```

---

# 26. Text Measure 边界

UIQ 不把：

```text
text container width
```

简单等同于：

```text
actual glyph width
```

第一阶段：

```text
TEXT_MEASURE
=
text layout box width
```

未来如果支持字体 shaping/glyph measurement：

```text
TEXT_GLYPH_MEASURE
```

作为扩展 Metric。

---

# 27. TYPOGRAPHY.SCALE_RATIO

定义：

```text
TYPOGRAPHY.SCALE_RATIO@1.0.0
```

两个文本对象：

```text
A
B
```

计算：

```text
ratio =
fontSize(A)
/
fontSize(B)
```

例如：

```text
32 / 16 = 2
```

---

# 28. Scale Ratio 不代表正确性

例如：

```text
2.0
```

只是：

```text
Observed Ratio
```

是否符合设计系统：

```text
Rule
```

决定。

---

# 29. TYPOGRAPHY.DENSITY

V1.0 定义为：

```text
text-related quantity
/
available layout area
```

具体实现必须明确分母。

推荐：

```text
characterCount
/
containerArea
```

但该 Metric 在 V1.0 标记：

```text
EXPERIMENTAL
```

因为：

```text
字符数量
字体
语言
脚本
字形宽度
```

都会影响结果。

---

# 30. GEOMETRY.WIDTH

```text
GEOMETRY.WIDTH@1.0.0
```

来源：

```text
getBoundingClientRect().width
```

单位：

```text
px
```

---

# 31. GEOMETRY.HEIGHT

```text
GEOMETRY.HEIGHT@1.0.0
```

来源：

```text
getBoundingClientRect().height
```

单位：

```text
px
```

---

# 32. GEOMETRY.AREA

定义：

```text
GEOMETRY.AREA@1.0.0
```

计算：

```text
width × height
```

单位：

```text
px²
```

---

# 33. GEOMETRY.ASPECT_RATIO

定义：

```text
GEOMETRY.ASPECT_RATIO@1.0.0
```

计算：

```text
width / height
```

要求：

```text
height > 0
```

否则：

```text
UNKNOWN
```

而不是：

```text
Infinity
```

---

# 34. GEOMETRY.CENTER_DISTANCE

定义：

```text
GEOMETRY.CENTER_DISTANCE@1.0.0
```

两个矩形：

```text
A
B
```

中心：

```text
Cx = x + width / 2
Cy = y + height / 2
```

距离：

```text
D =
sqrt(
  (CxA - CxB)²
  +
  (CyA - CyB)²
)
```

单位：

```text
px
```

---

# 35. GEOMETRY.EDGE_DISTANCE

定义：

```text
GEOMETRY.EDGE_DISTANCE@1.0.0
```

用于表示两个对象边缘之间的距离。

必须明确方向：

```ts
interface EdgeDistanceResult {
  horizontal: number;
  vertical: number;
  minimum: number;
}
```

---

# 36. GEOMETRY.OVERLAP

定义：

```text
GEOMETRY.OVERLAP@1.0.0
```

两个矩形：

```text
A
B
```

交集：

```text
intersection(A,B)
```

输出：

```ts
interface OverlapResult {
  area: number;
  ratioA: number;
  ratioB: number;
}
```

其中：

```text
ratioA =
intersectionArea / areaA

ratioB =
intersectionArea / areaB
```

---

# 37. Overlap 不直接等于错误

两个 UI 元素重叠：

```text
OVERLAP > 0
```

不意味着：

```text
FAIL
```

例如：

```text
Badge
Icon
Overlay
Popover
```

可能是有意重叠。

是否允许由：

```text
Rule
```

决定。

---

# 38. Metric Dependency Graph

核心依赖：

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

Contrast：

```text
sRGB
 ↓
Relative Luminance
 ↓
Contrast
```

Typography：

```text
FONT_SIZE
     ↓
LINE_HEIGHT_RATIO
```

Geometry：

```text
WIDTH
HEIGHT
   ↓
AREA
ASPECT_RATIO
```

---

# 39. Metric Registry

正式注册：

```text
COLOR.SRGB@1.0.0
COLOR.OKLAB@1.0.0
COLOR.OKLCH@1.0.0
COLOR.LIGHTNESS@1.0.0
COLOR.CHROMA@1.0.0
COLOR.HUE@1.0.0
COLOR.CONTRAST@1.0.0

TYPOGRAPHY.FONT_SIZE@1.0.0
TYPOGRAPHY.FONT_WEIGHT@1.0.0
TYPOGRAPHY.LINE_HEIGHT@1.0.0
TYPOGRAPHY.LETTER_SPACING@1.0.0
TYPOGRAPHY.TEXT_MEASURE@1.0.0
TYPOGRAPHY.SCALE_RATIO@1.0.0
TYPOGRAPHY.DENSITY@1.0.0

GEOMETRY.WIDTH@1.0.0
GEOMETRY.HEIGHT@1.0.0
GEOMETRY.AREA@1.0.0
GEOMETRY.ASPECT_RATIO@1.0.0
GEOMETRY.CENTER_DISTANCE@1.0.0
GEOMETRY.EDGE_DISTANCE@1.0.0
GEOMETRY.OVERLAP@1.0.0
```

---

# 40. Metric Result Schema

统一：

```ts
interface MetricResult<T> {
  metricId: string;
  metricVersion: string;

  subjectId: string;

  value: T;

  unit?: string;

  dependencies: MetricDependency[];

  calculatedAt: string;
}
```

---

# 41. Invalid Input

Metric 输入无效：

```text
INVALID_INPUT
```

例如：

```text
width = NaN
height = -1
invalid color
```

---

# 42. Undefined

有些 Metric 合法存在但没有定义结果。

例如：

```text
Chroma ≈ 0
```

则：

```text
Hue = UNDEFINED
```

这不是错误。

---

# 43. Unknown

由于环境信息不足：

```text
background unknown
```

则：

```text
Metric/Evaluation
=
UNKNOWN
```

---

# 44. Error

算法内部发生异常：

```text
CALCULATION_ERROR
```

不能伪装成：

```text
FAIL
```

---

# 45. Metric State

Metric Result 可以携带：

```ts
type MetricState =
  | "VALID"
  | "UNDEFINED"
  | "UNKNOWN"
  | "ERROR";
```

这样：

```text
Metric
```

与：

```text
Evaluation
```

的语义完全分离。

---

# 46. Color Test Matrix

至少测试：

```text
Black
White
Red
Green
Blue
Gray
Neutral
Low Chroma
Transparent
Invalid
```

---

# 47. Typography Test Matrix

至少测试：

```text
12px
14px
16px
24px
32px

400
500
600
700

normal line-height
unitless line-height
explicit px line-height

positive letter-spacing
negative letter-spacing
zero letter-spacing
```

---

# 48. Geometry Test Matrix

至少测试：

```text
normal rectangle
square
zero width
zero height
negative input
overlap
touching
separated
nested
```

---

# 49. Property-Based Testing

几何计算推荐增加 Property-Based Test。

例如：

```text
area >= 0
width >= 0
height >= 0
```

并验证：

```text
area(width,height)
=
area(height,width)
```

---

# 50. Color Invariants

必须满足：

```text
contrast(A,A) = 1
contrast(black,white) = 21
contrast(A,B) = contrast(B,A)
```

在允许误差范围内成立。

---

# 51. Geometry Invariants

必须满足：

```text
area(A) >= 0
centerDistance(A,A) = 0
overlap(A,A) = area(A)
```

---

# 52. Typography Invariants

字体尺寸：

```text
fontSize > 0
```

Line height：

```text
computedLineHeight >= 0
```

---

# 53. Metric Determinism

同一输入：

```text
Input
+
Metric Version
```

必须得到相同数值。

不能因为：

```text
运行时间
机器
线程
随机数
```

发生结果变化。

---

# 54. Metric Trace

每个 Composite/Derived Metric 必须保留依赖：

例如：

```json
{
  "metricId": "GEOMETRY.AREA",
  "metricVersion": "1.0.0",
  "value": 3200,
  "dependencies": [
    {
      "metricId": "GEOMETRY.WIDTH",
      "metricVersion": "1.0.0",
      "value": 80
    },
    {
      "metricId": "GEOMETRY.HEIGHT",
      "metricVersion": "1.0.0",
      "value": 40
    }
  ]
}
```

---

# 55. Display Formatting

Metric 本身不得决定最终 UI 展示格式。

例如：

```text
Metric:
5.172423
```

Inspector 可以显示：

```text
5.17
```

CLI 可以显示：

```text
5.1724
```

Export 可以保存：

```text
5.172423
```

---

# 56. Unit Registry

建议：

```ts
type UIQUnit =
  | "px"
  | "px2"
  | "degree"
  | "ratio"
  | "dimensionless";
```

实际工程中：

```text
px²
```

可以使用标准化字符串：

```text
px^2
```

---

# 57. 不把 CSS 单位直接作为 Metric Unit

例如：

```text
1rem
```

不能作为统一 Metric 输出单位。

Browser Measurement 首先解析：

```text
1rem → computed px
```

Metric 输出：

```text
16px
```

这样可以跨环境比较。

---

# 58. Viewport Dependency

Geometry Metric 可能依赖：

```text
viewport
devicePixelRatio
zoom
scroll position
```

因此 MeasurementSnapshot 应记录：

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

# 59. Geometry Coordinate System

统一使用：

```text
Viewport Coordinate System
```

来源：

```text
getBoundingClientRect()
```

因此：

```text
x
y
```

是 viewport-relative。

---

# 60. Scroll

如果需要 document-relative 坐标：

```text
documentX = rect.x + scrollX
documentY = rect.y + scrollY
```

但 UIQ Geometry Metric V1.0 默认使用：

```text
viewport-relative
```

---

# 61. Responsive Measurement

同一个页面：

```text
Desktop
Tablet
Mobile
```

必须视为不同 Measurement Snapshot。

例如：

```text
Snapshot A
viewport = 1440×900

Snapshot B
viewport = 768×1024

Snapshot C
viewport = 390×844
```

不能混成一个 Measurement。

---

# 62. Responsive Metric

未来可以定义：

```text
GEOMETRY.RESPONSIVE_VARIANCE
```

但它不是本规范的一部分。

当前采用：

```text
多个 Snapshot
+
同一个 Metric
```

进行跨状态比较。

---

# 63. Metric Comparison

例如：

```text
FONT_SIZE@Desktop = 16px
FONT_SIZE@Mobile = 14px
```

Metric 本身不判断：

```text
是否正确
```

可以计算：

```text
difference = -2px
ratio = 0.875
```

然后由 Rule 判断。

---

# 64. 第一批 Composite Metric

暂时只允许：

```text
AREA
ASPECT_RATIO
CENTER_DISTANCE
EDGE_DISTANCE
OVERLAP
SCALE_RATIO
```

不要在这一阶段加入：

```text
Aesthetic Score
Visual Quality Score
Design Quality Index
```

---

# 65. 为什么

这些名称实际上已经把：

```text
Measurement
```

与：

```text
Judgement
```

混合。

UIQ 必须保持：

```text
Observed
→
Measured
→
Derived
→
Evaluated
```

---

# 66. 与色彩设计系统的连接

这一规范与之前的色彩系统形成：

```text
Color Science
      ↓
Color Space
      ↓
Palette
      ↓
Token
      ↓
Rendered Color
      ↓
COLOR.SRGB
      ↓
OKLab / OKLCH
      ↓
COLOR.LIGHTNESS
COLOR.CHROMA
COLOR.HUE
      ↓
COLOR.CONTRAST
```

因此设计系统中的颜色选择可以最终被 UIQ 验证。

---

# 67. “脏颜色”处理

UIQ 不定义：

```text
DIRTY_COLOR
```

因为这不是严格的单一物理/色度学量。

例如所谓：

```text
“颜色脏”
```

可以拆解为：

```text
Chroma
Lightness
Hue
Delta E
Gamut
Contrast
```

再由规则或设计策略解释。

---

# 68. 感知空间边界

UIQ V1.0：

```text
OKLab / OKLCH
```

作为主要感知分析空间之一。

但不得宣称：

```text
OKLab
=
所有视觉感知的完整模型
```

Metric 规范必须保持科学上的可验证边界。

---

# 69. Color Selection 与 Measurement 分离

色彩设计系统：

```text
“选择什么颜色？”
```

UIQ：

```text
“实际使用了什么颜色？”
```

因此：

```text
Color Picker
```

不属于 UIQ Metric Engine。

但：

```text
Color Picker → Theme Export → UIQ
```

可以形成完整工具链。

---

# 70. Metric Registry Freeze

截至本规范：

```text
COLOR
    SRGB
    OKLAB
    OKLCH
    LIGHTNESS
    CHROMA
    HUE
    CONTRAST

TYPOGRAPHY
    FONT_SIZE
    FONT_WEIGHT
    LINE_HEIGHT
    LETTER_SPACING
    TEXT_MEASURE
    SCALE_RATIO
    DENSITY

GEOMETRY
    WIDTH
    HEIGHT
    AREA
    ASPECT_RATIO
    CENTER_DISTANCE
    EDGE_DISTANCE
    OVERLAP
```

作为：

```text
UIQ Metric Baseline
```

---

# 71. 后续扩展规则

新增 Metric 时必须回答：

```text
1. What is measured?
2. What is the input?
3. What is the output?
4. What is the unit?
5. What is the mathematical definition?
6. What are dependencies?
7. What is the version?
8. What are undefined states?
9. What are invalid states?
10. What are invariants?
11. What are golden cases?
```

如果无法回答：

```text
Metric 不得进入正式 Registry。
```

---

# 72. V1.0 完成标准

### Color

- [ ] sRGB parsing
- [ ] Linear RGB conversion
- [ ] XYZ conversion
- [ ] OKLab conversion
- [ ] OKLCH conversion
- [ ] Lightness
- [ ] Chroma
- [ ] Hue
- [ ] Contrast

### Typography

- [ ] Font Size
- [ ] Font Weight
- [ ] Line Height
- [ ] Letter Spacing
- [ ] Text Measure
- [ ] Scale Ratio

### Geometry

- [ ] Width
- [ ] Height
- [ ] Area
- [ ] Aspect Ratio
- [ ] Center Distance
- [ ] Edge Distance
- [ ] Overlap

---

# 73. 下一阶段

核心 Metric 完成后，不继续扩充 Metric 数量。

下一阶段进入：

# UIQ-ER-02
## Evaluation Rule & Policy Implementation Specification V1.0

重点建立：

```text
Metric
 ↓
Rule
 ↓
Threshold
 ↓
Tolerance
 ↓
Applicability
 ↓
Severity
 ↓
Evaluation
 ↓
Finding
```

特别解决一个关键问题：

> **UIQ 如何从“数字”进入“可解释的设计规范判定”，而又不把审美判断偷偷塞进 Metric。**

届时将正式形成：

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
```

这一条 UIQ 的核心“数字化评价链”。