# UIQ-MR-01
# Metric Registry Specification V1.0

**UI Design Quantification — Metric Registry**

---

## 1. 文档定位

本文档是 UIQ V1.0 的正式 Metric Registry。

它将 UIQ-FM-01 中定义的 Metric 模型进一步具体化，建立：

```text
Metric ID
    ↓
Metric Definition
    ↓
Input
    ↓
Calculation
    ↓
Output
    ↓
Validity
    ↓
Evaluation
```

本文档的目标是使 Metric：

- 可实现
- 可测试
- 可版本化
- 可复现
- 可追溯
- 可组合

---

# 2. Metric Registry 原则

## 2.1 Metric 是事实的派生描述

```text
Measurement
      ↓
Metric
```

Metric 不直接表达：

```text
好看
高级
现代
漂亮
```

---

## 2.2 Metric 不包含 Evaluation Rule

例如：

```text
COLOR.CONTRAST = 3.82
```

Metric 到此结束。

是否：

```text
PASS
FAIL
WARN
```

由 Evaluation Rule 决定。

---

## 2.3 Metric 必须可复现

相同：

```text
Input
Metric Version
Configuration
```

必须产生相同结果。

---

# 3. Metric Definition

统一定义：

```yaml
metric:
  id:
  version:
  domain:
  name:
  classification:
  subject:
  inputs:
  output:
  formula:
  precision:
  validity:
  dependencies:
  referenceSpace:
```

---

# 4. Metric Classification

```text
BASE
DERIVED
COMPOSITE
```

---

# 5. Metric Domain Registry

V1.0 固定：

```text
COLOR
GEOMETRY
TYPOGRAPHY
SPACING
LAYOUT
HIERARCHY
CONFORMANCE
ACCESSIBILITY
```

---

# 6. COLOR Metric Registry

色彩 Metric 是 UIQ V1.0 的重点。

```text
COLOR
│
├── COLOR.SRGB
├── COLOR.XYZ
├── COLOR.OKLAB
├── COLOR.LIGHTNESS
├── COLOR.CHROMA
├── COLOR.HUE
├── COLOR.DELTA_E
├── COLOR.DELTA_L
├── COLOR.DELTA_C
├── COLOR.DELTA_H
├── COLOR.CONTRAST
└── COLOR.GAMUT_DISTANCE
```

---

# 7. COLOR.SRGB

## Definition

描述颜色在 sRGB 编码空间中的值。

```text
R ∈ [0,1]
G ∈ [0,1]
B ∈ [0,1]
```

形式：

```text
sRGB = (R,G,B)
```

Classification：

```text
BASE
```

用途：

- CSS
- Browser
- Export
- Compatibility

---

# 8. COLOR.XYZ

标准化后的 CIE XYZ 表示。

```text
XYZ = (X,Y,Z)
```

Classification：

```text
DERIVED
```

主要用途：

```text
sRGB
 ↓
XYZ
 ↓
OKLab
```

---

# 9. COLOR.OKLAB

定义：

```text
OKLab = (L,a,b)
```

其中：

```text
L = perceptual lightness
a = green/red axis
b = blue/yellow axis
```

Classification：

```text
DERIVED
```

---

# 10. COLOR.LIGHTNESS

定义：

```text
COLOR.LIGHTNESS = L
```

范围：

```text
0 ≤ L ≤ 1
```

来源：

```text
OKLab.L
```

单位：

```text
dimensionless
```

精度：

```text
0.001
```

---

# 11. COLOR.CHROMA

OKLCH：

```text
C = sqrt(a² + b²)
```

定义：

```text
COLOR.CHROMA = C
```

单位：

```text
dimensionless
```

---

# 12. COLOR.HUE

定义：

```text
h = atan2(b,a)
```

转换为：

```text
0° ≤ h < 360°
```

灰色接近：

```text
C ≈ 0
```

时 Hue 被定义为：

```text
undefined
```

而不是强行生成一个色相。

这是一个重要的 UIQ 数据不变量。

---

# 13. COLOR.OKLCH

虽然 OKLCH 是 Color Model，而不是单一 Scalar Metric，但 UIQ 将：

```text
(L,C,h)
```

作为标准色彩分析向量。

```json
{
  "space": "OKLCH",
  "L": 0.62,
  "C": 0.15,
  "h": 250
}
```

---

# 14. COLOR.DELTA_L

两个颜色：

```text
A = (L1,C1,h1)
B = (L2,C2,h2)
```

定义：

```text
ΔL = L2 - L1
```

用途：

- 明度层级
- 状态变化
- 前景/背景关系
- Palette Analysis

---

# 15. COLOR.DELTA_C

定义：

```text
ΔC = C2 - C1
```

用于分析：

```text
Chroma hierarchy
State differentiation
Palette progression
```

---

# 16. COLOR.DELTA_H

色相差不能简单使用：

```text
h2 - h1
```

必须采用圆周距离：

```text
Δh = shortestAngularDistance(h1,h2)
```

范围：

```text
-180° ≤ Δh ≤ 180°
```

---

# 17. COLOR.DELTA_E

UIQ 不把：

```text
OKLCH Euclidean Distance
```

直接等同于传统 ΔE。

Metric 必须声明所采用的差异公式和版本。

例如：

```text
COLOR.DELTA_E@method
```

必须包含：

```text
method
reference
version
```

从而避免：

```text
ΔE
```

成为含义不明确的黑盒指标。

---

# 18. COLOR.CONTRAST

Contrast 与 Color Difference 严格分离。

```text
COLOR.CONTRAST
```

支持：

```text
WCAG 2.x contrast ratio
APCA
```

结果必须携带算法：

```json
{
  "metric": "COLOR.CONTRAST",
  "method": "WCAG-2",
  "value": 4.52
}
```

或者：

```json
{
  "metric": "COLOR.CONTRAST",
  "method": "APCA",
  "value": 63.4
}
```

---

# 19. COLOR.GAMUT_DISTANCE

用于评价一个颜色距离目标色域边界的程度。

概念：

```text
Color
  ↓
Target Gamut
  ↓
Distance to Boundary
```

该指标用于：

- Theme Export
- Display Compatibility
- CSS Color Selection
- Palette Validation

V1.0 不把“越远越好”作为通用评价结论。

---

# 20. COLOR Metric Dependency

```text
sRGB
  │
  ▼
XYZ
  │
  ▼
OKLab
  │
  ├── L → COLOR.LIGHTNESS
  │
  ├── a,b
  │    └── COLOR.CHROMA
  │
  └── a,b
       └── COLOR.HUE
```

---

# 21. GEOMETRY Metric Registry

```text
GEOMETRY
│
├── WIDTH
├── HEIGHT
├── AREA
├── ASPECT_RATIO
├── CENTER_DISTANCE
├── EDGE_DISTANCE
└── OVERLAP
```

---

# 22. GEOMETRY.WIDTH

定义：

```text
WIDTH = Geometry.width
```

单位：

```text
px
```

Classification：

```text
BASE
```

---

# 23. GEOMETRY.HEIGHT

定义：

```text
HEIGHT = Geometry.height
```

单位：

```text
px
```

---

# 24. GEOMETRY.AREA

定义：

```text
AREA = width × height
```

单位：

```text
px²
```

---

# 25. GEOMETRY.ASPECT_RATIO

定义：

```text
ASPECT_RATIO = width / height
```

单位：

```text
ratio
```

---

# 26. GEOMETRY.CENTER_DISTANCE

两个元素：

```text
A
B
```

中心点：

```text
CA = (xA,yA)
CB = (xB,yB)
```

定义：

```text
d = sqrt(
    (xA-xB)² +
    (yA-yB)²
)
```

单位：

```text
px
```

---

# 27. GEOMETRY.EDGE_DISTANCE

两个元素之间最近边缘距离。

可分别计算：

```text
horizontal
vertical
Euclidean
```

---

# 28. GEOMETRY.OVERLAP

定义两个 Bounding Box 的交集面积：

```text
OverlapArea
```

并可产生：

```text
OverlapRatio
```

用于检测：

- 重叠
- 遮挡
- 布局冲突

---

# 29. TYPOGRAPHY Metric Registry

```text
TYPOGRAPHY
│
├── FONT_SIZE
├── FONT_WEIGHT
├── LINE_HEIGHT
├── LETTER_SPACING
├── TEXT_MEASURE
├── SCALE_RATIO
└── DENSITY
```

---

# 30. TYPOGRAPHY.FONT_SIZE

单位：

```text
px
```

Classification：

```text
BASE
```

---

# 31. TYPOGRAPHY.FONT_WEIGHT

例如：

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

注意：

Font Weight 是离散设计参数。

因此不应该把：

```text
700 - 400 = 300
```

简单解释成“视觉重量增加 300”。

它只是参数差异。

---

# 32. TYPOGRAPHY.LINE_HEIGHT

支持：

```text
absolute
ratio
```

例如：

```text
lineHeight = 24px
fontSize = 16px
```

得到：

```text
LINE_HEIGHT_RATIO = 1.5
```

---

# 33. TYPOGRAPHY.LETTER_SPACING

单位：

```text
px
```

---

# 34. TYPOGRAPHY.TEXT_MEASURE

用于描述文本行长度。

可以采用：

```text
px
character count
```

实际实现必须记录测量方法。

---

# 35. TYPOGRAPHY.SCALE_RATIO

两个文本层级：

```text
A
B
```

定义：

```text
ScaleRatio =
FontSize(A) / FontSize(B)
```

---

# 36. TYPOGRAPHY.DENSITY

文本密度不是简单的字符数量。

V1.0 定义基础形式：

```text
TextDensity =
CharacterCount / TextArea
```

但必须记录：

```text
measurementMethod
language
font
viewport
```

因为不同语言的字符密度不可直接等价比较。

---

# 37. SPACING Metric Registry

```text
SPACING
│
├── MARGIN
├── PADDING
├── GAP
├── DISTANCE
├── TOKEN_DEVIATION
└── SCALE_CONFORMANCE
```

---

# 38. SPACING.MARGIN

单位：

```text
px
```

---

# 39. SPACING.PADDING

单位：

```text
px
```

---

# 40. SPACING.GAP

定义两个相邻元素之间的布局间距。

```text
GAP = EdgeDistance
```

---

# 41. SPACING.TOKEN_DEVIATION

定义：

```text
D = Actual - Expected
```

以及：

```text
RelativeDeviation =
(Actual - Expected) / Expected
```

---

# 42. SPACING.SCALE_CONFORMANCE

用于评价实际 spacing 是否属于指定 Token Scale。

例如：

```text
Token Scale:
4 8 12 16 24 32
```

实际：

```text
13
```

最近 Token：

```text
12
```

结果：

```text
nearestToken = 12
deviation = 1
```

---

# 43. LAYOUT Metric Registry

```text
LAYOUT
│
├── ALIGNMENT
├── GRID_ALIGNMENT
├── DENSITY
├── SYMMETRY
└── RHYTHM
```

---

# 44. LAYOUT.ALIGNMENT

两个或多个元素共享某一空间轴线时，可以计算：

```text
AlignmentDeviation
```

例如：

```text
x1 = 120
x2 = 121
x3 = 120
```

均值：

```text
mean = 120.33
```

偏差：

```text
|xi - mean|
```

---

# 45. LAYOUT.GRID_ALIGNMENT

检测元素是否遵循指定 Grid。

例如：

```text
Grid = 8px
```

元素：

```text
x = 120
```

满足：

```text
120 % 8 = 0
```

则：

```text
GridAligned = true
```

---

# 46. LAYOUT.DENSITY

基础模型：

```text
Density =
VisualElementCount / Area
```

实际系统必须明确：

```text
densityScope
viewport
elementTypes
```

---

# 47. LAYOUT.SYMMETRY

对于具有明确几何结构的区域，可以评价：

```text
HorizontalSymmetry
VerticalSymmetry
RadialSymmetry
```

V1.0 将其作为：

```text
optional metric
```

而非通用 UI 质量标准。

---

# 48. HIERARCHY Metric Registry

```text
HIERARCHY
│
├── SEMANTIC_IMPORTANCE
├── VISUAL_SALIENCE
├── SALIENCE_DIFFERENCE
└── HIERARCHY_CONSISTENCY
```

---

# 49. HIERARCHY.SEMANTIC_IMPORTANCE

这是语义模型中的属性，而不是纯视觉测量。

例如：

```text
Primary Action = high
Secondary Action = medium
Metadata = low
```

实现可以映射为：

```text
importance ∈ [0,1]
```

但必须声明来源：

```text
designer
design-system
semantic-model
manual
```

---

# 50. HIERARCHY.VISUAL_SALIENCE

视觉显著性是 Composite Metric。

输入：

```text
Size
Contrast
Lightness
Chroma
Position
Weight
Isolation
```

输出：

```text
salienceVector
```

而不是强制输出一个“漂亮度”。

---

# 51. Salience Model

V1.0 定义：

```text
S =
F(
  Size,
  Contrast,
  Color,
  Typography,
  Position,
  Isolation
)
```

具体实现允许使用不同算法：

```text
SALIENCE-BASE
SALIENCE-HEURISTIC
SALIENCE-CUSTOM
```

但结果必须声明算法版本。

---

# 52. HIERARCHY.SALIENCE_DIFFERENCE

两个元素：

```text
A
B
```

定义：

```text
ΔS = S(A) - S(B)
```

用于评价：

```text
视觉层级差异
```

---

# 53. CONFORMANCE Metric Registry

```text
CONFORMANCE
│
├── TOKEN_MATCH
├── TOKEN_DEVIATION
├── TOKEN_FRAGMENTATION
└── COMPONENT_CONFORMANCE
```

---

# 54. CONFORMANCE.TOKEN_MATCH

判断：

```text
Actual == Token
```

结果：

```text
true
false
```

---

# 55. CONFORMANCE.TOKEN_DEVIATION

定义：

```text
Actual - Expected
```

根据类型产生不同的 Distance：

```text
Numeric Distance
Color Distance
String Equality
Vector Distance
```

---

# 56. CONFORMANCE.TOKEN_FRAGMENTATION

用于发现：

```text
多个实际值
```

是否造成不必要的 Token 分裂。

例如：

```text
12px
12px
13px
12px
```

其中：

```text
13px
```

可能是 Fragmentation Candidate。

注意：

UIQ 只能识别：

> 数据上的变异。

是否真的应该合并，需要设计规则或人工确认。

---

# 57. ACCESSIBILITY Metric Registry

```text
ACCESSIBILITY
│
├── CONTRAST
├── TARGET_SIZE
├── FOCUS_VISIBILITY
└── TEXT_LEGIBILITY
```

---

# 58. ACCESSIBILITY.CONTRAST

该 Metric 可以引用：

```text
COLOR.CONTRAST
```

因此：

```text
ACCESSIBILITY.CONTRAST
        │
        ▼
COLOR.CONTRAST
```

这是一个典型的 Metric Reuse。

---

# 59. ACCESSIBILITY.TARGET_SIZE

定义：

```text
TargetSize =
(width,height)
```

输出：

```text
width
height
area
```

具体是否满足某一标准，由 Evaluation Rule 决定。

---

# 60. ACCESSIBILITY.FOCUS_VISIBILITY

用于测量 Focus State 与 Default State 之间的视觉差异。

输入：

```text
defaultState
focusState
```

分析：

```text
Color Difference
Contrast Difference
Geometry Difference
Border Difference
Outline Difference
```

---

# 61. Metric Dependency Graph

V1.0 的总体依赖：

```text
                 Measurement
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
      COLOR       GEOMETRY      TYPOGRAPHY
        │             │             │
        └──────┬──────┴──────┬──────┘
               ▼             ▼
             LAYOUT       SPACING
               │             │
               └──────┬──────┘
                      ▼
                  HIERARCHY
                      │
                      ▼
                CONFORMANCE
                      │
                      ▼
                ACCESSIBILITY
```

---

# 62. Metric Result

统一结果结构：

```json
{
  "metricId": "COLOR.LIGHTNESS",
  "version": "1.0",
  "subject": "button.primary",
  "value": 0.62,
  "unit": "ratio",
  "status": "VALID",
  "inputs": [
    "measurement:color-001"
  ],
  "algorithm": "OKLAB-L-1.0"
}
```

---

# 63. Metric Status

```text
VALID
INVALID
UNDEFINED
NOT_APPLICABLE
```

---

# 64. Metric Error Model

Metric 计算失败不得伪装成：

```text
0
```

例如 Hue：

```text
C ≈ 0
```

结果应为：

```text
UNDEFINED
```

而不是：

```text
Hue = 0°
```

---

# 65. Metric Versioning

Metric 采用：

```text
Metric ID + Version
```

例如：

```text
COLOR.LIGHTNESS@1.0
COLOR.DELTA_E@1.0
HIERARCHY.VISUAL_SALIENCE@1.0
```

历史结果必须引用具体版本。

---

# 66. Metric Configuration

Metric 允许存在配置：

```json
{
  "metricId": "COLOR.CONTRAST",
  "method": "WCAG-2",
  "background": "#FFFFFF",
  "foreground": "#555555"
}
```

因此：

```text
Metric Definition
+
Metric Configuration
```

共同确定计算过程。

---

# 67. Metric Registry Entry 示例

```yaml
id: COLOR.LIGHTNESS
version: "1.0"

domain: COLOR
classification: BASE

subject:
  type: Color

input:
  - OKLab.L

output:
  type: scalar
  unit: ratio

range:
  min: 0
  max: 1

precision: 0.001

algorithm:
  id: OKLAB-L
  version: "1.0"
```

---

# 68. Registry Requirements

每一个正式 Metric 至少必须定义：

```text
ID
Version
Domain
Classification
Subject
Input
Output
Unit
Algorithm
Precision
Validity
Dependencies
```

缺少任一核心字段，不得进入：

```text
UIQ Official Metric Registry
```

---

# 69. Metric 与 Rule 的边界

正确：

```text
COLOR.CONTRAST
        ↓
4.2
        ↓
Rule
        ↓
FAIL
```

错误：

```text
COLOR.CONTRAST
        ↓
"BAD"
```

Metric 负责：

> 测量。

Rule 负责：

> 判断。

---

# 70. Metric 与 Recommendation 的边界

Metric：

```text
Spacing deviation = 1px
```

Rule：

```text
WARN
```

Diagnostic：

```text
Potential token deviation
```

Recommendation：

```text
Consider using spacing token.
```

四者不能混淆。

---

# 71. V1.0 Official Metric Set

第一版正式冻结：

### Color

```text
COLOR.SRGB
COLOR.XYZ
COLOR.OKLAB
COLOR.LIGHTNESS
COLOR.CHROMA
COLOR.HUE
COLOR.DELTA_L
COLOR.DELTA_C
COLOR.DELTA_H
COLOR.DELTA_E
COLOR.CONTRAST
COLOR.GAMUT_DISTANCE
```

### Geometry

```text
GEOMETRY.WIDTH
GEOMETRY.HEIGHT
GEOMETRY.AREA
GEOMETRY.ASPECT_RATIO
GEOMETRY.CENTER_DISTANCE
GEOMETRY.EDGE_DISTANCE
GEOMETRY.OVERLAP
```

### Typography

```text
TYPOGRAPHY.FONT_SIZE
TYPOGRAPHY.FONT_WEIGHT
TYPOGRAPHY.LINE_HEIGHT
TYPOGRAPHY.LETTER_SPACING
TYPOGRAPHY.TEXT_MEASURE
TYPOGRAPHY.SCALE_RATIO
TYPOGRAPHY.DENSITY
```

### Spacing

```text
SPACING.MARGIN
SPACING.PADDING
SPACING.GAP
SPACING.DISTANCE
SPACING.TOKEN_DEVIATION
SPACING.SCALE_CONFORMANCE
```

### Layout

```text
LAYOUT.ALIGNMENT
LAYOUT.GRID_ALIGNMENT
LAYOUT.DENSITY
LAYOUT.SYMMETRY
```

### Hierarchy

```text
HIERARCHY.SEMANTIC_IMPORTANCE
HIERARCHY.VISUAL_SALIENCE
HIERARCHY.SALIENCE_DIFFERENCE
```

### Conformance

```text
CONFORMANCE.TOKEN_MATCH
CONFORMANCE.TOKEN_DEVIATION
CONFORMANCE.TOKEN_FRAGMENTATION
CONFORMANCE.COMPONENT_CONFORMANCE
```

### Accessibility

```text
ACCESSIBILITY.CONTRAST
ACCESSIBILITY.TARGET_SIZE
ACCESSIBILITY.FOCUS_VISIBILITY
ACCESSIBILITY.TEXT_LEGIBILITY
```

---

# 72. Registry Freeze

UIQ-MR-01 V1.0 到此冻结 Metric Domain 和第一批核心 Metric。

后续扩展：

```text
V1.1
V1.2
V2.0
```

必须遵循版本治理规则，不允许直接修改 V1.0 Metric 的语义。

---

# 73. 下一层

Metric Registry 完成后，UIQ 的下一层不是继续增加 Metric。

而是：

```text
Metric
   ↓
Rule
   ↓
Evaluation
```

因此下一份正式规范为：

# UIQ-ER-01
# Evaluation Rule & Decision Specification V1.0

它将定义：

```text
Rule
Operator
Threshold
Tolerance
Severity
Applicability
Evaluation State
Finding
Decision
```

届时 UIQ 才形成完整闭环：

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

这也是 UIQ 从“指标库”真正进入“数字化评价系统”的关键一步。