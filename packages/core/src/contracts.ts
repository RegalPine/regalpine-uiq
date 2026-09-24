export type EntityId = string;
export type EntityType =
  | 'PROJECT'
  | 'PAGE'
  | 'REGION'
  | 'COMPONENT'
  | 'ELEMENT'
  | 'CONTENT'
  | 'INTERACTION'
  | 'TOKEN'
  | 'THEME';
export interface UIQEntity {
  readonly id: EntityId;
  readonly type: EntityType;
}

export type MeasurementStatus = 'AVAILABLE' | 'UNKNOWN' | 'ERROR';
export interface MeasurementSource {
  readonly type: 'BROWSER' | 'STATIC' | 'TOKEN' | 'IMPORT' | 'MANUAL' | 'OTHER';
  readonly adapter?: string;
  readonly version?: string;
}
export interface Measurement<T = unknown> {
  readonly id: string;
  readonly subjectId: EntityId;
  readonly type: string;
  readonly value: T;
  readonly unit?: string;
  readonly source: MeasurementSource;
  readonly status: MeasurementStatus;
  readonly timestamp: number;
  readonly metadata?: Readonly<Record<string, unknown>>;
}
export interface MeasurementEnvironment {
  readonly viewport?: { readonly width: number; readonly height: number };
  readonly devicePixelRatio?: number;
  readonly zoom?: number;
  readonly browser?: { readonly name: string; readonly version: string };
  /** IMPL-07 §52：viewport-relative 坐标受滚动影响，快照必须记录滚动位置。 */
  readonly scrollX?: number;
  readonly scrollY?: number;
}
export interface MeasurementSnapshot {
  readonly id: string;
  readonly capturedAt: number;
  readonly source: MeasurementSource;
  readonly environment?: MeasurementEnvironment;
  readonly measurements: readonly Measurement[];
  /** P5（IMPL-09 §32-33）：采集端绑定投影；无绑定证据的 subject 不在此出现强制 tokenId。 */
  readonly bindings?: readonly TokenBinding[];
}

/**
 * Token 契约族（P5，归属 core：browser 采集、rules 消费、metrics 计算均需引用，
 * 且三者被白名单禁止依赖 @uiq/tokens —— ARCH-01 §4.2；AD-14 双字段投影）。
 */
export type TokenLayer = 'PRIMITIVE' | 'SEMANTIC' | 'COMPONENT';
export type TokenValueType =
  | 'COLOR'
  | 'TYPOGRAPHY'
  | 'SPACING'
  | 'SIZE'
  | 'RADIUS'
  | 'BORDER'
  | 'SHADOW'
  | 'OPACITY'
  | 'MOTION'
  | 'Z_INDEX'
  | 'OTHER';
/** AD-14：导入按显式 dialect 解析 TK-01/IMPL-09 对 type 的不同用法，内部只用 layer + valueType。 */
export interface DesignToken {
  readonly id: string;
  readonly name: string;
  readonly layer: TokenLayer;
  readonly valueType: TokenValueType;
  readonly value?: unknown;
  readonly reference?: string;
  readonly unit?: string;
  readonly role?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}
/** 运行时契约以 IMPL-09 §20 为准（tokens 为覆盖值映射），补 version（TK-01 §63 可重放）。 */
export interface Theme {
  readonly id: string;
  readonly version: string;
  readonly name: string;
  readonly tokens: Readonly<Record<string, unknown>>;
  readonly metadata?: Readonly<Record<string, unknown>>;
}
/** IMPL-09 §41：三类绑定；UNRESOLVED 不得强行推断 tokenId（AC-THEME-06）。 */
export interface TokenBinding {
  readonly subjectId: EntityId;
  readonly tokenId?: string;
  readonly bindingType: 'EXPLICIT' | 'INFERRED' | 'UNRESOLVED';
  readonly source?: string;
  readonly confidence: 'DIRECT' | 'SUPPORTED' | 'INFERRED' | 'UNKNOWN';
}
/** IMPL-13 §28 / IMPL-09 §46-47：组件 Token 契约，版本化。 */
export interface ComponentContract {
  readonly id: string;
  readonly version: string;
  readonly requiredTokens: readonly string[];
  readonly optionalTokens?: readonly string[];
  readonly states?: readonly string[];
}
export type MetricKind = 'BASE' | 'DERIVED' | 'COMPOSITE' | 'EXPERIMENTAL';
export interface MetricDependency {
  readonly metricId: string;
  readonly version: string;
  readonly required: boolean;
}
export interface MetricResult<T = unknown> {
  readonly metricId: string;
  readonly metricVersion: string;
  readonly subjectId: EntityId;
  readonly value?: T;
  readonly unit?: string;
  readonly status: MeasurementStatus;
  readonly dependencies: readonly MetricDependency[];
  readonly fingerprint: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}
export interface MetricCalculationContext {
  readonly subjectId: EntityId;
  readonly snapshot: MeasurementSnapshot;
  readonly dependencies: ReadonlyMap<string, MetricResult>;
}
export interface MetricDescriptor {
  readonly id: string;
  readonly version: string;
  readonly kind: MetricKind;
  readonly dependencies: readonly MetricDependency[];
}
export interface MetricDefinition<T = unknown> extends MetricDescriptor {
  calculate(context: MetricCalculationContext): MetricResult<T>;
}
export interface MetricRegistry {
  register<T>(metric: MetricDefinition<T>): void;
  get(id: string, version: string): MetricDefinition | undefined;
  has(id: string, version: string): boolean;
  list(): readonly MetricDefinition[];
}
export type ComparisonOperator = 'EQ' | 'NE' | 'GT' | 'GTE' | 'LT' | 'LTE' | 'IN' | 'NOT_IN';
export interface NumericRange {
  readonly min?: number;
  readonly max?: number;
  readonly minInclusive?: boolean;
  readonly maxInclusive?: boolean;
}
export type ToleranceType = 'ABSOLUTE' | 'RELATIVE';
export interface Tolerance {
  readonly type: ToleranceType;
  readonly value: number;
}
export type Severity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type Applicability = 'APPLICABLE' | 'NOT_APPLICABLE' | 'UNKNOWN';
export interface RuleApplicabilityContext {
  readonly subjectId: EntityId;
  readonly snapshot: MeasurementSnapshot;
  readonly metricResult: MetricResult;
}
export interface ApplicabilityDefinition {
  evaluate(context: RuleApplicabilityContext): Applicability;
}
export interface RuleDescriptor {
  readonly id: string;
  readonly version: string;
  readonly metricId: string;
  readonly metricVersion: string;
  readonly operator?: ComparisonOperator;
  /** P5（ER-02 §59）：TOKEN_MATCH 等规则需对字符串值做 EQ 比较，threshold 支持 string。 */
  readonly threshold?: number | string;
  readonly range?: NumericRange;
  readonly tolerance?: Tolerance;
  readonly severity: Severity;
}
export interface RuleDefinition extends RuleDescriptor {
  readonly applicability: ApplicabilityDefinition;
}
export interface RuleConfiguration {
  readonly ruleId: string;
  readonly ruleVersion: string;
  readonly values: Readonly<Record<string, unknown>>;
}
export interface RuleRegistry {
  register(rule: RuleDefinition): void;
  get(id: string, version: string): RuleDefinition | undefined;
  has(id: string, version: string): boolean;
  list(): readonly RuleDefinition[];
}
export type EvaluationState = 'PASS' | 'FAIL' | 'WARN' | 'NOT_APPLICABLE' | 'UNKNOWN' | 'ERROR';
export type EvidenceType = 'METRIC' | 'MEASUREMENT' | 'TOKEN' | 'DOM' | 'RULE_CONFIGURATION';
export type EvidenceRelation =
  | 'MEASURED_FROM'
  | 'DERIVED_FROM'
  | 'EVALUATED_BY'
  | 'RESOLVED_FROM'
  | 'DEFINED_BY'
  | 'USED_BY'
  | 'OVERRIDES'
  | 'DEVIATES_FROM';
export interface Evidence {
  readonly id: string;
  readonly type: EvidenceType;
  readonly referenceId: string;
  readonly relation: EvidenceRelation;
}
export interface EvaluationResult {
  readonly ruleId: string;
  readonly ruleVersion: string;
  readonly subjectId: EntityId;
  readonly state: EvaluationState;
  readonly severity: Severity;
  readonly metricResult: MetricResult;
  readonly evidence: readonly Evidence[];
  readonly fingerprint: string;
  readonly message?: string;
}
export type FindingState = 'DETECTED' | 'DIAGNOSED' | 'RESOLVED' | 'VERIFIED';
export type FindingType =
  | 'VALUE_VIOLATION'
  | 'ACCESSIBILITY'
  | 'TOKEN_DEVIATION'
  | 'COMPONENT_DEVIATION'
  | 'THEME_DEVIATION'
  | 'LAYOUT_RELATIONSHIP'
  | 'TYPOGRAPHY'
  | 'COLOR'
  | 'UNKNOWN_CAUSE'
  | 'EXECUTION_ERROR';
export interface Finding {
  readonly id: string;
  readonly fingerprint: string;
  readonly type: FindingType;
  readonly state: FindingState;
  readonly severity: Severity;
  readonly subjectId: EntityId;
  readonly evaluation: EvaluationResult;
  readonly evidence: readonly Evidence[];
  readonly createdAt: number;
  readonly updatedAt: number;
}
export type DiagnosticType = FindingType;
export type DiagnosticCause =
  | 'MEASUREMENT'
  | 'METRIC'
  | 'TOKEN'
  | 'COMPONENT'
  | 'THEME'
  | 'CONFIGURATION'
  | 'UNKNOWN';
export interface Diagnostic {
  readonly id: string;
  readonly findingId: string;
  readonly type: DiagnosticType;
  readonly cause: DiagnosticCause;
  readonly confidence: 'DIRECT' | 'SUPPORTED' | 'INFERRED' | 'UNKNOWN';
  readonly evidence: readonly Evidence[];
  readonly explanation: string;
}
export interface EngineInfo {
  readonly name: string;
  readonly version: string;
}
export interface ExecutionContext {
  readonly engine: EngineInfo;
  readonly snapshot: MeasurementSnapshot;
  readonly metrics: MetricRegistry;
  readonly rules: RuleRegistry;
  readonly configuration: Readonly<Record<string, unknown>>;
}
export interface FingerprintInput {
  readonly type: string;
  readonly version: string;
  readonly subjectId: string;
  readonly data: unknown;
}
