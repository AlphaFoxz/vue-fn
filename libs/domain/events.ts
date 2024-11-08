import {
  type WatchHandle,
  DeepReadonly,
  Ref,
  UnwrapNestedRefs,
  readonly,
  ref,
  shallowReadonly,
  shallowRef,
  watch,
} from '@vue/reactivity'

type InferOptResolve<T> = T extends Function ? T : undefined
type InferOptReject<T> = T extends Function ? (e: Error) => void : undefined
type InferOptPromise<T> = T extends (...args: any[]) => boolean ? Promise<void> : void

export type DomainEventArgs = { [key: string]: any }
export type DomainDestroyedEvent = DomainEvent<{}, undefined>
export type DomainDestroyedEventApi = DomainEventApi<{}, undefined>
export function createDefaultDestroyedEvent(): DomainDestroyedEvent {
  return createChannelEvent({})
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

export function createChannelEvent<T extends DomainEventArgs>(data: T): DomainEvent<T, undefined>
export function createChannelEvent<T extends DomainEventArgs, U extends (...args: any[]) => boolean | void>(
  data: T,
  resolve?: U,
  reject?: (e: Error) => void
): DomainEvent<T, U>
export function createChannelEvent<T extends DomainEventArgs, U extends (...args: any[]) => boolean | void>(
  data: T,
  resolve?: U,
  reject: (e: Error) => void = (e: Error) => {
    console.error(e)
  }
): DomainEvent<T, U> {
  if (resolve && !reject) {
    reject = (e: Error) => {
      console.error(e)
    }
  }
  const inner = shallowRef(data)
  let version = ref(0)
  const map: Record<
    number,
    [UnwrapNestedRefs<T>, Function | undefined, Function | undefined, Ref<boolean> | undefined]
  > = {}

  const watchFn = (
    cb: (event: {
      data: DeepReadonly<UnwrapNestedRefs<T>>
      version: number
      resolve: InferOptResolve<U>
      reject: InferOptReject<U>
    }) => void
  ) => {
    let handle1: WatchHandle | undefined = undefined
    const handle2 = watch(version, (newVersion) => {
      if (!map[newVersion]) {
        return
      }
      if (resolve) {
        handle1 = watch(map[newVersion][3]!, (resolved) => {
          if (resolved) {
            delete map[newVersion]
            handle()
          }
        })
      }
      cb({
        data: readonly(map[newVersion][0]) as DeepReadonly<UnwrapNestedRefs<T>>,
        version: newVersion,
        resolve: map[newVersion][1] as InferOptResolve<U>,
        reject: map[newVersion][2] as InferOptReject<U>,
      })
    })
    const handle = () => {
      if (handle1) {
        handle1()
      }
      handle2()
    }
    handle.pause = () => {
      if (handle1) {
        handle1.pause()
      }
      handle2.pause()
    }
    handle.stop = () => {
      if (handle1) {
        handle1.stop()
      }
      handle2.stop()
    }
    handle.resume = () => {
      if (handle1?.resume) {
        handle1.resume()
      }
      handle2.resume()
    }
    return handle as WatchHandle
  }
  return {
    data: inner.value,
    watch: watchFn,
    trigger: (data: UnwrapNestedRefs<T>) => {
      if (!resolve) {
        map[version.value + 1] = [data, undefined, undefined, undefined]
        version.value++
        return undefined as InferOptPromise<U>
      }
      const { promise, resolve: res, reject: rej, resolved } = createExtPromise(resolve, reject as (e: Error) => void)
      map[version.value + 1] = [data, res, rej, resolved]
      version.value++
      return promise as InferOptPromise<U>
    },
  }
}

export function createBroadcastEvent<T extends DomainEventArgs>(data: T): DomainEvent<T, undefined>
export function createBroadcastEvent<T extends DomainEventArgs, U extends (...args: any[]) => void>(
  data: T,
  resolve?: U,
  reject?: (e: Error) => void
): DomainEvent<T, U>
export function createBroadcastEvent<T extends DomainEventArgs, U extends (...args: any[]) => void>(
  data: T,
  resolve?: U,
  reject?: (e: Error) => void
): DomainEvent<T, U> {
  if (resolve && !reject) {
    reject = (e: Error) => {
      console.error(e)
    }
  }

  const eventLifetime: number = 5
  const inner = shallowRef(data)
  let version = ref(0)
  const map: Record<number, [UnwrapNestedRefs<T>, Function | undefined, Function | undefined]> = {}
  const alifeEvents: number[] = []
  function updateEvent(data: UnwrapNestedRefs<T>, res?: U, rej?: (e: Error) => void) {
    const newVer = version.value + 1
    map[newVer] = [data, res, rej]
    version.value = newVer
    const x = alifeEvents.length - eventLifetime
    if (x > 0) {
      alifeEvents.splice(0, x)
    }
    alifeEvents.push(newVer)
  }

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
        updateEvent(data, undefined, undefined)
        return undefined as InferOptPromise<U>
      }
      updateEvent(data, resolve, reject)
      return undefined as InferOptPromise<U>
    },
  }
}

export type DomainEventApi<T, U> = Omit<Readonly<DomainEvent<T, U>>, 'trigger'>

export function toEventApi<T, U>(event: DomainEvent<T, U>): DomainEventApi<T, U> {
  return shallowReadonly({ data: event.data, watch: event.watch })
}

function createExtPromise<T extends (...args: any[]) => boolean | void, E extends (...args: any[]) => void>(
  resolve: T,
  reject: E
): { resolved: Ref<boolean>; resolve: T; reject: E; promise: Promise<void> } {
  const resolved = ref(false)
  let resolveEffect: Function
  const proxyResolve = new Proxy(resolve, {
    apply: function (target: T, _thisArg: any, argumentsList: any[]) {
      ;(resolveEffect as any)()
      const result = target(...argumentsList)
      if (result) {
        resolved.value = true
      }
      return result
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
    resolved,
    resolve: proxyResolve as T,
    reject: proxyReject as E,
    promise,
  }
}
