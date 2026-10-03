/**
 * HTML 报告内嵌样式表（IMPL-32 §34-39）。
 *
 * 原则：
 * - 单文件自包含（§35-36）：无 CDN / 外部 CSS / 外部 JS / 网络字体
 * - file:// 可阅读（§36）
 * - 语义化 HTML + 键盘导航 + 可见焦点 + 可访问标签 + 表头（§39）
 */

export function getStylesheet(): string {
  return `
<style>
  :root {
    --uiq-bg: #ffffff;
    --uiq-fg: #1a1a2e;
    --uiq-border: #e0e0e0;
    --uiq-accent: #2563eb;
    --uiq-pass: #16a34a;
    --uiq-fail: #dc2626;
    --uiq-warn: #d97706;
    --uiq-unknown: #6b7280;
    --uiq-surface: #f8f9fa;
    --uiq-radius: 6px;
    --uiq-font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    --uiq-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  }
  *, *::before, *::after { box-sizing: border-box; }
  html { font-size: 15px; line-height: 1.6; }
  body {
    margin: 0; padding: 0;
    font-family: var(--uiq-font);
    color: var(--uiq-fg);
    background: var(--uiq-bg);
    max-width: 960px;
    margin: 0 auto;
    padding: 2rem 1.5rem;
  }
  h1 { font-size: 1.75rem; margin: 0 0 0.25rem; border-bottom: 2px solid var(--uiq-accent); padding-bottom: 0.5rem; }
  h2 { font-size: 1.3rem; margin: 2rem 0 0.75rem; color: var(--uiq-accent); border-bottom: 1px solid var(--uiq-border); padding-bottom: 0.35rem; }
  h3 { font-size: 1.1rem; margin: 1.25rem 0 0.5rem; }
  h4 { font-size: 1rem; margin: 1rem 0 0.35rem; }
  p { margin: 0.5rem 0; }
  code { font-family: var(--uiq-mono); background: var(--uiq-surface); padding: 0.1em 0.35em; border-radius: 3px; font-size: 0.9em; }
  table { width: 100%; border-collapse: collapse; margin: 0.75rem 0; font-size: 0.9rem; }
  th, td { padding: 0.45rem 0.65rem; border: 1px solid var(--uiq-border); text-align: left; }
  th { background: var(--uiq-surface); font-weight: 600; }
  td:not(:first-child) { text-align: right; }
  th:not(:first-child) { text-align: right; }
  ul { margin: 0.5rem 0; padding-left: 1.5rem; }
  li { margin: 0.2rem 0; }
  blockquote { margin: 0.5rem 0; padding: 0.25rem 0.75rem; border-left: 3px solid var(--uiq-accent); color: var(--uiq-unknown); background: var(--uiq-surface); }
  details { margin: 0.5rem 0; border: 1px solid var(--uiq-border); border-radius: var(--uiq-radius); }
  details > summary { cursor: pointer; padding: 0.4rem 0.75rem; font-weight: 600; background: var(--uiq-surface); border-radius: var(--uiq-radius); }
  details > summary:focus-visible { outline: 2px solid var(--uiq-accent); outline-offset: 2px; }
  details > :not(summary) { padding: 0 0.75rem; }
  .uiq-badge { display: inline-block; padding: 0.1em 0.5em; border-radius: 3px; font-size: 0.8em; font-weight: 600; }
  .uiq-badge-pass { background: #dcfce7; color: #166534; }
  .uiq-badge-fail { background: #fee2e2; color: #991b1b; }
  .uiq-badge-warn { background: #fef3c7; color: #92400e; }
  .uiq-badge-unknown { background: #f3f4f6; color: #4b5563; }
  .uiq-section { margin-bottom: 1.5rem; }
  .uiq-empty { color: var(--uiq-unknown); font-style: italic; }
  @media (prefers-color-scheme: dark) {
    :root {
      --uiq-bg: #1a1a2e;
      --uiq-fg: #e0e0e0;
      --uiq-border: #374151;
      --uiq-accent: #60a5fa;
      --uiq-surface: #1f2937;
    }
    .uiq-badge-pass { background: #14532d; color: #bbf7d0; }
    .uiq-badge-fail { background: #7f1d1d; color: #fecaca; }
    .uiq-badge-warn { background: #78350f; color: #fde68a; }
    .uiq-badge-unknown { background: #374151; color: #d1d5db; }
  }
  @media print {
    body { max-width: 100%; padding: 1rem; }
    details { break-inside: avoid; }
  }
</style>`;
}
