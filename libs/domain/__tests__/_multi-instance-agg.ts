import { reactive, ref, shallowReactive } from 'vue';
import {
  createRequestEvent,
  createMultiInstanceAgg,
  createPluginHelperByAggCreator,
  createBroadcastEvent,
} from '..';

export const aggMap: { [id: string]: ReturnType<typeof createAgg> } = shallowReactive({});
export const onDestroyCallbacked = ref(false);

function createAgg(id: string) {
  return createMultiInstanceAgg(id, (context) => {
    context.onScopeDispose(() => {
      delete aggMap[id];
    });

    const name = ref('');
    const age = ref(0);
    const status = ref('0');
    const mapRef = ref({ a: 1, b: '2' });
    const mapReactive = reactive({ a: 1, b: '2' });
    const loadData = ref<string>();
    const needLoadData = createRequestEvent<{}, string>().options({
      onReply(s: string) {
        loadData.value = s;
      },
      onError() {},
    });
    context.onBeforeInitialize(async () => {
      await needLoadData.publishRequest({});
    });
    const onStatusChanged = createBroadcastEvent<{ old: typeof status; new: typeof status }>();
    return {
      events: {
        needLoadData,
        onStatusChanged,
      },
      states: {
        name,
        age,
        mapRef,
        mapReactive,
        status,
        loadData,
        initialized: context.isInitialized,
      },
      commands: {
        untilInitialized: async () => context.untilInitialized,
        setName(v: string) {
          name.value = v;
        },
        setAge(v: number) {
          age.value = v;
        },
        setMapRef(v: { a: number; b: string; c?: { c: number } }) {
          mapRef.value = v;
        },
        setMapRefA(a: number) {
          mapRef.value.a = a;
        },
        setMapReactiveA(a: number) {
          mapReactive.a = a;
        },
        setMapReactive(v: { a: number; b: string }) {
          mapReactive.a = v.a;
          mapReactive.b = v.b;
        },
        setStatus(s: string) {
          onStatusChanged.publish({ old: status.value, new: s });
          status.value = s;
        },
      },
    };
  });
}

export const PluginHelper = createPluginHelperByAggCreator(createAgg, (_agg) => {
  // delete aggMap[agg.__id]
  onDestroyCallbacked.value = true;
});

export function useMultiInstaceAgg(id: string) {
  if (!aggMap[id]) {
    const agg = createAgg(id);
    PluginHelper.registerAgg(agg);
    aggMap[id] = agg;
  }
  return aggMap[id].api;
}
