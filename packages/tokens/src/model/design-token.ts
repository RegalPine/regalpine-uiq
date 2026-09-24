import type { DesignToken, TokenLayer, TokenValueType } from '@uiq/core';

/**
 * 导入 dialect（IMPL-09 §7-9、TK-01 §4-5、AD-14）：
 * - 'TK01'：raw.type 表达值类别（COLOR/TYPOGRAPHY/...），层级必须由 raw.layer 显式补充；
 * - 'IMPL09'：raw.type 表达层级（PRIMITIVE/SEMANTIC/COMPONENT），值类别必须由 raw.valueType 显式补充。
 * 任何一维缺失都显式报错，不按字符串猜测（AD-14）。
 */
export type ImportDialect = 'TK01' | 'IMPL09';

export interface TokenAsset {
  readonly assetId: string;
  readonly version: string;
  readonly dialect: ImportDialect;
  readonly tokens: readonly DesignToken[];
}

export type TokenAssetErrorCode =
  | 'ASSET_INVALID'
  | 'TOKEN_INVALID'
  | 'LAYER_MISSING'
  | 'VALUE_TYPE_MISSING'
  | 'DUPLICATE_TOKEN_ID';

export class TokenAssetError extends Error {
  readonly code: TokenAssetErrorCode;

  constructor(code: TokenAssetErrorCode, message: string) {
    super(`[${code}] ${message}`);
    this.name = 'TokenAssetError';
    this.code = code;
  }
}

const VALUE_TYPES: readonly TokenValueType[] = [
  'COLOR',
  'TYPOGRAPHY',
  'SPACING',
  'SIZE',
  'RADIUS',
  'BORDER',
  'SHADOW',
  'OPACITY',
  'MOTION',
  'Z_INDEX',
  'OTHER',
];
const LAYERS: readonly TokenLayer[] = ['PRIMITIVE', 'SEMANTIC', 'COMPONENT'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireString(raw: Record<string, unknown>, field: string, context: string): string {
  const value = raw[field];
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new TokenAssetError('TOKEN_INVALID', `${context}：${field} 必须是非空字符串`);
  }
  return value;
}

function optionalString(
  raw: Record<string, unknown>,
  field: string,
  context: string,
): string | undefined {
  const value = raw[field];
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new TokenAssetError('TOKEN_INVALID', `${context}：${field} 必须是非空字符串`);
  }
  return value;
}

/** 归一化单个 raw token；dialect 决定 type 的语义，另一维必须显式补充。 */
export function normalizeDesignToken(raw: unknown, dialect: ImportDialect): DesignToken {
  if (!isRecord(raw)) throw new TokenAssetError('TOKEN_INVALID', 'token 必须是对象');
  const context = `token ${typeof raw.id === 'string' ? raw.id : '<unnamed>'}`;
  const id = requireString(raw, 'id', context);
  const name = requireString(raw, 'name', context);

  let layer: TokenLayer | undefined;
  let valueType: TokenValueType | undefined;
  const declaredType = typeof raw.type === 'string' ? raw.type : undefined;

  if (dialect === 'TK01') {
    if (declaredType === undefined || !VALUE_TYPES.includes(declaredType as TokenValueType)) {
      throw new TokenAssetError(
        'VALUE_TYPE_MISSING',
        `${context}：TK01 dialect 要求 type 为值类别（${VALUE_TYPES.join('/')}）`,
      );
    }
    valueType = declaredType as TokenValueType;
    const declaredLayer = typeof raw.layer === 'string' ? raw.layer : undefined;
    if (declaredLayer === undefined || !LAYERS.includes(declaredLayer as TokenLayer)) {
      throw new TokenAssetError(
        'LAYER_MISSING',
        `${context}：TK01 dialect 要求显式 layer（PRIMITIVE/SEMANTIC/COMPONENT），不按引用关系推测（AD-14）`,
      );
    }
    layer = declaredLayer as TokenLayer;
  } else {
    if (declaredType === undefined || !LAYERS.includes(declaredType as TokenLayer)) {
      throw new TokenAssetError(
        'LAYER_MISSING',
        `${context}：IMPL09 dialect 要求 type 为层级（PRIMITIVE/SEMANTIC/COMPONENT）`,
      );
    }
    layer = declaredType as TokenLayer;
    const declaredValueType = typeof raw.valueType === 'string' ? raw.valueType : undefined;
    if (
      declaredValueType === undefined ||
      !VALUE_TYPES.includes(declaredValueType as TokenValueType)
    ) {
      throw new TokenAssetError(
        'VALUE_TYPE_MISSING',
        `${context}：IMPL09 dialect 要求显式 valueType（${VALUE_TYPES.join('/')}），AD-14 不按字符串猜测`,
      );
    }
    valueType = declaredValueType as TokenValueType;
  }

  if (raw.value === undefined && raw.reference === undefined) {
    throw new TokenAssetError(
      'TOKEN_INVALID',
      `${context}：Primitive 需要 value，Semantic/Component 需要 reference，二者必须提供其一`,
    );
  }
  if (
    raw.reference !== undefined &&
    (typeof raw.reference !== 'string' || raw.reference.trim().length === 0)
  ) {
    throw new TokenAssetError('TOKEN_INVALID', `${context}：reference 必须是非空字符串`);
  }
  if (raw.metadata !== undefined && !isRecord(raw.metadata)) {
    throw new TokenAssetError('TOKEN_INVALID', `${context}：metadata 必须是对象`);
  }

  const unit = optionalString(raw, 'unit', context);
  const role = optionalString(raw, 'role', context);
  const token: DesignToken = {
    id,
    name,
    layer,
    valueType,
    ...(raw.value !== undefined ? { value: raw.value } : {}),
    ...(raw.reference !== undefined ? { reference: raw.reference as string } : {}),
    ...(unit !== undefined ? { unit } : {}),
    ...(role !== undefined ? { role } : {}),
    ...(raw.metadata !== undefined
      ? { metadata: raw.metadata as Readonly<Record<string, unknown>> }
      : {}),
  };
  return token;
}

/** 归一化整个资产：校验壳字段 + 逐 token 归一 + 重复 id 检测。 */
export function normalizeTokenAsset(raw: unknown): TokenAsset {
  if (!isRecord(raw)) throw new TokenAssetError('ASSET_INVALID', 'Token 资产必须是对象');
  const assetId = requireString(raw, 'assetId', 'asset');
  const version = requireString(raw, 'version', 'asset');
  const dialectRaw = raw['dialect'];
  if (dialectRaw !== 'TK01' && dialectRaw !== 'IMPL09') {
    throw new TokenAssetError(
      'ASSET_INVALID',
      `asset ${assetId}：dialect 必须显式声明为 'TK01' 或 'IMPL09'`,
    );
  }
  if (!Array.isArray(raw.tokens) || raw.tokens.length === 0) {
    throw new TokenAssetError('ASSET_INVALID', `asset ${assetId}：tokens 必须是非空数组`);
  }
  const seen = new Set<string>();
  const tokens = raw.tokens.map((rawToken) => {
    const token = normalizeDesignToken(rawToken, dialectRaw);
    if (seen.has(token.id)) {
      throw new TokenAssetError(
        'DUPLICATE_TOKEN_ID',
        `asset ${assetId}：token id 重复 '${token.id}'`,
      );
    }
    seen.add(token.id);
    return token;
  });
  return { assetId, version, dialect: dialectRaw, tokens };
}
