import { describe, expect, it } from 'vitest';
import { checkCapabilityContract, checkEvaluationStateCoverage } from '@uiq/conformance';

describe('checkCapabilityContract（Schema/Contract 校验，actual 由调用方注入）', () => {
  const declared = [
    { id: 'COLOR.CONTRAST', version: '1.0.0' },
    { id: 'GEOMETRY.WIDTH', version: '1.0.0' },
  ];

  it('全部匹配 → 无 issue', () => {
    const issues = checkCapabilityContract(declared, [
      { id: 'COLOR.CONTRAST', version: '1.0.0' },
      { id: 'GEOMETRY.WIDTH', version: '1.0.0' },
    ]);
    expect(issues).toEqual([]);
  });

  it('MISSING：声明未实现', () => {
    const issues = checkCapabilityContract(declared, [{ id: 'COLOR.CONTRAST', version: '1.0.0' }]);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.type).toBe('MISSING');
    expect(issues[0]?.id).toBe('GEOMETRY.WIDTH');
  });

  it('EXTRA：实现未声明', () => {
    const issues = checkCapabilityContract(declared, [
      ...declared,
      { id: 'MYSTERY.METRIC', version: '1.0.0' },
    ]);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.type).toBe('EXTRA');
    expect(issues[0]?.id).toBe('MYSTERY.METRIC');
  });

  it('VERSION_MISMATCH：同 id 不同版本', () => {
    const issues = checkCapabilityContract(declared, [
      { id: 'COLOR.CONTRAST', version: '2.0.0' },
      { id: 'GEOMETRY.WIDTH', version: '1.0.0' },
    ]);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.type).toBe('VERSION_MISMATCH');
    expect(issues[0]?.message).toContain('1.0.0');
    expect(issues[0]?.message).toContain('2.0.0');
  });

  it('core Registry.list() 形状可直接作为 actual 传入（结构兼容）', () => {
    const registryLike = [
      { id: 'COLOR.CONTRAST', version: '1.0.0', kind: 'BASE', dependencies: [] },
    ];
    const issues = checkCapabilityContract(declared, registryLike);
    // GEOMETRY.WIDTH 缺失 → 一个 issue；EXTRA 不报（list 项含额外字段不影响 {id,version} 投影）
    expect(issues).toHaveLength(1);
    expect(issues[0]?.type).toBe('MISSING');
  });
});

describe('checkEvaluationStateCoverage（AC-CONF-06 检查工具）', () => {
  it('六态全覆盖 → missing 为空', () => {
    const coverage = checkEvaluationStateCoverage([
      'PASS',
      'FAIL',
      'WARN',
      'NOT_APPLICABLE',
      'UNKNOWN',
      'ERROR',
    ]);
    expect(coverage.missing).toEqual([]);
    expect(coverage.covered).toHaveLength(6);
    expect(coverage.counts.PASS).toBe(1);
  });

  it('部分覆盖 → 精确列出缺失状态', () => {
    const coverage = checkEvaluationStateCoverage(['PASS', 'PASS', 'FAIL']);
    expect(coverage.missing).toEqual(['WARN', 'NOT_APPLICABLE', 'UNKNOWN', 'ERROR']);
    expect(coverage.counts.PASS).toBe(2);
  });

  it('未知状态字符串不计入（不伪造覆盖）', () => {
    const coverage = checkEvaluationStateCoverage(['PASS', 'MAYBE']);
    expect(coverage.counts.PASS).toBe(1);
    expect(coverage.counts.FAIL).toBe(0);
    expect(coverage.covered).toEqual(['PASS']);
  });
});
