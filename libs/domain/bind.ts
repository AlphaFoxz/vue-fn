import {
  type Reactive,
  type Ref,
  type ShallowRef,
  type ShallowReactive,
  type WatchCallback,
  type WatchOptions,
  isReactive,
  isRef,
  reactive,
  ref,
  unref,
  watch,
} from 'vue';
import { deepClone, isEqual } from './common';

type DomainAggState = DomainAggRefState | DomainAggReactiveState;
type DomainAggRefState = Readonly<Ref<any>> | Readonly<ShallowRef<any>>;
type DomainAggReactiveState = Readonly<Reactive<object>> | Readonly<ShallowReactive<object>>;
type SingleFieldRef = () => any;
type DeepMutable<T> = {
  -readonly [P in keyof T]: T[P] extends object ? DeepMutable<T[P]> : T[P];
};
type InferValue<T> = T extends () => infer R
  ? R
  : T extends Readonly<Ref<any>> | Readonly<ShallowRef<any>> | Ref<any> | ShallowRef<any>
    ? DeepMutable<T['value']>
    : T extends Readonly<Reactive<infer R>> | Readonly<ShallowReactive<infer R>> | Reactive<infer R>
      ? DeepMutable<R>
      : never;

export function bindRef<STATE extends DomainAggState | SingleFieldRef, T extends InferValue<STATE>>(
  aggState: STATE,
  onChange: WatchCallback<T>,
  watchOptions?: WatchOptions & { forceSync?: boolean },
): Ref<T> {
  const result = ref<T>(copyValue<T>(aggState));
  if (!watchOptions?.forceSync) {
    watch(result, onChange as any, watchOptions);
    return result as Ref<T>;
  }

  watchOptions.forceSync = undefined;
  let latestSyncValue: any;
  watch(
    aggState,
    (v) => {
      latestSyncValue = v;
      result.value = v;
    },
    watchOptions,
  );
  watch(
    result,
    (n, o, onCleanup) => {
      if (isEqual(n, latestSyncValue)) {
        return;
      }
      onChange(n as T, o, onCleanup);
    },
    watchOptions,
  );
  return result as Ref<T>;
}

export function bindReactive<
  STATE extends DomainAggReactiveState,
  T extends InferValue<STATE> & object,
>(
  aggState: STATE,
  onChange: WatchCallback<T>,
  watchOptions?: WatchOptions & { forceSync?: boolean },
): Reactive<T> {
  const result = reactive<T>(copyValue<T>(aggState));
  if (!watchOptions?.forceSync) {
    watch(result, onChange as any, watchOptions);
    return result as Reactive<T>;
  }

  watchOptions.forceSync = undefined;
  let isSyncing = false;
  watch(
    aggState,
    (v) => {
      isSyncing = true;
      const keys = Object.keys(v);
      for (const key of keys) {
        (result as any)[key] = (v as any)[key];
      }
      isSyncing = false;
    },
    watchOptions,
  );
  watch(
    result,
    (n, o, onCleanup) => {
      if (isSyncing) {
        return;
      }
      onChange(n as T, o, onCleanup);
    },
    watchOptions,
  );
  return result as Reactive<T>;
}

function copyValue<T>(state: DomainAggState | SingleFieldRef): T {
  let t: T;
  if (typeof state === 'function') {
    t = state();
  } else if (isReactive(state) || isRef(state)) {
    t = unref(state) as any;
  } else {
    throw new Error('invalid state');
  }
  if (typeof t === 'object') {
    t = deepClone(t);
  }
  return t;
}
