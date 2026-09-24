import type { MeasurementSnapshot } from '@uiq/core';
import { readFileSync } from 'node:fs';
import { captureWithBrowser } from '../browser/executor';
import {
  buildResponse,
  runAnalysis,
  type AnalysisArtifact,
  type CliResponse,
  type TokenAnalysisContext,
} from '../artifact';
import { formatViolations, validateArtifact, validateSnapshot } from '../validate';
import { CliError } from '../errors';
import { loadTokenContext } from './token-context';
import { loadLayoutConfig, type LayoutConfig } from './layout-config';

export interface AnalyzeOptions {
  /** 浏览器目标 URL 或本地快照 JSON 文件路径。 */
  readonly target: string;
  readonly subjects?: string;
  readonly allowExternal: boolean;
  /** P5：Token 资产文件（裸 TokenAsset 或 { asset, themes? } 束缚形态）。 */
  readonly tokensPath?: string;
  /** P5：主题 id（从资产文件 themes 中选择；需与 --tokens 同用）。 */
  readonly themeId?: string;
  /** P5：ComponentContract JSON 文件（需与 --tokens 同用）。 */
  readonly contractPath?: string;
  /** P8：布局配置文件路径。 */
  readonly configPath?: string;
  /** Playwright storageState JSON 文件路径（登录态恢复）。 */
  readonly authStatePath?: string;
}

function isSnapshotFile(target: string): boolean {
  if (
    target.startsWith('file://') ||
    target.startsWith('http://') ||
    target.startsWith('https://')
  ) {
    return false;
  }
  return target.endsWith('.json');
}

/** UIQ-ARCH-01 AD-06：analyze 接受浏览器目标或测量快照；执行完整分析链。 */
export async function runAnalyze(options: AnalyzeOptions): Promise<CliResponse<AnalysisArtifact>> {
  if (
    options.tokensPath === undefined &&
    (options.themeId !== undefined || options.contractPath !== undefined)
  ) {
    throw new CliError('INVALID_CONFIGURATION', '--theme/--contract 需要与 --tokens 同时使用');
  }
  const loaded =
    options.tokensPath !== undefined
      ? loadTokenContext({
          tokensPath: options.tokensPath,
          ...(options.themeId !== undefined ? { themeId: options.themeId } : {}),
          ...(options.contractPath !== undefined ? { contractPath: options.contractPath } : {}),
        })
      : undefined;

  const layoutConfig: LayoutConfig | undefined =
    options.configPath !== undefined ? loadLayoutConfig(options.configPath) : undefined;

  let snapshot: MeasurementSnapshot;
  if (isSnapshotFile(options.target)) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(readFileSync(options.target, 'utf-8')) as unknown;
    } catch (error) {
      throw new CliError(
        'INPUT_ERROR',
        `无法读取快照文件 ${options.target}：${error instanceof Error ? error.message : String(error)}`,
      );
    }
    const violations = validateSnapshot(parsed);
    if (violations.length > 0) {
      throw new CliError(
        'INPUT_ERROR',
        `输入不是有效的 MeasurementSnapshot：${formatViolations(violations)}`,
      );
    }
    snapshot = parsed as MeasurementSnapshot;
  } else {
    snapshot = await captureWithBrowser(
      options.target,
      {
        ...(options.subjects !== undefined ? { subjects: options.subjects } : {}),
      },
      options.authStatePath,
    );
  }

  const tokenContext: TokenAnalysisContext | undefined =
    loaded === undefined
      ? undefined
      : {
          assetId: loaded.asset.assetId,
          assetVersion: loaded.asset.version,
          ...(loaded.theme !== undefined ? { theme: loaded.theme } : {}),
          ...(loaded.contract !== undefined ? { contract: loaded.contract } : {}),
          resolveToken: (tokenId) => {
            const result = loaded.resolver.resolve(tokenId);
            return {
              status: result.status,
              ...(result.resolvedValue !== undefined
                ? { resolvedValue: result.resolvedValue }
                : {}),
              ...(result.chain !== undefined ? { chain: result.chain } : {}),
            };
          },
        };

  const artifact = runAnalysis(snapshot, tokenContext);
  const artifactViolations = validateArtifact(artifact);
  if (artifactViolations.length > 0) {
    return buildResponse<AnalysisArtifact>('analyze', {
      status: 'ERROR',
      errors: [
        {
          code: 'EXECUTION_ERROR',
          message: `分析产物不符合契约：${formatViolations(artifactViolations)}`,
        },
      ],
    });
  }
  // Theme Integrity（IMPL-09 §24）不中断分析：问题以 warnings 呈现（不伪造结论）。
  const themeWarnings = (loaded?.themeValidation?.issues ?? []).map((issue) => ({
    code: 'THEME_INTEGRITY' as const,
    message: `${issue.code}: ${issue.message}`,
  }));
  return buildResponse<AnalysisArtifact>('analyze', {
    status: 'COMPLETED',
    data: artifact,
    ...(themeWarnings.length > 0 ? { warnings: themeWarnings } : {}),
    ...(layoutConfig !== undefined
      ? {
          layoutConfig: {
            version: layoutConfig.version,
            scope: layoutConfig.scope,
            enabled: layoutConfig.layout.enabled,
          },
        }
      : {}),
    reproducibility: {
      deterministic: true,
      snapshotId: snapshot.id,
      note: '离线分析确定性：相同快照产生相同评价、Finding 与 Diagnostic',
    },
  });
}
