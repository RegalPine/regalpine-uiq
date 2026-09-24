/**
 * IMPL-07 §13：DOM 路径只作为辅助定位信息存入 metadata，
 * 不得作为 EntityId（DOM 结构变化会导致路径不稳定）。
 */
export function computeDomPath(element: Element): string {
  const segments: string[] = [];
  let node: Element | null = element;
  while (node !== null) {
    const parent: Element | null = node.parentElement;
    let index = 1;
    if (parent !== null) {
      const siblings = Array.from(parent.children);
      index = siblings.indexOf(node) + 1;
    }
    segments.unshift(`${node.tagName.toLowerCase()}[${index}]`);
    node = parent;
  }
  return `/${segments.join('/')}`;
}
