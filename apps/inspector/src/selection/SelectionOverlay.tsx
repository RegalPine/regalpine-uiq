/**
 * P9：选择覆盖层（AD-12）。
 *
 * 绝对定位 div 显示 rect/margin/padding。
 * pointer-events:none 确保不影响 getBoundingClientRect。
 */
import type { JSX } from 'react';
import type { SerializedRect } from '../selection/IframeProtocol';

export interface SelectionOverlayProps {
  readonly rect: SerializedRect | null;
  readonly iframeOffset: { x: number; y: number };
  readonly label?: string | undefined;
}

/** 计算覆盖层样式（基于 rect + iframe 偏移）。 */
export function computeOverlayStyle(
  rect: SerializedRect | null,
  iframeOffset: { x: number; y: number },
): React.CSSProperties | null {
  if (rect === null) {
    return null;
  }
  return {
    position: 'absolute',
    left: `${rect.x + iframeOffset.x}px`,
    top: `${rect.y + iframeOffset.y}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    pointerEvents: 'none',
    border: '2px solid #4a90d9',
    backgroundColor: 'rgba(74, 144, 217, 0.1)',
    zIndex: 10000,
    boxSizing: 'border-box',
  };
}

/** 选择覆盖层 React 组件。 */
export function SelectionOverlay({
  rect,
  iframeOffset,
  label,
}: SelectionOverlayProps): JSX.Element | null {
  const style = computeOverlayStyle(rect, iframeOffset);
  if (style === null) {
    return null;
  }

  return (
    <div className="uiq-selection-overlay" style={style} data-testid="selection-overlay">
      {label !== undefined && (
        <span
          className="uiq-selection-label"
          style={{
            position: 'absolute',
            top: '-20px',
            left: '0',
            fontSize: '11px',
            backgroundColor: '#4a90d9',
            color: 'white',
            padding: '1px 4px',
            borderRadius: '2px',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
