import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { assertExactVersion, canonicalJson } from '@uiq/core';
import { createDefaultMetricRegistry } from '@uiq/metrics';
import { createDefaultRuleRegistry } from '@uiq/rules';
import { initialRecommendationRules } from '@uiq/reporting';
import {
  CAPABILITY_CATALOG,
  LAYOUT_METRIC_IDS,
  LAYOUT_RULE_IDS,
  PLANNED_LAYOUT_GOLDENS,
  UNSUPPORTED_ALGORITHMS,
} from './capabilities';
import type { CapabilityRecord } from './capabilities';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const sourceNames = [
  ...readdirSync(join(ROOT, 'specs')),
  ...readdirSync(join(ROOT, 'docs/architecture')),
];
const identity = (entry: { id: string; version: string }) => `${entry.id}@${entry.version}`;

function catalogIds(
  kind: CapabilityRecord['kind'],
  registration: CapabilityRecord['registration'],
): string[] {
  return CAPABILITY_CATALOG.filter(
    (entry) =>
      entry.kind === kind &&
      entry.registration === registration &&
      entry.implementation === 'PRESENT',
  )
    .map(identity)
    .sort();
}

function schemaNode(reference: string): unknown {
  const [file, pointer = ''] = reference.split('#');
  let current: unknown = JSON.parse(readFileSync(join(ROOT, file!), 'utf8'));
  for (const segment of pointer.split('/').slice(1)) {
    expect(current).toBeTypeOf('object');
    expect(current).not.toBeNull();
    current = (current as Record<string, unknown>)[segment.replace(/~1/g, '/').replace(/~0/g, '~')];
  }
  return current;
}

describe('P0-03：能力清单与真实 Registry 对账（不执行等级判定）', () => {
  it.each(CAPABILITY_CATALOG)('$kind $id@$version：来源与引用可解析', (entry) => {
    expect(() => assertExactVersion(entry.version)).not.toThrow();
    expect(entry.stage).toMatch(/^P\d+$/);
    expect(entry.sources.length).toBeGreaterThan(0);
    for (const source of entry.sources) {
      expect(
        sourceNames.some((name) => name.startsWith(`${source} `) || name.startsWith(`${source}《`)),
        source,
      ).toBe(true);
    }
    for (const reference of [entry.schema.input, entry.schema.output]) {
      if (reference !== null) expect(schemaNode(reference), reference).toBeDefined();
    }
    if (entry.entry !== null) expect(existsSync(join(ROOT, entry.entry)), entry.entry).toBe(true);
    if (entry.golden !== null) {
      expect(readFileSync(join(ROOT, entry.golden.file), 'utf8')).toContain(entry.golden.id);
    }
    if (entry.implementation === 'PLANNED') {
      expect(entry.registration).toBe('NONE');
      expect(entry.entry).toBeNull();
      expect(entry.golden).toBeNull();
      expect(entry.acceptance).toBe('PENDING');
    }
    expect(entry.gaps.length).toBeGreaterThan(0);
  });

  it('清单身份唯一、可序列化，算法没有隐式别名', () => {
    const keys = CAPABILITY_CATALOG.map((entry) => `${entry.kind}:${identity(entry)}`);
    expect(new Set(keys).size).toBe(keys.length);
    expect(JSON.parse(canonicalJson(CAPABILITY_CATALOG))).toEqual(CAPABILITY_CATALOG);
    expect(UNSUPPORTED_ALGORITHMS.map((entry) => entry.name)).toEqual(['APCA', 'CIEDE2000']);
  });

  it('默认指标逐项一致，新增或漏登记都失败', () => {
    expect(createDefaultMetricRegistry().list().map(identity).sort()).toEqual(
      catalogIds('METRIC', 'DEFAULT'),
    );
  });

  it('Token 指标必须显式提供端口/配置，不混入默认注册表', () => {
    const explicitTokenMetricIds = ['TOKEN.RESOLUTION', 'TOKEN.MATCH', 'TOKEN.DEVIATION'];
    const explicitMetricCatalog = CAPABILITY_CATALOG.filter(
      (e) => e.kind === 'METRIC' && e.registration === 'EXPLICIT' && e.implementation === 'PRESENT',
    ).map((e) => e.id);
    for (const id of explicitTokenMetricIds) {
      expect(explicitMetricCatalog).toContain(id);
    }
    expect(
      createDefaultMetricRegistry()
        .list()
        .every((entry) => !entry.id.startsWith('TOKEN.')),
    ).toBe(true);
  });

  it('默认与显式规则身份精确匹配', () => {
    expect(createDefaultRuleRegistry().list().map(identity).sort()).toEqual(
      catalogIds('RULE', 'DEFAULT'),
    );
    const explicitTokenRuleIds = ['TOKEN.TOKEN_MATCH', 'TOKEN.COMPONENT_CONFORMANCE'];
    const explicitRuleCatalog = CAPABILITY_CATALOG.filter(
      (e) => e.kind === 'RULE' && e.registration === 'EXPLICIT' && e.implementation === 'PRESENT',
    ).map((e) => e.id);
    for (const id of explicitTokenRuleIds) {
      expect(explicitRuleCatalog).toContain(id);
    }
  });

  it('首批建议规则逐项一致，已有实现不代表已完成验收', () => {
    expect(initialRecommendationRules().map(identity).sort()).toEqual(
      catalogIds('RECOMMENDATION', 'DEFAULT'),
    );
  });

  it('九布局指标、十一规则含 ORDER，已实现为纯函数并登记为 PRESENT', () => {
    expect(LAYOUT_METRIC_IDS).toHaveLength(9);
    expect(LAYOUT_RULE_IDS).toHaveLength(11);
    expect(LAYOUT_RULE_IDS).toContain('LAYOUT.ORDER.CONFORMANCE');
    const actual = [
      ...createDefaultMetricRegistry().list(),
      ...createDefaultRuleRegistry().list(),
    ].map(identity);
    for (const id of [...LAYOUT_METRIC_IDS, ...LAYOUT_RULE_IDS]) {
      const entry = CAPABILITY_CATALOG.find((item) => item.id === id);
      expect(entry?.implementation).toBe('PRESENT');
      expect(entry?.registration).toBe('EXPLICIT');
      expect(actual).not.toContain(`${id}@1.0.0`);
    }
    expect(PLANNED_LAYOUT_GOLDENS).toHaveLength(15);
    expect(new Set(PLANNED_LAYOUT_GOLDENS.map((entry) => entry.id)).size).toBe(15);
    expect([...new Set(PLANNED_LAYOUT_GOLDENS.map((entry) => entry.category))].sort()).toEqual(
      Array.from({ length: 14 }, (_, index) => `G${index + 1}`).sort(),
    );
    expect(
      PLANNED_LAYOUT_GOLDENS.every(
        (entry) => entry.state === 'PLANNED' && entry.derivation.length > 0,
      ),
    ).toBe(true);
  });
});
