import { ref } from '@vue/reactivity'
import { createSingletonAgg, createRequestEvent, createPluginHelperByAgg } from '..'
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

export const PluginHelper = createPluginHelperByAgg(agg)
PluginHelper.registerAgg(agg)

export function useSingletonAgg() {
  return agg.api
}

it('创建单例', () => {})
