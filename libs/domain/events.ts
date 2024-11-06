import {
  type WatchHandle,
  DeepReadonly,
  UnwrapNestedRefs,
  readonly,
  shallowRef,
  triggerRef,
  watch,
} from '@vue/reactivity'

type InferOptFunction<T> = T extends Function ? T : undefined

export type DomainDestoryEvent = DomainEvent<{}, () => void>
export function createDefaultDestoryEvent(callback: () => void): DomainDestoryEvent {
  return createEvent({}, callback)
}

export type DomainEvent<T, UX> = {
  data: DeepReadonly<UnwrapNestedRefs<T>>
  watch: (
    cb: (event: { data: DeepReadonly<UnwrapNestedRefs<T>>; version: number; callback: UX }) => void
  ) => WatchHandle
  trigger: (data: UnwrapNestedRefs<T>) => void
}

export function createEvent<T extends { [key: string]: object }, U extends undefined>(data: T): DomainEvent<T, U>
export function createEvent<T extends { [key: string]: object }, U extends Function>(
  data: T,
  callback: U
): DomainEvent<T, U>

export function createEvent<T extends { [key: string]: object }, U extends Function, UX = InferOptFunction<U>>(
  data: T,
  callback?: U
): DomainEvent<T, UX> {
  const inner = shallowRef(data)
  let triggerData: UnwrapNestedRefs<T>
  let version = 0
  const watchFn = (cb: (event: { data: DeepReadonly<UnwrapNestedRefs<T>>; version: number; callback: UX }) => void) => {
    return watch(inner, () => {
      cb({
        data: readonly(triggerData) as DeepReadonly<UnwrapNestedRefs<T>>,
        version: ++version,
        callback: callback as UX,
      })
    })
  }
  return {
    data: inner.value,
    watch: watchFn,
    trigger: (data: UnwrapNestedRefs<T>) => {
      triggerData = data
      triggerRef(inner)
    },
  }
}

export function toEventApi<T, U extends Function>(event: DomainEvent<T, U>, callback?: U) {
  return { callback, data: event.data, watch: event.watch }
}
