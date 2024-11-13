import { type Ref, ref } from '@vue/reactivity'

export function createExternalPromise<
  RESOLVE extends (...args: any[]) => boolean,
  REJECT extends (e: Error) => boolean
>(
  resolve: RESOLVE = (() => true) as RESOLVE,
  reject: REJECT = ((_: Error) => true) as REJECT
): { promise: Promise<void>; resolve: RESOLVE; reject: REJECT; resolved: Ref<boolean>; error: Ref<Error | undefined> } {
  const errorRef = ref<Error>()
  const resolvedRef = ref(false)
  let resolveEffect: Function
  const proxyResolve = new Proxy(resolve, {
    apply: function (target: RESOLVE, _thisArg: any, argumentsList: any[]) {
      ;(resolveEffect as any)()
      const result = target(...argumentsList)
      if (result) {
        resolvedRef.value = true
      }
      return result
    },
  })
  let rejectEffect: Function
  let proxyReject = new Proxy(reject, {
    apply: function (target: REJECT, _thisArg: any, argumentsList: [Error]) {
      ;(rejectEffect as any)(...argumentsList)
      errorRef.value = argumentsList[0]
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
    promise,
    resolve: proxyResolve,
    reject: proxyReject,
    resolved: resolvedRef,
    error: errorRef,
  }
}
