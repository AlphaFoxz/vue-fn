import { expect, it } from 'vitest'
import { Utils } from '..'

it('createPromiseCallback 成功', async () => {
  const { promise, resolved, callback, error } = Utils.createPromiseCallback(() => {
    const a = true
    if (!a) {
      return new Error('error')
    }
  })
  callback()
  await promise
  expect(resolved.value).toBe(true)
  expect(error.value).toBe(undefined)
})
