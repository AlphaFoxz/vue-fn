import { ComputedRef, ref, computed } from 'vue'

export function createPromiseCallback<CALLBACK extends (...args: any[]) => Error | void>(
  callback: CALLBACK,
  stopOnError: boolean = true,
  timeoutMs: number | false = false
): {
  promise: Promise<void>
  callback: CALLBACK
  resolved: ComputedRef<boolean>
  error: ComputedRef<Error | undefined>
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
          // resolveEffect()
          throw r
        }
      } else {
        resolvedRef.value = true
        errorRef.value = undefined
        result = true
        resolveEffect()
      }
    },
  }) as CALLBACK
  const promise = new Promise<void>((res, rej) => {
    if ((stopOnError && result instanceof Error) || result === true) {
      return
    }
    let timeout: undefined | ReturnType<typeof setTimeout> = undefined
    if (timeoutMs) {
      timeout = setTimeout(() => {
        const e = new Error('timeout!')
        errorRef.value = e
        rej(e)
      }, timeoutMs)
    }
    resolveEffect = () => {
      if (timeout) {
        clearTimeout(timeout)
        timeout = undefined
      }
      res()
    }
  })
  return {
    promise,
    callback: proxyResolve,
    resolved: computed(() => resolvedRef.value),
    error: computed(() => errorRef.value),
  }
}
