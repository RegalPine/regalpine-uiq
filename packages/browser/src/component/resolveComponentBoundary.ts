/**
 * 组件边界解析 — 从 DOM 中解析 data-uiq-component 属性，构建 ComponentBoundary。
 *
 * 规范基线：UIQ-CROSS-COMPONENT-VISUAL-CONTINUITY §3, §7
 */
import type { ComponentBoundarySnapshot, ComponentRelationSnapshot } from '@uiq/core';

const COMPONENT_ATTRIBUTE = 'data-uiq-component';
const COMPONENT_ID_ATTRIBUTE = 'data-uiq-component-id';
const COMPONENT_RELATION_ATTRIBUTE = 'data-uiq-component-relation';
const UIQ_ID_ATTRIBUTE = 'data-uiq-id';

/**
 * 从页面元素中解析组件边界。
 *
 * 策略：
 * 1. 查找所有带 data-uiq-component 属性的元素
 * 2. 每个组件根元素下的所有 [data-uiq-id] 子元素作为成员
 * 3. 解析 data-uiq-component-relation 获取显式关系
 */
export function resolveComponentBoundaries(
  root: Document | Element = document,
): { boundaries: ComponentBoundarySnapshot[]; relations: ComponentRelationSnapshot[] } {
  const componentRoots = Array.from(root.querySelectorAll(`[${COMPONENT_ATTRIBUTE}]`));

  if (componentRoots.length === 0) {
    return { boundaries: [], relations: [] };
  }

  const boundaries: ComponentBoundarySnapshot[] = [];
  const relations: ComponentRelationSnapshot[] = [];

  for (const componentRoot of componentRoots) {
    const componentId = componentRoot.getAttribute(COMPONENT_ATTRIBUTE)?.trim();
    if (!componentId) continue;

    const instanceId = componentRoot.getAttribute(COMPONENT_ID_ATTRIBUTE)?.trim() ?? undefined;

    // 收集组件内所有带 data-uiq-id 的元素（包括根元素自身）
    const memberElements = Array.from(componentRoot.querySelectorAll(`[${UIQ_ID_ATTRIBUTE}]`));
    const rootId = componentRoot.getAttribute(UIQ_ID_ATTRIBUTE);
    if (rootId && !memberElements.some((el) => el.getAttribute(UIQ_ID_ATTRIBUTE) === rootId)) {
      memberElements.unshift(componentRoot);
    }

    const memberElementIds = memberElements
      .map((el) => el.getAttribute(UIQ_ID_ATTRIBUTE)?.trim())
      .filter((id): id is string => !!id && id.length > 0);

    boundaries.push({
      componentId,
      ...(instanceId !== undefined ? { instanceId } : {}),
      rootElementId: rootId ?? memberElementIds[0] ?? '',
      memberElementIds,
      source: 'EXPLICIT',
    });

    // 解析组件间关系声明
    const relationAttr = componentRoot.getAttribute(COMPONENT_RELATION_ATTRIBUTE);
    if (relationAttr) {
      const parsedRelations = parseRelationAttribute(componentId, relationAttr);
      relations.push(...parsedRelations);
    }
  }

  return { boundaries, relations };
}

/**
 * 解析 data-uiq-component-relation 属性值。
 *
 * 格式：`adjacent:AppMain, shares-token:Card`
 */
function parseRelationAttribute(
  sourceComponent: string,
  attr: string,
): ComponentRelationSnapshot[] {
  const relations: ComponentRelationSnapshot[] = [];
  const parts = attr.split(',').map((s) => s.trim()).filter(Boolean);

  for (const part of parts) {
    const [relationType, targetComponent] = part.split(':').map((s) => s.trim());
    if (!relationType || !targetComponent) continue;

    const relation = mapRelationType(relationType);
    if (relation) {
      relations.push({
        sourceComponent,
        targetComponent,
        relation,
      });
    }
  }

  return relations;
}

function mapRelationType(
  type: string,
): ComponentRelationSnapshot['relation'] | null {
  switch (type.toLowerCase()) {
    case 'adjacent': return 'ADJACENT';
    case 'parent': return 'PARENT_CHILD';
    case 'shares-token': return 'SHARES_TOKEN';
    case 'state': return 'STATE_TRANSITION';
    case 'depends': return 'VISUAL_DEPENDENCY';
    default: return null;
  }
}
