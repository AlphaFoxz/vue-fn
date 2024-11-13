import { it, expect } from '@jest/globals'
import { createBroadcastEvent, createRequestEvent } from '../event'
import { ref, reactive } from '@vue/reactivity'

it('createChannelEvent 触发事件', async () => {
  function register() {
    const name = ref('wong')
    const event = createRequestEvent({ name }, () => {})
    return event
  }
  const event = register()
  const repo = { name: '', version: '0' }
  event.toApi().watchPublishRequest(({ data, version, reply }) => {
    repo.name = data.name
    repo.version = version
    reply()
  })
  await event.publishRequest({ name: 'wong' })
  expect(repo.name).toBe('wong')
  expect(repo.version).toBe('1')
  await event.publishRequest({ name: 'wong' })
  expect(repo.version).toBe('2')
})

it('createChannelEvent 函数的回调', async () => {
  let succeed = false
  function register() {
    const name = ref('wong')
    const event = createRequestEvent({ name }, () => {
      succeed = true
    })
    return event
  }
  const event = register()
  event.toApi().watchPublishRequest(({ data, reply }) => {
    if (data.name === 'Andy') {
      succeed = true
      reply()
    } else {
      throw new Error('error')
    }
  })
  event.publishRequest({ name: 'Andy' })
  await new Promise((resolve) => setTimeout(resolve))
  expect(succeed).toBeTruthy()
})

it('createChannelEvent Promise的回调', async () => {
  const listenerCounter = reactive<string[]>([])
  let succeed = false
  function createInitEvent() {
    const name = ref('wong')
    const event = createRequestEvent({ name }, (b: boolean) => {
      listenerCounter.push('')
      succeed = b
      const start = Date.now()
      while (Date.now() - start < 10) {
        // 运行10ms
      }
    })
    return event
  }
  const watchedEventsCounter = reactive<string[]>([])
  const initEvent = createInitEvent()
  initEvent.toApi().watchPublishRequest(({ data, reply }) => {
    watchedEventsCounter.push('')
    if (data.name === 'Andy') {
      succeed = true
    }
    reply(true)
  })
  initEvent.toApi().watchPublishRequest(({ data, reply }) => {
    watchedEventsCounter.push('')
    if (data.name === 'Andy') {
      succeed = true
    }
    reply(true)
  })
  await initEvent.publishRequest({ name: 'Andy' })
  expect(succeed).toBe(true)
  expect(listenerCounter.length).toBe(1)
  expect(watchedEventsCounter.length).toBe(1)
})

it('createBroadcastEvent Promise的回调', async () => {
  const listenCounter = ref(0)
  const listenedName = ref('')
  function createInitEvent() {
    const name = ref('bob')
    const event = createBroadcastEvent({ name })
    return event
  }
  const initEvent = createInitEvent()
  initEvent.toApi().watchPublish(({ data }) => {
    // console.error(data.name, ++listenCounter.value)
    ++listenCounter.value
    listenedName.value = data.name
  })
  initEvent.toApi().watchPublish(({ data }) => {
    // console.error(data.name, ++listenCounter.value)
    ++listenCounter.value
    listenedName.value = data.name
  })

  await initEvent.publish({ name: 'Andy' })
  await initEvent.publish({ name: 'Bob' })
  expect(listenCounter.value).toBe(4)
  expect(listenedName.value).toEqual('Bob')
})
