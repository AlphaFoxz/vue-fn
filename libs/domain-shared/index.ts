// 类型导出
export type {
  SharedChannelMessage,
  CommandMessage,
  StateRequestMessage,
  StateResponseMessage,
  StateBroadcastMessage,
  DestroyMessage,
  EventBroadcastMessage,
  SharedStateRecords,
  SharedCommandRecords,
  SharedEventRecords,
  SharedStatesApi,
  SharedCommandsApi,
  SharedEventsApi,
  SharedSingletonAggApi,
  SharedMultiInstanceAggApi,
  SharedSingletonAgg,
  SharedMultiInstanceAgg,
} from './type';

// 本地事件
export type { LocalEvent, SharedEvent } from './event';
export { createLocalEvent, createSharedEvent } from './event';

export { createSharedSingletonAgg, createSharedMultiInstanceAgg } from './agg';

// 工具
export * as Utils from './common';
