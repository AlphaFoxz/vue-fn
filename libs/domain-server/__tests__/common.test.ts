import { expect, it } from 'vitest'
import { genId } from '../common'

it('genId', () => {
  const id = genId()
  expect(typeof id === 'string')
  expect(/[a-zA-Z]+/g.test(id))
})
