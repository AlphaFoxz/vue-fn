import type { DomainSingletonAgg, DomainMultiInstanceAgg } from './agg'

type DomainPluginType = 'Setup' | 'HotSwap'

type DomainAgg = DomainSingletonAgg<any, any, any> | DomainMultiInstanceAgg<any, any, any, any> | undefined

export type DomainPlugin<T extends DomainAgg> = DomainSetupPlugin<T> | DomainHotSwapPlugin<T>

export type DomainSetupPlugin<T extends DomainAgg> = {
  type: Extract<DomainPluginType, 'Setup'>
  register: (agg: T) => void
}

type DomainSetupPluginOptions<T extends DomainAgg> = ReturnType<DomainSetupPluginOptionsFn<T>>

type DomainSetupPluginOptionsFn<T extends DomainAgg> = () => {
  register: (agg: T) => void
}

export type DomainHotSwapPlugin<T extends DomainAgg> = {
  type: Extract<DomainPluginType, 'HotSwap'>
  register: (agg: T) => void
  unregister: (api: T) => void
}

type DomainHotSwapPluginOptions<T extends DomainAgg> = ReturnType<DomainHotSwapPluginOptionsFn<T>>

type DomainHotSwapPluginOptionsFn<T extends DomainAgg> = () => {
  register: (agg: T) => void
  unregister: (api: T) => void
}

function createPluginHelper<T extends DomainAgg>() {
  return Object.freeze({
    defineSetupPlugin(init: DomainSetupPluginOptions<T> | DomainSetupPluginOptionsFn<T>): DomainSetupPlugin<T> {
      let opts: undefined | DomainSetupPluginOptions<T> = undefined
      if (init instanceof Function) {
        opts = init()
      } else {
        opts = init
      }
      return Object.freeze({
        type: 'Setup',
        register: opts!.register,
      })
    },
    defineHotSwapPlugin(init: DomainHotSwapPluginOptions<T> | DomainHotSwapPluginOptionsFn<T>): DomainHotSwapPlugin<T> {
      let opts: undefined | DomainHotSwapPluginOptions<T> = undefined
      if (init instanceof Function) {
        opts = init()
      }
      return Object.freeze({
        type: 'HotSwap',
        register: opts!.register,
        unregister: opts!.unregister,
      })
    },
  })
}

export function createPluginHelperByCreator<FUN extends (...args: any[]) => T, T extends DomainAgg>(_: FUN) {
  return createPluginHelper<T>()
}

export function createPluginHelperByAgg<T extends DomainAgg>(_: T) {
  return createPluginHelper<T>()
}
