import { describe, expect, it } from 'vitest';
import { classifyVisibility, classifyDisplayMode } from '@uiq/browser';

describe('P8: classifyVisibility', () => {
  const base = {
    display: 'block',
    visibility: 'visible',
    width: 100,
    height: 50,
    viewportWidth: 1440,
    viewportHeight: 900,
    left: 10,
    top: 10,
    right: 110,
    bottom: 60,
    overflow: 'visible',
    clip: 'none',
  };

  it('returns VISIBLE for normal element', () => {
    expect(classifyVisibility(base)).toEqual({ state: 'VISIBLE', reasons: [] });
  });

  it('returns DISPLAY_NONE when display is none', () => {
    const result = classifyVisibility({ ...base, display: 'none' });
    expect(result.state).toBe('DISPLAY_NONE');
    expect(result.reasons).toContain('display:none');
  });

  it('returns VISIBILITY_HIDDEN when visibility is hidden', () => {
    const result = classifyVisibility({ ...base, visibility: 'hidden' });
    expect(result.state).toBe('VISIBILITY_HIDDEN');
  });

  it('returns ZERO_SIZE when width is 0', () => {
    const result = classifyVisibility({ ...base, width: 0 });
    expect(result.state).toBe('ZERO_SIZE');
    expect(result.reasons).toContain('width:0');
  });

  it('returns ZERO_SIZE when height is negative', () => {
    const result = classifyVisibility({ ...base, height: -5 });
    expect(result.state).toBe('ZERO_SIZE');
  });

  it('returns OFFSCREEN when element is entirely to the left of viewport', () => {
    const result = classifyVisibility({ ...base, right: -10 });
    expect(result.state).toBe('OFFSCREEN');
  });

  it('returns OFFSCREEN when element is entirely below viewport', () => {
    const result = classifyVisibility({ ...base, top: 1000, viewportHeight: 900 });
    expect(result.state).toBe('OFFSCREEN');
  });

  it('returns CLIPPED when overflow is hidden and clip is set', () => {
    const result = classifyVisibility({ ...base, overflow: 'hidden', clip: 'rect(0,0,0,0)' });
    expect(result.state).toBe('CLIPPED');
  });

  it('DISPLAY_NONE takes priority over VISIBILITY_HIDDEN', () => {
    const result = classifyVisibility({ ...base, display: 'none', visibility: 'hidden' });
    expect(result.state).toBe('DISPLAY_NONE');
  });

  it('VISIBILITY_HIDDEN takes priority over ZERO_SIZE', () => {
    const result = classifyVisibility({ ...base, visibility: 'hidden', width: 0 });
    expect(result.state).toBe('VISIBILITY_HIDDEN');
  });
});

describe('P8: classifyDisplayMode', () => {
  it('returns BLOCK for display:block', () => {
    expect(classifyDisplayMode('block', 'static').mode).toBe('BLOCK');
  });

  it('returns FLEX for display:flex', () => {
    expect(classifyDisplayMode('flex', 'static').mode).toBe('FLEX');
  });

  it('returns GRID for display:grid', () => {
    expect(classifyDisplayMode('grid', 'static').mode).toBe('GRID');
  });

  it('returns ABSOLUTE when position is absolute regardless of display', () => {
    expect(classifyDisplayMode('block', 'absolute').mode).toBe('ABSOLUTE');
  });

  it('returns FIXED when position is fixed', () => {
    expect(classifyDisplayMode('block', 'fixed').mode).toBe('FIXED');
  });

  it('returns INLINE_FLEX for display:inline-flex', () => {
    expect(classifyDisplayMode('inline-flex', 'static').mode).toBe('INLINE_FLEX');
  });

  it('returns INLINE_GRID for display:inline-grid', () => {
    expect(classifyDisplayMode('inline-grid', 'static').mode).toBe('INLINE_GRID');
  });

  it('returns TABLE for display:table', () => {
    expect(classifyDisplayMode('table', 'static').mode).toBe('TABLE');
  });

  it('returns TABLE for display:table-cell', () => {
    expect(classifyDisplayMode('table-cell', 'static').mode).toBe('TABLE');
  });

  it('returns OTHER for unknown display values', () => {
    expect(classifyDisplayMode('contents', 'static').mode).toBe('OTHER');
  });

  it('preserves display and position in result', () => {
    const result = classifyDisplayMode('flex', 'relative');
    expect(result.display).toBe('flex');
    expect(result.position).toBe('relative');
  });
});
