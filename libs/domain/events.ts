import {
  type WatchHandle,
  DeepReadonly,
  UnwrapNestedRefs,
  readonly,
  shallowReadonly,
  shallowRef,
  triggerRef,
  watch,
} from '@vue/reactivity'

type InferOptFunction<T> = T extends Function ? T : undefined

export type DomainEventArgs = { [key: string]: any }
export type DomainDestroyedEvent = DomainEvent<{}, undefined>
export type DomainDestroyedEventApi = DomainEventApi<{}, undefined>
export function createDefaultDestroyedEvent(): DomainDestroyedEvent {
  return createEvent({})
}

export type DomainEvent<T, U> = {
  data: DeepReadonly<UnwrapNestedRefs<T>>
  watch: (cb: (event: { data: DeepReadonly<UnwrapNestedRefs<T>>; version: number; callback: U }) => void) => WatchHandle
  trigger: (data: UnwrapNestedRefs<T>) => void
}

export function createEvent<T extends DomainEventArgs, U extends undefined>(data: T): DomainEvent<T, U>
export function createEvent<T extends DomainEventArgs, U extends Function>(data: T, callback: U): DomainEvent<T, U>
export function createEvent<T extends DomainEventArgs, U extends Function, UX = InferOptFunction<U>>(
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

export type DomainEventApi<T, U> = Omit<Readonly<DomainEvent<T, U>>, 'trigger'>

export function toEventApi<T, U>(event: DomainEvent<T, U>): DomainEventApi<T, U> {
  return shallowReadonly({ data: event.data, watch: event.watch })
}
