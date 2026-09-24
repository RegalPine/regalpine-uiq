/**
 * P9：元素树面板（IMPL-10 §50）。
 *
 * 从 TreeNode 渲染可折叠树，优先显示 data-uiq-id。
 */
import { useState, type JSX } from 'react';
import type { TreeNode } from '../selection/DomTreeBuilder';

export interface ElementTreePanelProps {
  readonly tree: TreeNode | null;
  readonly selectedId: string | null;
  readonly onSelect: (id: string) => void;
}

/** 元素树面板。 */
export function ElementTreePanel({
  tree,
  selectedId,
  onSelect,
}: ElementTreePanelProps): JSX.Element {
  if (tree === null) {
    return (
      <div className="uiq-element-tree-panel" data-testid="element-tree-panel">
        <div className="uiq-panel-header">Element Tree</div>
        <div className="uiq-panel-empty">No DOM tree loaded</div>
      </div>
    );
  }

  return (
    <div className="uiq-element-tree-panel" data-testid="element-tree-panel">
      <div className="uiq-panel-header">Element Tree</div>
      <div className="uiq-tree-content">
        <TreeNodeView node={tree} selectedId={selectedId} onSelect={onSelect} />
      </div>
    </div>
  );
}

interface TreeNodeViewProps {
  readonly node: TreeNode;
  readonly selectedId: string | null;
  readonly onSelect: (id: string) => void;
}

function TreeNodeView({ node, selectedId, onSelect }: TreeNodeViewProps): JSX.Element {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const isSelected = node.id === selectedId || node.dataUiqId === selectedId;

  return (
    <div className="uiq-tree-node" style={{ paddingLeft: `${node.depth * 16}px` }}>
      <div
        className={`uiq-tree-node-label ${isSelected ? 'uiq-tree-node-selected' : ''}`}
        onClick={() => onSelect(node.id)}
        data-testid={`tree-node-${node.id}`}
      >
        {hasChildren ? (
          <span
            className="uiq-tree-toggle"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? '▼' : '▶'}
          </span>
        ) : (
          <span className="uiq-tree-toggle-spacer" />
        )}
        <span className="uiq-tree-tag">&lt;{node.tagName}&gt;</span>
        {node.dataUiqId !== null && (
          <span className="uiq-tree-uiq-id" title={node.dataUiqId}>
            [{node.dataUiqId}]
          </span>
        )}
      </div>
      {hasChildren && isExpanded && (
        <div className="uiq-tree-children">
          {node.children.map((child) => (
            <TreeNodeView key={child.id} node={child} selectedId={selectedId} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}
