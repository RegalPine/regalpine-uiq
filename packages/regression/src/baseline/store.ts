import type { Baseline } from './contracts';

export class BaselineStoreError extends Error {
  override readonly name = 'BaselineStoreError';
  constructor(message: string) {
    super(message);
  }
}

export interface SaveOptions {
  /** 默认 false：已存在同 id 时不覆盖（"不默认覆盖"，PLAN P6-02）。 */
  readonly overwrite?: boolean;
}

/**
 * Baseline 存储端口。V1.0 内存实现由本包提供；JSON 文件/Artifact 存储适配
 * 属应用层（IMPL-11 §69：V1.0 不要求数据库）。
 */
export interface BaselineStore {
  load(id: string): Baseline | undefined;
  save(baseline: Baseline, options?: SaveOptions): void;
  list(): readonly Baseline[];
}

export function createInMemoryBaselineStore(): BaselineStore {
  const baselines = new Map<string, Baseline>();
  return {
    load(id: string): Baseline | undefined {
      return baselines.get(id);
    },
    save(baseline: Baseline, options?: SaveOptions): void {
      if (baselines.has(baseline.id) && options?.overwrite !== true) {
        throw new BaselineStoreError(
          `Baseline ${baseline.id} 已存在；不默认覆盖，需显式 overwrite 重存`,
        );
      }
      baselines.set(baseline.id, baseline);
    },
    list(): readonly Baseline[] {
      return [...baselines.values()];
    },
  };
}
