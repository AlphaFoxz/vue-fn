import { ComputedRef } from 'vue'
import type { DomainSingletonAgg, DomainMultiInstanceAgg } from './agg'
import { genId } from './common'

type DomainPluginType = 'Setup' | 'HotSwap'

type DomainAgg = DomainSingletonAgg<any, any, any> | DomainMultiInstanceAgg<any, any, any, any>

export type DomainPlugin<T extends DomainAgg> = DomainSetupPlugin<T> | DomainHotSwapPlugin<T>

export type DomainSetupPlugin<AGG extends DomainAgg> = {
  readonly __id: string
  readonly type: Extract<DomainPluginType, 'Setup'>
  readonly mount: (util: { api: NonNullable<AGG>['api']; __aggId: string; isInitialized: ComputedRef<boolean> }) => void
}

type DomainSetupPluginOptions<AGG extends DomainAgg> = ReturnType<DomainSetupPluginOptionsFn<AGG>>

type DomainSetupPluginOptionsFn<AGG extends DomainAgg> = () => {
  readonly mount: (util: { api: NonNullable<AGG>['api']; __aggId: string }) => void
}

export type DomainHotSwapPlugin<AGG extends DomainAgg> = {
  readonly __id: string
  readonly type: Extract<DomainPluginType, 'HotSwap'>
  readonly mount: (util: { api: NonNullable<AGG>['api']; __aggId: string }) => void
  readonly unmount: (util: { api: NonNullable<AGG>['api']; __aggId: string }) => void
}

export type DomainHotSwapPluginOptions<AGG extends DomainAgg> = ReturnType<DomainHotSwapPluginOptionsFn<AGG>>

export type DomainHotSwapPluginOptionsFn<AGG extends DomainAgg> = () => {
  mount: (util: { api: NonNullable<AGG>['api']; __aggId: string }) => void
  unmount: (util: { api: NonNullable<AGG>['api']; __aggId: string }) => void
}

function createPluginHelper<AGG extends DomainAgg>() {
  const setupPlugins: Record<string, DomainSetupPlugin<AGG>> = {}
  const hotSwapPlugins: Record<string, DomainHotSwapPlugin<AGG>> = {}
  const hotSwapPluginsCheck = new WeakMap<AGG, string[]>()
  const aggRecords: Record<string, AGG> = {}

  return Object.freeze({
    registerAgg(agg: AGG) {
      if (agg.isInitialized.value) {
        throw new Error('Agg must register before initialized')
      } else if (aggRecords[agg.__id]) {
        throw new Error('Agg already registered')
      } else if (agg.type === 'MultiInstance') {
        agg.api.events.destroyed.watchPublish(() => {
          delete aggRecords[agg.__id]
        })
      }
      aggRecords[agg.__id] = agg
      const applyedHotSwapPlugins: string[] = []
      for (const p of Object.values(setupPlugins)) {
        p.mount({ api: agg.api, __aggId: agg.__id, isInitialized: agg.isInitialized })
      }
      for (const p of Object.values(hotSwapPlugins)) {
        p.mount({ api: agg.api, __aggId: agg.__id })
        applyedHotSwapPlugins.push(p.__id)
      }
      hotSwapPluginsCheck.set(agg, applyedHotSwapPlugins)
    },
    createSetupPlugin(args: DomainSetupPluginOptions<AGG> | DomainSetupPluginOptionsFn<AGG>): DomainSetupPlugin<AGG> {
      let opts: undefined | DomainSetupPluginOptions<AGG> = undefined
      if (args instanceof Function) {
        opts = args()
      } else {
        opts = args
      }
      return Object.freeze({
        __id: genId(),
        type: 'Setup',
        mount(util: { api: NonNullable<AGG>['api']; __aggId: string; isInitialized: ComputedRef<boolean> }) {
          if (util.isInitialized.value) {
            throw new Error('Can not setup after initialized')
          }
          opts!.mount({ api: util.api, __aggId: util.__aggId })
        },
      })
    },
    createHotSwapPlugin(
      args: DomainHotSwapPluginOptions<AGG> | DomainHotSwapPluginOptionsFn<AGG>
    ): DomainHotSwapPlugin<AGG> {
      let opts: undefined | DomainHotSwapPluginOptions<AGG> = undefined
      if (args instanceof Function) {
        opts = args()
      } else {
        opts = args
      }
      return Object.freeze({
        __id: genId(),
        type: 'HotSwap',
        mount: opts!.mount,
        unmount: opts!.unmount,
      })
    },
    registerPlugin(plugin: DomainPlugin<AGG>) {
      if (plugin.type === 'Setup') {
        if (setupPlugins[plugin.__id]) {
          throw new Error('Plugin already registered')
        }
        setupPlugins[plugin.__id] = plugin
        for (const k in aggRecords) {
          plugin.mount({
            api: aggRecords[k].api,
            __aggId: aggRecords[k].__id,
            isInitialized: aggRecords[k].isInitialized,
          })
        }
      } else if (plugin.type === 'HotSwap') {
        hotSwapPlugins[plugin.__id] = plugin
        for (const k in aggRecords) {
          if (
            hotSwapPluginsCheck.has(aggRecords[k]) &&
            !hotSwapPluginsCheck.get(aggRecords[k])!.includes(plugin.__id)
          ) {
            plugin.mount({ api: aggRecords[k].api, __aggId: aggRecords[k].__id })
            hotSwapPluginsCheck.get(aggRecords[k])!.push(plugin.__id)
          }
        }
      } else {
        isNever(plugin)
      }
    },
    unregisterPlugin(plugin: DomainPlugin<AGG>) {
      if (plugin.type === 'Setup') {
        throw new Error('Can not unregister setup plugin')
      } else if (plugin.type === 'HotSwap') {
        for (const k in aggRecords) {
          if (hotSwapPluginsCheck.has(aggRecords[k]) && hotSwapPluginsCheck.get(aggRecords[k])!.includes(plugin.__id)) {
            plugin.unmount({ api: aggRecords[k].api, __aggId: aggRecords[k].__id })
          }
        }
        delete hotSwapPlugins[plugin.__id]
      } else {
        isNever(plugin)
      }
    },
  })
}

export function createPluginHelperByAggCreator<FUN extends (...args: any[]) => DomainAgg>(_: FUN) {
  return createPluginHelper<ReturnType<FUN>>()
}

export function createPluginHelperByAgg<AGG extends DomainAgg>(_: AGG) {
  return createPluginHelper<AGG>()
}
