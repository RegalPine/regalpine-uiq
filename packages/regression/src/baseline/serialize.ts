import { canonicalJson } from '@uiq/core';
import type { Baseline } from './contracts';
import { BaselineInputError } from './contracts';

/**
 * Baseline JSON 往返（IMPL-11 §69：V1.0 JSON/Artifact 存储即可）。
 * canonical JSON 序列化保证键序确定（AD-08）；深度契约校验由宿主注入
 * regression schema（AD-05：Ajv 宿主在应用），此处仅做最小形状守卫。
 */
export function serializeBaseline(baseline: Baseline): string {
  return canonicalJson(baseline);
}

export function deserializeBaseline(json: string): Baseline {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (error) {
    throw new BaselineInputError(
      `Baseline JSON 解析失败：${error instanceof Error ? error.message : String(error)}`,
    );
  }
  const candidate = parsed as Partial<Baseline> | null;
  if (
    candidate === null ||
    typeof candidate !== 'object' ||
    typeof candidate.id !== 'string' ||
    candidate.engine === undefined ||
    typeof candidate.engine.version !== 'string' ||
    !Array.isArray(candidate.evaluations) ||
    !Array.isArray(candidate.metrics)
  ) {
    throw new BaselineInputError('输入不是有效的 Baseline（缺 id/engine/evaluations/metrics）');
  }
  return parsed as Baseline;
}
