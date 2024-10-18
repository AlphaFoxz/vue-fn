import { expect, it } from '@jest/globals'
import { createSingletonStore, createStore } from '..'
import { isReadonly, ref, watch } from '@vue/reactivity'

it('createSingletonStore', () => {
  const store = createSingletonStore(() => {
    return {
      states: {
        a: ref('a'),
      },
      actions: {
        log() {
          console.log('log')
        },
      },
    }
  })
  expect(isReadonly(store.api.states.a)).toBe(true)
  expect(store.api.actions.log).toBeInstanceOf(Function)
})

it('createStore', () => {
  const store = createStore((context) => {
    const a = ref('a')
    context.defineEffect(watch(a, () => {}))
    return {
      states: {
        a,
      },
      actions: {
        setA(n: string) {
          a.value = n
        },
      },
    }
  })
  expect(isReadonly(store.api.states.a)).toBe(true)
  expect(store.api.actions.setA).toBeInstanceOf(Function)
})
