/** 对严格 JSON 数据按 UTF-16 键顺序编码；数组顺序保持不变。 */
export function canonicalJson(input: unknown): string {
  const ancestors = new Set<object>();
  function encode(value: unknown, depth: number): string {
    if (depth > 256) throw new TypeError('JSON 嵌套深度超过 256');
    if (value === null) return 'null';
    if (typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) throw new TypeError('JSON 不支持非有限数值');
      return JSON.stringify(value);
    }
    if (typeof value !== 'object') throw new TypeError('输入不是可序列化 JSON 数据');
    if (ancestors.has(value)) throw new TypeError('JSON 不支持循环引用');
    ancestors.add(value);
    try {
      if (Array.isArray(value)) {
        if (Reflect.ownKeys(value).length !== value.length + 1) {
          throw new TypeError('JSON 数组不支持空洞或额外属性');
        }
        const items: string[] = [];
        for (let i = 0; i < value.length; i++) {
          const descriptor = Object.getOwnPropertyDescriptor(value, String(i));
          if (!descriptor || !('value' in descriptor))
            throw new TypeError('JSON 数组不支持访问器或空洞');
          items.push(encode(descriptor.value as unknown, depth + 1));
        }
        return `[${items.join(',')}]`;
      }
      const prototype: unknown = Object.getPrototypeOf(value);
      if (prototype !== null && prototype !== Object.prototype) {
        throw new TypeError('JSON 只支持普通对象，不支持 Map/Date/类实例');
      }
      const keys = Reflect.ownKeys(value);
      if (keys.some((property) => typeof property !== 'string')) {
        throw new TypeError('JSON 不支持 Symbol 属性');
      }
      return `{${(keys as string[])
        .sort()
        .map((property) => {
          const descriptor = Object.getOwnPropertyDescriptor(value, property)!;
          if (!descriptor.enumerable || !('value' in descriptor)) {
            throw new TypeError('JSON 不支持隐藏属性或访问器');
          }
          return `${JSON.stringify(property)}:${encode(descriptor.value as unknown, depth + 1)}`;
        })
        .join(',')}}`;
    } finally {
      ancestors.delete(value);
    }
  }
  return encode(input, 0);
}
