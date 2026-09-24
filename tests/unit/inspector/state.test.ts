import { describe, expect, it } from 'vitest';
import { inspectorReducer, INITIAL_INSPECTOR_STATE } from '@uiq/inspector';
import type { MeasurementSnapshot } from '@uiq/core';

function makeSnapshot(id: string): MeasurementSnapshot {
  return {
    id,
    capturedAt: Date.now(),
    source: { type: 'BROWSER', adapter: '@uiq/browser', version: '1.0.0' },
    measurements: [],
  };
}

describe('P9: InspectorState reducer', () => {
  it('initial state has null selections', () => {
    expect(INITIAL_INSPECTOR_STATE.selectedSubjectId).toBeNull();
    expect(INITIAL_INSPECTOR_STATE.snapshotId).toBeNull();
    expect(INITIAL_INSPECTOR_STATE.mode).toBe('ANALYSIS');
    expect(INITIAL_INSPECTOR_STATE.activePanel).toBe('MEASUREMENT');
    expect(INITIAL_INSPECTOR_STATE.isAnalyzing).toBe(false);
  });

  it('SELECT_SUBJECT sets subjectId and clears error', () => {
    const state = inspectorReducer(
      { ...INITIAL_INSPECTOR_STATE, lastError: 'old error' },
      { type: 'SELECT_SUBJECT', subjectId: 'btn-1' },
    );
    expect(state.selectedSubjectId).toBe('btn-1');
    expect(state.lastError).toBeNull();
  });

  it('CLEAR_SELECTION resets subjectId', () => {
    const state = inspectorReducer(
      { ...INITIAL_INSPECTOR_STATE, selectedSubjectId: 'btn-1' },
      { type: 'CLEAR_SELECTION' },
    );
    expect(state.selectedSubjectId).toBeNull();
  });

  it('SET_SNAPSHOT stores snapshot and snapshotId', () => {
    const snap = makeSnapshot('snap-1');
    const state = inspectorReducer(INITIAL_INSPECTOR_STATE, {
      type: 'SET_SNAPSHOT',
      snapshot: snap,
    });
    expect(state.snapshot).toBe(snap);
    expect(state.snapshotId).toBe('snap-1');
  });

  it('SET_THEME changes themeId', () => {
    const state = inspectorReducer(INITIAL_INSPECTOR_STATE, {
      type: 'SET_THEME',
      themeId: 'dark',
    });
    expect(state.themeId).toBe('dark');
  });

  it('SET_MODE changes mode', () => {
    const state = inspectorReducer(INITIAL_INSPECTOR_STATE, {
      type: 'SET_MODE',
      mode: 'REGRESSION',
    });
    expect(state.mode).toBe('REGRESSION');
  });

  it('SET_ACTIVE_PANEL changes panel', () => {
    const state = inspectorReducer(INITIAL_INSPECTOR_STATE, {
      type: 'SET_ACTIVE_PANEL',
      panel: 'FINDING',
    });
    expect(state.activePanel).toBe('FINDING');
  });

  it('ANALYSIS_START sets isAnalyzing', () => {
    const state = inspectorReducer(INITIAL_INSPECTOR_STATE, { type: 'ANALYSIS_START' });
    expect(state.isAnalyzing).toBe(true);
    expect(state.lastError).toBeNull();
  });

  it('ANALYSIS_COMPLETE clears isAnalyzing', () => {
    const state = inspectorReducer(
      { ...INITIAL_INSPECTOR_STATE, isAnalyzing: true },
      { type: 'ANALYSIS_COMPLETE' },
    );
    expect(state.isAnalyzing).toBe(false);
  });

  it('ANALYSIS_ERROR sets error and clears isAnalyzing', () => {
    const state = inspectorReducer(
      { ...INITIAL_INSPECTOR_STATE, isAnalyzing: true },
      { type: 'ANALYSIS_ERROR', error: 'something failed' },
    );
    expect(state.isAnalyzing).toBe(false);
    expect(state.lastError).toBe('something failed');
  });

  it('RESET returns to initial state', () => {
    const modified = inspectorReducer(INITIAL_INSPECTOR_STATE, {
      type: 'SELECT_SUBJECT',
      subjectId: 'x',
    });
    const reset = inspectorReducer(modified, { type: 'RESET' });
    expect(reset).toEqual(INITIAL_INSPECTOR_STATE);
  });

  it('theme switch does not clear snapshot (independent state)', () => {
    const snap = makeSnapshot('snap-1');
    let state = inspectorReducer(INITIAL_INSPECTOR_STATE, {
      type: 'SET_SNAPSHOT',
      snapshot: snap,
    });
    state = inspectorReducer(state, { type: 'SET_THEME', themeId: 'dark' });
    expect(state.snapshot).toBe(snap);
    expect(state.themeId).toBe('dark');
  });
});
