import { describe, expect, it } from 'vitest';
import { selectorReducer, INITIAL_SELECTOR_STATE, type ElementSelection } from '@uiq/inspector';

function makeSelection(id: string): ElementSelection {
  return {
    elementId: id,
    dataUiqId: id.startsWith('uiq-') ? id : null,
    tagName: 'div',
    rect: {
      x: 0,
      y: 0,
      width: 100,
      height: 50,
      top: 0,
      right: 100,
      bottom: 50,
      left: 0,
      toJSON: () => ({}),
    },
    lockedAt: Date.now(),
  };
}

describe('P9: SelectorReducer — hover/lock/clear', () => {
  it('initial state has no selection', () => {
    expect(INITIAL_SELECTOR_STATE.hoveredId).toBeNull();
    expect(INITIAL_SELECTOR_STATE.selected).toBeNull();
    expect(INITIAL_SELECTOR_STATE.isSelecting).toBe(false);
  });

  it('HOVER sets hoveredId', () => {
    const state = selectorReducer(INITIAL_SELECTOR_STATE, { type: 'HOVER', elementId: 'btn-1' });
    expect(state.hoveredId).toBe('btn-1');
  });

  it('HOVER_CLEAR clears hoveredId', () => {
    const hovered = selectorReducer(INITIAL_SELECTOR_STATE, { type: 'HOVER', elementId: 'btn-1' });
    const cleared = selectorReducer(hovered, { type: 'HOVER_CLEAR' });
    expect(cleared.hoveredId).toBeNull();
  });

  it('LOCK sets selected and clears hover', () => {
    const hovered = selectorReducer(INITIAL_SELECTOR_STATE, { type: 'HOVER', elementId: 'btn-1' });
    const locked = selectorReducer(hovered, { type: 'LOCK', selection: makeSelection('btn-1') });
    expect(locked.selected).not.toBeNull();
    expect(locked.selected!.elementId).toBe('btn-1');
    expect(locked.hoveredId).toBeNull();
  });

  it('CLEAR resets selection and hover', () => {
    const locked = selectorReducer(INITIAL_SELECTOR_STATE, {
      type: 'LOCK',
      selection: makeSelection('btn-1'),
    });
    const cleared = selectorReducer(locked, { type: 'CLEAR' });
    expect(cleared.selected).toBeNull();
    expect(cleared.hoveredId).toBeNull();
  });

  it('SET_SELECTING toggles isSelecting', () => {
    const state = selectorReducer(INITIAL_SELECTOR_STATE, {
      type: 'SET_SELECTING',
      isSelecting: true,
    });
    expect(state.isSelecting).toBe(true);
    const off = selectorReducer(state, { type: 'SET_SELECTING', isSelecting: false });
    expect(off.isSelecting).toBe(false);
  });

  it('fast target switch: new LOCK replaces old immediately', () => {
    let state = selectorReducer(INITIAL_SELECTOR_STATE, {
      type: 'LOCK',
      selection: makeSelection('old'),
    });
    state = selectorReducer(state, { type: 'LOCK', selection: makeSelection('new') });
    expect(state.selected!.elementId).toBe('new');
  });
});
