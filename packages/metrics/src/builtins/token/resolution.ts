/**
 * TOKEN.RESOLUTION@1.0.0（IMPL-09 §26，AD-17 裁决的指标 ID）。
 * subjectId = tokenId；输出 resolvedValue + resolutionChain；
 * UNKNOWN/ERROR 按 port 结果传播（不伪造、不猜测）。
 *
 * 工厂显式注册：port 未注入时不注册该指标——静默 UNKNOWN 违反"不伪造"原则。
 */
import type { MetricCalculationContext, MetricDefinition, MetricResult } from '@uiq/core';
import type { TokenResolutionPort } from './types';

export interface TokenResolutionValue {
  readonly resolvedValue: unknown;
  readonly resolutionChain: readonly string[];
}

const EMPTY_BASE = {
  dependencies: [] as [],
  fingerprint: '',
} as const;

export function createTokenResolutionMetric(
  port: TokenResolutionPort,
): MetricDefinition<TokenResolutionValue> {
  return {
    id: 'TOKEN.RESOLUTION',
    version: '1.0.0',
    kind: 'DERIVED',
    dependencies: [],
    calculate(ctx: MetricCalculationContext): MetricResult<TokenResolutionValue> {
      const outcome = port.resolve(ctx.subjectId);
      if (outcome.status === 'RESOLVED') {
        return {
          metricId: this.id,
          metricVersion: this.version,
          subjectId: ctx.subjectId,
          status: 'AVAILABLE',
          value: {
            resolvedValue: outcome.resolvedValue,
            resolutionChain: [...(outcome.chain ?? [])],
          },
          ...EMPTY_BASE,
          metadata: { source: 'TOKEN_RESOLUTION_PORT' },
        };
      }
      if (outcome.status === 'ERROR') {
        return {
          metricId: this.id,
          metricVersion: this.version,
          subjectId: ctx.subjectId,
          status: 'ERROR',
          ...EMPTY_BASE,
          metadata: {
            reason: 'TOKEN_RESOLUTION_PORT_ERROR',
            ...(outcome.chain !== undefined ? { chain: [...outcome.chain] } : {}),
          },
        };
      }
      return {
        metricId: this.id,
        metricVersion: this.version,
        subjectId: ctx.subjectId,
        status: 'UNKNOWN',
        ...EMPTY_BASE,
        metadata: { reason: 'TOKEN_UNRESOLVED' },
      };
    },
  };
}
