import { describe, expect, it } from 'vitest';
import { computeOverlayStyle } from '@uiq/inspector';

describe('P9: SelectionOverlay — AD-12 不干扰采集', () => {
  it('returns null when rect is null', () => {
    const style = computeOverlayStyle(null, { x: 0, y: 0 });
    expect(style).toBeNull();
  });

  it('returns positioned style with pointer-events:none', () => {
    const rect = { x: 10, y: 20, width: 100, height: 50 };
    const style = computeOverlayStyle(rect, { x: 0, y: 0 });
    expect(style).not.toBeNull();
    expect(style!.pointerEvents).toBe('none');
    expect(style!.position).toBe('absolute');
  });

  it('applies iframe offset to position', () => {
    const rect = { x: 10, y: 20, width: 100, height: 50 };
    const style = computeOverlayStyle(rect, { x: 50, y: 100 });
    expect(style!.left).toBe('60px');
    expect(style!.top).toBe('120px');
    expect(style!.width).toBe('100px');
    expect(style!.height).toBe('50px');
  });

  it('has high z-index to appear above iframe content', () => {
    const rect = { x: 0, y: 0, width: 50, height: 50 };
    const style = computeOverlayStyle(rect, { x: 0, y: 0 });
    expect(style!.zIndex as number).toBeGreaterThan(9999);
  });
});
