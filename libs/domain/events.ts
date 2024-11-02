import {
  type WatchHandle,
  DeepReadonly,
  UnwrapNestedRefs,
  readonly,
  shallowRef,
  triggerRef,
  watch,
} from '@vue/reactivity'

export type DomainEvent<T> = {
  watch: (callback: (data: DeepReadonly<UnwrapNestedRefs<T>>, version: number) => void) => WatchHandle
  trigger: () => void
}
export type DomainEventApi<T> = Omit<DomainEvent<T>, 'trigger'>

export function createAtomicEvent<T extends { [key: string]: object }>(data: T): DomainEvent<T> {
  const inner = shallowRef(data)
  const version = new SharedArrayBuffer(4)
  const sharedArray = new Int32Array(version)
  function atomicIncrement(index: number) {
    const previousValue = Atomics.add(sharedArray, index, 1)
    return previousValue + 1
  }
  return {
    watch: (callback: (data: DeepReadonly<UnwrapNestedRefs<T>>, version: number) => void) => {
      return watch(inner, () => {
        callback(readonly(data), atomicIncrement(0))
      })
    },
    trigger: () => {
      triggerRef(inner)
    },
  }
}

export function createEvent<T extends { [key: string]: object }>(data: T): DomainEvent<T> {
  const inner = shallowRef(data)
  let version = 0
  return {
    watch: (callback: (data: DeepReadonly<UnwrapNestedRefs<T>>, version: number) => void) => {
      return watch(inner, () => {
        callback(readonly(data), ++version)
      })
    },
    trigger: () => {
      triggerRef(inner)
    },
  }
}
export function toEventApi<T>(event: DomainEvent<T>): DomainEventApi<T> {
  return { watch: event.watch }
}
