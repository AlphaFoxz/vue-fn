import { expect, it } from '@jest/globals'
import { createAgg, createChannelEvent, createUnmountableAgg } from '..'
import { ref } from 'vue'

it('event + agg 触发事件', async () => {
  const agg = createUnmountableAgg(1, () => {
    const version = ref(0)
    const name = ref('unknown')
    const saveEvent = createChannelEvent({ name }, () => {
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
          saveEvent.trigger({ name: name.value })
        },
      },
      events: {
        save: saveEvent,
      },
    }
  })

  const saved = ref(false)
  agg.api.events.save.watch(({ data, resolve }) => {
    saved.value = true
    expect(data.name).toBe('bob')
    resolve()
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
  agg.api.events.destroyed.watch(() => {
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
    const loadedEvent = createChannelEvent({ name, age })
    loadedEvent.watch(({ data }) => {
      watchName.value = data.name
    })
    return {
      states: {
        watchName,
      },
      actions: {
        load(n: string) {
          name.value = n
          loadedEvent.trigger({ name: name.value, age })
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
    const saveEvent = createChannelEvent({ name, age }, () => {
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
          saveEvent.trigger({ name: name.value, age: age.value })
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
  agg.api.events.save.watch(async ({ data }) => {
    saved.value = true
    expect(data.name).toBe('bob')
    agg.api.actions.setAge(18)
    await new Promise((resolve) => setTimeout(resolve, 0))
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
    const initStatedEvent = createChannelEvent({}, (data: UserInfo) => {
      user.value = data
      isReady.value = true
      return true
    })
    async function untilReady() {
      if (isReady.value) {
        return
      }
      await initStatedEvent.trigger({})
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
  agg.api.events.initStated.watch(({ resolve }) => {
    listenCounter.value++
    resolve({ name: 'eric', age: 18 })
  })
  agg.api.events.initStated.watch(({ resolve }) => {
    listenCounter.value++
    resolve({ name: 'eric', age: 18 })
  })
  await agg.api.actions.init()
  expect(agg.api.states.user.value?.name).toEqual('eric')
  expect(agg.api.states.user.value?.age).toEqual(18)
  expect(listenCounter.value).toBe(1)
})
