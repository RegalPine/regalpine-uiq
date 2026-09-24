import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const ROOT = resolve(here, '../..');

const CORE_SCHEMA_ID = 'https://uiq.local/schemas/core/1.0.0/contracts';
const ajv = new Ajv2020({ strict: false, allErrors: true });
ajv.addSchema(
  JSON.parse(readFileSync(require.resolve('@uiq/core/schemas/contracts.schema.json'), 'utf-8')),
);

const SOURCE = { type: 'BROWSER', adapter: '@uiq/browser', version: '1.0.0' } as const;
const TIMESTAMP = 1700000000000;

function validate(def: string, value: unknown): { valid: boolean; errors: string[] } {
  const validateFn = ajv.getSchema(`${CORE_SCHEMA_ID}#/$defs/${def}`);
  expect(validateFn, `Schema $defs.${def} 未定义`).toBeDefined();
  const valid = validateFn!(value) as boolean;
  const errors = (validateFn!.errors ?? []).map((e) => `${e.instancePath}: ${e.message}`);
  return { valid, errors };
}

/** IMPL-07 §16：一条最小可用的颜色 Measurement。 */
function colorMeasurement(
  status: 'AVAILABLE' | 'UNKNOWN',
  value: unknown,
): Record<string, unknown> {
  return {
    id: 'bm-000001',
    subjectId: 'btn-1',
    type: 'color.srgb',
    value,
    source: SOURCE,
    status,
    timestamp: TIMESTAMP,
  };
}

describe('P0 Schema 修复验证：Measurement value/status 一致性', () => {
  it('AVAILABLE + 数值 value → 通过', () => {
    const result = validate(
      'Measurement',
      colorMeasurement('AVAILABLE', { r: 1, g: 1, b: 1, alpha: 1 }),
    );
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it('UNKNOWN + value null → 通过（修复前 else 分支矛盾导致永远失败）', () => {
    const result = validate('Measurement', colorMeasurement('UNKNOWN', null));
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it('AVAILABLE + value null → 拒绝（AVAILABLE 必须携带真实值）', () => {
    const result = validate('Measurement', colorMeasurement('AVAILABLE', null));
    expect(result.valid).toBe(false);
  });

  it('UNKNOWN + value 非空 → 拒绝（不伪造数值）', () => {
    const result = validate('Measurement', colorMeasurement('UNKNOWN', 16));
    expect(result.valid).toBe(false);
  });

  it('缺少 value 字段 → 拒绝（value 必填，UNKNOWN 用 null 表达）', () => {
    const { value: _value, ...missing } = colorMeasurement('UNKNOWN', null);
    void _value;
    const result = validate('Measurement', missing);
    expect(result.valid).toBe(false);
  });
});

describe('核心契约 $defs 典型对象验证', () => {
  it('MeasurementSource：BROWSER 来源', () => {
    const result = validate('MeasurementSource', SOURCE);
    expect(result.valid).toBe(true);
  });

  it('MeasurementEnvironment：viewport/DPR/scroll/browser', () => {
    const result = validate('MeasurementEnvironment', {
      viewport: { width: 1440, height: 900 },
      devicePixelRatio: 1,
      scrollX: 0,
      scrollY: 0,
      browser: { name: 'Chrome', version: '120.0.0.0' },
    });
    expect(result.valid).toBe(true);
  });

  it('MeasurementSnapshot：完整快照（含 environment 与 measurements）', () => {
    const fixture = JSON.parse(
      readFileSync(join(ROOT, 'tests/fixtures/analysis/fixture-snapshot.json'), 'utf-8'),
    );
    const result = validate('MeasurementSnapshot', fixture);
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it('MetricResult：AVAILABLE 携带 value；ERROR 无 value 键', () => {
    const available = validate('MetricResult', {
      metricId: 'COLOR.CONTRAST',
      metricVersion: '1.0.0',
      subjectId: 'btn-1',
      status: 'AVAILABLE',
      dependencies: [],
      fingerprint: 'a'.repeat(64),
      value: { ratio: 4.48 },
    });
    expect(available.valid).toBe(true);

    const errored = validate('MetricResult', {
      metricId: 'COLOR.CONTRAST',
      metricVersion: '1.0.0',
      subjectId: 'btn-1',
      status: 'ERROR',
      dependencies: [],
      fingerprint: 'b'.repeat(64),
      metadata: { errorType: 'Error', message: 'boom' },
    });
    expect(errored.valid).toBe(true);
  });

  it('EvaluationResult：PASS 评价结构', () => {
    const result = validate('EvaluationResult', {
      ruleId: 'ACCESSIBILITY.CONTRAST.WCAG_AA',
      ruleVersion: '1.0.0',
      subjectId: 'btn-primary',
      state: 'PASS',
      severity: 'HIGH',
      metricResult: {
        metricId: 'COLOR.CONTRAST',
        metricVersion: '1.0.0',
        subjectId: 'btn-primary',
        status: 'AVAILABLE',
        dependencies: [],
        fingerprint: 'c'.repeat(64),
        value: { ratio: 5.17 },
      },
      evidence: [
        {
          id: 'ev-metric-COLOR.CONTRAST',
          type: 'METRIC',
          referenceId: 'COLOR.CONTRAST@1.0.0',
          relation: 'EVALUATED_BY',
        },
      ],
      fingerprint: 'd'.repeat(64),
    });
    expect(result.valid).toBe(true);
  });

  it('Finding：DETECTED 状态与内嵌评价', () => {
    const evaluation = {
      ruleId: 'ACCESSIBILITY.CONTRAST.WCAG_AA',
      ruleVersion: '1.0.0',
      subjectId: 'btn-gray',
      state: 'FAIL',
      severity: 'HIGH',
      metricResult: {
        metricId: 'COLOR.CONTRAST',
        metricVersion: '1.0.0',
        subjectId: 'btn-gray',
        status: 'AVAILABLE',
        dependencies: [],
        fingerprint: 'e'.repeat(64),
        value: { ratio: 4.48 },
      },
      evidence: [],
      fingerprint: 'f'.repeat(64),
    };
    const result = validate('Finding', {
      id: 'F-0123abcd',
      fingerprint: '0'.repeat(64),
      type: 'COLOR',
      state: 'DETECTED',
      severity: 'HIGH',
      subjectId: 'btn-gray',
      evaluation,
      evidence: [],
      createdAt: TIMESTAMP,
      updatedAt: TIMESTAMP,
    });
    expect(result.valid).toBe(true);
  });

  it('Diagnostic：cause/confidence/explanation', () => {
    const result = validate('Diagnostic', {
      id: 'D-0123abcd',
      findingId: 'F-0123abcd',
      type: 'COLOR',
      cause: 'MEASUREMENT',
      confidence: 'DIRECT',
      evidence: [],
      explanation: '前景色与有效背景的对比度不足 WCAG AA 阈值',
    });
    expect(result.valid).toBe(true);
  });
});

describe('非法对象拒绝', () => {
  it('fingerprint 非 64 位十六进制 → 拒绝', () => {
    const result = validate('MetricResult', {
      metricId: 'M',
      metricVersion: '1.0.0',
      subjectId: 's',
      status: 'AVAILABLE',
      dependencies: [],
      fingerprint: 'not-a-fingerprint',
      value: 1,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.join('\n')).toContain('fingerprint');
  });

  it('state 非法枚举 → 拒绝', () => {
    const result = validate('EvaluationResult', {
      ruleId: 'R',
      ruleVersion: '1.0.0',
      subjectId: 's',
      state: 'MAYBE',
      severity: 'HIGH',
      metricResult: {
        metricId: 'M',
        metricVersion: '1.0.0',
        subjectId: 's',
        status: 'UNKNOWN',
        dependencies: [],
        fingerprint: 'a'.repeat(64),
      },
      evidence: [],
      fingerprint: 'b'.repeat(64),
    });
    expect(result.valid).toBe(false);
  });

  it('Snapshot 缺少 measurements → 拒绝', () => {
    const result = validate('MeasurementSnapshot', {
      id: 'snap-1',
      capturedAt: TIMESTAMP,
      source: SOURCE,
      environment: { viewport: { width: 1, height: 1 }, devicePixelRatio: 1 },
    });
    expect(result.valid).toBe(false);
  });
});

describe('P5 Token 契约族 $defs（IMPL-09 §20/§41、IMPL-13 §28、AD-14）', () => {
  it('DesignToken：内部投影（layer + valueType 双字段）通过', () => {
    const result = validate('DesignToken', {
      id: 'color.blue.600',
      name: 'Blue 600',
      layer: 'PRIMITIVE',
      valueType: 'COLOR',
      value: '#2563eb',
    });
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it('DesignToken：缺 valueType（AD-14 双字段必须齐备）→ 拒绝', () => {
    const result = validate('DesignToken', {
      id: 'color.blue.600',
      name: 'Blue 600',
      layer: 'PRIMITIVE',
      value: '#2563eb',
    });
    expect(result.valid).toBe(false);
  });

  it('DesignToken：layer 非法枚举 → 拒绝', () => {
    const result = validate('DesignToken', {
      id: 'x',
      name: 'X',
      layer: 'PRIMARY',
      valueType: 'COLOR',
      value: 1,
    });
    expect(result.valid).toBe(false);
  });

  it('TokenBinding：EXPLICIT + tokenId + DIRECT 通过', () => {
    const result = validate('TokenBinding', {
      subjectId: 'token.button.exact',
      tokenId: 'button.primary.background',
      bindingType: 'EXPLICIT',
      source: 'data-uiq-token',
      confidence: 'DIRECT',
    });
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it('TokenBinding：UNRESOLVED 无 tokenId 通过（AC-THEME-06）', () => {
    const result = validate('TokenBinding', {
      subjectId: 'token.button.orphan-bg',
      bindingType: 'UNRESOLVED',
      source: 'no-binding-evidence',
      confidence: 'UNKNOWN',
    });
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it('TokenBinding：UNRESOLVED 强带 tokenId → 拒绝（AC-THEME-06 schema 层拒绝）', () => {
    const result = validate('TokenBinding', {
      subjectId: 's',
      tokenId: 'some.token',
      bindingType: 'UNRESOLVED',
      confidence: 'UNKNOWN',
    });
    expect(result.valid).toBe(false);
  });

  it('Theme：id/version/name/tokens 覆盖值映射通过（IMPL-09 §20 + TK-01 §63 version）', () => {
    const result = validate('Theme', {
      id: 'dark',
      version: '1.0.0',
      name: 'Dark',
      tokens: { 'color.surface.base': '#171717' },
    });
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it('Theme：缺 version（不可重放）→ 拒绝', () => {
    const result = validate('Theme', { id: 'dark', name: 'Dark', tokens: {} });
    expect(result.valid).toBe(false);
  });

  it('ComponentContract：requiredTokens 通过（IMPL-13 §28）', () => {
    const result = validate('ComponentContract', {
      id: 'button.primary',
      version: '1.0.0',
      requiredTokens: ['button.primary.background'],
      optionalTokens: ['button.primary.focus_ring'],
      states: ['hover', 'active'],
    });
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it('ComponentContract：缺 requiredTokens → 拒绝', () => {
    const result = validate('ComponentContract', { id: 'button.primary', version: '1.0.0' });
    expect(result.valid).toBe(false);
  });

  it('MeasurementSnapshot：携带 bindings 投影通过（IMPL-09 §32-33）', () => {
    const result = validate('MeasurementSnapshot', {
      id: 'snap-token-1',
      capturedAt: TIMESTAMP,
      source: SOURCE,
      measurements: [colorMeasurement('AVAILABLE', { r: 1, g: 1, b: 1, alpha: 1 })],
      bindings: [
        {
          subjectId: 'token.button.exact',
          tokenId: 'button.primary.background',
          bindingType: 'EXPLICIT',
          confidence: 'DIRECT',
        },
        { subjectId: 'token.button.orphan', bindingType: 'UNRESOLVED', confidence: 'UNKNOWN' },
      ],
    });
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });
});
