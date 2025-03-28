import { ComputedRef, ref, computed } from 'vue'
import { nanoid } from 'nanoid'

export function createPromiseCallback<CALLBACK extends (...args: any[]) => Error | void>(
  callback: CALLBACK,
  finishOnError: boolean = true,
  timeoutMs: number | false = false
): {
  promise: Promise<void>
  callback: CALLBACK
  onError: (e: Error) => void
  resolved: ComputedRef<boolean>
  error: ComputedRef<Error | undefined>
} {
  const errorRef = ref<Error>()
  let result: Error | true
  const resolvedRef = ref(false)
  let resolveEffect: Function = () => {}
  const resolve = new Proxy(callback, {
    apply: function (target: CALLBACK, _thisArg: any, argumentsList: any[]) {
      let r: Error | void = undefined
      try {
        r = target(...argumentsList)
      } catch (e: any) {
        r = e
      }
      if (r instanceof Error) {
        errorRef.value = r
        result = r
        if (finishOnError) {
          resolveEffect()
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
  const rejectEffect: (e: Error) => void = () => {}
  const reject = new Proxy(
    (e: Error) => {
      errorRef.value = e
    },
    {
      apply: function (target: CALLBACK, _thisArg: any, argumentsList: [Error]) {
        target(...argumentsList)
        rejectEffect(...argumentsList)
      },
    }
  )
  const promise = new Promise<void>((res, rej) => {
    if (finishOnError && result instanceof Error) {
      rej(result)
      return
    } else if (result === true) {
      res()
      return
    }
    let timeout: undefined | ReturnType<typeof setTimeout> = undefined
    if (timeoutMs) {
      timeout = setTimeout(() => {
        const e = new Error('timeout!')
        errorRef.value = e
        if (finishOnError) {
          rej(e)
        }
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
    callback: resolve,
    onError: reject,
    resolved: computed(() => resolvedRef.value),
    error: computed(() => errorRef.value),
  }
}

export function genId(): string {
  return nanoid()
}
