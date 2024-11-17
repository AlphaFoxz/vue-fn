import { expect, it } from '@jest/globals'
import { createSharedSingletonAgg } from '..'

it('', async () => {
  const agg1 = createSharedSingletonAgg('test', (context) => {
    const name = context.sharedRef('name', 'Init')
    return {
      states: { name },
      actions: {
        setName(n: string) {
          name.value = n
        },
      },
    }
  })

  await new Promise((resolve) => setTimeout(resolve, 10))
  const agg2 = createSharedSingletonAgg('test', (context) => {
    const name = context.sharedRef('name', '')
    return {
      states: { name },
      actions: {
        setName(n: string) {
          name.value = n
        },
      },
    }
  })
  await new Promise((resolve) => setTimeout(resolve, 10))
  expect(agg2.api.states.name.value).toBe('Init')
  agg1.api.actions.setName('Andy')
  await new Promise((resolve) => setTimeout(resolve, 10))
  expect((agg2.api.states.name as any).value).toBe('Andy')
  agg1.api.actions.setName('Bob')
  await new Promise((resolve) => setTimeout(resolve, 10))
  expect((agg2.api.states.name as any).value).toBe('Bob')
})
