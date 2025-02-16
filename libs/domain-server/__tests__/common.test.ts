import { expect, it } from 'vitest'
import { createPromiseCallback, genId } from '../common'

it('createPromiseCallback 成功', async () => {
  const { promise, resolved, callback, error } = createPromiseCallback(() => {})
  callback()
  await promise
  expect(resolved.value).toBe(true)
  expect(error.value).toBe(undefined)
})

it('createPromiseCallback 失败', async () => {
  const { promise, resolved, callback, error } = createPromiseCallback(() => {
    if (Math.random() >= 0) {
      return new Error('error')
    }
  })
  try {
    callback()
  } catch (e) {
    e
  }
  await promise
  expect(resolved.value).toBe(false)
  expect(error.value).instanceOf(Error)
})

it('genId', () => {
  const id = genId()
  expect(typeof id === 'string')
  expect(/[a-zA-Z]+/g.test(id))
})
