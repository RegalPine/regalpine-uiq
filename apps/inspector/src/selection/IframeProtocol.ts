/**
 * P9：iframe postMessage 通信协议（IMPL-10 §52）。
 *
 * Inspector ↔ iframe 之间的消息类型定义与序列化。
 * 不依赖特定框架；使用 type-discriminated union。
 */

/** Inspector → iframe 消息。 */
export type InspectorToIframeMessage =
  | { type: 'INSPECTOR_ENABLE_SELECTION' }
  | { type: 'INSPECTOR_DISABLE_SELECTION' }
  | { type: 'INSPECTOR_HIGHLIGHT'; elementId: string }
  | { type: 'INSPECTOR_CLEAR_HIGHLIGHT' };

/** iframe → Inspector 消息。 */
export type IframeToInspectorMessage =
  | { type: 'UIQ_HOVER'; elementId: string; tagName: string; rect: SerializedRect }
  | {
      type: 'UIQ_CLICK';
      elementId: string;
      tagName: string;
      rect: SerializedRect;
      dataUiqId: string | null;
    }
  | { type: 'UIQ_READY' };

export interface SerializedRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

const MESSAGE_PREFIX = 'UIQ_INSPECTOR';

/** 序列化消息（添加前缀防止与其他 postMessage 冲突）。 */
export function serializeMessage<T extends { type: string }>(
  message: T,
): { __uiq: string; payload: T } {
  return { __uiq: MESSAGE_PREFIX, payload: message };
}

/** 反序列化消息（验证前缀）。 */
export function deserializeMessage(
  data: unknown,
): InspectorToIframeMessage | IframeToInspectorMessage | null {
  if (
    typeof data === 'object' &&
    data !== null &&
    '__uiq' in data &&
    (data as { __uiq: unknown }).__uiq === MESSAGE_PREFIX &&
    'payload' in data
  ) {
    return (data as { payload: InspectorToIframeMessage | IframeToInspectorMessage }).payload;
  }
  return null;
}

/** 发送消息到 iframe。 */
export function sendToIframe(iframe: HTMLIFrameElement, message: InspectorToIframeMessage): void {
  if (iframe.contentWindow !== null) {
    iframe.contentWindow.postMessage(serializeMessage(message), '*');
  }
}

/** 检查消息是否来自已知 UIQ Inspector 协议。 */
export function isUiqMessage(data: unknown): boolean {
  return (
    typeof data === 'object' &&
    data !== null &&
    '__uiq' in data &&
    (data as { __uiq: unknown }).__uiq === MESSAGE_PREFIX
  );
}
