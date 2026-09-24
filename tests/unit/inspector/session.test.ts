import { describe, expect, it } from 'vitest';
import { createInspectorSessionManager } from '@uiq/inspector';

describe('P9: InspectorSession — AD-20 会话隔离', () => {
  it('starts with null current', () => {
    const mgr = createInspectorSessionManager();
    expect(mgr.current).toBeNull();
  });

  it('startSession returns handle with incrementing sequence', () => {
    const mgr = createInspectorSessionManager();
    const s1 = mgr.startSession();
    const s2 = mgr.startSession();
    expect(s1.requestSequence).toBe(1);
    expect(s2.requestSequence).toBe(2);
  });

  it('startSession cancels previous session', () => {
    const mgr = createInspectorSessionManager();
    const s1 = mgr.startSession();
    expect(s1.isCancelled).toBe(false);
    mgr.startSession();
    expect(s1.isCancelled).toBe(true);
    expect(s1.signal.aborted).toBe(true);
  });

  it('cancelCurrent aborts signal and marks cancelled', () => {
    const mgr = createInspectorSessionManager();
    const s = mgr.startSession();
    mgr.cancelCurrent();
    expect(s.isCancelled).toBe(true);
    expect(s.signal.aborted).toBe(true);
  });

  it('isCurrent returns true only for the latest sequence', () => {
    const mgr = createInspectorSessionManager();
    const s1 = mgr.startSession();
    expect(mgr.isCurrent(s1.requestSequence)).toBe(true);
    mgr.startSession();
    expect(mgr.isCurrent(s1.requestSequence)).toBe(false);
    expect(mgr.isCurrent(2)).toBe(true);
  });

  it('each session has unique sessionId', () => {
    const mgr = createInspectorSessionManager();
    const ids = new Set<string>();
    for (let i = 0; i < 10; i += 1) {
      ids.add(mgr.startSession().sessionId);
    }
    expect(ids.size).toBe(10);
  });

  it('old async result cannot overwrite new target (anti-case)', () => {
    const mgr = createInspectorSessionManager();
    const oldSession = mgr.startSession();
    const newSession = mgr.startSession();
    // Simulate old async result arriving
    expect(mgr.isCurrent(oldSession.requestSequence)).toBe(false);
    expect(mgr.isCurrent(newSession.requestSequence)).toBe(true);
  });

  it('cancel then isCurrent returns false', () => {
    const mgr = createInspectorSessionManager();
    const s = mgr.startSession();
    mgr.cancelCurrent();
    expect(mgr.isCurrent(s.requestSequence)).toBe(false);
  });
});
