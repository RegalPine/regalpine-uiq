import { canonicalJson, type Tolerance } from '@uiq/core';
import type { GoldenCase, GoldenCaseResult, GoldenReport } from './types';

/**
 * 被测函数注入契约（ARCH-01 §4.3）：Golden 执行器通过调用方传入的函数运行被测实现，
 * 生产 conformance 不 import 被测引擎或 Playwright；纯比较与实际执行解耦。
 */
export type GoldenExecutor<TInput, TOutput> = (input: TInput) => TOutput;

export interface GoldenRunner {
  run<TInput, TOutput>(
    cases: readonly GoldenCase<TInput, TOutput>[],
    execute: GoldenExecutor<TInput, TOutput>,
  ): GoldenReport<TOutput>;
}

export function createGoldenRunner(): GoldenRunner {
  return {
    run(cases, execute) {
      const results = cases.map((testCase) => runCase(testCase, execute));
      return {
        total: results.length,
        passed: results.filter((r) => r.status === 'PASS').length,
        failed: results.filter((r) => r.status === 'FAIL').length,
        cases: results,
      };
    },
  };
}

function runCase<TInput, TOutput>(
  testCase: GoldenCase<TInput, TOutput>,
  execute: GoldenExecutor<TInput, TOutput>,
): GoldenCaseResult<TOutput> {
  let actual: TOutput;
  try {
    actual = execute(testCase.input);
  } catch (error) {
    return {
      id: testCase.id,
      version: testCase.version,
      status: 'ERROR',
      message: error instanceof Error ? error.message : String(error),
      expected: testCase.expected,
    };
  }
  if (compare(testCase.expected, actual, testCase.tolerance)) {
    return { id: testCase.id, version: testCase.version, status: 'PASS' };
  }
  // IMPL-11 §12：Golden FAIL 不自动改写期望（Expected = Actual 被禁止），必须人工复核。
  return {
    id: testCase.id,
    version: testCase.version,
    status: 'FAIL',
    message: 'Golden 期望与实际不一致；期望不被自动更新，需人工复核',
    expected: testCase.expected,
    actual,
  };
}

function compare(expected: unknown, actual: unknown, tolerance?: Tolerance): boolean {
  if (typeof expected === 'number' && typeof actual === 'number') {
    if (tolerance === undefined) return Object.is(expected, actual);
    return withinTolerance(expected, actual, tolerance);
  }
  if (tolerance !== undefined) {
    throw new Error(`GoldenCase tolerance 仅支持数值期望（received ${typeof expected}）`);
  }
  return canonicalJson(expected) === canonicalJson(actual);
}

function withinTolerance(expected: number, actual: number, tolerance: Tolerance): boolean {
  const diff = Math.abs(actual - expected);
  if (tolerance.type === 'ABSOLUTE') return diff <= tolerance.value;
  // RELATIVE 以期望值为基准；expected 为 0 时退化为绝对比较（避免除零放大误差）。
  const base = Math.abs(expected);
  return base === 0 ? diff <= tolerance.value : diff / base <= tolerance.value;
}
