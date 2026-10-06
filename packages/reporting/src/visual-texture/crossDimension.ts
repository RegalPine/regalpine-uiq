import type { Finding, Diagnostic, CrossDimensionRelation, VisualTextureDimension } from '@uiq/core';

/**
 * 跨维度关系检测 — 显式枚举 7 维度间的关系矩阵。
 *
 * 7 个维度间共有 C(7,2) = 21 对可能的关系组合。
 * 本模块为每对关系定义检测逻辑，识别维度间的依赖与影响。
 *
 * 规范基线：UIQ-VISUAL-QUALITY-23 §10.3
 */
export function detectCrossDimensionRelations(
  findings: readonly Finding[],
  diagnostics: readonly Diagnostic[],
): CrossDimensionRelation[] {
  const failDimensions = collectFailDimensions(findings);
  const relations: CrossDimensionRelation[] = [];

  // 遍历所有 21 对维度组合，检测关系
  const dims: readonly VisualTextureDimension[] = [
    'SURFACE', 'DEPTH', 'COLOR', 'TYPOGRAPHY', 'SPATIAL', 'MOTION', 'MICRO_DETAIL',
  ] as const;

  for (let i = 0; i < dims.length; i++) {
    for (let j = i + 1; j < dims.length; j++) {
      const source: VisualTextureDimension = dims[i] as VisualTextureDimension;
      const target: VisualTextureDimension = dims[j] as VisualTextureDimension;
      const relation = detectRelation(source, target, failDimensions, findings, diagnostics);
      if (relation) {
        relations.push(relation);
      }
    }
  }

  return relations;
}

function collectFailDimensions(findings: readonly Finding[]): Set<VisualTextureDimension> {
  const failDims = new Set<VisualTextureDimension>();
  for (const f of findings) {
    if (f.evaluation.state === 'FAIL') {
      failDims.add(resolveDimension(f));
    }
  }
  return failDims;
}

function resolveDimension(finding: Finding): VisualTextureDimension {
  const ruleId = finding.evaluation.ruleId;
  if (ruleId.includes('SURFACE')) return 'SURFACE';
  if (ruleId.includes('DEPTH')) return 'DEPTH';
  if (ruleId.includes('COLOR')) return 'COLOR';
  if (ruleId.includes('TYPOGRAPHY')) return 'TYPOGRAPHY';
  if (ruleId.includes('SPATIAL')) return 'SPATIAL';
  if (ruleId.includes('MOTION')) return 'MOTION';
  if (ruleId.includes('MICRO')) return 'MICRO_DETAIL';
  return 'SURFACE';
}

interface RelationDef {
  relation: CrossDimensionRelation['relation'];
  confidence: CrossDimensionRelation['confidence'];
  condition: (failDims: Set<VisualTextureDimension>, findings: readonly Finding[]) => boolean;
}

/**
 * 18 对显式关系矩阵 — 定义每对维度间的关系类型和触发条件。
 */
const RELATION_MATRIX: Array<[VisualTextureDimension, VisualTextureDimension, RelationDef]> = [
  // Surface ↔ Depth: CONSTRAINS — 表面属性约束深度表达
  ['SURFACE', 'DEPTH', {
    relation: 'CONSTRAINS',
    confidence: 'SUPPORTED',
    condition: (fds) => fds.has('SURFACE') && fds.has('DEPTH'),
  }],
  // Surface ↔ Color: SHARES_TOKEN — 共享颜色 Token
  ['SURFACE', 'COLOR', {
    relation: 'SHARES_TOKEN',
    confidence: 'SUPPORTED',
    condition: (fds) => fds.has('SURFACE') && fds.has('COLOR'),
  }],
  // Surface ↔ Typography: CONTRIBUTES_TO — 表面影响排版可读性
  ['SURFACE', 'TYPOGRAPHY', {
    relation: 'CONTRIBUTES_TO',
    confidence: 'INFERRED',
    condition: (fds) => fds.has('SURFACE') && fds.has('TYPOGRAPHY'),
  }],
  // Surface ↔ Spatial: CORRELATED — 表面与空间布局关联
  ['SURFACE', 'SPATIAL', {
    relation: 'CORRELATED',
    confidence: 'INFERRED',
    condition: (fds) => fds.has('SURFACE') && fds.has('SPATIAL'),
  }],
  // Surface ↔ Motion: DEPENDS_ON — 动效依赖表面状态
  ['SURFACE', 'MOTION', {
    relation: 'DEPENDS_ON',
    confidence: 'INFERRED',
    condition: (fds) => fds.has('SURFACE') && fds.has('MOTION'),
  }],
  // Surface ↔ Micro Detail: SHARES_STATE — 共享交互状态
  ['SURFACE', 'MICRO_DETAIL', {
    relation: 'SHARES_STATE',
    confidence: 'SUPPORTED',
    condition: (fds) => fds.has('SURFACE') && fds.has('MICRO_DETAIL'),
  }],
  // Depth ↔ Color: AMPLIFIES — 深度通过色彩增强
  ['DEPTH', 'COLOR', {
    relation: 'AMPLIFIES',
    confidence: 'INFERRED',
    condition: (fds) => fds.has('DEPTH') && fds.has('COLOR'),
  }],
  // Depth ↔ Typography: CONTRIBUTES_TO — 深度影响排版层次
  ['DEPTH', 'TYPOGRAPHY', {
    relation: 'CONTRIBUTES_TO',
    confidence: 'INFERRED',
    condition: (fds) => fds.has('DEPTH') && fds.has('TYPOGRAPHY'),
  }],
  // Depth ↔ Spatial: CORRELATED — 层级结构与空间布局关联
  ['DEPTH', 'SPATIAL', {
    relation: 'CORRELATED',
    confidence: 'SUPPORTED',
    condition: (fds) => fds.has('DEPTH') && fds.has('SPATIAL'),
  }],
  // Depth ↔ Motion: DEPENDS_ON — 动效依赖层级结构
  ['DEPTH', 'MOTION', {
    relation: 'DEPENDS_ON',
    confidence: 'INFERRED',
    condition: (fds) => fds.has('DEPTH') && fds.has('MOTION'),
  }],
  // Depth ↔ Micro Detail: CORRELATED — 深度与微细节关联
  ['DEPTH', 'MICRO_DETAIL', {
    relation: 'CORRELATED',
    confidence: 'INFERRED',
    condition: (fds) => fds.has('DEPTH') && fds.has('MICRO_DETAIL'),
  }],
  // Color ↔ Typography: CONTRIBUTES_TO — 字体色彩影响可读性
  ['COLOR', 'TYPOGRAPHY', {
    relation: 'CONTRIBUTES_TO',
    confidence: 'SUPPORTED',
    condition: (fds) => fds.has('COLOR') && fds.has('TYPOGRAPHY'),
  }],
  // Color ↔ Spatial: CORRELATED — 色彩分布与空间关联
  ['COLOR', 'SPATIAL', {
    relation: 'CORRELATED',
    confidence: 'INFERRED',
    condition: (fds) => fds.has('COLOR') && fds.has('SPATIAL'),
  }],
  // Color ↔ Motion: AMPLIFIES — 色彩变化通过动效增强
  ['COLOR', 'MOTION', {
    relation: 'AMPLIFIES',
    confidence: 'INFERRED',
    condition: (fds) => fds.has('COLOR') && fds.has('MOTION'),
  }],
  // Color ↔ Micro Detail: SHARES_TOKEN — 共享颜色 Token
  ['COLOR', 'MICRO_DETAIL', {
    relation: 'SHARES_TOKEN',
    confidence: 'SUPPORTED',
    condition: (fds) => fds.has('COLOR') && fds.has('MICRO_DETAIL'),
  }],
  // Typography ↔ Spatial: CORRELATED — 排版与空间布局关联
  ['TYPOGRAPHY', 'SPATIAL', {
    relation: 'CORRELATED',
    confidence: 'SUPPORTED',
    condition: (fds) => fds.has('TYPOGRAPHY') && fds.has('SPATIAL'),
  }],
  // Typography ↔ Micro Detail: SHARES_COMPONENT — 共享组件
  ['TYPOGRAPHY', 'MICRO_DETAIL', {
    relation: 'SHARES_COMPONENT',
    confidence: 'INFERRED',
    condition: (fds) => fds.has('TYPOGRAPHY') && fds.has('MICRO_DETAIL'),
  }],
  // Spatial ↔ Motion: DEPENDS_ON — 动效依赖空间布局
  ['SPATIAL', 'MOTION', {
    relation: 'DEPENDS_ON',
    confidence: 'INFERRED',
    condition: (fds) => fds.has('SPATIAL') && fds.has('MOTION'),
  }],
];

function detectRelation(
  source: VisualTextureDimension,
  target: VisualTextureDimension,
  failDims: Set<VisualTextureDimension>,
  findings: readonly Finding[],
  _diagnostics: readonly Diagnostic[],
): CrossDimensionRelation | null {
  const def = RELATION_MATRIX.find(
    ([s, t]) => s === source && t === target,
  );
  if (!def) return null;

  const [, , relationDef] = def;
  if (!relationDef.condition(failDims, findings)) return null;

  return {
    sourceDimension: source,
    targetDimension: target,
    sourceEvidenceId: `${source}.FAIL`,
    targetEvidenceId: `${target}.FAIL`,
    relation: relationDef.relation,
    confidence: relationDef.confidence,
  };
}
