import type { ComputedRef, Ref } from 'vue';

// 消息协议类型
export type SharedChannelMessage =
  | CommandMessage
  | StateRequestMessage
  | StateResponseMessage
  | StateBroadcastMessage
  | DestroyMessage
  | EventBroadcastMessage; // 新增：事件广播消息

// 命令消息：执行命令并同步
export type CommandMessage = {
  type: 'command';
  commandName: string;
  args: unknown[];
  version: string;
  instanceId?: string; // 多实例模式下用于隔离状态
};

// 事件广播消息：跨标签页广播事件
export type EventBroadcastMessage = {
  type: 'event-broadcast';
  eventName: string;
  data: unknown;
  instanceId?: string; // 多实例模式下用于隔离状态
};

// 状态请求消息：新 tab 请求当前完整状态
export type StateRequestMessage = {
  type: 'state-request';
  instanceId?: string;
};

// 状态响应消息：返回当前完整状态
export type StateResponseMessage = {
  type: 'state-response';
  instanceId?: string;
  state: Record<string, unknown>;
  version: string;
};

// 状态广播消息：直接广播状态变更
export type StateBroadcastMessage = {
  type: 'state-broadcast';
  stateKey: string;
  value: unknown;
  version: string;
};

// 销毁消息
export type DestroyMessage = {
  type: 'destroy';
  instanceId?: string;
};

// 状态类型
export type SharedStateRecords<T> = keyof T extends never ? {} : Record<string, Ref<unknown>>;

// 命令类型
export type SharedCommandRecords<T> = keyof T extends never
  ? {}
  : Record<string, (...args: any[]) => void | Promise<void>>;

// 事件类型（本地事件，不跨标签）
export type SharedEventRecords<T> = keyof T extends never ? {} : Record<string, unknown>;

// API 类型
export type SharedStatesApi<STATES extends SharedStateRecords<any>> = Readonly<{
  [K in keyof STATES]: STATES[K];
}>;

export type SharedCommandsApi<COMMANDS extends SharedCommandRecords<any>> = Readonly<{
  [K in keyof COMMANDS]: COMMANDS[K];
}>;

export type SharedEventsApi<EVENTS extends SharedEventRecords<any>> = Readonly<{
  [K in keyof EVENTS]: EVENTS[K];
}>;

// 聚合 API 类型
export type SharedSingletonAggApi<
  STATES extends SharedStateRecords<any>,
  COMMANDS extends SharedCommandRecords<any>,
  EVENTS extends SharedEventRecords<any>
> = Readonly<{
  states: SharedStatesApi<STATES>;
  commands: SharedCommandsApi<COMMANDS>;
  events: SharedEventsApi<EVENTS>;
}>;

export type SharedMultiInstanceAggApi<
  STATES extends SharedStateRecords<any>,
  COMMANDS extends SharedCommandRecords<any>,
  EVENTS extends SharedEventRecords<any>
> = Readonly<{
  states: SharedStatesApi<STATES>;
  commands: SharedCommandsApi<COMMANDS>;
  events: SharedEventsApi<EVENTS>;
  destroy: () => void;
}>;

// 聚合类型
export type SharedSingletonAgg<
  STATES extends SharedStateRecords<any>,
  COMMANDS extends SharedCommandRecords<any>,
  EVENTS extends SharedEventRecords<any>
> = {
  readonly __id: string;
  readonly type: 'Singleton';
  readonly api: SharedSingletonAggApi<STATES, COMMANDS, EVENTS>;
  readonly isInitialized: ComputedRef<boolean>;
  readonly untilInitialized: () => Promise<void>;
};

export type SharedMultiInstanceAgg<
  ID,
  STATES extends SharedStateRecords<any>,
  COMMANDS extends SharedCommandRecords<any>,
  EVENTS extends SharedEventRecords<any>
> = {
  readonly __id: string;
  readonly type: 'MultiInstance';
  readonly id: ID;
  readonly api: SharedMultiInstanceAggApi<STATES, COMMANDS, EVENTS>;
  readonly isInitialized: ComputedRef<boolean>;
  readonly untilInitialized: () => Promise<void>;
};
