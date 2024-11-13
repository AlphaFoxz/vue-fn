import { type Ref, ref } from '@vue/reactivity'

type InferPromiseResult<T extends (...args: any[]) => any> = Exclude<ReturnType<T>, Error> extends
  | undefined
  | null
  | void
  | unknown
  ? { success: boolean; value: undefined; error?: Error }
  : { success: boolean; value: ReturnType<T>['value']; error?: Error }

export type Result<T> = { success: boolean; error?: Error; value?: T }

export function createPromiseCallback<
  V,
  CALLBACK extends (...args: any[]) => { value?: V; error?: Error } | void,
  R = ReturnType<CALLBACK>
>(
  callback: CALLBACK
): {
  promise: Promise<InferPromiseResult<CALLBACK>>
  callback: CALLBACK
  resolved: Ref<boolean>
  error: Ref<Error | undefined>
} {
  const errorRef = ref<Error>()
  let result: Result<V>
  const resolvedRef = ref(false)
  let resolveEffect: Function = () => {}
  const proxyResolve = new Proxy(callback, {
    apply: function (target: CALLBACK, _thisArg: any, argumentsList: any[]) {
      let r = target(...argumentsList)
      result = r as R & { success: boolean }
      if (r === undefined || Object.keys(r).length === 0) {
        result = { success: true } as R & { success: boolean }
      } else if (r.error) {
        errorRef.value = r.error
        result.success = false
      } else if (r.value) {
        result.success = true
      }
      if (result.success) {
        resolvedRef.value = true
        errorRef.value = undefined
      }
      resolveEffect(result)
      return result
    },
  }) as CALLBACK
  const promise = new Promise<InferPromiseResult<CALLBACK>>((res, rej) => {
    if (resolvedRef.value) {
      res(result as InferPromiseResult<CALLBACK>)
      return
    } else if (errorRef.value) {
      rej(errorRef.value)
      return
    }
    resolveEffect = () => {
      if (resolvedRef.value) {
        res(result as InferPromiseResult<CALLBACK>)
        return
      } else if (errorRef.value) {
        rej(errorRef.value)
        return
      }
    }
  })
  return {
    promise,
    callback: proxyResolve,
    resolved: resolvedRef,
    error: errorRef,
  }
}
