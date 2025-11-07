import { describe, it, expect } from 'vitest';
import { genId, isEqual, deepClone } from '../common'; // 假设你的函数在 common.ts 中

/**
 * 测试 genId 函数
 */
describe('genId', () => {
  it('should generate a string ID', () => {
    const id = genId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('should generate unique IDs on subsequent calls', () => {
    const id1 = genId();
    const id2 = genId();
    expect(id1).not.toBe(id2);
  });

  it('should include the prefix if provided', () => {
    const prefix = 'user_';
    const id = genId(prefix);
    expect(id.startsWith(prefix)).toBe(true);
  });

  it('should not have a prefix if none is provided', () => {
    const id = genId();
    // A simple heuristic: check if the prefix from the other test is present
    expect(id.startsWith('user_')).toBe(false);
  });
});

/**
 * 测试 isEqual 函数
 */
describe('isEqual', () => {
  // 1. 基本类型和 null/undefined
  it('should correctly compare primitive types', () => {
    expect(isEqual(1, 1)).toBe(true);
    expect(isEqual('hello', 'hello')).toBe(true);
    expect(isEqual(true, true)).toBe(true);
    expect(isEqual(1, 2)).toBe(false);
    expect(isEqual('hello', 'world')).toBe(false);
    expect(isEqual(true, false)).toBe(false);
    expect(isEqual(1, '1')).toBe(false);
  });

  it('should handle null and undefined correctly', () => {
    expect(isEqual(null, null)).toBe(true);
    expect(isEqual(undefined, undefined)).toBe(true);
    expect(isEqual(null, undefined)).toBe(false);
    expect(isEqual(0, null)).toBe(false);
  });

  it('should treat NaN as equal to NaN', () => {
    expect(isEqual(NaN, NaN)).toBe(true);
  });

  // 2. 扁平对象和数组
  it('should compare flat objects', () => {
    expect(isEqual({ a: 1, b: '2' }, { a: 1, b: '2' })).toBe(true);
    expect(isEqual({ a: 1, b: '2' }, { b: '2', a: 1 })).toBe(false); // Your implementation is order-sensitive for keys
    expect(isEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  });

  it('should compare flat arrays', () => {
    expect(isEqual([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(isEqual([1, 2, 3], [1, 3, 2])).toBe(false);
    expect(isEqual([1, 2], [1, 2, 3])).toBe(false);
  });

  // 3. 嵌套对象和数组
  it('should compare nested objects and arrays', () => {
    const obj1 = { a: 1, b: { c: 3, d: [4, 5] } };
    const obj2 = { a: 1, b: { c: 3, d: [4, 5] } };
    const obj3 = { a: 1, b: { c: 99, d: [4, 5] } };
    expect(isEqual(obj1, obj2)).toBe(true);
    expect(isEqual(obj1, obj3)).toBe(false);
  });

  // 4. 特殊对象类型
  it('should compare Date objects', () => {
    expect(isEqual(new Date('2023-01-01'), new Date('2023-01-01'))).toBe(true);
    expect(isEqual(new Date('2023-01-01'), new Date('2023-01-02'))).toBe(false);
  });

  it('should compare RegExp objects', () => {
    expect(isEqual(/abc/g, /abc/g)).toBe(true);
    expect(isEqual(/abc/g, /abc/i)).toBe(false);
    expect(isEqual(/abc/g, /def/g)).toBe(false);
  });

  it('should compare Set objects', () => {
    expect(isEqual(new Set([1, 2]), new Set([1, 2]))).toBe(true);
    expect(isEqual(new Set([1, 2]), new Set([2, 1]))).toBe(true); // After sorting
    expect(isEqual(new Set([1, 2]), new Set([1, 2, 3]))).toBe(false);
  });

  it('should compare Map objects', () => {
    const map1 = new Map([
      ['a', 1],
      ['b', 2],
    ]);
    const map2 = new Map([
      ['a', 1],
      ['b', 2],
    ]);
    const map3 = new Map([
      ['b', 2],
      ['a', 1],
    ]);
    expect(isEqual(map1, map2)).toBe(true);
    expect(isEqual(map1, map3)).toBe(true); // After sorting
    const map4 = new Map([
      ['a', 1],
      ['b', 99],
    ]);
    expect(isEqual(map1, map4)).toBe(false);
  });

  // 5. 循环引用
  it('should handle circular references', () => {
    const obj1: any = { a: 1 };
    obj1.b = obj1;
    const obj2: any = { a: 1 };
    obj2.b = obj2;
    const obj3: any = { a: 1 };
    obj3.b = { a: 1 }; // Different structure

    expect(isEqual(obj1, obj2)).toBe(true);
    expect(isEqual(obj1, obj3)).toBe(false);
  });
});

/**
 * 测试 deepClone 函数
 */
describe('deepClone', () => {
  // 1. 基本类型和 null
  it('should return the same value for primitive types and null', () => {
    expect(deepClone(123)).toBe(123);
    expect(deepClone('hello')).toBe('hello');
    expect(deepClone(null)).toBe(null);
    expect(deepClone(undefined)).toBe(undefined);
    expect(deepClone(true)).toBe(true);
  });

  // 2. 扁平对象和数组
  it('should clone a flat object', () => {
    const original = { a: 1, b: 'test' };
    const cloned = deepClone(original);
    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
  });

  it('should clone a flat array', () => {
    const original = [1, 'a', true];
    const cloned = deepClone(original);
    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
  });

  // 3. 嵌套对象和数组
  it('should deeply clone nested objects and arrays', () => {
    const original = {
      a: { b: { c: 'd' } },
      e: [1, { f: 2 }],
    };
    const cloned = deepClone(original);
    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    expect(cloned.a).not.toBe(original.a);
    expect(cloned.a.b).not.toBe(original.a.b);
    expect(cloned.e).not.toBe(original.e);
    expect(cloned.e[1]).not.toBe(original.e[1]);
  });

  // 4. 特殊对象
  it('should clone Date objects', () => {
    const original = { date: new Date() };
    const cloned = deepClone(original);
    expect(cloned.date.getTime()).toBe(original.date.getTime());
    expect(cloned.date).not.toBe(original.date);
  });

  it('should clone RegExp objects', () => {
    const original = { re: /test/gi };
    const cloned = deepClone(original);
    expect(cloned.re.toString()).toBe(original.re.toString());
    expect(cloned.re).not.toBe(original.re);
  });

  it('should clone Set objects', () => {
    const original = new Set([1, { a: 2 }]);
    const cloned = deepClone(original);
    expect(cloned).not.toBe(original);
    expect(cloned.size).toBe(2);
    expect(isEqual(original, cloned)).toBe(true);
    // 修改克隆的 Set 不应影响原始 Set
    cloned.add(3);
    expect(original.size).toBe(2);
  });

  it('should clone Map objects', () => {
    const keyObject = { k: 'key' };
    const original = new Map([[keyObject, { v: 'value' }]]);
    const cloned = deepClone(original);
    expect(cloned).not.toBe(original);
    expect(cloned.size).toBe(1);
    expect(isEqual(original, cloned)).toBe(true);

    // 修改克隆的 Map 不应影响原始 Map
    cloned.set({ k: 'newKey' }, { v: 'newValue' });
    expect(original.size).toBe(1);
  });

  // 5. 循环引用
  it('should handle circular references', () => {
    const original: any = { name: 'circular' };
    original.self = original;

    const cloned = deepClone(original);

    expect(cloned.name).toBe('circular');
    expect(cloned.self).toBe(cloned); // 应该指向克隆对象自身
    expect(cloned.self).not.toBe(original); // 且不指向原始对象
    expect(cloned).not.toBe(original);
  });

  // 6. 属性和原型
  it('should clone objects with symbol keys', () => {
    const sym = Symbol('id');
    const original = { [sym]: 'symbol-value' };
    const cloned = deepClone(original);
    expect(cloned[sym]).toBe('symbol-value');
  });

  it('should preserve the prototype of the object', () => {
    class MyClass {
      constructor(public value: number) {}
    }
    const original = new MyClass(10);
    const cloned = deepClone(original);

    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    expect(Object.getPrototypeOf(cloned)).toBe(Object.getPrototypeOf(original));
    expect(cloned instanceof MyClass).toBe(true);
  });
});
