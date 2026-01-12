import { describe, expect, it, beforeEach } from 'vitest';
import { ref } from 'vue';
import { createSharedSingletonAgg, createSharedMultiInstanceAgg, createSharedEvent, createLocalEvent } from '..';

describe('shared-domain', () => {
  beforeEach(() => {
    // 清理所有 BroadcastChannel
    const channels = (globalThis as any).__broadcastChannels__ || [];
    channels.forEach((ch: BroadcastChannel) => ch.close());
    (globalThis as any).__broadcastChannels__ = [];
  });

  describe('createSharedSingletonAgg', () => {
    it('should create a singleton aggregation with shared state', async () => {
      const agg1 = createSharedSingletonAgg('test-singleton', () => {
        const count = ref(0);
        const name = ref('Init');
        return {
          states: {
            count,
            name,
          },
          commands: {
            increment(delta: number = 1) {
              count.value += delta;
            },
            setName(n: string) {
              name.value = n;
            },
          },
          events: {},
        };
      });

      await agg1.untilInitialized();

      // 创建第二个聚合实例，应该同步状态
      const agg2 = createSharedSingletonAgg('test-singleton', () => {
        const count = ref(0);
        const name = ref('');
        return {
          states: {
            count,
            name,
          },
          commands: {
            increment(delta: number = 1) {
              count.value += delta;
            },
            setName(n: string) {
              name.value = n;
            },
          },
          events: {},
        };
      });

      await agg2.untilInitialized();
      await new Promise((resolve) => setTimeout(resolve, 50));

      // 状态应该同步
      expect(agg2.api.states.name.value).toBe('Init');

      // 通过 agg1 执行命令
      agg1.api.commands.increment(5);
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(agg1.api.states.count.value).toBe(5);
      expect(agg2.api.states.count.value).toBe(5);

      // 通过 agg2 执行命令
      agg2.api.commands.setName('Andy');
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(agg1.api.states.name.value).toBe('Andy');
      expect(agg2.api.states.name.value).toBe('Andy');

      // 通过命令再次修改，验证双向同步
      agg1.api.commands.increment(95);
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(agg1.api.states.count.value).toBe(100);
      expect(agg2.api.states.count.value).toBe(100);
    });

    it('should support async commands', async () => {
      const agg1 = createSharedSingletonAgg('test-async', () => {
        const status = ref<'idle' | 'loading' | 'done'>('idle');
        const data = ref<string[]>([]);
        return {
          states: {
            status,
            data,
          },
          commands: {
            async fetchData() {
              status.value = 'loading';
              await new Promise((resolve) => setTimeout(resolve, 10));
              data.value = ['item1', 'item2'];
              status.value = 'done';
            },
          },
          events: {},
        };
      });

      await agg1.untilInitialized();

      const agg2 = createSharedSingletonAgg('test-async', () => {
        const status = ref<'idle' | 'loading' | 'done'>('idle');
        const data = ref<string[]>([]);
        return {
          states: {
            status,
            data,
          },
          commands: {
            async fetchData() {
              status.value = 'loading';
              await new Promise((resolve) => setTimeout(resolve, 10));
              data.value = ['item1', 'item2'];
              status.value = 'done';
            },
          },
          events: {},
        };
      });

      await agg2.untilInitialized();
      await new Promise((resolve) => setTimeout(resolve, 30));

      await agg1.api.commands.fetchData();
      await new Promise((resolve) => setTimeout(resolve, 30));

      expect(agg1.api.states.status.value).toBe('done');
      expect(agg2.api.states.status.value).toBe('done');
      expect(agg2.api.states.data.value).toEqual(['item1', 'item2']);
    });

    it('should have isInitialized and untilInitialized', async () => {
      let initHookCalled = false;

      const agg = createSharedSingletonAgg('test-lifecycle', ({ onBeforeInitialize }) => {
        const value = ref(0);
        onBeforeInitialize(async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          initHookCalled = true;
        });

        return {
          states: {
            value,
          },
          commands: {
            increment() {
              value.value++;
            },
          },
          events: {},
        };
      });

      expect(agg.isInitialized.value).toBe(false);
      await agg.untilInitialized();
      expect(agg.isInitialized.value).toBe(true);
      expect(initHookCalled).toBe(true);
    });
  });

  describe('createSharedMultiInstanceAgg', () => {
    it('should create multi-instance aggregation with unique IDs', async () => {
      const agg1 = createSharedMultiInstanceAgg('user-1', 'test-multi', () => {
        const score = ref(0);
        const username = ref('Player1');
        return {
          states: {
            score,
            username,
          },
          commands: {
            addScore(points: number) {
              score.value += points;
            },
            setName(name: string) {
              username.value = name;
            },
            setUsername(name: string) {
              username.value = name;
            },
          },
          events: {},
        };
      });

      await agg1.untilInitialized();

      const agg2 = createSharedMultiInstanceAgg('user-2', 'test-multi', () => {
        const score = ref(0);
        const username = ref('Player2');
        return {
          states: {
            score,
            username,
          },
          commands: {
            addScore(points: number) {
              score.value += points;
            },
            setName(name: string) {
              username.value = name;
            },
          },
          events: {},
        };
      });

      await agg2.untilInitialized();
      await new Promise((resolve) => setTimeout(resolve, 30));

      // 每个 ID 应该有独立的状态
      expect(agg1.id).toBe('user-1');
      expect(agg2.id).toBe('user-2');

      // 状态应该在相同 ID 的实例间同步
      agg1.api.commands.addScore(100);
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(agg1.api.states.score.value).toBe(100);
      expect(agg2.api.states.score.value).not.toBe(100);

      // 创建另一个与 agg1 相同 ID 的实例
      const agg1Clone = createSharedMultiInstanceAgg('user-1', 'test-multi', () => {
        const score = ref(0);
        const username = ref('');
        return {
          states: {
            score,
            username,
          },
          commands: {
            addScore(points: number) {
              score.value += points;
            },
            setName(name: string) {
              username.value = name;
            },
            setUsername(name: string) {
              username.value = name;
            },
          },
          events: {},
        };
      });

      await agg1Clone.untilInitialized();
      await new Promise((resolve) => setTimeout(resolve, 30));

      expect(agg1Clone.api.states.score.value).toBe(100);
      expect(agg1Clone.api.states.username.value).toBe('Player1');
    });

    it('should support destroy functionality', async () => {
      const agg1 = createSharedMultiInstanceAgg('item-1', 'test-destroy', () => {
        const active = ref(true);
        return {
          states: {
            active,
          },
          commands: {
            toggle() {
              active.value = !active.value;
            },
          },
          events: {},
        };
      });

      await agg1.untilInitialized();

      const agg2 = createSharedMultiInstanceAgg('item-1', 'test-destroy', () => {
        const active = ref(true);
        return {
          states: {
            active,
          },
          commands: {
            toggle() {
              active.value = !active.value;
            },
          },
          events: {},
        };
      });

      await agg2.untilInitialized();
      await new Promise((resolve) => setTimeout(resolve, 30));

      // 调用 destroy
      expect(() => agg1.api.destroy()).not.toThrow();
    });
  });

  describe('integration tests', () => {
    it('should handle multiple aggregations with different channel names', async () => {
      const cartAgg = createSharedSingletonAgg('cart', () => {
        const items = ref<string[]>([]);
        const total = ref(0);
        return {
          states: {
            items,
            total,
          },
          commands: {
            addItem(item: string) {
              items.value.push(item);
              total.value++;
            },
          },
          events: {},
        };
      });

      const userAgg = createSharedSingletonAgg('user', () => {
        const name = ref('Guest');
        const loggedIn = ref(false);
        return {
          states: {
            name,
            loggedIn,
          },
          commands: {
            login(n: string) {
              name.value = n;
              loggedIn.value = true;
            },
          },
          events: {},
        };
      });

      await Promise.all([cartAgg.untilInitialized(), userAgg.untilInitialized()]);

      // 创建第二个标签的实例
      const cartAgg2 = createSharedSingletonAgg('cart', () => {
        const items = ref<string[]>([]);
        const total = ref(0);
        return {
          states: {
            items,
            total,
          },
          commands: {
            addItem(item: string) {
              items.value.push(item);
              total.value++;
            },
          },
          events: {},
        };
      });

      const userAgg2 = createSharedSingletonAgg('user', () => {
        const name = ref('Guest');
        const loggedIn = ref(false);
        return {
          states: {
            name,
            loggedIn,
          },
          commands: {
            login(n: string) {
              name.value = n;
              loggedIn.value = true;
            },
          },
          events: {},
        };
      });

      await Promise.all([cartAgg2.untilInitialized(), userAgg2.untilInitialized()]);
      await new Promise((resolve) => setTimeout(resolve, 30));

      // 操作 cart
      cartAgg.api.commands.addItem('Apple');
      cartAgg.api.commands.addItem('Banana');
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(cartAgg2.api.states.total.value).toBe(2);

      // 操作 user
      userAgg.api.commands.login('Alice');
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(userAgg2.api.states.name.value).toBe('Alice');
      expect(userAgg2.api.states.loggedIn.value).toBe(true);

      // cart 不应受 user 影响
      expect(cartAgg.api.states.total.value).toBe(2);
    });
  });

  describe('cross-tab events', () => {
    it('should broadcast events across tabs in singleton aggregation', async () => {
      const agg1 = createSharedSingletonAgg('test-events', () => {
        const count = ref(0);
        const countChangedEvent = createSharedEvent<{ newValue: number }>();
        return {
          states: { count },
          commands: {
            increment() {
              count.value++;
              countChangedEvent.publish({ newValue: count.value });
            },
          },
          events: {
            countChanged: countChangedEvent.api,
          },
        };
      });

      await agg1.untilInitialized();

      let agg1Received = 0;
      agg1.api.events.countChanged.listen(({ newValue }) => {
        agg1Received = newValue;
      });

      // 创建第二个聚合实例
      const agg2 = createSharedSingletonAgg('test-events', () => {
        const count = ref(0);
        const countChangedEvent = createSharedEvent<{ newValue: number }>();
        return {
          states: { count },
          commands: {
            increment() {
              count.value++;
              countChangedEvent.publish({ newValue: count.value });
            },
          },
          events: {
            countChanged: countChangedEvent.api,
          },
        };
      });

      await agg2.untilInitialized();

      let agg2Received = 0;
      agg2.api.events.countChanged.listen(({ newValue }) => {
        agg2Received = newValue;
      });

      await new Promise((resolve) => setTimeout(resolve, 30));

      // 通过 agg1 触发事件
      agg1.api.commands.increment();
      await new Promise((resolve) => setTimeout(resolve, 30));

      expect(agg1Received).toBe(1);
      expect(agg2Received).toBe(1);

      // 通过 agg2 触发事件
      agg2.api.commands.increment();
      await new Promise((resolve) => setTimeout(resolve, 30));

      expect(agg1Received).toBe(2);
      expect(agg2Received).toBe(2);
    });

    it('should broadcast events across tabs with different IDs in multi-instance aggregation', async () => {
      const agg1 = createSharedMultiInstanceAgg('user-1', 'test-events-multi', () => {
        const score = ref(0);
        const scoreChangedEvent = createSharedEvent<{ score: number }>();
        return {
          states: { score },
          commands: {
            addScore(points: number) {
              score.value += points;
              scoreChangedEvent.publish({ score: score.value });
            },
          },
          events: {
            scoreChanged: scoreChangedEvent.api,
          },
        };
      });

      await agg1.untilInitialized();

      let agg1Received = 0;
      agg1.api.events.scoreChanged.listen(({ score }) => {
        agg1Received = score;
      });

      const agg2 = createSharedMultiInstanceAgg('user-2', 'test-events-multi', () => {
        const score = ref(0);
        const scoreChangedEvent = createSharedEvent<{ score: number }>();
        return {
          states: { score },
          commands: {
            addScore(points: number) {
              score.value += points;
              scoreChangedEvent.publish({ score: score.value });
            },
          },
          events: {
            scoreChanged: scoreChangedEvent.api,
          },
        };
      });

      await agg2.untilInitialized();

      let agg2Received = 0;
      agg2.api.events.scoreChanged.listen(({ score }) => {
        agg2Received = score;
      });

      await new Promise((resolve) => setTimeout(resolve, 30));

      // 通过 agg1 触发事件
      agg1.api.commands.addScore(100);
      await new Promise((resolve) => setTimeout(resolve, 30));

      expect(agg1Received).toBe(100);
      expect(agg2Received).not.toBe(100); // 不同 ID，不应收到

      // 创建与 agg1 相同 ID 的克隆
      const agg1Clone = createSharedMultiInstanceAgg('user-1', 'test-events-multi', () => {
        const score = ref(0);
        const scoreChangedEvent = createSharedEvent<{ score: number }>();
        return {
          states: { score },
          commands: {
            addScore(points: number) {
              score.value += points;
              scoreChangedEvent.publish({ score: score.value });
            },
          },
          events: {
            scoreChanged: scoreChangedEvent.api,
          },
        };
      });

      await agg1Clone.untilInitialized();

      let agg1CloneReceived = 0;
      agg1Clone.api.events.scoreChanged.listen(({ score }) => {
        agg1CloneReceived = score;
      });

      await new Promise((resolve) => setTimeout(resolve, 30));

      // 再次通过 agg1 触发事件
      agg1.api.commands.addScore(50);
      await new Promise((resolve) => setTimeout(resolve, 30));

      expect(agg1Received).toBe(150);
      expect(agg1CloneReceived).toBe(150); // 相同 ID，应该收到
      expect(agg2Received).not.toBe(150); // 不同 ID，不应收到
    });

    it('should support complex event data with nested objects', async () => {
      const agg1 = createSharedSingletonAgg('test-complex-events', () => {
        const user = ref<{ id: string; name: string; profile: { age: number } } | null>(null);
        const userUpdatedEvent = createSharedEvent<{
          user: { id: string; name: string; profile: { age: number } } | null;
          timestamp: number;
        }>();
        return {
          states: { user },
          commands: {
            updateUser(id: string, name: string, age: number) {
              user.value = { id, name, profile: { age } };
              userUpdatedEvent.publish({ user: user.value, timestamp: Date.now() });
            },
          },
          events: {
            userUpdated: userUpdatedEvent.api,
          },
        };
      });

      await agg1.untilInitialized();

      const agg1Events: any[] = [];
      agg1.api.events.userUpdated.listen((data) => {
        agg1Events.push(data);
      });

      const agg2 = createSharedSingletonAgg('test-complex-events', () => {
        const user = ref<{ id: string; name: string; profile: { age: number } } | null>(null);
        const userUpdatedEvent = createSharedEvent<{
          user: { id: string; name: string; profile: { age: number } } | null;
          timestamp: number;
        }>();
        return {
          states: { user },
          commands: {
            updateUser(id: string, name: string, age: number) {
              user.value = { id, name, profile: { age } };
              userUpdatedEvent.publish({ user: user.value, timestamp: Date.now() });
            },
          },
          events: {
            userUpdated: userUpdatedEvent.api,
          },
        };
      });

      await agg2.untilInitialized();

      const agg2Events: any[] = [];
      agg2.api.events.userUpdated.listen((data) => {
        agg2Events.push(data);
      });

      await new Promise((resolve) => setTimeout(resolve, 30));

      agg1.api.commands.updateUser('user-1', 'Alice', 25);
      await new Promise((resolve) => setTimeout(resolve, 30));

      expect(agg1Events).toHaveLength(1);
      expect(agg1Events[0].user).toEqual({ id: 'user-1', name: 'Alice', profile: { age: 25 } });
      expect(agg1Events[0].timestamp).toBeGreaterThan(0);

      expect(agg2Events).toHaveLength(1);
      expect(agg2Events[0].user).toEqual({ id: 'user-1', name: 'Alice', profile: { age: 25 } });
      expect(agg2Events[0].timestamp).toBeGreaterThan(0);
    });

    it('should handle multiple listeners across tabs', async () => {
      const agg1 = createSharedSingletonAgg('test-multi-listeners', () => {
        const status = ref('idle');
        const statusChangedEvent = createSharedEvent<{ status: string }>();
        return {
          states: { status },
          commands: {
            setStatus(newStatus: string) {
              status.value = newStatus;
              statusChangedEvent.publish({ status: newStatus });
            },
          },
          events: {
            statusChanged: statusChangedEvent.api,
          },
        };
      });

      await agg1.untilInitialized();

      // 在 agg1 上添加多个监听器
      const agg1Listener1Calls: string[] = [];
      const agg1Listener2Calls: string[] = [];
      agg1.api.events.statusChanged.listen(({ status }) => {
        agg1Listener1Calls.push(status);
      });
      agg1.api.events.statusChanged.listen(({ status }) => {
        agg1Listener2Calls.push('listener2-' + status);
      });

      const agg2 = createSharedSingletonAgg('test-multi-listeners', () => {
        const status = ref('idle');
        const statusChangedEvent = createSharedEvent<{ status: string }>();
        return {
          states: { status },
          commands: {
            setStatus(newStatus: string) {
              status.value = newStatus;
              statusChangedEvent.publish({ status: newStatus });
            },
          },
          events: {
            statusChanged: statusChangedEvent.api,
          },
        };
      });

      await agg2.untilInitialized();

      // 在 agg2 上添加多个监听器
      const agg2Listener1Calls: string[] = [];
      const agg2Listener2Calls: string[] = [];
      agg2.api.events.statusChanged.listen(({ status }) => {
        agg2Listener1Calls.push(status);
      });
      agg2.api.events.statusChanged.listen(({ status }) => {
        agg2Listener2Calls.push('listener2-' + status);
      });

      await new Promise((resolve) => setTimeout(resolve, 30));

      // 通过 agg2 触发事件
      agg2.api.commands.setStatus('active');
      await new Promise((resolve) => setTimeout(resolve, 30));

      // 所有监听器都应该收到事件
      expect(agg1Listener1Calls).toEqual(['active']);
      expect(agg1Listener2Calls).toEqual(['listener2-active']);
      expect(agg2Listener1Calls).toEqual(['active']);
      expect(agg2Listener2Calls).toEqual(['listener2-active']);
    });
  });

  describe('error handling and edge cases', () => {
    it('should throw error when initialization fails in singleton aggregation', () => {
      // Error is thrown synchronously during effectScope.run
      expect(() => {
        createSharedSingletonAgg('test-init-fail', () => {
          throw new Error('Initialization failed');
        });
      }).toThrow('Initialization failed');
    });

    it('should handle initialization error with onBeforeInitialize', () => {
      // onBeforeInitialize callbacks are executed synchronously
      expect(() => {
        createSharedSingletonAgg('test-init-error', ({ onBeforeInitialize }) => {
          onBeforeInitialize(() => {
            throw new Error('Setup failed');
          });
          return {
            states: {},
            commands: {},
            events: {},
          };
        });
      }).toThrow('Setup failed');
    });

    it('should not respond to state requests from different instance IDs in multi-instance mode', async () => {
      const agg1 = createSharedMultiInstanceAgg('instance-1', 'test-state-isolation', () => {
        const value = ref('initial');
        return {
          states: { value },
          commands: {
            setValue(v: string) {
              value.value = v;
            },
          },
          events: {},
        };
      });

      await agg1.untilInitialized();

      const agg2 = createSharedMultiInstanceAgg('instance-2', 'test-state-isolation', () => {
        const value = ref('');
        return {
          states: { value },
          commands: {
            setValue(v: string) {
              value.value = v;
            },
          },
          events: {},
        };
      });

      await agg2.untilInitialized();
      await new Promise((resolve) => setTimeout(resolve, 30));

      // agg2 的值应该是空的，不会同步 agg1 的初始状态
      expect(agg2.api.states.value.value).toBe('');
    });

    it('should only destroy matching instance ID in multi-instance mode', async () => {
      const agg1 = createSharedMultiInstanceAgg('instance-1', 'test-destroy-match', () => {
        const value = ref(1);
        return {
          states: { value },
          commands: {
            setValue(v: number) {
              value.value = v;
            },
          },
          events: {},
        };
      });

      await agg1.untilInitialized();

      const agg2 = createSharedMultiInstanceAgg('instance-2', 'test-destroy-match', () => {
        const value = ref(2);
        return {
          states: { value },
          commands: {
            setValue(v: number) {
              value.value = v;
            },
          },
          events: {},
        };
      });

      await agg2.untilInitialized();
      await new Promise((resolve) => setTimeout(resolve, 30));

      // 调用 agg1 的 destroy，agg2 应该还能正常工作
      agg1.api.destroy();
      await new Promise((resolve) => setTimeout(resolve, 20));

      // agg2 应该还能正常使用
      agg2.api.commands.setValue(10);
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(agg2.api.states.value.value).toBe(10);
    });

    it('should handle event broadcast for non-SharedEvent gracefully', async () => {
      // Test that LocalEvent works correctly alongside SharedEvent
      const agg1 = createSharedSingletonAgg('test-mixed-events', () => {
        const count = ref(0);
        const localEvent = createLocalEvent<{ delta: number }>();
        const sharedEvent = createSharedEvent<{ newValue: number }>();
        return {
          states: { count },
          commands: {
            incrementBy(delta: number) {
              count.value += delta;
              // Publish to both events
              localEvent.publish({ delta });
              sharedEvent.publish({ newValue: count.value });
            },
          },
          events: {
            localChanged: localEvent.api,
            sharedChanged: sharedEvent.api,
          },
        };
      });

      await agg1.untilInitialized();

      const agg1LocalReceived: number[] = [];
      const agg1SharedReceived: number[] = [];
      agg1.api.events.localChanged.listen(({ delta }) => {
        agg1LocalReceived.push(delta);
      });
      agg1.api.events.sharedChanged.listen(({ newValue }) => {
        agg1SharedReceived.push(newValue);
      });

      const agg2 = createSharedSingletonAgg('test-mixed-events', () => {
        const count = ref(0);
        const localEvent = createLocalEvent<{ delta: number }>();
        const sharedEvent = createSharedEvent<{ newValue: number }>();
        return {
          states: { count },
          commands: {
            incrementBy(delta: number) {
              count.value += delta;
              localEvent.publish({ delta });
              sharedEvent.publish({ newValue: count.value });
            },
          },
          events: {
            localChanged: localEvent.api,
            sharedChanged: sharedEvent.api,
          },
        };
      });

      await agg2.untilInitialized();

      const agg2LocalReceived: number[] = [];
      const agg2SharedReceived: number[] = [];
      agg2.api.events.localChanged.listen(({ delta }) => {
        agg2LocalReceived.push(delta);
      });
      agg2.api.events.sharedChanged.listen(({ newValue }) => {
        agg2SharedReceived.push(newValue);
      });

      await new Promise((resolve) => setTimeout(resolve, 30));

      // Trigger command from agg1
      agg1.api.commands.incrementBy(5);
      await new Promise((resolve) => setTimeout(resolve, 20));

      // Both instances should receive their local events
      // and both should receive the shared event
      expect(agg1LocalReceived).toEqual([5]);
      expect(agg2LocalReceived).toEqual([5]); // agg2 executes command too, triggers its local event
      expect(agg1SharedReceived).toEqual([5]);
      expect(agg2SharedReceived).toEqual([5]); // SharedEvent broadcasts across tabs

      // State should be synchronized
      expect(agg1.api.states.count.value).toBe(5);
      expect(agg2.api.states.count.value).toBe(5);
    });

    it('should handle events with no listeners gracefully', async () => {
      const agg = createSharedSingletonAgg('test-no-listeners', () => {
        const count = ref(0);
        const countChangedEvent = createSharedEvent<{ newValue: number }>();
        return {
          states: { count },
          commands: {
            increment() {
              count.value++;
              countChangedEvent.publish({ newValue: count.value });
            },
          },
          events: {
            countChanged: countChangedEvent.api,
          },
        };
      });

      await agg.untilInitialized();

      // 没有监听器时应该不抛出错误
      expect(() => agg.api.commands.increment()).not.toThrow();
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(agg.api.states.count.value).toBe(1);
    });

    it('should handle event when sharedEvent not in eventWrappers', async () => {
      // 创建一个聚合
      const agg1 = createSharedSingletonAgg('test-orphan-event', () => {
        const count = ref(0);
        return {
          states: { count },
          commands: {
            increment() {
              count.value++;
            },
          },
          events: {}, // No events defined
        };
      });

      await agg1.untilInitialized();

      // 直接发送一个不存在的事件广播消息
      const channel = new BroadcastChannel('test-orphan-event');
      channel.postMessage({
        type: 'event-broadcast',
        eventName: 'nonExistentEvent',
        data: { test: 'data' },
      });

      // 应该不抛出错误
      await new Promise((resolve) => setTimeout(resolve, 20));

      // 聚合应该还能正常工作
      agg1.api.commands.increment();
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(agg1.api.states.count.value).toBe(1);

      channel.close();
    });

    it('should handle multiple state updates in multi-instance mode', async () => {
      const agg1 = createSharedMultiInstanceAgg('user-1', 'test-multi-updates', () => {
        const data = ref<string[]>([]);
        return {
          states: { data },
          commands: {
            addItem(item: string) {
              data.value.push(item);
            },
            clearItems() {
              data.value = [];
            },
          },
          events: {},
        };
      });

      await agg1.untilInitialized();

      const agg1Clone = createSharedMultiInstanceAgg('user-1', 'test-multi-updates', () => {
        const data = ref<string[]>([]);
        return {
          states: { data },
          commands: {
            addItem(item: string) {
              data.value.push(item);
            },
            clearItems() {
              data.value = [];
            },
          },
          events: {},
        };
      });

      await agg1Clone.untilInitialized();
      await new Promise((resolve) => setTimeout(resolve, 30));

      // 多次修改状态
      agg1.api.commands.addItem('item1');
      await new Promise((resolve) => setTimeout(resolve, 20));

      agg1.api.commands.addItem('item2');
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(agg1.api.states.data.value).toEqual(['item1', 'item2']);
      expect(agg1Clone.api.states.data.value).toEqual(['item1', 'item2']);

      // 清空
      agg1Clone.api.commands.clearItems();
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(agg1.api.states.data.value).toEqual([]);
      expect(agg1Clone.api.states.data.value).toEqual([]);
    });
  });
});
