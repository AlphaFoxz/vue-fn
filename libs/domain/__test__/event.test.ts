import { it, expect } from '@jest/globals'
import { createBroadcastEvent, createChannelEvent } from '../events'
import { ref, reactive } from '@vue/reactivity'

it('createChannelEvent 触发事件', async () => {
  function register() {
    const name = ref('wong')
    const event = createChannelEvent({ name }, () => true)
    return event
  }
  const event = register()
  const repo = { name: '', version: '0' }
  event.watch(({ data, version, resolve }) => {
    repo.name = data.name
    repo.version = version
    resolve()
  })
  await event.trigger({ name: 'wong' })
  expect(repo.name).toBe('wong')
  expect(repo.version).toBe('1')
  await event.trigger({ name: 'wong' })
  expect(repo.version).toBe('2')
})

it('createChannelEvent 函数的回调', () => {
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
  event.watch(({ data, resolve, reject }) => {
    if (data.name === 'Andy') {
      succeed = true
      resolve()
    } else {
      reject(new Error('error'))
    }
  })
  event.trigger({ name: 'Andy' })
  expect(succeed).toBeTruthy()
})

it('createChannelEvent Promise的回调', async () => {
  const listenerCounter = reactive<string[]>([])
  let succeed = false
  function createInitEvent() {
    const name = ref('wong')
    const event = createChannelEvent({ name }, (b: boolean) => {
      listenerCounter.push('')
      succeed = b
      const start = Date.now()
      while (Date.now() - start < 10) {
        // 运行10ms
      }
      return true
    })
    return event
  }
  const watchedEventsCounter = reactive<string[]>([])
  const initEvent = createInitEvent()
  initEvent.watch(({ data, resolve }) => {
    watchedEventsCounter.push('')
    if (data.name === 'Andy') {
      succeed = true
    }
    resolve(true)
  })
  initEvent.watch(({ data, resolve }) => {
    watchedEventsCounter.push('')
    if (data.name === 'Andy') {
      succeed = true
    }
    resolve(true)
  })
  await initEvent.trigger({ name: 'Andy' })
  expect(succeed).toBe(true)
  expect(listenerCounter.length).toBe(1)
  expect(watchedEventsCounter.length).toBe(1)
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
