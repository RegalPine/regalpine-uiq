/**
 * P8：布局基础类型（measurement 层）。
 *
 * 归属依据：布局元素、组、关系的采集投影是跨包共享的输入 DTO，
 * browser 通过 measurement 输出事实，metrics/rules 以本包类型消费。
 *
 * 不创建 @uiq/layout 包（计划 §范围）；布局定义分散在 measurement/metrics/rules/reporting。
 */

/** 布局矩形：坐标可为负（AD-15），尺寸非负。 */
export interface LayoutRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** 四向间距（margin/padding）。 */
export interface BoxSpacing {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

/** 可见性状态（P8-01：不统一排除零尺寸/offscreen）。 */
export type LayoutVisibility =
  | 'VISIBLE'
  | 'DISPLAY_NONE'
  | 'VISIBILITY_HIDDEN'
  | 'ZERO_SIZE'
  | 'OFFSCREEN'
  | 'CLIPPED';

/** 布局元素测量：由 browser 采集或静态导入，不计算评价。 */
export interface LayoutElementMeasurement {
  readonly id: string;
  readonly componentId?: string;
  readonly regionId?: string;
  readonly parentId?: string;
  readonly rect: LayoutRect;
  readonly margin: BoxSpacing;
  readonly padding: BoxSpacing;
  readonly visibility: LayoutVisibility;
}

/** 布局关系类型。 */
export type LayoutRelation = 'HORIZONTAL' | 'VERTICAL' | 'GRID' | 'STACK';

/**
 * 布局组：固定 subjectIds（计划 §P8-01）。
 * 数组顺序保留，不通用排序；只有显式 dialect 转换才从 elementIds 生成。
 */
export interface LayoutGroup {
  readonly id: string;
  readonly subjectIds: readonly string[];
  readonly relation: LayoutRelation;
  readonly referenceId?: string;
}

/** 对齐轴（六种，LAYOUT-08 §5）。 */
export type AlignmentAxis = 'LEFT' | 'RIGHT' | 'TOP' | 'BOTTOM' | 'CENTER_X' | 'CENTER_Y';

/** 根据轴提取坐标（LAYOUT-08 §5 辅助函数）。 */
export function alignmentCoordinate(rect: LayoutRect, axis: AlignmentAxis): number {
  switch (axis) {
    case 'LEFT':
      return rect.x;
    case 'RIGHT':
      return rect.x + rect.width;
    case 'TOP':
      return rect.y;
    case 'BOTTOM':
      return rect.y + rect.height;
    case 'CENTER_X':
      return rect.x + rect.width / 2;
    case 'CENTER_Y':
      return rect.y + rect.height / 2;
  }
}

/** 采集身份记录（P8-01：内容哈希可相同，但必须有新采集记录）。 */
export interface CollectionRecord {
  readonly collectionId: string;
  readonly startedAt: string;
  readonly completedAt: string;
  readonly collectorVersion: string;
  readonly pageId?: string;
  readonly scopeId?: string;
  readonly themeId?: string;
  readonly stateId?: string;
  readonly viewport: { readonly width: number; readonly height: number };
  readonly configHash: string;
}

/** 布局 Schema 版本（计划 §P8-01：布局 1.0.0，扩展交换 1.1.0）。 */
export const LAYOUT_SCHEMA_VERSION = '1.0.0';

/** 布局输入校验错误。 */
export class LayoutInputError extends Error {
  override readonly name = 'LayoutInputError';
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

/** 校验 LayoutRect：坐标有限，尺寸非负（AD-15）。 */
export function assertLayoutRect(rect: LayoutRect): void {
  if (rect === null || typeof rect !== 'object') {
    throw new LayoutInputError('INVALID_RECT', 'LayoutRect 必须是对象');
  }
  for (const key of ['x', 'y', 'width', 'height'] as const) {
    const v = rect[key];
    if (typeof v !== 'number' || !Number.isFinite(v)) {
      throw new LayoutInputError('INVALID_RECT', `LayoutRect.${key} 必须是有限数值`);
    }
  }
  if (rect.width < 0 || rect.height < 0) {
    throw new LayoutInputError('INVALID_RECT', 'LayoutRect 尺寸不得为负值');
  }
}

/** 校验 BoxSpacing：四向有限数值。 */
export function assertBoxSpacing(spacing: BoxSpacing): void {
  if (spacing === null || typeof spacing !== 'object') {
    throw new LayoutInputError('INVALID_SPACING', 'BoxSpacing 必须是对象');
  }
  for (const key of ['top', 'right', 'bottom', 'left'] as const) {
    const v = spacing[key];
    if (typeof v !== 'number' || !Number.isFinite(v)) {
      throw new LayoutInputError('INVALID_SPACING', `BoxSpacing.${key} 必须是有限数值`);
    }
  }
}

/** 校验 LayoutElementMeasurement。 */
export function assertLayoutElement(element: LayoutElementMeasurement): void {
  if (typeof element.id !== 'string' || element.id.trim() === '') {
    throw new LayoutInputError('INVALID_ELEMENT', 'LayoutElementMeasurement 需要非空 id');
  }
  assertLayoutRect(element.rect);
  assertBoxSpacing(element.margin);
  assertBoxSpacing(element.padding);
}

/** 校验 LayoutGroup。 */
export function assertLayoutGroup(group: LayoutGroup): void {
  if (typeof group.id !== 'string' || group.id.trim() === '') {
    throw new LayoutInputError('INVALID_GROUP', 'LayoutGroup 需要非空 id');
  }
  if (!Array.isArray(group.subjectIds) || group.subjectIds.length === 0) {
    throw new LayoutInputError('INVALID_GROUP', 'LayoutGroup 需要非空 subjectIds 数组');
  }
  const validRelations: readonly LayoutRelation[] = ['HORIZONTAL', 'VERTICAL', 'GRID', 'STACK'];
  if (!validRelations.includes(group.relation)) {
    throw new LayoutInputError('INVALID_GROUP', `LayoutGroup 无效关系：${group.relation}`);
  }
  const seen = new Set<string>();
  for (const id of group.subjectIds) {
    if (typeof id !== 'string' || id.trim() === '') {
      throw new LayoutInputError('INVALID_GROUP', 'LayoutGroup subjectIds 成员须为非空字符串');
    }
    if (seen.has(id)) {
      throw new LayoutInputError('DUPLICATE_SUBJECT', `LayoutGroup 重复 subjectId：${id}`);
    }
    seen.add(id);
  }
}
