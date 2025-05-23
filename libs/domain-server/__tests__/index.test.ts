import { expect, it } from 'vitest'
import { createSingletonAgg, createBroadcastEvent, createRequestEvent, createMultiInstanceAgg } from '..'
import { ref } from '@vue/reactivity'

it('event + agg 类型推断', async () => {
  const agg1 = createSingletonAgg(() => {
    const requestEvent = createRequestEvent({}, () => {})
    const broadcastEvent = createBroadcastEvent(() => {})
    return {
      events: {
        requestEvent,
        broadcastEvent,
      },
    }
  })
  agg1.api.events.requestEvent.watchPublishRequest
  agg1.api.events.broadcastEvent.watchPublish

  const agg2 = createMultiInstanceAgg(1, () => {
    const requestEvent = createRequestEvent({}, () => {})
    const broadcastEvent = createBroadcastEvent(() => {})
    return {
      events: {
        requestEvent,
        broadcastEvent,
      },
    }
  })
  agg2.api.events.requestEvent.watchPublishRequest
  agg2.api.events.broadcastEvent.watchPublish
})

it('event + agg 触发事件', async () => {
  const agg = createMultiInstanceAgg(1, () => {
    const version = ref(0)
    const name = ref('unknown')
    const saveEvent = createRequestEvent({ name }, () => {
      version.value++
    })
    return {
      states: {
        version,
      },
      commands: {
        setName(n: string) {
          name.value = n
          saveEvent.publishRequest({ name: name.value })
        },
      },
      events: {
        save: saveEvent,
      },
    }
  })

  const saved = ref(false)
  agg.api.events.save.watchPublishRequest(({ data, reply }) => {
    saved.value = true
    expect(data.name).toBe('bob')
    reply()
  })
  agg.api.commands.setName('bob')
  await new Promise((resolve) => setTimeout(resolve, 0))
  expect(saved.value).toBe(true)
  expect(agg.api.states.version.value).toBe(1)
})

it('createUnmountableAgg 测试自带的销毁事件', async () => {
  const agg = createMultiInstanceAgg(1, () => {
    return {
      states: {},
      commands: {},
      events: {},
    }
  })
  await new Promise((resolve) => setTimeout(resolve, 0))
  const isDestroyed = ref(false)
  agg.api.events.destroyed.watchPublish(() => {
    isDestroyed.value = true
  })
  agg.api.destroy()
  await new Promise((resolve) => setTimeout(resolve, 0))
  expect(isDestroyed.value).toBe(true)
  await new Promise((resolve) => setTimeout(resolve, 0))
})

it('createUnmountableAgg 测试销毁时应清除内部event.watch副作用', async () => {
  const agg = createMultiInstanceAgg(1, () => {
    const name = ref('')
    let age = 0
    const watchName = ref(name.value)
    const loadedEvent = createBroadcastEvent({ name, age })
    loadedEvent.api.watchPublish(({ data }) => {
      watchName.value = data.name
    })
    return {
      states: {
        watchName,
      },
      commands: {
        load(n: string) {
          name.value = n
          loadedEvent.publish({ name: name.value, age })
        },
      },
      events: {
        loaded: loadedEvent,
      },
    }
  })
  agg.api.commands.load('bob')
  await new Promise((resolve) => setTimeout(resolve, 0))
  expect(agg.api.states.watchName.value).toBe('bob')
  agg.api.destroy()
  await new Promise((resolve) => setTimeout(resolve, 0))
  agg.api.commands.load('wong')
  await new Promise((resolve) => setTimeout(resolve, 0))
  expect(agg.api.states.watchName.value).toBe('bob')
})

it('event中的data应该脱离响应式', async () => {
  const agg = createSingletonAgg(() => {
    const version = ref(0)
    const name = ref('unknown')
    const age = ref(0)
    const saveEvent = createRequestEvent({ name, age }, () => {
      version.value++
    })
    return {
      states: {
        version,
        age,
      },
      commands: {
        setName(n: string) {
          name.value = n
          saveEvent.publishRequest({ name: name.value, age: age.value })
        },
        setAge(n: number) {
          age.value = n
        },
      },
      events: {
        save: saveEvent,
      },
    }
  })

  const saved = ref(false)
  agg.api.events.save.watchPublishRequest(({ data }) => {
    saved.value = true
    expect(data.name).toBe('bob')
    agg.api.commands.setAge(18)
    expect(data.age).toBe(0)
  })
  agg.api.commands.setName('bob')
  await new Promise((resolve) => setTimeout(resolve, 0))
  expect(saved.value).toBe(true)
})

it('聚合等待初始化', async () => {
  const agg = createSingletonAgg(() => {
    const isReady = ref(false)
    type UserInfo = { name: string; age: number }
    let user = ref<UserInfo>()
    const initStatedEvent = createRequestEvent({}, (data: UserInfo) => {
      user.value = data
      isReady.value = true
    })
    async function untilReady() {
      if (isReady.value) {
        return
      }
      await initStatedEvent.publishRequest({})
      if (!isReady.value) {
        throw Error()
      }
    }
    return {
      states: {
        user,
      },
      commands: {
        async init() {
          await untilReady()
        },
        async getUser() {
          await untilReady()
          return user.value
        },
      },
      events: {
        initStated: initStatedEvent,
      },
    }
  })

  const listenCounter = ref(0)
  agg.api.events.initStated.watchPublishRequest(({ reply }) => {
    listenCounter.value++
    reply({ name: 'eric', age: 18 })
  })
  agg.api.events.initStated.watchPublishRequest(({ reply }) => {
    listenCounter.value++
    reply({ name: 'eric', age: 18 })
  })
  await agg.api.commands.init()
  expect(agg.api.states.user.value?.name).toEqual('eric')
  expect(agg.api.states.user.value?.age).toEqual(18)
  expect(listenCounter.value).toBe(1)
})

it('聚合onCreated创建', async () => {
  const agg = createSingletonAgg((context) => {
    const startInitEvent = createRequestEvent({}, () => {})
    context.onBeforeInitialize(async () => {
      await startInitEvent.publishRequest({})
    })
    return {
      states: {
        initialized: context.isInitialized,
      },
      events: {
        startInit: startInitEvent,
      },
      commands: {
        untilInitialized: async () => {
          await context.untilInitialized
        },
      },
    }
  })

  Promise.resolve().then(() =>
    setTimeout(() => {
      agg.api.events.startInit.watchPublishRequest(({ reply }) => {
        reply()
      })
    })
  )

  await agg.api.commands.untilInitialized()
  expect(agg.api.states.initialized.value).toBe(true)
})
