import { describe, expect, it } from 'vitest';
import { createGoldenRunner, type GoldenCase } from '@uiq/conformance';

const runner = createGoldenRunner();

describe('GoldenRunner：被测函数注入', () => {
  it('数值严格相等（无 tolerance）', () => {
    const cases: GoldenCase<number, number>[] = [
      { id: 'G-001', version: '1.0.0', input: 1, expected: 1 },
      { id: 'G-002', version: '1.0.0', input: 2, expected: 3 },
    ];
    const report = runner.run(cases, (input: number) => input);
    expect(report.total).toBe(2);
    expect(report.passed).toBe(1);
    expect(report.failed).toBe(1);
    expect(report.cases[1]?.status).toBe('FAIL');
    expect(report.cases[1]?.expected).toBe(3);
    expect(report.cases[1]?.actual).toBe(2);
  });

  it('ABSOLUTE tolerance：容差下界/边界/上界/超界（AC-CONF-04 雏形）', () => {
    const tolerance = { type: 'ABSOLUTE' as const, value: 0.5 };
    const cases: GoldenCase<number, number>[] = [
      { id: 'BELOW', version: '1.0.0', input: 4.6, expected: 5, tolerance },
      { id: 'EXACT', version: '1.0.0', input: 4.5, expected: 5, tolerance },
      { id: 'ABOVE', version: '1.0.0', input: 5.4, expected: 5, tolerance },
      { id: 'OUTSIDE', version: '1.0.0', input: 4.4, expected: 5, tolerance },
    ];
    const report = runner.run(cases, (input: number) => input);
    expect(report.cases.map((c) => c.status)).toEqual(['PASS', 'PASS', 'PASS', 'FAIL']);
  });

  it('RELATIVE tolerance 以期望值为基准', () => {
    const tolerance = { type: 'RELATIVE' as const, value: 0.01 };
    const cases: GoldenCase<number, number>[] = [
      // |100.5 - 100| / 100 = 0.005 ≤ 0.01 → PASS
      { id: 'R-001', version: '1.0.0', input: 100.5, expected: 100, tolerance },
      // |102 - 100| / 100 = 0.02 > 0.01 → FAIL
      { id: 'R-002', version: '1.0.0', input: 102, expected: 100, tolerance },
    ];
    const report = runner.run(cases, (input: number) => input);
    expect(report.cases.map((c) => c.status)).toEqual(['PASS', 'FAIL']);
  });

  it('RELATIVE tolerance 在期望值为 0 时退化为绝对比较', () => {
    const tolerance = { type: 'RELATIVE' as const, value: 0.001 };
    const cases: GoldenCase<number, number>[] = [
      { id: 'ZERO-OK', version: '1.0.0', input: 0.0005, expected: 0, tolerance },
      { id: 'ZERO-BAD', version: '1.0.0', input: 0.01, expected: 0, tolerance },
    ];
    const report = runner.run(cases, (input: number) => input);
    expect(report.cases.map((c) => c.status)).toEqual(['PASS', 'FAIL']);
  });

  it('对象/数组期望按 canonical 深比较（键序无关）', () => {
    const cases: GoldenCase<unknown, unknown>[] = [
      { id: 'OBJ', version: '1.0.0', input: null, expected: { a: 1, b: [1, 2] } },
    ];
    const report = runner.run(cases, () => ({ b: [1, 2], a: 1 }));
    expect(report.cases[0]?.status).toBe('PASS');
  });

  it('execute 抛错 → case 状态 ERROR 且不吞异常信息', () => {
    const cases: GoldenCase<string, never>[] = [
      { id: 'ERR', version: '1.0.0', input: 'x', expected: null as never },
    ];
    const report = runner.run(cases, () => {
      throw new Error('boom');
    });
    expect(report.cases[0]?.status).toBe('ERROR');
    expect(report.cases[0]?.message).toBe('boom');
    expect(report.failed).toBe(0);
  });

  it('FAIL 不改写期望（IMPL-11 §12：禁止 Expected = Actual）', () => {
    const testCase: GoldenCase<number, number> = {
      id: 'IMMUTABLE',
      version: '1.0.0',
      input: 7,
      expected: 42,
    };
    const before = structuredClone(testCase);
    runner.run([testCase], (input: number) => input);
    expect(testCase).toEqual(before);
    expect(testCase.expected).toBe(42);
  });

  it('tolerance 用于非数值期望时报错（不静默通过）', () => {
    const cases: GoldenCase<null, string>[] = [
      {
        id: 'BAD-TOL',
        version: '1.0.0',
        input: null,
        expected: 'text',
        tolerance: { type: 'ABSOLUTE', value: 1 },
      },
    ];
    expect(() => runner.run(cases, () => 'text')).toThrow(/tolerance/);
  });
});
