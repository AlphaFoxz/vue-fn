import {
  type WatchHandle,
  DeepReadonly,
  UnwrapNestedRefs,
  readonly,
  ref,
  shallowReadonly,
  shallowRef,
  watch,
} from '@vue/reactivity'

type InferOptResolve<T> = T extends Function ? T : undefined
type InferOptReject<T> = T extends Function ? (e: Error) => void : undefined
type InferOptPromise<T> = T extends (...args: any[]) => any ? Promise<void> : undefined

export type DomainEventArgs = { [key: string]: any }
export type DomainDestroyedEvent = DomainEvent<{}, undefined>
export type DomainDestroyedEventApi = DomainEventApi<{}, undefined>
export function createDefaultDestroyedEvent(): DomainDestroyedEvent {
  return createEvent({})
}

export type DomainEvent<T, U> = {
  data: DeepReadonly<UnwrapNestedRefs<T>>
  watch: (
    cb: (event: {
      data: DeepReadonly<UnwrapNestedRefs<T>>
      version: number
      resolve: InferOptResolve<U>
      reject: InferOptReject<U>
    }) => void
  ) => WatchHandle
  trigger: (data: UnwrapNestedRefs<T>) => InferOptPromise<U>
}

export function createEvent<T extends DomainEventArgs>(data: T): DomainEvent<T, undefined>
export function createEvent<T extends DomainEventArgs, U extends (...args: any[]) => any, E extends Error>(
  data: T,
  resolve?: U,
  reject?: (e: Error) => void
): DomainEvent<T, U>
export function createEvent<T extends DomainEventArgs, U extends (...args: any[]) => any>(
  data: T,
  resolve?: U,
  reject?: (e: Error) => void
): DomainEvent<T, U> {
  if (resolve && !reject) {
    reject = (e: Error) => {
      console.error(e)
    }
  }
  const inner = shallowRef(data)
  let version = ref(0)
  const map: Record<number, [UnwrapNestedRefs<T>, Function | undefined, Function | undefined]> = {}

  const watchFn = (
    cb: (event: {
      data: DeepReadonly<UnwrapNestedRefs<T>>
      version: number
      resolve: InferOptResolve<U>
      reject: InferOptReject<U>
    }) => void
  ) => {
    return watch(version, (newVersion) => {
      cb({
        data: readonly(map[newVersion][0]) as DeepReadonly<UnwrapNestedRefs<T>>,
        version: newVersion,
        resolve: map[newVersion][1] as InferOptResolve<U>,
        reject: map[newVersion][2] as InferOptReject<U>,
      })
    })
  }
  return {
    data: inner.value,
    watch: watchFn,
    trigger: (data: UnwrapNestedRefs<T>) => {
      if (!resolve) {
        map[version.value + 1] = [data, undefined, undefined]
        version.value++
        return undefined as InferOptPromise<U>
      }
      const { resolve: res, reject: rej, promise } = createPromise(resolve, reject as (e: Error) => void)
      map[version.value + 1] = [data, res, rej]
      version.value++
      return promise as InferOptPromise<U>
    },
  }
}

export type DomainEventApi<T, U> = Omit<Readonly<DomainEvent<T, U>>, 'trigger'>

export function toEventApi<T, U>(event: DomainEvent<T, U>): DomainEventApi<T, U> {
  return shallowReadonly({ data: event.data, watch: event.watch })
}

function createPromise<T extends (...args: any[]) => void, E extends (...args: any[]) => void>(
  resolve: T,
  reject: E
): { resolve: T; reject: E; promise: Promise<void> } {
  let resolveEffect: Function
  const proxyResolve = new Proxy(resolve, {
    apply: function (target: T, _thisArg: any, argumentsList: any[]) {
      ;(resolveEffect as any)()
      return target(...argumentsList)
    },
  })
  let rejectEffect: Function
  let proxyReject = new Proxy(reject, {
    apply: function (target: E, _thisArg: any, argumentsList: any[]) {
      ;(rejectEffect as any)(...argumentsList)
      return target(...argumentsList)
    },
  })
  const promise = new Promise<void>((res, rej) => {
    resolveEffect = () => {
      res()
    }

    rejectEffect = (e: Error) => {
      rej(e)
    }
    return { resolve, reject }
  })
  return {
    resolve: proxyResolve as T,
    reject: proxyReject as E,
    promise,
  }
}
