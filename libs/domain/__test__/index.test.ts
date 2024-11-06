import { expect, it } from '@jest/globals'
import { createAgg, createEvent, createUnmountableAgg } from '..'
import { ref } from 'vue'

it('event + agg 触发事件', async () => {
  const agg = createUnmountableAgg(() => {
    const version = ref(0)
    const name = ref('unknown')
    const saveEvent = createEvent({ name }, () => {
      version.value++
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
  agg.events.save.watch(({ data, callback }) => {
    saved.value = true
    expect(data.name).toBe('bob')
    callback()
  })
  agg.api.actions.setName('bob')
  await new Promise((resolve) => setTimeout(resolve, 1))
  expect(saved.value).toBe(true)
  expect(agg.api.states.version.value).toBe(1)
})

it('createUnmountableAgg 测试自带的销毁事件', async () => {
  const agg = createUnmountableAgg(() => {
    return {
      states: {},
      actions: {},
      events: {},
    }
  })
  await new Promise((resolve) => setTimeout(resolve, 1))
  const isDestroyed = ref(false)
  agg.events.destroyed.watch(() => {
    isDestroyed.value = true
  })
  agg.api.destroy()
  await new Promise((resolve) => setTimeout(resolve, 1))
  expect(isDestroyed.value).toBe(true)
  await new Promise((resolve) => setTimeout(resolve, 1))
})

it('createUnmountableAgg 测试销毁时应清除内部event.watch副作用', async () => {
  const agg = createUnmountableAgg(() => {
    const name = ref('')
    let age = 0
    const watchName = ref(name.value)
    const loadedEvent = createEvent({ name, age })
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
  await new Promise((resolve) => setTimeout(resolve, 1))
  expect(agg.api.states.watchName.value).toBe('bob')
  agg.api.destroy()
  await new Promise((resolve) => setTimeout(resolve, 1))
  agg.api.actions.load('wong')
  await new Promise((resolve) => setTimeout(resolve, 1))
  expect(agg.api.states.watchName.value).toBe('bob')
})

it('event中的data应该脱离响应式', async () => {
  const agg = createAgg(() => {
    const version = ref(0)
    const name = ref('unknown')
    const age = ref(0)
    const saveEvent = createEvent({ name, age }, () => {
      version.value++
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
  agg.events.save.watch(async ({ data }) => {
    saved.value = true
    expect(data.name).toBe('bob')
    agg.api.actions.setAge(18)
    await new Promise((resolve) => setTimeout(resolve, 1))
    expect(data.age).toBe(0)
  })
  agg.api.actions.setName('bob')
  await new Promise((resolve) => setTimeout(resolve, 1))
  expect(saved.value).toBe(true)
})
