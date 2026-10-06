import type { EnrichedRuleDefinition } from '../../evaluation/engine';

/** 无重叠规则：GEOMETRY.OVERLAP 面积 == 0 */
export const NO_OVERLAP: EnrichedRuleDefinition = {
  id: 'GEOMETRY.OVERLAP.NONE',
  version: '1.0.0',
  metricId: 'GEOMETRY.OVERLAP',
  metricVersion: '1.0.0',
  operator: 'EQ',
  threshold: 0,
  severity: 'MEDIUM',
  valueKey: 'area',
  applicability: {
    evaluate(ctx): 'APPLICABLE' | 'NOT_APPLICABLE' | 'UNKNOWN' {
      // 检查是否存在参考元素测量数据
      const hasReference = ctx.snapshot.measurements.some(
        (m) => m.subjectId === ctx.subjectId && m.type === 'geometry.overlap.reference',
      );
      if (!hasReference) {
        return 'NOT_APPLICABLE';
      }
      return 'APPLICABLE';
    },
  },
};
