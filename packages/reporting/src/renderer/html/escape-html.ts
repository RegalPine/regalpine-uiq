/**
 * HTML 上下文转义（IMPL-32 §59）。
 * 所有用户内容在插入 HTML 前必须经过此函数。
 * 防止 XSS / HTML Injection。
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
