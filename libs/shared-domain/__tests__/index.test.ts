import { expect, it } from '@jest/globals'
import { createSharedSingletonAgg } from '..'

it('', async () => {
  const agg1 = createSharedSingletonAgg('test', (context) => {
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

  agg1.api.actions.setName('Andy')
  await new Promise((resolve) => setTimeout(resolve, 5))
  expect((agg2.api.states.name as any).value).toBe('Andy')
})
