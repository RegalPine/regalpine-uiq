/**
 * Markdown 安全工具（IMPL-32 §58）。
 * 防止用户内容中的 HTML 注入（如 <script>alert(1)</script>）。
 */

/** Markdown 上下文转义：去除可被解释为 HTML 的字符。 */
export function escapeMarkdown(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** 表格单元格安全：额外处理管道符。 */
export function escapeTableCell(value: string): string {
  return escapeMarkdown(value).replace(/\|/g, '\\|').replace(/\n/g, ' ');
}
