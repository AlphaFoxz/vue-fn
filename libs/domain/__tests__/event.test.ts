import { it, expect } from '@jest/globals'
import { createBroadcastEvent, createRequestEvent } from '../event'
import { ref } from 'vue'

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

it('createChannelEvent 错误后停止Promise', async () => {
  const listenerCounter = ref(0)
  let succeed = false
  function createInitEvent() {
    const event = createRequestEvent(
      {},
      (name: string) => {
        listenerCounter.value++
        if (name !== 'Andy') {
          return new Error('incorrect name')
        }
        succeed = true
      },
      true
    )
    return event
  }
  const watchedEventsCounter = ref(0)
  const initEvent = createInitEvent()
  initEvent.toApi().watchPublishRequest(({ reply }) => {
    watchedEventsCounter.value++
    reply('wong')
  })
  initEvent.toApi().watchPublishRequest(({ reply }) => {
    watchedEventsCounter.value++
    reply('Andy')
  })
  await initEvent.publishRequest({ name: 'Andy' })
  expect(succeed).toBe(false)
  expect(listenerCounter.value).toBe(1)
  expect(watchedEventsCounter.value).toBe(1)
})

it('createChannelEvent 错误后不停止Promise', async () => {
  const listenerCounter = ref(0)
  const watchedCounter = ref(0)
  let succeed = false
  function createInitEvent() {
    const event = createRequestEvent(
      {},
      (name: string) => {
        listenerCounter.value++
        if (name !== 'Andy') {
          return new Error('incorrect name')
        }
        succeed = true
      },
      false
    )
    return event
  }
  const initEvent = createInitEvent()
  initEvent.toApi().watchPublishRequest(({ reply }) => {
    watchedCounter.value++
    reply('wong')
  })
  initEvent.toApi().watchPublishRequest(({ reply }) => {
    watchedCounter.value++
    reply('Andy')
  })
  await initEvent.publishRequest({ name: 'Andy' })
  expect(succeed).toBe(true)
  expect(listenerCounter.value).toBe(2)
  expect(watchedCounter.value).toBe(2)
})

it('createBroadcastEvent 广播', async () => {
  const listenCounter = ref(0)
  const listenedName = ref('')
  function createInitEvent() {
    const name = ref('bob')
    const event = createBroadcastEvent({ name })
    return event
  }
  const initEvent = createInitEvent()
  initEvent.toApi().watchPublish(({ data }) => {
    ++listenCounter.value
    listenedName.value = data.name
  })
  initEvent.toApi().watchPublish(({ data }) => {
    ++listenCounter.value
    listenedName.value = data.name
  })

  await initEvent.publish({ name: 'Andy' })
  await initEvent.publish({ name: 'Bob' })
  expect(listenCounter.value).toBe(4)
  expect(listenedName.value).toEqual('Bob')
})
