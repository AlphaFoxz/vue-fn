import type { ComputedRef, EffectScope, Ref, ShallowRef } from 'vue';
import { computed, effectScope, readonly, shallowReadonly, shallowRef, toRaw, watch } from 'vue';
import { Deferred } from 'ts-deferred';
import type {
  SharedCommandRecords,
  SharedCommandsApi,
  SharedEventRecords,
  SharedEventsApi,
  SharedMultiInstanceAgg,
  SharedSingletonAgg,
  SharedStateRecords,
  SharedStatesApi,
} from './type';
import type { SharedChannelMessage, CommandMessage, EventBroadcastMessage } from './type';
import type { SharedEvent } from './event';

// 版本号生成器
let globalVersion = '0';
function nextVersion(): string {
  globalVersion = (parseInt(globalVersion) + 1).toString();
  return globalVersion;
}

// 聚合内部状态
interface AggInternalState<STATES extends SharedStateRecords<any>> {
  states: STATES;
  version: string;
}

// 命令包装器类型
type CommandWrapper = {
  execute: (...args: any[]) => void | Promise<void>;
  originalFn: (...args: any[]) => void | Promise<void>;
};

// 创建共享聚合的核心逻辑
function createSharedAggCore<
  STATES extends SharedStateRecords<any>,
  COMMANDS extends SharedCommandRecords<any>,
  EVENTS extends SharedEventRecords<any>
>(options: {
  channelName: string;
  instanceId?: string;
  init: (context: {
    getCurrentScope: () => EffectScope;
    onScopeDispose: (fn: () => void, failSilently?: boolean) => void;
    onCreated: (fn: () => void) => void;
    onBeforeInitialize: (fn: () => void) => void;
    isInitialized: ComputedRef<boolean>;
    untilInitialized: Promise<void>;
  }) => {
    states?: STATES;
    commands?: COMMANDS;
    events?: EVENTS;
    destroy?: () => void;
  };
  isMultiInstance: boolean;
}) {
  const { channelName, instanceId, init, isMultiInstance } = options;
  const channel = new BroadcastChannel(channelName);

  // 初始化生命周期
  const {
    resolve: initialize,
    reject: onInitializeError,
    promise: untilInitialized,
  } = new Deferred<void>();
  let isInitializedRef = shallowRef(false);

  const beforeInitializeTasks: (void | Promise<void>)[] = [];

  function onBeforeInitialize(fn: () => void) {
    if (isInitializedRef.value === true) {
      throw new Error('Agg already initialized');
    }
    beforeInitializeTasks.push(fn());
  }

  // 命令包装器映射
  const commandWrappers = new Map<string, CommandWrapper>();

  // 事件映射（用于跨标签广播）
  const eventWrappers = new Map<string, SharedEvent<any>>();

  // 内部状态（用于序列化）
  const internalState: ShallowRef<AggInternalState<STATES> | null> = shallowRef(null);

  // 创建 effect scope
  const scope = effectScope();

  // 初始化聚合
  const result = scope.run(() =>
    init({
      getCurrentScope: () => scope,
      onScopeDispose: (_fn: () => void) => {
        // EffectScope 会处理
      },
      onCreated(fn: () => void) {
        Promise.resolve().then(fn);
      },
      onBeforeInitialize,
      isInitialized: computed(() => isInitializedRef.value),
      untilInitialized,
    })
  )!;

  const states = (result.states || {}) as STATES;
  const commands = (result.commands || {}) as COMMANDS;
  const events = (result.events || {}) as EVENTS;

  // 包装命令以支持跨标签同步
  const wrappedCommands: Record<string, (...args: any[]) => void | Promise<void>> = {};
  for (const [name, command] of Object.entries(commands)) {
    const wrapper: CommandWrapper = {
      execute: command,
      originalFn: command,
    };
    commandWrappers.set(name, wrapper);

    wrappedCommands[name] = (...args: any[]) => {
      // 本地执行
      const result = wrapper.execute(...args);

      // 广播命令到其他标签
      const message: CommandMessage & { instanceId?: string } = {
        type: 'command',
        commandName: name,
        args,
        version: nextVersion(),
        instanceId: isMultiInstance ? instanceId : undefined,
      };
      channel.postMessage(message);

      return result;
    };
  }

  // 包装事件以支持跨标签同步
  for (const [name, event] of Object.entries(events)) {
    // 检查是否是 SharedEvent（通过 __internal__ 属性判断）
    if ('__internal__' in (event as any) && '__internal__' in (event as any)) {
      const sharedEvent = event as SharedEvent<any>;
      eventWrappers.set(name, sharedEvent);

      // 设置广播函数
      sharedEvent.__internal__.setBroadcastFunction((data: any) => {
        const message: EventBroadcastMessage = {
          type: 'event-broadcast',
          eventName: name,
          data,
          instanceId: isMultiInstance ? instanceId : undefined,
        };
        channel.postMessage(message);
      });
    }
  }

  // 监听状态变化并更新内部状态
  const stateKeys = Object.keys(states);
  const stateUnwatchFns: Array<() => void> = [];

  for (const key of stateKeys) {
    const stateRef = states[key] as Ref<unknown>;
    const unwatch = watch(
      stateRef,
      (newValue) => {
        if (internalState.value) {
          internalState.value = {
            ...internalState.value,
            states: {
              ...internalState.value.states,
              [key]: newValue,
            } as STATES,
            version: nextVersion(),
          };
        }
      },
      { deep: true }
    );
    stateUnwatchFns.push(unwatch);
  }

  // 初始化内部状态
  const initialState: Record<string, unknown> = {};
  for (const key of stateKeys) {
    initialState[key] = (states[key] as Ref<unknown>).value;
  }
  internalState.value = {
    states: states as STATES,
    version: nextVersion(),
  };

  // 处理跨标签消息
  channel.onmessage = (event: MessageEvent<SharedChannelMessage>) => {
    const message = event.data;

    switch (message.type) {
      case 'command': {
        const cmdMessage = message as CommandMessage & { instanceId?: string };
        // 多实例模式：只处理相同 instanceId 的命令
        if (isMultiInstance && cmdMessage.instanceId !== instanceId) {
          break;
        }
        const wrapper = commandWrappers.get(cmdMessage.commandName);
        if (wrapper) {
          // 直接执行原始函数，不再次广播
          wrapper.originalFn(...cmdMessage.args);
        }
        break;
      }

      case 'state-request': {
        // 响应状态请求
        const reqMessage = message as { type: 'state-request'; instanceId?: string };
        // 多实例模式：只响应相同 instanceId 的请求
        if (isMultiInstance && reqMessage.instanceId !== instanceId) {
          break;
        }
        if (internalState.value) {
          const response = {
            type: 'state-response' as const,
            instanceId,
            state: {} as Record<string, unknown>,
            version: internalState.value.version,
          };
          // 直接从 states 获取键，确保使用当前的状态
          const currentStateKeys = Object.keys(states);
          for (const key of currentStateKeys) {
            // 使用 toRaw 获取原始值，避免发送响应式对象
            const rawValue = toRaw((states[key] as Ref<unknown>).value);
            response.state[key] = rawValue;
          }
          channel.postMessage(response);
        }
        break;
      }

      case 'state-response': {
        // 接收状态响应
        // 对于单例：总是接受状态响应
        // 对于多实例：只接受相同 ID 的响应
        if (internalState.value) {
          const response = message as {
            type: 'state-response';
            instanceId?: string;
            state: Record<string, unknown>;
            version: string;
          };
          // 多实例模式：只处理相同 instanceId 的响应
          if (isMultiInstance && response.instanceId !== instanceId) {
            break;
          }
          // 直接从 states 获取键，确保使用当前的状态
          const currentStateKeys = Object.keys(states);
          for (const key of currentStateKeys) {
            if (response.state[key] !== undefined) {
              (states[key] as Ref<unknown>).value = response.state[key];
            }
          }
        }
        break;
      }

      case 'destroy': {
        if (isMultiInstance && message.instanceId === instanceId) {
          destroy();
        }
        break;
      }

      case 'event-broadcast': {
        const evtMessage = message as EventBroadcastMessage;
        // 多实例模式：只处理相同 instanceId 的事件
        if (isMultiInstance && evtMessage.instanceId !== instanceId) {
          break;
        }
        const sharedEvent = eventWrappers.get(evtMessage.eventName);
        if (sharedEvent) {
          // 触发本地事件
          sharedEvent.publish(evtMessage.data);
        }
        break;
      }
    }
  };

  // 请求当前状态（如果有其他标签存在）
  setTimeout(() => {
    channel.postMessage({
      type: 'state-request',
      instanceId,
    });
  }, 0);

  // 完成初始化
  setTimeout(() => {
    Promise.all(beforeInitializeTasks)
      .then(() => {
        initialize();
        isInitializedRef.value = true;
      })
      .catch((e: Error) => {
        onInitializeError(e);
        throw e;
      });
  }, 0);

  // 销毁函数
  function destroy() {
    stateUnwatchFns.forEach((fn) => fn());
    channel.close();
    scope.stop();
  }

  return {
    states,
    commands: wrappedCommands as COMMANDS,
    events,
    destroy,
    internalState,
    isInitialized: computed(() => isInitializedRef.value),
    untilInitialized: () =>
      untilInitialized.catch((e: Error) => {
        throw new Error(`Failed to initialize SharedAgg: ${e.message}`);
      }),
  };
}

// 创建单例共享聚合
export function createSharedSingletonAgg<
  STATES extends SharedStateRecords<any>,
  COMMANDS extends SharedCommandRecords<any>,
  EVENTS extends SharedEventRecords<any>
>(
  channelName: string,
  init: (context: {
    onCreated: (fn: () => void) => void;
    onBeforeInitialize: (fn: () => void) => void;
    isInitialized: ComputedRef<boolean>;
    untilInitialized: Promise<void>;
  }) => {
    states?: STATES;
    commands?: COMMANDS;
    events?: EVENTS;
  }
): SharedSingletonAgg<STATES, COMMANDS, EVENTS> {
  const { states, commands, events, isInitialized, untilInitialized } = createSharedAggCore({
    channelName,
    init: (ctx) =>
      init({
        onCreated: ctx.onCreated,
        onBeforeInitialize: ctx.onBeforeInitialize,
        isInitialized: ctx.isInitialized,
        untilInitialized: ctx.untilInitialized,
      }),
    isMultiInstance: false,
  });

  return {
    __id: channelName,
    type: 'Singleton',
    api: shallowReadonly({
      states: shallowReadonly(states) as SharedStatesApi<STATES>,
      commands: readonly(commands) as SharedCommandsApi<COMMANDS>,
      events: shallowReadonly(events) as SharedEventsApi<EVENTS>,
    }),
    isInitialized,
    untilInitialized,
  };
}

// 创建多实例共享聚合
export function createSharedMultiInstanceAgg<
  ID,
  STATES extends SharedStateRecords<any>,
  COMMANDS extends SharedCommandRecords<any>,
  EVENTS extends SharedEventRecords<any>
>(
  id: ID,
  channelName: string,
  init: (context: {
    getCurrentScope: () => EffectScope;
    onScopeDispose: (fn: () => void, failSilently?: boolean) => void;
    onCreated: (fn: () => void) => void;
    onBeforeInitialize: (fn: () => void) => void;
    isInitialized: ComputedRef<boolean>;
    untilInitialized: Promise<void>;
  }) => {
    states?: STATES;
    commands?: COMMANDS;
    events?: EVENTS;
    destroy?: () => void;
  }
): SharedMultiInstanceAgg<ID, STATES, COMMANDS, EVENTS> {
  // 实例 ID 用于唯一标识物理实例（用于销毁）
  const instanceId = `shared-agg-${Date.now()}-${Math.random()}`;
  // 实体 ID 用于状态隔离（相同 ID 的实例共享状态）
  const entityId = String(id);

  const {
    states,
    commands,
    events,
    destroy: _destroy,
    isInitialized,
    untilInitialized,
  } = createSharedAggCore({
    channelName,
    instanceId: entityId, // 使用 entityId 进行状态隔离
    init,
    isMultiInstance: true,
  });

  // 包装 destroy 函数以广播销毁消息
  function destroy() {
    _destroy();
    try {
      const channel = new BroadcastChannel(channelName);
      channel.postMessage({
        type: 'destroy',
        instanceId,
      });
      channel.close();
    } catch {
      // Channel 可能已关闭
    }
  }

  return {
    __id: instanceId,
    type: 'MultiInstance',
    id,
    api: shallowReadonly({
      states: shallowReadonly(states) as SharedStatesApi<STATES>,
      commands: readonly(commands) as SharedCommandsApi<COMMANDS>,
      events: shallowReadonly(events) as SharedEventsApi<EVENTS>,
      destroy,
    }),
    isInitialized,
    untilInitialized,
  };
}
