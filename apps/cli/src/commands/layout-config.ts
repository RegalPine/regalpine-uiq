/**
 * P8：布局配置加载与校验。
 *
 * 配置固定包含 version、scope、layout.enabled、groups/relationships、targets、
 * constraints/componentContracts、显式 Token/Theme 配置、browser.viewports 与
 * reporting.systemicFindingThreshold。未支持字段报配置错误。
 */
import { readFileSync } from 'node:fs';
import { CliError } from '../errors';

export interface LayoutConfigGroup {
  readonly id: string;
  readonly subjectIds: readonly string[];
  readonly axis?: 'x' | 'y';
  readonly reference?: number;
}

export interface LayoutConfigRelationship {
  readonly type: string;
  readonly groupId: string;
  readonly subjectIds: readonly string[];
}

export interface LayoutConfigTarget {
  readonly targetId: string;
  readonly metricId: string;
  readonly config?: Record<string, unknown>;
}

export interface LayoutConfigConstraint {
  readonly id: string;
  readonly ruleId: string;
  readonly targetId?: string;
  readonly config?: Record<string, unknown>;
}

export interface LayoutConfig {
  readonly version: '1.0.0';
  readonly scope: string;
  readonly layout: {
    readonly enabled: boolean;
    readonly groups?: readonly LayoutConfigGroup[];
    readonly relationships?: readonly LayoutConfigRelationship[];
    readonly targets?: readonly LayoutConfigTarget[];
    readonly constraints?: readonly LayoutConfigConstraint[];
  };
  readonly browser?: {
    readonly viewports?: readonly { readonly width: number; readonly height: number }[];
  };
  readonly reporting?: {
    readonly systemicFindingThreshold?: number;
  };
}

const SUPPORTED_CONFIG_KEYS = new Set([
  'version',
  'scope',
  'layout',
  'layout.enabled',
  'layout.groups',
  'layout.relationships',
  'layout.targets',
  'layout.constraints',
  'browser',
  'browser.viewports',
  'reporting',
  'reporting.systemicFindingThreshold',
]);

function validateConfigShape(raw: unknown): LayoutConfig {
  if (typeof raw !== 'object' || raw === null) {
    throw new CliError('INVALID_CONFIGURATION', '布局配置必须是 JSON 对象');
  }
  const obj = raw as Record<string, unknown>;

  if (obj.version !== '1.0.0') {
    throw new CliError(
      'INVALID_CONFIGURATION',
      `布局配置版本必须为 "1.0.0"，实际为 ${JSON.stringify(obj.version)}`,
    );
  }
  if (typeof obj.scope !== 'string' || obj.scope.length === 0) {
    throw new CliError('INVALID_CONFIGURATION', '布局配置缺少 scope 字段或类型不正确');
  }
  if (typeof obj.layout !== 'object' || obj.layout === null) {
    throw new CliError('INVALID_CONFIGURATION', '布局配置缺少 layout 对象');
  }
  const layout = obj.layout as Record<string, unknown>;
  if (typeof layout.enabled !== 'boolean') {
    throw new CliError('INVALID_CONFIGURATION', 'layout.enabled 必须为布尔值');
  }

  // 检查不支持的顶层字段
  for (const key of Object.keys(obj)) {
    if (!SUPPORTED_CONFIG_KEYS.has(key)) {
      throw new CliError(
        'INVALID_CONFIGURATION',
        `布局配置不支持字段 "${key}"；支持的字段：${[...SUPPORTED_CONFIG_KEYS].join(', ')}`,
      );
    }
  }

  if (layout.groups !== undefined && !Array.isArray(layout.groups)) {
    throw new CliError('INVALID_CONFIGURATION', 'layout.groups 必须为数组');
  }
  if (layout.relationships !== undefined && !Array.isArray(layout.relationships)) {
    throw new CliError('INVALID_CONFIGURATION', 'layout.relationships 必须为数组');
  }
  if (layout.targets !== undefined && !Array.isArray(layout.targets)) {
    throw new CliError('INVALID_CONFIGURATION', 'layout.targets 必须为数组');
  }
  if (layout.constraints !== undefined && !Array.isArray(layout.constraints)) {
    throw new CliError('INVALID_CONFIGURATION', 'layout.constraints 必须为数组');
  }

  return obj as unknown as LayoutConfig;
}

/** 加载并校验布局配置文件。 */
export function loadLayoutConfig(configPath: string): LayoutConfig {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(configPath, 'utf-8')) as unknown;
  } catch (error) {
    throw new CliError(
      'INPUT_ERROR',
      `无法读取布局配置 ${configPath}：${error instanceof Error ? error.message : String(error)}`,
    );
  }
  return validateConfigShape(raw);
}
