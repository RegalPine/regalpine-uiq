/**
 * JSON Renderer（IMPL-32 §6 / IMPL-17 §35）。
 * UTF-8、稳定属性序（canonicalJson 排序键）、无运行时对象序列化、无循环引用。
 */
import { canonicalJson } from '@uiq/core';

import type { UIQualityReport } from '../../model/report';
import type { JsonReportRenderer } from '../types';

/** JSON Renderer 版本（§49）。 */
export const JSON_RENDERER_VERSION = '1.0.0';

export class DefaultJsonReportRenderer implements JsonReportRenderer {
  render(report: UIQualityReport): string {
    return canonicalJson(report);
  }
}

/** 便捷函数：保持与旧 API 的兼容性。 */
export function renderJson(report: UIQualityReport): string {
  return new DefaultJsonReportRenderer().render(report);
}
