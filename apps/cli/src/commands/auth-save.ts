import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { buildResponse, type CliResponse } from '../artifact';
import { CliError } from '../errors';
import { assertTargetAllowed, MEASUREMENT_VIEWPORT, MEASUREMENT_DEVICE_SCALE_FACTOR } from '../browser/executor';

export interface AuthSaveOptions {
  /** 目标 URL（用户在此页面完成登录）。 */
  readonly target: string;
  /** 输出文件路径（storageState JSON）。 */
  readonly outputPath: string;
  readonly allowExternal: boolean;
}

export interface AuthSaveData {
  readonly path: string;
  readonly target: string;
  readonly cookiesCount: number;
  readonly originsCount: number;
}

/** 等待用户在终端按回车确认。 */
function waitForEnter(prompt: string): Promise<void> {
  return new Promise((resolvePromise) => {
    const rl = createInterface({ input: process.stdin, output: process.stderr });
    rl.question(prompt, () => {
      rl.close();
      resolvePromise();
    });
  });
}

/**
 * auth-save：打开有头浏览器，用户手动登录后保存 storageState。
 *
 * 流程：
 * 1. 启动 headed Chromium（用户可见浏览器窗口）
 * 2. 导航到目标 URL
 * 3. 等待用户在终端按回车
 * 4. 调用 context.storageState() 保存 cookies + localStorage
 * 5. 关闭浏览器，写入 JSON 文件
 *
 * 生成的 JSON 可直接传给 `--auth-state` 参数。
 */
export async function runAuthSave(options: AuthSaveOptions): Promise<CliResponse<AuthSaveData>> {
  if (options.outputPath === '') {
    throw new CliError('INVALID_CONFIGURATION', 'auth-save 需要 --output 参数指定输出文件路径');
  }

  const url = assertTargetAllowed(options.target, options.allowExternal);
  const resolvedOutput = resolve(options.outputPath);

  const browser = await chromium.launch({ headless: false });
  try {
    const context = await browser.newContext({
      viewport: { ...MEASUREMENT_VIEWPORT },
      deviceScaleFactor: MEASUREMENT_DEVICE_SCALE_FACTOR,
    });
    const page = await context.newPage();
    await page.goto(url.href, { waitUntil: 'load', timeout: 60_000 });

    process.stderr.write(`[uiq] 浏览器已打开：${url.href}\n`);
    process.stderr.write('[uiq] 请在浏览器中完成登录，然后回到终端按回车确认...\n');

    await waitForEnter('[uiq] 登录完成？按回车保存认证状态...');

    const storageState = await context.storageState();
    await context.close();

    writeFileSync(resolvedOutput, `${JSON.stringify(storageState, null, 2)}\n`, 'utf-8');

    const cookiesCount = storageState.cookies?.length ?? 0;
    const originsCount = storageState.origins?.length ?? 0;

    process.stderr.write(
      `[uiq] 认证状态已保存：${resolvedOutput}（${cookiesCount} cookies, ${originsCount} origins）\n`,
    );

    return buildResponse<AuthSaveData>('auth-save', {
      status: 'COMPLETED',
      data: {
        path: resolvedOutput,
        target: url.href,
        cookiesCount,
        originsCount,
      },
    });
  } catch (error) {
    if (error instanceof CliError) throw error;
    const message = error instanceof Error ? error.message : String(error);
    throw new CliError('EXECUTION_ERROR', `保存认证状态失败：${message}`);
  } finally {
    await browser.close();
  }
}
