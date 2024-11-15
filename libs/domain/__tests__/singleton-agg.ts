import { ref } from 'vue'
import { type DomainSetupPlugin, createSingletonAgg, createRequestEvent, createPluginHelperByAgg } from '..'
import { it } from '@jest/globals'

const agg = createSingletonAgg((context) => {
  const loadData = ref<string>()
  const needLoadDataEvent = createRequestEvent({}, (s: string) => {
    loadData.value = s
  })
  context.onBeforeInitialize(async () => {
    await needLoadDataEvent.publishRequest({})
  })
  return {
    states: {
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

export const PluginHelper = createPluginHelperByAgg(agg)

export function useSingletonAgg() {
  return agg.api
}

export function registerSetupPlugin(plugin: DomainSetupPlugin<typeof agg>) {
  agg.trySetupPlugin(plugin)
}

it('创建单例', () => {})
