import { ref, shallowReactive } from 'vue'
import {
  createRequestEvent,
  createMultiInstanceAgg,
  createPluginHelperByAggCreator,
  createBroadcastEvent,
} from '..'

export const aggMap: { [id: string]: ReturnType<typeof createAgg> } =
  shallowReactive({})
export const onDestroyCallbacked = ref(false)

function createAgg(id: string) {
  return createMultiInstanceAgg(id, (context) => {
    context.onScopeDispose(() => {
      delete aggMap[id]
    })

    const name = ref(id)
    const status = ref('0')
    const loadData = ref<string>()
    const needLoadData = createRequestEvent({}).options({
      onReply(s: string) {
        loadData.value = s
      },
    })
    context.onBeforeInitialize(async () => {
      await needLoadData.publishRequest({})
    })
    const onStatusChanged = createBroadcastEvent({ old: status, new: status })
    return {
      events: {
        needLoadData,
        onStatusChanged,
      },
      states: {
        name,
        status,
        loadData,
        initialized: context.isInitialized,
      },
      commands: {
        untilInitialized: async () => context.untilInitialized,
        setStatus(s: string) {
          onStatusChanged.publish({ old: status.value, new: s })
          status.value = s
        },
      },
    }
  })
}

export const PluginHelper = createPluginHelperByAggCreator(
  createAgg,
  (_agg) => {
    // delete aggMap[agg.__id]
    onDestroyCallbacked.value = true
  }
)

export function useMultiInstaceAgg(id: string) {
  if (!aggMap[id]) {
    const agg = createAgg(id)
    PluginHelper.registerAgg(agg)
    aggMap[id] = agg
  }
  return aggMap[id].api
}
