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

it('createUnmountableAgg 测试自带的销毁功能', async () => {
  const agg = createUnmountableAgg(() => {
    return {
      events: {},
    }
  })
  const destoried = ref(false)
  agg.events.destroyed.watch(() => {
    destoried.value = true
  })
  agg.api.destroy()
  await new Promise((resolve) => setTimeout(resolve, 1))
  expect(destoried.value).toBe(true)
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
