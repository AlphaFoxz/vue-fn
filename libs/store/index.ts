import { type Ref, readonly, shallowReadonly } from '@vue/reactivity'

export function defineApi<
  S1 extends { [k: string]: object },
  S2 extends { [k: string]: object },
  A1 extends { [k: string]: Function },
  A2 extends { [k: string]: Function }
>(option: { _state?: S1; state?: S2; _action?: A1; action?: A2 }) {
  type ReadonlyStates<T> = {
    readonly [P in keyof T]: T[P] extends Ref
      ? Readonly<Ref<T[P]['value']>>
      : T[P] extends object
      ? Readonly<T[P]>
      : ReadonlyStates<T[P]>
  }
  type ReadonlyActions<T> = {
    readonly [P in keyof T]: T[P] extends Function ? T[P] : never
  }
  const _state = shallowReadonly(option._state || {}) as ReadonlyStates<S1>
  const state = shallowReadonly(option.state || {}) as ReadonlyStates<S2>
  const _action = readonly(option._action || {}) as ReadonlyActions<A1>
  const action = readonly(option.action || {}) as ReadonlyActions<A2>
  return shallowReadonly({
    _state,
    state,
    _action,
    action,
  })
}

export {}
