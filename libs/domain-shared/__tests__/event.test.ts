import { describe, expect, it, beforeEach } from 'vitest';
import { createLocalEvent, createSharedEvent } from '..';

describe('domain-shared/event', () => {
  describe('createLocalEvent', () => {
    it('should create a local event with listeners set', () => {
      const event = createLocalEvent<string>();
      expect(event.listeners).toBeInstanceOf(Set);
      expect(event.listeners.size).toBe(0);
    });

    it('should notify all listeners when publishing', () => {
      const event = createLocalEvent<string>();
      const results: string[] = [];

      event.api.listen((data) => {
        results.push(data);
      });

      event.api.listen((data) => {
        results.push(data + '-2');
      });

      event.publish('test');

      expect(results).toEqual(['test', 'test-2']);
    });

    it('should return unsubscribe function that removes listener', () => {
      const event = createLocalEvent<string>();
      const results: string[] = [];

      const unsubscribe = event.api.listen((data) => {
        results.push(data);
      });

      event.publish('test1');
      expect(results).toEqual(['test1']);

      unsubscribe();
      event.publish('test2');
      expect(results).toEqual(['test1']); // 不应该有 test2
    });

    it('should handle multiple unsubscribe calls safely', () => {
      const event = createLocalEvent<string>();
      const results: string[] = [];

      const unsubscribe = event.api.listen((data) => {
        results.push(data);
      });

      unsubscribe();
      unsubscribe(); // 第二次调用应该不会出错

      event.publish('test');
      expect(results).toEqual([]);
    });

    it('should handle no listeners gracefully', () => {
      const event = createLocalEvent<string>();
      expect(() => event.publish('test')).not.toThrow();
    });

    it('should not add duplicate listeners (Set behavior)', () => {
      const event = createLocalEvent<string>();
      const results: string[] = [];
      const listener = (data: string) => results.push(data);

      event.api.listen(listener);
      event.api.listen(listener);
      event.api.listen(listener);

      event.publish('test');

      // Set doesn't allow duplicates, so listener only called once
      expect(results).toEqual(['test']);
    });

    it('should remove listener when unsubscribing', () => {
      const event = createLocalEvent<string>();
      const results: string[] = [];
      const listener = (data: string) => results.push(data);

      const unsubscribe = event.api.listen(listener);

      event.publish('test1');
      expect(results).toEqual(['test1']);

      unsubscribe();
      event.publish('test2');
      expect(results).toEqual(['test1']); // test2 should not be added
    });
  });

  describe('createSharedEvent', () => {
    it('should create a shared event with listeners set', () => {
      const event = createSharedEvent<string>();
      expect(event.listeners).toBeInstanceOf(Set);
      expect(event.listeners.size).toBe(0);
      expect(event.__internal__).toBeDefined();
    });

    it('should notify local listeners when broadcast function is not set', () => {
      const event = createSharedEvent<string>();
      const results: string[] = [];

      event.api.listen((data) => {
        results.push(data);
      });

      event.publish('test');

      expect(results).toEqual(['test']);
    });

    it('should call broadcast function when set', () => {
      const event = createSharedEvent<string>();
      let broadcastedData: string | null = null;

      event.__internal__.setBroadcastFunction((data: string) => {
        broadcastedData = data;
      });

      event.publish('test-data');

      expect(broadcastedData).toBe('test-data');
    });

    it('should notify both local listeners and broadcast function', () => {
      const event = createSharedEvent<number>();
      const localResults: number[] = [];
      let broadcastedData: number | null = null;

      event.api.listen((data) => {
        localResults.push(data);
      });

      event.__internal__.setBroadcastFunction((data: number) => {
        broadcastedData = data;
      });

      event.publish(42);

      expect(localResults).toEqual([42]);
      expect(broadcastedData).toBe(42);
    });

    it('should not call broadcast function when it is null', () => {
      const event = createSharedEvent<string>();
      const results: string[] = [];

      event.api.listen((data) => {
        results.push(data);
      });

      // broadcastFn is null by default
      event.publish('test');

      expect(results).toEqual(['test']);
    });

    it('should return unsubscribe function that removes listener', () => {
      const event = createSharedEvent<string>();
      const results: string[] = [];

      const unsubscribe = event.api.listen((data) => {
        results.push(data);
      });

      event.publish('test1');
      expect(results).toEqual(['test1']);

      unsubscribe();
      event.publish('test2');
      expect(results).toEqual(['test1']);
    });

    it('should update broadcast function when set multiple times', () => {
      const event = createSharedEvent<string>();
      let broadcastCount = 0;

      event.__internal__.setBroadcastFunction((data: string) => {
        broadcastCount++;
      });

      event.publish('test1');
      expect(broadcastCount).toBe(1);

      event.__internal__.setBroadcastFunction((data: string) => {
        broadcastCount++;
      });

      event.publish('test2');
      expect(broadcastCount).toBe(2);
    });

    it('should handle complex data types', () => {
      const event = createSharedEvent<{ id: string; nested: { value: number } }>();
      const results: any[] = [];

      event.api.listen((data) => {
        results.push(data);
      });

      const complexData = {
        id: 'test-id',
        nested: { value: 123 },
      };

      event.publish(complexData);

      expect(results).toEqual([complexData]);
      expect(results[0].nested.value).toBe(123);
    });
  });
});
