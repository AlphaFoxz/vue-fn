import { ref } from 'vue'
import { type DomainSetupPlugin, createRequestEvent, createMultiInstanceAgg, createPluginHelperByCreator } from '..'
import { it } from '@jest/globals'

const aggMap: { [id: string]: ReturnType<typeof createAgg> } = {}
const plugins: DomainSetupPlugin<any>[] = []

function createAgg(id: string) {
  return createMultiInstanceAgg(id, (context) => {
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
        initialized: context.initialized,
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

export const PluginHelper = createPluginHelperByCreator(createAgg)

export function useMultiInstaceAgg(id: string) {
  if (!aggMap[id]) {
    const agg = createAgg(id)
    for (const p of plugins as any) {
      agg.trySetupPlugin(p)
    }
    aggMap[id] = agg
  }
  return aggMap[id].api
}

export function registerSetupPlugin(p: ReturnType<typeof PluginHelper.defineSetupPlugin>) {
  plugins.push(p)
}

it('创建单例', () => {})
