import { type ShallowRef, shallowRef } from '@vue/reactivity'

export interface TimeoutApi {
  resolve: ShallowRef<() => void>
  reject: ShallowRef<(error: Error) => void>
  reset: (ms?: number) => void
  promise: Promise<void>
  // Add other properties as needed
}

export function createTimeout(timeoutMs: number, timeoutError = new Error('timeout!')): TimeoutApi {
  let timeout: undefined | null | ReturnType<typeof setTimeout> = undefined
  let resolve = shallowRef(() => {
    if (!timeout) {
      timeout = null
      return
    }
    clearTimeout(timeout!)
    timeout = null
  })
  let reject = shallowRef((_: Error) => {})
  const reset = (ms: number = timeoutMs) => {
    if (!timeout) {
      return
    }
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      reject.value(timeoutError)
    }, ms)
    timeoutMs = ms
  }
  let promise = new Promise<void>((innerResolve, innerReject) => {
    if (timeout === null) {
      innerResolve()
      return
    }
    timeout = setTimeout(() => {
      innerReject(timeoutError)
    }, timeoutMs)
    resolve.value = () => {
      innerResolve()
      clearTimeout(timeout!)
      timeout = null
    }
    reject.value = () => {
      innerReject(timeoutError)
    }
  })
  const api: TimeoutApi = {
    resolve,
    reject,
    reset,
    promise,
  }
  return api
}
