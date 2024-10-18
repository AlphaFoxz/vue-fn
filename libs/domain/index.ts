import {
  type Ref,
  DeepReadonly,
  Reactive,
  readonly,
  shallowReactive,
  shallowReadonly,
  ShallowRef,
  WatchHandle,
} from '@vue/reactivity'

export type ReadonlyStates<STATES> = {
  readonly [K in keyof STATES]: STATES[K] extends Ref
    ? DeepReadonly<Ref<STATES[K]['value']>>
    : STATES[K] extends object
    ? ReadonlyStates<STATES[K]>
    : Readonly<STATES[K]>
}

export type ReadonlyActions<ACTIONS> = {
  readonly [K in keyof ACTIONS]: ACTIONS[K] extends Function ? ACTIONS[K] : never
}

type UniqueArray<T> = T extends readonly [infer X, ...infer Rest]
  ? InArray<Rest, X> extends true
    ? ['Encountered value with duplicates:', X]
    : readonly [X, ...UniqueArray<Rest>]
  : T

type InArray<T, X> = T extends readonly [X, ...infer _Rest]
  ? true
  : T extends readonly [X]
  ? true
  : T extends readonly [infer _, ...infer Rest]
  ? InArray<Rest, X>
  : false

export type Api<STATES, ACTIONS, DESTORY> = Readonly<{
  states: ReadonlyStates<STATES>
  actions: ReadonlyActions<ACTIONS>
  destory: DESTORY
}>

export type SingletonApi<STATES, ACTIONS> = Readonly<{
  states: ReadonlyStates<STATES>
  actions: ReadonlyActions<ACTIONS>
}>

export function createApi<
  STATES extends { [k: string]: object },
  ACTIONS extends { [k: string]: Function },
  DESTORY extends Function
>(option: { states?: STATES; actions?: ACTIONS; destory?: DESTORY }): Api<STATES, ACTIONS, DESTORY> {
  return shallowReadonly(createApiContent(option))
}

export function createSingletonApi<
  STATES extends { [k: string]: object },
  ACTIONS extends { [k: string]: Function }
>(option: { states?: STATES; actions?: ACTIONS }): SingletonApi<STATES, ACTIONS> {
  const apiContent = createApiContent(option)
  return shallowReadonly({
    states: apiContent.states,
    actions: apiContent.actions,
  })
}

function createApiContent<
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

export type Agg<STATES, ACTIONS, DESTORY> = {
  readonly api: Api<STATES, ACTIONS, DESTORY>
}

export type SingletonAgg<STATES, ACTIONS, TRIGGERS> = {
  readonly api: SingletonApi<STATES, ACTIONS>
  triggers: TRIGGERS
}

export function createAgg<
  STATES extends { [k: string]: object },
  ACTIONS extends { [k: string]: Function },
  DESTORY extends Function
>(
  run: (context: {
    defineEffect: <T extends WatchHandle>(t: T) => T
    getLastEffect: () => WatchHandle | undefined
    watchHandles: WatchHandle[]
  }) => {
    states?: STATES
    actions?: ACTIONS
    destory?: DESTORY
  }
): Agg<STATES, ACTIONS, DESTORY> {
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
  const result = run({
    defineEffect,
    getLastEffect,
    watchHandles,
  })
  const states = (result.states || {}) as STATES
  const actions = (result.actions || {}) as ACTIONS
  const destory = (result.destory ? result.destory : () => {}) as DESTORY
  return {
    api: shallowReadonly(
      createApi({
        states,
        actions,
        destory,
      })
    ),
  }
}

export function createSingletonAgg<
  STATES extends { [k: string]: object },
  ACTIONS extends { [k: string]: Function },
  TRIGGERS extends { [k: string]: ShallowRef<object> }
>(init: () => { states?: STATES; actions?: ACTIONS; triggers?: TRIGGERS }): SingletonAgg<STATES, ACTIONS, TRIGGERS> {
  const result = init()
  const states = (result.states || {}) as STATES
  const actions = (result.actions || {}) as ACTIONS
  const triggers = (result.triggers || {}) as TRIGGERS
  return {
    api: createSingletonApi({
      states,
      actions,
    }),
    triggers,
  }
}
