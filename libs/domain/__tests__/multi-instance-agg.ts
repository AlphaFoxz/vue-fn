import { ref } from 'vue'
import {
  createRequestEvent,
  createMultiInstanceAgg,
  createPluginHelperByCreator as createPluginHelperByAggCreator,
} from '..'
import { it } from '@jest/globals'

const aggMap: { [id: string]: ReturnType<typeof createAgg> } = {}

function createAgg(id: string) {
  return createMultiInstanceAgg(id, (context) => {
    context.onScopeDispose(() => {
      delete aggMap[id]
    })

    const name = ref(id)
    const loadData = ref<string>()
    const needLoadDataEvent = createRequestEvent({}, (s: string) => {
      loadData.value = s
    })
    context.onBeforeInitialize(async () => {
      await needLoadDataEvent.publishRequest({})
    })
    return {
      states: {
        name,
        loadData,
        initialized: context.isInitialized,
      },
      events: {
        needLoadData: needLoadDataEvent,
      },
      actions: {
        untilInitialized: async () => context.untilInitialized,
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
