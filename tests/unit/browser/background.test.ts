import { describe, expect, it } from 'vitest';
import { classifyBackground, composeBackgroundLayers } from '@uiq/browser';
import type { BackgroundLayer } from '@uiq/browser';
import { parseColor } from '@uiq/color';

// parseColor 失败会抛异常（而非返回 undefined），此处需捕获为 alpha: null ——
// 与 resolveBackgroundChain 的真实行为一致（COMPLEX 层 alpha 记为 null）。
function layer(color: string, source: BackgroundLayer['source'] = 'SELF'): BackgroundLayer {
  let alpha: number | null;
  try {
    alpha = parseColor(color).alpha;
  } catch {
    alpha = null;
  }
  return {
    elementId: `el-${Math.random().toString(36).slice(2, 8)}`,
    color,
    alpha,
    source,
    kind: alpha === null ? 'COMPLEX' : alpha === 0 ? 'TRANSPARENT' : 'SOLID',
  };
}

describe('classifyBackground（IMPL-07 §19-24）', () => {
  it('不透明纯色 → SOLID', () => {
    expect(classifyBackground('rgb(37, 99, 235)', 'none')).toBe('SOLID');
    expect(classifyBackground('#2563eb', 'none')).toBe('SOLID');
  });

  it('transparent → TRANSPARENT', () => {
    expect(classifyBackground('transparent', 'none')).toBe('TRANSPARENT');
    expect(classifyBackground('rgba(0, 0, 0, 0)', 'none')).toBe('TRANSPARENT');
  });

  it('渐变 → COMPLEX（不近似）', () => {
    expect(classifyBackground('transparent', 'linear-gradient(to right, red, blue)')).toBe(
      'COMPLEX',
    );
    expect(classifyBackground('rgb(255,255,255)', 'radial-gradient(circle, red, blue)')).toBe(
      'COMPLEX',
    );
  });

  it('多重背景 → COMPLEX', () => {
    expect(classifyBackground('rgba(0,0,255,0.5), rgba(255,0,0,0.5)', 'none')).toBe('COMPLEX');
  });

  it('括号内逗号不算多重背景', () => {
    expect(classifyBackground('rgba(0, 0, 255, 0.5)', 'none')).toBe('SOLID');
  });

  it('无法解析的颜色 → COMPLEX（UNKNOWN 而非伪造）', () => {
    expect(classifyBackground('color(display-p3 1 0 0)', 'none')).toBe('COMPLEX');
  });
});

describe('composeBackgroundLayers（IMPL-07 §22-23）', () => {
  it('单层不透明背景原样返回', () => {
    const result = composeBackgroundLayers([layer('#ffffff')]);
    expect(result).toEqual({ r: 1, g: 1, b: 1, alpha: 1 });
  });

  it('半透明层合成在不透明底之上（Linear RGB 合成）', () => {
    const result = composeBackgroundLayers([
      layer('rgba(37, 99, 235, 0.6)'),
      layer('#ffffff', 'ANCESTOR'),
    ]);
    expect(result).not.toBeNull();
    expect(result?.alpha).toBe(1);
    // 合成结果介于纯蓝与白之间（sRGB 各通道）
    expect(result!.r).toBeGreaterThan(37 / 255);
    expect(result!.r).toBeLessThan(1);
    expect(result!.b).toBeGreaterThan(235 / 255);
    expect(result!.b).toBeLessThan(1);
  });

  it('透明层不影响合成结果', () => {
    const withTransparent = composeBackgroundLayers([
      layer('rgba(0, 0, 0, 0)'),
      layer('#2563eb'),
      layer('transparent', 'ANCESTOR'),
    ]);
    const without = composeBackgroundLayers([layer('#2563eb')]);
    expect(withTransparent).toEqual(without);
  });

  it('全部半透明且无不透明底 → null（UNKNOWN）', () => {
    expect(composeBackgroundLayers([layer('rgba(0, 0, 0, 0.5)')])).toBeNull();
  });

  it('无法解析的层 → null', () => {
    expect(composeBackgroundLayers([layer('not-a-color')])).toBeNull();
  });

  it('嵌套半透明逐层合成（§23）', () => {
    const result = composeBackgroundLayers([
      layer('rgba(255, 0, 0, 0.5)'),
      layer('rgba(0, 0, 255, 0.5)', 'ANCESTOR'),
      layer('#ffffff', 'ANCESTOR'),
    ]);
    expect(result).not.toBeNull();
    expect(result?.alpha).toBe(1);
  });
});
