import { describe, expect, it } from 'vitest';
import { createAnalysisCache, computeConfigHash } from '@uiq/inspector';

describe('P9: AnalysisCache — 不跨 snapshot/theme 污染', () => {
  it('starts empty', () => {
    const cache = createAnalysisCache();
    expect(cache.size).toBe(0);
  });

  it('set and get with matching key', () => {
    const cache = createAnalysisCache();
    const key = { snapshotId: 's1', themeId: null, configHash: 'abc' };
    cache.set(key, { value: 42 });
    const entry = cache.get(key);
    expect(entry).not.toBeNull();
    expect(entry!.value).toEqual({ value: 42 });
  });

  it('returns null for non-existent key', () => {
    const cache = createAnalysisCache();
    expect(cache.get({ snapshotId: 'missing', themeId: null, configHash: 'x' })).toBeNull();
  });

  it('different snapshotId does not match', () => {
    const cache = createAnalysisCache();
    cache.set({ snapshotId: 's1', themeId: null, configHash: 'h' }, 'data');
    expect(cache.get({ snapshotId: 's2', themeId: null, configHash: 'h' })).toBeNull();
  });

  it('different themeId does not match (anti-case: cross-theme pollution)', () => {
    const cache = createAnalysisCache();
    cache.set({ snapshotId: 's1', themeId: 'light', configHash: 'h' }, 'light-data');
    expect(cache.get({ snapshotId: 's1', themeId: 'dark', configHash: 'h' })).toBeNull();
  });

  it('invalidateSnapshot removes all entries for that snapshot', () => {
    const cache = createAnalysisCache();
    cache.set({ snapshotId: 's1', themeId: 'light', configHash: 'h1' }, 'a');
    cache.set({ snapshotId: 's1', themeId: 'dark', configHash: 'h2' }, 'b');
    cache.set({ snapshotId: 's2', themeId: null, configHash: 'h3' }, 'c');
    cache.invalidateSnapshot('s1');
    expect(cache.size).toBe(1);
    expect(cache.get({ snapshotId: 's2', themeId: null, configHash: 'h3' })).not.toBeNull();
  });

  it('clear removes all entries', () => {
    const cache = createAnalysisCache();
    cache.set({ snapshotId: 's1', themeId: null, configHash: 'h' }, 'a');
    cache.set({ snapshotId: 's2', themeId: null, configHash: 'h' }, 'b');
    cache.clear();
    expect(cache.size).toBe(0);
  });

  it('computeConfigHash is deterministic', () => {
    const h1 = computeConfigHash({ a: 1, b: [2, 3] });
    const h2 = computeConfigHash({ a: 1, b: [2, 3] });
    expect(h1).toBe(h2);
  });

  it('computeConfigHash differs for different configs', () => {
    const h1 = computeConfigHash({ a: 1 });
    const h2 = computeConfigHash({ a: 2 });
    expect(h1).not.toBe(h2);
  });
});
