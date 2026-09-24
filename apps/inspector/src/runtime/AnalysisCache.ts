/**
 * P9：分析缓存（IMPL-10 §56）。
 *
 * 缓存 key = snapshotId + configHash。
 * 不跨 snapshot/theme/browser state 复用（防止错误复用）。
 */
import { canonicalJson } from '@uiq/core';

export interface AnalysisCacheKey {
  readonly snapshotId: string;
  readonly themeId: string | null;
  readonly configHash: string;
}

export interface AnalysisCacheEntry<T> {
  readonly key: AnalysisCacheKey;
  readonly value: T;
  readonly cachedAt: number;
}

function cacheKeyToString(key: AnalysisCacheKey): string {
  return `${key.snapshotId}::${key.themeId ?? 'null'}::${key.configHash}`;
}

/** 计算配置哈希（基于 canonicalJson）。 */
export function computeConfigHash(config: unknown): string {
  const json = canonicalJson(config);
  let hash = 0;
  for (let i = 0; i < json.length; i += 1) {
    const char = json.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash).toString(36);
}

export interface AnalysisCache {
  /** 获取缓存（严格匹配 snapshotId + themeId + configHash）。 */
  get<T>(key: AnalysisCacheKey): AnalysisCacheEntry<T> | null;
  /** 设置缓存。 */
  set<T>(key: AnalysisCacheKey, value: T): void;
  /** 清除指定 snapshotId 的所有缓存（主题切换时调用）。 */
  invalidateSnapshot(snapshotId: string): void;
  /** 清除所有缓存。 */
  clear(): void;
  /** 缓存条目数。 */
  readonly size: number;
}

/** 创建分析缓存（内存实现；Inspector 默认内存，AD-20 持久化需用户显式保存）。 */
export function createAnalysisCache(): AnalysisCache {
  const store = new Map<string, AnalysisCacheEntry<unknown>>();

  return {
    get<T>(key: AnalysisCacheKey): AnalysisCacheEntry<T> | null {
      const entry = store.get(cacheKeyToString(key));
      return (entry as AnalysisCacheEntry<T> | undefined) ?? null;
    },

    set<T>(key: AnalysisCacheKey, value: T): void {
      store.set(cacheKeyToString(key), {
        key,
        value,
        cachedAt: Date.now(),
      });
    },

    invalidateSnapshot(snapshotId: string): void {
      for (const [keyStr, entry] of store) {
        if (entry.key.snapshotId === snapshotId) {
          store.delete(keyStr);
        }
      }
    },

    clear(): void {
      store.clear();
    },

    get size(): number {
      return store.size;
    },
  };
}
