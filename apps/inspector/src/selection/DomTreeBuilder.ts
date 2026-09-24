/**
 * P9：DOM 树构建（IMPL-10 §50）。
 *
 * 从 DOM 节点构建可序列化树结构，用于 ElementTreePanel 显示。
 * 优先显示 data-uiq-id。
 */

export interface TreeNode {
  readonly id: string;
  readonly tagName: string;
  readonly dataUiqId: string | null;
  readonly children: readonly TreeNode[];
  readonly depth: number;
}

/** 从 DOM 元素构建树（跳过 script/style 等非可视元素）。 */
export function buildDomTree(element: Element, depth = 0): TreeNode {
  const dataUiqId = element.getAttribute('data-uiq-id');
  const id = dataUiqId ?? `${element.tagName.toLowerCase()}-${depth}-${getElementIndex(element)}`;

  const children: TreeNode[] = [];
  for (const child of Array.from(element.children)) {
    if (shouldIncludeInTree(child)) {
      children.push(buildDomTree(child, depth + 1));
    }
  }

  return {
    id,
    tagName: element.tagName.toLowerCase(),
    dataUiqId,
    children,
    depth,
  };
}

/** 判断元素是否应在树中显示。 */
function shouldIncludeInTree(element: Element): boolean {
  const tag = element.tagName.toLowerCase();
  // 跳过非可视元素
  if (tag === 'script' || tag === 'style' || tag === 'link' || tag === 'meta') {
    return false;
  }
  // 跳过隐藏元素
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden') {
    return false;
  }
  return true;
}

function getElementIndex(element: Element): number {
  let index = 0;
  let sibling = element.previousElementSibling;
  while (sibling !== null) {
    if (sibling.tagName === element.tagName) {
      index++;
    }
    sibling = sibling.previousElementSibling;
  }
  return index;
}

/** 扁平化树为节点列表（便于搜索/过滤）。 */
export function flattenTree(node: TreeNode): TreeNode[] {
  const result: TreeNode[] = [node];
  for (const child of node.children) {
    result.push(...flattenTree(child));
  }
  return result;
}

/** 在树中按 ID 查找节点。 */
export function findNodeById(tree: TreeNode, id: string): TreeNode | null {
  if (tree.id === id || tree.dataUiqId === id) {
    return tree;
  }
  for (const child of tree.children) {
    const found = findNodeById(child, id);
    if (found !== null) {
      return found;
    }
  }
  return null;
}
