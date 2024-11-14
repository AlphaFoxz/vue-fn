import { type Ref, ref } from '@vue/reactivity'

export function createPromiseCallback<CALLBACK extends (...args: any[]) => Error | void>(
  callback: CALLBACK,
  stopOnError: boolean = true
): {
  promise: Promise<void>
  callback: CALLBACK
  resolved: Ref<boolean>
  error: Ref<Error | undefined>
} {
  const errorRef = ref<Error>()
  let result: Error | true
  const resolvedRef = ref(false)
  let resolveEffect: Function = () => {}
  const proxyResolve = new Proxy(callback, {
    apply: function (target: CALLBACK, _thisArg: any, argumentsList: any[]) {
      let r = target(...argumentsList)
      if (r instanceof Error) {
        errorRef.value = r
        result = r
        if (stopOnError) {
          resolveEffect()
        }
      } else {
        resolvedRef.value = true
        errorRef.value = undefined
        result = true
        resolveEffect()
      }
    },
  }) as CALLBACK
  const promise = new Promise<void>((res) => {
    if ((stopOnError && result instanceof Error) || result === true) {
      return
    }
    resolveEffect = res
  })
  return {
    promise,
    callback: proxyResolve,
    resolved: resolvedRef,
    error: errorRef,
  }
}
