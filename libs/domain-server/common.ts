// import { nanoid } from 'nanoid';

export function genId(prefix = ''): string {
  // return nanoid();
  const ts = Date.now().toString(36);
  const rd = Math.random().toString(36).substring(2, 10);
  return `${prefix}${ts}${rd}`;
}

export function isEqual(a: any, b: any, cache = new WeakMap<object, object>()): boolean {
  // 1. 严格相等或都是 NaN
  // NaN === NaN 是 false，但我们通常认为两个 NaN 是相等的
  if (a === b) return true;
  if (Number.isNaN(a) && Number.isNaN(b)) return true;

  // 2. 如果 a 或 b 不是对象（或为 null），则它们不相等（因为上一步 a === b 已判断过）
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
    return false;
  }

  // 3. 检查缓存，避免循环引用
  // 如果 a 已经在缓存中，检查 b 是否是 a 对应的缓存值
  if (cache.has(a) && cache.get(a) === b) {
    return true;
  }
  // 将 a 和 b 存入缓存
  cache.set(a, b);
  // 同样地，反向缓存
  cache.set(b, a);

  // 4. 特殊对象类型比较
  // Date 对象比较时间戳
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }
  // RegExp 对象比较字符串表示
  if (a instanceof RegExp && b instanceof RegExp) {
    return a.toString() === b.toString();
  }

  // 5. 数组比较
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!isEqual(a[i], b[i], cache)) return false;
    }
    return true;
  }

  // 6. Set 比较
  if (a instanceof Set && b instanceof Set) {
    if (a.size !== b.size) return false;
    // 将 Set 转换为数组进行比较，注意这可能不适用于包含复杂对象的 Set
    // 更稳妥的方式是遍历其中一个 Set，检查所有元素是否存在于另一个 Set 中
    const aValues = Array.from(a);
    const bValues = Array.from(b);
    return isEqual(aValues.sort(), bValues.sort(), cache); // 排序后比较
  }

  // 7. Map 比较
  if (a instanceof Map && b instanceof Map) {
    if (a.size !== b.size) return false;
    const aEntries = Array.from(a.entries());
    const bEntries = Array.from(b.entries());
    return isEqual(aEntries.sort(), bEntries.sort(), cache); // 排序后比较
  }

  // 8. 检查原型是否相同
  if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) {
    return false;
  }

  // 9. 通用对象属性比较
  const keysA = Reflect.ownKeys(a);
  const keysB = Reflect.ownKeys(b);

  if (keysA.length !== keysB.length) return false;

  // 检查键名是否完全一致
  for (let i = 0; i < keysA.length; i++) {
    if (keysA[i] !== keysB[i]) return false;
  }

  // 递归比较所有属性值
  for (const key of keysA) {
    if (!isEqual((a as any)[key], (b as any)[key], cache)) {
      return false;
    }
  }

  // 如果所有检查都通过，则认为对象相等
  return true;
}

export function deepClone<T>(target: T, hash = new WeakMap<object, any>()): T {
  // 基本类型、null 和函数直接返回
  if (target === null || typeof target !== 'object') {
    return target;
  }

  // 处理 Date 对象
  if (target instanceof Date) {
    return new Date(target.getTime()) as any;
  }

  // 处理 RegExp 对象
  if (target instanceof RegExp) {
    return new RegExp(target) as any;
  }

  // 检查缓存，防止循环引用
  if (hash.has(target)) {
    return hash.get(target);
  }

  // 处理 Set
  if (target instanceof Set) {
    const cloneSet = new Set<any>();
    hash.set(target, cloneSet); // 缓存 Set
    target.forEach((value) => {
      cloneSet.add(deepClone(value, hash));
    });
    return cloneSet as any;
  }

  // 处理 Map
  if (target instanceof Map) {
    const cloneMap = new Map<any, any>();
    hash.set(target, cloneMap); // 缓存 Map
    target.forEach((value, key) => {
      cloneMap.set(deepClone(key, hash), deepClone(value, hash));
    });
    return cloneMap as any;
  }

  // 创建一个新的容器（对象或数组）
  // 使用 Object.getPrototypeOf 获取原型，以支持更广泛的对象类型
  const cloneTarget: T = Array.isArray(target)
    ? ([] as T)
    : (Object.create(Object.getPrototypeOf(target)) as T);

  // 将新创建的克隆对象放入缓存
  hash.set(target, cloneTarget);

  // 递归拷贝对象的属性（包括 Symbol 属性）
  // 使用 Reflect.ownKeys 可以获取所有类型的键名
  for (const key of Reflect.ownKeys(target)) {
    // 使用类型断言来处理索引签名
    (cloneTarget as any)[key] = deepClone((target as any)[key], hash);
  }

  return cloneTarget;
}
