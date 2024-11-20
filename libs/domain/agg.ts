import {
  type UnwrapNestedRefs,
  type DeepReadonly,
  readonly,
  shallowReadonly,
  EffectScope,
  effectScope,
  onScopeDispose,
  ComputedRef,
  computed,
} from 'vue'
import {
  type DomainBroadcastEvent,
  type DomainDestroyedEventApi,
  createBroadcastEvent,
  DomainEvent,
  DomainRequestEvent,
} from './event'
import { createPromiseCallback, genUuidv4 } from './common'

type AddDestroyedEvent<T extends object, K = 'destroyed'> = keyof T extends never
  ? { destroyed: DomainBroadcastEvent<{}> }
  : {
      [P in keyof T as P extends K ? 'destroyed' : P]: P extends K ? DomainBroadcastEvent<{}> : T[P]
    } & { destroyed: DomainBroadcastEvent<{}> }
type AddDestroyedEventApi<T extends object, K = 'destroyed'> = keyof T extends never
  ? { destroyed: DomainDestroyedEventApi }
  : {
      [P in keyof T as P]: P extends K ? DomainBroadcastEvent<{}> : T[P]
    } & { destroyed: DomainDestroyedEventApi }

type InferDomainEvent<EVENT extends DomainEvent<any, any>> = EVENT extends DomainBroadcastEvent<infer DATA>
  ? DomainBroadcastEvent<DATA>
  : EVENT extends DomainRequestEvent<infer DATA, infer CALLBACK>
  ? DomainRequestEvent<DATA, CALLBACK>
  : never
type InferDomainEventApi<EVENT extends DomainEvent<any, any>> = ReturnType<InferDomainEvent<EVENT>['toApi']>

type CustomerStateRecords<T> = keyof T extends never ? {} : Record<string, object>
type CustomerActionRecords<T> = keyof T extends never ? {} : Record<string, Function>
type CustomerEventRecords<T> = keyof T extends never
  ? {}
  : { [K in keyof T]: T[K] extends DomainRequestEvent<any, any> | DomainBroadcastEvent<any> ? T[K] : never }
export type DomainDestroyFunction = (...args: any[]) => void

export type DomainStatesApi<STATES extends CustomerStateRecords<any>> = Readonly<{
  [K in keyof STATES]: DeepReadonly<UnwrapNestedRefs<STATES[K]>>
}>

export type DomainActionsApi<ACTIONS extends CustomerActionRecords<any>> = Readonly<{
  [K in keyof ACTIONS]: ACTIONS[K] extends Function ? ACTIONS[K] : never
}>

export type DomainEventsApi<EVENTS extends CustomerEventRecords<any>> = EVENTS extends Record<
  string,
  DomainRequestEvent<any, any> | DomainBroadcastEvent<any>
>
  ? Readonly<{
      [K in keyof EVENTS as K]: InferDomainEventApi<EVENTS[K]>
    }>
  : EVENTS

export type DomainUnmountableEventsApi<EVENTS extends CustomerEventRecords<EVENTS>> = EVENTS extends Record<
  string,
  DomainRequestEvent<any, any> | DomainBroadcastEvent<any>
>
  ? Readonly<
      AddDestroyedEventApi<{
        [K in keyof EVENTS as K]: InferDomainEventApi<EVENTS[K]>
      }>
    >
  : { destroyed: DomainDestroyedEventApi }

export type DomainMultiInstanceAggApi<
  STATES extends CustomerStateRecords<STATES>,
  ACTIONS extends CustomerActionRecords<ACTIONS>,
  EVENTS extends CustomerEventRecords<EVENTS>
> = Readonly<{
  states: DomainStatesApi<STATES>
  actions: DomainActionsApi<ACTIONS>
  events: DomainUnmountableEventsApi<EVENTS>
  destroy: DomainDestroyFunction
}>

export type DomainSingletonAggApi<
  STATES extends CustomerStateRecords<STATES>,
  ACTIONS extends CustomerActionRecords<ACTIONS>,
  EVENTS extends CustomerEventRecords<EVENTS>
> = Readonly<{
  states: DomainStatesApi<STATES>
  actions: DomainActionsApi<ACTIONS>
  events: DomainEventsApi<EVENTS>
}>

export function createMultiInstanceAggApi<
  STATES extends CustomerStateRecords<STATES>,
  ACTIONS extends CustomerActionRecords<ACTIONS>,
  EVENTS extends CustomerEventRecords<EVENTS>
>(option: {
  states: STATES
  actions: ACTIONS
  events: EVENTS
  destroy: DomainDestroyFunction
}): DomainMultiInstanceAggApi<STATES, ACTIONS, EVENTS> {
  return createAggApiContent(option) as unknown as DomainMultiInstanceAggApi<STATES, ACTIONS, EVENTS>
}

export function createAggApi<
  STATES extends CustomerStateRecords<STATES>,
  ACTIONS extends CustomerActionRecords<ACTIONS>,
  EVENTS extends CustomerEventRecords<EVENTS>
>(option: {
  states: STATES
  actions: ACTIONS
  events: EVENTS
  destroy: DomainDestroyFunction
}): DomainSingletonAggApi<STATES, ACTIONS, EVENTS> {
  const apiContent = createAggApiContent(option)
  return shallowReadonly({
    states: apiContent.states,
    actions: apiContent.actions,
    events: apiContent.events,
  })
}

function createAggApiContent<
  STATES extends CustomerStateRecords<STATES>,
  ACTIONS extends CustomerActionRecords<ACTIONS>,
  EVENTS extends CustomerEventRecords<EVENTS>
>(option: {
  states: STATES
  actions: ACTIONS
  events: EVENTS
  destroy: DomainDestroyFunction
}): {
  states: DomainStatesApi<STATES>
  actions: DomainActionsApi<ACTIONS>
  events: DomainEventsApi<EVENTS>
  destroy: DomainDestroyFunction
} {
  const optionStates = option.states as Record<string, object>
  for (const k of Object.keys(option.states)) {
    optionStates[k] = readonly(optionStates[k])
  }
  const states = shallowReadonly(option.states) as DomainStatesApi<STATES>
  const actions = readonly(option.actions) as DomainActionsApi<ACTIONS>
  const events = {} as DomainEventsApi<EVENTS>
  const optionEvents = option.events as { [k: string]: DomainRequestEvent<any, any> | DomainBroadcastEvent<any> }
  for (const k in option.events) {
    ;(events as any)[k] = optionEvents[k].toApi()
  }
  return shallowReadonly({
    states,
    actions,
    events: shallowReadonly(events) as DomainEventsApi<EVENTS>,
    destroy: option.destroy,
  })
}

export type DomainMultiInstanceAgg<
  ID,
  STATES extends CustomerStateRecords<STATES>,
  ACTIONS extends CustomerActionRecords<ACTIONS>,
  EVENTS extends CustomerEventRecords<EVENTS>
> = {
  readonly _hash: string
  readonly type: 'MultiInstance'
  readonly id: ID
  readonly api: DomainMultiInstanceAggApi<STATES, ACTIONS, EVENTS>
  readonly isInitialized: ComputedRef<boolean>
  readonly untilInitialized: () => Promise<void>
}

export type DomainSingletonAgg<
  STATES extends CustomerStateRecords<STATES>,
  ACTIONS extends CustomerActionRecords<ACTIONS>,
  EVENTS extends CustomerEventRecords<EVENTS>
> = {
  readonly _hash: string
  readonly type: 'Singleton'
  readonly api: DomainSingletonAggApi<STATES, ACTIONS, EVENTS>
  readonly isInitialized: ComputedRef<boolean>
  readonly untilInitialized: () => Promise<void>
}

export function createMultiInstanceAgg<
  ID,
  STATES extends CustomerStateRecords<STATES>,
  ACTIONS extends CustomerActionRecords<ACTIONS>,
  EVENTS extends CustomerEventRecords<EVENTS>
>(
  id: ID,
  init: (context: {
    getCurrentScope: () => EffectScope
    onScopeDispose: (fn: () => void, failSilently?: boolean) => void
    onCreated: (fn: () => void) => void
    onBeforeInitialize: (fn: () => void) => void
    isInitialized: ComputedRef<boolean>
    untilInitialized: Promise<void>
  }) => {
    states?: STATES
    actions?: ACTIONS
    events?: EVENTS
    destroy?: DomainDestroyFunction
  }
): DomainMultiInstanceAgg<ID, STATES, ACTIONS, EVENTS> {
  // 声明 生命周期 - init
  const {
    callback: initialize,
    promise: untilInitialized,
    resolved: isInitialized,
  } = createPromiseCallback(() => {}, false, 5000)
  function onBeforeInitialize(fn: () => void) {
    if (isInitialized.value === true) {
      throw new Error('Agg already initialized')
    }
    beforeInitializeTasks.push(fn())
  }
  const beforeInitializeTasks: (void | Promise<void>)[] = []
  setTimeout(() =>
    Promise.all(beforeInitializeTasks).then(() => {
      initialize()
    })
  )
  const scope = effectScope()
  const result = scope.run(() =>
    init({
      getCurrentScope() {
        return scope
      },
      onScopeDispose,
      onCreated(fn: () => void) {
        Promise.resolve().then(fn)
      },
      onBeforeInitialize,
      isInitialized: computed(() => isInitialized.value),
      untilInitialized,
    })
  )!

  const states = (result.states || {}) as STATES
  const actions = (result.actions || {}) as ACTIONS
  const eventsExt = (result.events || {}) as AddDestroyedEvent<EVENTS>
  let destroyedEvent: DomainBroadcastEvent<{}> | undefined
  if (!eventsExt.destroyed) {
    destroyedEvent = createBroadcastEvent({})
    eventsExt.destroyed = destroyedEvent
  } else {
    destroyedEvent = eventsExt.destroyed
  }

  let destroy = result.destroy as DomainDestroyFunction
  if (!destroy) {
    destroy = (() => {
      destroyedEvent?.publish({})
      for (const k in eventsExt) {
        const event = eventsExt[k]
        for (const handle of (event as DomainEvent<any, any>).watchHandles) {
          handle.stop()
        }
      }
      scope.stop()
    }) as DomainDestroyFunction
  }
  return shallowReadonly({
    _hash: genUuidv4(),
    type: 'MultiInstance',
    id,
    api: createMultiInstanceAggApi({
      states,
      actions,
      events: eventsExt as unknown as EVENTS,
      destroy,
    }),
    isInitialized,
    async untilInitialized() {
      return await untilInitialized.catch((e: Error) => {
        throw new Error(`Failed to initialize Agg: ${e.message}\nStack : ${e.stack || 'unkown'}`)
      })
    },
  })
}

export function createSingletonAgg<
  STATES extends CustomerStateRecords<STATES>,
  ACTIONS extends CustomerActionRecords<ACTIONS>,
  EVENTS extends CustomerEventRecords<EVENTS>
>(
  init: (context: {
    onCreated: (fn: () => void) => void
    onBeforeInitialize: (fn: () => void) => void
    isInitialized: ComputedRef<boolean>
    untilInitialized: Promise<void>
  }) => {
    states?: STATES
    actions?: ACTIONS
    events?: EVENTS
  }
): DomainSingletonAgg<STATES, ACTIONS, EVENTS> {
  const {
    callback: initialize,
    promise: untilInitialized,
    resolved: isInitialized,
  } = createPromiseCallback(() => {}, false, 5000)
  function onBeforeInitialize(fn: () => void) {
    if (isInitialized.value === true) {
      throw new Error('Agg already initialized')
    }
    beforeInitializeTasks.push(fn())
  }
  const beforeInitializeTasks: (void | Promise<void>)[] = []

  const result = init({
    onCreated(fn: () => void) {
      Promise.resolve().then(fn)
    },
    onBeforeInitialize,
    isInitialized: computed(() => isInitialized.value),
    untilInitialized,
  })
  setTimeout(() =>
    Promise.all(beforeInitializeTasks).then(() => {
      initialize()
    })
  )

  const states = (result.states || {}) as STATES
  const actions = (result.actions || {}) as ACTIONS
  const events = (result.events || {}) as EVENTS
  return {
    _hash: genUuidv4(),
    type: 'Singleton',
    api: createAggApi({
      states,
      actions,
      events,
      destroy: () => {},
    }),
    isInitialized,
    async untilInitialized() {
      return await untilInitialized.catch((e: Error) => {
        throw new Error(`Failed to initialize Agg: ${e.message}\nStack : ${e.stack || 'unkown'}`)
      })
    },
  }
}
