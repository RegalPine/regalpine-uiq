export type * from './contracts';
export {
  ExactVersionRegistry,
  DefaultMetricRegistry,
  DefaultRuleRegistry,
  assertExactVersion,
} from './registry/registry';
export { canonicalJson } from './fingerprint/canonical-json';
export { sha256 } from './fingerprint/sha256';

import { canonicalJson } from './fingerprint/canonical-json';
import { sha256 } from './fingerprint/sha256';

/** 调用方显式选择身份输入；不会隐式删除任何业务字段或注入系统时间。 */
export function fingerprint(input: unknown): string {
  return sha256(canonicalJson(input));
}
