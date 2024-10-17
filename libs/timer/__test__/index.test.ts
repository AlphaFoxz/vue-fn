import { describe, expect, it } from '@jest/globals'
import { createTimeout } from '..'

describe('test funUtil', () => {
  it('test createTimeout1', async () => {
    const { promise } = createTimeout(5, new Error('timeout!'))
    await expect(promise).rejects.toThrow('timeout!')
  })
  it('test createTimeout2', async () => {
    const { resolve, promise } = createTimeout(3)
    resolve.value()
    await promise
  })
  it('test createTimeout3', async () => {
    const { resolve, promise } = createTimeout(3)
    setTimeout(() => {
      resolve.value()
    }, 1)
    await promise
  })
  it('test createTimeout4', async () => {
    const { resolve, reset, promise } = createTimeout(3)
    setTimeout(() => {
      resolve.value()
    }, 1)
    await promise
  })
  it('test createTimeout4', async () => {
    const { resolve, reset, promise } = createTimeout(3)
    setTimeout(() => {
      reset(5)
    }, 1)
    setTimeout(() => {
      resolve.value()
    }, 5)
    await promise
  })
})
