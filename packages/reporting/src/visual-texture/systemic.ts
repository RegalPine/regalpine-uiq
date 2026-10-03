import type { Finding, SystemicPattern, VisualTextureDimension } from '@uiq/core';

/**
 * 系统性模式检测 — 识别跨组件/跨维度的重复性问题。
 *
 * 分类检测：
 * - TOKEN: Design Token 级系统性问题 (多维度共享 Token 失效)
 * - COMPONENT: 组件级系统性问题 (同类组件重复出现相同问题)
 * - THEME: 主题级系统性问题 (主题配置导致的全局问题)
 * - STATE: 状态级系统性问题 (交互状态实现缺失)
 *
 * 规范基线：UIQ-VISUAL-QUALITY-23 §10.4
 */
export function detectSystemicPatterns(
  findings: readonly Finding[],
): SystemicPattern[] {
  const patterns: SystemicPattern[] = [];

  patterns.push(...detectTokenSystemic(findings));
  patterns.push(...detectComponentSystemic(findings));
  patterns.push(...detectThemeSystemic(findings));
  patterns.push(...detectStateSystemic(findings));
  patterns.push(...detectLayoutSystemic(findings));
  patterns.push(...detectCrossDimensionSystemic(findings));

  return patterns;
}

// --- TOKEN: 3+ 维度 FAIL 表明 Token 级系统性问题 ---

function detectTokenSystemic(findings: readonly Finding[]): SystemicPattern[] {
  const failDimensions = collectFailDimensions(findings);
  if (failDimensions.size < 3) return [];

  const findingIds = findings
    .filter((f) => f.evaluation.state === 'FAIL')
    .map((f) => f.id);

  return [{
    id: 'sp-token-systemic',
    type: 'TOKEN_SYSTEMIC',
    scope: 'PROJECT',
    dimensions: [...failDimensions],
    findingIds,
    evidence: [],
    confidence: 'DIRECT',
  }];
}

// --- COMPONENT: 同类组件重复出现相同问题 ---

function detectComponentSystemic(findings: readonly Finding[]): SystemicPattern[] {
  const patterns: SystemicPattern[] = [];

  // Typography 维度 2+ FAIL → 排版组件系统性问题
  const typoFails = findings.filter(
    (f) => resolveDimension(f) === 'TYPOGRAPHY' && f.evaluation.state === 'FAIL',
  );
  if (typoFails.length >= 2) {
    patterns.push({
      id: 'sp-typography-component',
      type: 'TYPOGRAPHY_SYSTEMIC',
      scope: 'COMPONENT',
      dimensions: ['TYPOGRAPHY'],
      findingIds: typoFails.map((f) => f.id),
      evidence: [],
      confidence: 'DIRECT',
    });
  }

  // Color 维度 2+ FAIL → 颜色组件系统性问题
  const colorFails = findings.filter(
    (f) => resolveDimension(f) === 'COLOR' && f.evaluation.state === 'FAIL',
  );
  if (colorFails.length >= 2) {
    patterns.push({
      id: 'sp-color-component',
      type: 'COLOR_SYSTEMIC',
      scope: 'COMPONENT',
      dimensions: ['COLOR'],
      findingIds: colorFails.map((f) => f.id),
      evidence: [],
      confidence: 'DIRECT',
    });
  }

  // Motion 维度 2+ FAIL → 动效组件系统性问题
  const motionFails = findings.filter(
    (f) => resolveDimension(f) === 'MOTION' && f.evaluation.state === 'FAIL',
  );
  if (motionFails.length >= 2) {
    patterns.push({
      id: 'sp-motion-component',
      type: 'MOTION_SYSTEMIC',
      scope: 'COMPONENT',
      dimensions: ['MOTION'],
      findingIds: motionFails.map((f) => f.id),
      evidence: [],
      confidence: 'DIRECT',
    });
  }

  return patterns;
}

// --- THEME: 主题配置导致的全局问题 ---

function detectThemeSystemic(findings: readonly Finding[]): SystemicPattern[] {
  // Depth + Color 同时 FAIL → 可能是主题配置问题 (shadow/color 均由 theme 控制)
  const depthFails = findings.filter(
    (f) => resolveDimension(f) === 'DEPTH' && f.evaluation.state === 'FAIL',
  );
  const colorFails = findings.filter(
    (f) => resolveDimension(f) === 'COLOR' && f.evaluation.state === 'FAIL',
  );

  if (depthFails.length > 0 && colorFails.length > 0) {
    return [{
      id: 'sp-theme-systemic',
      type: 'THEME_SYSTEMIC',
      scope: 'PROJECT',
      dimensions: ['DEPTH', 'COLOR'],
      findingIds: [...depthFails, ...colorFails].map((f) => f.id),
      evidence: [],
      confidence: 'SUPPORTED',
    }];
  }

  return [];
}

// --- STATE: 交互状态实现缺失 ---

function detectStateSystemic(findings: readonly Finding[]): SystemicPattern[] {
  // Micro Detail 中 STATE 相关 FAIL → 状态实现系统性缺失
  const stateFails = findings.filter(
    (f) => resolveDimension(f) === 'MICRO_DETAIL'
      && f.evaluation.state === 'FAIL'
      && (f.evaluation.ruleId.includes('STATE') || f.evaluation.ruleId.includes('FOCUS') || f.evaluation.ruleId.includes('HOVER')),
  );

  if (stateFails.length >= 2) {
    return [{
      id: 'sp-state-systemic',
      type: 'STATE_SYSTEMIC',
      scope: 'COMPONENT',
      dimensions: ['MICRO_DETAIL'],
      findingIds: stateFails.map((f) => f.id),
      evidence: [],
      confidence: 'DIRECT',
    }];
  }

  return [];
}

// --- LAYOUT: Depth + Spatial 同时 FAIL ---

function detectLayoutSystemic(findings: readonly Finding[]): SystemicPattern[] {
  const depthFails = findings.filter(
    (f) => resolveDimension(f) === 'DEPTH' && f.evaluation.state === 'FAIL',
  );
  const spatialFails = findings.filter(
    (f) => resolveDimension(f) === 'SPATIAL' && f.evaluation.state === 'FAIL',
  );

  if (depthFails.length > 0 && spatialFails.length > 0) {
    return [{
      id: 'sp-layout-systemic',
      type: 'LAYOUT_SYSTEMIC',
      scope: 'PAGE',
      dimensions: ['DEPTH', 'SPATIAL'],
      findingIds: [...depthFails, ...spatialFails].map((f) => f.id),
      evidence: [],
      confidence: 'SUPPORTED',
    }];
  }

  return [];
}

// --- CROSS_DIMENSION: 4+ 维度 FAIL ---

function detectCrossDimensionSystemic(findings: readonly Finding[]): SystemicPattern[] {
  const failDimensions = collectFailDimensions(findings);
  if (failDimensions.size < 4) return [];

  const allFailIds = findings
    .filter((f) => f.evaluation.state === 'FAIL')
    .map((f) => f.id);

  return [{
    id: 'sp-cross-dimension-systemic',
    type: 'CROSS_DIMENSION_SYSTEMIC',
    scope: 'PROJECT',
    dimensions: [...failDimensions],
    findingIds: allFailIds,
    evidence: [],
    confidence: 'DIRECT',
  }];
}

// --- helpers ---

function collectFailDimensions(findings: readonly Finding[]): Set<VisualTextureDimension> {
  const dims = new Set<VisualTextureDimension>();
  for (const f of findings) {
    if (f.evaluation.state === 'FAIL') {
      dims.add(resolveDimension(f));
    }
  }
  return dims;
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
