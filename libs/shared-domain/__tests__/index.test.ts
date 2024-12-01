import { expect, it } from 'vitest'
import { createSharedSingletonAgg } from '..'

it('', async () => {
  const agg1 = createSharedSingletonAgg('test', (context) => {
    const sharedRefs = context.sharedRefs({ name: 'Init' })
    return {
      states: { name: sharedRefs.name },
      commands: {
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
      commands: {
        setName(n: string) {
          sharedRefs.name.value = n
        },
      },
    }
  })
  await new Promise((resolve) => setTimeout(resolve, 50))
  expect(agg2.api.states.name.value).toBe('Init')
  agg1.api.commands.setName('Andy')
  await new Promise((resolve) => setTimeout(resolve, 10))
  expect((agg2.api.states.name as any).value).toBe('Andy')
  agg1.api.commands.setName('Bob')
  await new Promise((resolve) => setTimeout(resolve, 10))
  expect((agg2.api.states.name as any).value).toBe('Bob')
})
