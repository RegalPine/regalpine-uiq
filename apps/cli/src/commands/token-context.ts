import { readFileSync } from 'node:fs';
import type { ComponentContract, DesignToken, Theme } from '@uiq/core';
import {
  createTokenResolver,
  normalizeTokenAsset,
  TokenAssetError,
  type TokenAsset,
  type TokenResolver,
} from '@uiq/tokens';
import { applyTheme, validateTheme, type ThemeValidationResult } from '@uiq/theme';
import { CliError } from '../errors';
import { formatViolations, validateTokenAsset } from '../validate';

/**
 * P5（计划 Task 6）：--tokens 资产文件的加载与校验。
 *
 * 文件形态（两种，检测确定性）：
 * - 裸 TokenAsset：{ assetId, version, dialect, tokens }；
 * - 束缚形态：{ asset: TokenAsset, themes?: Record<id, ThemeDoc> } —— 伴随主题定义，
 *   --theme <id> 从中选择（TK-01 §22-23：Theme 为独立实体，key 即 id）。
 *
 * 校验顺序裁决：design-token.schema.json 的 $defs/DesignToken 描述的是内部投影
 * （layer+valueType 双字段，AD-14），而 normalize 输入是 raw dialect 形态，两者形状
 * 不兼容——先 normalize（语义门）再对归一化产物做 schema 校验（契约门），均失败于
 * INVALID_CONFIGURATION；文件读取/JSON 解析失败为 INPUT_ERROR。
 */
export interface LoadedTokenContext {
  readonly asset: TokenAsset;
  readonly theme?: Theme;
  readonly themeValidation?: ThemeValidationResult;
  /** 主题应用后的有效 token 集（无 --theme 时即资产原集）。 */
  readonly effectiveTokens: readonly DesignToken[];
  readonly resolver: TokenResolver;
  readonly contract?: ComponentContract;
}

export interface LoadTokenContextOptions {
  readonly tokensPath: string;
  readonly themeId?: string;
  readonly contractPath?: string;
}

export function loadTokenContext(options: LoadTokenContextOptions): LoadedTokenContext {
  const doc = readJsonFile(options.tokensPath);
  if (!isRecord(doc)) {
    throw new CliError('INPUT_ERROR', `Token 资产文件必须是 JSON 对象：${options.tokensPath}`);
  }

  const isBundle = isRecord(doc['asset']);
  const isBareAsset = doc['assetId'] !== undefined && doc['tokens'] !== undefined;
  if (!isBundle && !isBareAsset) {
    throw new CliError(
      'INPUT_ERROR',
      '无法识别的 Token 资产文件：应为 TokenAsset（assetId/version/dialect/tokens）或 { asset, themes? } 束缚形态',
    );
  }
  const assetRaw = isBundle ? doc['asset'] : doc;

  // 语义门：raw dialect → 内部投影（AD-14 不按字符串猜测）。
  let asset: TokenAsset;
  try {
    asset = normalizeTokenAsset(assetRaw);
  } catch (error) {
    if (error instanceof TokenAssetError) {
      throw new CliError('INVALID_CONFIGURATION', `Token 资产不合法：${error.message}`);
    }
    throw error;
  }
  // 契约门：归一化产物必须满足 design-token schema（AD-04/AD-05）。
  const violations = validateTokenAsset(asset);
  if (violations.length > 0) {
    throw new CliError(
      'INVALID_CONFIGURATION',
      `归一化 Token 资产不符合 design-token schema：${formatViolations(violations)}`,
    );
  }

  const theme =
    options.themeId !== undefined
      ? selectTheme(isBundle ? doc['themes'] : undefined, options.themeId, options.tokensPath)
      : undefined;
  const contract =
    options.contractPath !== undefined ? loadContract(options.contractPath) : undefined;

  // Theme Integrity（IMPL-09 §24）：不中断分析——问题经 warnings 呈现，可解析性
  // 事实由 resolver/metrics 诚实传播（missing reference / cycle 的 Golden 依赖此路径）。
  const themeValidation =
    theme !== undefined ? validateTheme(asset.tokens, theme, contract?.requiredTokens) : undefined;

  const effectiveTokens = theme !== undefined ? applyTheme(asset.tokens, theme) : [...asset.tokens];
  return {
    asset,
    ...(theme !== undefined ? { theme } : {}),
    ...(themeValidation !== undefined ? { themeValidation } : {}),
    effectiveTokens,
    resolver: createTokenResolver(effectiveTokens),
    ...(contract !== undefined ? { contract } : {}),
  };
}

/** 读取并解析 JSON 文件；IO/解析失败 → INPUT_ERROR（exit 5）。 */
function readJsonFile(path: string): unknown {
  let text: string;
  try {
    text = readFileSync(path, 'utf-8');
  } catch (error) {
    throw new CliError(
      'INPUT_ERROR',
      `无法读取文件 ${path}：${error instanceof Error ? error.message : String(error)}`,
    );
  }
  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    throw new CliError(
      'INPUT_ERROR',
      `文件不是合法 JSON：${path}（${error instanceof Error ? error.message : String(error)}）`,
    );
  }
}

/** --theme <id> 选择：束缚形态 themes[key]；key 即主题 id（TK-01 §23 命名不限）。 */
function selectTheme(themes: unknown, themeId: string, tokensPath: string): Theme {
  if (!isRecord(themes)) {
    throw new CliError(
      'INPUT_ERROR',
      `--theme '${themeId}'：资产文件未包含 themes 定义（${tokensPath}）`,
    );
  }
  const raw = themes[themeId];
  if (raw === undefined) {
    const known = Object.keys(themes).join('、') || '<空>';
    throw new CliError(
      'INPUT_ERROR',
      `--theme '${themeId}' 未在资产文件 themes 中定义（可用：${known}）`,
    );
  }
  if (!isRecord(raw)) {
    throw new CliError('INPUT_ERROR', `主题 '${themeId}' 定义必须是对象`);
  }
  const version = raw['version'];
  const name = raw['name'];
  const tokens = raw['tokens'];
  if (typeof version !== 'string' || version.trim().length === 0) {
    throw new CliError('INPUT_ERROR', `主题 '${themeId}'：version 必须是非空字符串`);
  }
  if (typeof name !== 'string' || name.trim().length === 0) {
    throw new CliError('INPUT_ERROR', `主题 '${themeId}'：name 必须是非空字符串`);
  }
  if (!isRecord(tokens)) {
    throw new CliError('INPUT_ERROR', `主题 '${themeId}'：tokens 必须是覆盖值映射对象`);
  }
  const declaredId = raw['id'];
  if (declaredId !== undefined && declaredId !== themeId) {
    throw new CliError(
      'INPUT_ERROR',
      `主题 '${themeId}'：定义内 id('${String(declaredId)}') 与 key 不一致`,
    );
  }
  const metadata = raw['metadata'];
  if (metadata !== undefined && !isRecord(metadata)) {
    throw new CliError('INPUT_ERROR', `主题 '${themeId}'：metadata 必须是对象`);
  }
  return {
    id: themeId,
    version,
    name,
    tokens: tokens as Record<string, unknown>,
    ...(metadata !== undefined ? { metadata: metadata as Record<string, unknown> } : {}),
  };
}

/** --contract <file>：单个 ComponentContract JSON 文档。 */
function loadContract(path: string): ComponentContract {
  const raw = readJsonFile(path);
  if (!isRecord(raw)) {
    throw new CliError('INPUT_ERROR', `ComponentContract 文件必须是 JSON 对象：${path}`);
  }
  const id = raw['id'];
  const version = raw['version'];
  const requiredTokens = raw['requiredTokens'];
  if (typeof id !== 'string' || id.trim().length === 0) {
    throw new CliError('INPUT_ERROR', `ComponentContract：id 必须是非空字符串（${path}）`);
  }
  if (typeof version !== 'string' || version.trim().length === 0) {
    throw new CliError('INPUT_ERROR', `ComponentContract '${id}'：version 必须是非空字符串`);
  }
  if (
    !Array.isArray(requiredTokens) ||
    requiredTokens.length === 0 ||
    !requiredTokens.every((t) => typeof t === 'string' && t.trim().length > 0)
  ) {
    throw new CliError(
      'INPUT_ERROR',
      `ComponentContract '${id}'：requiredTokens 必须是非空字符串数组`,
    );
  }
  const optionalTokens = readStringArray(
    raw['optionalTokens'],
    `ComponentContract '${id}'：optionalTokens`,
  );
  const states = readStringArray(raw['states'], `ComponentContract '${id}'：states`);
  return {
    id,
    version,
    requiredTokens: requiredTokens as string[],
    ...(optionalTokens !== undefined ? { optionalTokens } : {}),
    ...(states !== undefined ? { states } : {}),
  };
}

function readStringArray(value: unknown, label: string): readonly string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || !value.every((t) => typeof t === 'string' && t.trim().length > 0)) {
    throw new CliError('INPUT_ERROR', `${label} 必须是非空字符串数组`);
  }
  return value as string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
