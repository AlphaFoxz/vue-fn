import { ref } from '@vue/reactivity'
import { createSingletonAgg, createRequestEvent, createPluginHelperByAgg, createBroadcastEvent } from '..'
import { it } from 'vitest'

const agg = createSingletonAgg((context) => {
  const name = ref('')
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
    commands: {
      untilInitialized: async () => context.untilInitialized,
      setStatus(s: string) {
        onStatusChanged.publish({ old: status.value, new: s })
        status.value = s
      },
    },
  }
})

export const PluginHelper = createPluginHelperByAgg(agg)
PluginHelper.registerAgg(agg)

export function useSingletonAgg() {
  return agg.api
}

it('创建单例', () => {})
