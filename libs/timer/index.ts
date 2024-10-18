import { type ShallowRef, shallowRef } from '@vue/reactivity'

export interface TimeoutApi {
  resolve: ShallowRef<() => void>
  reset: (ms?: number) => void
  isTimeout: ShallowRef<boolean>
  promise: Promise<void>
}

export function createTimeout(timeoutMs: number, onTimeout: Error | (() => void) = new Error('timeout!')): TimeoutApi {
  let timeout: undefined | null | ReturnType<typeof setTimeout> = undefined
  const isTimeout = shallowRef(false)
  let resolve = shallowRef(() => {
    if (!timeout) {
      timeout = null
      return
    }
    clearTimeout(timeout!)
    timeout = null
  })
  let reject = shallowRef((e: Error | (() => void)) => {
    isTimeout.value = true
    if (e instanceof Error) {
      throw e
    } else {
      e()
    }
  })
  const reset = (ms: number = timeoutMs) => {
    if (!timeout) {
      return
    }
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      reject.value(onTimeout)
    }, ms)
    timeoutMs = ms
  }
  let promise = new Promise<void>((innerResolve, innerReject) => {
    if (timeout === null) {
      innerResolve()
      return
    }
    timeout = setTimeout(() => {
      reject.value(onTimeout)
    }, timeoutMs)
    resolve.value = () => {
      innerResolve()
      clearTimeout(timeout!)
      timeout = null
    }
    reject.value = (e: Error | (() => void)) => {
      isTimeout.value = true
      if (e instanceof Error) {
        innerReject(e)
      } else {
        e()
        innerResolve()
      }
    }
  })
  const api: TimeoutApi = {
    resolve,
    reset,
    promise,
    isTimeout,
  }
  return api
}
