import { type Ref, DeepReadonly, readonly, shallowReactive, shallowReadonly, WatchHandle } from '@vue/reactivity'

export type ReadonlyStates<T> = {
  readonly [P in keyof T]: T[P] extends Ref
    ? DeepReadonly<Ref<T[P]['value']>>
    : T[P] extends object
    ? ReadonlyStates<T[P]>
    : Readonly<T[P]>
}

export type ReadonlyActions<T> = {
  readonly [P in keyof T]: T[P] extends Function ? T[P] : never
}

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

export type Store<STATES, ACTIONS, DESTORY> = {
  readonly api: Api<STATES, ACTIONS, DESTORY>
}

export type SingletonStore<STATES, ACTIONS> = {
  readonly api: SingletonApi<STATES, ACTIONS>
}

export function createStore<
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
): Store<STATES, ACTIONS, DESTORY> {
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

export function createSingletonStore<STATES extends { [k: string]: object }, ACTIONS extends { [k: string]: Function }>(
  init: () => { states?: STATES; actions?: ACTIONS }
): SingletonStore<STATES, ACTIONS> {
  const result = init()
  const states = (result.states || {}) as STATES
  const actions = (result.actions || {}) as ACTIONS
  return {
    api: createSingletonApi({
      states,
      actions,
    }),
  }
}
