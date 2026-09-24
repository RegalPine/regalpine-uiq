/**
 * P0-03 / AD-13：工程能力目录 v1.0.0，不是第二个运行时 Registry。
 * PRESENT 仅表示有实现；acceptance=PENDING 不得被解释为 AVAILABLE 或等级通过。
 * Schema 分为已存在的交换边界与待补的算法输入/输出细化，不能用外壳冒充完整校验。
 */
export interface CapabilityRecord {
  readonly kind: 'METRIC' | 'RULE' | 'RECOMMENDATION' | 'CONTRACT';
  readonly id: string;
  readonly version: '1.0.0';
  readonly stage: string;
  readonly implementation: 'PRESENT' | 'PLANNED';
  readonly acceptance: 'PENDING';
  readonly registration: 'DEFAULT' | 'EXPLICIT' | 'NONE';
  readonly entry: string | null;
  readonly sources: readonly string[];
  readonly schema: {
    readonly input: string | null;
    readonly output: string | null;
    readonly detail: 'DEFINED' | 'PENDING';
  };
  readonly golden: { readonly file: string; readonly id: string } | null;
  readonly gaps: readonly string[];
}

const CORE_SCHEMA = 'packages/core/schemas/contracts.schema.json#/$defs/';
const metricRows = [
  ['COLOR.SRGB', 'color/srgb', 'METRIC-GOLDEN-001', 'color'],
  ['COLOR.OKLAB', 'color/oklab', 'METRIC-GOLDEN-001', 'color'],
  ['COLOR.OKLCH', 'color/oklch', 'METRIC-GOLDEN-001', 'color'],
  ['COLOR.LIGHTNESS', 'color/lightness', 'METRIC-GOLDEN-001', 'color'],
  ['COLOR.CHROMA', 'color/chroma', 'METRIC-GOLDEN-001', 'color'],
  ['COLOR.HUE', 'color/hue', 'METRIC-GOLDEN-001', 'color'],
  ['COLOR.CONTRAST', 'color/contrast', 'METRIC-GOLDEN-001', 'color'],
  ['TYPOGRAPHY.FONT_SIZE', 'typography/font-size', 'METRIC-GOLDEN-002', 'typography'],
  ['TYPOGRAPHY.FONT_WEIGHT', 'typography/font-weight', 'METRIC-GOLDEN-002', 'typography'],
  ['TYPOGRAPHY.LINE_HEIGHT', 'typography/line-height', 'METRIC-GOLDEN-002', 'typography'],
  ['TYPOGRAPHY.LETTER_SPACING', 'typography/letter-spacing', 'METRIC-GOLDEN-002', 'typography'],
  ['TYPOGRAPHY.TEXT_MEASURE', 'typography/text-measure', 'METRIC-GOLDEN-002', 'typography'],
  ['TYPOGRAPHY.SCALE_RATIO', 'typography/scale-ratio', 'METRIC-GOLDEN-002', 'typography'],
  ['GEOMETRY.WIDTH', 'geometry/width', 'METRIC-GOLDEN-003', 'geometry'],
  ['GEOMETRY.HEIGHT', 'geometry/height', 'METRIC-GOLDEN-003', 'geometry'],
  ['GEOMETRY.AREA', 'geometry/area', 'METRIC-GOLDEN-003', 'geometry'],
  ['GEOMETRY.ASPECT_RATIO', 'geometry/aspect-ratio', 'METRIC-GOLDEN-003', 'geometry'],
  ['GEOMETRY.CENTER_DISTANCE', 'geometry/center-distance', 'METRIC-GOLDEN-003', 'geometry'],
  ['GEOMETRY.EDGE_DISTANCE', 'geometry/edge-distance', 'METRIC-GOLDEN-003', 'geometry'],
  ['GEOMETRY.OVERLAP', 'geometry/overlap', 'METRIC-GOLDEN-003', 'geometry'],
] as const;

const ruleRows = [
  ['ACCESSIBILITY.CONTRAST.WCAG_AA', 'color/contrast-wcag-aa'],
  ['TYPOGRAPHY.FONT_SIZE.MINIMUM', 'typography/font-size-minimum'],
  ['TYPOGRAPHY.LINE_HEIGHT.MINIMUM', 'typography/line-height-minimum'],
  ['GEOMETRY.OVERLAP.NONE', 'geometry/no-overlap'],
] as const;

export const LAYOUT_METRIC_IDS = [
  'LAYOUT.ALIGNMENT',
  'LAYOUT.GRID_ALIGNMENT',
  'LAYOUT.DENSITY',
  'LAYOUT.SYMMETRY',
  'LAYOUT.OVERFLOW',
  'LAYOUT.RESPONSIVE_SIZE_DELTA',
  'LAYOUT.RESPONSIVE_POSITION_DELTA',
  'LAYOUT.COMPONENT_SIZE_VARIANCE',
  'LAYOUT.SPACING_VARIANCE',
] as const;
export const LAYOUT_RULE_IDS = [
  'LAYOUT.ALIGNMENT.CONFORMANCE',
  'LAYOUT.GRID.CONFORMANCE',
  'LAYOUT.SPACING.CONFORMANCE',
  'LAYOUT.CONTAINER.CONSTRAINT',
  'LAYOUT.OVERFLOW.CONSTRAINT',
  'LAYOUT.DENSITY.RANGE',
  'LAYOUT.SYMMETRY.CONFORMANCE',
  'LAYOUT.COMPONENT.SIZE_CONSISTENCY',
  'LAYOUT.RESPONSIVE.CONSTRAINT',
  'LAYOUT.RESPONSIVE.NO_OVERFLOW',
  'LAYOUT.ORDER.CONFORMANCE',
] as const;

function planned(
  kind: CapabilityRecord['kind'],
  id: string,
  stage: string,
  source: string,
): CapabilityRecord {
  return {
    kind,
    id,
    version: '1.0.0',
    stage,
    implementation: 'PLANNED',
    acceptance: 'PENDING',
    registration: 'NONE',
    entry: null,
    sources: [source, 'UIQ-ARCH-01'],
    schema: { input: null, output: null, detail: 'PENDING' },
    golden: null,
    gaps: [`${stage}：需实现、细化 Schema 与独立 Golden 后才能注册`],
  };
}

export const CAPABILITY_CATALOG: readonly CapabilityRecord[] = [
  ...metricRows.map(
    ([id, file, goldenId, domain]): CapabilityRecord => ({
      kind: 'METRIC',
      id,
      version: '1.0.0',
      stage: 'P2',
      implementation: 'PRESENT',
      acceptance: 'PENDING',
      registration: 'DEFAULT',
      entry: `packages/metrics/src/builtins/${file}.ts`,
      sources: ['UIQ-IMPL-05', 'UIQ-METRIC-01', 'UIQ-ARCH-01'],
      schema: {
        input: `${CORE_SCHEMA}MeasurementSnapshot`,
        output: `${CORE_SCHEMA}MetricResult`,
        detail: 'PENDING',
      },
      golden:
        id === 'TYPOGRAPHY.SCALE_RATIO'
          ? null
          : { file: `tests/golden/metrics/${domain}-golden.test.ts`, id: goldenId },
      gaps: [
        'P2-03/05：可选依赖、配置缓存与 trace 未闭合',
        '领域细化 Schema 与逐指标独立 Golden 仍需补齐',
      ],
    }),
  ),
  ...(['RESOLUTION', 'MATCH', 'DEVIATION'] as const).map(
    (name): CapabilityRecord => ({
      kind: 'METRIC',
      id: `TOKEN.${name}`,
      version: '1.0.0',
      stage: 'P5',
      implementation: 'PRESENT',
      acceptance: 'PENDING',
      registration: 'EXPLICIT',
      entry: `packages/metrics/src/builtins/token/${name.toLowerCase()}.ts`,
      sources: ['UIQ-IMPL-09', 'UIQ-ARCH-01'],
      schema: {
        input: `${CORE_SCHEMA}MeasurementSnapshot`,
        output: `${CORE_SCHEMA}MetricResult`,
        detail: 'PENDING',
      },
      golden: {
        file: 'tests/golden/token/token-golden.test.ts',
        id: name === 'DEVIATION' ? 'TOKEN-GOLDEN-002' : 'TOKEN-GOLDEN-001',
      },
      gaps: [
        '解析端口/配置须由调用方显式注入',
        'P5-05：真实 CLI 绑定采集未接通',
        '细化 Schema 未闭合',
      ],
    }),
  ),
  ...ruleRows.map(
    ([id, file]): CapabilityRecord => ({
      kind: 'RULE',
      id,
      version: '1.0.0',
      stage: 'P3',
      implementation: 'PRESENT',
      acceptance: 'PENDING',
      registration: 'DEFAULT',
      entry: `packages/rules/src/builtins/${file}.ts`,
      sources: ['UIQ-IMPL-06', 'UIQ-ER-02', 'UIQ-ARCH-01'],
      schema: {
        input: `${CORE_SCHEMA}MetricResult`,
        output: `${CORE_SCHEMA}EvaluationResult`,
        detail: 'PENDING',
      },
      golden:
        id === 'ACCESSIBILITY.CONTRAST.WCAG_AA'
          ? { file: 'tests/golden/rules/contrast-golden.test.ts', id: 'RULE-GOLDEN-001' }
          : null,
      gaps: ['P3-01/02：版本/配置校验、ERROR 传播与上下文未闭合'],
    }),
  ),
  ...(
    [
      ['TOKEN.TOKEN_MATCH', 'token-match'],
      ['TOKEN.COMPONENT_CONFORMANCE', 'component-conformance'],
    ] as const
  ).map(
    ([id, file]): CapabilityRecord => ({
      kind: 'RULE',
      id,
      version: '1.0.0',
      stage: 'P5',
      implementation: 'PRESENT',
      acceptance: 'PENDING',
      registration: 'EXPLICIT',
      entry: `packages/rules/src/builtins/token/${file}.ts`,
      sources: ['UIQ-IMPL-09', 'UIQ-ER-02', 'UIQ-ARCH-01'],
      schema: {
        input: `${CORE_SCHEMA}MetricResult`,
        output: `${CORE_SCHEMA}EvaluationResult`,
        detail: 'PENDING',
      },
      golden: { file: 'tests/golden/token/token-golden.test.ts', id: 'TOKEN-GOLDEN-001' },
      gaps: ['P5-05：双轨实测闭环未闭合'],
    }),
  ),
  ...[
    'ACCESSIBILITY',
    'COLOR',
    'TYPOGRAPHY',
    'SPACING',
    'TOKEN',
    'COMPONENT',
    'THEME',
    'UNKNOWN',
  ].map(
    (domain): CapabilityRecord => ({
      kind: 'RECOMMENDATION',
      id: `REC-${domain}-001`,
      version: '1.0.0',
      stage: 'P7',
      implementation: 'PRESENT',
      acceptance: 'PENDING',
      registration: 'DEFAULT',
      entry: 'packages/reporting/src/recommendation/rules/initial-rules.ts',
      sources: ['UIQ-IMPL-17', 'UIQ-REPORT-01', 'UIQ-ARCH-01'],
      schema: {
        input: null,
        output:
          'packages/reporting/schemas/ui-quality-report.schema.json#/properties/recommendations/items',
        detail: 'PENDING',
      },
      golden:
        domain === 'ACCESSIBILITY'
          ? { file: 'tests/golden/reporting.test.ts', id: 'RPT-002' }
          : null,
      gaps: ['P7：建议触发身份、完整验证条件与重测证据待验收；Golden 文件不是逐条规则通过声明'],
    }),
  ),
  ...[
    'MeasurementSnapshot',
    'MetricResult',
    'EvaluationResult',
    'Finding',
    'DesignToken',
    'Theme',
    'TokenBinding',
    'ComponentContract',
  ].map(
    (id): CapabilityRecord => ({
      kind: 'CONTRACT',
      id,
      version: '1.0.0',
      stage: ['DesignToken', 'Theme', 'TokenBinding', 'ComponentContract'].includes(id)
        ? 'P5'
        : 'P1',
      implementation: 'PRESENT',
      acceptance: 'PENDING',
      registration: 'NONE',
      entry: 'packages/core/src/contracts.ts',
      sources: ['UIQ-IMPL-03', 'UIQ-IMPL-09', 'UIQ-ARCH-01'],
      schema: { input: `${CORE_SCHEMA}${id}`, output: `${CORE_SCHEMA}${id}`, detail: 'DEFINED' },
      golden: null,
      gaps: ['Schema 定义不等于所有调用方运行时验证完成；FM-01 尚缺失'],
    }),
  ),
  ...[
    'TYPOGRAPHY.DENSITY',
    'SPACING.MARGIN',
    'SPACING.PADDING',
    'SPACING.GAP',
    'SPACING.DISTANCE',
    'SPACING.SCALE_CONFORMANCE',
  ].map((id) => planned('METRIC', id, 'P2', 'UIQ-MR-01')),
  ...LAYOUT_METRIC_IDS.map(
    (id): CapabilityRecord => ({
      kind: 'METRIC',
      id,
      version: '1.0.0',
      stage: 'P8',
      implementation: 'PRESENT',
      acceptance: 'PENDING',
      registration: 'EXPLICIT',
      entry: `packages/metrics/src/layout/`,
      sources: ['UIQ-LAYOUT-02', 'UIQ-LAYOUT-08', 'UIQ-ARCH-01'],
      schema: { input: null, output: null, detail: 'DEFINED' },
      golden: null,
      gaps: ['算法已实现为纯函数；MetricDefinition 包装与引擎注册待 P8-02 闭合'],
    }),
  ),
  ...LAYOUT_RULE_IDS.map(
    (id): CapabilityRecord => ({
      kind: 'RULE',
      id,
      version: '1.0.0',
      stage: 'P8',
      implementation: 'PRESENT',
      acceptance: 'PENDING',
      registration: 'EXPLICIT',
      entry: `packages/rules/src/layout/`,
      sources: ['UIQ-LAYOUT-03', 'UIQ-LAYOUT-08', 'UIQ-ARCH-01'],
      schema: { input: null, output: null, detail: 'DEFINED' },
      golden: null,
      gaps: ['算法已实现为纯函数；RuleDefinition 包装与引擎注册待 P8-03 闭合'],
    }),
  ),
  ...['LayoutGroup', 'LayoutConstraint'].map(
    (id): CapabilityRecord => ({
      kind: 'CONTRACT',
      id,
      version: '1.0.0',
      stage: 'P8',
      implementation: 'PRESENT',
      acceptance: 'PENDING',
      registration: 'NONE',
      entry: 'packages/measurement/src/layout/types.ts',
      sources: ['UIQ-LAYOUT-07', 'UIQ-LAYOUT-04', 'UIQ-ARCH-01'],
      schema: { input: null, output: null, detail: 'DEFINED' },
      golden: null,
      gaps: ['类型已定义；JSON Schema 待补'],
    }),
  ),
];

// 算法/版本未冻结，不虚构正式 ID 或版本，也不列入可注册能力。
export const UNSUPPORTED_ALGORITHMS = [
  { name: 'APCA', reason: '算法与版本基线未冻结，不替换 WCAG 亮度比' },
  { name: 'CIEDE2000', reason: '未实现；不能用 OKLab 欧氏距离冒充' },
] as const;

/** P0-04：仅独立推导的待执行布局反例；P8 之前不得计为 Golden 通过。 */
export const PLANNED_LAYOUT_GOLDENS = [
  {
    category: 'G2',
    id: 'P8-ALIGNMENT-SIGNED',
    version: '1.0.0',
    state: 'PLANNED',
    decision: 'AD-15',
    input: { coordinates: [10, 14, 6], reference: 10 },
    expected: [0, 4, -4],
    derivation: '逐成员坐标减 reference；绝对数组会丢失方向，不能用于 ORDER',
  },
  {
    category: 'G6',
    id: 'P8-DENSITY-CLIPPED',
    version: '1.0.0',
    state: 'PLANNED',
    decision: 'AD-16',
    input: {
      container: [0, 0, 10, 10],
      children: [
        [-5, 0, 10, 10],
        [0, 0, 10, 10],
      ],
    },
    expected: { unionArea: 100, unionDensity: 1, rawDensity: 2 },
    derivation: '矩形格式 x/y/width/height；裁剪后 50 与 100 重合，并集100；RAW为未裁剪面积200/100',
  },
  {
    category: 'G2',
    id: 'P8-ORDER-DIRECTION',
    version: '1.0.0',
    state: 'PLANNED',
    decision: 'AD-17',
    input: { expectedOrder: ['a', 'b'], x: { a: 14, b: 6 } },
    expected: { directedGap: -8, conforms: false },
    derivation: '同轴 b.x-a.x=-8；不能对偏差取绝对值后声称顺序一致',
  },
  {
    category: 'G1',
    id: 'P8-GEOMETRY-NEGATIVE-ORIGIN',
    version: '1.0.0',
    state: 'PLANNED',
    decision: 'AD-15',
    input: { rect: [-10, -20, 30, 20] },
    expected: { area: 600, right: 20, bottom: 0 },
    derivation:
      '矩形格式 x/y/width/height，面积30*20，right=-10+30，bottom=-20+20；负坐标不是非法尺寸',
  },
  {
    category: 'G3',
    id: 'P8-GRID-NEGATIVE',
    version: '1.0.0',
    state: 'PLANNED',
    decision: 'AD-15',
    input: { coordinate: -9, origin: 0, step: 8 },
    expected: { nearestGrid: -8, signedDeviation: -1 },
    derivation: '-9距-8为1、距-16为7；有向偏差=-9-(-8)，负坐标不能使用未归一化余数',
  },
  {
    category: 'G4',
    id: 'P8-SPACING-EQUAL-GAPS',
    version: '1.0.0',
    state: 'PLANNED',
    decision: 'AD-15',
    input: { axis: 'x', starts: [0, 18, 36], widths: [10, 10, 10], order: ['a', 'b', 'c'] },
    expected: { gaps: [8, 8], variance: 0 },
    derivation: '显式顺序下gap=next.start-(start+width)，两间隔相同，方差为0；不猜测顺序',
  },
  {
    category: 'G5',
    id: 'P8-CONTAINER-MINIMUM',
    version: '1.0.0',
    state: 'PLANNED',
    decision: 'AD-17',
    input: { width: 9, minWidth: 10, tolerance: 0 },
    expected: { state: 'FAIL' },
    derivation: '9<10，显式最小宽度约束不满足；无额外容差',
  },
  {
    category: 'G7',
    id: 'P8-SYMMETRY-PAIR',
    version: '1.0.0',
    state: 'PLANNED',
    decision: 'AD-15',
    input: { axis: 'x', symmetryAxis: 50, centers: { a: 20, b: 80 }, pairs: [['a', 'b']] },
    expected: { mirroredCenterError: 0 },
    derivation: 'a的镜像坐标=2*50-20=80，与显式配对b相同',
  },
  {
    category: 'G8',
    id: 'P8-OVERFLOW-FOUR-SIDES',
    version: '1.0.0',
    state: 'PLANNED',
    decision: 'AD-15',
    input: { container: [0, 0, 10, 10], child: [-2, -1, 15, 13] },
    expected: { left: 2, top: 1, right: 3, bottom: 2 },
    derivation: 'child.right=-2+15=13，bottom=-1+13=12；相对容器四边逐项取正向超出量',
  },
  {
    category: 'G9',
    id: 'P8-RESPONSIVE-SOURCES',
    version: '1.0.0',
    state: 'PLANNED',
    decision: 'AD-18',
    input: {
      subjectId: 'a',
      before: { snapshotId: 'A', viewport: 1440, width: 100, x: 10 },
      after: { snapshotId: 'B', viewport: 800, width: 80, x: 12 },
    },
    expected: { widthDelta: -20, positionDelta: 2, sourceSnapshotIds: ['A', 'B'] },
    derivation:
      '同一稳定subject两次采集，after-before分别为80-100和12-10；保留A/B，不能改写输入快照',
  },
  {
    category: 'G10',
    id: 'P8-COMPONENT-VARIANCE',
    version: '1.0.0',
    state: 'PLANNED',
    decision: 'AD-15',
    input: { componentType: 'button', widths: [10, 12, 14], heights: [4, 4, 4] },
    expected: { meanWidth: 12, populationWidthVariance: 8 / 3, populationHeightVariance: 0 },
    derivation: '总体方差=[(-2)^2+0^2+2^2]/3=8/3；不使用样本方差分母n-1',
  },
  {
    category: 'G11',
    id: 'P8-CONSTRAINT-CONFLICT',
    version: '1.0.0',
    state: 'PLANNED',
    decision: 'AD-17',
    input: {
      constraints: [
        { id: 'min', minWidth: 20 },
        { id: 'max', maxWidth: 10 },
      ],
      priority: 'EQUAL',
    },
    expected: { code: 'CONSTRAINT_CONFLICT', constraintIds: ['min', 'max'] },
    derivation: '相同优先级下w>=20和w<=10无解；不得静默丢弃一侧或平均为15',
  },
  {
    category: 'G12',
    id: 'P8-THEME-INDEPENDENCE',
    version: '1.0.0',
    state: 'PLANNED',
    decision: 'AD-14',
    input: { light: { gap: 8, expected: 8 }, dark: { gap: 12, expected: 12 } },
    expected: { light: 'PASS', dark: 'PASS' },
    derivation: '两主题各按自身契约8=8、12=12评价；不得平均为10后与单一契约比较',
  },
  {
    category: 'G13',
    id: 'P8-REGRESSION-FIX',
    version: '1.0.0',
    state: 'PLANNED',
    decision: 'AD-23',
    input: {
      subjectId: 'a',
      rule: 'LAYOUT.ALIGNMENT.CONFORMANCE@1.0.0',
      sameEnvironmentAndConfig: true,
      before: { snapshotId: 'A', state: 'FAIL' },
      after: { snapshotId: 'B', state: 'PASS' },
    },
    expected: { category: 'FIXED_FAILURE' },
    derivation:
      '同身份/配置/环境且重新采集，已存在评价FAIL到PASS；目标消失或版本变化不能套用此分类',
  },
  {
    category: 'G14',
    id: 'P8-UNKNOWN-ERROR',
    version: '1.0.0',
    state: 'PLANNED',
    decision: 'AD-09',
    input: { absentGroup: null, invalidRect: [0, 0, -1, 10] },
    expected: { absentGroup: 'UNKNOWN', invalidRect: 'ERROR' },
    derivation: '没有显式分组是证据不足；负width是非法输入。两者不能作为0偏差或PASS',
  },
] as const;
