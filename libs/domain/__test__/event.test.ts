import { it, expect } from '@jest/globals'
import { createBroadcastEvent, createChannelEvent } from '../events'
import { ref } from '@vue/reactivity'

it('createChannelEvent 触发事件', async () => {
  function register() {
    const name = ref('wong')
    const event = createChannelEvent({ name })
    return event
  }
  const event = register()
  const repo = { name: '', version: 0 }
  event.watch(({ data, version }) => {
    repo.name = data.name
    repo.version = version
  })
  event.trigger({ name: event.data.name })
  await new Promise((resolve) => setTimeout(resolve, 0))
  expect(repo.name).toBe('wong')
  expect(repo.version).toBe(1)
  event.trigger({ name: event.data.name })
  await new Promise((resolve) => setTimeout(resolve, 0))
  expect(repo.version).toBe(2)
})

it('createChannelEvent 普通函数的回调', () => {
  let succeed = false
  function register() {
    const name = ref('wong')
    const event = createChannelEvent({ name }, () => {
      succeed = true
      return true
    })
    return event
  }
  const event = register()
  event.watch(({ data }) => {
    if (data.name === 'Andy') {
      succeed = true
    }
  })
  event.trigger({ name: 'Andy' })
  expect(succeed).toBeTruthy()
})

it('createChannelEvent Promise的回调', async () => {
  let succeed = false
  function createInitEvent() {
    const name = ref('wong')
    const event = createChannelEvent({ name }, (b: boolean) => {
      succeed = b
      const start = Date.now()
      while (Date.now() - start < 10) {
        // 运行10ms
      }
      return true
    })
    return event
  }
  const watchedEventsCounter = ref(0)
  const initEvent = createInitEvent()
  initEvent.watch(({ data, resolve }) => {
    watchedEventsCounter.value++
    if (data.name === 'Andy') {
      succeed = true
    }
    resolve(true)
  })
  initEvent.watch(({ data, resolve }) => {
    watchedEventsCounter.value++
    if (data.name === 'Andy') {
      succeed = true
    }
    resolve(true)
  })
  await initEvent.trigger({ name: 'Andy' })
  expect(succeed).toBeTruthy()
  expect(watchedEventsCounter.value).toBe(1)
})

it('createBroadcastEvent Promise的回调', async () => {
  const listenerCounter = ref(0)
  function createInitEvent() {
    const name = ref('bob')
    const event = createBroadcastEvent({ name }, () => {
      listenerCounter.value++
    })
    return event
  }
  const initEvent = createInitEvent()
  initEvent.watch(({ resolve }) => {
    resolve()
  })
  initEvent.watch(({ resolve }) => {
    resolve()
  })
  initEvent.trigger({ name: 'Andy' })
  initEvent.trigger({ name: 'Bob' })
  await new Promise((resolve) => setTimeout(resolve, 0))
  expect(listenerCounter.value).toBe(4)
})
