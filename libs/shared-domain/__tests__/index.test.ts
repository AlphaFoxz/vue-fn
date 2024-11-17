import { expect, it } from '@jest/globals'
import { createSharedSingletonAgg } from '..'

it('', async () => {
  const agg1 = createSharedSingletonAgg('test', (context) => {
    const sharedRefs = context.sharedRefs({ name: 'Init' })
    return {
      states: { name: sharedRefs.name },
      actions: {
        setName(n: string) {
          sharedRefs.name.value = n
        },
      },
    }
  })

  await new Promise((resolve) => setTimeout(resolve, 30))
  const agg2 = createSharedSingletonAgg('test', (context) => {
    const sharedRefs = context.sharedRefs({ name: '' })
    return {
      states: { name: sharedRefs.name },
      actions: {
        setName(n: string) {
          sharedRefs.name.value = n
        },
      },
    }
  })
  await new Promise((resolve) => setTimeout(resolve, 30))
  expect(agg2.api.states.name.value).toBe('Init')
  agg1.api.actions.setName('Andy')
  await new Promise((resolve) => setTimeout(resolve, 10))
  expect((agg2.api.states.name as any).value).toBe('Andy')
  agg1.api.actions.setName('Bob')
  await new Promise((resolve) => setTimeout(resolve, 10))
  expect((agg2.api.states.name as any).value).toBe('Bob')
})
