import {
  type UnwrapNestedRefs,
  type DeepReadonly,
  readonly,
  shallowReactive,
  shallowReadonly,
  EffectScope,
  effectScope,
  onScopeDispose,
} from '@vue/reactivity'
import {
  createDefaultDestroyedEvent,
  DomainDestroyedEvent,
  DomainDestroyedEventApi,
  DomainEvent,
  toEventApi,
} from './events'

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
  } & { destroyed: DeepReadonly<UnwrapNestedRefs<DomainDestroyedEventApi>> }
>

export type DomainUnmountableAggApi<STATES, ACTIONS, EVENTS, DESTROY> = Readonly<{
  states: ReadonlyStates<STATES>
  actions: ReadonlyActions<ACTIONS>
  events: ReadonlyUnmountableEvents<EVENTS>
  destroy: DESTROY
}>

export type DomainAggApi<STATES, ACTIONS, EVENTS> = Readonly<{
  states: ReadonlyStates<STATES>
  actions: ReadonlyActions<ACTIONS>
  events: ReadonlyEvents<EVENTS>
}>

export function createUnmountableAggApi<
  STATES extends { [k: string]: object },
  ACTIONS extends { [k: string]: Function },
  EVENTS extends { [name: string]: DomainEvent<any, any> } & { destroyed?: DomainDestroyedEvent },
  DESTROY extends Function
>(option: {
  states?: STATES
  actions?: ACTIONS
  events?: EVENTS
  destroy?: DESTROY
}): DomainUnmountableAggApi<STATES, ACTIONS, EVENTS, DESTROY> {
  return shallowReadonly(createAggApiContent(option)) as DomainUnmountableAggApi<STATES, ACTIONS, EVENTS, DESTROY>
}

export function createAggApi<
  STATES extends { [k: string]: object },
  ACTIONS extends { [k: string]: Function },
  EVENTS extends { [name: string]: DomainEvent<any, any> }
>(option: { states?: STATES; actions?: ACTIONS; events?: EVENTS }): DomainAggApi<STATES, ACTIONS, EVENTS> {
  const apiContent = createAggApiContent(option)
  return shallowReadonly({
    states: apiContent.states,
    actions: apiContent.actions,
    events: apiContent.events,
  })
}

function createAggApiContent<
  STATES extends { [k: string]: object },
  ACTIONS extends { [k: string]: Function },
  EVENTS extends { [name: string]: DomainEvent<any, any> },
  DESTROY extends Function
>(option: {
  states?: STATES
  actions?: ACTIONS
  events?: EVENTS
  destroy?: DESTROY
}): {
  states: ReadonlyStates<STATES>
  actions: ReadonlyActions<ACTIONS>
  events: ReadonlyEvents<EVENTS>
  destroy: DESTROY
} {
  if (!option.states) {
    option.states = {} as STATES
  }
  if (!option.actions) {
    option.actions = {} as ACTIONS
  }
  const destroy = (option.destroy || (() => {})) as DESTROY
  for (const k of Object.keys(option.states)) {
    ;(option.states as any)[k] = readonly(option.states[k])
  }
  const states = shallowReadonly(option.states) as ReadonlyStates<STATES>
  const actions = readonly(option.actions) as ReadonlyActions<ACTIONS>
  const events = option.events || {}
  for (const k in events) {
    ;(events as any)[k] = toEventApi((events as any)[k])
  }
  return {
    states,
    actions,
    events: shallowReadonly(shallowReactive(events)) as ReadonlyEvents<EVENTS>,
    destroy,
  }
}

export type DomainUnmountableAgg<ID, STATES, ACTIONS, EVENTS, DESTROY> = {
  readonly id: ID
  readonly api: DomainUnmountableAggApi<STATES, ACTIONS, EVENTS, DESTROY>
}

export type DomainAgg<STATES, ACTIONS, EVENTS> = {
  readonly api: DomainAggApi<STATES, ACTIONS, EVENTS>
}

export function createUnmountableAgg<
  ID,
  STATES extends { [k: string]: object },
  ACTIONS extends { [k: string]: Function },
  EVENTS extends { [name: string]: DomainEvent<any, any> } & { destroyed?: DomainDestroyedEvent },
  DESTROY extends (...args: any[]) => void
>(
  id: ID,
  init: (context: {
    getCurrentScope: () => EffectScope
    onScopeDispose: (fn: () => void, failSilently?: boolean) => void
  }) => {
    states?: STATES
    actions?: ACTIONS
    events?: EVENTS
    destroy?: DESTROY
  }
): DomainUnmountableAgg<ID, STATES, ACTIONS, EVENTS, DESTROY> {
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
  const events = (result.events || {}) as EVENTS
  let destroyedEvent: DomainDestroyedEvent | undefined
  if (!events.destroyed) {
    destroyedEvent = createDefaultDestroyedEvent()
    events.destroyed = destroyedEvent
  } else {
    destroyedEvent = events.destroyed
  }

  let destroy = result.destroy as DESTROY
  if (!destroy) {
    destroy = (() => {
      scope.stop()
      destroyedEvent?.trigger({})
      setTimeout(() => {
        for (const k in events) {
          const event = events[k]
          for (const handle of event.watchHandles) {
            handle.stop()
          }
        }
      })
    }) as DESTROY
  }
  return {
    id,
    api: createUnmountableAggApi({
      states,
      actions,
      events,
      destroy,
    }),
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
  return {
    api: createAggApi({
      states,
      actions,
      events,
    }),
  }
}
