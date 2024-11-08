import {
  type WatchHandle,
  DeepReadonly,
  Ref,
  UnwrapNestedRefs,
  readonly,
  ref,
  shallowReadonly,
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
  latestVersion: Ref<string>
  watch: (
    cb: (event: {
      data: DeepReadonly<UnwrapNestedRefs<T>>
      version: string
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
  _: T,
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
  let version = ref('0')
  const map: Record<
    string,
    [UnwrapNestedRefs<T>, Function | undefined, Function | undefined, Ref<boolean> | undefined]
  > = {}
  function updateEvent(data: UnwrapNestedRefs<T>, res?: U, rej?: (e: Error) => void, resolved?: Ref<boolean>) {
    const newVer = largeNumberIncrease(version.value)
    map[newVer] = [data, res, rej, resolved]
    version.value = newVer
  }

  const watchFn = (
    cb: (event: {
      data: DeepReadonly<UnwrapNestedRefs<T>>
      version: string
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
    latestVersion: readonly(version),
    watch: watchFn,
    trigger: (data: UnwrapNestedRefs<T>) => {
      if (!resolve) {
        updateEvent(data, undefined, undefined, undefined)
        return undefined as InferOptPromise<U>
      }
      const { promise, resolve: res, reject: rej, resolved } = createExtPromise(resolve, reject as (e: Error) => void)
      updateEvent(data, res, rej, resolved)
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
  _: T,
  resolve?: U,
  reject?: (e: Error) => void
): DomainEvent<T, U> {
  if (resolve && !reject) {
    reject = (e: Error) => {
      console.error(e)
    }
  }

  const eventLifetime: number = 5
  let version = ref('0')
  const map: Record<string, [UnwrapNestedRefs<T>, Function | undefined, Function | undefined]> = {}
  const alifeEvents: string[] = []

  function updateEvent(data: UnwrapNestedRefs<T>, res?: U, rej?: (e: Error) => void) {
    const newVer = largeNumberIncrease(version.value)
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
      version: string
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
    latestVersion: readonly(version),
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
  return shallowReadonly({ latestVersion: event.latestVersion, watch: event.watch })
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

function largeNumberIncrease(num1: string): string {
  if (+num1 < Number.MAX_SAFE_INTEGER) {
    return (parseInt(num1) + 1).toString()
  }

  // 反转字符串以便从最低位开始相加
  let str1 = num1.split('').reverse().join('')
  let str2 = '1'

  const maxLength = Math.max(str1.length, str2.length)
  let carry = 0
  let result = []

  for (let i = 0; i < maxLength; i++) {
    const digit1 = i < str1.length ? parseInt(str1[i], 10) : 0
    const digit2 = i < str2.length ? parseInt(str2[i], 10) : 0

    const sum = digit1 + digit2 + carry
    result.push(sum % 10) // 当前位的结果
    carry = Math.floor(sum / 10) // 计算进位
  }

  if (carry > 0) {
    result.push(carry)
  }

  // 反转结果并转换为字符串
  return result.reverse().join('')
}
