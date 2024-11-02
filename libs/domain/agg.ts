import {
  type UnwrapNestedRefs,
  type DeepReadonly,
  readonly,
  shallowReactive,
  shallowReadonly,
  WatchHandle,
  shallowRef,
  ShallowRef,
  triggerRef,
} from '@vue/reactivity'

export type ReadonlyStates<STATES> = Readonly<{
  [K in keyof STATES]: DeepReadonly<UnwrapNestedRefs<STATES[K]>>
}>

export type ReadonlyActions<ACTIONS> = Readonly<{
  [K in keyof ACTIONS]: ACTIONS[K] extends Function ? ACTIONS[K] : never
}>

export type ReadonlyEvents<EVENTS> = Readonly<{
  [K in keyof EVENTS]: Readonly<ShallowRef<EVENTS[K]>>
}>

export type UnmountableAggApi<STATES, ACTIONS, DESTORY> = Readonly<{
  states: ReadonlyStates<STATES>
  actions: ReadonlyActions<ACTIONS>
  destory: DESTORY
}>

export type AggApi<STATES, ACTIONS> = Readonly<{
  states: ReadonlyStates<STATES>
  actions: ReadonlyActions<ACTIONS>
}>

export function createUnmountableAggApi<
  STATES extends { [k: string]: object },
  ACTIONS extends { [k: string]: Function },
  DESTORY extends Function
>(option: { states?: STATES; actions?: ACTIONS; destory?: DESTORY }): UnmountableAggApi<STATES, ACTIONS, DESTORY> {
  return shallowReadonly(createAggApiContent(option))
}

export function createAggApi<
  STATES extends { [k: string]: object },
  ACTIONS extends { [k: string]: Function }
>(option: { states?: STATES; actions?: ACTIONS }): AggApi<STATES, ACTIONS> {
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

export type UnmountableAgg<STATES, ACTIONS, EVENTS, DESTORY> = {
  readonly api: UnmountableAggApi<STATES, ACTIONS, DESTORY>
  events: ReadonlyEvents<EVENTS>
}

export type Agg<STATES, ACTIONS, EVENTS> = {
  readonly api: AggApi<STATES, ACTIONS>
  events: ReadonlyEvents<EVENTS>
}

export function createUnmountableAgg<
  STATES extends { [k: string]: object },
  ACTIONS extends { [k: string]: Function },
  DESTORY extends Function,
  EVENTS extends { [name: string]: { callback?: Function } },
  EVENTKEYS extends Extract<keyof EVENTS, string>
>(
  init: (context: {
    context: {
      defineEffect: <T extends WatchHandle>(t: T) => T
      getLastEffect: () => WatchHandle | undefined
      watchHandles: WatchHandle[]
      triggerEvent: (name: EVENTKEYS) => void
    }
  }) => {
    states?: STATES
    actions?: ACTIONS
    destory?: DESTORY
    events?: EVENTS
  }
): UnmountableAgg<STATES, ACTIONS, EVENTS, DESTORY> {
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
  function triggerEvent(name: EVENTKEYS) {
    triggerRef(events[name as any] as any)
  }
  const result = init({
    context: {
      defineEffect,
      getLastEffect,
      watchHandles,
      triggerEvent,
    },
  })
  const states = (result.states || {}) as STATES
  const actions = (result.actions || {}) as ACTIONS
  const destory = (result.destory ? result.destory : () => {}) as DESTORY
  const events = (result.events || {}) as EVENTS
  return {
    api: shallowReadonly(
      createUnmountableAggApi({
        states,
        actions,
        destory,
      })
    ),
    events: shallowReactive(events) as ReadonlyEvents<EVENTS>,
  }
}

export function createAgg<
  STATES extends { [k: string]: object },
  ACTIONS extends { [k: string]: Function },
  EVENTS extends { [name: string]: { callback?: Function } },
  EVENTKEYS extends Extract<keyof EVENTS, string>
>(
  init: (context: { context: { triggerEvent: (name: EVENTKEYS) => void } }) => {
    states?: STATES
    actions?: ACTIONS
    events?: EVENTS
  }
): Agg<STATES, ACTIONS, EVENTS> {
  function triggerEvent(name: EVENTKEYS) {
    triggerRef(events[name as any] as any)
  }
  const result = init({ context: { triggerEvent } })
  const states = (result.states || {}) as STATES
  const actions = (result.actions || {}) as ACTIONS
  const events = (result.events || {}) as EVENTS
  for (const k of Object.keys(events)) {
    if (events[k]) {
      ;(events as any)[k] = shallowRef(events[k])
    }
  }
  return {
    api: createAggApi({
      states,
      actions,
    }),
    events: shallowReactive(events) as ReadonlyEvents<EVENTS>,
  }
}
