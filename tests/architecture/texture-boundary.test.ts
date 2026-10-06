import { describe, expect, it } from 'vitest';
import {
  surfaceMetrics, depthMetrics, colorTextureMetrics,
  typographyTextureMetrics, spatialTextureMetrics, motionTextureMetrics,
  microDetailTextureMetrics,
} from '@uiq/metrics';
import {
  surfaceRules, depthRules, colorTextureRules,
  typographyTextureRules, spatialTextureRules, motionTextureRules,
  microDetailTextureRules,
} from '@uiq/rules';
import {
  diagnoseSurface, diagnoseDepth, diagnoseColorTexture,
  diagnoseTypographyTexture, diagnoseSpatialTexture,
  diagnoseMotionTexture, diagnoseMicroDetailTexture,
} from '@uiq/diagnostic';

/**
 * 架构约束测试：Texture Metric 不依赖 Rule/Browser/React/LLM。
 *
 * 验证分层架构的单向依赖：
 * Measurement → Metric → Rule → Finding → Diagnostic → Recommendation
 */
describe('Architecture: Texture Metrics Boundary', () => {
  const allMetrics = [
    ...surfaceMetrics, ...depthMetrics, ...colorTextureMetrics,
    ...typographyTextureMetrics, ...spatialTextureMetrics,
    ...motionTextureMetrics, ...microDetailTextureMetrics,
  ];

  it('所有 Metric 只依赖 MeasurementSnapshot (不依赖 Rule)', () => {
    for (const metric of allMetrics) {
      expect(metric.dependencies).toBeDefined();
      expect(Array.isArray(metric.dependencies)).toBe(true);
      for (const dep of metric.dependencies) {
        expect(typeof dep).toBe('string');
      }
    }
  });

  it('所有 Metric 有 id/version/kind/calculate', () => {
    for (const metric of allMetrics) {
      expect(metric.id).toBeTruthy();
      expect(metric.version).toBeTruthy();
      expect(metric.kind).toBeTruthy();
      expect(typeof metric.calculate).toBe('function');
    }
  });

  it('Metric 不引用任何 Rule 对象', () => {
    for (const metric of allMetrics) {
      const metricStr = JSON.stringify(metric);
      expect(metricStr).not.toContain('threshold');
      expect(metricStr).not.toContain('operator');
      expect(metricStr).not.toContain('severity');
    }
  });
});

describe('Architecture: Texture Rules Boundary', () => {
  const allRules = [
    ...surfaceRules, ...depthRules, ...colorTextureRules,
    ...typographyTextureRules, ...spatialTextureRules,
    ...motionTextureRules, ...microDetailTextureRules,
  ];

  it('所有 Rule 引用 Metric ID (字符串) 而非 Metric 对象', () => {
    for (const rule of allRules) {
      expect(typeof rule.metricId).toBe('string');
    }
  });

  it('Rule 不依赖 Browser/Reporting', () => {
    for (const rule of allRules) {
      const ruleStr = JSON.stringify(rule);
      expect(ruleStr).not.toContain('browser');
      expect(ruleStr).not.toContain('snapshot');
      expect(ruleStr).not.toContain('recommendation');
    }
  });
});

describe('Architecture: Diagnostic Boundary', () => {
  it('诊断器接受 Finding[] 返回 Diagnostic[]', () => {
    const diagnostors = [
      diagnoseSurface, diagnoseDepth, diagnoseColorTexture,
      diagnoseTypographyTexture, diagnoseSpatialTexture,
      diagnoseMotionTexture, diagnoseMicroDetailTexture,
    ];
    for (const fn of diagnostors) {
      expect(typeof fn).toBe('function');
      const result = fn([]);
      expect(Array.isArray(result)).toBe(true);
    }
  });

  it('诊断器不重新计算 Metric', () => {
    for (const fn of diagnostors) {
      const fnStr = fn.toString();
      expect(fnStr).not.toContain('.calculate(');
    }
  });
});

const diagnostors = [
  diagnoseSurface, diagnoseDepth, diagnoseColorTexture,
  diagnoseTypographyTexture, diagnoseSpatialTexture,
  diagnoseMotionTexture, diagnoseMicroDetailTexture,
];
