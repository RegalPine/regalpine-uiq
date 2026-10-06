/**
 * Default Markdown Report Renderer（IMPL-32 §8-24）。
 *
 * 纯函数：同 UIQualityReport + 同 renderer version → 同 Markdown 输出。
 * 禁止 Date.now() / Math.random() / Network / DOM / Browser（§7）。
 * 空章节不隐藏（§42），UNKNOWN/ERROR 独立呈现（§43-45）。
 * 不生成 Overall Score（§13）。
 *
 * Renderer 版本（§49）。
 */
import type { UIQualityReport } from '../../model/report';
import type { MarkdownReportRenderer } from '../types';
import {
  renderHeader,
  renderMetadata,
  renderSummary,
  renderCoverage,
  renderDimensions,
  renderVisualTexture,
  renderFindings,
  renderDiagnostics,
  renderConformance,
  renderRegression,
  renderRecommendations,
  renderVerification,
  renderReleaseGate,
  renderReproducibility,
} from './sections';

/** Markdown Renderer 版本（§49）。 */
export const MARKDOWN_RENDERER_VERSION = '1.0.0';

export class DefaultMarkdownReportRenderer implements MarkdownReportRenderer {
  render(report: UIQualityReport): string {
    const parts: string[] = [
      renderHeader(report),
      renderMetadata(report),
      renderSummary(report),
      renderCoverage(report),
      renderDimensions(report),
      renderVisualTexture(report),
      renderFindings(report),
      renderDiagnostics(report),
      renderConformance(report),
      renderRegression(report),
      renderRecommendations(report),
      renderVerification(report),
      renderReleaseGate(report),
      renderReproducibility(report),
    ];
    return parts.join('');
  }
}

/** 便捷函数：保持与旧 API 的兼容性。 */
export function renderMarkdown(report: UIQualityReport): string {
  return new DefaultMarkdownReportRenderer().render(report);
}
