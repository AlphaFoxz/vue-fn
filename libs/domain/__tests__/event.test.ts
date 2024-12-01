import { it, expect } from 'vitest'
import { createBroadcastEvent, createRequestEvent } from '../event'
import { ref } from 'vue'

it('createRequestEvent 触发事件', async () => {
  function register() {
    const name = ref('wong')
    const event = createRequestEvent({ name }, () => {})
    return event
  }
  const event = register()
  const repo = { name: '', version: '0' }
  event.api.watchPublishRequest(({ data, version, reply }) => {
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

it('createRequestEvent 函数的回调', async () => {
  let succeed = false
  function register() {
    const name = ref('wong')
    const event = createRequestEvent({ name }, () => {
      succeed = true
    })
    return event
  }
  const event = register()
  event.api.watchPublishRequest(({ data, reply }) => {
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

it('createRequestEvent 错误后停止Promise', async () => {
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
      true,
      5
    )
    return event
  }
  const watchedEventsCounter = ref(0)
  const initEvent = createInitEvent()
  initEvent.api.watchPublishRequest(({ reply }) => {
    watchedEventsCounter.value++
    reply('wong')
  })
  initEvent.api.watchPublishRequest(({ reply }) => {
    watchedEventsCounter.value++
    reply('Andy')
  })
  await initEvent.publishRequest({ name: 'Andy' }).catch((_) => {})
  expect(succeed).toBe(false)
  expect(listenerCounter.value).toBe(1)
  expect(watchedEventsCounter.value).toBe(1)
})

it('createRequestEvent 错误后不停止Promise', async () => {
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
  initEvent.api.watchPublishRequest(({ reply }) => {
    watchedCounter.value++
    reply('wong')
  })
  initEvent.api.watchPublishRequest(({ reply }) => {
    watchedCounter.value++
    reply('Andy')
  })
  await initEvent.publishRequest({ name: 'Andy' })
  expect(succeed).toBe(true)
  expect(listenerCounter.value).toBe(2)
  expect(watchedCounter.value).toBe(2)
})

it('createRequestEvent 超时', async () => {
  let replyed = false
  const event = createRequestEvent(
    {},
    () => {
      replyed = true
    },
    true,
    1
  )
  let throwed = false
  await event.publishRequest({}).catch((e: Error) => {
    expect(e).toBeInstanceOf(Error)
    throwed = true
  })
  expect(replyed).toBe(false)
  expect(throwed).toBe(true)
  event.api.watchPublishRequest(({ reply }) => reply())
  await event.publishRequest({})
  expect(replyed).toBe(true)
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
  initEvent.api.watchPublish(({ data }) => {
    ++listenCounter.value
    listenedName.value = data.name
  })
  initEvent.api.watchPublish(({ data }) => {
    ++listenCounter.value
    listenedName.value = data.name
  })

  await initEvent.publish({ name: 'Andy' })
  await initEvent.publish({ name: 'Bob' })
  expect(listenCounter.value).toBe(4)
  expect(listenedName.value).toEqual('Bob')
})
