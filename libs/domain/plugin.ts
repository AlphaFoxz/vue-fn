import { ComputedRef } from 'vue'
import type { DomainSingletonAgg, DomainMultiInstanceAgg } from './agg'
import { genId } from './common'

type DomainPluginType = 'Setup' | 'HotSwap'

type DomainAgg = DomainSingletonAgg<any, any, any> | DomainMultiInstanceAgg<any, any, any, any>

export type DomainPlugin<T extends DomainAgg> = DomainSetupPlugin<T> | DomainHotSwapPlugin<T>

export type DomainSetupPlugin<AGG extends DomainAgg> = {
  readonly _code: string
  readonly type: Extract<DomainPluginType, 'Setup'>
  readonly mount: (util: { api: NonNullable<AGG>['api']; aggHash: string; isInitialized: ComputedRef<boolean> }) => void
}

type DomainSetupPluginOptions<AGG extends DomainAgg> = ReturnType<DomainSetupPluginOptionsFn<AGG>>

type DomainSetupPluginOptionsFn<AGG extends DomainAgg> = () => {
  readonly mount: (util: { api: NonNullable<AGG>['api']; aggHash: string }) => void
}

export type DomainHotSwapPlugin<AGG extends DomainAgg> = {
  readonly _code: string
  readonly type: Extract<DomainPluginType, 'HotSwap'>
  readonly mount: (util: { api: NonNullable<AGG>['api']; aggHash: string }) => void
  readonly unmount: (util: { api: NonNullable<AGG>['api']; aggHash: string }) => void
}

export type DomainHotSwapPluginOptions<AGG extends DomainAgg> = ReturnType<DomainHotSwapPluginOptionsFn<AGG>>

export type DomainHotSwapPluginOptionsFn<AGG extends DomainAgg> = () => {
  mount: (util: { api: NonNullable<AGG>['api']; aggHash: string }) => void
  unmount: (util: { api: NonNullable<AGG>['api']; aggHash: string }) => void
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
      } else if (aggRecords[agg._code]) {
        throw new Error('Agg already registered')
      } else if (agg.type === 'MultiInstance') {
        agg.api.events.destroyed.watchPublish(() => {
          delete aggRecords[agg._code]
        })
      }
      aggRecords[agg._code] = agg
      const applyedHotSwapPlugins: string[] = []
      for (const p of Object.values(setupPlugins)) {
        p.mount({ api: agg.api, aggHash: agg._code, isInitialized: agg.isInitialized })
      }
      for (const p of Object.values(hotSwapPlugins)) {
        p.mount({ api: agg.api, aggHash: agg._code })
        applyedHotSwapPlugins.push(p._code)
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
        _code: genId(),
        type: 'Setup',
        mount(util: { api: NonNullable<AGG>['api']; aggHash: string; isInitialized: ComputedRef<boolean> }) {
          if (util.isInitialized.value) {
            throw new Error('Can not setup after initialized')
          }
          opts!.mount({ api: util.api, aggHash: util.aggHash })
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
        _code: genId(),
        type: 'HotSwap',
        mount: opts!.mount,
        unmount: opts!.unmount,
      })
    },
    registerPlugin(plugin: DomainPlugin<AGG>) {
      if (plugin.type === 'Setup') {
        if (setupPlugins[plugin._code]) {
          throw new Error('Plugin already registered')
        }
        setupPlugins[plugin._code] = plugin
        for (const k in aggRecords) {
          plugin.mount({
            api: aggRecords[k].api,
            aggHash: aggRecords[k]._code,
            isInitialized: aggRecords[k].isInitialized,
          })
        }
      } else if (plugin.type === 'HotSwap') {
        hotSwapPlugins[plugin._code] = plugin
        for (const k in aggRecords) {
          if (
            hotSwapPluginsCheck.has(aggRecords[k]) &&
            !hotSwapPluginsCheck.get(aggRecords[k])!.includes(plugin._code)
          ) {
            plugin.mount({ api: aggRecords[k].api, aggHash: aggRecords[k]._code })
            hotSwapPluginsCheck.get(aggRecords[k])!.push(plugin._code)
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
          if (
            hotSwapPluginsCheck.has(aggRecords[k]) &&
            hotSwapPluginsCheck.get(aggRecords[k])!.includes(plugin._code)
          ) {
            plugin.unmount({ api: aggRecords[k].api, aggHash: aggRecords[k]._code })
          }
        }
        delete hotSwapPlugins[plugin._code]
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
