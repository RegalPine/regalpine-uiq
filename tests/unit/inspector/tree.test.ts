import { describe, expect, it } from 'vitest';
import { flattenTree, findNodeById, type TreeNode } from '@uiq/inspector';

function makeTree(): TreeNode {
  return {
    id: 'root',
    tagName: 'div',
    dataUiqId: 'app',
    depth: 0,
    children: [
      {
        id: 'header',
        tagName: 'header',
        dataUiqId: 'main-header',
        depth: 1,
        children: [
          {
            id: 'title',
            tagName: 'h1',
            dataUiqId: null,
            depth: 2,
            children: [],
          },
        ],
      },
      {
        id: 'main',
        tagName: 'main',
        dataUiqId: null,
        depth: 1,
        children: [
          {
            id: 'btn-1',
            tagName: 'button',
            dataUiqId: 'primary-button',
            depth: 2,
            children: [],
          },
        ],
      },
    ],
  };
}

describe('P9: DomTreeBuilder — 树操作', () => {
  it('flattenTree returns all nodes', () => {
    const tree = makeTree();
    const flat = flattenTree(tree);
    expect(flat).toHaveLength(5);
  });

  it('findNodeById finds by id', () => {
    const tree = makeTree();
    const node = findNodeById(tree, 'btn-1');
    expect(node).not.toBeNull();
    expect(node!.tagName).toBe('button');
  });

  it('findNodeById finds by dataUiqId', () => {
    const tree = makeTree();
    const node = findNodeById(tree, 'primary-button');
    expect(node).not.toBeNull();
    expect(node!.id).toBe('btn-1');
  });

  it('findNodeById returns null for missing id', () => {
    const tree = makeTree();
    expect(findNodeById(tree, 'nonexistent')).toBeNull();
  });

  it('tree preserves depth information', () => {
    const tree = makeTree();
    expect(tree.depth).toBe(0);
    expect(tree.children[0]!.depth).toBe(1);
    expect(tree.children[0]!.children[0]!.depth).toBe(2);
  });

  it('tree preserves dataUiqId', () => {
    const tree = makeTree();
    expect(tree.dataUiqId).toBe('app');
    expect(tree.children[1]!.dataUiqId).toBeNull();
  });
});
