import type { ExecutionContext, MeasurementSnapshot } from '../contracts';

/**
 * Visual Texture 七维度标识。
 * 规范基线：UIQ-VISUAL-QUALITY-08 §2.2
 */
export type VisualTextureDimension =
  | 'SURFACE'
  | 'DEPTH'
  | 'COLOR'
  | 'TYPOGRAPHY'
  | 'SPATIAL'
  | 'MOTION'
  | 'MICRO_DETAIL';

/**
 * Visual Texture Profile — 定义一次视觉质感分析所涉及的维度集合。
 */
export interface VisualTextureProfile {
  readonly id: string;
  readonly version: string;
  readonly name: string;
  readonly dimensions: readonly VisualTextureDimension[];
}

/**
 * Visual Texture 执行上下文 — 包装已有 ExecutionContext 并附加 Texture 维度信息。
 */
export interface VisualTextureExecutionContext {
  readonly profile: VisualTextureProfile;
  readonly executionContext: ExecutionContext;
  readonly snapshot: MeasurementSnapshot;
  readonly dimensions: readonly VisualTextureDimension[];
  readonly configuration: Readonly<Record<string, unknown>>;
}

// ---------------------------------------------------------------------------
// 证据模型（架构 §6.4-6.5）
// ---------------------------------------------------------------------------

/**
 * 证据引用 — 指向一条具体的测量或评价证据。
 */
export interface EvidenceReference {
  readonly id: string;
  readonly source: string;
  readonly type: string;
  readonly value: unknown;
}

/**
 * Visual Texture 顶层证据 — 一次完整分析的根对象。
 */
export interface VisualTextureEvidence {
  readonly id: string;
  readonly version: string;
  readonly projectId: string;
  readonly pageId?: string;
  readonly snapshotId: string;
  readonly dimensions: readonly VisualTextureDimensionEvidence[];
  readonly crossDimensionRelations: readonly CrossDimensionRelation[];
  readonly findings: readonly TextureFinding[];
  readonly diagnostics: readonly TextureDiagnostic[];
  readonly recommendations: readonly TextureRecommendation[];
  readonly verification: readonly TextureVerification[];
  readonly reproducibility: readonly VisualTextureReproducibility[];
}

/**
 * 维度级证据 — 单个维度的全部度量与评价结果。
 */
export interface VisualTextureDimensionEvidence {
  readonly dimension: VisualTextureDimension;
  readonly metrics: readonly unknown[];
  readonly evaluations: readonly unknown[];
  readonly findings: readonly unknown[];
  readonly diagnostics: readonly unknown[];
}

/**
 * Texture Finding — 扩展 Finding 语义，携带维度信息。
 */
export interface TextureFinding {
  readonly id: string;
  readonly ruleId: string;
  readonly dimension: VisualTextureDimension;
  readonly state: 'PASS' | 'WARN' | 'FAIL' | 'UNKNOWN';
  readonly evidence: readonly EvidenceReference[];
}

/**
 * Texture Diagnostic — 对 Finding 的可解释诊断。
 */
export interface TextureDiagnostic {
  readonly id: string;
  readonly findingId: string;
  readonly dimension: VisualTextureDimension;
  readonly explanation: string;
  readonly rootCause: string;
}

/**
 * Texture Recommendation — 基于 Diagnostic 的改进建议。
 */
export interface TextureRecommendation {
  readonly id: string;
  readonly diagnosticId: string;
  readonly dimension: VisualTextureDimension;
  readonly action: string;
  readonly priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * Texture Verification — 验证标准，用于回归对比。
 */
export interface TextureVerification {
  readonly id: string;
  readonly findingId: string;
  readonly criterion: string;
  readonly expectedState: 'PASS' | 'WARN' | 'FAIL';
  readonly baselineFingerprint: string;
}

/**
 * 可复现性信息。
 */
export interface VisualTextureReproducibility {
  readonly snapshotId: string;
  readonly viewport: string;
  readonly theme: string;
  readonly timestamp: string;
}

// ---------------------------------------------------------------------------
// 跨维度关系（架构 §6.6, §10.3）
// ---------------------------------------------------------------------------

/**
 * 跨维度关系类型。
 */
export type CrossDimensionRelationType =
  | 'CORRELATED'
  | 'DEPENDS_ON'
  | 'AMPLIFIES'
  | 'CONTRIBUTES_TO'
  | 'CONSTRAINS'
  | 'SHARES_TOKEN'
  | 'SHARES_COMPONENT'
  | 'SHARES_THEME'
  | 'SHARES_STATE';

/**
 * 跨维度关系证据。
 */
export interface CrossDimensionRelation {
  readonly sourceDimension: VisualTextureDimension;
  readonly targetDimension: VisualTextureDimension;
  readonly sourceEvidenceId: string;
  readonly targetEvidenceId: string;
  readonly relation: CrossDimensionRelationType;
  readonly confidence: 'DIRECT' | 'SUPPORTED' | 'INFERRED' | 'UNKNOWN';
}

// ---------------------------------------------------------------------------
// 系统性模式（架构 §6.7, §10.4）
// ---------------------------------------------------------------------------

/**
 * 系统性模式类型。
 */
export type SystemicPatternType =
  | 'TOKEN_SYSTEMIC'
  | 'COMPONENT_SYSTEMIC'
  | 'THEME_SYSTEMIC'
  | 'STATE_SYSTEMIC'
  | 'LAYOUT_SYSTEMIC'
  | 'TYPOGRAPHY_SYSTEMIC'
  | 'COLOR_SYSTEMIC'
  | 'MOTION_SYSTEMIC'
  | 'CROSS_DIMENSION_SYSTEMIC'
  | 'UNKNOWN_SYSTEMIC';

/**
 * 系统性模式 — 跨维度聚合后识别出的重复性问题。
 */
export interface SystemicPattern {
  readonly id: string;
  readonly type: SystemicPatternType;
  readonly scope: 'ELEMENT' | 'COMPONENT' | 'REGION' | 'PAGE' | 'PROJECT';
  readonly dimensions: readonly VisualTextureDimension[];
  readonly findingIds: readonly string[];
  readonly evidence: readonly EvidenceReference[];
  readonly confidence: 'DIRECT' | 'SUPPORTED' | 'INFERRED' | 'UNKNOWN';
}

// ---------------------------------------------------------------------------
// 覆盖率（架构 §14.3）
// ---------------------------------------------------------------------------

/**
 * 证据覆盖率 — 表示当前维度获得了多少有效证据。
 */
export interface EvidenceCoverage {
  readonly applicableCount: number;
  readonly measuredCount: number;
  readonly evaluatedCount: number;
  readonly unknownCount: number;
  readonly errorCount: number;
  readonly notApplicableCount: number;
}

// ---------------------------------------------------------------------------
// 跨组件视觉连续性（Cross-Component Visual Continuity）
// 规范基线：UIQ-CROSS-COMPONENT-VISUAL-CONTINUITY §3-6
// ---------------------------------------------------------------------------

/**
 * 置信度等级。
 */
export type ConfidenceLevel = 'DIRECT' | 'SUPPORTED' | 'INFERRED' | 'UNKNOWN';

/**
 * 组件边界 — 标识一个组件的渲染范围和度量归属。
 * 对齐 IMPL-13 §28 Component Contract。
 */
export interface ComponentBoundary {
  readonly componentId: string;
  readonly instanceId?: string;
  readonly rootElementId: string;
  readonly memberElementIds: readonly string[];
  readonly role: 'root' | 'child' | 'container';
  readonly source: 'EXPLICIT' | 'INFERRED';
  readonly confidence: ConfidenceLevel;
}

/**
 * 组件间关系类型。
 */
export type ComponentRelationType =
  | 'ADJACENT'
  | 'PARENT_CHILD'
  | 'SHARES_TOKEN'
  | 'STATE_TRANSITION'
  | 'VISUAL_DEPENDENCY';

/**
 * 组件间关系 — 描述两个组件之间的视觉依赖。
 * 对齐 IMPL-13 §37 ComponentBinding。
 */
export interface ComponentRelation {
  readonly sourceComponent: string;
  readonly targetComponent: string;
  readonly relation: ComponentRelationType;
  readonly sharedDimensions: readonly VisualTextureDimension[];
  readonly sharedTokenIds?: readonly string[];
  readonly source: 'EXPLICIT' | 'INFERRED';
  readonly confidence: ConfidenceLevel;
}

/**
 * 跨组件 Finding 类型。
 */
export type CrossComponentFindingType =
  | 'TOKEN_DRIFT'
  | 'VISUAL_BREAK'
  | 'STATE_INCOHERENCE'
  | 'COLOR_DISHARMONY'
  | 'WEIGHT_IMBALANCE';

/**
 * 跨组件 Finding — 描述组件间的视觉连续性问题。
 */
export interface CrossComponentFinding {
  readonly id: string;
  readonly type: CrossComponentFindingType;
  readonly sourceComponent: string;
  readonly targetComponent: string;
  readonly dimension: VisualTextureDimension;
  readonly severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  readonly state: 'PASS' | 'WARN' | 'FAIL';
  readonly metricValue: Readonly<Record<string, unknown>>;
  readonly threshold: Readonly<Record<string, unknown>>;
  readonly evidence: readonly EvidenceReference[];
  readonly explanation: string;
}

/**
 * 跨组件分析结果。
 */
export interface CrossComponentAnalysisResult {
  readonly componentBoundaries: readonly ComponentBoundary[];
  readonly componentRelations: readonly ComponentRelation[];
  readonly crossComponentFindings: readonly CrossComponentFinding[];
  readonly systemicPatterns: readonly SystemicPattern[];
  readonly continuityScore: number;
  readonly componentCount: number;
}

/**
 * 扩展的系统性模式类型 — 跨组件专用。
 */
export type CrossComponentSystemicPatternType =
  | 'COMPONENT_TOKEN_DRIFT'
  | 'COMPONENT_CHAIN_BREAK'
  | 'COMPONENT_COLOR_SYSTEMIC'
  | 'COMPONENT_SURFACE_SYSTEMIC';
