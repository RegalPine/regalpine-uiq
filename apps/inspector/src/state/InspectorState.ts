/**
 * P9：Inspector 应用状态与 reducer（IMPL-10 §49）。
 *
 * 状态包含 selectedSubjectId、snapshotId、themeId、mode、activePanel。
 * AD-20：另存 sessionId/requestSequence 由 InspectorSession 管理，不在此重复。
 */
import type { MeasurementSnapshot } from '@uiq/core';

export type InspectorMode = 'ANALYSIS' | 'VALIDATION' | 'CONFORMANCE' | 'REGRESSION';

export type ActivePanel =
  | 'MEASUREMENT'
  | 'METRIC'
  | 'RULE'
  | 'FINDING'
  | 'DIAGNOSTIC'
  | 'TOKEN'
  | 'THEME'
  | 'TRACE';

export interface InspectorState {
  readonly selectedSubjectId: string | null;
  readonly snapshotId: string | null;
  readonly themeId: string | null;
  readonly mode: InspectorMode;
  readonly activePanel: ActivePanel;
  /** 当前快照（不可变）。 */
  readonly snapshot: MeasurementSnapshot | null;
  /** 是否正在分析中。 */
  readonly isAnalyzing: boolean;
  /** 最近一次分析错误（不影响历史快照）。 */
  readonly lastError: string | null;
}

export type InspectorAction =
  | { readonly type: 'SELECT_SUBJECT'; readonly subjectId: string }
  | { readonly type: 'CLEAR_SELECTION' }
  | { readonly type: 'SET_SNAPSHOT'; readonly snapshot: MeasurementSnapshot }
  | { readonly type: 'SET_THEME'; readonly themeId: string | null }
  | { readonly type: 'SET_MODE'; readonly mode: InspectorMode }
  | { readonly type: 'SET_ACTIVE_PANEL'; readonly panel: ActivePanel }
  | { readonly type: 'ANALYSIS_START' }
  | { readonly type: 'ANALYSIS_COMPLETE' }
  | { readonly type: 'ANALYSIS_ERROR'; readonly error: string }
  | { readonly type: 'RESET' };

export const INITIAL_INSPECTOR_STATE: InspectorState = {
  selectedSubjectId: null,
  snapshotId: null,
  themeId: null,
  mode: 'ANALYSIS',
  activePanel: 'MEASUREMENT',
  snapshot: null,
  isAnalyzing: false,
  lastError: null,
};

/** Inspector 状态 reducer（纯函数，便于测试）。 */
export function inspectorReducer(state: InspectorState, action: InspectorAction): InspectorState {
  switch (action.type) {
    case 'SELECT_SUBJECT':
      return { ...state, selectedSubjectId: action.subjectId, lastError: null };
    case 'CLEAR_SELECTION':
      return { ...state, selectedSubjectId: null, lastError: null };
    case 'SET_SNAPSHOT':
      return {
        ...state,
        snapshot: action.snapshot,
        snapshotId: action.snapshot.id,
        lastError: null,
      };
    case 'SET_THEME':
      return { ...state, themeId: action.themeId };
    case 'SET_MODE':
      return { ...state, mode: action.mode };
    case 'SET_ACTIVE_PANEL':
      return { ...state, activePanel: action.panel };
    case 'ANALYSIS_START':
      return { ...state, isAnalyzing: true, lastError: null };
    case 'ANALYSIS_COMPLETE':
      return { ...state, isAnalyzing: false, lastError: null };
    case 'ANALYSIS_ERROR':
      return { ...state, isAnalyzing: false, lastError: action.error };
    case 'RESET':
      return INITIAL_INSPECTOR_STATE;
    default:
      return state;
  }
}
