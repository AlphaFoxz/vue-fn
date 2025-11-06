import { reactive, ref } from 'vue';
import {
  createSingletonAgg,
  createRequestEvent,
  createPluginHelperByAgg,
  createBroadcastEvent,
} from '..';

const agg = createSingletonAgg((context) => {
  const name = ref('');
  const age = ref(0);
  const status = ref('0');
  const mapRef = ref({ a: 1, b: '2' });
  const mapReactive = reactive({ a: 1, b: '2' });
  const loadData = ref<string>();
  const needLoadData = createRequestEvent({}).options({
    onReply(s: string) {
      loadData.value = s;
    },
    onError() {},
  });
  context.onBeforeInitialize(async () => {
    await needLoadData.publishRequest({});
  });
  const onStatusChanged = createBroadcastEvent({ old: status, new: status });
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
      setMapRef(v: { a: number; b: string }) {
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

export const PluginHelper = createPluginHelperByAgg(agg);
PluginHelper.registerAgg(agg);

export function useSingletonAgg() {
  return agg.api;
}
