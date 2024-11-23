import { ref } from '@vue/reactivity'
import { createRequestEvent, createMultiInstanceAgg, createPluginHelperByAggCreator, createBroadcastEvent } from '..'
import { it } from '@jest/globals'

const aggMap: { [id: string]: ReturnType<typeof createAgg> } = {}

function createAgg(id: string) {
  return createMultiInstanceAgg(id, (context) => {
    context.onScopeDispose(() => {
      delete aggMap[id]
    })

    const name = ref(id)
    const status = ref('0')
    const loadData = ref<string>()
    const needLoadData = createRequestEvent({}, (s: string) => {
      loadData.value = s
    })
    context.onBeforeInitialize(async () => {
      await needLoadData.publishRequest({}).catch(() => {})
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
      actions: {
        untilInitialized: async () => context.untilInitialized,
        setStatus(s: string) {
          onStatusChanged.publish({ old: status.value, new: s })
          status.value = s
        },
      },
    }
  })
}

export const PluginHelper = createPluginHelperByAggCreator(createAgg)

export function useMultiInstaceAgg(id: string) {
  if (!aggMap[id]) {
    const agg = createAgg(id)
    PluginHelper.registerAgg(agg)
    aggMap[id] = agg
  }
  return aggMap[id].api
}

it('创建多实例', () => {})
