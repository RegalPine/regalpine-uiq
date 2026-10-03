/**
 * Renderer 统一导出（IMPL-32 §5-6）。
 */
export type {
  ReportRenderer,
  MarkdownReportRenderer,
  HtmlReportRenderer,
  JsonReportRenderer,
} from './types';

export {
  DefaultMarkdownReportRenderer,
  renderMarkdown,
  MARKDOWN_RENDERER_VERSION,
} from './markdown';

export {
  DefaultHtmlReportRenderer,
  renderHtml,
  escapeHtml,
  HTML_RENDERER_VERSION,
} from './html';

export {
  DefaultJsonReportRenderer,
  renderJson,
  JSON_RENDERER_VERSION,
} from './json';
