import { Deferred } from 'ts-deferred';
import type { DeepReadonly, UnwrapNestedRefs } from 'vue';

export type DomainRequestEventOptions<DATA, ON_REPLY extends (data: any) => void> = {
  dataType?: DATA;
  onReply: ON_REPLY;
  onError?: (e: Error) => void;
  maxListenerCount?: number;
  isTerminateOnError?: boolean;
  timeoutMs?: number | false;
};
export type DomainRequestEvent<DATA, REPLY_DATA> = {
  listeners: DomainRequestEventListener<DATA, REPLY_DATA>[];
  publishRequest: (data: DeepReadonly<UnwrapNestedRefs<DATA>>) => Promise<REPLY_DATA>;
  api: {
    readonly latestVersion: string;
    listenAndReply: (replyFn: DomainRequestEventListener<DATA, REPLY_DATA>) => () => void;
  };
};
export type DomainRequestEventListener<DATA, REPLY_DATA> = (param: {
  readonly data: DeepReadonly<UnwrapNestedRefs<DATA>>;
  readonly version: string;
}) => REPLY_DATA;

export type DomainBroadcastEvent<DATA> = {
  listeners: DomainBroadcastEventListener<DATA>[];
  publish: (data: DeepReadonly<UnwrapNestedRefs<DATA>>) => void;
  api: {
    readonly latestVersion: string;
    listen: (
      cb: (event: { data: DeepReadonly<UnwrapNestedRefs<DATA>>; version: string }) => void
    ) => () => void;
  };
};
export type DomainBroadcastEventListener<DATA> = (param: {
  readonly data: DeepReadonly<UnwrapNestedRefs<DATA>>;
  readonly version: string;
}) => void;

export type DomainDestroyedEventApi = DomainBroadcastEvent<{}>['api'];

export type DomainEvent<DATA, REPLY_DATA> =
  | DomainRequestEvent<DATA, REPLY_DATA>
  | DomainBroadcastEvent<DATA>;

export function createRequestEvent<EVT_DATA extends object = never, REPLY_DATA = void>() {
  function options<ON_REPLY extends (replyData: REPLY_DATA) => void>(
    options: DomainRequestEventOptions<EVT_DATA, ON_REPLY>
  ): DomainRequestEvent<EVT_DATA, REPLY_DATA> {
    let currentVersion = '0';
    let unconsumedEvent: {
      version: string;
      data: DeepReadonly<UnwrapNestedRefs<EVT_DATA>>;
      resolve: (data: REPLY_DATA) => void;
      reject: (e: Error) => void;
      timerId: NodeJS.Timeout | undefined;
    }[] = [];
    const listeners: DomainRequestEventListener<EVT_DATA, REPLY_DATA>[] = [];
    function updateEvent(
      data: DeepReadonly<UnwrapNestedRefs<EVT_DATA>>,
      resolve: (data: REPLY_DATA) => void,
      reject: (e: Error) => void,
      timerId: NodeJS.Timeout | undefined
    ) {
      const nextVer = largeNumberIncrease(currentVersion);
      currentVersion = nextVer;
      unconsumedEvent.push({
        version: nextVer,
        data,
        resolve,
        reject,
        timerId,
      });
      emitEvent();
    }
    function emitEvent() {
      if (unconsumedEvent.length === 0 || listeners.length === 0) {
        return;
      }
      for (const event of unconsumedEvent) {
        const { version, data, resolve, reject, timerId } = event;
        const context = {
          data,
          version,
        };
        for (const listener of listeners) {
          try {
            const replyData = listener(context);
            options.onReply(replyData);
            resolve(replyData);
            timerId && clearTimeout(timerId);
            // return await deferred.promise
          } catch (e: unknown) {
            if (options.onError && e instanceof Error) {
              options.onError(e);
              if (options.isTerminateOnError) {
                reject(e);
                timerId && clearTimeout(timerId);
              }
            } else {
              throw new Error('caught a unknown error' + (e?.toString() || e));
            }
          }
        }
        unconsumedEvent.shift();
      }
    }
    return {
      listeners,
      async publishRequest(data: DeepReadonly<UnwrapNestedRefs<EVT_DATA>>) {
        const deferred = new Deferred<REPLY_DATA>();
        let timerId: NodeJS.Timeout | undefined;
        if (options.timeoutMs) {
          timerId = setTimeout(() => {
            deferred.reject(new Error(`timeout: ${options.timeoutMs} ms`));
          }, options.timeoutMs);
        }
        updateEvent(data, deferred.resolve, deferred.reject, timerId);
        return await deferred.promise;
      },
      api: {
        get latestVersion() {
          return currentVersion;
        },
        listenAndReply(replyFn: DomainRequestEventListener<EVT_DATA, REPLY_DATA>): () => void {
          if (options.maxListenerCount && listeners.length >= options.maxListenerCount) {
            throw new Error('too many listeners. max limit: ' + options.maxListenerCount);
          }
          listeners.push(replyFn);
          emitEvent();
          return () => {
            const index = listeners.indexOf(replyFn);
            if (index !== -1) {
              listeners.splice(index, 1);
            }
          };
        },
      },
    };
  }
  return {
    options,
  };
}

export function createBroadcastEvent<
  EVT_DATA extends object = never
>(): DomainBroadcastEvent<EVT_DATA> {
  let currentVersion = '0';
  const listeners: DomainBroadcastEventListener<EVT_DATA>[] = [];
  return {
    listeners,
    publish(data: DeepReadonly<UnwrapNestedRefs<EVT_DATA>>) {
      const context = {
        data,
        version: largeNumberIncrease(currentVersion),
      };
      currentVersion = context.version;
      for (const listener of listeners) {
        listener(context);
      }
    },
    api: {
      get latestVersion() {
        return currentVersion;
      },
      listen(
        cb: (options: { data: DeepReadonly<UnwrapNestedRefs<EVT_DATA>>; version: string }) => void
      ): () => void {
        listeners.push(cb);
        return () => {
          const index = listeners.indexOf(cb);
          if (index >= 0) {
            listeners.splice(index, 1);
          }
        };
      },
    },
  };
}

export function largeNumberIncrease(num1: string): string {
  if (+num1 < Number.MAX_SAFE_INTEGER) {
    return (parseInt(num1) + 1).toString();
  }

  // 反转字符串以便从最低位开始相加
  let str1 = num1.split('').reverse().join('');
  let str2 = '1';

  const maxLength = Math.max(str1.length, str2.length);
  let carry = 0;
  let result = [];

  for (let i = 0; i < maxLength; i++) {
    const digit1 = i < str1.length ? parseInt(str1[i], 10) : 0;
    const digit2 = i < str2.length ? parseInt(str2[i], 10) : 0;

    const sum = digit1 + digit2 + carry;
    result.push(sum % 10); // 当前位的结果
    carry = Math.floor(sum / 10); // 计算进位
  }

  if (carry > 0) {
    result.push(carry);
  }

  // 反转结果并转换为字符串
  return result.reverse().join('');
}
