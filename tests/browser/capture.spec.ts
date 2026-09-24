import { expect, test } from '@playwright/test';
import type { SRGB } from '@uiq/color';
import { findMeasurement, injectAndCapture, referenceUrl } from './helpers';

interface ChainLayer {
  readonly elementId: string;
  readonly color: string;
  readonly alpha: number | null;
  readonly source: string;
  readonly kind: string;
}

test.beforeEach(async ({ page }) => {
  await page.goto(referenceUrl('button.html'));
});

test.describe('BROWSER-GOLDEN（IMPL-07 §68）', () => {
  test('GOLDEN-001：computed color → color.srgb（alpha 保留）', async ({ page }) => {
    const snapshot = await injectAndCapture(page);
    const fg = findMeasurement(snapshot, 'btn-primary', 'color.srgb');
    expect(fg?.status).toBe('AVAILABLE');
    expect(fg?.value).toEqual({ r: 1, g: 1, b: 1, alpha: 1 });
  });

  test('GOLDEN-002：不透明背景直接解析（#2563eb）', async ({ page }) => {
    const snapshot = await injectAndCapture(page);
    const bg = findMeasurement(snapshot, 'btn-primary', 'color.srgb.background');
    expect(bg?.status).toBe('AVAILABLE');
    expect(bg?.value).toEqual({ r: 37 / 255, g: 99 / 255, b: 235 / 255, alpha: 1 });
  });

  test('GOLDEN-003：transparent 祖先解析 → body #ffffff（§19-21）', async ({ page }) => {
    const snapshot = await injectAndCapture(page);
    const bg = findMeasurement(snapshot, 'btn-transparent-chain', 'color.srgb.background');
    expect(bg?.status).toBe('AVAILABLE');
    expect(bg?.value).toEqual({ r: 1, g: 1, b: 1, alpha: 1 });
    // 链：button(T) → wrapper(T) → row(T) → main(T) → body(#fff)
    const chain = bg?.metadata?.['backgroundChain'] as readonly ChainLayer[] | undefined;
    expect(chain).toHaveLength(5);
    expect(chain?.[0]?.source).toBe('SELF');
    for (let i = 0; i < 4; i += 1) {
      expect(chain?.[i]?.alpha).toBe(0);
    }
    expect(chain?.[4]?.alpha).toBe(1);
    expect(chain?.[4]?.color).toBe('rgb(255, 255, 255)');
  });

  test('渐变背景 → UNKNOWN，不视觉近似（§24）', async ({ page }) => {
    const snapshot = await injectAndCapture(page);
    const bg = findMeasurement(snapshot, 'btn-gradient', 'color.srgb.background');
    expect(bg?.status).toBe('UNKNOWN');
    expect(bg?.value).toBeNull();
    expect(bg?.metadata?.['reason']).toBe('complex');
    const chain = bg?.metadata?.['backgroundChain'] as readonly ChainLayer[] | undefined;
    expect(chain?.[0]?.kind).toBe('COMPLEX');
  });

  test('半透明背景逐层合成 → 不透明结果（§22-23，Linear RGB）', async ({ page }) => {
    const snapshot = await injectAndCapture(page);
    const bg = findMeasurement(snapshot, 'btn-alpha', 'color.srgb.background');
    expect(bg?.status).toBe('AVAILABLE');
    const value = bg?.value as SRGB | undefined;
    expect(value?.alpha).toBe(1);
    // 合成结果 ≈ Linear RGB 下 rgba(37,99,235,0.6) over #fff ≈ rgb(173,183,244)
    expect(value?.r).toBeGreaterThan(0.45);
    expect(value?.r).toBeLessThan(0.75);
    expect(value?.g).toBeGreaterThan(0.6);
    expect(value?.g).toBeLessThan(0.8);
    expect(value?.b).toBeGreaterThan(0.9);
    expect(value?.b).toBeLessThan(1);
    const chain = bg?.metadata?.['backgroundChain'] as readonly ChainLayer[] | undefined;
    expect(chain?.[0]?.color).toBe('rgba(37, 99, 235, 0.6)');
  });
});

test.describe('几何与排版采集（IMPL-07 §26-39）', () => {
  test('geometry：viewport-relative 且非零尺寸', async ({ page }) => {
    const snapshot = await injectAndCapture(page);
    const width = findMeasurement(snapshot, 'btn-primary', 'geometry.width');
    expect(width?.status).toBe('AVAILABLE');
    expect(width?.value as number).toBeGreaterThan(0);
    const x = findMeasurement(snapshot, 'btn-primary', 'geometry.x');
    expect(x?.value as number).toBeGreaterThanOrEqual(0);
    const metadata = x?.metadata as Record<string, unknown> | undefined;
    expect(metadata?.['right']).toBeGreaterThan((x?.value as number) ?? 0);
  });

  test('typography：px 归一化、line-height {px, ratio}、font-weight 保留', async ({ page }) => {
    const snapshot = await injectAndCapture(page);
    const fontSize = findMeasurement(snapshot, 'btn-primary', 'typography.font-size');
    expect(fontSize?.value).toBe(16);
    const lineHeight = findMeasurement(snapshot, 'btn-primary', 'typography.line-height');
    expect(lineHeight?.value).toEqual({ px: 24, ratio: 1.5 });
    const fontWeight = findMeasurement(snapshot, 'btn-primary', 'typography.font-weight');
    expect(fontWeight?.value).toBe(400);
    // letter-spacing: normal → UNKNOWN（§31）
    const letterSpacing = findMeasurement(snapshot, 'btn-primary', 'typography.letter-spacing');
    expect(letterSpacing?.status).toBe('UNKNOWN');
    expect(letterSpacing?.value).toBeNull();
  });

  test('display:none：0 尺寸记录 + metadata.display 标记（§39）', async ({ page }) => {
    const snapshot = await injectAndCapture(page);
    const width = findMeasurement(snapshot, 'btn-hidden', 'geometry.width');
    expect(width?.value).toBe(0);
    expect((width?.metadata as Record<string, unknown>)?.['display']).toBe('none');
    // computed style 仍可读取：白字黑底颜色 AVAILABLE
    const fg = findMeasurement(snapshot, 'btn-hidden', 'color.srgb');
    expect(fg?.status).toBe('AVAILABLE');
  });

  test('AC-BROWSER-11：单属性测量错误被隔离，不影响其他测量（§56）', async ({ page }) => {
    // 注入：仅对 btn-primary 的 computed style 抛错；init script 对下一次导航生效
    await page.addInitScript(() => {
      const original = window.getComputedStyle.bind(window);
      window.getComputedStyle = ((el: Element) => {
        const style = original(el);
        if ((el as HTMLElement).dataset?.['uiqId'] === 'btn-primary') {
          return new Proxy(style, {
            get(target, prop) {
              if (prop === 'color' || prop === 'backgroundColor' || prop === 'backgroundImage') {
                throw new Error('injected-style-failure');
              }
              return Reflect.get(target, prop, target);
            },
          }) as CSSStyleDeclaration;
        }
        return style;
      }) as typeof window.getComputedStyle;
    });
    await page.reload();

    const snapshot = await injectAndCapture(page);
    // COLOR 类别失败 → ERROR 且 value null，不伪造
    const fg = findMeasurement(snapshot, 'btn-primary', 'color.srgb');
    expect(fg?.status).toBe('ERROR');
    expect(fg?.value).toBeNull();
    const bg = findMeasurement(snapshot, 'btn-primary', 'color.srgb.background');
    expect(bg?.status).toBe('ERROR');
    // 同一元素的其他类别继续可用（§56 错误隔离）
    const width = findMeasurement(snapshot, 'btn-primary', 'geometry.width');
    expect(width?.status).toBe('AVAILABLE');
    const fontSize = findMeasurement(snapshot, 'btn-primary', 'typography.font-size');
    expect(fontSize?.status).toBe('AVAILABLE');
  });
});

test.describe('环境记录（IMPL-07 §43/§52）', () => {
  test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });

  test('viewport/DPR/scroll/browser 完整记录', async ({ page }) => {
    const snapshot = await injectAndCapture(page);
    const environment = snapshot.environment;
    expect(environment).toBeDefined();
    expect(environment?.viewport).toEqual({ width: 390, height: 844 });
    expect(environment?.devicePixelRatio).toBe(2);
    expect(environment?.scrollX).toBe(0);
    expect(environment?.scrollY).toBe(0);
    expect(environment?.browser?.name).toBeTruthy();
    // P12-01：三浏览器矩阵 — 名称由实际引擎决定（Chrome / Firefox / Safari）
    expect(['Chrome', 'Firefox', 'Safari'].map(String)).toContain(environment?.browser?.name);
  });
});
