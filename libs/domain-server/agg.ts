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
} from '@vue/reactivity'
import {
  type DomainBroadcastEvent,
  type DomainDestroyedEventApi,
  createBroadcastEvent,
  DomainEvent,
  DomainRequestEvent,
} from './event'
import { createPromiseCallback, genId } from './common'

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
type InferDomainEventApi<EVENT extends DomainEvent<any, any>> = InferDomainEvent<EVENT>['api']

type CustomerStateRecords<T> = keyof T extends never ? {} : Record<string, object>
type CustomerCommandRecords<T> = keyof T extends never ? {} : Record<string, Function>
type CustomerEventRecords<T> = keyof T extends never
  ? {}
  : { [K in keyof T]: T[K] extends DomainRequestEvent<any, any> | DomainBroadcastEvent<any> ? T[K] : never }
export type DomainDestroyFunction = (...args: any[]) => void

export type DomainStatesApi<STATES extends CustomerStateRecords<any>> = Readonly<{
  [K in keyof STATES]: DeepReadonly<UnwrapNestedRefs<STATES[K]>>
}>

export type DomainCommandsApi<COMMANDS extends CustomerCommandRecords<any>> = Readonly<{
  [K in keyof COMMANDS]: COMMANDS[K] extends Function ? COMMANDS[K] : never
}>

export type DomainEventsApi<EVENTS extends CustomerEventRecords<any>> = EVENTS extends Record<
  string,
  DomainRequestEvent<any, any> | DomainBroadcastEvent<any>
>
  ? Readonly<{
      [K in keyof EVENTS as K]: InferDomainEventApi<EVENTS[K]>
    }>
  : EVENTS

export type DomainMultiInstanceEventsApi<EVENTS extends CustomerEventRecords<EVENTS>> = EVENTS extends Record<
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
  COMMANDS extends CustomerCommandRecords<COMMANDS>,
  EVENTS extends CustomerEventRecords<EVENTS>
> = Readonly<{
  states: DomainStatesApi<STATES>
  commands: DomainCommandsApi<COMMANDS>
  events: DomainMultiInstanceEventsApi<EVENTS>
  destroy: DomainDestroyFunction
}>

export type DomainSingletonAggApi<
  STATES extends CustomerStateRecords<STATES>,
  COMMANDS extends CustomerCommandRecords<COMMANDS>,
  EVENTS extends CustomerEventRecords<EVENTS>
> = Readonly<{
  states: DomainStatesApi<STATES>
  commands: DomainCommandsApi<COMMANDS>
  events: DomainEventsApi<EVENTS>
}>

export function createMultiInstanceAggApi<
  STATES extends CustomerStateRecords<STATES>,
  COMMANDS extends CustomerCommandRecords<COMMANDS>,
  EVENTS extends CustomerEventRecords<EVENTS>
>(option: {
  states: STATES
  commands: COMMANDS
  events: EVENTS
  destroy: DomainDestroyFunction
}): DomainMultiInstanceAggApi<STATES, COMMANDS, EVENTS> {
  return createAggApiContent(option) as unknown as DomainMultiInstanceAggApi<STATES, COMMANDS, EVENTS>
}

export function createAggApi<
  STATES extends CustomerStateRecords<STATES>,
  COMMANDS extends CustomerCommandRecords<COMMANDS>,
  EVENTS extends CustomerEventRecords<EVENTS>
>(option: {
  states: STATES
  commands: COMMANDS
  events: EVENTS
  destroy: DomainDestroyFunction
}): DomainSingletonAggApi<STATES, COMMANDS, EVENTS> {
  const apiContent = createAggApiContent(option)
  return shallowReadonly({
    states: apiContent.states,
    commands: apiContent.commands,
    events: apiContent.events,
  })
}

function createAggApiContent<
  STATES extends CustomerStateRecords<STATES>,
  COMMANDS extends CustomerCommandRecords<COMMANDS>,
  EVENTS extends CustomerEventRecords<EVENTS>
>(option: {
  states: STATES
  commands: COMMANDS
  events: EVENTS
  destroy: DomainDestroyFunction
}): {
  states: DomainStatesApi<STATES>
  commands: DomainCommandsApi<COMMANDS>
  events: DomainEventsApi<EVENTS>
  destroy: DomainDestroyFunction
} {
  const optionStates = option.states as Record<string, object>
  for (const k of Object.keys(option.states)) {
    optionStates[k] = readonly(optionStates[k])
  }
  const states = shallowReadonly(option.states) as DomainStatesApi<STATES>
  const commands = readonly(option.commands) as DomainCommandsApi<COMMANDS>
  const events = {} as DomainEventsApi<EVENTS>
  const optionEvents = option.events as { [k: string]: DomainRequestEvent<any, any> | DomainBroadcastEvent<any> }
  for (const k in option.events) {
    ;(events as any)[k] = optionEvents[k].api
  }
  return shallowReadonly({
    states,
    commands,
    events: shallowReadonly(events) as DomainEventsApi<EVENTS>,
    destroy: option.destroy,
  })
}

export type DomainMultiInstanceAgg<
  ID,
  STATES extends CustomerStateRecords<STATES>,
  COMMANDS extends CustomerCommandRecords<COMMANDS>,
  EVENTS extends CustomerEventRecords<EVENTS>
> = {
  readonly _code: string
  readonly type: 'MultiInstance'
  readonly id: ID
  readonly api: DomainMultiInstanceAggApi<STATES, COMMANDS, EVENTS>
  readonly isInitialized: ComputedRef<boolean>
  readonly untilInitialized: () => Promise<void>
}

export type DomainSingletonAgg<
  STATES extends CustomerStateRecords<STATES>,
  COMMANDS extends CustomerCommandRecords<COMMANDS>,
  EVENTS extends CustomerEventRecords<EVENTS>
> = {
  readonly _code: string
  readonly type: 'Singleton'
  readonly api: DomainSingletonAggApi<STATES, COMMANDS, EVENTS>
  readonly isInitialized: ComputedRef<boolean>
  readonly untilInitialized: () => Promise<void>
}

export function createMultiInstanceAgg<
  ID,
  STATES extends CustomerStateRecords<STATES>,
  COMMANDS extends CustomerCommandRecords<COMMANDS>,
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
    commands?: COMMANDS
    events?: EVENTS
    destroy?: DomainDestroyFunction
  }
): DomainMultiInstanceAgg<ID, STATES, COMMANDS, EVENTS> {
  // 声明 生命周期 - init
  const {
    callback: initialize,
    onError: onInitializeError,
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
    Promise.all(beforeInitializeTasks)
      .then(() => {
        initialize()
      })
      .catch((e: Error) => {
        onInitializeError(e)
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
  const commands = (result.commands || {}) as COMMANDS
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
    _code: genId(),
    type: 'MultiInstance',
    id,
    api: createMultiInstanceAggApi({
      states,
      commands,
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
  COMMANDS extends CustomerCommandRecords<COMMANDS>,
  EVENTS extends CustomerEventRecords<EVENTS>
>(
  init: (context: {
    onCreated: (fn: () => void) => void
    onBeforeInitialize: (fn: () => void) => void
    isInitialized: ComputedRef<boolean>
    untilInitialized: Promise<void>
  }) => {
    states?: STATES
    commands?: COMMANDS
    events?: EVENTS
  }
): DomainSingletonAgg<STATES, COMMANDS, EVENTS> {
  const {
    callback: initialize,
    onError: onInitializeError,
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
    Promise.all(beforeInitializeTasks)
      .then(() => {
        initialize()
      })
      .catch((e: Error) => {
        onInitializeError(e)
      })
  )

  const states = (result.states || {}) as STATES
  const commands = (result.commands || {}) as COMMANDS
  const events = (result.events || {}) as EVENTS
  return {
    _code: genId(),
    type: 'Singleton',
    api: createAggApi({
      states,
      commands,
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
