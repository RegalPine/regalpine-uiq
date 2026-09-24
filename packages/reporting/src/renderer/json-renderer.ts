/**
 * JSON Renderer（IMPL-17 §35）。
 * UTF-8、稳定属性序（canonicalJson 排序键）、无运行时对象序列化、无循环引用。
 */
import { canonicalJson } from '@uiq/core';

import type { UIQualityReport } from '../model/report';

export function renderJson(report: UIQualityReport): string {
  return canonicalJson(report);
}
