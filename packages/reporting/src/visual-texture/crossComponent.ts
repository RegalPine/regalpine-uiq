import type {
  ComponentBoundary,
  ComponentRelation,
  ComponentRelationType,
  CrossComponentFinding,
  CrossComponentAnalysisResult,
  SystemicPattern,
  VisualTextureDimension,
  EvidenceReference,
  Measurement,
} from '@uiq/core';
import type { ComponentMetricGroup } from './componentGrouping';

/**
 * 跨组件视觉连续性分析。
 *
 * 输入：
 * - 按组件分组的度量结果
 * - 组件间关系声明（显式或推断）
 *
 * 输出：
 * - CrossComponentFinding[] — 跨组件问题列表
 * - SystemicPattern[] — 跨组件系统性模式
 * - continuityScore — 跨组件连续性总分
 *
 * 规范基线：UIQ-CROSS-COMPONENT-VISUAL-CONTINUITY §6
 */
export function analyzeCrossComponentContinuity(
  componentGroups: Map<string, ComponentMetricGroup>,
  relations: readonly ComponentRelation[],
): CrossComponentAnalysisResult {
  if (componentGroups.size === 0) {
    return {
      componentBoundaries: [],
      componentRelations: [],
      crossComponentFindings: [],
      systemicPatterns: [],
      continuityScore: 1,
      componentCount: 0,
    };
  }

  const findings: CrossComponentFinding[] = [];
  const boundaries: ComponentBoundary[] = [];

  // 从分组重建边界信息
  for (const [, group] of componentGroups) {
    boundaries.push({
      componentId: group.componentId,
      ...(group.instanceId !== undefined ? { instanceId: group.instanceId } : {}),
      rootElementId: group.memberElementIds[0] ?? '',
      memberElementIds: group.memberElementIds,
      role: 'root',
      source: group.source,
      confidence: group.source === 'EXPLICIT' ? 'DIRECT' : 'INFERRED',
    });
  }

  // 对每对组件关系执行检测
  for (const relation of relations) {
    const sourceGroup = componentGroups.get(relation.sourceComponent);
    const targetGroup = componentGroups.get(relation.targetComponent);
    if (!sourceGroup || !targetGroup) continue;

    findings.push(...detectTokenDrift(sourceGroup, targetGroup, relation));
    findings.push(...detectSurfaceContinuity(sourceGroup, targetGroup, relation));
    findings.push(...detectColorHarmony(sourceGroup, targetGroup, relation));
    findings.push(...detectDepthTransition(sourceGroup, targetGroup, relation));
    findings.push(...detectTypographyConsistency(sourceGroup, targetGroup, relation));
  }

  const systemicPatterns = detectCrossComponentSystemic(findings);
  const continuityScore = computeContinuityScore(findings);

  return {
    componentBoundaries: boundaries,
    componentRelations: [...relations],
    crossComponentFindings: findings,
    systemicPatterns,
    continuityScore,
    componentCount: componentGroups.size,
  };
}

// ---------------------------------------------------------------------------
// Token 漂移检测
// ---------------------------------------------------------------------------

function detectTokenDrift(
  source: ComponentMetricGroup,
  target: ComponentMetricGroup,
  relation: ComponentRelation,
): CrossComponentFinding[] {
  if (relation.relation !== 'SHARES_TOKEN' && relation.relation !== 'ADJACENT') return [];

  const findings: CrossComponentFinding[] = [];

  // 比较两组件的颜色值一致性
  const sourceColors = extractValues(source.measurements, 'color.srgb');
  const targetColors = extractValues(target.measurements, 'color.srgb');

  if (sourceColors.length > 0 && targetColors.length > 0) {
    const sourceSet = new Set(sourceColors.map((v) => JSON.stringify(v)));
    const targetSet = new Set(targetColors.map((v) => JSON.stringify(v)));
    const sharedCount = [...sourceSet].filter((s) => targetSet.has(s)).length;
    const totalDistinct = new Set([...sourceSet, ...targetSet]).size;
    const driftCount = totalDistinct - sharedCount;
    const driftRatio = totalDistinct > 0 ? driftCount / totalDistinct : 0;

    const state = driftCount === 0 ? 'PASS' as const : driftCount <= 1 ? 'WARN' as const : 'FAIL' as const;

    findings.push({
      id: `xccf-token-drift-${source.componentId}-${target.componentId}`,
      type: 'TOKEN_DRIFT',
      sourceComponent: source.componentId,
      targetComponent: target.componentId,
      dimension: 'COLOR',
      severity: state === 'FAIL' ? 'HIGH' : state === 'WARN' ? 'MEDIUM' : 'INFO',
      state,
      metricValue: { driftCount, driftRatio, sharedCount, totalDistinct },
      threshold: { maxDriftCount: 0 },
      evidence: [],
      explanation: state === 'FAIL'
        ? `${source.componentId} 与 ${target.componentId} 存在 ${driftCount} 个颜色值漂移，共享 Token 值不一致`
        : state === 'WARN'
          ? `${source.componentId} 与 ${target.componentId} 有 1 个颜色值差异，可能存在 Token 漂移`
          : `${source.componentId} 与 ${target.componentId} 颜色值完全一致`,
    });
  }

  return findings;
}

// ---------------------------------------------------------------------------
// Surface 连续性检测
// ---------------------------------------------------------------------------

function detectSurfaceContinuity(
  source: ComponentMetricGroup,
  target: ComponentMetricGroup,
  relation: ComponentRelation,
): CrossComponentFinding[] {
  if (relation.relation !== 'ADJACENT') return [];

  const findings: CrossComponentFinding[] = [];

  // 比较圆角一致性
  const sourceRadii = extractNumericValues(source.measurements, 'surface.radius');
  const targetRadii = extractNumericValues(target.measurements, 'surface.radius');

  if (sourceRadii.length > 0 && targetRadii.length > 0) {
    const sourceDominant = dominantValue(sourceRadii);
    const targetDominant = dominantValue(targetRadii);
    const jump = Math.abs(sourceDominant - targetDominant);

    const state = jump === 0 ? 'PASS' as const : jump <= 2 ? 'WARN' as const : 'FAIL' as const;

    findings.push({
      id: `xccf-surface-${source.componentId}-${target.componentId}`,
      type: 'VISUAL_BREAK',
      sourceComponent: source.componentId,
      targetComponent: target.componentId,
      dimension: 'SURFACE',
      severity: state === 'FAIL' ? 'MEDIUM' : state === 'WARN' ? 'LOW' : 'INFO',
      state,
      metricValue: { sourceRadius: sourceDominant, targetRadius: targetDominant, jump },
      threshold: { maxJump: 2 },
      evidence: [],
      explanation: state === 'FAIL'
        ? `${source.componentId} 圆角 ${sourceDominant}px 与 ${target.componentId} 圆角 ${targetDominant}px 跳变 ${jump}px，边界处视觉断裂`
        : state === 'WARN'
          ? `${source.componentId} 与 ${target.componentId} 圆角差异 ${jump}px，存在轻微不连续`
          : `${source.componentId} 与 ${target.componentId} 圆角一致 (${sourceDominant}px)`,
    });
  }

  return findings;
}

// ---------------------------------------------------------------------------
// Color 和谐检测
// ---------------------------------------------------------------------------

function detectColorHarmony(
  source: ComponentMetricGroup,
  target: ComponentMetricGroup,
  relation: ComponentRelation,
): CrossComponentFinding[] {
  if (relation.relation !== 'ADJACENT') return [];

  const findings: CrossComponentFinding[] = [];

  // 比较两组件的主色数量差异（简化版：检查色彩碎片化）
  const sourceColors = new Set(extractValues(source.measurements, 'color.srgb').map((v) => JSON.stringify(v)));
  const targetColors = new Set(extractValues(target.measurements, 'color.srgb').map((v) => JSON.stringify(v)));

  if (sourceColors.size > 0 && targetColors.size > 0) {
    const overlap = [...sourceColors].filter((c) => targetColors.has(c)).length;
    const totalUnion = new Set([...sourceColors, ...targetColors]).size;
    const jaccard = totalUnion > 0 ? overlap / totalUnion : 0;

    // 色彩重叠度低 → 可能不协调
    const state = jaccard > 0.3 ? 'PASS' as const : jaccard > 0.1 ? 'WARN' as const : 'FAIL' as const;

    findings.push({
      id: `xccf-color-${source.componentId}-${target.componentId}`,
      type: 'COLOR_DISHARMONY',
      sourceComponent: source.componentId,
      targetComponent: target.componentId,
      dimension: 'COLOR',
      severity: state === 'FAIL' ? 'MEDIUM' : state === 'WARN' ? 'LOW' : 'INFO',
      state,
      metricValue: { overlap, totalUnion, jaccard },
      threshold: { minJaccard: 0.3 },
      evidence: [],
      explanation: state === 'FAIL'
        ? `${source.componentId} (${sourceColors.size} 色) 与 ${target.componentId} (${targetColors.size} 色) 色彩重叠仅 ${Math.round(jaccard * 100)}%，配色可能不协调`
        : state === 'WARN'
          ? `${source.componentId} 与 ${target.componentId} 色彩重叠 ${Math.round(jaccard * 100)}%，存在轻微不协调`
          : `${source.componentId} 与 ${target.componentId} 色彩协调 (重叠 ${Math.round(jaccard * 100)}%)`,
    });
  }

  return findings;
}

// ---------------------------------------------------------------------------
// Depth 过渡检测
// ---------------------------------------------------------------------------

function detectDepthTransition(
  source: ComponentMetricGroup,
  target: ComponentMetricGroup,
  relation: ComponentRelation,
): CrossComponentFinding[] {
  if (relation.relation !== 'ADJACENT' && relation.relation !== 'PARENT_CHILD') return [];

  const findings: CrossComponentFinding[] = [];

  const sourceShadows = extractNumericValues(source.measurements, 'surface.shadow-count');
  const targetShadows = extractNumericValues(target.measurements, 'surface.shadow-count');

  if (sourceShadows.length > 0 && targetShadows.length > 0) {
    const sourceHas = sourceShadows.some((v) => v > 0);
    const targetHas = targetShadows.some((v) => v > 0);

    // 一个有阴影一个没有 → 深度断裂
    const state = sourceHas === targetHas ? 'PASS' as const : 'WARN' as const;

    findings.push({
      id: `xccf-depth-${source.componentId}-${target.componentId}`,
      type: 'VISUAL_BREAK',
      sourceComponent: source.componentId,
      targetComponent: target.componentId,
      dimension: 'DEPTH',
      severity: state === 'WARN' ? 'LOW' : 'INFO',
      state,
      metricValue: { sourceHasShadow: sourceHas, targetHasShadow: targetHas },
      threshold: { consistentShadow: true },
      evidence: [],
      explanation: state === 'WARN'
        ? `${source.componentId} ${sourceHas ? '有' : '无'}阴影，${target.componentId} ${targetHas ? '有' : '无'}阴影，深度层次不连续`
        : `两组件阴影表达一致`,
    });
  }

  return findings;
}

// ---------------------------------------------------------------------------
// Typography 一致性检测
// ---------------------------------------------------------------------------

function detectTypographyConsistency(
  source: ComponentMetricGroup,
  target: ComponentMetricGroup,
  relation: ComponentRelation,
): CrossComponentFinding[] {
  if (relation.relation !== 'ADJACENT' && relation.relation !== 'PARENT_CHILD') return [];

  const findings: CrossComponentFinding[] = [];

  const sourceFonts = extractValues(source.measurements, 'typography.font-family');
  const targetFonts = extractValues(target.measurements, 'typography.font-family');

  if (sourceFonts.length > 0 && targetFonts.length > 0) {
    const sourceSet = new Set(sourceFonts.map((v) => String(v)));
    const targetSet = new Set(targetFonts.map((v) => String(v)));
    const shared = [...sourceSet].filter((f) => targetSet.has(f)).length;
    const totalUnion = new Set([...sourceSet, ...targetSet]).size;
    const familyMatch = totalUnion > 0 ? shared / totalUnion : 1;

    const state = familyMatch === 1 ? 'PASS' as const : familyMatch >= 0.5 ? 'WARN' as const : 'FAIL' as const;

    findings.push({
      id: `xccf-typo-${source.componentId}-${target.componentId}`,
      type: 'VISUAL_BREAK',
      sourceComponent: source.componentId,
      targetComponent: target.componentId,
      dimension: 'TYPOGRAPHY',
      severity: state === 'FAIL' ? 'MEDIUM' : state === 'WARN' ? 'LOW' : 'INFO',
      state,
      metricValue: { sourceFamilies: sourceSet.size, targetFamilies: targetSet.size, familyMatch },
      threshold: { minFamilyMatch: 1.0 },
      evidence: [],
      explanation: state === 'FAIL'
        ? `${source.componentId} (${sourceSet.size} 种字体) 与 ${target.componentId} (${targetSet.size} 种字体) 字体族不一致`
        : state === 'WARN'
          ? `${source.componentId} 与 ${target.componentId} 字体族部分一致 (${Math.round(familyMatch * 100)}%)`
          : `${source.componentId} 与 ${target.componentId} 字体族一致`,
    });
  }

  return findings;
}

// ---------------------------------------------------------------------------
// 跨组件系统性模式检测
// ---------------------------------------------------------------------------

function detectCrossComponentSystemic(
  findings: readonly CrossComponentFinding[],
): SystemicPattern[] {
  const patterns: SystemicPattern[] = [];
  const failFindings = findings.filter((f) => f.state === 'FAIL');

  if (failFindings.length === 0) return [];

  // COMPONENT_TOKEN_DRIFT: 多个组件对之间存在 Token 漂移
  const tokenDriftFails = failFindings.filter((f) => f.type === 'TOKEN_DRIFT');
  if (tokenDriftFails.length >= 2) {
    const involvedComponents = new Set<string>();
    tokenDriftFails.forEach((f) => {
      involvedComponents.add(f.sourceComponent);
      involvedComponents.add(f.targetComponent);
    });
    patterns.push({
      id: 'sp-component-token-drift',
      type: 'COMPONENT_SYSTEMIC',
      scope: 'PROJECT',
      dimensions: ['COLOR'],
      findingIds: tokenDriftFails.map((f) => f.id),
      evidence: [],
      confidence: 'DIRECT',
    });
  }

  // COMPONENT_CHAIN_BREAK: 多个相邻组件之间存在视觉断裂
  const breakFails = failFindings.filter((f) => f.type === 'VISUAL_BREAK');
  if (breakFails.length >= 2) {
    const involvedDimensions = new Set(breakFails.map((f) => f.dimension));
    patterns.push({
      id: 'sp-component-chain-break',
      type: 'LAYOUT_SYSTEMIC',
      scope: 'PAGE',
      dimensions: [...involvedDimensions],
      findingIds: breakFails.map((f) => f.id),
      evidence: [],
      confidence: 'SUPPORTED',
    });
  }

  // COMPONENT_COLOR_SYSTEMIC: 多个组件对配色不协调
  const colorFails = failFindings.filter((f) => f.type === 'COLOR_DISHARMONY');
  if (colorFails.length >= 2) {
    patterns.push({
      id: 'sp-component-color-systemic',
      type: 'COLOR_SYSTEMIC',
      scope: 'PAGE',
      dimensions: ['COLOR'],
      findingIds: colorFails.map((f) => f.id),
      evidence: [],
      confidence: 'DIRECT',
    });
  }

  return patterns;
}

// ---------------------------------------------------------------------------
// 连续性评分
// ---------------------------------------------------------------------------

function computeContinuityScore(findings: readonly CrossComponentFinding[]): number {
  if (findings.length === 0) return 1;
  const passCount = findings.filter((f) => f.state === 'PASS').length;
  const warnCount = findings.filter((f) => f.state === 'WARN').length;
  // PASS=1.0, WARN=0.5, FAIL=0.0
  const total = findings.length;
  return (passCount + warnCount * 0.5) / total;
}

// ---------------------------------------------------------------------------
// 组件关系推断
// ---------------------------------------------------------------------------

/**
 * 从组件边界列表推断组件间关系。
 * 当没有显式关系声明时，使用此函数自动推断。
 */
export function inferComponentRelations(
  boundaries: readonly ComponentBoundary[],
): ComponentRelation[] {
  const relations: ComponentRelation[] = [];

  for (let i = 0; i < boundaries.length; i++) {
    for (let j = i + 1; j < boundaries.length; j++) {
      const a = boundaries[i]!;
      const b = boundaries[j]!;

      // 检查是否有成员元素 ID 重叠（父子关系）
      const aSet = new Set(a.memberElementIds);
      const bSet = new Set(b.memberElementIds);
      const overlap = [...aSet].filter((id) => bSet.has(id)).length;

      if (overlap > 0) {
        // 有重叠 → 父子关系：成员全部被包含的一方是父组件
        const aContainsB = overlap === b.memberElementIds.length;
        const parent = aContainsB ? a : b;
        const child = parent === a ? b : a;
        relations.push({
          sourceComponent: parent.componentId,
          targetComponent: child.componentId,
          relation: 'PARENT_CHILD',
          sharedDimensions: ['SURFACE', 'COLOR', 'TYPOGRAPHY'],
          source: 'INFERRED',
          confidence: 'INFERRED',
        });
      } else {
        // 无重叠 → 默认为相邻关系
        relations.push({
          sourceComponent: a.componentId,
          targetComponent: b.componentId,
          relation: 'ADJACENT',
          sharedDimensions: ['SURFACE', 'COLOR', 'DEPTH', 'SPATIAL'],
          source: 'INFERRED',
          confidence: 'INFERRED',
        });
      }
    }
  }

  return relations;
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function extractValues(measurements: readonly Measurement[], type: string): unknown[] {
  return measurements
    .filter((m) => m.type === type && m.status === 'AVAILABLE' && m.value !== null)
    .map((m) => m.value);
}

function extractNumericValues(measurements: readonly Measurement[], type: string): number[] {
  return measurements
    .filter((m) => m.type === type && m.status === 'AVAILABLE')
    .map((m) => m.value)
    .filter((v): v is number => typeof v === 'number');
}

function dominantValue(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const freq = new Map<number, number>();
  for (const v of values) {
    freq.set(v, (freq.get(v) ?? 0) + 1);
  }
  let maxCount = 0;
  let dominant = values[0]!;
  for (const [val, count] of freq) {
    if (count > maxCount) {
      maxCount = count;
      dominant = val;
    }
  }
  return dominant;
}
