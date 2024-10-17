import { type Ref, DeepReadonly, readonly, shallowReadonly, WatchHandle } from '@vue/reactivity'

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

export type Api<STATE, ACTION> = Readonly<{
  state: ReadonlyStates<STATE>
  action: ReadonlyActions<ACTION>
  destory: () => void
}>

export type SingletonApi<STATE, ACTION> = Readonly<{
  state: ReadonlyStates<STATE>
  action: ReadonlyActions<ACTION>
}>

export function createApi<STATES extends { [k: string]: object }, ACTIONS extends { [k: string]: Function }>(option: {
  state?: STATES
  action?: ACTIONS
  destory?: () => void
}): Api<STATES, ACTIONS> {
  return shallowReadonly(createApiContent(option))
}

export function createSingletonApi<
  STATES extends { [k: string]: object },
  ACTIONS extends { [k: string]: Function }
>(option: { state?: STATES; action?: ACTIONS }): SingletonApi<STATES, ACTIONS> {
  const apiContent = createApiContent(option)
  return shallowReadonly({
    state: apiContent.state,
    action: apiContent.action,
  })
}

function createApiContent<S extends { [k: string]: object }, A extends { [k: string]: Function }>(option: {
  state?: S
  action?: A
  destory?: () => void
}) {
  if (!option.state) {
    option.state = {} as S
  }
  if (!option.action) {
    option.action = {} as A
  }
  if (!option.destory) {
    option.destory = () => {}
  }
  for (const k of Object.keys(option.state)) {
    ;(option.state as any)[k] = readonly(option.state[k])
  }
  const state = shallowReadonly(option.state || {}) as ReadonlyStates<S>
  const action = readonly(option.action || {}) as ReadonlyActions<A>
  return {
    state,
    action,
    destory() {},
  }
}

type Store<STATES, ACTIONS> = {
  readonly api: Api<STATES, ACTIONS>
}

type SingletonStore<STATES, ACTIONS> = {
  readonly api: SingletonApi<STATES, ACTIONS>
}

//TODO: 待设计完善
function createStore<STATES extends { [k: string]: object }, ACTIONS extends { [k: string]: Function }>(
  run: (context: {
    defineStates: (states: STATES) => void
    defineActions: (actions: ACTIONS) => void
    defineEffect: <T extends WatchHandle>(t: T) => T
  }) => void
): Store<STATES, ACTIONS> {
  let state = {} as STATES
  let action = {} as ACTIONS
  const watchEffect: WatchHandle[] = []
  function defineStates(states: STATES) {
    state = Object.assign(state, states)
  }
  function defineActions(actions: ACTIONS) {
    action = Object.assign(action, actions)
  }
  function defineEffect<T extends WatchHandle>(t: T) {
    watchEffect.push(t)
    return t
  }
  run({
    defineStates,
    defineActions,
    defineEffect,
  })
  return {
    api: shallowReadonly(
      createApi({
        state,
        action,
        destory: () => {
          for (const handle of watchEffect) {
            handle.stop()
          }
        },
      })
    ),
  }
}

export function createSingletonStore<STATES extends { [k: string]: object }, ACTIONS extends { [k: string]: Function }>(
  run: (context: { defineStates: (states: STATES) => void; defineActions: (actions: ACTIONS) => void }) => void
): SingletonStore<STATES, ACTIONS> {
  let state = {} as STATES
  let action = {} as ACTIONS
  function defineStates(states: STATES) {
    state = Object.assign(state, states)
  }
  function defineActions(actions: ACTIONS) {
    action = Object.assign(action, actions)
  }
  run({
    defineStates,
    defineActions,
  })
  return {
    api: shallowReadonly(createSingletonApi({ state, action })),
  }
}
