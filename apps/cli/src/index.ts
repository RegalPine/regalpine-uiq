import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { buildResponse, type CliResponse } from './artifact';
import { CliError, EXIT_CODES, type ExitCode } from './errors';
import { runAnalyze } from './commands/analyze';
import { runMeasure } from './commands/measure';
import { runEvaluate } from './commands/evaluate';
import { runConformance } from './commands/conformance';
import { runRegression } from './commands/regression';
import { runSnapshot } from './commands/snapshot';
import { runReport, type ReportFormat } from './commands/report';
import { runAuthSave } from './commands/auth-save';
import { runInstallSkill, type SupportedAgent } from './commands/install-skill';

/** 命令行输出接口（依赖注入，便于测试捕获）。 */
export interface CliIO {
  out(line: string): void;
  err(line: string): void;
}

export interface RunResult {
  readonly code: ExitCode;
  readonly response: CliResponse<unknown>;
}

/** P10：七命令（inspect 显式拒绝，属交互式 Inspector 应用）。 */
const SUPPORTED_COMMANDS = [
  'measure',
  'analyze',
  'evaluate',
  'conformance',
  'regression',
  'snapshot',
  'report',
  'auth-save',
  'install-skill',
] as const;

const USAGE = [
  'UIQ CLI (P10 完整命令集)',
  '',
  '用法：node uiq.js <command> [arguments]',
  '',
  '命令：',
  '  measure <target> [--subjects <selector>] [--output <file>] [--allow-external]',
  '      [--auth-state <file>]',
  '      采集浏览器目标的 MeasurementSnapshot（stdout JSON）。',
  '  analyze <target|snapshot.json> [--output <file>] [--allow-external]',
  '          [--tokens <file>] [--theme <id>] [--contract <file>] [--config <file>]',
  '          [--auth-state <file>]',
  '      对浏览器目标或快照文件执行完整分析（Metric → Rule → Finding → Diagnostic）。',
  '  evaluate <snapshot.json>',
  '      对快照执行 Metric → Rule 评价（不生成 Finding/Diagnostic）。',
  '  conformance <snapshot.json> --level <core|standard|browser|full>',
  '      分析快照并检查指定 Conformance Level 是否可达。',
  '  regression --baseline <baseline.json> --current <analysis.json>',
  '      比较 baseline 与当前分析产物，产出回归报告。',
  '  snapshot <target> --output <file> [--subjects <selector>] [--allow-external]',
  '      [--auth-state <file>]',
  '      采集浏览器目标并保存 MeasurementSnapshot 到文件。',
  '  report <analysis.json> [--format <json|markdown|html>] [--output <file>]',
  '      从已有分析产物生成质量报告（不暗中执行分析）。',
  '  auth-save <target> --output <file> [--allow-external]',
  '      打开浏览器，用户手动登录后保存 storageState JSON（配合 --auth-state 使用）。',
  '  install-skill [--agent <qoder|claude|codex|kiro>] [--copy]',
  '      安装 UIQ Skill 到指定 Agent 的 skills 目录（默认 qoder，使用符号链接）。',
  '',
  '说明：',
  '  - target 仅允许 file:// 与 http(s)://localhost|127.0.0.1；外部目标需 --allow-external。',
  '  - --auth-state 接受 Playwright storageState JSON 文件，用于需要登录态的目标页面。',
  '  - inspect 为交互式命令，请使用 Inspector 应用（apps/inspector）。',
  '  - 退出码：0 SUCCESS / 1 POLICY_BLOCK / 2 CONFORMANCE_FAILURE / 3 EXECUTION_ERROR / 4 INVALID_CONFIGURATION / 5 INPUT_ERROR。',
].join('\n');

interface ParsedArgs {
  readonly positional: string[];
  readonly output?: string;
  readonly subjects?: string;
  readonly tokensPath?: string;
  readonly themeId?: string;
  readonly contractPath?: string;
  readonly configPath?: string;
  readonly allowExternal: boolean;
  readonly help: boolean;
  readonly level?: string;
  readonly baselinePath?: string;
  readonly currentPath?: string;
  readonly format?: string;
  readonly projectId?: string;
  readonly authStatePath?: string;
  readonly agent?: SupportedAgent;
  readonly copy: boolean;
}

function parseArgs(args: readonly string[]): ParsedArgs {
  const positional: string[] = [];
  let output: string | undefined;
  let subjects: string | undefined;
  let tokensPath: string | undefined;
  let themeId: string | undefined;
  let contractPath: string | undefined;
  let configPath: string | undefined;
  let allowExternal = false;
  let help = false;
  let level: string | undefined;
  let baselinePath: string | undefined;
  let currentPath: string | undefined;
  let format: string | undefined;
  let projectId: string | undefined;
  let authStatePath: string | undefined;
  let agent: SupportedAgent | undefined;
  let copy = false;
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--output') {
      output = args[i + 1];
      i += 1;
    } else if (arg === '--subjects') {
      subjects = args[i + 1];
      i += 1;
    } else if (arg === '--tokens') {
      tokensPath = args[i + 1];
      i += 1;
    } else if (arg === '--theme') {
      themeId = args[i + 1];
      i += 1;
    } else if (arg === '--contract') {
      contractPath = args[i + 1];
      i += 1;
    } else if (arg === '--config') {
      configPath = args[i + 1];
      i += 1;
    } else if (arg === '--level') {
      level = args[i + 1];
      i += 1;
    } else if (arg === '--baseline') {
      baselinePath = args[i + 1];
      i += 1;
    } else if (arg === '--current') {
      currentPath = args[i + 1];
      i += 1;
    } else if (arg === '--format') {
      format = args[i + 1];
      i += 1;
    } else if (arg === '--project-id') {
      projectId = args[i + 1];
      i += 1;
    } else if (arg === '--auth-state') {
      authStatePath = args[i + 1];
      i += 1;
    } else if (arg === '--agent') {
      agent = args[i + 1] as SupportedAgent;
      i += 1;
    } else if (arg === '--copy') {
      copy = true;
    } else if (arg === '--allow-external') {
      allowExternal = true;
    } else if (arg === '--help' || arg === '-h') {
      help = true;
    } else if (arg?.startsWith('--')) {
      throw new CliError('INVALID_CONFIGURATION', `未知参数：${arg}`);
    } else if (arg !== undefined) {
      positional.push(arg);
    }
  }
  return {
    positional,
    ...(output !== undefined ? { output } : {}),
    ...(subjects !== undefined ? { subjects } : {}),
    ...(tokensPath !== undefined ? { tokensPath } : {}),
    ...(themeId !== undefined ? { themeId } : {}),
    ...(contractPath !== undefined ? { contractPath } : {}),
    ...(configPath !== undefined ? { configPath } : {}),
    ...(level !== undefined ? { level } : {}),
    ...(baselinePath !== undefined ? { baselinePath } : {}),
    ...(currentPath !== undefined ? { currentPath } : {}),
    ...(format !== undefined ? { format } : {}),
    ...(projectId !== undefined ? { projectId } : {}),
    ...(authStatePath !== undefined ? { authStatePath } : {}),
    ...(agent !== undefined ? { agent } : {}),
    allowExternal,
    help,
    copy,
  };
}

function writeOutputFile(io: CliIO, path: string, data: unknown): void {
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, 'utf-8');
  io.err(`[uiq] 产物已写入 ${path}`);
}

/**
 * 退出码精确映射（P10-03）：
 * - PARTIAL 不伪装 SUCCESS
 * - 各命令按语义映射到精确退出码
 */
function resolveExitCode(command: string, response: CliResponse<unknown>): ExitCode {
  if (response.status === 'ERROR') {
    const errorCode = response.errors?.[0]?.code;
    if (errorCode !== undefined && errorCode in EXIT_CODES) {
      return EXIT_CODES[errorCode as keyof typeof EXIT_CODES];
    }
    return EXIT_CODES.EXECUTION_ERROR;
  }
  if (response.status === 'PARTIAL') {
    return EXIT_CODES.EXECUTION_ERROR;
  }
  // COMPLETED / UNKNOWN
  if (command === 'evaluate' && response.data !== undefined) {
    const data = response.data as { hasFailures?: boolean };
    if (data.hasFailures === true) return EXIT_CODES.CONFORMANCE_FAILURE;
  }
  if (command === 'conformance' && response.data !== undefined) {
    const data = response.data as { executable?: boolean; failed?: number };
    if (data.executable === false) return EXIT_CODES.POLICY_BLOCK;
    if ((data.failed ?? 0) > 0) return EXIT_CODES.CONFORMANCE_FAILURE;
  }
  if (command === 'regression' && response.data !== undefined) {
    const data = response.data as { status?: string; hasNewFailures?: boolean };
    if (data.status === 'INCOMPARABLE') return EXIT_CODES.EXECUTION_ERROR;
    if (data.hasNewFailures === true) return EXIT_CODES.CONFORMANCE_FAILURE;
  }
  return EXIT_CODES.SUCCESS;
}

/**
 * UIQ-ARCH-01 §15：stdout 只输出 JSON response，stderr 只输出日志；
 * CliError → 对应退出码的 ERROR response（P4-03：失败不输出伪质量结论）。
 */
export async function runCli(argv: readonly string[], io: CliIO): Promise<RunResult> {
  try {
    const [command = '', ...rest] = argv;
    if (command === '' || command === '--help' || command === '-h') {
      io.err(USAGE);
      throw new CliError('INVALID_CONFIGURATION', command === '' ? '缺少命令' : '');
    }
    // inspect 显式拒绝（P10：交互式 Inspector 属 Inspector 应用）
    if (command === 'inspect') {
      io.err(USAGE);
      throw new CliError(
        'INVALID_CONFIGURATION',
        'inspect 为交互式命令，请使用 Inspector 应用（apps/inspector）',
      );
    }
    if (!(SUPPORTED_COMMANDS as readonly string[]).includes(command)) {
      io.err(USAGE);
      throw new CliError(
        'INVALID_CONFIGURATION',
        `未支持的命令：${command}。当前支持：${SUPPORTED_COMMANDS.join('、')}`,
      );
    }
    const args = parseArgs(rest);
    if (args.help) {
      io.err(USAGE);
      const empty: CliResponse<never> = buildResponse(command, { status: 'UNKNOWN' });
      return { code: EXIT_CODES.SUCCESS, response: empty };
    }

    let response: CliResponse<unknown>;

    switch (command) {
      case 'measure': {
        if (
          args.tokensPath !== undefined ||
          args.themeId !== undefined ||
          args.contractPath !== undefined ||
          args.configPath !== undefined
        ) {
          throw new CliError(
            'INVALID_CONFIGURATION',
            '--tokens/--theme/--contract/--config 仅 analyze 支持',
          );
        }
        const target = args.positional[0];
        if (target === undefined) {
          throw new CliError('INVALID_CONFIGURATION', `${command} 缺少目标参数`);
        }
        response = await runMeasure({
          target,
          ...(args.subjects !== undefined ? { subjects: args.subjects } : {}),
          allowExternal: args.allowExternal,
          ...(args.authStatePath !== undefined ? { authStatePath: args.authStatePath } : {}),
        });
        if (args.output !== undefined && response.data !== undefined) {
          writeOutputFile(io, args.output, response.data);
        }
        break;
      }

      case 'analyze': {
        const target = args.positional[0];
        if (target === undefined) {
          throw new CliError('INVALID_CONFIGURATION', `${command} 缺少目标参数`);
        }
        response = await runAnalyze({
          target,
          ...(args.subjects !== undefined ? { subjects: args.subjects } : {}),
          allowExternal: args.allowExternal,
          ...(args.tokensPath !== undefined ? { tokensPath: args.tokensPath } : {}),
          ...(args.themeId !== undefined ? { themeId: args.themeId } : {}),
          ...(args.contractPath !== undefined ? { contractPath: args.contractPath } : {}),
          ...(args.configPath !== undefined ? { configPath: args.configPath } : {}),
          ...(args.authStatePath !== undefined ? { authStatePath: args.authStatePath } : {}),
        });
        if (args.output !== undefined && response.data !== undefined) {
          writeOutputFile(io, args.output, response.data);
        }
        break;
      }

      case 'evaluate': {
        const target = args.positional[0];
        if (target === undefined) {
          throw new CliError('INVALID_CONFIGURATION', `${command} 缺少快照文件参数`);
        }
        response = await runEvaluate({ target });
        if (args.output !== undefined && response.data !== undefined) {
          writeOutputFile(io, args.output, response.data);
        }
        break;
      }

      case 'conformance': {
        const target = args.positional[0];
        if (target === undefined) {
          throw new CliError('INVALID_CONFIGURATION', `${command} 缺少快照文件参数`);
        }
        if (args.level === undefined) {
          throw new CliError('INVALID_CONFIGURATION', `${command} 缺少 --level 参数`);
        }
        response = await runConformance({ target, level: args.level });
        if (args.output !== undefined && response.data !== undefined) {
          writeOutputFile(io, args.output, response.data);
        }
        break;
      }

      case 'regression': {
        if (args.baselinePath === undefined) {
          throw new CliError('INPUT_ERROR', `${command} 缺少 --baseline 参数`);
        }
        const currentPath = args.currentPath ?? args.positional[0];
        if (currentPath === undefined) {
          throw new CliError('INPUT_ERROR', `${command} 缺少当前分析文件（--current 或位置参数）`);
        }
        response = await runRegression({
          baselinePath: args.baselinePath,
          currentPath,
        });
        if (args.output !== undefined && response.data !== undefined) {
          writeOutputFile(io, args.output, response.data);
        }
        break;
      }

      case 'snapshot': {
        const target = args.positional[0];
        if (target === undefined) {
          throw new CliError('INVALID_CONFIGURATION', `${command} 缺少目标 URL 参数`);
        }
        if (args.output === undefined) {
          throw new CliError('INVALID_CONFIGURATION', `${command} 缺少 --output 参数`);
        }
        response = await runSnapshot({
          target,
          outputPath: args.output,
          ...(args.subjects !== undefined ? { subjects: args.subjects } : {}),
          allowExternal: args.allowExternal,
          ...(args.authStatePath !== undefined ? { authStatePath: args.authStatePath } : {}),
        });
        break;
      }

      case 'report': {
        const target = args.positional[0];
        if (target === undefined) {
          throw new CliError('INVALID_CONFIGURATION', `${command} 缺少分析产物文件参数`);
        }
        response = await runReport({
          target,
          format: (args.format ?? 'json') as ReportFormat,
          ...(args.output !== undefined ? { outputPath: args.output } : {}),
          ...(args.projectId !== undefined ? { projectId: args.projectId } : {}),
        });
        if (args.output !== undefined && response.data !== undefined) {
          // report 命令的 --output 已在 runReport 内部处理渲染输出
          // 这里不再重复写 data（避免 JSON 与 markdown/html 混合）
        }
        break;
      }

      case 'auth-save': {
        const target = args.positional[0];
        if (target === undefined) {
          throw new CliError('INVALID_CONFIGURATION', `${command} 缺少目标 URL 参数`);
        }
        if (args.output === undefined) {
          throw new CliError('INVALID_CONFIGURATION', `${command} 缺少 --output 参数`);
        }
        response = await runAuthSave({
          target,
          outputPath: args.output,
          allowExternal: args.allowExternal,
        });
        break;
      }

      case 'install-skill': {
        response = await runInstallSkill({
          agent: args.agent ?? 'qoder',
          copy: args.copy,
        });
        break;
      }

      default:
        throw new CliError('INVALID_CONFIGURATION', `未实现的命令：${command}`);
    }

    io.out(JSON.stringify(response));
    return { code: resolveExitCode(command, response), response };
  } catch (error) {
    if (error instanceof CliError) {
      const message = error.message === '' ? 'invalid usage' : error.message;
      const response = buildResponse<never>(argv[0] ?? '', {
        status: 'ERROR',
        errors: [{ code: error.errorCode, message }],
      });
      io.out(JSON.stringify(response));
      return { code: error.exitCode, response };
    }
    const message = error instanceof Error ? error.message : String(error);
    const response = buildResponse<never>(argv[0] ?? '', {
      status: 'ERROR',
      errors: [{ code: 'EXECUTION_ERROR', message }],
    });
    io.out(JSON.stringify(response));
    return { code: EXIT_CODES.EXECUTION_ERROR, response };
  }
}

/** Node 进程入口：仅当直接执行本文件时启动（vitest 进程内导入不触发）。 */
const isMain =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const cliIO: CliIO = {
    out: (line) => console.log(line),
    err: (line) => console.error(line),
  };
  runCli(process.argv.slice(2), cliIO).then(
    ({ code }) => {
      process.exitCode = code;
    },
    (error: unknown) => {
      console.error(`[uiq] 未捕获错误：${error instanceof Error ? error.stack : String(error)}`);
      process.exitCode = EXIT_CODES.EXECUTION_ERROR;
    },
  );
}
