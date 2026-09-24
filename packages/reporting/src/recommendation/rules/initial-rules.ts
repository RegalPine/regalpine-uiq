/**
 * V1.0 首批建议规则（IMPL-17 §16-24）。
 * 建议文本只做 "Review …" 级引导：不含具体替换色值，不说 "Design is wrong"，
 * 不把 UNKNOWN 转成 FAIL（§18/§21/§24）。
 * 同组 Finding（type + ruleId@version + severity + cause）合并为一条建议并保留
 * affectedFindingIds（§25）；有 Token Trace 时目标收敛到 TOKEN（RPT-003）。
 */
import type { Diagnostic, EvaluationResult, Finding } from '@uiq/core';

import { dimensionForRule } from '../../aggregation/dimensions';
import type { VerificationCriterion } from '../../model/verification';
import type { RecommendationContext } from '../context';
import type { RecommendationDraft, RecommendationRule } from '../recommendation-rule';

const RULE_VERSION = '1.0.0';

function verificationFrom(evaluation: EvaluationResult): VerificationCriterion {
  return {
    metricId: evaluation.metricResult.metricId,
    metricVersion: evaluation.metricResult.metricVersion,
    ruleId: evaluation.ruleId,
    ruleVersion: evaluation.ruleVersion,
    expectedState: 'PASS',
  };
}

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}

/** 收集指定规则的 FAIL finding 并按 id 排序（确定性）。 */
function failFindings(context: RecommendationContext, ruleIds: readonly string[]): Finding[] {
  return context.findings
    .filter((f) => f.evaluation.state === 'FAIL' && ruleIds.includes(f.evaluation.ruleId))
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/** 是否存在 Token Trace：上下文带影响投影，或 subject 有已解析绑定（§17/§19 升级文案条件）。 */
function hasTokenTrace(context: RecommendationContext, subjectIds: readonly string[]): boolean {
  if ((context.impactTraces?.length ?? 0) > 0) return true;
  return (context.tokenBindings ?? []).some(
    (b) =>
      b.bindingType !== 'UNRESOLVED' && b.tokenId !== undefined && subjectIds.includes(b.subjectId),
  );
}

/** subject 集合对应的已解析 tokenId 投影（排序去重）。 */
function tokenIdsFor(context: RecommendationContext, subjectIds: readonly string[]): string[] {
  return sortedUnique(
    (context.tokenBindings ?? [])
      .filter(
        (b) =>
          b.bindingType !== 'UNRESOLVED' &&
          b.tokenId !== undefined &&
          subjectIds.includes(b.subjectId),
      )
      .map((b) => b.tokenId)
      .filter((t): t is string => t !== undefined),
  );
}

/** 分组键与聚合层 groupFindings 一致；此处额外保留组内成员引用。 */
interface FailGroup {
  readonly members: readonly Finding[];
  readonly representative: Finding;
  readonly affectedSubjects: readonly string[];
}

function groupFailFindings(
  context: RecommendationContext,
  ruleIds: readonly string[],
): readonly FailGroup[] {
  const causesByFinding = new Map<string, string[]>();
  for (const diagnostic of context.diagnostics as readonly Diagnostic[]) {
    const causes = causesByFinding.get(diagnostic.findingId);
    if (causes === undefined) {
      causesByFinding.set(diagnostic.findingId, [diagnostic.cause]);
    } else if (!causes.includes(diagnostic.cause)) {
      causes.push(diagnostic.cause);
    }
  }

  const grouped = new Map<string, Finding[]>();
  for (const finding of failFindings(context, ruleIds)) {
    const causes = [...(causesByFinding.get(finding.id) ?? [])].sort();
    const causeKey = causes.length > 0 ? causes.join('+') : 'NONE';
    const key = `${finding.type}|${finding.evaluation.ruleId}@${finding.evaluation.ruleVersion}|${finding.severity}|${causeKey}`;
    const bucket = grouped.get(key);
    if (bucket === undefined) {
      grouped.set(key, [finding]);
    } else {
      bucket.push(finding);
    }
  }

  return [...grouped.values()]
    .map((members) => ({
      members,
      representative: members[0] as Finding,
      affectedSubjects: sortedUnique(members.map((f) => f.subjectId)),
    }))
    .sort((a, b) =>
      a.representative.id < b.representative.id
        ? -1
        : a.representative.id > b.representative.id
          ? 1
          : 0,
    );
}

function draftsForRule(
  context: RecommendationContext,
  ruleIds: readonly string[],
  build: (
    group: FailGroup,
  ) => Pick<RecommendationDraft, 'type' | 'title' | 'dimension' | 'rationale'>,
): RecommendationDraft[] {
  const drafts: RecommendationDraft[] = [];
  for (const group of groupFailFindings(context, ruleIds)) {
    const trace = hasTokenTrace(context, group.affectedSubjects);
    const tokenIds = tokenIdsFor(context, group.affectedSubjects);
    const useTokenTarget = trace && tokenIds.length > 0;
    drafts.push({
      ...build(group),
      targetType: useTokenTarget ? 'TOKEN' : 'ELEMENT',
      targetIds: useTokenTarget ? tokenIds : group.affectedSubjects,
      evidence: group.representative.evidence,
      verification: [verificationFrom(group.representative.evaluation)],
      affectedFindingIds: sortedUnique(group.members.map((f) => f.id)),
      ruleDomains: [group.representative.evaluation.ruleId.split('.')[0] ?? ''],
    });
  }
  return drafts;
}

/** REC-ACCESSIBILITY-001（§17）：WCAG AA FAIL → Review accessibility color relationship。 */
export const accessibilityRecommendation: RecommendationRule = {
  id: 'REC-ACCESSIBILITY-001',
  version: RULE_VERSION,
  matches: (context) => failFindings(context, ['ACCESSIBILITY.CONTRAST.WCAG_AA']).length > 0,
  generate: (context) =>
    draftsForRule(context, ['ACCESSIBILITY.CONTRAST.WCAG_AA'], (group) => ({
      type: 'REVIEW_ACCESSIBILITY',
      title: 'Accessibility color relationship',
      dimension: dimensionForRule(group.representative.evaluation.ruleId),
      rationale: hasTokenTrace(context, group.affectedSubjects)
        ? 'Review semantic/component color token mapping.'
        : 'Review accessibility color relationship.',
    })),
};

/** REC-COLOR-001（§18）：COLOR.GAMUT FAIL → Review color gamut compatibility（不给出替换色值）。 */
export const colorRecommendation: RecommendationRule = {
  id: 'REC-COLOR-001',
  version: RULE_VERSION,
  matches: (context) => failFindings(context, ['COLOR.GAMUT']).length > 0,
  generate: (context) =>
    draftsForRule(context, ['COLOR.GAMUT'], (group) => ({
      type: 'REVIEW_COLOR',
      title: 'Color gamut compatibility',
      dimension: dimensionForRule(group.representative.evaluation.ruleId),
      rationale: 'Review color gamut compatibility for the target rendering space.',
    })),
};

/** REC-TYPOGRAPHY-001（§19）：TYPOGRAPHY.FONT_SIZE FAIL → Review typography contract。 */
export const typographyRecommendation: RecommendationRule = {
  id: 'REC-TYPOGRAPHY-001',
  version: RULE_VERSION,
  matches: (context) => failFindings(context, ['TYPOGRAPHY.FONT_SIZE']).length > 0,
  generate: (context) =>
    draftsForRule(context, ['TYPOGRAPHY.FONT_SIZE'], (group) => ({
      type: 'REVIEW_TYPOGRAPHY',
      title: 'Typography contract',
      dimension: dimensionForRule(group.representative.evaluation.ruleId),
      rationale: hasTokenTrace(context, group.affectedSubjects)
        ? 'Review typography semantic token mapping.'
        : 'Review typography token or component typography contract.',
    })),
};

/** REC-SPACING-001（§20）：SPACING.SCALE_CONFORMANCE FAIL → Review component spacing token mapping。 */
export const spacingRecommendation: RecommendationRule = {
  id: 'REC-SPACING-001',
  version: RULE_VERSION,
  matches: (context) => failFindings(context, ['SPACING.SCALE_CONFORMANCE']).length > 0,
  generate: (context) =>
    draftsForRule(context, ['SPACING.SCALE_CONFORMANCE'], (group) => ({
      type: 'REVIEW_TOKEN',
      title: 'Spacing token mapping',
      dimension: dimensionForRule(group.representative.evaluation.ruleId),
      rationale: 'Review component spacing token mapping.',
    })),
};

/** REC-TOKEN-001（§21）：TOKEN_MATCH / TOKEN_DEVIATION FAIL → Review token binding / deviation（不说 "Design is wrong"）。 */
export const tokenRecommendation: RecommendationRule = {
  id: 'REC-TOKEN-001',
  version: RULE_VERSION,
  matches: (context) =>
    failFindings(context, ['TOKEN.TOKEN_MATCH', 'TOKEN.TOKEN_DEVIATION']).length > 0,
  generate: (context) => [
    ...draftsForRule(context, ['TOKEN.TOKEN_MATCH'], (group) => ({
      type: 'REVIEW_TOKEN' as const,
      title: 'Component token binding',
      dimension: dimensionForRule(group.representative.evaluation.ruleId),
      rationale: 'Review component token binding.',
    })),
    ...draftsForRule(context, ['TOKEN.TOKEN_DEVIATION'], (group) => ({
      type: 'REVIEW_TOKEN' as const,
      title: 'Token deviation',
      dimension: dimensionForRule(group.representative.evaluation.ruleId),
      rationale: 'Review deviation between rendered value and declared design token.',
    })),
  ],
};

/** REC-COMPONENT-001（§22）：COMPONENT_CONFORMANCE FAIL → 目标为 COMPONENT，不落具体 DOM Element。 */
export const componentRecommendation: RecommendationRule = {
  id: 'REC-COMPONENT-001',
  version: RULE_VERSION,
  matches: (context) => failFindings(context, ['TOKEN.COMPONENT_CONFORMANCE']).length > 0,
  generate: (context) =>
    draftsForRule(context, ['TOKEN.COMPONENT_CONFORMANCE'], (group) => ({
      type: 'REVIEW_COMPONENT' as const,
      title: 'Component contract conformance',
      dimension: dimensionForRule(group.representative.evaluation.ruleId),
      rationale: 'Review component contract conformance.',
    })).map((draft) => ({ ...draft, targetType: 'COMPONENT' as const })),
};

/** REC-THEME-001（§23）：存在 DESIGN_SYSTEM 域 FAIL 且提供主题投影 → 每主题独立建议（主题不平均）。 */
export const themeRecommendation: RecommendationRule = {
  id: 'REC-THEME-001',
  version: RULE_VERSION,
  matches: (context) =>
    (context.themes?.length ?? 0) > 0 &&
    context.findings.some(
      (f) =>
        f.evaluation.state === 'FAIL' && dimensionForRule(f.evaluation.ruleId) === 'DESIGN_SYSTEM',
    ),
  generate: (context) => {
    const designSystemFindingIds = sortedUnique(
      context.findings
        .filter(
          (f) =>
            f.evaluation.state === 'FAIL' &&
            dimensionForRule(f.evaluation.ruleId) === 'DESIGN_SYSTEM',
        )
        .map((f) => f.id),
    );
    return (context.themes ?? []).map((theme) => ({
      type: 'REVIEW_THEME' as const,
      title: `${theme.name} theme semantic token mapping`,
      dimension: 'DESIGN_SYSTEM' as const,
      targetType: 'THEME' as const,
      targetIds: [theme.id],
      rationale: `Review ${theme.name} theme semantic token mapping.`,
      evidence: [],
      verification: [],
      affectedFindingIds: designSystemFindingIds,
      ruleDomains: ['TOKEN'],
    }));
  },
};

/** REC-UNKNOWN-001（§24）：UNKNOWN 评价 → Review measurement coverage（绝不 UNKNOWN → FAIL）。 */
export const unknownRecommendation: RecommendationRule = {
  id: 'REC-UNKNOWN-001',
  version: RULE_VERSION,
  matches: (context) => context.evaluations.some((e) => e.state === 'UNKNOWN'),
  generate: (context) =>
    context.evaluations
      .filter((e) => e.state === 'UNKNOWN')
      .sort((a, b) => (a.fingerprint < b.fingerprint ? -1 : a.fingerprint > b.fingerprint ? 1 : 0))
      .map((evaluation) => ({
        type: 'REVIEW_MEASUREMENT' as const,
        title: 'Measurement coverage',
        dimension: dimensionForRule(evaluation.ruleId),
        targetType: 'ELEMENT' as const,
        targetIds: [evaluation.subjectId],
        rationale: 'Review measurement coverage or provide a supported background representation.',
        evidence: evaluation.evidence,
        verification: [verificationFrom(evaluation)],
        affectedFindingIds: sortedUnique(
          context.findings
            .filter((f) => f.evaluation.fingerprint === evaluation.fingerprint)
            .map((f) => f.id),
        ),
        ruleDomains: [evaluation.ruleId.split('.')[0] ?? ''],
      })),
};

/** V1.0 全部内置规则（IMPL-17 §16；注册表负责稳定排序）。 */
export function initialRecommendationRules(): readonly RecommendationRule[] {
  return [
    accessibilityRecommendation,
    colorRecommendation,
    typographyRecommendation,
    spacingRecommendation,
    tokenRecommendation,
    componentRecommendation,
    themeRecommendation,
    unknownRecommendation,
  ];
}
