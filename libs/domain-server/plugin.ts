import { ComputedRef } from '@vue/reactivity'
import type { DomainSingletonAgg, DomainMultiInstanceAgg } from './agg'
import { genUuidv4 } from './common'

type DomainPluginType = 'Setup' | 'HotSwap'

type DomainAgg = DomainSingletonAgg<any, any, any> | DomainMultiInstanceAgg<any, any, any, any>

export type DomainPlugin<T extends DomainAgg> = DomainSetupPlugin<T> | DomainHotSwapPlugin<T>

export type DomainSetupPlugin<AGG extends DomainAgg> = {
  readonly _hash: string
  readonly type: Extract<DomainPluginType, 'Setup'>
  readonly mount: (util: { api: NonNullable<AGG>['api']; isInitialized: ComputedRef<boolean> }) => void
}

type DomainSetupPluginOptions<AGG extends DomainAgg> = ReturnType<DomainSetupPluginOptionsFn<AGG>>

type DomainSetupPluginOptionsFn<AGG extends DomainAgg> = () => {
  readonly mount: (util: { api: NonNullable<AGG>['api'] }) => void
}

export type DomainHotSwapPlugin<AGG extends DomainAgg> = {
  readonly _hash: string
  readonly type: Extract<DomainPluginType, 'HotSwap'>
  readonly mount: (util: { api: NonNullable<AGG>['api'] }) => void
  readonly unmount: (util: { api: NonNullable<AGG>['api'] }) => void
}

export type DomainHotSwapPluginOptions<AGG extends DomainAgg> = ReturnType<DomainHotSwapPluginOptionsFn<AGG>>

export type DomainHotSwapPluginOptionsFn<AGG extends DomainAgg> = () => {
  mount: (util: { api: NonNullable<AGG>['api'] }) => void
  unmount: (util: { api: NonNullable<AGG>['api'] }) => void
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
      } else if (aggRecords[agg._hash]) {
        throw new Error('Agg already registered')
      } else if (agg.type === 'MultiInstance') {
        agg.api.events.destroyed.watchPublish(() => {
          delete aggRecords[agg._hash]
        })
      }
      aggRecords[agg._hash] = agg
      const applyedHotSwapPlugins: string[] = []
      for (const p of Object.values(setupPlugins)) {
        p.mount({ api: agg.api, isInitialized: agg.isInitialized })
      }
      for (const p of Object.values(hotSwapPlugins)) {
        p.mount({ api: agg.api })
        applyedHotSwapPlugins.push(p._hash)
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
        _hash: genUuidv4(),
        type: 'Setup',
        mount(util: { api: NonNullable<AGG>['api']; isInitialized: ComputedRef<boolean> }) {
          if (util.isInitialized.value) {
            throw new Error('Can not setup after initialized')
          }
          opts!.mount({ api: util.api })
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
        _hash: genUuidv4(),
        type: 'HotSwap',
        mount: opts!.mount,
        unmount: opts!.unmount,
      })
    },
    registerPlugin(plugin: DomainPlugin<AGG>) {
      if (plugin.type === 'Setup') {
        if (setupPlugins[plugin._hash]) {
          throw new Error('Plugin already registered')
        }
        setupPlugins[plugin._hash] = plugin
        for (const k in aggRecords) {
          plugin.mount({ api: aggRecords[k].api, isInitialized: aggRecords[k].isInitialized })
        }
      } else if (plugin.type === 'HotSwap') {
        hotSwapPlugins[plugin._hash] = plugin
        for (const k in aggRecords) {
          if (
            hotSwapPluginsCheck.has(aggRecords[k]) &&
            !hotSwapPluginsCheck.get(aggRecords[k])!.includes(plugin._hash)
          ) {
            plugin.mount({ api: aggRecords[k].api })
            hotSwapPluginsCheck.get(aggRecords[k])!.push(plugin._hash)
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
            hotSwapPluginsCheck.get(aggRecords[k])!.includes(plugin._hash)
          ) {
            plugin.unmount({ api: aggRecords[k].api })
          }
        }
        delete hotSwapPlugins[plugin._hash]
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
