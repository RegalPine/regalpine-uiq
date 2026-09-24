/**
 * AD-05：Schema 2020-12 由契约包持有，Ajv 宿主在应用（CLI 预编译）。
 * conformance 只约定注入式 validator 契约，不引入 ajv 依赖，浏览器 IIFE 可携。
 */
export type SchemaValidator = (document: unknown) => readonly string[];

export interface VerifyResult {
  readonly valid: boolean;
  readonly violations: readonly string[];
}

export function verifyDocument(document: unknown, validate: SchemaValidator): VerifyResult {
  const violations = validate(document);
  return { valid: violations.length === 0, violations };
}
