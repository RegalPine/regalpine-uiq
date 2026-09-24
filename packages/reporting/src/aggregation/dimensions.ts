/**
 * 维度聚合（IMPL-17 §6 / REPORT-01 §12）。
 * Finding/评价到维度的映射必须显式登记；未登记域抛错，不得按文字描述猜测维度。
 * 输入顺序改变不影响输出统计（确定性）。
 */
import type { QualityDimension, QualityDimensionReport } from '../model/quality';
import { QUALITY_DIMENSIONS } from '../model/quality';
import type { ReportFacts } from './facts';

export class DimensionMappingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DimensionMappingError';
  }
}

/** 规则 ID 首段域 → 维度 的显式登记表（REPORT-01 §12）。 */
const DIMENSION_BY_RULE_DOMAIN: Readonly<Record<string, QualityDimension>> = {
  ACCESSIBILITY: 'ACCESSIBILITY',
  COLOR: 'COLOR',
  TYPOGRAPHY: 'TYPOGRAPHY',
  GEOMETRY: 'GEOMETRY',
  SPACING: 'SPACING',
  TOKEN: 'DESIGN_SYSTEM',
  LAYOUT: 'LAYOUT',
  HIERARCHY: 'HIERARCHY',
};

export function dimensionForRule(ruleId: string): QualityDimension {
  const domain = ruleId.split('.')[0] ?? '';
  const dimension = DIMENSION_BY_RULE_DOMAIN[domain];
  if (dimension === undefined) {
    throw new DimensionMappingError(
      `规则域 "${domain}"（规则 ${ruleId}）未登记维度映射；请在 DIMENSION_BY_RULE_DOMAIN 显式登记，不得猜测维度`,
    );
  }
  return dimension;
}

interface DimensionCounts {
  evaluations: number;
  pass: number;
  fail: number;
  warn: number;
  unknown: number;
  notApplicable: number;
  error: number;
  findings: number;
}

function emptyCounts(): DimensionCounts {
  return {
    evaluations: 0,
    pass: 0,
    fail: 0,
    warn: 0,
    unknown: 0,
    notApplicable: 0,
    error: 0,
    findings: 0,
  };
}

export function aggregateDimensions(facts: ReportFacts): readonly QualityDimensionReport[] {
  const byDimension = new Map<QualityDimension, DimensionCounts>();
  const countsFor = (dimension: QualityDimension): DimensionCounts => {
    let counts = byDimension.get(dimension);
    if (counts === undefined) {
      counts = emptyCounts();
      byDimension.set(dimension, counts);
    }
    return counts;
  };

  for (const evaluation of facts.evaluations) {
    const counts = countsFor(dimensionForRule(evaluation.ruleId));
    counts.evaluations += 1;
    switch (evaluation.state) {
      case 'PASS':
        counts.pass += 1;
        break;
      case 'FAIL':
        counts.fail += 1;
        break;
      case 'WARN':
        counts.warn += 1;
        break;
      case 'UNKNOWN':
        counts.unknown += 1;
        break;
      case 'NOT_APPLICABLE':
        counts.notApplicable += 1;
        break;
      case 'ERROR':
        counts.error += 1;
        break;
      default:
        throw new DimensionMappingError(
          `评价出现未知状态 "${(evaluation as { state: unknown }).state}"`,
        );
    }
  }

  for (const finding of facts.findings) {
    countsFor(dimensionForRule(finding.evaluation.ruleId)).findings += 1;
  }

  // 按 QUALITY_DIMENSIONS 固定顺序输出出现过的维度，保证确定性。
  return QUALITY_DIMENSIONS.filter((d) => byDimension.has(d)).map((dimension) => {
    const counts = byDimension.get(dimension);
    if (counts === undefined)
      throw new DimensionMappingError(`维度 ${dimension} 计数缺失（内部不变式）`);
    return { dimension, ...counts };
  });
}
