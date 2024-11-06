import { it, expect } from '@jest/globals'
import { createEvent } from '../events'
import { ref } from '@vue/reactivity'

it('createEvent', async () => {
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
