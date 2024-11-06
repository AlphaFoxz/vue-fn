import {
  type UnwrapNestedRefs,
  type DeepReadonly,
  readonly,
  shallowReactive,
  shallowReadonly,
  WatchHandle,
} from '@vue/reactivity'
import { createDefaultDestoryEvent, DomainDestoryEvent, DomainDestoryEventApi, DomainEvent, toEventApi } from './events'

export type ReadonlyStates<STATES> = Readonly<{
  [K in keyof STATES]: DeepReadonly<UnwrapNestedRefs<STATES[K]>>
}>

export type ReadonlyActions<ACTIONS> = Readonly<{
  [K in keyof ACTIONS]: ACTIONS[K] extends Function ? ACTIONS[K] : never
}>

export type ReadonlyEvents<EVENTS> = Readonly<{
  [K in keyof EVENTS]: DeepReadonly<
    UnwrapNestedRefs<
      // DomainEventApi<
      //   EVENTS[K] extends DomainEvent<infer T1, unknown> ? T1 : never,
      //   EVENTS[K] extends DomainEvent<unknown, infer T2> ? T2 : never
      // >
      Omit<EVENTS[K], 'trigger'>
    >
  >
}>

export type ReadonlyUnmountableEvents<EVENTS> = Readonly<
  {
    [K in keyof EVENTS]: DeepReadonly<UnwrapNestedRefs<Omit<EVENTS[K], 'trigger'>>>
  } & { destory: DeepReadonly<UnwrapNestedRefs<DomainDestoryEventApi>> }
>

export type DomainUnmountableAggApi<STATES, ACTIONS, DESTORY> = Readonly<{
  states: ReadonlyStates<STATES>
  actions: ReadonlyActions<ACTIONS>
  destory: DESTORY
}>

export type DomainAggApi<STATES, ACTIONS> = Readonly<{
  states: ReadonlyStates<STATES>
  actions: ReadonlyActions<ACTIONS>
}>

export function createUnmountableAggApi<
  STATES extends { [k: string]: object },
  ACTIONS extends { [k: string]: Function },
  DESTORY extends Function
>(option: {
  states?: STATES
  actions?: ACTIONS
  destory?: DESTORY
}): DomainUnmountableAggApi<STATES, ACTIONS, DESTORY> {
  return shallowReadonly(createAggApiContent(option))
}

export function createAggApi<
  STATES extends { [k: string]: object },
  ACTIONS extends { [k: string]: Function }
>(option: { states?: STATES; actions?: ACTIONS }): DomainAggApi<STATES, ACTIONS> {
  const apiContent = createAggApiContent(option)
  return shallowReadonly({
    states: apiContent.states,
    actions: apiContent.actions,
  })
}

function createAggApiContent<
  STATES extends { [k: string]: object },
  ACTIONS extends { [k: string]: Function },
  DESTORY extends Function
>(option: {
  states?: STATES
  actions?: ACTIONS
  destory?: DESTORY
}): {
  states: ReadonlyStates<STATES>
  actions: ReadonlyActions<ACTIONS>
  destory: DESTORY
} {
  if (!option.states) {
    option.states = {} as STATES
  }
  if (!option.actions) {
    option.actions = {} as ACTIONS
  }
  const destory = (option.destory || (() => {})) as DESTORY
  for (const k of Object.keys(option.states)) {
    ;(option.states as any)[k] = readonly(option.states[k])
  }
  const states = shallowReadonly(option.states) as ReadonlyStates<STATES>
  const actions = readonly(option.actions) as ReadonlyActions<ACTIONS>
  return {
    states,
    actions,
    destory,
  }
}

export type DomainUnmountableAgg<STATES, ACTIONS, EVENTS, DESTORY> = {
  readonly api: DomainUnmountableAggApi<STATES, ACTIONS, DESTORY>
  events: ReadonlyUnmountableEvents<EVENTS>
}

export type DomainAgg<STATES, ACTIONS, EVENTS> = {
  readonly api: DomainAggApi<STATES, ACTIONS>
  events: ReadonlyEvents<EVENTS>
}

export function createUnmountableAgg<
  STATES extends { [k: string]: object },
  ACTIONS extends { [k: string]: Function },
  DESTORY extends Function,
  EVENTS extends { [name: string]: DomainEvent<any, any> } & { destory?: DomainDestoryEvent }
>(
  init: (context: {
    context: {
      defineEffect: <T extends WatchHandle>(t: T) => T
      getLastEffect: () => WatchHandle | undefined
      watchHandles: WatchHandle[]
    }
  }) => {
    states?: STATES
    actions?: ACTIONS
    destory?: DESTORY
    events?: EVENTS
  }
): DomainUnmountableAgg<STATES, ACTIONS, EVENTS, DESTORY> {
  const watchHandles: WatchHandle[] = shallowReactive([])
  function defineEffect<T extends WatchHandle>(t: T): T {
    watchHandles.push(t)
    return t
  }
  function getLastEffect() {
    if (watchHandles.length === 0) {
      return undefined
    }
    return watchHandles[watchHandles.length - 1]
  }
  const result = init({
    context: {
      defineEffect,
      getLastEffect,
      watchHandles,
    },
  })
  const states = (result.states || {}) as STATES
  const actions = (result.actions || {}) as ACTIONS
  const destory = (
    result.destory
      ? result.destory
      : () => {
          destoryEvent?.trigger({})
          for (const handle of watchHandles) {
            handle()
          }
        }
  ) as DESTORY
  const events = (result.events || {}) as EVENTS
  let destoryEvent: DomainDestoryEvent | undefined
  if (!events.destory) {
    destoryEvent = createDefaultDestoryEvent()
    events.destory = destoryEvent
  } else {
    destoryEvent = events.destory
  }
  for (const k of Object.keys(events)) {
    ;(events as any)[k] = toEventApi(events[k])
  }
  return {
    api: createUnmountableAggApi({
      states,
      actions,
      destory,
    }),
    events: shallowReactive(events) as any,
  }
}

export function createAgg<
  STATES extends { [k: string]: object },
  ACTIONS extends { [k: string]: Function },
  EVENTS extends { [name: string]: DomainEvent<any, any> }
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
  for (const k of Object.keys(events)) {
    ;(events as any)[k] = toEventApi(events[k])
  }
  return {
    api: createAggApi({
      states,
      actions,
    }),
    events: shallowReactive(events) as ReadonlyEvents<EVENTS>,
  }
}
