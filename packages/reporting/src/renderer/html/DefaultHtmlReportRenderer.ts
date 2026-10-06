/**
 * Default HTML Report Renderer（IMPL-32 §34-39）。
 *
 * 原则：
 * - 单文件自包含（§35）：无 CDN / 外部 CSS / 外部 JS / 网络字体
 * - file:// 可阅读（§36）
 * - 语义化 HTML + 键盘导航 + 可见焦点 + 可访问标签 + 表头（§39）
 * - 纯函数：同 UIQualityReport + 同 renderer version → 同 HTML 输出（§7）
 * - 所有用户内容经 escapeHtml 转义（§59）
 */
import type { UIQualityReport } from '../../model/report';
import type { HtmlReportRenderer } from '../types';
import { escapeHtml } from './escape-html';
import { getStylesheet } from './stylesheet';
import { assembleHtml } from './template';

/** HTML Renderer 版本（§49）。 */
export const HTML_RENDERER_VERSION = '1.0.0';

export class DefaultHtmlReportRenderer implements HtmlReportRenderer {
  render(report: UIQualityReport): string {
    return assembleHtml(report, getStylesheet());
  }
}

/** 便捷函数：保持与旧 API 的兼容性。 */
export function renderHtml(report: UIQualityReport): string {
  return new DefaultHtmlReportRenderer().render(report);
}

// Re-export escapeHtml for backward compatibility
export { escapeHtml };
