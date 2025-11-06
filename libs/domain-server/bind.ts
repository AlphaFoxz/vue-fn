import {
  watch,
  ref,
  Ref,
  ShallowRef,
  Reactive,
  ShallowReactive,
  isReactive,
  WatchCallback,
} from '@vue/reactivity';

type DomainAggState = DomainAggRefState | DomainAggReactiveState;
type DomainAggRefState = Readonly<Ref<any>> | Readonly<ShallowRef<any>>;
type DomainAggReactiveState = Readonly<Reactive<any>> | Readonly<ShallowReactive<any>>;
type DeepMutable<T> = {
  -readonly [P in keyof T]: T[P] extends object ? DeepMutable<T[P]> : T[P];
};
type InferValue<T> = T extends Readonly<Ref<any>> | Readonly<ShallowRef<any>>
  ? DeepMutable<T['value']>
  : T extends Readonly<Reactive<infer R>> | Readonly<ShallowReactive<infer R>>
  ? DeepMutable<R>
  : never;

export function bindRef<STATE extends DomainAggState, T = InferValue<STATE>>(
  aggState: STATE,
  onChange: WatchCallback<T, T>,
  forceSync: boolean = false
): Ref<T> {
  const result = ref(copyValue<T>(aggState));
  if (!forceSync) {
    watch(result, onChange as any, { deep: true });
    return result as ShallowRef<T>;
  }
  let latestSyncValue: any;
  watch(aggState, (v) => {
    result.value = v;
    latestSyncValue = v;
  });
  watch(result, (n, o, onCleanup) => {
    if (n === latestSyncValue) {
      return;
    }
    onChange(n, o, onCleanup);
  });
  return result as Ref<T>;
}

export function bindDeepRef<STATE extends DomainAggState, T = InferValue<STATE>>(
  aggState: STATE,
  onChange: WatchCallback<T, T>,
  forceSync: boolean = false
): Ref<T> {
  const result = ref(copyValue<T>(aggState));
  if (!forceSync) {
    watch(result, onChange as any, { deep: true });
    return result as ShallowRef<T>;
  }
  let latestSyncValue: any;
  watch(
    aggState,
    (v) => {
      latestSyncValue = v;
      result.value = v;
    },
    { deep: true }
  );
  watch(
    result,
    (n, o, onCleanup) => {
      if (n === latestSyncValue) {
        return;
      }
      onChange(n, o, onCleanup);
    },
    { deep: true }
  );
  return result as Ref<T>;
}

function copyValue<T>(state: DomainAggState): T {
  let t: T;
  if (isReactive(state)) {
    t = state as any;
  } else {
    t = state.value;
  }
  if (typeof t === 'object') {
    t = JSON.parse(JSON.stringify(t));
  }
  return t;
}
