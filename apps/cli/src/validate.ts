import Ajv2020 from 'ajv/dist/2020.js';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CliError } from './errors';

const require = createRequire(import.meta.url);

/** UIQ-ARCH-01 AD-04/AD-05：JSON Schema 2020-12，Ajv 8（宿主侧）。 */
const ajv = new Ajv2020({ strict: false, allErrors: true });

const CORE_SCHEMA_ID = 'https://uiq.local/schemas/core/1.0.0/contracts';
const ANALYSIS_SCHEMA_ID = 'https://uiq.local/schemas/cli/1.0.0/analysis';
const TOKEN_ASSET_SCHEMA_ID = 'https://uiq.local/schemas/tokens/1.0.0/design-token';

let registered = false;

function ensureSchemas(): void {
  if (registered) return;
  const corePath = require.resolve('@uiq/core/schemas/contracts.schema.json');
  const core = JSON.parse(readFileSync(corePath, 'utf-8')) as object;
  const analysisPath = join(
    dirname(fileURLToPath(import.meta.url)),
    '../schemas/analysis.schema.json',
  );
  const analysis = JSON.parse(readFileSync(analysisPath, 'utf-8')) as object;
  // tokens schema 引用 core 的 $defs（Id/Version/JsonValue/Metadata），需一并注册。
  const tokenAsset = JSON.parse(
    readFileSync(require.resolve('@uiq/tokens/schemas/design-token.schema.json'), 'utf-8'),
  ) as object;
  ajv.addSchema([core, analysis, tokenAsset]);
  registered = true;
}

export interface SchemaViolation {
  readonly instancePath: string;
  readonly message: string;
}

function validateById(schemaId: string, value: unknown): readonly SchemaViolation[] {
  ensureSchemas();
  const validate = ajv.getSchema(schemaId);
  if (validate === undefined) {
    throw new CliError('EXECUTION_ERROR', `Schema 未注册：${schemaId}`);
  }
  const valid = validate(value);
  if (valid) return [];
  const errors = validate.errors ?? [];
  return errors.map((e) => ({ instancePath: e.instancePath, message: e.message ?? 'invalid' }));
}

/** 校验 MeasurementSnapshot（analyze 读取快照文件时，CLI 采集后自检）。 */
export function validateSnapshot(value: unknown): readonly SchemaViolation[] {
  return validateById(`${CORE_SCHEMA_ID}#/$defs/MeasurementSnapshot`, value);
}

/** P5：校验 Token 资产（design-token schema $defs/TokenAsset，计划 Task 6）。 */
export function validateTokenAsset(value: unknown): readonly SchemaViolation[] {
  return validateById(`${TOKEN_ASSET_SCHEMA_ID}#/$defs/TokenAsset`, value);
}

/** 校验完整分析产物。 */
export function validateArtifact(value: unknown): readonly SchemaViolation[] {
  return validateById(ANALYSIS_SCHEMA_ID, value);
}

export function formatViolations(violations: readonly SchemaViolation[]): string {
  return violations.map((v) => `${v.instancePath || '(root)'}: ${v.message}`).join('; ');
}
