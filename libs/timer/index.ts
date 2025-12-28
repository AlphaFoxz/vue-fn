import { type DeepReadonly, type ShallowRef, type UnwrapNestedRefs, shallowRef } from 'vue';

export type TimeoutApi = {
  resolve: () => void;
  reset: (ms?: number) => void;
  isTimeout: ShallowRef<boolean>;
  promise: Promise<void>;
};

export function createTimeout(
  timeoutMs: number,
  onTimeout: Error | (() => void) = new Error('timeout!')
): TimeoutApi {
  let timeout: undefined | null | ReturnType<typeof setTimeout> = undefined;
  const isTimeout = shallowRef(false);
  let resolveEffect = () => {
    if (!timeout) {
      timeout = null;
      return;
    }
    clearTimeout(timeout!);
    timeout = null;
  };
  const resolve = new Proxy(() => void 0, {
    apply: function (_target: Function, _thisArg: any, argumentsList: any[]) {
      return (resolveEffect as any)(...argumentsList);
    },
  }) as typeof resolveEffect;
  let rejectEffect = (e: Error | (() => void)) => {
    isTimeout.value = true;
    if (e instanceof Error) {
      throw e;
    } else {
      e();
    }
  };
  const reject = new Proxy((_: Error | (() => void)) => void 0, {
    apply: function (_target: Function, _thisArg: any, argumentsList: any[]) {
      return (rejectEffect as any)(...argumentsList);
    },
  }) as typeof rejectEffect;
  const reset = (ms: number = timeoutMs) => {
    if (!timeout) {
      return;
    }
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      reject(onTimeout);
    }, ms);
    timeoutMs = ms;
  };
  let promise = new Promise<void>((innerResolve, innerReject) => {
    if (timeout === null) {
      innerResolve();
      return;
    }
    timeout = setTimeout(() => {
      reject(onTimeout);
    }, timeoutMs);
    resolveEffect = () => {
      innerResolve();
      clearTimeout(timeout!);
      timeout = null;
    };
    rejectEffect = (e: Error | (() => void)) => {
      isTimeout.value = true;
      if (e instanceof Error) {
        innerReject(e);
      } else {
        e();
        innerResolve();
      }
    };
  });
  const api: TimeoutApi = {
    resolve,
    reset,
    promise,
    isTimeout,
  };
  return api;
}

type InferResolve<T> = undefined | void | unknown extends T
  ? () => void
  : (data: T | PromiseLike<T>) => void;
type InferData<T> = undefined | void | unknown extends T
  ? unknown
  : DeepReadonly<UnwrapNestedRefs<T>>;
export function createDeferred<T, E = Error>() {
  type Data = InferData<T>;
  let resolve: InferResolve<Data>;
  let reject: (cause?: E) => void;
  const promise = new Promise<Data>((res, rej) => {
    resolve = res as any;
    reject = rej;
  });
  const exposeResolve = ((data?: Data): void => {
    resolve(data as any);
  }) as InferResolve<Data>;
  return {
    promise,
    resolve: exposeResolve,
    reject: (cause?: E) => {
      reject(cause);
    },
  };
}
