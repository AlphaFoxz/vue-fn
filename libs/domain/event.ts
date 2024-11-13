import {
  type DeepReadonly,
  type UnwrapNestedRefs,
  type Ref,
  WatchHandle,
  readonly,
  watch,
  shallowRef,
  computed,
  shallowReactive,
} from 'vue'
import { createExternalPromise } from './common'

export type DomainEventData = { [key: string]: any }

export type DomainRequestEventCallback = (...args: any[]) => boolean

export type DomainRequestEventOnError = (...args: any[]) => boolean

export type DomainEvent<DATA extends DomainEventData, CALLBACK extends DomainRequestEventCallback> =
  | DomainRequestEvent<DATA, CALLBACK>
  | DomainBroadcastEvent<DATA>

export type DomainDestroyedEventApi = ReturnType<ReturnType<typeof createBroadcastEvent<{}>>['toApi']>

export type DomainRequestEvent<DATA extends DomainEventData, CALLBACK extends DomainRequestEventCallback> = ReturnType<
  typeof createRequestEvent<DATA, CALLBACK>
>

export type DomainBroadcastEvent<DATA extends DomainEventData> = ReturnType<typeof createBroadcastEvent<DATA>>

export function createRequestEvent<DATA extends DomainEventData, REPLY extends DomainRequestEventCallback>(
  _: DATA,
  reply: REPLY,
  onError?: DomainRequestEventOnError
) {
  if (!onError) {
    onError = ((_: Error) => true) as DomainRequestEventOnError
  }
  let version = shallowRef('0')
  const map: Record<
    string,
    {
      data: DeepReadonly<UnwrapNestedRefs<DATA>>
      reply: REPLY
      resolved: Ref<boolean>
      error: Ref<Error | undefined>
    }
  > = {}
  const watchHandles = shallowReactive<WatchHandle[]>([])
  function updateEvent(
    data: UnwrapNestedRefs<DATA>,
    rep: REPLY,
    resolved: Ref<boolean>,
    error: Ref<Error | undefined>
  ) {
    const newVer = largeNumberIncrease(version.value)
    map[newVer] = {
      data: readonly(data) as DeepReadonly<UnwrapNestedRefs<DATA>>,
      reply: rep,
      resolved,
      error,
    }
    version.value = newVer
  }

  const watchFn = (
    cb: (event: { data: DeepReadonly<UnwrapNestedRefs<DATA>>; version: string; reply: REPLY }) => void
  ) => {
    let tmpHandle: WatchHandle | undefined = undefined
    const handle = watch(version, (newVersion) => {
      if (!map[newVersion] || map[newVersion].resolved.value || map[newVersion].error.value) {
        return
      }
      tmpHandle = watch([map[newVersion].resolved, map[newVersion].error], ([resolved, error]) => {
        if (!map[newVersion] || resolved || error) {
          delete map[newVersion]
          tmpHandle?.()
          tmpHandle = undefined
        }
      })
      try {
        cb({
          data: map[newVersion].data,
          version: newVersion,
          reply: map[newVersion].reply,
        })
      } catch (e) {
        map[newVersion].error.value = e as Error
      }
    })
    watchHandles.push(handle)
    return handle
  }

  const publishFn = async (data: UnwrapNestedRefs<DATA>) => {
    const { promise, resolve: res, resolved, error } = createExternalPromise(reply, onError as (e: Error) => boolean)
    updateEvent(data, res, resolved, error)
    await promise
  }

  const api = {
    latestVersion: computed(() => version),
    watchPublishRequest: watchFn,
  }

  return {
    watchHandles,
    publishRequest: publishFn,
    toApi() {
      return api
    },
  }
}

export function createBroadcastEvent<DATA extends DomainEventData>(_: DATA) {
  const eventLifetime: number = 5
  let version = shallowRef('0')
  const map: Record<
    string,
    {
      data: DeepReadonly<UnwrapNestedRefs<DATA>>
    }
  > = {}
  const watchHandles = shallowReactive<WatchHandle[]>([])
  const alifeEvents: string[] = []
  function updateEvent(data: UnwrapNestedRefs<DATA>) {
    const newVer = largeNumberIncrease(version.value)
    map[newVer] = { data: readonly(data) as DeepReadonly<UnwrapNestedRefs<DATA>> }
    const x = alifeEvents.length - eventLifetime
    if (x > 0) {
      alifeEvents.splice(0, x)
    }
    version.value = newVer
    alifeEvents.push(newVer)
  }

  const watchFn = (cb: (event: { data: DeepReadonly<UnwrapNestedRefs<DATA>>; version: string }) => void) => {
    return watch(version, (newVersion) => {
      cb({
        data: map[newVersion].data,
        version: newVersion,
      })
    })
  }

  const api = {
    latestVersion: computed(() => version),
    watchPublish: watchFn,
  }
  return {
    ...api,
    watchHandles,
    publish: async (data: UnwrapNestedRefs<DATA>) => {
      updateEvent(data)
    },
    toApi() {
      return api
    },
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
