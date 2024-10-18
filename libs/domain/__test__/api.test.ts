import { ref, isReadonly, reactive, watch, onWatcherCleanup, computed } from '@vue/reactivity'
import { expect, it } from '@jest/globals'
import { createApi, createSingletonApi } from '..'

it('createSingletonApi 属性只读', () => {
  const a = ref('a')
  const b = reactive({ b1: 'b1', b2: () => {} })
  const c = ref({ c1: ref('c1') })
  const d = computed(() => 'd1')
  const api = createSingletonApi({
    states: {
      a,
      b,
      c,
      d,
    },
    actions: {
      setA(s: string) {
        a.value = s
      },
    },
  })
  expect(isReadonly(api.states)).toBe(true)
  expect(isReadonly(api.states.a)).toBe(true)
  expect(isReadonly(api.states.b)).toBe(true)
  expect(isReadonly(api.states.c.value)).toBe(true)
  expect(api.states.c.value.c1).toBe('c1')
  expect(api.states.d.value).toBe('d1')

  expect(isReadonly(api.actions)).toBe(true)
  expect(api.states.a.value).toBe('a')
  expect(api.states.b.b1).toBe('b1')
  expect(api.states.b.b2).toBeInstanceOf(Function)
})

it('createApi watcher副作用处理', async () => {
  const api = (function () {
    const a = ref('a')
    const aPlus = ref('a+')
    const isWatching = ref(true)
    const { stop } = watch(a, async (n: string) => {
      onWatcherCleanup(() => {
        isWatching.value = false
      })
      if (isWatching.value) {
        if (n.startsWith('a')) {
          aPlus.value = n + '+'
        } else {
          throw new Error('not a**')
        }
      }
    })
    return createApi({
      states: {
        a,
        aPlus,
      },
      actions: {
        setA: (n: string) => {
          a.value = n
        },
      },
      destory() {
        stop()
      },
    })
  })()

  api.actions.setA('a1')
  await new Promise((resolve) => setTimeout(resolve, 1))
  expect(api.states.aPlus.value).toBe('a1+')
  api.destory()
  await new Promise((resolve) => setTimeout(resolve, 1))
  api.actions.setA('b')
  await new Promise((resolve) => setTimeout(resolve, 1))
  expect(api.states.aPlus.value).toBe('a1+')
  await new Promise((resolve) => setTimeout(resolve, 1))
})
