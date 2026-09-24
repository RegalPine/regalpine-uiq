# UIQ-IMPL-04
## Color Mathematics Implementation Specification

**文档编号：** UIQ-IMPL-04  
**版本：** V1.0.0  
**状态：** Implementation Baseline / Frozen  
**适用范围：** UIQ V1.0 Color Engine  
**前置规范：**
- UIQ-FM-01
- UIQ-MR-01
- UIQ-METRIC-01
- UIQ-TST-01
- UIQ-IMPL-02
- UIQ-IMPL-03

---

# 1. 目标

本规范将 UIQ V1.0 的色彩数学模型落实为可执行、可测试、可复现的 TypeScript 实现。

核心转换链：

```text
CSS Color
    │
    ▼
sRGB
    │
    ▼
Linear RGB
    │
    ▼
XYZ D65
    │
    ▼
OKLab
    │
    ▼
OKLCH
```

同时实现：

```text
Relative Luminance
Contrast Ratio
ΔL
ΔC
ΔH
Gamut
```

---

# 2. 核心原则

## 2.1 RGB 不是 UIQ 的主要分析空间

sRGB 的职责：

```text
Input
Output
Browser CSS
Screen-oriented encoding
```

而 UIQ 的感知分析主要使用：

```text
OKLab
OKLCH
```

因此：

```text
颜色输入
   ↓
sRGB
   ↓
转换
   ↓
OKLab / OKLCH
   ↓
分析
```

而不是：

```text
RGB 数值
 ↓
直接判断颜色关系
```

---

# 3. Color Module 目录

```text
packages/color/
│
└── src/
    │
    ├── types/
    │   ├── SRGB.ts
    │   ├── LinearRGB.ts
    │   ├── XYZ.ts
    │   ├── OKLab.ts
    │   ├── OKLCH.ts
    │   └── ColorStatus.ts
    │
    ├── parsing/
    │   ├── parseHex.ts
    │   ├── parseRgb.ts
    │   └── parseColor.ts
    │
    ├── srgb/
    │   ├── srgbToLinear.ts
    │   └── linearToSrgb.ts
    │
    ├── xyz/
    │   ├── linearRgbToXyz.ts
    │   └── xyzToLinearRgb.ts
    │
    ├── oklab/
    │   ├── xyzToOklab.ts
    │   └── oklabToXyz.ts
    │
    ├── oklch/
    │   ├── oklabToOklch.ts
    │   └── oklchToOklab.ts
    │
    ├── luminance/
    │   └── relativeLuminance.ts
    │
    ├── contrast/
    │   └── contrastRatio.ts
    │
    ├── difference/
    │   ├── deltaL.ts
    │   ├── deltaC.ts
    │   └── deltaH.ts
    │
    ├── gamut/
    │   ├── isInSrgbGamut.ts
    │   └── gamutDistance.ts
    │
    └── index.ts
```

---

# 4. Internal Color Types

## 4.1 sRGB

```ts
export interface SRGB {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly alpha: number;
}
```

范围：

```text
0 ≤ r,g,b ≤ 1
0 ≤ alpha ≤ 1
```

---

# 5. Linear RGB

```ts
export interface LinearRGB {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}
```

范围理论上：

```text
0 ≤ r,g,b ≤ 1
```

但颜色转换过程中允许出现：

```text
r < 0
r > 1
```

这种状态代表：

```text
Out of Gamut
```

不能在内部计算阶段立即 clamp。

---

# 6. XYZ

采用：

```text
XYZ D65
```

```ts
export interface XYZ {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}
```

---

# 7. OKLab

```ts
export interface OKLab {
  readonly L: number;
  readonly a: number;
  readonly b: number;
}
```

---

# 8. OKLCH

```ts
export interface OKLCH {
  readonly L: number;
  readonly C: number;
  readonly H: number | "UNDEFINED";
}
```

其中：

```text
L = Lightness
C = Chroma
H = Hue
```

---

# 9. HEX Parsing

支持：

```text
#RGB
#RGBA
#RRGGBB
#RRGGBBAA
```

例如：

```text
#F00
```

转换：

```text
r = 1
g = 0
b = 0
alpha = 1
```

---

# 10. HEX Implementation

```ts
export function parseHex(
  input: string
): SRGB {

  const hex = input
    .trim()
    .replace(/^#/, "");

  let normalized: string;

  switch (hex.length) {
    case 3:
      normalized =
        hex
          .split("")
          .map(c => c + c)
          .join("") + "FF";
      break;

    case 4:
      normalized =
        hex
          .split("")
          .map(c => c + c)
          .join("");
      break;

    case 6:
      normalized = hex + "FF";
      break;

    case 8:
      normalized = hex;
      break;

    default:
      throw new Error(
        `Invalid HEX color: ${input}`
      );
  }

  return {
    r: parseInt(normalized.slice(0, 2), 16) / 255,
    g: parseInt(normalized.slice(2, 4), 16) / 255,
    b: parseInt(normalized.slice(4, 6), 16) / 255,
    alpha:
      parseInt(normalized.slice(6, 8), 16) / 255
  };
}
```

---

# 11. sRGB → Linear RGB

sRGB transfer function：

```ts
export function srgbToLinear(
  value: number
): number {

  if (value <= 0.04045) {
    return value / 12.92;
  }

  return Math.pow(
    (value + 0.055) / 1.055,
    2.4
  );
}
```

转换：

```ts
export function toLinearRGB(
  color: SRGB
): LinearRGB {
  return {
    r: srgbToLinear(color.r),
    g: srgbToLinear(color.g),
    b: srgbToLinear(color.b)
  };
}
```

Alpha 不参与 RGB transfer function。

---

# 12. Linear RGB → sRGB

```ts
export function linearToSrgb(
  value: number
): number {

  if (value <= 0.0031308) {
    return 12.92 * value;
  }

  return (
    1.055 *
    Math.pow(value, 1 / 2.4)
    - 0.055
  );
}
```

转换结果如果用于 CSS 输出，再执行：

```text
clamp(0, 1)
```

但是：

> **内部计算阶段禁止提前 Clamp。**

---

# 13. Linear RGB → XYZ D65

采用标准 sRGB / D65 转换矩阵：

```text
X = 0.41239079926595934 R
  + 0.35758433938387796 G
  + 0.1804807884018343 B

Y = 0.21263900587151027 R
  + 0.7151686787677559 G
  + 0.07219231536073371 B

Z = 0.01933081871559185 R
  + 0.11919477979462598 G
  + 0.9505321522496607 B
```

实现：

```ts
export function linearRgbToXyz(
  rgb: LinearRGB
): XYZ {

  return {
    x:
      0.41239079926595934 * rgb.r +
      0.35758433938387796 * rgb.g +
      0.1804807884018343 * rgb.b,

    y:
      0.21263900587151027 * rgb.r +
      0.7151686787677559 * rgb.g +
      0.07219231536073371 * rgb.b,

    z:
      0.01933081871559185 * rgb.r +
      0.11919477979462598 * rgb.g +
      0.9505321522496607 * rgb.b
  };
}
```

---

# 14. XYZ → Linear RGB

使用逆矩阵：

```text
R =
 3.2409699419045226 X
-1.5373831775700937 Y
-0.4986107602930034 Z

G =
-0.9692436362808798 X
+1.8759675015077202 Y
+0.04155505740717559 Z

B =
 0.05563007969699366 X
-0.20397695888897652 Y
+1.0569715142428786 Z
```

转换后不立即 Clamp。

---

# 15. XYZ → OKLab

采用 D65 OKLab 转换。

第一阶段：

```text
l = 0.8190224379967030 X
  + 0.3619062600528904 Y
  - 0.1288737815209879 Z

m = 0.0329836539323885 X
  + 0.9292868615863434 Y
  + 0.0361446663506424 Z

s = 0.0481771893596242 X
  + 0.2642395317527308 Y
  + 0.6335478284694309 Z
```

然后：

```text
l' = cbrt(l)
m' = cbrt(m)
s' = cbrt(s)
```

最终：

```text
L =
0.2104542553 l'
+0.7936177850 m'
-0.0040720468 s'

a =
1.9779984951 l'
-2.4285922050 m'
+0.4505937099 s'

b =
0.0259040371 l'
+0.7827717662 m'
-0.8086757660 s'
```

实现必须采用：

```ts
Math.cbrt()
```

而不是：

```ts
Math.pow(x, 1 / 3)
```

原因是：

```text
Math.pow(negative, 1/3)
```

可能产生：

```text
NaN
```

而 OKLab 中转换中间值可能超出普通 RGB gamut。

---

# 16. OKLab → OKLCH

```ts
export function oklabToOklch(
  lab: OKLab
): OKLCH {

  const C = Math.sqrt(
    lab.a * lab.a +
    lab.b * lab.b
  );

  if (C < 1e-7) {
    return {
      L: lab.L,
      C,
      H: "UNDEFINED"
    };
  }

  let H =
    Math.atan2(
      lab.b,
      lab.a
    ) *
    180 /
    Math.PI;

  if (H < 0) {
    H += 360;
  }

  return {
    L: lab.L,
    C,
    H
  };
}
```

---

# 17. Hue 的正式语义

当：

```text
C < ε
```

Hue：

```text
UNDEFINED
```

而不是：

```text
0°
```

这是重要的语义区别：

```text
Gray
```

不是：

```text
Red at 0°
```

---

# 18. Lightness

UIQ：

```text
COLOR.LIGHTNESS
```

默认来源：

```text
OKLab L
```

范围通常：

```text
0 → 1
```

但对于特殊/非标准输入，内部实现不能简单假设所有中间值始终位于：

```text
0 ≤ L ≤ 1
```

如果超出正常显示范围：

```text
metadata.status = OUT_OF_EXPECTED_RANGE
```

而不是悄悄截断。

---

# 19. Chroma

```text
COLOR.CHROMA
```

定义：

```text
C = sqrt(a² + b²)
```

这是 UIQ 识别颜色“彩度程度”的基础量之一。

但是：

> Chroma 高低本身不是好坏判断。

---

# 20. Hue

```text
COLOR.HUE
```

范围：

```text
0 ≤ H < 360
```

当：

```text
C ≈ 0
```

则：

```text
H = UNDEFINED
```

---

# 21. Relative Luminance

WCAG 对比度使用相对亮度。

```ts
export function relativeLuminance(
  color: SRGB
): number {

  const rgb =
    toLinearRGB(color);

  return (
    0.2126 * rgb.r +
    0.7152 * rgb.g +
    0.0722 * rgb.b
  );
}
```

---

# 22. Alpha 的重要处理

颜色：

```text
foreground
background
```

可能具有：

```text
alpha < 1
```

V1.0 不允许：

```text
直接忽略 alpha
```

必须先进行 compositing。

基础 compositing：

```text
C = α Cf + (1 - α) Cb
```

其中计算应在：

```text
Linear RGB
```

空间进行，而不是直接对 gamma-encoded sRGB 数值插值。

---

# 23. Background Compositing

如果：

```text
foreground α = 1
```

无需处理 foreground alpha。

如果：

```text
background α < 1
```

则必须继续向后寻找背景。

例如：

```text
Button
 ↓
background rgba(...)
 ↓
Page background
```

如果最终背景仍然无法确定：

```text
UNKNOWN
```

---

# 24. Contrast Ratio

```ts
export function contrastRatio(
  foreground: SRGB,
  background: SRGB
): number {

  const lf =
    relativeLuminance(foreground);

  const lb =
    relativeLuminance(background);

  const lighter =
    Math.max(lf, lb);

  const darker =
    Math.min(lf, lb);

  return (
    (lighter + 0.05) /
    (darker + 0.05)
  );
}
```

范围：

```text
1 → 21
```

---

# 25. Contrast 与 ΔE 的严格区分

UIQ 明确区分：

```text
Contrast
```

和：

```text
Color Difference
```

Contrast：

```text
用于前景/背景可读性关系
```

Color Difference：

```text
用于两个颜色之间的差异描述
```

因此：

```text
Contrast = ΔE
```

是错误的语义。

---

# 26. ΔL

```ts
export function deltaL(
  a: OKLab,
  b: OKLab
): number {
  return b.L - a.L;
}
```

表示：

```text
Lightness Difference
```

---

# 27. ΔC

```ts
export function deltaC(
  a: OKLCH,
  b: OKLCH
): number {
  return b.C - a.C;
}
```

---

# 28. ΔH

Hue Difference 需要处理圆周：

```text
0°
≈
360°
```

定义：

```ts
export function deltaH(
  a: number | "UNDEFINED",
  b: number | "UNDEFINED"
): number | "UNDEFINED" {

  if (
    a === "UNDEFINED" ||
    b === "UNDEFINED"
  ) {
    return "UNDEFINED";
  }

  let delta = b - a;

  if (delta > 180) {
    delta -= 360;
  }

  if (delta < -180) {
    delta += 360;
  }

  return delta;
}
```

例如：

```text
350° → 10°
```

结果：

```text
+20°
```

而不是：

```text
-340°
```

---

# 29. ΔE 的版本要求

UIQ 不定义：

```text
OKLCH distance = ΔE
```

如果以后实现：

```text
COLOR.DELTA_E
```

必须显式声明：

```text
CIE76
CIE94
CIEDE2000
```

或其他正式定义的方法。

例如：

```text
COLOR.DELTA_E.CIEDE2000@1.0.0
```

这样才能保证：

```text
Metric Version
```

具有明确语义。

---

# 30. sRGB Gamut

判断：

```ts
export function isInSrgbGamut(
  rgb: LinearRGB,
  epsilon = 1e-7
): boolean {

  return (
    rgb.r >= -epsilon &&
    rgb.r <= 1 + epsilon &&
    rgb.g >= -epsilon &&
    rgb.g <= 1 + epsilon &&
    rgb.b >= -epsilon &&
    rgb.b <= 1 + epsilon
  );
}
```

---

# 31. 为什么不直接 Clamp

错误：

```ts
const r =
  Math.max(0, Math.min(1, value));
```

然后再判断 gamut。

这样会把：

```text
Out of Gamut
```

伪装成：

```text
In Gamut
```

正确流程：

```text
Color Conversion
      ↓
Raw RGB
      ↓
Gamut Test
      ↓
if needed
      ↓
Explicit Gamut Mapping
      ↓
Output
```

---

# 32. Gamut Distance

V1.0 允许提供：

```text
COLOR.GAMUT_DISTANCE
```

但必须明确：

> Gamut Distance 是工程定义的辅助指标，不等价于视觉感知意义上的统一距离。

最简单的 V1.0 定义：

```text
distance =
Euclidean distance
from out-of-range channels
to nearest boundary
```

例如：

```text
r = 1.10
g = 0.50
b = 0.50
```

则：

```text
excess = 0.10
```

具体算法必须固定版本。

---

# 33. “脏色”处理

UIQ 不定义：

```text
DIRTY_COLOR
```

因为：

```text
“脏”
```

通常可能来自：

```text
Lightness
Chroma
Hue
Contrast
Gamut
Alpha
Surrounding colors
```

因此 UIQ 将其拆解：

```text
Color
 ├── L
 ├── C
 ├── H
 ├── Contrast
 ├── Gamut
 └── Alpha
```

然后由上层 Rule 或 Diagnostic 描述。

---

# 34. 不建立“脏区黑名单”

不建议建立：

```text
OKLCH
 ↓
Dirty Region
 ↓
Forbidden
```

原因：

同一个颜色区域：

```text
在不同背景
不同字体
不同尺寸
不同组件
不同主题
```

可能产生完全不同的视觉结果。

因此 UIQ：

```text
测量属性
    ↓
关系
    ↓
Rule
```

而不是：

```text
空间区域
    ↓
审美禁区
```

---

# 35. Color Metric Mapping

最终：

```text
COLOR.SRGB
       ↓
COLOR.XYZ
       ↓
COLOR.OKLAB
       ↓
COLOR.OKLCH
       ├── LIGHTNESS
       ├── CHROMA
       └── HUE
```

关系指标：

```text
Color A
 +
Color B
 ↓
ΔL
ΔC
ΔH
Contrast
ΔE
```

---

# 36. Color Metric Registry

正式注册：

```ts
metricRegistry.register(
  colorSrgbMetric
);

metricRegistry.register(
  colorOklabMetric
);

metricRegistry.register(
  colorOklchMetric
);

metricRegistry.register(
  colorLightnessMetric
);

metricRegistry.register(
  colorChromaMetric
);

metricRegistry.register(
  colorHueMetric
);

metricRegistry.register(
  colorContrastMetric
);
```

---

# 37. Metric Identity

例如：

```text
COLOR.OKLAB@1.0.0
```

和：

```text
COLOR.OKLCH@1.0.0
```

是两个独立 Metric。

不能：

```text
COLOR.OKLCH
```

内部偷偷改变定义。

---

# 38. Color Golden Tests

必须覆盖：

```text
black
white
red
green
blue
gray
neutral gray
low chroma
transparent
out-of-gamut
```

---

# 39. 基础 Golden

## Black

```text
#000000
```

要求：

```text
L = 0
C ≈ 0
H = UNDEFINED
```

---

# 40. White

```text
#FFFFFF
```

要求：

```text
L ≈ 1
C ≈ 0
H = UNDEFINED
```

---

# 41. Gray

```text
#808080
```

要求：

```text
C ≈ 0
H = UNDEFINED
```

而不是：

```text
H = 0
```

---

# 42. Primary Colors

测试：

```text
#FF0000
#00FF00
#0000FF
```

验证：

```text
sRGB
→ Linear RGB
→ XYZ
→ OKLab
→ OKLCH
```

整个转换链的数值必须处于预设 tolerance。

---

# 43. Contrast Golden

必须固定：

```text
#FFFFFF / #000000
```

结果：

```text
21
```

Tolerance：

```text
0.0001
```

---

# 44. Blue Contrast Golden

```text
foreground = #FFFFFF
background = #2563EB
```

结果约：

```text
5.17
```

Tolerance：

```text
0.01
```

---

# 45. Gray Contrast Golden

```text
foreground = #777777
background = #FFFFFF
```

结果约：

```text
4.48
```

Tolerance：

```text
0.01
```

---

# 46. Property-Based Tests

颜色转换必须增加性质测试。

## Round Trip

```text
sRGB
 ↓
Linear RGB
 ↓
XYZ
 ↓
OKLab
 ↓
XYZ
 ↓
Linear RGB
 ↓
sRGB
```

要求误差在允许范围内。

---

# 47. Neutral Axis Property

对于：

```text
R = G = B
```

应满足：

```text
C ≈ 0
```

因此：

```text
H = UNDEFINED
```

这是一条重要的数学性质。

---

# 48. Hue Circularity Property

验证：

```text
350° → 10°
```

得到：

```text
+20°
```

而不是：

```text
-340°
```

---

# 49. Contrast Symmetry

验证：

```text
contrast(A, B)
=
contrast(B, A)
```

---

# 50. Contrast Bounds

必须满足：

```text
1 ≤ contrast ≤ 21
```

对于有效 sRGB opaque colors。

---

# 51. Alpha Tests

至少测试：

```text
opaque
50% alpha
0% alpha
foreground alpha
background alpha
nested compositing
```

---

# 52. Out-of-Gamut Tests

测试：

```text
OKLCH
 ↓
XYZ
 ↓
Linear RGB
```

出现：

```text
r > 1
g < 0
```

时：

```text
isInSrgbGamut = false
```

且原始值必须保留。

---

# 53. Color Calculation API

最终公共 API：

```ts
export {
  parseHex,
  parseColor,

  srgbToLinear,
  linearToSrgb,

  linearRgbToXyz,
  xyzToLinearRgb,

  xyzToOklab,
  oklabToXyz,

  oklabToOklch,
  oklchToOklab,

  relativeLuminance,
  contrastRatio,

  deltaL,
  deltaC,
  deltaH,

  isInSrgbGamut,
  gamutDistance
};
```

---

# 54. Color Engine 不负责

Color Package 不负责：

```text
Palette Generation
Theme Generation
Semantic Token Mapping
Component State Mapping
Accessibility Policy
Brand Color Selection
Dirty Color Judgment
Recommendation
```

因此：

```text
@uiq/color
```

只是：

> **Color Mathematics Engine**

而不是：

> Color Design Engine。

---

# 55. 与未来 Color Selection System 的边界

你正在设计的色彩选择系统：

```text
Color Space
 ↓
Palette
 ↓
Semantic Mapping
 ↓
Component Mapping
 ↓
Theme
```

属于：

```text
Color Design System
```

而 UIQ：

```text
Real UI
 ↓
Measurement
 ↓
Color Metric
 ↓
Rule
```

属于：

```text
UI Quantification System
```

两者可以连接：

```text
Color Design System
        │
        ▼
     Theme
        │
        ▼
       UI
        │
        ▼
       UIQ
        │
        ▼
Validation
```

但两者不应合并。

---

# 56. 与 Radix UI 的关系

Radix UI 示例：

```text
Radix Component
      ↓
CSS Variables
      ↓
Browser Computed Style
      ↓
UIQ Measurement
      ↓
OKLab / OKLCH
      ↓
Rules
```

UIQ 不要求：

```text
Radix token
```

才能工作。

任何真实 DOM UI 都可以被测量。

---

# 57. V1.0 Color Implementation Acceptance

必须满足：

```text
COLOR-AC-01
HEX parsing deterministic

COLOR-AC-02
sRGB transfer function deterministic

COLOR-AC-03
XYZ conversion deterministic

COLOR-AC-04
OKLab conversion deterministic

COLOR-AC-05
OKLCH conversion deterministic

COLOR-AC-06
Neutral colors produce undefined Hue

COLOR-AC-07
Contrast matches golden values

COLOR-AC-08
Alpha is not silently ignored

COLOR-AC-09
Out-of-gamut values are not silently clamped

COLOR-AC-10
Color Metric contains no policy judgement

COLOR-AC-11
Color Metric version is explicit

COLOR-AC-12
Round-trip error remains within tolerance
```

---

# 58. Phase 2 完成后的架构

```text
                 @uiq/core
                     │
                     ▼
                @uiq/color
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
       sRGB        OKLab      OKLCH
          │          │          │
          └──────────┼──────────┘
                     ▼
              Color Metrics
                     │
                     ▼
                @uiq/metrics
                     │
                     ▼
                  @uiq/rules
```

---

# 59. 收敛结论

UIQ V1.0 色彩计算层到此冻结。

核心原则最终确定为：

```text
sRGB
= Input / Browser / Output

XYZ D65
= Colorimetric Intermediate Space

OKLab
= Perceptual Analysis Space

OKLCH
= Perceptual Cylindrical Analysis Space
```

UIQ 不再因为“脏色”“品牌色”“高级感”等主观概念增加新的色彩空间层。

这些问题统一回到：

```text
L
C
H
Contrast
Gamut
Alpha
Context
```

进行可测量分解。

---

# 60. 下一阶段

Phase 3 进入：

```text
UIQ-IMPL-05
Metric Registry & Metric Execution Engine
```

重点实现：

```text
MeasurementSnapshot
        ↓
MetricDependency Graph
        ↓
Metric Registry
        ↓
Metric Execution
        ↓
MetricResult
        ↓
Deterministic Fingerprint
```

并把目前的：

```text
COLOR
TYPOGRAPHY
GEOMETRY
```

正式统一到一个可执行 Metric Runtime 中。

这一阶段仍然不增加新的架构层。