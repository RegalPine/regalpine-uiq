import { describe, expect, it } from 'vitest';
import { serializeMessage, deserializeMessage, isUiqMessage } from '@uiq/inspector';

describe('P9: IframeProtocol — postMessage 序列化', () => {
  it('serializeMessage adds __uiq prefix', () => {
    const msg = serializeMessage({ type: 'INSPECTOR_ENABLE_SELECTION' });
    expect(msg.__uiq).toBe('UIQ_INSPECTOR');
    expect(msg.payload.type).toBe('INSPECTOR_ENABLE_SELECTION');
  });

  it('deserializeMessage recovers original message', () => {
    const serialized = serializeMessage({ type: 'INSPECTOR_HIGHLIGHT', elementId: 'btn-1' });
    const recovered = deserializeMessage(serialized);
    expect(recovered).not.toBeNull();
    expect(recovered!.type).toBe('INSPECTOR_HIGHLIGHT');
    if (recovered!.type === 'INSPECTOR_HIGHLIGHT') {
      expect(recovered!.elementId).toBe('btn-1');
    }
  });

  it('deserializeMessage returns null for non-UIQ messages', () => {
    expect(deserializeMessage({ type: 'SOME_OTHER_MESSAGE' })).toBeNull();
    expect(deserializeMessage('string')).toBeNull();
    expect(deserializeMessage(null)).toBeNull();
    expect(deserializeMessage(42)).toBeNull();
  });

  it('deserializeMessage returns null for tampered prefix', () => {
    expect(deserializeMessage({ __uiq: 'WRONG', payload: { type: 'X' } })).toBeNull();
  });

  it('isUiqMessage correctly identifies UIQ messages', () => {
    const msg = serializeMessage({ type: 'INSPECTOR_ENABLE_SELECTION' });
    expect(isUiqMessage(msg)).toBe(true);
    expect(isUiqMessage({ type: 'OTHER' })).toBe(false);
    expect(isUiqMessage(null)).toBe(false);
  });

  it('round-trip preserves iframe→inspector messages', () => {
    const clickMsg = {
      type: 'UIQ_CLICK' as const,
      elementId: 'btn-1',
      tagName: 'button',
      rect: { x: 10, y: 20, width: 100, height: 40 },
      dataUiqId: 'primary-button',
    };
    const serialized = serializeMessage(clickMsg);
    const recovered = deserializeMessage(serialized);
    expect(recovered).toEqual(clickMsg);
  });
});
