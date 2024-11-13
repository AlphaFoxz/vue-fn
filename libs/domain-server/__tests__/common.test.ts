import { expect, it } from '@jest/globals'
import { Utils } from '..'

it('createPromiseCallback 成功', async () => {
  const { promise, resolved, callback, error } = Utils.createPromiseCallback(() => {})
  callback()
  const result = await promise
  expect(resolved.value).toBe(true)
  expect(error.value).toBe(undefined)
  expect(result.success).toBe(true)
})
