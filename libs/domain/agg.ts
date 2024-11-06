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

export type DomainUnmountableAggApi<STATES, ACTIONS, DESTROY> = Readonly<{
  states: ReadonlyStates<STATES>
  actions: ReadonlyActions<ACTIONS>
  destroy: DESTROY
}>

export type DomainAggApi<STATES, ACTIONS> = Readonly<{
  states: ReadonlyStates<STATES>
  actions: ReadonlyActions<ACTIONS>
}>

export function createUnmountableAggApi<
  STATES extends { [k: string]: object },
  ACTIONS extends { [k: string]: Function },
  DESTROY extends Function
>(option: {
  states?: STATES
  actions?: ACTIONS
  destroy?: DESTROY
}): DomainUnmountableAggApi<STATES, ACTIONS, DESTROY> {
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
  DESTROY extends Function
>(option: {
  states?: STATES
  actions?: ACTIONS
  destroy?: DESTROY
}): {
  states: ReadonlyStates<STATES>
  actions: ReadonlyActions<ACTIONS>
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
  return {
    states,
    actions,
    destroy,
  }
}

export type DomainUnmountableAgg<STATES, ACTIONS, EVENTS, DESTROY> = {
  readonly api: DomainUnmountableAggApi<STATES, ACTIONS, DESTROY>
  events: ReadonlyUnmountableEvents<EVENTS>
}

export type DomainAgg<STATES, ACTIONS, EVENTS> = {
  readonly api: DomainAggApi<STATES, ACTIONS>
  events: ReadonlyEvents<EVENTS>
}

export function createUnmountableAgg<
  STATES extends { [k: string]: object },
  ACTIONS extends { [k: string]: Function },
  DESTROY extends Function,
  EVENTS extends { [name: string]: DomainEvent<any, any> } & { destroyed?: DomainDestroyedEvent }
>(
  init: (context: {
    getCurrentScope: () => EffectScope
    onScopeDispose: (fn: () => void, failSilently?: boolean) => void
  }) => {
    states?: STATES
    actions?: ACTIONS
    destroy?: DESTROY
    events?: EVENTS
  }
): DomainUnmountableAgg<STATES, ACTIONS, EVENTS, DESTROY> {
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
  for (const k of Object.keys(events)) {
    ;(events as any)[k] = toEventApi(events[k])
  }
  const destroy = (
    result.destroy
      ? result.destroy
      : () => {
          scope.stop()
          destroyedEvent?.trigger({})
        }
  ) as DESTROY
  return {
    api: createUnmountableAggApi({
      states,
      actions,
      destroy,
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
