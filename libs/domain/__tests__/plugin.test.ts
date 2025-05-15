import { expect, it } from 'vitest'
import * as singletonExample from './_singleton-agg'
import * as multiInstanceExample from './_multi-instance-agg'

it('注册单例插件-setupPlugin', async () => {
  const PLUGIN = singletonExample.PluginHelper.createSetupPlugin(() => {
    return {
      mount({ api }) {
        api.events.needLoadData.watchPublishRequest(({ reply }) => {
          reply('Hello')
        })
      },
    }
  })
  singletonExample.PluginHelper.registerPlugin(PLUGIN)
  const agg = singletonExample.useSingletonAgg()
  expect(agg.states.initialized.value).toBe(false)
  await agg.commands.untilInitialized()
  expect(agg.states.initialized.value).toBe(true)
  expect(agg.states.loadData.value).toEqual('Hello')
})

it('注册多实例插件-setupPlugin', async () => {
  const PLUGIN = multiInstanceExample.PluginHelper.createSetupPlugin({
    mount({ api }) {
      api.events.needLoadData.watchPublishRequest(({ reply }) => {
        reply('Hello')
      })
    },
  })
  multiInstanceExample.PluginHelper.registerPlugin(PLUGIN)
  const agg = multiInstanceExample.useMultiInstaceAgg('1')
  expect(agg.states.initialized.value).toBe(false)
  await agg.commands.untilInitialized()
  expect(agg.states.initialized.value).toBe(true)
  expect(agg.states.loadData.value).toEqual('Hello')
})

it('注册单例插件-hotSwapPlugin', async () => {
  let oldVal = ''
  let newVal = ''
  const PLUGIN = singletonExample.PluginHelper.createHotSwapPlugin(() => {
    let handler: Function | undefined = undefined
    return {
      mount({ api }) {
        handler = api.events.onStatusChanged.watchPublish(({ data }) => {
          oldVal = data.old
          newVal = data.new
        })
        api.commands.setStatus('1')
      },
      unmount({ api }) {
        handler?.()
        api.commands.setStatus('0')
      },
    }
  })

  const agg = singletonExample.useSingletonAgg()
  singletonExample.PluginHelper.registerPlugin(PLUGIN)
  await new Promise((resolve) => setTimeout(resolve))
  expect(agg.states.status.value).toEqual('1')
  expect(oldVal).toEqual('0')
  expect(newVal).toEqual('1')
  singletonExample.PluginHelper.unregisterPlugin(PLUGIN)
  await new Promise((resolve) => setTimeout(resolve))
  expect(agg.states.status.value).toEqual('0')
})

it('注册多实例插件-hotSwapPlugin', async () => {
  let oldVal = ''
  let newVal = ''
  const PLUGIN = multiInstanceExample.PluginHelper.createHotSwapPlugin(() => {
    let handler: Function | undefined = undefined
    return {
      mount({ api }) {
        handler = api.events.onStatusChanged.watchPublish(({ data }) => {
          oldVal = data.old
          newVal = data.new
        })
        api.commands.setStatus('1')
      },
      unmount({ api }) {
        handler?.()
        api.commands.setStatus('0')
      },
    }
  })
  const agg = multiInstanceExample.useMultiInstaceAgg('1')
  multiInstanceExample.PluginHelper.registerPlugin(PLUGIN)
  await new Promise((resolve) => setTimeout(resolve))
  expect(agg.states.status.value).toEqual('1')
  expect(oldVal).toEqual('0')
  expect(newVal).toEqual('1')
  multiInstanceExample.PluginHelper.unregisterPlugin(PLUGIN)
  await new Promise((resolve) => setTimeout(resolve))
  expect(agg.states.status.value).toEqual('0')
})

it('注册插件时机过晚', async () => {
  const PLUGIN = singletonExample.PluginHelper.createSetupPlugin({
    mount({ api }) {
      api.events.needLoadData.watchPublishRequest(({ reply }) => {
        reply('Hello')
      })
    },
  })
  singletonExample.useSingletonAgg()
  await new Promise((resolve) => resolve(1))
  let err: Error | undefined = undefined
  try {
    singletonExample.PluginHelper.registerPlugin(PLUGIN)
  } catch (e: any) {
    err = e
  }
  expect(err).toBeInstanceOf(Error)
})

it('注销聚合', async () => {
  let check = false
  const agg = multiInstanceExample.useMultiInstaceAgg('1')
  multiInstanceExample.PluginHelper.onDestroy(() => {
    check = true
  })
  expect(check).toBe(false)
  agg.destroy()
  await new Promise((resolve) => setTimeout(resolve))
  expect(check).toBe(true)
  expect(multiInstanceExample.aggMap).toEqual({})
})
