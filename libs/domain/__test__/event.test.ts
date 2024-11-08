import { it, expect } from '@jest/globals'
import { createEvent } from '../events'
import { ref } from '@vue/reactivity'

it('createEvent 触发事件', async () => {
  function register() {
    const name = ref('wong')
    const event = createEvent({ name })
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

it('createEvent 普通函数的回调', () => {
  let succeed = false
  function register() {
    const name = ref('wong')
    const event = createEvent({ name }, () => {
      succeed = true
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

it('createEvent Promise的回调', async () => {
  let succeed = false
  function createInitEvent() {
    const name = ref('wong')
    const event = createEvent({ name }, (initialized: boolean) => {
      succeed = initialized
    })
    return event
  }
  const initEvent = createInitEvent()
  initEvent.watch(({ data, resolve }) => {
    if (data.name === 'Andy') {
      succeed = true
    }
    resolve(true)
  })
  await initEvent.trigger({ name: 'Andy' })
  expect(succeed).toBeTruthy()
})
