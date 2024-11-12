import { expect, it } from '@jest/globals'
import { createAgg, createBroadcastEvent, createRequestEvent, createUnmountableAgg } from '..'
import { ref } from 'vue'

it('event + agg 触发事件', async () => {
  const agg = createUnmountableAgg(1, () => {
    const version = ref(0)
    const name = ref('unknown')
    const saveEvent = createRequestEvent({ name }, () => {
      version.value++
      return true
    })
    return {
      states: {
        version,
      },
      actions: {
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
  agg.api.actions.setName('bob')
  await new Promise((resolve) => setTimeout(resolve, 0))
  expect(saved.value).toBe(true)
  expect(agg.api.states.version.value).toBe(1)
})

it('createUnmountableAgg 测试自带的销毁事件', async () => {
  const agg = createUnmountableAgg(1, () => {
    return {
      states: {},
      actions: {},
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
  const agg = createUnmountableAgg(1, () => {
    const name = ref('')
    let age = 0
    const watchName = ref(name.value)
    const loadedEvent = createBroadcastEvent({ name, age })
    loadedEvent.toApi().watchPublish(({ data }) => {
      watchName.value = data.name
    })
    return {
      states: {
        watchName,
      },
      actions: {
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
  agg.api.actions.load('bob')
  await new Promise((resolve) => setTimeout(resolve, 0))
  expect(agg.api.states.watchName.value).toBe('bob')
  agg.api.destroy()
  await new Promise((resolve) => setTimeout(resolve, 0))
  agg.api.actions.load('wong')
  await new Promise((resolve) => setTimeout(resolve, 0))
  expect(agg.api.states.watchName.value).toBe('bob')
})

it('event中的data应该脱离响应式', async () => {
  const agg = createAgg(() => {
    const version = ref(0)
    const name = ref('unknown')
    const age = ref(0)
    const saveEvent = createRequestEvent({ name, age }, () => {
      version.value++
      return true
    })
    return {
      states: {
        version,
        age,
      },
      actions: {
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
    agg.api.actions.setAge(18)
    expect(data.age).toBe(0)
  })
  agg.api.actions.setName('bob')
  await new Promise((resolve) => setTimeout(resolve, 0))
  expect(saved.value).toBe(true)
})

it('聚合等待初始化', async () => {
  const agg = createAgg(() => {
    const isReady = ref(false)
    type UserInfo = { name: string; age: number }
    let user = ref<UserInfo>()
    const initStatedEvent = createRequestEvent({}, (data: UserInfo) => {
      user.value = data
      isReady.value = true
      return true
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
      actions: {
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
  await agg.api.actions.init()
  expect(agg.api.states.user.value?.name).toEqual('eric')
  expect(agg.api.states.user.value?.age).toEqual(18)
  expect(listenCounter.value).toBe(1)
})
