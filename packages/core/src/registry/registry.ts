import type { MetricDefinition, MetricRegistry, RuleDefinition, RuleRegistry } from '../contracts';

const identifier = '(?:0|[1-9][0-9]*|[0-9]*[A-Za-z-][0-9A-Za-z-]*)';
const versionPattern = new RegExp(
  `^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(?:-${identifier}(?:\\.${identifier})*)?(?:\\+[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?$`,
);

export function assertExactVersion(version: string): void {
  if (typeof version !== 'string' || !versionPattern.test(version)) {
    throw new TypeError('版本必须是精确的 SemVer，不能使用 latest 或版本范围');
  }
}

function key(id: string, version: string): string {
  if (typeof id !== 'string' || id.trim() === '' || id !== id.trim()) {
    throw new TypeError('注册身份不能为空或包含首尾空白');
  }
  assertExactVersion(version);
  return `${id}@${version}`;
}

function immutableCopy<T>(value: T, ancestors = new Set<object>()): T {
  if (value === null || typeof value !== 'object') return value;
  if (ancestors.has(value)) throw new TypeError('注册定义不能包含循环对象');
  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      return Object.freeze(value.map((item: unknown) => immutableCopy(item, ancestors))) as T;
    }
    if (
      Object.getPrototypeOf(value) !== Object.prototype &&
      Object.getPrototypeOf(value) !== null
    ) {
      throw new TypeError('注册定义只接受普通数据对象与显式函数');
    }
    const copy: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
    for (const property of Reflect.ownKeys(value)) {
      if (typeof property !== 'string') throw new TypeError('注册定义不支持 Symbol 属性');
      const descriptor = Object.getOwnPropertyDescriptor(value, property)!;
      if (!('value' in descriptor)) throw new TypeError('注册定义不支持访问器');
      copy[property] = immutableCopy(descriptor.value as unknown, ancestors);
    }
    return Object.freeze(copy) as T;
  } finally {
    ancestors.delete(value);
  }
}

/** 仅管理精确身份，不执行、排序或选择最新版本。 */
export class ExactVersionRegistry<T extends { readonly id: string; readonly version: string }> {
  private readonly entries = new Map<string, T>();

  register(definition: T): void {
    const identity = key(definition.id, definition.version);
    if (this.entries.has(identity)) throw new Error(`重复注册：${identity}`);
    this.entries.set(identity, immutableCopy(definition));
  }

  get(id: string, version: string): T | undefined {
    return this.entries.get(key(id, version));
  }

  has(id: string, version: string): boolean {
    return this.entries.has(key(id, version));
  }

  list(): readonly T[] {
    return Object.freeze([...this.entries.values()]);
  }
}

export class DefaultMetricRegistry
  extends ExactVersionRegistry<MetricDefinition>
  implements MetricRegistry
{
  override register<T>(definition: MetricDefinition<T>): void {
    for (const dependency of definition.dependencies) key(dependency.metricId, dependency.version);
    if (typeof definition.calculate !== 'function') throw new TypeError('Metric 缺少 calculate');
    super.register(definition);
  }
}

export class DefaultRuleRegistry
  extends ExactVersionRegistry<RuleDefinition>
  implements RuleRegistry
{
  override register(definition: RuleDefinition): void {
    key(definition.metricId, definition.metricVersion);
    if (typeof definition.applicability?.evaluate !== 'function') {
      throw new TypeError('Rule 缺少适用性函数');
    }
    super.register(definition);
  }
}
