import { useReducer, useCallback, type JSX } from 'react';
import { inspectorReducer, INITIAL_INSPECTOR_STATE } from './state/InspectorState';
import { selectorReducer, INITIAL_SELECTOR_STATE } from './selection/ElementSelector';
import type { ActivePanel } from './state/InspectorState';
import { ElementTreePanel } from './panels/ElementTreePanel';
import { SelectionOverlay } from './selection/SelectionOverlay';
import type { TreeNode } from './selection/DomTreeBuilder';

const PANELS: readonly { id: ActivePanel; label: string }[] = [
  { id: 'MEASUREMENT', label: 'Measurement' },
  { id: 'METRIC', label: 'Metric' },
  { id: 'RULE', label: 'Rule' },
  { id: 'FINDING', label: 'Finding' },
  { id: 'DIAGNOSTIC', label: 'Diagnostic' },
  { id: 'TOKEN', label: 'Token' },
  { id: 'THEME', label: 'Theme' },
  { id: 'TRACE', label: 'Trace' },
];

/**
 * P9：UIQ Inspector 根组件（IMPL-10 §50）。
 *
 * 三栏布局：左（Element Tree）| 中（Rendered UI iframe + Overlay）| 右（Analysis Panel tabs）。
 */
export function App(): JSX.Element {
  const [state, dispatch] = useReducer(inspectorReducer, INITIAL_INSPECTOR_STATE);
  const [selectorState, selectorDispatch] = useReducer(selectorReducer, INITIAL_SELECTOR_STATE);

  const handleSelectElement = useCallback(
    (id: string) => {
      dispatch({ type: 'SELECT_SUBJECT', subjectId: id });
    },
    [dispatch],
  );

  const handleClearSelection = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTION' });
    selectorDispatch({ type: 'CLEAR' });
  }, [dispatch, selectorDispatch]);

  const handlePanelChange = useCallback(
    (panel: ActivePanel) => {
      dispatch({ type: 'SET_ACTIVE_PANEL', panel });
    },
    [dispatch],
  );

  // Placeholder tree for now; will be populated from iframe DOM
  const tree: TreeNode | null = null;

  return (
    <div className="uiq-inspector" data-testid="inspector-root">
      <header className="uiq-inspector-header">
        <h1>UIQ Inspector</h1>
        <div className="uiq-inspector-controls">
          <select
            value={state.mode}
            onChange={(e) =>
              dispatch({ type: 'SET_MODE', mode: e.target.value as typeof state.mode })
            }
            data-testid="mode-select"
          >
            <option value="ANALYSIS">Analysis</option>
            <option value="VALIDATION">Validation</option>
            <option value="CONFORMANCE">Conformance</option>
            <option value="REGRESSION">Regression</option>
          </select>
          <button onClick={handleClearSelection} data-testid="clear-selection-btn">
            Clear
          </button>
        </div>
        <span className="uiq-inspector-mode" data-testid="current-mode">
          {state.mode}
        </span>
      </header>
      <div className="uiq-inspector-body">
        {/* Left: Element Tree */}
        <aside className="uiq-inspector-left" data-testid="inspector-left">
          <ElementTreePanel
            tree={tree}
            selectedId={state.selectedSubjectId}
            onSelect={handleSelectElement}
          />
        </aside>

        {/* Center: Rendered UI iframe + Selection Overlay */}
        <main
          className="uiq-inspector-center"
          data-testid="inspector-center"
          style={{ position: 'relative' }}
        >
          <iframe
            className="uiq-inspector-iframe"
            title="Rendered UI"
            data-testid="inspector-iframe"
            src="about:blank"
          />
          <SelectionOverlay
            rect={selectorState.selected?.rect ?? null}
            iframeOffset={{ x: 0, y: 0 }}
            label={selectorState.selected?.elementId}
          />
        </main>

        {/* Right: Analysis Panel */}
        <aside className="uiq-inspector-right" data-testid="inspector-right">
          <nav className="uiq-inspector-tabs" role="tablist" data-testid="panel-tabs">
            {PANELS.map((panel) => (
              <button
                key={panel.id}
                role="tab"
                aria-selected={state.activePanel === panel.id}
                className={`uiq-tab ${state.activePanel === panel.id ? 'uiq-tab-active' : ''}`}
                onClick={() => handlePanelChange(panel.id)}
                data-testid={`tab-${panel.id.toLowerCase()}`}
              >
                {panel.label}
              </button>
            ))}
          </nav>
          <div className="uiq-inspector-panel" data-testid="active-panel">
            {state.selectedSubjectId !== null
              ? `Selected: ${state.selectedSubjectId} | Panel: ${state.activePanel}`
              : 'No element selected'}
            {state.isAnalyzing && <span className="uiq-analyzing">Analyzing...</span>}
            {state.lastError !== null && (
              <div className="uiq-error" data-testid="error-message">
                {state.lastError}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
