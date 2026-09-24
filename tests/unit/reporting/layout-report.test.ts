import { describe, expect, it } from 'vitest';
import {
  LAYOUT_REPORT_SCHEMA_VERSION,
  emptyLayoutReport,
  QUALITY_REPORT_SCHEMA_VERSION_EXTENDED,
} from '@uiq/reporting';

describe('P8: Layout report model', () => {
  it('LAYOUT_REPORT_SCHEMA_VERSION is 1.1.0', () => {
    expect(LAYOUT_REPORT_SCHEMA_VERSION).toBe('1.1.0');
  });

  it('QUALITY_REPORT_SCHEMA_VERSION_EXTENDED is 1.1.0', () => {
    expect(QUALITY_REPORT_SCHEMA_VERSION_EXTENDED).toBe('1.1.0');
  });

  it('emptyLayoutReport returns valid empty structure', () => {
    const report = emptyLayoutReport();
    expect(report.schemaVersion).toBe('1.1.0');
    expect(report.regions).toEqual([]);
    expect(report.components).toEqual([]);
    expect(report.elements).toEqual([]);
    expect(report.stateDistribution.PASS).toBe(0);
    expect(report.stateDistribution.FAIL).toBe(0);
    expect(report.coverage.evaluated).toBe(0);
    expect(report.coverage.total).toBe(0);
    expect(report.findingGroups).toEqual([]);
  });

  it('emptyLayoutReport has all six states', () => {
    const report = emptyLayoutReport();
    const states = Object.keys(report.stateDistribution).sort();
    expect(states).toEqual(['ERROR', 'FAIL', 'NOT_APPLICABLE', 'PASS', 'UNKNOWN', 'WARN']);
  });
});
