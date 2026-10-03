/**
 * Report Renderer 统一接口（IMPL-32 §6）。
 * Renderer 只负责展示，不重新计算 Metric/Rule/Finding。
 */
import type { UIQualityReport } from '../model/report';

/**
 * 通用报告渲染器接口。
 * 
 * 纯函数原则：
 * - 同 UIQualityReport + 同 renderer version = 同 output
 * - 禁止 Date.now() / Math.random() / Network / DOM / Browser
 */
export interface ReportRenderer<TOutput> {
  render(report: UIQualityReport): TOutput;
}

/**
 * Markdown 报告渲染器接口。
 */
export interface MarkdownReportRenderer extends ReportRenderer<string> {}

/**
 * HTML 报告渲染器接口。
 */
export interface HtmlReportRenderer extends ReportRenderer<string> {}

/**
 * JSON 报告渲染器接口。
 */
export interface JsonReportRenderer extends ReportRenderer<string> {}
