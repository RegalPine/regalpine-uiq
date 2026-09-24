import { expect, test } from '@playwright/test';
import type { Measurement, MeasurementSnapshot } from '@uiq/core';
import { injectAndCapture, radixGlobalPath, referenceUrl } from './helpers';

/** 与 CLI 夹具一致的 CSS 变量映射（IMPL-09 §34）。 */
const CSS_VARIABLE_MAP = {
  'color.action.primary': '--uiq-color-primary',
  'card.surface.background': '--uiq-surface',
  'dialog.surface.background': '--uiq-surface',
};

function findMeasurement(
  snapshot: MeasurementSnapshot,
  subjectId: string,
  type: string,
): Measurement | undefined {
  return snapshot.measurements.find((m) => m.subjectId === subjectId && m.type === type);
}

test.beforeEach(async ({ page }) => {
  await page.goto(referenceUrl('tokens.html'));
});

test.describe('Token 绑定采集（IMPL-09 §32-36）', () => {
  test('三类绑定：EXPLICIT(DIRECT) / INFERRED(INFERRED) / UNRESOLVED(UNKNOWN)', async ({
    page,
  }) => {
    const snapshot = await injectAndCapture(page, {
      includeBindings: true,
      cssVariableMap: CSS_VARIABLE_MAP,
    });
    const bindings = snapshot.bindings ?? [];
    expect(bindings.length).toBeGreaterThan(0);
    const bySubject = new Map(bindings.map((b) => [b.subjectId, b]));

    // EXPLICIT：data-uiq-token 属性 → DIRECT。
    expect(bySubject.get('token.button.exact')).toMatchObject({
      tokenId: 'button.primary.background',
      bindingType: 'EXPLICIT',
      confidence: 'DIRECT',
      source: 'data-uiq-token',
    });

    // INFERRED：无显式属性 + cssVariableMap 命中非空变量；值匹配 ≠ 来源匹配（AC-THEME-07）。
    expect(bySubject.get('token.button.inferred')).toMatchObject({
      tokenId: 'color.action.primary',
      bindingType: 'INFERRED',
      confidence: 'INFERRED',
    });

    // UNRESOLVED：无绑定证据 → 不强行推断（AC-THEME-06）。
    const unresolved = bySubject.get('token.button.orphan-bg');
    expect(unresolved).toMatchObject({ bindingType: 'UNRESOLVED', confidence: 'UNKNOWN' });
    expect(unresolved?.tokenId).toBeUndefined();
  });

  test('includeBindings 缺省时 snapshot 不携带 bindings（IMPL-09 §32-33）', async ({ page }) => {
    const snapshot = await injectAndCapture(page);
    expect(snapshot.bindings).toBeUndefined();
  });

  test('手写偏差场景：实际 #1D4ED8 可被采集并与期望区分（值匹配 ≠ 来源匹配）', async ({ page }) => {
    const snapshot = await injectAndCapture(page, {
      includeBindings: true,
      cssVariableMap: CSS_VARIABLE_MAP,
    });
    const bg = findMeasurement(snapshot, 'token.button.deviation', 'color.srgb.background');
    expect(bg?.status).toBe('AVAILABLE');
    // #1D4ED8 = rgb(29, 78, 216)
    expect(bg?.value).toEqual({ r: 29 / 255, g: 78 / 255, b: 216 / 255, alpha: 1 });
    const binding = snapshot.bindings?.find((b) => b.subjectId === 'token.button.deviation');
    expect(binding).toMatchObject({
      tokenId: 'button.primary.background',
      bindingType: 'EXPLICIT',
    });
  });
});

test.describe('主题独立快照（TK-01 §33/§36：Light 结果不得覆盖 Dark）', () => {
  test('同一 subject 在 Light/Dark 下的实际值各自独立', async ({ page }) => {
    const light = await injectAndCapture(page, {
      includeBindings: true,
      cssVariableMap: CSS_VARIABLE_MAP,
    });
    await page.goto(referenceUrl('tokens-dark.html'));
    const dark = await injectAndCapture(page, {
      includeBindings: true,
      cssVariableMap: CSS_VARIABLE_MAP,
    });

    // Light：#2563EB；Dark：#60A5FA（两页各自完整快照，无共享状态）。
    const lightBg = findMeasurement(light, 'token.button.exact', 'color.srgb.background');
    const darkBg = findMeasurement(dark, 'token.button.exact', 'color.srgb.background');
    expect(lightBg?.value).toEqual({ r: 37 / 255, g: 99 / 255, b: 235 / 255, alpha: 1 });
    expect(darkBg?.value).toEqual({ r: 96 / 255, g: 165 / 255, b: 250 / 255, alpha: 1 });

    // Dark 页的偏差场景仍为写死 #1D4ED8：主题切换后重新评价将独立 FAIL。
    const darkDeviation = findMeasurement(dark, 'token.button.deviation', 'color.srgb.background');
    expect(darkDeviation?.value).toEqual({ r: 29 / 255, g: 78 / 255, b: 216 / 255, alpha: 1 });

    // 两页的绑定结构一致（同一 DOM 约定），独立采集互不污染。
    const lightBinding = light.bindings?.find((b) => b.subjectId === 'token.button.exact');
    const darkBinding = dark.bindings?.find((b) => b.subjectId === 'token.button.exact');
    expect(lightBinding).toMatchObject({
      bindingType: 'EXPLICIT',
      tokenId: 'button.primary.background',
    });
    expect(darkBinding).toMatchObject({
      bindingType: 'EXPLICIT',
      tokenId: 'button.primary.background',
    });
  });
});

test.describe('Radix DOM adapter（IMPL-13 §31-39）', () => {
  test('组件标识 / 主题上下文 / Portal 归属（纯 DOM 约定）', async ({ page }) => {
    await page.addScriptTag({ path: radixGlobalPath });
    const result = await page.evaluate((map: Record<string, string>) => {
      const api = (
        window as unknown as {
          UIQRadix?: {
            createAdapter(options?: Record<string, unknown>): {
              resolveComponent(
                element: Element,
              ): { componentType: string; state: string | null } | undefined;
              resolveTheme(element: Element): { themeId: string; declaredBy: string } | undefined;
              resolveToken(element: Element): readonly unknown[];
            };
          };
        }
      ).UIQRadix;
      if (api === undefined) return null;
      const adapter = api.createAdapter({ cssVariableMap: map });
      const trigger = document.querySelector('[data-uiq-id="token.dialog.trigger"]');
      const content = document.querySelector('[data-uiq-id="token.dialog.content"]');
      const card = document.querySelector('[data-uiq-id="token.card.surface"]');
      const portal = document.querySelector('[data-radix-portal]');
      const plain = document.querySelector('[data-uiq-id="token.button.orphan-bg"]');
      return {
        component: adapter.resolveComponent(trigger!),
        contentComponent: adapter.resolveComponent(content!),
        plainComponent: adapter.resolveComponent(plain!),
        containerComponent: adapter.resolveComponent(portal!),
        portalTheme: adapter.resolveTheme(content!),
        pageTheme: adapter.resolveTheme(card!),
        contentBinding: adapter.resolveToken(content!)[0],
      };
    }, CSS_VARIABLE_MAP);
    expect(result).not.toBeNull();

    // 组件标识：data-radix-dialog-trigger → dialog-trigger，state 来自 data-state。
    expect(result?.component).toMatchObject({ componentType: 'dialog-trigger', state: 'closed' });
    expect(result?.contentComponent).toMatchObject({
      componentType: 'dialog-content',
      state: 'open',
    });
    // 无 Radix 标注的元素 → undefined；portal 容器本身不是组件。
    expect(result?.plainComponent).toBeUndefined();
    expect(result?.containerComponent).toBeUndefined();

    // Portal 归属：内容元素主题来自 portal 容器（宿主同步 data-theme），声明者为容器。
    expect(result?.portalTheme).toMatchObject({ themeId: 'light' });
    expect(result?.portalTheme?.declaredBy).toBe('div');
    // 页面内元素向上遍历到 html。
    expect(result?.pageTheme).toMatchObject({ themeId: 'light', declaredBy: 'html' });

    // Portal 内元素绑定解析与页面内一致（UIQ 不理解 Radix 内部，只读渲染后 DOM）。
    expect(result?.contentBinding).toMatchObject({
      subjectId: 'token.dialog.content',
      tokenId: 'dialog.surface.background',
      bindingType: 'EXPLICIT',
    });
  });
});
