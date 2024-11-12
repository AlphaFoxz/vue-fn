import {
  type UnwrapNestedRefs,
  type DeepReadonly,
  readonly,
  shallowReadonly,
  EffectScope,
  effectScope,
  onScopeDispose,
} from '@vue/reactivity'
import {
  type DomainBroadcastEvent,
  type DomainDestroyedEventApi,
  createBroadcastEvent,
  DomainEvent,
  DomainRequestEvent,
} from './events'

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

type InferDomainEvent<EVENT extends DomainEvent<any, any>> = EVENT extends DomainEvent<infer DATA, infer CALLBACK>
  ? DomainEvent<DATA, CALLBACK> extends DomainBroadcastEvent<DATA>
    ? DomainBroadcastEvent<DATA>
    : DomainRequestEvent<DATA, CALLBACK>
  : never
type InferDomainEventApi<EVENT extends DomainEvent<any, any>> = ReturnType<InferDomainEvent<EVENT>['toApi']>

type CustomerStateRecords<T> = keyof T extends never ? {} : Record<string, object>
type CustomerActionRecords<T> = keyof T extends never ? {} : Record<string, Function>
type CustomerEventRecords<T> = keyof T extends never
  ? {}
  : { [K in keyof T]: T[K] extends DomainRequestEvent<any, any> | DomainBroadcastEvent<any> ? T[K] : never }
type DestroyFunction = (...args: any[]) => void

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

export type DomainUnmountableAggApi<
  STATES extends CustomerStateRecords<STATES>,
  ACTIONS extends CustomerActionRecords<ACTIONS>,
  EVENTS extends CustomerEventRecords<EVENTS>
> = Readonly<{
  states: DomainStatesApi<STATES>
  actions: DomainActionsApi<ACTIONS>
  events: DomainUnmountableEventsApi<EVENTS>
  destroy: DestroyFunction
}>

export type DomainAggApi<
  STATES extends CustomerStateRecords<STATES>,
  ACTIONS extends CustomerActionRecords<ACTIONS>,
  EVENTS extends CustomerEventRecords<EVENTS>
> = Readonly<{
  states: DomainStatesApi<STATES>
  actions: DomainActionsApi<ACTIONS>
  events: DomainEventsApi<EVENTS>
}>

export function createUnmountableAggApi<
  STATES extends CustomerStateRecords<STATES>,
  ACTIONS extends CustomerActionRecords<ACTIONS>,
  EVENTS extends CustomerEventRecords<EVENTS>
>(option: {
  states: STATES
  actions: ACTIONS
  events: EVENTS
  destroy: DestroyFunction
}): DomainUnmountableAggApi<STATES, ACTIONS, EVENTS> {
  return createAggApiContent(option) as unknown as DomainUnmountableAggApi<STATES, ACTIONS, EVENTS>
}

export function createAggApi<
  STATES extends CustomerStateRecords<STATES>,
  ACTIONS extends CustomerActionRecords<ACTIONS>,
  EVENTS extends CustomerEventRecords<EVENTS>
>(option: {
  states: STATES
  actions: ACTIONS
  events: EVENTS
  destroy: DestroyFunction
}): DomainAggApi<STATES, ACTIONS, EVENTS> {
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
  destroy: DestroyFunction
}): {
  states: DomainStatesApi<STATES>
  actions: DomainActionsApi<ACTIONS>
  events: DomainEventsApi<EVENTS>
  destroy: DestroyFunction
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

export type DomainUnmountableAgg<
  ID,
  STATES extends CustomerStateRecords<STATES>,
  ACTIONS extends CustomerActionRecords<ACTIONS>,
  EVENTS extends CustomerEventRecords<EVENTS>
> = {
  readonly id: ID
  readonly api: DomainUnmountableAggApi<STATES, ACTIONS, EVENTS>
}

export type DomainAgg<
  STATES extends CustomerStateRecords<STATES>,
  ACTIONS extends CustomerActionRecords<ACTIONS>,
  EVENTS extends CustomerEventRecords<EVENTS>
> = {
  readonly api: DomainAggApi<STATES, ACTIONS, EVENTS>
}

export function createUnmountableAgg<
  ID,
  STATES extends CustomerStateRecords<STATES>,
  ACTIONS extends CustomerActionRecords<ACTIONS>,
  EVENTS extends CustomerEventRecords<EVENTS>
>(
  id: ID,
  init: (context: {
    getCurrentScope: () => EffectScope
    onScopeDispose: (fn: () => void, failSilently?: boolean) => void
  }) => {
    states?: STATES
    actions?: ACTIONS
    events?: EVENTS
    destroy?: DestroyFunction
  }
): DomainUnmountableAgg<ID, STATES, ACTIONS, EVENTS> {
  const scope = effectScope()
  const result = scope.run(() =>
    init({
      getCurrentScope() {
        return scope
      },
      onScopeDispose,
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

  let destroy = result.destroy as DestroyFunction
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
    }) as DestroyFunction
  }
  return {
    id,
    api: createUnmountableAggApi({
      states,
      actions,
      events: eventsExt as unknown as EVENTS,
      destroy,
    }),
  }
}

export function createAgg<
  STATES extends CustomerStateRecords<STATES>,
  ACTIONS extends CustomerActionRecords<ACTIONS>,
  EVENTS extends CustomerEventRecords<EVENTS>
>(
  init: () => {
    states?: STATES
    actions?: ACTIONS
    events?: EVENTS
  }
): DomainAgg<STATES, ACTIONS, EVENTS> {
  const result = init()
  const states = (result.states || {}) as STATES
  const actions = (result.actions || {}) as ACTIONS
  const events = (result.events || {}) as EVENTS
  return {
    api: createAggApi({
      states,
      actions,
      events,
      destroy: () => {},
    }),
  }
}

const agg = createUnmountableAgg(1, () => {
  return {}
})

agg.api.events.destroyed.watchPublish(() => {})
